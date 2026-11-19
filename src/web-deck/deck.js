(function () {
  const params = new URLSearchParams(window.location.search);
  const isExportPdf = params.get("export") === "pdf";
  const isStatic = params.get("static") === "1";

  // Quick-toggle flags for ambient glow & repeating micro-animations (flip any to false to disable)
  const AMBIENT_FX = {
    stageHalos: true,           // Theme-reactive background glow halos across slides
    slide1CorePulse: true,      // Slide 1 core glow breath + ripple ring
    slide1HexChargeCycle: true, // Slide 1 hex lattice gradual charge -> peak -> fast discharge cycle
    slide4PhaseWave: false,     // Slide 4 temperature wave across phase nodes
    slide6StepWave: true,       // Slide 6 A -> B -> C -> D badge pulse wave
    slide7Thermal: true,        // Slide 7 ~725 C eutectic thermal pulse
    slide8Emerald: true,        // Slide 8 HT9 window emerald pulse
    slide10MicroLoops: true,    // Slide 10 slow physics loops inside 4 micro-SVGs
    slide12BridgePulse: true,   // Slide 12 R&D Bridge traveling pulse
    slide14ClosingHalo: true    // Slide 14 subtle symmetric core halo
  };

  // Empty Speaker Notes scaffold (editable locally in drawer via 'N' or via content/speaker-notes.md)
  const DEFAULT_SLIDE_NOTES = {
    1: "", 2: "", 3: "", 4: "", 5: "", 6: "", 7: "",
    8: "", 9: "", 10: "", 11: "", 12: "", 13: "", 14: ""
  };
  const NOTES_STORAGE_KEY = "u10zr_sfr_slide_notes_v1";

  if (isExportPdf) {
    document.documentElement.classList.add("export-pdf");
  }

  const stage = document.getElementById("deck-stage");
  if (stage && !AMBIENT_FX.stageHalos) {
    stage.classList.add("no-stage-halos");
  }
  const slides = Array.from(document.querySelectorAll(".slide"));
  const progressFill = document.getElementById("deck-progress-fill");

  const overviewModal = document.getElementById("deck-overview");
  const overviewGrid = document.getElementById("deck-overview-grid");
  const lightboxModal = document.getElementById("deck-lightbox");
  const lightboxStage = document.getElementById("lightbox-stage");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxClose = document.getElementById("lightbox-close");
  const shortcutsModal = document.getElementById("deck-shortcuts");
  const notesPanel = document.getElementById("deck-notes");
  const notesSlideLbl = document.getElementById("deck-notes-slide-lbl");
  const notesInput = document.getElementById("deck-notes-input");
  const notesClose = document.getElementById("deck-notes-close");
  const toastEl = document.getElementById("deck-toast");
  const laserDot = document.getElementById("deck-laser");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let stepBuildEnabled = !isExportPdf && !isStatic && !prefersReducedMotion;
  let currentSlideIndex = 0;
  let currentSlideSteps = [];
  let currentStepIdx = 0;
  let activeTimeline = null;
  let activeStepTimelines = [];
  let ambientTween = null;

  function clearStepTimelines(snapToComplete) {
    activeStepTimelines.forEach((t) => {
      if (snapToComplete) t.progress(1);
      t.kill();
    });
    activeStepTimelines = [];
  }
  let leavingTween = null;
  let toastTimer = null;
  let isLaserActive = false;

  // Graceful fallback for missing images
  document.querySelectorAll("img[data-fallback]").forEach((img) => {
    const markMissing = () => {
      const container = img.closest(".figure-card__stage, .slide-footer__logo, .cover-backdrop, .cover-logo");
      if (container) container.classList.add("is-missing");
    };
    img.addEventListener("error", markMissing);
    if (img.complete && img.naturalWidth === 0) {
      markMissing();
    }
  });

  function finalizeStaticVisuals() {
    document.querySelectorAll("[data-step].is-step-hidden").forEach((el) => el.classList.remove("is-step-hidden"));
    document.querySelectorAll(".prop-compare-svg .bar-fill").forEach((bar) => {
      if (bar.dataset.targetWidth) {
        bar.setAttribute("width", bar.dataset.targetWidth);
      }
      if (window.gsap) window.gsap.set(bar, { clearProps: "transform" });
    });
    const s08Clip = document.querySelector("#s08-plotRevealClip rect");
    if (s08Clip) s08Clip.setAttribute("width", "485");
    const s10Clip = document.querySelector("#s10-odsClip rect");
    if (s10Clip) s10Clip.setAttribute("width", "380");
    document.querySelectorAll(".s08-callout").forEach((c) => {
      c.style.opacity = "1";
      if (window.gsap) window.gsap.set(c, { clearProps: "opacity,transform" });
    });
    document.querySelectorAll(".slide-header__trace").forEach((tr) => {
      if (window.gsap) window.gsap.set(tr, { scaleX: 1, opacity: 0.25 });
      else {
        tr.style.transform = "scaleX(1)";
        tr.style.opacity = "0.25";
      }
    });
  }

  if (isExportPdf) {
    slides.forEach((s) => s.classList.add("is-active"));
    finalizeStaticVisuals();
    return;
  }

  document.querySelectorAll(".slide-header").forEach((hdr) => {
    if (!hdr.querySelector(".slide-header__trace")) {
      const trace = document.createElement("span");
      trace.className = "slide-header__trace";
      trace.setAttribute("aria-hidden", "true");
      hdr.appendChild(trace);
    }
  });

  function scaleStage() {
    if (!stage) return;
    const scaleX = window.innerWidth / 1280;
    const scaleY = window.innerHeight / 720;
    stage.style.transform = `scale(${Math.min(scaleX, scaleY)})`;
  }

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    toastEl.setAttribute("aria-hidden", "false");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("is-visible");
      toastEl.setAttribute("aria-hidden", "true");
    }, 1500);
  }

  // Element-Role 1: Progressive Numeric Counters
  function formatCounterTarget(el) {
    const target = parseFloat(el.dataset.countTo);
    const prefix = el.dataset.countPrefix || "";
    const suffix = el.dataset.countSuffix || "";
    const decimals = parseInt(el.dataset.countDecimals || "0", 10);
    const useComma = el.dataset.countComma === "true";
    const raw = decimals > 0 ? target.toFixed(decimals) : Math.round(target).toString();
    const formatted = useComma ? Number(raw).toLocaleString("en-US") : raw;
    el.textContent = `${prefix}${formatted}${suffix}`;
  }

  function finalizeAllCounters() {
    document.querySelectorAll("[data-count-to]").forEach(formatCounterTarget);
  }

  function animateCounters(slide) {
    if (!window.gsap) return null;
    const tl = window.gsap.timeline();
    const els = Array.from(slide.querySelectorAll("[data-count-to]"));
    if (!els.length) return tl;

    const proxy = { p: 0 };
    tl.to(
      proxy,
      {
        p: 1,
        duration: 2.2,
        ease: "power3.out",
        onUpdate: () => {
          els.forEach((el) => {
            const target = parseFloat(el.dataset.countTo);
            const prefix = el.dataset.countPrefix || "";
            const suffix = el.dataset.countSuffix || "";
            const decimals = parseInt(el.dataset.countDecimals || "0", 10);
            const useComma = el.dataset.countComma === "true";
            const val = proxy.p * target;
            const raw = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString();
            const formatted = useComma ? Number(raw).toLocaleString("en-US") : raw;
            el.textContent = `${prefix}${formatted}${suffix}`;
          });
        },
        onComplete: () => els.forEach(formatCounterTarget),
      },
      0
    );
    return tl;
  }

  function finalizePrintState() {
    finalizeAllCounters();
    finalizeStaticVisuals();
    closeOverlays();
    toggleNotes(false);
  }

  window.addEventListener("beforeprint", finalizePrintState);

  // Helper: Geometric clip-path reveal for scientific figures & schematics
  function revealFigure(tl, el, fromInset, at) {
    if (!el || !window.gsap) return;
    tl.fromTo(
      el,
      { opacity: 0.4, clipPath: fromInset, scale: 0.985 },
      {
        opacity: 1,
        clipPath: "inset(0% 0% 0% 0%)",
        scale: 1,
        duration: 0.85,
        ease: "power3.inOut",
        onComplete: () => window.gsap.set(el, { clearProps: "clipPath,transform" }),
      },
      at
    );
  }

  // Helper: Single Stripe-style shimmer sweep across a critical highlight card
  function triggerShimmer(tl, el, at) {
    if (!el || !window.gsap) return;
    el.classList.add("shimmer-host");
    let beam = el.querySelector(".shimmer-beam");
    if (!beam) {
      beam = document.createElement("span");
      beam.className = "shimmer-beam";
      beam.setAttribute("aria-hidden", "true");
      el.appendChild(beam);
    }
    tl.fromTo(beam, { xPercent: -130, opacity: 0.9 }, { xPercent: 320, opacity: 0, duration: 1.05, ease: "power2.inOut" }, at);
  }

  // Helper: Slide 8 Live Void Swelling Curve Sweep (0 -> 200 dpa)
  function animateSlide8Swelling(slide, tl, at, instant) {
    const clipRect = slide.querySelector("#s08-plotRevealClip rect");
    const callouts = slide.querySelectorAll(".s08-callout");
    if (!window.gsap) {
      if (clipRect) clipRect.setAttribute("width", "485");
      callouts.forEach((c) => (c.style.opacity = "1"));
      return;
    }
    if (instant) {
      if (clipRect) clipRect.setAttribute("width", "485");
      window.gsap.set(callouts, { opacity: 1, clearProps: "transform" });
      return;
    }
    if (clipRect) {
      tl.fromTo(
        clipRect,
        { attr: { width: 0 } },
        { attr: { width: 485 }, duration: 2.15, ease: "power2.inOut" },
        at
      );
    }
    if (callouts.length) {
      tl.fromTo(
        callouts,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.52, stagger: 0.22, ease: "power2.out", clearProps: "transform" },
        at + 0.85
      );
    }
  }

  // Helper: Slide 10 Physical Mechanism Micro-SVG Animation (used on entrance, Step-Build & hover)
  function playLeverMicroSvg(card, targetTl, baseAt) {
    if (!card || !window.gsap) return;
    const gsap = window.gsap;
    if (!targetTl && card._svgTl) {
      card._svgTl.progress(1).kill();
    }
    const tl = targetTl || (card._svgTl = gsap.timeline());
    const at = typeof baseAt === "number" ? baseAt : 0;

    const barrierSvg = card.querySelector(".lever-svg--barrier");
    if (barrierSvg) {
      const fluxL = barrierSvg.querySelector(".svg-flux-left");
      const fluxR = barrierSvg.querySelector(".svg-flux-right");
      const shield = barrierSvg.querySelector(".svg-barrier-shield");
      const blockedLbl = barrierSvg.querySelector(".svg-blocked-lbl");
      if (shield) tl.fromTo(shield, { scaleY: 0, transformOrigin: "center center" }, { scaleY: 1, duration: 0.46, ease: "power2.out" }, at);
      if (fluxL) tl.fromTo(fluxL, { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.52, ease: "power2.out" }, at + 0.06);
      if (fluxR) tl.fromTo(fluxR, { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.52, ease: "power2.out" }, at + 0.06);
      if (blockedLbl) tl.fromTo(blockedLbl, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.4 }, at + 0.32);
    }

    const dopantsSvg = card.querySelector(".lever-svg--dopants");
    if (dopantsSvg) {
      const traps = dopantsSvg.querySelectorAll(".svg-trap");
      const lnBonds = dopantsSvg.querySelectorAll(".svg-ln-bond");
      if (traps.length) tl.fromTo(traps, { scale: 0.45, transformOrigin: "center center", opacity: 0 }, { scale: 1, opacity: 1, duration: 0.46, stagger: 0.09, ease: "back.out(1.7)" }, at);
      if (lnBonds.length) tl.fromTo(lnBonds, { x: -14, opacity: 0 }, { x: 0, opacity: 1, duration: 0.44, stagger: 0.09, ease: "power2.out" }, at + 0.16);
    }

    const annularSvg = card.querySelector(".lever-svg--annular");
    if (annularSvg) {
      const annRings = annularSvg.querySelectorAll(".svg-ann-ring");
      const annDots = annularSvg.querySelectorAll(".svg-ann-dot");
      const annLines = annularSvg.querySelectorAll(".svg-ann-line");
      const annLbls = annularSvg.querySelectorAll(".svg-ann-lbl");
      if (annRings.length) tl.fromTo(annRings, { scale: 0.45, svgOrigin: "84 46", opacity: 0 }, { scale: 1, opacity: 1, duration: 0.46, stagger: 0.06, ease: "power3.out" }, at);
      if (annDots.length) tl.fromTo(annDots, { scale: 0, opacity: 0, transformOrigin: "center center" }, { scale: 1, opacity: 1, duration: 0.28, stagger: 0.06, ease: "back.out(1.8)" }, at + 0.22);
      annLines.forEach((ln, idx) => {
        const len = Math.ceil(ln.getTotalLength ? ln.getTotalLength() : 70) + 2;
        gsap.set(ln, { strokeDasharray: len, strokeDashoffset: len });
        tl.to(ln, { strokeDashoffset: 0, duration: 0.36, ease: "power2.out", onComplete: () => gsap.set(ln, { clearProps: "strokeDasharray,strokeDashoffset" }) }, at + 0.26 + idx * 0.06);
      });
      if (annLbls.length) tl.fromTo(annLbls, { opacity: 0, x: 6 }, { opacity: 1, x: 0, duration: 0.34, stagger: 0.06, ease: "power2.out", clearProps: "transform" }, at + 0.34);
    }

    const odsSvg = card.querySelector(".lever-svg--ods");
    if (odsSvg) {
      const odsClip = odsSvg.querySelector("#s10-odsClip rect");
      const oxides = odsSvg.querySelectorAll(".svg-oxide");
      const heDots = odsSvg.querySelectorAll(".svg-he");
      if (oxides.length) tl.fromTo(oxides, { scale: 0, transformOrigin: "center center" }, { scale: 1, duration: 0.42, stagger: 0.06, ease: "back.out(2)" }, at);
      if (odsClip) {
        tl.fromTo(odsClip, { attr: { width: 0 } }, { attr: { width: 380 }, duration: 0.72, ease: "power2.out" }, at + 0.1);
      }
      if (heDots.length) tl.fromTo(heDots, { scale: 0, opacity: 0, transformOrigin: "center center" }, { scale: 1, opacity: 1, duration: 0.36, stagger: 0.07, ease: "back.out(2)" }, at + 0.28);
    }
  }

  function startSlide10Ambient(slide) {
    if (!AMBIENT_FX.slide10MicroLoops || !window.gsap) return;
    if (ambientTween) {
      ambientTween.kill();
      ambientTween = null;
    }
    const gsap = window.gsap;
    const fluxL = slide.querySelector(".lever-svg--barrier .svg-flux-left");
    const traps = slide.querySelectorAll(".lever-svg--dopants .svg-trap");
    const oxides = slide.querySelectorAll(".lever-svg--ods .svg-oxide");
    ambientTween = gsap.timeline({ repeat: -1, repeatDelay: 5.5, delay: 1.6 });
    if (fluxL) ambientTween.to(fluxL, { x: 4, duration: 0.5, yoyo: true, repeat: 1, ease: "power1.inOut" }, 0);
    if (traps.length) ambientTween.to(traps, { scale: 1.08, transformOrigin: "center center", duration: 0.55, stagger: 0.12, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.2);
    if (oxides.length) ambientTween.to(oxides, { scale: 1.25, transformOrigin: "center center", duration: 0.5, stagger: 0.1, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.4);
  }

  function startSlide12Ambient(slide) {
    if (!AMBIENT_FX.slide12BridgePulse || !window.gsap) return;
    const pulses = slide.querySelectorAll(".s12-bridge-pulse");
    if (!pulses.length) return;
    if (ambientTween) {
      ambientTween.kill();
      ambientTween = null;
    }
    ambientTween = window.gsap.timeline({ repeat: -1, repeatDelay: 4.5, delay: 1.0 });
    ambientTween
      .fromTo(pulses, { y: 0, opacity: 0 }, { opacity: 1, duration: 0.22 }, 0)
      .to(pulses, { y: 66, duration: 1.35, ease: "power1.inOut" }, 0.08)
      .to(pulses, { opacity: 0, duration: 0.25 }, 1.25);
  }

  function startSlide6Ambient(slide) {
    if (!AMBIENT_FX.slide6StepWave || !window.gsap) return;
    const dots = slide.querySelectorAll(".step-item__dot");
    if (!dots.length) return;
    if (ambientTween) {
      ambientTween.kill();
      ambientTween = null;
    }
    ambientTween = window.gsap.timeline({ repeat: -1, repeatDelay: 5.5, delay: 1.5 });
    dots.forEach((d, i) => {
      ambientTween.to(d, { scale: 1.24, boxShadow: "0 0 12px rgba(224,90,0,0.65)", duration: 0.4, yoyo: true, repeat: 1, ease: "sine.inOut" }, i * 0.32);
    });
  }

  // Footer Step-Dots UI (only shown on Step-Build slides when Step-Build is ON)
  function getSlideStepNumbers(slide) {
    const nums = new Set();
    slide.querySelectorAll("[data-step]").forEach((el) => {
      const n = parseInt(el.dataset.step, 10);
      if (!Number.isNaN(n)) nums.add(n);
    });
    return Array.from(nums).sort((a, b) => a - b);
  }

  function syncFooterStepDots(slide) {
    const rightGroup = slide?.querySelector(".slide-footer__right-group");
    if (!rightGroup) return;
    let dotsWrap = rightGroup.querySelector(".footer-step-dots");
    const total = currentSlideSteps.length;
    if (!stepBuildEnabled || total === 0) {
      if (dotsWrap) dotsWrap.remove();
      return;
    }
    if (!dotsWrap) {
      dotsWrap = document.createElement("span");
      dotsWrap.className = "footer-step-dots";
      dotsWrap.setAttribute("aria-hidden", "true");
      const slideCounter = rightGroup.querySelector(".slide-footer__right");
      rightGroup.insertBefore(dotsWrap, slideCounter || null);
    }
    dotsWrap.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const dot = document.createElement("span");
      dot.className = `footer-step-dot${i < currentStepIdx ? " is-revealed" : ""}`;
      dotsWrap.appendChild(dot);
    }
  }

  function initStepStateForSlide(slide, revealAll) {
    currentSlideSteps = getSlideStepNumbers(slide);
    const hasSteps = currentSlideSteps.length > 0;
    clearStepTimelines(false);
    if (!hasSteps) {
      currentStepIdx = 0;
      syncFooterStepDots(slide);
      return false;
    }
    if (stepBuildEnabled && !revealAll) {
      currentStepIdx = 0;
      slide.querySelectorAll("[data-step]").forEach((el) => el.classList.add("is-step-hidden"));
      syncFooterStepDots(slide);
      return true; // waiting on steps
    } else {
      currentStepIdx = currentSlideSteps.length;
      slide.querySelectorAll("[data-step]").forEach((el) => el.classList.remove("is-step-hidden"));
      syncFooterStepDots(slide);
      return false; // fully revealed
    }
  }

  // Structure-Targeted Motion Grammar + High-Impact Scientific Highlights
  function playSlideEntrance(slide, isWaitingSteps) {
    if (!window.gsap || prefersReducedMotion || isStatic) {
      finalizeStaticVisuals();
      return;
    }

    if (activeTimeline) {
      activeTimeline.kill();
      activeTimeline = null;
    }
    if (ambientTween) {
      ambientTween.kill();
      ambientTween = null;
    }
    window.gsap.killTweensOf(".cover-core-pulse");

    const gsap = window.gsap;
    const tl = gsap.timeline();
    activeTimeline = tl;
    const slideNum = parseInt(slide.dataset.slide || "1", 10);

    // Slide 1 (Cover): Outer-to-Inner Hex Lattice Draw (Ring 2 -> Ring 1 -> Ring 0) + Charge Cycle
    if (slideNum === 1) {
      const outerShapes = slide.querySelectorAll(".cover-hex-grid .hex-ring-2, .cover-hex-grid .hex-ring-1");
      const centerHex = slide.querySelector(".cover-hex-grid .hex-ring-0");
      const centerCircle = slide.querySelector('.cover-hex-grid g circle[stroke="#FBBF24"]');
      const allHexCells = slide.querySelectorAll(".cover-hex-grid .hex-cell");
      const ring0 = slide.querySelector(".cover-hex-grid .hex-ring-0");
      const ring1 = slide.querySelectorAll(".cover-hex-grid .hex-ring-1");
      const ring2 = slide.querySelectorAll(".cover-hex-grid .hex-ring-2");
      const allStrokes = [...outerShapes, centerHex, centerCircle].filter(Boolean);
      if (allHexCells.length) {
        gsap.set(allHexCells, { fillOpacity: 0, clearProps: "stroke,strokeOpacity,strokeWidth" });
      }
      allStrokes.forEach((el) => {
        const len = Math.ceil(el.getTotalLength ? el.getTotalLength() : 200) + 2;
        gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
      });
      const coreNode = slide.querySelector('.cover-hex-grid circle[fill="#E05A00"]');
      const coreGlow = slide.querySelector('.cover-hex-grid circle[fill="url(#coreGlow)"]');
      const corePulse = slide.querySelector(".cover-core-pulse");
      const coverTitle = slide.querySelector(".cover-title");
      tl.to(outerShapes, {
        strokeDashoffset: 0,
        duration: 1.25,
        stagger: 0.08,
        ease: "power2.inOut",
        onComplete: () => gsap.set(outerShapes, { clearProps: "strokeDasharray,strokeDashoffset" }),
      }, 0.05);
      if (centerHex) {
        tl.to(centerHex, {
          strokeDashoffset: 0,
          duration: 0.9,
          ease: "expo.out",
          onComplete: () => gsap.set(centerHex, { clearProps: "strokeDasharray,strokeDashoffset" }),
        }, 0.72);
      }
      if (centerCircle) {
        tl.to(centerCircle, {
          strokeDashoffset: 0,
          duration: 0.8,
          ease: "power2.inOut",
          onComplete: () => gsap.set(centerCircle, { clearProps: "strokeDasharray,strokeDashoffset" }),
        }, 0.92);
      }
      tl.fromTo(slide.querySelector(".cover-badge"), { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.65, ease: "power2.out", clearProps: "transform" }, 0.1)
        .fromTo(
          coverTitle,
          { opacity: 0, y: 24, clipPath: "inset(0% 0% 100% 0%)" },
          {
            opacity: 1,
            y: 0,
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.95,
            ease: "power4.out",
            onComplete: () => gsap.set(coverTitle, { clearProps: "clipPath,transform" }),
          },
          0.18
        )
        .fromTo(slide.querySelector(".cover-accent-rule"), { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.85, ease: "expo.out" }, 0.42)
        .fromTo(slide.querySelector(".cover-subtitle"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.72, ease: "power2.out", clearProps: "transform" }, 0.52)
        .fromTo(slide.querySelectorAll(".cover-tag"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.09, ease: "back.out(1.4)", clearProps: "transform" }, 0.64)
        .fromTo(slide.querySelector(".cover-footer"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.65, clearProps: "transform" }, 0.78);
      if (coreNode) {
        tl.fromTo(coreNode, { scale: 0.3, transformOrigin: "center center", opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(2.2)" }, 1.05);
      }
      if (AMBIENT_FX.slide1HexChargeCycle && allHexCells.length) {
        ambientTween = gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: 0.25, delay: 1.2 });
        if (coreGlow) {
          ambientTween.fromTo(
            coreGlow,
            { opacity: 0.38, scale: 0.92, svgOrigin: "200 196" },
            { opacity: 0.95, scale: 1.14, duration: 2.8, ease: "sine.inOut" },
            0
          );
        }
        if (coreNode) {
          ambientTween.fromTo(
            coreNode,
            { scale: 0.95, svgOrigin: "200 172" },
            { scale: 1.18, fill: "#FDE68A", duration: 2.8, ease: "sine.inOut" },
            0
          );
        }
        if (centerCircle) {
          ambientTween.to(centerCircle, { stroke: "#FEF3C7", strokeWidth: 2.8, duration: 2.8, ease: "sine.inOut" }, 0);
        }
        if (ring0) {
          ambientTween.to(ring0, { fillOpacity: 0.48, stroke: "#FDE68A", strokeWidth: 3.2, duration: 1.4, ease: "sine.inOut" }, 0);
        }
        if (ring1.length) {
          ambientTween.to(ring1, { fillOpacity: 0.30, stroke: "#FBBF24", strokeOpacity: 0.9, strokeWidth: 2.0, duration: 1.6, stagger: 0.12, ease: "sine.inOut" }, 0.35);
        }
        if (ring2.length) {
          ambientTween.to(ring2, { fillOpacity: 0.16, stroke: "#F59E0B", strokeOpacity: 0.72, strokeWidth: 1.6, duration: 1.6, stagger: 0.12, ease: "sine.inOut" }, 0.95);
        }
        if (corePulse) {
          gsap.killTweensOf(corePulse);
          gsap.fromTo(
            corePulse,
            { attr: { r: 16 }, opacity: 0.85, strokeWidth: 2.4 },
            { attr: { r: 162 }, opacity: 0, strokeWidth: 0.6, duration: 3.2, repeat: -1, ease: "power1.out", delay: 1.2 }
          );
        }
      } else if (AMBIENT_FX.slide1CorePulse) {
        ambientTween = gsap.timeline({ repeat: -1, repeatDelay: 4.5, delay: 2.2 });
        if (coreGlow) {
          ambientTween.fromTo(coreGlow, { opacity: 0.55, scale: 0.9, transformOrigin: "center center" }, { opacity: 1, scale: 1.14, duration: 1.8, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0);
        }
        if (corePulse) {
          ambientTween.fromTo(corePulse, { scale: 1, opacity: 0.82, transformOrigin: "center center" }, { scale: 3.1, opacity: 0, duration: 3.4, ease: "power2.out" }, 0);
        }
        if (coreNode) {
          ambientTween.fromTo(coreNode, { scale: 1, transformOrigin: "center center" }, { scale: 1.18, duration: 1.6, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0);
        }
      }
      return;
    }

    // Shared Instrument/CAD Precision Reveal for Header Section Tag, Hairline Trace & Takeaway
    const sectionTag = slide.querySelector(".slide-header__section");
    const headerTrace = slide.querySelector(".slide-header__trace");
    const takeaway = slide.querySelector(".slide-header__takeaway");
    if (sectionTag) {
      tl.fromTo(
        sectionTag,
        { opacity: 0, y: 14, clipPath: "inset(0% 0% 100% 0%)" },
        {
          opacity: 1,
          y: 0,
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.42,
          ease: "power3.out",
          onComplete: () => gsap.set(sectionTag, { clearProps: "clipPath,transform" }),
        },
        0.02
      );
    }
    if (headerTrace) {
      tl.fromTo(
        headerTrace,
        { scaleX: 0, opacity: 0.95 },
        { scaleX: 1, opacity: 0.95, duration: 0.58, ease: "expo.out" },
        0.04
      ).to(
        headerTrace,
        { opacity: 0.25, duration: 0.48, ease: "power2.out" },
        0.58
      );
    }
    if (takeaway) {
      tl.fromTo(
        takeaway,
        { opacity: 0, y: 20, clipPath: "inset(0% 0% 100% 0%)" },
        {
          opacity: 1,
          y: 0,
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.56,
          ease: "power4.out",
          onComplete: () => gsap.set(takeaway, { clearProps: "clipPath,transform" }),
        },
        0.06
      );
    }

    // Slide 2: 3-Col Mandate Drop + Parabolic Counters + Opposing Geometric Wipe Visuals
    if (slideNum === 2) {
      const tiles = slide.querySelectorAll(".mandate-tile");
      const figs = slide.querySelectorAll(".dual-visual .figure-card");
      const mini = slide.querySelector(".aurora-mini-card");
      tl.fromTo(tiles, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.11, ease: "power3.out", clearProps: "transform" }, 0.1);
      const c = animateCounters(slide);
      if (c) tl.add(c, 0.35);
      if (figs[0]) revealFigure(tl, figs[0], "inset(0% 100% 0% 0%)", 0.32);
      if (figs[1]) revealFigure(tl, figs[1], "inset(0% 0% 0% 100%)", 0.32);
      if (mini) tl.fromTo(mini, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.58, ease: "power2.out", clearProps: "transform" }, 0.56);
      return;
    }

    // Slide 3: Inline Fuel Pin Assembly + Concentric Rings + Spec Sheet Rows Cascade
    if (slideNum === 3) {
      const fig = slide.querySelector(".figure-card");
      const clad = slide.querySelectorAll(".s03-clad");
      const na = slide.querySelectorAll(".s03-na");
      const slug = slide.querySelectorAll(".s03-slug");
      const plenum = slide.querySelectorAll(".s03-plenum");
      const wire = slide.querySelectorAll(".s03-wire");
      const leaders = slide.querySelectorAll(".s03-leader");
      const callouts = slide.querySelectorAll(".s03-callout text, .s03-callout rect, .s03-callout circle");
      const rows = slide.querySelectorAll(".spec-sheet tbody tr");
      const bullets = slide.querySelectorAll(".bullet-list li");

      if (fig) revealFigure(tl, fig, "inset(0% 100% 0% 0%)", 0.08);
      if (clad.length) tl.fromTo(clad, { opacity: 0, scale: 0.94, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: 0.55, ease: "power2.out", clearProps: "transform" }, 0.24);
      if (na.length) tl.fromTo(na, { opacity: 0, scale: 0.9, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out", clearProps: "transform" }, 0.36);
      if (slug.length) tl.fromTo(slug, { opacity: 0, scale: 0.84, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.4)", clearProps: "transform" }, 0.46);
      if (plenum.length) tl.fromTo(plenum, { opacity: 0, scaleX: 0.6, transformOrigin: "left center" }, { opacity: 1, scaleX: 1, duration: 0.55, ease: "power2.out", clearProps: "transform" }, 0.56);
      if (wire.length) tl.fromTo(wire, { opacity: 0 }, { opacity: 1, duration: 0.45 }, 0.64);
      if (leaders.length) {
        leaders.forEach((ln) => {
          const len = ln.getTotalLength ? ln.getTotalLength() : 90;
          gsap.set(ln, { strokeDasharray: len, strokeDashoffset: len });
        });
        tl.to(leaders, { strokeDashoffset: 0, duration: 0.55, stagger: 0.06, ease: "power2.out" }, 0.66);
      }
      if (callouts.length) tl.fromTo(callouts, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.025 }, 0.72);
      if (rows.length) tl.fromTo(rows, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.55, stagger: 0.1, ease: "power2.out", clearProps: "transform" }, 0.22);
      if (bullets.length) tl.fromTo(bullets, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: "power2.out", clearProps: "transform" }, 0.6);
      return;
    }

    // Slide 4: 3D Phase Domino + Isotropic Glow + Left-to-Right Bars + Mini-Card + Diagram
    if (slideNum === 4) {
      const nodes = slide.querySelectorAll(".phase-node");
      const isoNode = slide.querySelector(".phase-node--iso");
      const arrows = slide.querySelectorAll(".phase-arrow");
      const bars = slide.querySelectorAll(".bar-fill");
      const mini = slide.querySelector(".prop-mini-card");
      const bullets = slide.querySelectorAll(".bullet-list li");
      const fig = slide.querySelector(".figure-card");
      if (isoNode) isoNode.classList.remove("is-lit");
      tl.fromTo(nodes, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.58, stagger: 0.1, ease: "power3.out", clearProps: "transform" }, 0.12)
        .fromTo(arrows, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.35, stagger: 0.1, ease: "power2.out", clearProps: "transform" }, 0.18);
      bars.forEach((b, i) => {
        if (!b.dataset.targetWidth) {
          b.dataset.targetWidth = b.getAttribute("width") || "0";
        }
        const targetW = parseFloat(b.dataset.targetWidth);
        tl.fromTo(
          b,
          { attr: { width: 0 } },
          { attr: { width: targetW }, duration: 1.4, ease: "expo.out" },
          0.38 + i * 0.18
        );
      });
      if (isoNode) tl.call(() => isoNode.classList.add("is-lit"), null, 0.78);
      if (mini) tl.fromTo(mini, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", clearProps: "transform" }, 0.52);
      if (bullets.length) tl.fromTo(bullets, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.58, stagger: 0.12, ease: "power2.out", clearProps: "transform" }, 0.6);
      if (fig) revealFigure(tl, fig, "inset(0% 0% 0% 100%)", 0.28);
      if (AMBIENT_FX.slide4PhaseWave && nodes.length) {
        ambientTween = gsap.timeline({ repeat: -1, repeatDelay: 5.5, delay: 2.0 });
        nodes.forEach((n, i) => {
          const rect = n.querySelector("rect");
          if (!rect) return;
          const isIso = n.classList.contains("phase-node--iso");
          ambientTween.to(rect, { stroke: isIso ? "#15803D" : "#E05A00", strokeWidth: 2, duration: 0.35, yoyo: true, repeat: 1, ease: "sine.inOut" }, i * 0.24);
        });
      }
      return;
    }

    // Slide 5: Inline Sequential Fabrication Flow (Stage 01 -> 02 -> 03) + Right Weld Panel
    if (slideNum === 5) {
      const figs = slide.querySelectorAll(".dual-panel-row .figure-card");
      const stages = slide.querySelectorAll(".s05-stage");
      const conns = slide.querySelectorAll(".s05-conn");
      const miniBoxes = slide.querySelectorAll(".fig-mini-box");

      if (figs[0]) revealFigure(tl, figs[0], "inset(0% 100% 0% 0%)", 0.08);
      stages.forEach((st, idx) => {
        const baseAt = 0.24 + idx * 0.38;
        const steps = st.querySelectorAll(".s05-step");
        const arrows = st.querySelectorAll(".s05-arrow");
        tl.fromTo(st, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.38, ease: "power2.out", clearProps: "transform" }, baseAt);
        if (steps.length) {
          tl.fromTo(steps, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.36, stagger: 0.08, ease: "power2.out", clearProps: "transform" }, baseAt + 0.06);
        }
        if (arrows.length) {
          tl.fromTo(arrows, { opacity: 0 }, { opacity: 1, duration: 0.25, stagger: 0.08 }, baseAt + 0.12);
        }
        if (conns[idx]) {
          const len = conns[idx].getTotalLength ? conns[idx].getTotalLength() : 28;
          gsap.set(conns[idx], { strokeDasharray: len, strokeDashoffset: len });
          tl.to(conns[idx], { strokeDashoffset: 0, duration: 0.28, ease: "power2.out", onComplete: () => gsap.set(conns[idx], { clearProps: "strokeDasharray,strokeDashoffset" }) }, baseAt + 0.28);
        }
      });

      if (figs[1]) revealFigure(tl, figs[1], "inset(100% 0% 0% 0%)", 0.28);
      if (miniBoxes.length) {
        tl.fromTo(miniBoxes, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.14, ease: "power2.out", clearProps: "transform" }, 0.58);
      }
      return;
    }

    // Slide 6: SEM/EDS Wipe Left + Legend Rows + Optional Step-Build A -> B -> C -> D
    if (slideNum === 6) {
      const fig = slide.querySelector(".figure-card");
      const legendRows = slide.querySelectorAll(".fig-legend-row");
      const items = slide.querySelectorAll(".step-item");
      const dots = slide.querySelectorAll(".step-item__dot");

      if (fig) revealFigure(tl, fig, "inset(0% 100% 0% 0%)", 0.12);
      if (legendRows.length) {
        tl.fromTo(legendRows, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.44, stagger: 0.1, ease: "power2.out", clearProps: "transform" }, 0.35);
      }
      if (!isWaitingSteps) {
        if (items.length) tl.fromTo(items, { opacity: 0, x: 26 }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.14, ease: "power2.out", clearProps: "transform" }, 0.2);
        if (dots.length) tl.fromTo(dots, { scale: 0 }, { scale: 1, duration: 0.5, stagger: 0.14, ease: "back.out(2)", clearProps: "transform" }, 0.26);
        startSlide6Ambient(slide);
      }
      return;
    }

    // Slide 7: Causal Chain 01->02->03 (with Step-Build support) + Thermal Shimmer/Pulse + Metallography 2x2
    if (slideNum === 7) {
      const firstCard = slide.querySelector(".chain-card:not([data-step])");
      const allCards = slide.querySelectorAll(".chain-card");
      const critical = slide.querySelector(".chain-card--critical");
      const fig = slide.querySelector(".figure-card");
      const miniBoxes = slide.querySelectorAll(".fig-mini-box");
      if (critical) critical.classList.remove("is-pulsing");

      if (fig) revealFigure(tl, fig, "inset(0% 0% 0% 100%)", 0.18);
      if (miniBoxes.length) {
        tl.fromTo(miniBoxes, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out", clearProps: "transform" }, 0.42);
      }
      if (isWaitingSteps) {
        if (firstCard) tl.fromTo(firstCard, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.56, ease: "power2.out", clearProps: "transform" }, 0.16);
      } else {
        if (allCards.length) tl.fromTo(allCards, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.58, stagger: 0.14, ease: "power2.out", clearProps: "transform" }, 0.16);
        if (critical) {
          triggerShimmer(tl, critical, 0.72);
          if (AMBIENT_FX.slide7Thermal) tl.call(() => critical.classList.add("is-pulsing"), null, 0.88);
        }
      }
      return;
    }

    // Slide 8: Symmetric H2H Grid + Live Void Swelling Curve Sweep + Verdict Banners
    if (slideNum === 8) {
      const heads = slide.querySelectorAll(".h2h-head");
      const cards = slide.querySelectorAll(".h2h-card");
      const caps = slide.querySelectorAll(".h2h-grid .compare-cap-card");
      const ht9 = slide.querySelector(".compare-cap-card--ht9");
      const plots = slide.querySelectorAll(".stacked-figs-2 .figure-card");
      const clipRect = slide.querySelector("#s08-plotRevealClip rect");
      const callouts = slide.querySelectorAll(".s08-callout");
      if (ht9) ht9.classList.remove("is-pulsing");

      if (heads.length) tl.fromTo(heads, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power3.out", clearProps: "transform" }, 0.08);
      if (cards.length) tl.fromTo(cards, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.46, stagger: 0.055, ease: "power2.out", clearProps: "transform" }, 0.16);
      if (plots[0]) revealFigure(tl, plots[0], "inset(0% 0% 0% 100%)", 0.24);
      if (plots[1]) revealFigure(tl, plots[1], "inset(0% 0% 0% 100%)", 0.36);

      if (isWaitingSteps) {
        if (clipRect) gsap.set(clipRect, { attr: { width: 0 } });
        if (callouts.length) gsap.set(callouts, { opacity: 0 });
      } else {
        if (caps.length) tl.fromTo(caps, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.48, stagger: 0.1, ease: "power2.out", clearProps: "transform" }, 0.54);
        animateSlide8Swelling(slide, tl, 0.52, false);
        if (ht9) {
          triggerShimmer(tl, ht9, 0.78);
          if (AMBIENT_FX.slide8Emerald) tl.call(() => ht9.classList.add("is-pulsing"), null, 0.9);
        }
      }
      return;
    }

    // Slide 9: 4-KPI Hero Drop + Parabolic Expo Counters + Converging Bottom Split
    if (slideNum === 9) {
      const kpis = slide.querySelectorAll(".kpi-card");
      const fig = slide.querySelector(".figure-card");
      const bullets = slide.querySelectorAll(".bullet-list li");
      const note = slide.querySelector(".s09-strain-note");
      if (kpis.length) {
        tl.fromTo(kpis, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.56, stagger: 0.07, ease: "power3.out", clearProps: "transform" }, 0.08);
        const c = animateCounters(slide);
        if (c) tl.add(c, 0.32);
      }
      if (fig) revealFigure(tl, fig, "inset(0% 100% 0% 0%)", 0.32);
      if (note) tl.fromTo(note, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", clearProps: "transform" }, 0.56);
      if (bullets.length) tl.fromTo(bullets, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.13, ease: "power2.out", clearProps: "transform" }, 0.38);
      return;
    }

    // Slide 10: 4-Corner Diagonal Convergence + Physical Mechanism SVGs (with Step-Build)
    if (slideNum === 10) {
      if (!isWaitingSteps) {
        const cards = slide.querySelectorAll(".bento-card");
        const offsets = [
          { x: -26, y: -18 },
          { x: 26, y: -18 },
          { x: -26, y: 18 },
          { x: 26, y: 18 },
        ];
        cards.forEach((card, i) => {
          const off = offsets[i] || { x: 0, y: 18 };
          const at = 0.12 + i * 0.1;
          tl.fromTo(card, { opacity: 0, x: off.x, y: off.y }, { opacity: 1, x: 0, y: 0, duration: 0.68, ease: "power3.out", clearProps: "transform" }, at);
          playLeverMicroSvg(card, tl, at + 0.36);
        });
        startSlide10Ambient(slide);
      }
      return;
    }

    // Slide 11: Trade-Off Table Header + Row Cascade
    if (slideNum === 11) {
      const thead = slide.querySelector(".tradeoff-table thead");
      const rows = slide.querySelectorAll(".tradeoff-table tbody tr");
      const foot = slide.querySelector(".table-footnote");
      if (thead) {
        tl.fromTo(thead, { opacity: 0, y: -10, clipPath: "inset(0% 100% 0% 0%)" }, { opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 0.48, ease: "power3.out", clearProps: "clipPath,opacity,transform" }, 0.08);
      }
      if (rows.length) {
        tl.fromTo(rows, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.48, stagger: 0.08, ease: "power3.out", clearProps: "opacity,transform" }, 0.18);
      }
      if (foot) tl.fromTo(foot, { opacity: 0 }, { opacity: 1, duration: 0.45, clearProps: "opacity" }, 0.65);
      return;
    }

    // Slide 12: Inline Roadmap Stage 1 -> R&D Bridge (Dual Rails) -> Stage 2 + 3 Decision Cards
    if (slideNum === 12) {
      const fig = slide.querySelector(".figure-card");
      const st1 = slide.querySelector(".s12-stage1");
      const bridgeLines = slide.querySelectorAll(".s12-bridge-line");
      const bridgePill = slide.querySelector(".s12-bridge-pill");
      const st2 = slide.querySelector(".s12-stage2");
      const box1 = slide.querySelector('.decision-box[data-stage="1"]');
      const boxes = slide.querySelectorAll(".decision-box");
      const stage2Card = slide.querySelector(".decision-box--green");

      if (fig) revealFigure(tl, fig, "inset(0% 100% 0% 0%)", 0.08);
      if (st1) tl.fromTo(st1, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.54, ease: "power3.out", clearProps: "transform" }, 0.24);

      if (isWaitingSteps) {
        if (box1) tl.fromTo(box1, { opacity: 0, x: 26 }, { opacity: 1, x: 0, duration: 0.56, ease: "power3.out", clearProps: "transform" }, 0.24);
      } else {
        if (bridgeLines.length) {
          bridgeLines.forEach((ln) => {
            const len = ln.getTotalLength ? ln.getTotalLength() : 75;
            gsap.set(ln, { strokeDasharray: len, strokeDashoffset: len });
          });
          tl.to(bridgeLines, { strokeDashoffset: 0, duration: 0.5, stagger: 0.08, ease: "power2.out", onComplete: () => gsap.set(bridgeLines, { clearProps: "strokeDasharray,strokeDashoffset" }) }, 0.52);
        }
        if (bridgePill) tl.fromTo(bridgePill, { scale: 0.85, opacity: 0, transformOrigin: "center center" }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.6)", clearProps: "transform" }, 0.62);
        if (st2) tl.fromTo(st2, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.56, ease: "power3.out", clearProps: "transform" }, 0.74);
        if (boxes.length) tl.fromTo(boxes, { opacity: 0, x: 28 }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.15, ease: "power3.out", clearProps: "transform" }, 0.24);
        if (stage2Card) triggerShimmer(tl, stage2Card, 0.92);
        startSlide12Ambient(slide);
      }
      return;
    }

    // Slide 13: Categorized Two-Card Verified References Cascade
    if (slideNum === 13) {
      const cards = slide.querySelectorAll(".ref-card");
      if (cards.length) tl.fromTo(cards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out", clearProps: "transform" }, 0.06);
      cards.forEach((card) => {
        const items = card.querySelectorAll(".ref-item");
        if (items.length) {
          tl.fromTo(items, { opacity: 0, x: -24, y: 6 }, { opacity: 1, x: 0, y: 0, duration: 0.6, stagger: 0.12, ease: "power3.out", clearProps: "transform" }, 0.36);
        }
      });
      return;
    }

    // Slide 14: Closing Core-Lattice Assembly + Solemn Typographic Reveal + Ambient Containment Orbit
    if (slideNum === 14) {
      const title = slide.querySelector(".thankyou-title");
      const sub = slide.querySelector(".thankyou-sub");
      const contact = slide.querySelector(".thankyou-contact");
      const disclosure = slide.querySelector(".ai-disclosure");
      const ruleLine = slide.querySelector(".thankyou-rule line");
      const closingHex = slide.querySelector(".closing-hex-watermark");
      const closingGlow = slide.querySelector(".closing-glow-circle");
      if (closingHex) {
        const rings = closingHex.querySelectorAll(":scope > circle:not(.closing-glow-circle)");
        const hexes = closingHex.querySelectorAll("polygon");
        const coreDots = closingHex.querySelectorAll("g > circle");
        tl.fromTo(closingHex, { opacity: 0 }, { opacity: 0.44, duration: 0.7, ease: "power2.out" }, 0.04);
        if (rings.length) {
          tl.fromTo(rings, { opacity: 0, scale: 0.84, svgOrigin: "180 180" }, { opacity: 1, scale: 1, duration: 1.25, stagger: 0.14, ease: "power3.out" }, 0.08);
        }
        if (hexes.length) {
          tl.fromTo(hexes, { opacity: 0, scale: 0.72, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.72, stagger: { each: 0.055, from: "end" }, ease: "power3.out" }, 0.14);
        }
        if (coreDots.length) {
          tl.fromTo(coreDots, { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.7, stagger: 0.1, ease: "back.out(1.6)" }, 0.16);
        }
      }
      if (title) tl.fromTo(title, { opacity: 0, scale: 0.88, y: 32 }, { opacity: 1, scale: 1, y: 0, duration: 1.05, ease: "power3.out", clearProps: "transform" }, 0.28);
      if (ruleLine) {
        const len = ruleLine.getTotalLength ? ruleLine.getTotalLength() : 220;
        gsap.set(ruleLine, { strokeDasharray: len, strokeDashoffset: len });
        tl.to(ruleLine, { strokeDashoffset: 0, duration: 1.05, ease: "expo.out" }, 0.54);
      }
      if (sub) tl.fromTo(sub, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.72, ease: "power3.out", clearProps: "transform" }, 0.74);
      if (contact) tl.fromTo(contact, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.65, ease: "power2.out", clearProps: "transform" }, 0.94);
      if (disclosure) tl.fromTo(disclosure, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.75, ease: "power2.out", clearProps: "transform" }, 1.12);
      if (AMBIENT_FX.slide14ClosingHalo && closingHex) {
        ambientTween = gsap.timeline();
        if (closingGlow) {
          ambientTween.fromTo(closingGlow, { opacity: 0.45, scale: 0.92, svgOrigin: "180 180" }, { opacity: 1, scale: 1.12, duration: 3.4, repeat: -1, yoyo: true, ease: "sine.inOut" }, 1.6);
        }
        const outerDashedRing = closingHex.querySelector("circle[stroke-dasharray]");
        if (outerDashedRing) {
          ambientTween.to(outerDashedRing, { rotation: 360, duration: 68, repeat: -1, ease: "none", svgOrigin: "180 180" }, 1.4);
        }
      }
      return;
    }
  }

  // Reveal one Step-Build beat cleanly with GSAP + slide-specific physics/climax hooks
  function revealStepBeat(slide, stepNum) {
    const slideNum = parseInt(slide.dataset.slide || "1", 10);
    const targets = Array.from(slide.querySelectorAll(`[data-step="${stepNum}"]`));
    if (!targets.length) return;

    targets.forEach((el) => el.classList.remove("is-step-hidden"));
    if (!window.gsap || prefersReducedMotion || isStatic) return;

    const gsap = window.gsap;
    const tl = gsap.timeline();
    activeStepTimelines.push(tl);

    if (slideNum === 6) {
      targets.forEach((item) => {
        const dot = item.querySelector(".step-item__dot");
        tl.fromTo(item, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.44, ease: "power3.out", clearProps: "transform" }, 0);
        if (dot) tl.fromTo(dot, { scale: 0 }, { scale: 1, duration: 0.42, ease: "back.out(2)", clearProps: "transform" }, 0.08);
      });
      if (currentStepIdx >= currentSlideSteps.length) {
        startSlide6Ambient(slide);
      }
      return;
    }

    if (slideNum === 7) {
      tl.fromTo(targets, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out", clearProps: "transform" }, 0);
      const critical = targets.find((el) => el.classList.contains("chain-card--critical"));
      if (critical) {
        triggerShimmer(tl, critical, 0.25);
        if (AMBIENT_FX.slide7Thermal) tl.call(() => critical.classList.add("is-pulsing"), null, 0.48);
      }
      return;
    }

    if (slideNum === 8) {
      tl.fromTo(targets, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.48, stagger: 0.1, ease: "power2.out", clearProps: "transform" }, 0);
      animateSlide8Swelling(slide, tl, 0.05, false);
      const ht9 = slide.querySelector(".compare-cap-card--ht9");
      if (ht9) {
        triggerShimmer(tl, ht9, 0.35);
        if (AMBIENT_FX.slide8Emerald) tl.call(() => ht9.classList.add("is-pulsing"), null, 0.52);
      }
      return;
    }

    if (slideNum === 10) {
      targets.forEach((card) => {
        tl.fromTo(card, { opacity: 0, y: 18, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.48, ease: "power3.out", clearProps: "transform" }, 0);
        playLeverMicroSvg(card, tl, 0.2);
      });
      if (currentStepIdx >= currentSlideSteps.length) {
        startSlide10Ambient(slide);
      }
      return;
    }

    if (slideNum === 12) {
      if (stepNum === 1) {
        const bridge = slide.querySelector(".s12-bridge");
        const bridgeLines = slide.querySelectorAll(".s12-bridge-line");
        const bridgePill = slide.querySelector(".s12-bridge-pill");
        const st2 = slide.querySelector(".s12-stage2");
        const prop2 = slide.querySelector('.decision-box[data-stage="2"]');
        if (bridge) {
          gsap.set(bridge, { opacity: 1 });
          if (bridgeLines.length) {
            bridgeLines.forEach((ln) => {
              const len = ln.getTotalLength ? ln.getTotalLength() : 75;
              gsap.set(ln, { strokeDasharray: len, strokeDashoffset: len });
            });
            tl.to(bridgeLines, { strokeDashoffset: 0, duration: 0.46, stagger: 0.07, ease: "power2.out", onComplete: () => gsap.set(bridgeLines, { clearProps: "strokeDasharray,strokeDashoffset" }) }, 0);
          }
          if (bridgePill) tl.fromTo(bridgePill, { scale: 0.85, opacity: 0, transformOrigin: "center center" }, { scale: 1, opacity: 1, duration: 0.42, ease: "back.out(1.6)", clearProps: "transform" }, 0.14);
        }
        if (st2) tl.fromTo(st2, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", clearProps: "transform" }, 0.24);
        if (prop2) {
          tl.fromTo(prop2, { opacity: 0, x: 26 }, { opacity: 1, x: 0, duration: 0.52, ease: "power3.out", clearProps: "transform" }, 0.2);
          triggerShimmer(tl, prop2, 0.46);
        }
        startSlide12Ambient(slide);
      } else {
        tl.fromTo(targets, { opacity: 0, x: 26 }, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out", clearProps: "transform" }, 0);
      }
      return;
    }

    tl.fromTo(targets, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.42, ease: "power2.out", clearProps: "transform" }, 0);
  }

  function revealAllStepsOnCurrentSlide() {
    const slide = slides[currentSlideIndex];
    if (!slide) return;
    if (currentStepIdx < currentSlideSteps.length) {
      for (let i = currentStepIdx; i < currentSlideSteps.length; i++) {
        currentStepIdx = i + 1;
        revealStepBeat(slide, currentSlideSteps[i]);
      }
      syncFooterStepDots(slide);
    }
  }

  function advanceStepOrSlide() {
    const slide = slides[currentSlideIndex];
    if (stepBuildEnabled && slide && currentStepIdx < currentSlideSteps.length) {
      const nextStepNum = currentSlideSteps[currentStepIdx];
      currentStepIdx += 1;
      revealStepBeat(slide, nextStepNum);
      syncFooterStepDots(slide);
      return;
    }
    nextSlide();
  }

  function retreatStepOrSlide(forceSlide) {
    const slide = slides[currentSlideIndex];
    if (!forceSlide && stepBuildEnabled && slide && currentStepIdx > 0) {
      clearStepTimelines(true);
      currentStepIdx -= 1;
      const stepNum = currentSlideSteps[currentStepIdx];
      slide.querySelectorAll(`[data-step="${stepNum}"]`).forEach((el) => el.classList.add("is-step-hidden"));
      const slideNum = parseInt(slide.dataset.slide || "1", 10);
      if (slideNum === 8 && stepNum === 1) {
        const clipRect = slide.querySelector("#s08-plotRevealClip rect");
        if (clipRect) clipRect.setAttribute("width", "0");
        slide.querySelectorAll(".s08-callout").forEach((c) => (c.style.opacity = "0"));
      }
      if (slideNum === 7 && stepNum === 2) {
        slide.querySelector(".chain-card--critical")?.classList.remove("is-pulsing");
      }
      syncFooterStepDots(slide);
      return;
    }
    prevSlide({ revealAll: !stepBuildEnabled });
  }

  function toggleStepBuildMode() {
    stepBuildEnabled = !stepBuildEnabled;
    const slide = slides[currentSlideIndex];
    if (!stepBuildEnabled && slide) {
      revealAllStepsOnCurrentSlide();
    } else if (slide) {
      syncFooterStepDots(slide);
    }
    showToast(stepBuildEnabled ? "Step-Build: ON (S)" : "Step-Build: OFF (S)");
  }

  function showSlide(index, options) {
    const opts = options || {};
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    const prevIndex = currentSlideIndex;
    const incoming = slides[clamped];
    const outgoing = prevIndex !== clamped ? slides[prevIndex] : null;
    const direction = clamped >= prevIndex ? 1 : -1;

    if (leavingTween) {
      leavingTween.kill();
      leavingTween = null;
    }
    clearStepTimelines(false);
    if (prevIndex !== clamped) {
      finalizeAllCounters();
    }

    slides.forEach((s) => {
      if (s !== incoming && s !== outgoing) {
        s.classList.remove("is-active", "is-leaving");
        if (window.gsap) window.gsap.set(s, { clearProps: "opacity,x,scale,transform" });
      }
    });

    if (outgoing && window.gsap && !prefersReducedMotion && !isStatic) {
      outgoing.classList.remove("is-active");
      outgoing.classList.add("is-leaving");
      leavingTween = window.gsap.to(outgoing, {
        opacity: 0,
        x: -28 * direction,
        scale: 0.99,
        duration: 0.34,
        ease: "power2.in",
        onComplete: () => {
          outgoing.classList.remove("is-leaving");
          window.gsap.set(outgoing, { clearProps: "opacity,x,scale,transform" });
          leavingTween = null;
        },
      });
    } else if (outgoing) {
      outgoing.classList.remove("is-active", "is-leaving");
    }

    incoming.classList.remove("is-leaving");
    incoming.classList.add("is-active");

    if (outgoing && window.gsap && !prefersReducedMotion && !isStatic) {
      window.gsap.fromTo(
        incoming,
        { opacity: 0, x: 28 * direction, scale: 0.988 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.46,
          ease: "power3.out",
          onComplete: () => window.gsap.set(incoming, { clearProps: "x,scale,transform" }),
        }
      );
    }

    if (stage) {
      stage.classList.toggle("is-theme-amber", incoming.classList.contains("theme--amber"));
      stage.classList.toggle("is-theme-green", incoming.classList.contains("theme--green"));
    }

    currentSlideIndex = clamped;

    if (progressFill) {
      const pct = ((clamped + 1) / slides.length) * 100;
      if (window.gsap && !prefersReducedMotion && !isStatic) {
        window.gsap.to(progressFill, { width: `${pct}%`, duration: 0.65, ease: "expo.out" });
      } else {
        progressFill.style.width = `${pct}%`;
      }
    }

    window.location.hash = `slide-${clamped + 1}`;
    const isWaitingSteps = initStepStateForSlide(incoming, Boolean(opts.revealAll));
    playSlideEntrance(incoming, isWaitingSteps);
    syncNotesDrawer();
  }

  function nextSlide(opts) {
    if (currentSlideIndex < slides.length - 1) showSlide(currentSlideIndex + 1, opts);
  }

  function prevSlide(opts) {
    if (currentSlideIndex > 0) showSlide(currentSlideIndex - 1, opts);
  }

  // ---- Interactive Feature 1: Pointer-Reactive Card Sheen (All Card Classes) ----
  const reactiveSelector = [
    ".mandate-tile",
    ".kpi-card",
    ".bento-card",
    ".decision-box",
    ".col-panel",
    ".pipe-step",
    ".figure-card",
    ".aurora-mini-card",
    ".prop-mini-card",
    ".step-item",
    ".chain-card",
    ".h2h-card",
    ".compare-cap-card",
    ".ref-card",
    ".bullet-list li"
  ].join(", ");

  document.querySelectorAll(reactiveSelector).forEach((card) => {
    card.classList.add("reactive-card");
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
    });
  });

  // Slide 10 On-Demand Micro-SVG Trigger on Lever Card Hover
  document.querySelectorAll('.slide[data-slide="10"] .bento-card').forEach((card) => {
    let lastPlayed = 0;
    card.addEventListener("mouseenter", () => {
      if (card.classList.contains("is-step-hidden") || prefersReducedMotion) return;
      const now = Date.now();
      if (now - lastPlayed < 1400) return;
      lastPlayed = now;
      playLeverMicroSvg(card);
    });
  });

  // ---- Interactive Feature 2: 14-Slide Overview Command Grid (G) ----
  function renderOverviewGrid() {
    if (!overviewGrid) return;
    overviewGrid.innerHTML = "";
    slides.forEach((slide, idx) => {
      const tile = document.createElement("div");
      tile.className = `overview-tile${idx === currentSlideIndex ? " is-current" : ""}`;
      const section =
        slide.querySelector(".slide-header__section")?.textContent.trim() ||
        (idx === 0 ? "Cover Title" : `Slide ${idx + 1}`);
      const takeaway =
        slide.querySelector(".slide-header__takeaway")?.textContent.trim() ||
        slide.querySelector(".cover-title")?.textContent.trim() ||
        "";
      tile.innerHTML = `<div class="overview-tile__top"><span>SLIDE ${idx + 1}</span><span>${idx + 1} / ${slides.length}</span></div><div class="overview-tile__section">${section}</div><div class="overview-tile__takeaway">${takeaway}</div>`;
      tile.addEventListener("click", () => {
        closeOverlays();
        showSlide(idx, { revealAll: true });
      });
      overviewGrid.appendChild(tile);
    });
  }

  function toggleOverview(forceState) {
    if (!overviewModal) return;
    const open = typeof forceState === "boolean" ? forceState : !overviewModal.classList.contains("is-open");
    closeOverlays(open ? "overview" : null);
    if (open) {
      renderOverviewGrid();
      overviewModal.classList.add("is-open");
      overviewModal.setAttribute("aria-hidden", "false");
      if (window.gsap) {
        window.gsap.fromTo(".overview-tile", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.02, ease: "power2.out" });
      }
    }
  }

  // ---- Interactive Feature 3: Click-to-Zoom Q&A Figure Lightbox (Guarded) ----
  function openLightbox(figureCard) {
    if (!lightboxModal || !lightboxStage) return;
    const stageEl = figureCard.querySelector(".figure-card__stage");
    if (!stageEl || stageEl.classList.contains("is-missing")) return;
    const visual = stageEl.querySelector("svg, img");
    if (!visual) return;
    closeOverlays("lightbox");
    lightboxStage.innerHTML = "";
    const clone = visual.cloneNode(true);
    if (clone.tagName === "IMG" && visual.naturalHeight > 0) {
      const targetH = Math.round(Math.min(window.innerHeight * 0.74, visual.naturalHeight * 1.25));
      clone.style.height = `${targetH}px`;
    }
    const cloneClip = clone.querySelector("#s08-plotRevealClip rect");
    if (cloneClip) cloneClip.setAttribute("width", "485");
    clone.querySelectorAll(".s08-callout").forEach((c) => (c.style.opacity = "1"));
    lightboxStage.appendChild(clone);
    if (lightboxCaption) {
      lightboxCaption.textContent = figureCard.querySelector(".figure-card__caption")?.textContent || "";
    }
    lightboxModal.classList.add("is-open");
    lightboxModal.setAttribute("aria-hidden", "false");
    if (window.gsap) {
      window.gsap.fromTo(".deck-lightbox__card", { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.28, ease: "power3.out" });
    }
  }

  document.querySelectorAll(".figure-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".fig-mini-box, .fig-legend-row, a")) return;
      openLightbox(card);
    });
  });

  // ---- Interactive Feature 4: Sodium Laser Pointer (L) ----
  let laserX = null;
  let laserY = null;
  if (laserDot && window.gsap) {
    laserX = window.gsap.quickTo(laserDot, "x", { duration: 0.06, ease: "power2.out" });
    laserY = window.gsap.quickTo(laserDot, "y", { duration: 0.06, ease: "power2.out" });
  }
  window.addEventListener("mousemove", (e) => {
    if (!isLaserActive || !laserDot) return;
    if (laserX && laserY) {
      laserX(e.clientX);
      laserY(e.clientY);
    } else {
      laserDot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }
  });

  function toggleLaser(forceState) {
    if (!laserDot) return;
    isLaserActive = typeof forceState === "boolean" ? forceState : !isLaserActive;
    laserDot.classList.toggle("is-on", isLaserActive);
    document.body.classList.toggle("laser-active", isLaserActive);
  }

  // ---- Interactive Feature 5: Shortcuts Cheat Sheet (?) & Speaker Notes Drawer (N) ----
  function toggleShortcuts(forceState) {
    if (!shortcutsModal) return;
    const open = typeof forceState === "boolean" ? forceState : !shortcutsModal.classList.contains("is-open");
    closeOverlays(open ? "shortcuts" : null);
    if (open) {
      shortcutsModal.classList.add("is-open");
      shortcutsModal.setAttribute("aria-hidden", "false");
    }
  }

  function loadStoredNotes() {
    try {
      const raw = localStorage.getItem(NOTES_STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SLIDE_NOTES };
      return { ...DEFAULT_SLIDE_NOTES, ...JSON.parse(raw) };
    } catch (_) {
      return { ...DEFAULT_SLIDE_NOTES };
    }
  }

  let slideNotes = loadStoredNotes();

  function syncNotesDrawer() {
    const slideNum = currentSlideIndex + 1;
    if (notesSlideLbl) notesSlideLbl.textContent = `Slide ${slideNum} / ${slides.length}`;
    if (notesInput) notesInput.value = slideNotes[slideNum] || "";
  }

  function toggleNotes(forceState) {
    if (!notesPanel) return;
    const open = typeof forceState === "boolean" ? forceState : !notesPanel.classList.contains("is-open");
    notesPanel.classList.toggle("is-open", open);
    notesPanel.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) {
      syncNotesDrawer();
    } else if (notesInput && document.activeElement === notesInput) {
      notesInput.blur();
    }
  }

  notesClose?.addEventListener("click", () => toggleNotes(false));
  notesInput?.addEventListener("input", () => {
    const slideNum = currentSlideIndex + 1;
    slideNotes[slideNum] = notesInput.value;
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(slideNotes));
    } catch (_) {
      // Ignore storage quota errors in restricted file:// contexts
    }
  });

  function closeOverlays(except) {
    if (except !== "overview" && overviewModal) {
      overviewModal.classList.remove("is-open");
      overviewModal.setAttribute("aria-hidden", "true");
    }
    if (except !== "lightbox" && lightboxModal) {
      lightboxModal.classList.remove("is-open");
      lightboxModal.setAttribute("aria-hidden", "true");
    }
    if (except !== "shortcuts" && shortcutsModal) {
      shortcutsModal.classList.remove("is-open");
      shortcutsModal.setAttribute("aria-hidden", "true");
    }
  }

  // ---- Interactive Feature 6: Bidirectional Cross-Highlighting & Q&A Jump Links ----
  // Slide 3 Bidirectional (Spec Sheet Rows <-> Pin SVG Layers)
  const s03Layers = document.querySelectorAll(".s03-inline-svg .s03-layer");
  const s03Rows = document.querySelectorAll(".spec-sheet tbody tr[data-pin-target]");
  s03Rows.forEach((row) => {
    const targets = (row.dataset.pinTarget || "").split(",").map((s) => s.trim()).filter(Boolean);
    row.addEventListener("mouseenter", () => {
      s03Layers.forEach((layer) => {
        const match = targets.includes(layer.dataset.pinLayer);
        layer.classList.toggle("is-dimmed", !match);
        layer.classList.toggle("is-highlighted", match);
      });
    });
    row.addEventListener("mouseleave", () => {
      s03Layers.forEach((layer) => layer.classList.remove("is-dimmed", "is-highlighted"));
    });
  });

  s03Layers.forEach((layer) => {
    const layerName = layer.dataset.pinLayer;
    if (!layerName) return;
    layer.addEventListener("mouseenter", () => {
      s03Layers.forEach((other) => {
        const match = other.dataset.pinLayer === layerName;
        other.classList.toggle("is-dimmed", !match);
        other.classList.toggle("is-highlighted", match);
      });
      s03Rows.forEach((row) => {
        const targets = (row.dataset.pinTarget || "").split(",").map((s) => s.trim()).filter(Boolean);
        row.classList.toggle("is-cross-lit", targets.includes(layerName));
      });
    });
    layer.addEventListener("mouseleave", () => {
      s03Layers.forEach((other) => other.classList.remove("is-dimmed", "is-highlighted"));
      s03Rows.forEach((row) => row.classList.remove("is-cross-lit"));
    });
  });

  // Slide 4 Cross-Link (Node 5 >700C gamma-BCC <-> Isotropy Advantage card)
  const s04IsoPairs = document.querySelectorAll('.slide[data-slide="4"] [data-phase-link="iso"]');
  function setSlide4IsoLit(active) {
    s04IsoPairs.forEach((el) => el.classList.toggle("is-cross-lit", active));
  }
  s04IsoPairs.forEach((el) => {
    el.addEventListener("mouseenter", () => setSlide4IsoLit(true));
    el.addEventListener("mouseleave", () => setSlide4IsoLit(false));
  });

  // Slide 8 Cross-Link (Row 02 Void Swelling H2H Cards <-> Inline Void Swelling Curves)
  const s08CurveGroups = document.querySelectorAll(".s08-inline-svg .s08-curve-group");
  document.querySelectorAll('.slide[data-slide="8"] .h2h-card[data-curve-target]').forEach((card) => {
    const targetCurve = card.dataset.curveTarget;
    card.addEventListener("mouseenter", () => {
      s08CurveGroups.forEach((grp) => {
        const match = grp.dataset.curve === targetCurve;
        grp.classList.toggle("is-dimmed", !match);
        grp.classList.toggle("is-highlighted", match);
      });
    });
    card.addEventListener("mouseleave", () => {
      s08CurveGroups.forEach((grp) => grp.classList.remove("is-dimmed", "is-highlighted"));
    });
  });

  // Slide 11 Interactive Row Focus, Multi-Row Compare & Column Spotlight (Unchanged)
  const tradeTable = document.querySelector(".tradeoff-table");
  let pinnedColIndex = null;
  function applyTableColFocus(colIndex) {
    if (!tradeTable) return;
    const allCells = tradeTable.querySelectorAll("th, td");
    if (colIndex === null || colIndex === undefined) {
      tradeTable.classList.remove("has-col-focus");
      allCells.forEach((c) => c.classList.remove("is-col-active", "is-col-dim"));
      return;
    }
    tradeTable.classList.add("has-col-focus");
    tradeTable.querySelectorAll("tr").forEach((tr) => {
      Array.from(tr.children).forEach((cell, idx) => {
        cell.classList.toggle("is-col-active", idx === colIndex);
        cell.classList.toggle("is-col-dim", idx !== colIndex);
      });
    });
  }
  function clearTradeTableFocus() {
    if (!tradeTable) return;
    tradeTable.querySelectorAll("tbody tr.is-pinned").forEach((r) => r.classList.remove("is-pinned"));
    tradeTable.classList.remove("has-pinned", "has-hover");
    pinnedColIndex = null;
    applyTableColFocus(null);
  }
  if (tradeTable) {
    const tRows = tradeTable.querySelectorAll("tbody tr");
    const tHeads = tradeTable.querySelectorAll("thead th");
    tRows.forEach((row) => {
      row.addEventListener("mouseenter", () => tradeTable.classList.add("has-hover"));
      row.addEventListener("mouseleave", () => tradeTable.classList.remove("has-hover"));
      row.addEventListener("click", () => {
        row.classList.toggle("is-pinned");
        tradeTable.classList.toggle("has-pinned", tradeTable.querySelectorAll("tbody tr.is-pinned").length > 0);
      });
    });
    tHeads.forEach((th, colIdx) => {
      th.addEventListener("mouseenter", () => {
        if (pinnedColIndex === null) applyTableColFocus(colIdx);
      });
      th.addEventListener("mouseleave", () => {
        if (pinnedColIndex === null) applyTableColFocus(null);
      });
      th.addEventListener("click", () => {
        pinnedColIndex = pinnedColIndex === colIdx ? null : colIdx;
        applyTableColFocus(pinnedColIndex);
      });
    });
  }

  // Slide 12 Bidirectional Stage Highlighting (Roadmap SVG <-> Decision Cards)
  const s12Blocks = document.querySelectorAll(".s12-inline-svg .s12-block[data-stage]");
  const s12Cards = document.querySelectorAll(".decision-box[data-stage]");
  function linkStage(stageId, active) {
    s12Blocks.forEach((b) => {
      const match = b.dataset.stage === stageId;
      b.classList.toggle("is-dimmed", active && !match);
      b.classList.toggle("is-highlighted", active && match);
    });
    s12Cards.forEach((c) => {
      c.classList.toggle("is-linked", active && c.dataset.stage === stageId);
    });
  }
  s12Blocks.forEach((b) => {
    b.addEventListener("mouseenter", () => linkStage(b.dataset.stage, true));
    b.addEventListener("mouseleave", () => linkStage(b.dataset.stage, false));
  });
  s12Cards.forEach((c) => {
    c.addEventListener("mouseenter", () => linkStage(c.dataset.stage, true));
    c.addEventListener("mouseleave", () => linkStage(c.dataset.stage, false));
  });

  // Slide 13 Clickable Q&A Reference Slide Tags
  document.querySelectorAll(".ref-slide-tag[data-jump-slide]").forEach((tag) => {
    const jump = () => {
      const target = parseInt(tag.dataset.jumpSlide, 10);
      if (!Number.isNaN(target) && target >= 1 && target <= slides.length) {
        closeOverlays();
        showSlide(target - 1, { revealAll: true });
      }
    };
    tag.addEventListener("click", jump);
    tag.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        jump();
      }
    });
  });

  lightboxClose?.addEventListener("click", () => closeOverlays());
  lightboxModal?.addEventListener("click", (e) => {
    if (e.target === lightboxModal) closeOverlays();
  });
  shortcutsModal?.addEventListener("click", (e) => {
    if (e.target === shortcutsModal) closeOverlays();
  });

  window.addEventListener("resize", scaleStage);

  let altDigitBuffer = "";

  function commitAltDigitJump() {
    if (!altDigitBuffer) return;
    const targetNum = parseInt(altDigitBuffer, 10);
    altDigitBuffer = "";
    if (targetNum >= 1 && targetNum <= slides.length) {
      closeOverlays();
      showSlide(targetNum - 1, { revealAll: true });
    }
  }

  window.addEventListener("blur", () => {
    altDigitBuffer = "";
  });

  window.addEventListener("keyup", (e) => {
    if (e.key === "Alt") {
      commitAltDigitJump();
    }
  });

  window.addEventListener("keydown", (e) => {
    // Guard: never hijack typing inside Speaker Notes textarea / inputs
    if (e.target && (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT" || e.target.isContentEditable)) {
      if (e.key === "Escape") {
        toggleNotes(false);
      }
      return;
    }

    if (e.altKey && /^[0-9]$/.test(e.key)) {
      e.preventDefault();
      altDigitBuffer += e.key;
      return;
    }
    if (e.key === "Escape") {
      altDigitBuffer = "";
      if (isLaserActive) toggleLaser(false);
      if (notesPanel?.classList.contains("is-open")) toggleNotes(false);
      clearTradeTableFocus();
      closeOverlays();
      return;
    }
    if (["ArrowRight", "ArrowUp", " ", "PageDown"].includes(e.key)) {
      e.preventDefault();
      closeOverlays();
      advanceStepOrSlide();
    } else if (["ArrowLeft", "ArrowDown", "PageUp"].includes(e.key)) {
      e.preventDefault();
      closeOverlays();
      retreatStepOrSlide(e.shiftKey);
    } else if (e.key === "Home") {
      e.preventDefault();
      closeOverlays();
      showSlide(0, { revealAll: true });
    } else if (e.key === "End") {
      e.preventDefault();
      closeOverlays();
      showSlide(slides.length - 1, { revealAll: true });
    } else if (e.key.toLowerCase() === "s") {
      e.preventDefault();
      toggleStepBuildMode();
    } else if (e.key.toLowerCase() === "a") {
      e.preventDefault();
      revealAllStepsOnCurrentSlide();
    } else if (e.key.toLowerCase() === "n") {
      e.preventDefault();
      toggleNotes();
    } else if (e.key.toLowerCase() === "g") {
      e.preventDefault();
      toggleOverview();
    } else if (e.key.toLowerCase() === "l") {
      e.preventDefault();
      toggleLaser();
    } else if (e.key === "?" || (e.shiftKey && e.key === "/")) {
      e.preventDefault();
      toggleShortcuts();
    } else if (e.key.toLowerCase() === "f") {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    } else if (/^[1-9]$/.test(e.key)) {
      closeOverlays();
      showSlide(parseInt(e.key, 10) - 1, { revealAll: true });
    }
  });

  const hashMatch = window.location.hash.match(/^#slide-(\d+)$/);
  const initialIndex = hashMatch ? parseInt(hashMatch[1], 10) - 1 : 0;
  scaleStage();
  showSlide(initialIndex, { revealAll: isStatic });
})();
