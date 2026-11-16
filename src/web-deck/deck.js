(function () {
  const params = new URLSearchParams(window.location.search);
  const isExportPdf = params.get("export") === "pdf";
  const isStatic = params.get("static") === "1";

  // Quick-toggle flags for ambient glow & repeating micro-animations (flip any to false to disable)
  const AMBIENT_FX = {
    stageHalos: true,          // Theme-reactive background glow halos across slides
    slide1CorePulse: true,     // Slide 1 core glow breath + ripple ring
    slide1HexChargeCycle: true,// Slide 1 hex lattice gradual charge -> peak -> fast discharge cycle
    slide4PhaseWave: false,    // Slide 4 temperature wave across phase nodes
    slide6StepWave: true,    // Slide 6 A -> B -> C -> D badge pulse wave
    slide7Thermal: true,     // Slide 7 ~725 C eutectic thermal pulse
    slide8Emerald: true,     // Slide 8 HT9 window emerald pulse
    slide10MicroLoops: true, // Slide 10 slow physics loops inside 4 micro-SVGs
    slide12BridgePulse: true,// Slide 12 R&D Bridge traveling pulse
    slide14ClosingHalo: true // Slide 14 subtle symmetric core halo
  };

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
  const laserDot = document.getElementById("deck-laser");

  let currentSlideIndex = 0;
  let activeTimeline = null;
  let ambientTween = null;
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

  if (isExportPdf) {
    slides.forEach((s) => s.classList.add("is-active"));
    return;
  }

  function scaleStage() {
    if (!stage) return;
    const scaleX = window.innerWidth / 1280;
    const scaleY = window.innerHeight / 720;
    stage.style.transform = `scale(${Math.min(scaleX, scaleY)})`;
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
        duration: 2.15,
        ease: "power2.out",
        onUpdate: () => {
          els.forEach((el) => {
            const target = parseFloat(el.dataset.countTo);
            const prefix = el.dataset.countPrefix || "";
            const suffix = el.dataset.countSuffix || "";
            const decimals = parseInt(el.dataset.countDecimals || "0", 10);
            const useComma = el.dataset.countComma === "true";
            let val = proxy.p * target;
            if (decimals === 0 && target >= 2 && proxy.p < 1) {
              val = Math.min(target - 1, Math.floor(val));
            }
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

  window.addEventListener("beforeprint", finalizeAllCounters);

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
        onComplete: () => window.gsap.set(el, { clearProps: "clipPath" }),
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

  // Structure-Targeted Motion Grammar + High-Impact Scientific Highlights
  function playSlideEntrance(slide) {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!window.gsap || prefersReduced || isStatic) return;

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

    // Slide 1 (Cover): Outer-to-Inner Hex Lattice Draw + Core Glow Charge/Discharge Cycle + Masked Title
    if (slideNum === 1) {
      const outerShapes = slide.querySelectorAll('.cover-hex-grid polygon:not([stroke="#E05A00"])');
      const centerHex = slide.querySelector('.cover-hex-grid polygon[stroke="#E05A00"]');
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
        }, 0.75);
      }
      if (centerCircle) {
        tl.to(centerCircle, {
          strokeDashoffset: 0,
          duration: 0.8,
          ease: "power2.inOut",
          onComplete: () => gsap.set(centerCircle, { clearProps: "strokeDasharray,strokeDashoffset" }),
        }, 0.95);
      }
      tl.fromTo(slide.querySelector(".cover-badge"), { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.65, ease: "power2.out" }, 0.1)
        .fromTo(
          coverTitle,
          { opacity: 0, y: 24, clipPath: "inset(0% 0% 100% 0%)" },
          {
            opacity: 1,
            y: 0,
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.95,
            ease: "power4.out",
            onComplete: () => gsap.set(coverTitle, { clearProps: "clipPath" }),
          },
          0.18
        )
        .fromTo(slide.querySelector(".cover-accent-rule"), { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.85, ease: "expo.out" }, 0.42)
        .fromTo(slide.querySelector(".cover-subtitle"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.72, ease: "power2.out" }, 0.52)
        .fromTo(slide.querySelectorAll(".cover-tag"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.09, ease: "back.out(1.4)" }, 0.64)
        .fromTo(slide.querySelector(".cover-footer"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.65 }, 0.78);
      if (coreNode) {
        tl.fromTo(coreNode, { scale: 0.3, transformOrigin: "center center", opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(2.2)" }, 1.05);
      }
      if (AMBIENT_FX.slide1HexChargeCycle && allHexCells.length) {
        // Ciclo morbido di respirazione termica (yoyo: true evita lo scatto brusco a fine ciclo)
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

        // Onda neutronica radiale continua (dal centro verso il vessel esterno)
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
          ambientTween.fromTo(
            coreGlow,
            { opacity: 0.55, scale: 0.9, transformOrigin: "center center" },
            { opacity: 1, scale: 1.14, duration: 1.8, yoyo: true, repeat: 1, ease: "sine.inOut" },
            0
          );
        }
        if (corePulse) {
          ambientTween.fromTo(
            corePulse,
            { scale: 1, opacity: 0.82, transformOrigin: "center center" },
            { scale: 3.1, opacity: 0, duration: 3.4, ease: "power2.out" },
            0
          );
        }
        if (coreNode) {
          ambientTween.fromTo(
            coreNode,
            { scale: 1, transformOrigin: "center center" },
            { scale: 1.18, duration: 1.6, yoyo: true, repeat: 1, ease: "sine.inOut" },
            0
          );
        }
      }
      return;
    }

    // Shared Masked Typographic Reveal for Header Takeaway
    const takeaway = slide.querySelector(".slide-header__takeaway");
    if (takeaway) {
      tl.fromTo(
        takeaway,
        { opacity: 0, y: 12, clipPath: "inset(0% 0% 100% 0%)" },
        {
          opacity: 1,
          y: 0,
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.68,
          ease: "power4.out",
          onComplete: () => gsap.set(takeaway, { clearProps: "clipPath" }),
        },
        0
      );
    }

    // Slide 2: 3-Col Mandate Drop + Parabolic Counters + Opposing Geometric Wipe Visuals
    if (slideNum === 2) {
      const tiles = slide.querySelectorAll(".mandate-tile");
      const figs = slide.querySelectorAll(".dual-visual .figure-card");
      const mini = slide.querySelector(".aurora-mini-card");
      tl.fromTo(tiles, { opacity: 0, y: -22 }, { opacity: 1, y: 0, duration: 0.68, stagger: 0.12, ease: "power3.out" }, 0.1);
      const c = animateCounters(slide);
      if (c) tl.add(c, 0.35);
      if (figs[0]) revealFigure(tl, figs[0], "inset(0% 100% 0% 0%)", 0.34);
      if (figs[1]) revealFigure(tl, figs[1], "inset(0% 0% 0% 100%)", 0.34);
      if (mini) tl.fromTo(mini, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.58, ease: "power2.out" }, 0.58);
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
      if (clad.length) tl.fromTo(clad, { opacity: 0, scale: 0.94, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: 0.55, ease: "power2.out" }, 0.24);
      if (na.length) tl.fromTo(na, { opacity: 0, scale: 0.9, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }, 0.36);
      if (slug.length) tl.fromTo(slug, { opacity: 0, scale: 0.84, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.4)" }, 0.46);
      if (plenum.length) tl.fromTo(plenum, { opacity: 0, scaleX: 0.6, transformOrigin: "left center" }, { opacity: 1, scaleX: 1, duration: 0.55, ease: "power2.out" }, 0.56);
      if (wire.length) tl.fromTo(wire, { opacity: 0 }, { opacity: 1, duration: 0.45 }, 0.64);
      if (leaders.length) {
        leaders.forEach((ln) => {
          const len = ln.getTotalLength ? ln.getTotalLength() : 90;
          gsap.set(ln, { strokeDasharray: len, strokeDashoffset: len });
        });
        tl.to(leaders, { strokeDashoffset: 0, duration: 0.55, stagger: 0.06, ease: "power2.out" }, 0.66);
      }
      if (callouts.length) tl.fromTo(callouts, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.025 }, 0.72);
      if (rows.length) tl.fromTo(rows, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.55, stagger: 0.1, ease: "power2.out" }, 0.22);
      if (bullets.length) tl.fromTo(bullets, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: "power2.out" }, 0.6);
      return;
    }

    // Slide 4: 3D Phase Domino + Isotropic Glow + Parabolic Expo Bars + Mini-Card + Diagram
    if (slideNum === 4) {
      const nodes = slide.querySelectorAll(".phase-node");
      const isoNode = slide.querySelector(".phase-node--iso");
      const arrows = slide.querySelectorAll(".phase-arrow");
      const bars = slide.querySelectorAll(".bar-fill");
      const mini = slide.querySelector(".prop-mini-card");
      const bullets = slide.querySelectorAll(".bullet-list li");
      const fig = slide.querySelector(".figure-card");
      if (isoNode) isoNode.classList.remove("is-lit");
      tl.fromTo(nodes, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.58, stagger: 0.1, ease: "power3.out" }, 0.12)
        .fromTo(arrows, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.35, stagger: 0.1, ease: "power2.out" }, 0.18);
      bars.forEach((b, i) => {
        const targetW = b.getAttribute("width");
        if (targetW) {
          tl.fromTo(b, { attr: { width: 0 } }, { attr: { width: Number(targetW) }, duration: 1.4, ease: "expo.out" }, 0.38 + i * 0.18);
        } else {
          tl.fromTo(b, { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 1.4, ease: "expo.out" }, 0.38 + i * 0.18);
        }
      });
      if (isoNode) tl.call(() => isoNode.classList.add("is-lit"), null, 0.78);
      if (mini) tl.fromTo(mini, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.52);
      if (bullets.length) tl.fromTo(bullets, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.58, stagger: 0.12, ease: "power2.out" }, 0.6);
      if (fig) revealFigure(tl, fig, "inset(0% 0% 0% 100%)", 0.28);
      if (AMBIENT_FX.slide4PhaseWave && nodes.length) {
        ambientTween = gsap.timeline({ repeat: -1, repeatDelay: 5.5, delay: 2.0 });
        nodes.forEach((n, i) => {
          ambientTween.to(n, { borderColor: "#E05A00", y: -2, duration: 0.35, yoyo: true, repeat: 1, ease: "sine.inOut" }, i * 0.24);
        });
      }
      return;
    }

    // Slide 5: Left-to-Right 3-Stage Manufacturing Flow + Dual Bottom Panels
    if (slideNum === 5) {
      const steps = slide.querySelectorAll(".pipe-step");
      const figs = slide.querySelectorAll(".dual-panel-row .figure-card");
      if (steps.length) tl.fromTo(steps, { opacity: 0, x: -36 }, { opacity: 1, x: 0, duration: 0.68, stagger: 0.18, ease: "power3.out" }, 0.14);
      if (figs[0]) revealFigure(tl, figs[0], "inset(100% 0% 0% 0%)", 0.36);
      if (figs[1]) revealFigure(tl, figs[1], "inset(100% 0% 0% 0%)", 0.48);
      return;
    }

    // Slide 6: SEM/EDS Wipe Left + Sequential A -> B -> C -> D with Elastic Dot Pop
    if (slideNum === 6) {
      const fig = slide.querySelector(".figure-card");
      const items = slide.querySelectorAll(".step-item");
      const dots = slide.querySelectorAll(".step-item__dot");
      if (fig) revealFigure(tl, fig, "inset(0% 100% 0% 0%)", 0.14);
      if (items.length) tl.fromTo(items, { opacity: 0, x: 26 }, { opacity: 1, x: 0, duration: 0.64, stagger: 0.15, ease: "power2.out" }, 0.2);
      if (dots.length) tl.fromTo(dots, { scale: 0 }, { scale: 1, duration: 0.55, stagger: 0.15, ease: "back.out(2)" }, 0.26);
      if (AMBIENT_FX.slide6StepWave && dots.length) {
        ambientTween = gsap.timeline({ repeat: -1, repeatDelay: 5.5, delay: 2.0 });
        dots.forEach((d, i) => {
          ambientTween.to(d, { scale: 1.24, boxShadow: "0 0 12px rgba(224,90,0,0.65)", duration: 0.4, yoyo: true, repeat: 1, ease: "sine.inOut" }, i * 0.32);
        });
      }
      return;
    }

    // Slide 7: Alert Banner + Shimmer + Thermal Pulse + Causal Chain 01->02->03
    if (slideNum === 7) {
      const banner = slide.querySelector(".alert-banner");
      const metric = slide.querySelector(".alert-banner__metric");
      const cards = slide.querySelectorAll(".chain-card");
      const critical = slide.querySelector(".chain-card--critical");
      const fig = slide.querySelector(".figure-card");
      if (metric) metric.classList.remove("is-pulsing");
      if (banner) {
        tl.fromTo(banner, { scaleX: 0.85, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.68, ease: "power3.out" }, 0.08);
        triggerShimmer(tl, banner, 0.72);
      }
      if (cards.length) tl.fromTo(cards, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.62, stagger: 0.15, ease: "power2.out" }, 0.22);
      if (fig) revealFigure(tl, fig, "inset(0% 0% 0% 100%)", 0.26);
      if (critical) {
        tl.fromTo(
          critical,
          { boxShadow: "inset 0 0 0 0 rgba(194,65,12,0)" },
          { boxShadow: "inset 6px 0 0 0 #C2410C, 0 0 0 2px rgba(194,65,12,0.28)", duration: 0.7, ease: "power2.out" },
          0.78
        );
      }
      if (metric && AMBIENT_FX.slide7Thermal) tl.call(() => metric.classList.add("is-pulsing"), null, 0.9);
      return;
    }

    // Slide 8: Symmetric 4-Row Comparison Matrix + HT9 Summary Emerald Pulse + Dual Stacked Plots
    if (slideNum === 8) {
      const matrix = slide.querySelector(".compare-matrix-wrap");
      const rows = slide.querySelectorAll(".compare-matrix tbody tr");
      const caps = slide.querySelectorAll(".compare-summary-2 > div");
      const ht9 = slide.querySelector(".compare-cap-card--ht9");
      const plots = slide.querySelectorAll(".stacked-figs-2 .figure-card");
      if (ht9) ht9.classList.remove("is-pulsing");
      if (matrix) tl.fromTo(matrix, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, 0.1);
      if (rows.length) tl.fromTo(rows, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.48, stagger: 0.09, ease: "power2.out" }, 0.22);
      if (caps.length) tl.fromTo(caps, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: "power2.out" }, 0.52);
      if (plots[0]) revealFigure(tl, plots[0], "inset(0% 0% 0% 100%)", 0.28);
      if (plots[1]) revealFigure(tl, plots[1], "inset(0% 0% 0% 100%)", 0.42);
      if (ht9) {
        triggerShimmer(tl, ht9, 0.78);
        if (AMBIENT_FX.slide8Emerald) tl.call(() => ht9.classList.add("is-pulsing"), null, 0.85);
      }
      return;
    }

    // Slide 9: 4-KPI Hero Drop + Parabolic Expo Counters + Converging Bottom Split
    if (slideNum === 9) {
      const kpis = slide.querySelectorAll(".kpi-card");
      const fig = slide.querySelector(".figure-card");
      const bullets = slide.querySelectorAll(".bullet-list li");
      if (kpis.length) {
        tl.fromTo(kpis, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.56, stagger: 0.07, ease: "power3.out" }, 0.08);
        const c = animateCounters(slide);
        if (c) tl.add(c, 0.32);
      }
      if (fig) revealFigure(tl, fig, "inset(0% 100% 0% 0%)", 0.32);
      if (bullets.length) tl.fromTo(bullets, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.6, stagger: 0.13, ease: "power2.out" }, 0.38);
      return;
    }

    // Slide 10: 4-Corner Diagonal Convergence + Animated Physical Mechanism SVGs
    if (slideNum === 10) {
      const cards = slide.querySelectorAll(".bento-card");
      const offsets = [
        { x: -26, y: -18 },
        { x: 26, y: -18 },
        { x: -26, y: 18 },
        { x: 26, y: 18 },
      ];
      cards.forEach((card, i) => {
        const off = offsets[i] || { x: 0, y: 18 };
        tl.fromTo(card, { opacity: 0, x: off.x, y: off.y }, { opacity: 1, x: 0, y: 0, duration: 0.7, ease: "power3.out" }, 0.12 + i * 0.1);
      });

      const fluxL = slide.querySelector(".lever-svg--barrier .svg-flux-left");
      const fluxR = slide.querySelector(".lever-svg--barrier .svg-flux-right");
      const shield = slide.querySelector(".lever-svg--barrier .svg-barrier-shield");
      const blockedLbl = slide.querySelector(".lever-svg--barrier .svg-blocked-lbl");
      if (fluxL) tl.fromTo(fluxL, { x: -24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, 0.55);
      if (fluxR) tl.fromTo(fluxR, { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, 0.55);
      if (shield) tl.fromTo(shield, { scaleY: 0, transformOrigin: "center center" }, { scaleY: 1, duration: 0.5, ease: "power2.out" }, 0.5);
      if (blockedLbl) tl.fromTo(blockedLbl, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.45 }, 0.85);

      const traps = slide.querySelectorAll(".lever-svg--dopants .svg-trap");
      const lnBonds = slide.querySelectorAll(".lever-svg--dopants .svg-ln-bond");
      if (traps.length) tl.fromTo(traps, { scale: 0.4, transformOrigin: "center center", opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: "back.out(1.7)" }, 0.55);
      if (lnBonds.length) tl.fromTo(lnBonds, { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.48, stagger: 0.1, ease: "power2.out" }, 0.72);

      const annRings = slide.querySelectorAll(".lever-svg--annular .svg-ann-ring");
      const annLines = slide.querySelectorAll(".lever-svg--annular .svg-ann-line");
      const annLbls = slide.querySelectorAll(".lever-svg--annular .svg-ann-lbl");
      if (annRings.length) tl.fromTo(annRings, { scale: 0.3, transformOrigin: "center center", opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, stagger: 0.08, ease: "back.out(1.4)" }, 0.62);
      if (annLines.length) tl.fromTo(annLines, { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.45, stagger: 0.07 }, 0.8);
      if (annLbls.length) tl.fromTo(annLbls, { opacity: 0, x: 8 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.07 }, 0.88);

      const disloc = slide.querySelector(".lever-svg--ods .svg-dislocation");
      const oxides = slide.querySelectorAll(".lever-svg--ods .svg-oxide");
      const heDots = slide.querySelectorAll(".lever-svg--ods .svg-he");
      if (oxides.length) tl.fromTo(oxides, { scale: 0, transformOrigin: "center center" }, { scale: 1, duration: 0.45, stagger: 0.07, ease: "back.out(2)" }, 0.68);
      if (disloc) {
        const len = disloc.getTotalLength ? disloc.getTotalLength() : 360;
        gsap.set(disloc, { strokeDasharray: len, strokeDashoffset: len });
        tl.to(disloc, { strokeDashoffset: 0, duration: 0.8, ease: "power2.out" }, 0.78);
      }
      if (heDots.length) tl.fromTo(heDots, { scale: 0, opacity: 0, transformOrigin: "center center" }, { scale: 1, opacity: 1, duration: 0.4, stagger: 0.08, ease: "back.out(2)" }, 0.98);
      if (AMBIENT_FX.slide10MicroLoops) {
        ambientTween = gsap.timeline({ repeat: -1, repeatDelay: 5.5, delay: 2.2 });
        if (fluxL) ambientTween.to(fluxL, { x: 4, duration: 0.5, yoyo: true, repeat: 1, ease: "power1.inOut" }, 0);
        if (traps.length) ambientTween.to(traps, { scale: 1.08, transformOrigin: "center center", duration: 0.55, stagger: 0.12, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.2);
        if (oxides.length) ambientTween.to(oxides, { scale: 1.25, transformOrigin: "center center", duration: 0.5, stagger: 0.1, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.4);
      }
      return;
    }

    // Slide 11: Trade-Off Table Header + Row Cascade + Color-Coded Bars + Target Shimmer
    if (slideNum === 11) {
      const thead = slide.querySelector(".tradeoff-table thead");
      const rows = slide.querySelectorAll(".tradeoff-table tbody tr");
      const summaryCards = slide.querySelectorAll(".tradeoff-summary-card");
      const foot = slide.querySelector(".table-footnote");
      if (thead) {
        tl.fromTo(
          thead,
          { opacity: 0, y: -10, clipPath: "inset(0% 100% 0% 0%)" },
          { opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 0.48, ease: "power3.out", clearProps: "clipPath,opacity,transform" },
          0.08
        );
      }
      if (rows.length) {
        tl.fromTo(
          rows,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.48, stagger: 0.08, ease: "power3.out", clearProps: "opacity,transform" },
          0.18
        );
      }
      if (summaryCards.length) {
        tl.fromTo(
          summaryCards,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.48, stagger: 0.1, ease: "power3.out", clearProps: "opacity,transform" },
          0.52
        );
      }
      if (foot) tl.fromTo(foot, { opacity: 0 }, { opacity: 1, duration: 0.45, clearProps: "opacity" }, 0.72);
      return;
    }

    // Slide 12: Inline Roadmap Stage 1 -> R&D Bridge -> Stage 2 + 3 Decision Cards
    if (slideNum === 12) {
      const fig = slide.querySelector(".figure-card");
      const st1 = slide.querySelector(".s12-stage1");
      const bridgeLine = slide.querySelector(".s12-bridge-line");
      const bridgePill = slide.querySelector(".s12-bridge-pill");
      const st2 = slide.querySelector(".s12-stage2");
      const boxes = slide.querySelectorAll(".decision-box");
      const stage1Card = slide.querySelector(".decision-box--green");

      if (fig) revealFigure(tl, fig, "inset(0% 100% 0% 0%)", 0.08);
      if (st1) tl.fromTo(st1, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.58, ease: "power3.out" }, 0.28);
      if (bridgeLine) {
        const len = bridgeLine.getTotalLength ? bridgeLine.getTotalLength() : 70;
        gsap.set(bridgeLine, { strokeDasharray: len, strokeDashoffset: len });
        tl.to(bridgeLine, { strokeDashoffset: 0, duration: 0.5, ease: "power2.out" }, 0.58);
      }
      if (bridgePill) tl.fromTo(bridgePill, { scale: 0.85, opacity: 0, transformOrigin: "center center" }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.6)" }, 0.65);
      if (st2) tl.fromTo(st2, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.58, ease: "power3.out" }, 0.78);
      if (boxes.length) tl.fromTo(boxes, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.64, stagger: 0.16, ease: "power3.out" }, 0.28);
      if (stage1Card) triggerShimmer(tl, stage1Card, 0.95);
      const bridgePulse = slide.querySelector(".s12-bridge-pulse");
      if (AMBIENT_FX.slide12BridgePulse && bridgePulse) {
        ambientTween = gsap.timeline({ repeat: -1, repeatDelay: 5.0, delay: 2.0 });
        ambientTween.fromTo(bridgePulse, { y: 0, opacity: 0 }, { opacity: 1, duration: 0.25 }, 0)
          .to(bridgePulse, { y: 60, duration: 1.35, ease: "power1.inOut" }, 0.1)
          .to(bridgePulse, { opacity: 0, duration: 0.25 }, 1.3);
      }
      return;
    }

    // Slide 13: Categorized Two-Card Verified References Cascade
    if (slideNum === 13) {
      const cards = slide.querySelectorAll(".ref-card");
      const refs = slide.querySelectorAll(".ref-item");
      if (cards.length) tl.fromTo(cards, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.56, stagger: 0.14, ease: "power3.out" }, 0.08);
      if (refs.length) tl.fromTo(refs, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.42, stagger: 0.045, ease: "power2.out" }, 0.22);
      return;
    }

    // Slide 14: Closing Title + SVG Accent Rule Stroke-Draw + Subtle Symmetric Core Halo
    if (slideNum === 14) {
      const title = slide.querySelector(".thankyou-title");
      const sub = slide.querySelector(".thankyou-sub");
      const contact = slide.querySelector(".thankyou-contact");
      const disclosure = slide.querySelector(".ai-disclosure");
      const ruleLine = slide.querySelector(".thankyou-rule line");
      const closingHex = slide.querySelector(".closing-hex-watermark");
      const closingGlow = slide.querySelector(".closing-glow-circle");
      if (closingHex) tl.fromTo(closingHex, { opacity: 0, scale: 0.9 }, { opacity: 0.42, scale: 1, duration: 1.2, ease: "power2.out" }, 0.05);
      if (title) tl.fromTo(title, { opacity: 0, scale: 0.94, y: 14 }, { opacity: 1, scale: 1, y: 0, duration: 0.78, ease: "power3.out" }, 0.1);
      if (ruleLine) {
        const len = ruleLine.getTotalLength ? ruleLine.getTotalLength() : 220;
        gsap.set(ruleLine, { strokeDasharray: len, strokeDashoffset: len });
        tl.to(ruleLine, { strokeDashoffset: 0, duration: 0.95, ease: "expo.out" }, 0.34);
      }
      if (sub) tl.fromTo(sub, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.58, ease: "power2.out" }, 0.48);
      if (contact) tl.fromTo(contact, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, 0.62);
      if (disclosure) tl.fromTo(disclosure, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.68, ease: "power2.out" }, 0.76);
      if (AMBIENT_FX.slide14ClosingHalo && closingGlow) {
        ambientTween = gsap.fromTo(
          closingGlow,
          { opacity: 0.45, scale: 0.92, transformOrigin: "center center" },
          { opacity: 1, scale: 1.1, duration: 3.4, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1.5 }
        );
      }
      return;
    }
  }

  let leavingTween = null;

  function showSlide(index) {
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    const prevIndex = currentSlideIndex;
    const incoming = slides[clamped];
    const outgoing = prevIndex !== clamped ? slides[prevIndex] : null;
    const direction = clamped >= prevIndex ? 1 : -1;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (leavingTween) {
      leavingTween.kill();
      leavingTween = null;
    }
    if (prevIndex !== clamped) {
      finalizeAllCounters();
    }

    slides.forEach((s) => {
      if (s !== incoming && s !== outgoing) {
        s.classList.remove("is-active", "is-leaving");
        if (window.gsap) window.gsap.set(s, { clearProps: "opacity,x,transform" });
      }
    });

    if (outgoing && window.gsap && !prefersReduced && !isStatic) {
      outgoing.classList.remove("is-active");
      outgoing.classList.add("is-leaving");
      leavingTween = window.gsap.to(outgoing, {
        opacity: 0,
        x: -36 * direction,
        duration: 0.38,
        ease: "power2.in",
        onComplete: () => {
          outgoing.classList.remove("is-leaving");
          window.gsap.set(outgoing, { clearProps: "opacity,x,transform" });
          leavingTween = null;
        },
      });
    } else if (outgoing) {
      outgoing.classList.remove("is-active", "is-leaving");
    }

    incoming.classList.remove("is-leaving");
    incoming.classList.add("is-active");

    if (outgoing && window.gsap && !prefersReduced && !isStatic) {
      window.gsap.fromTo(
        incoming,
        { opacity: 0, x: 36 * direction },
        {
          opacity: 1,
          x: 0,
          duration: 0.48,
          ease: "power3.out",
          onComplete: () => window.gsap.set(incoming, { clearProps: "x,transform" }),
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
      if (window.gsap && !prefersReduced && !isStatic) {
        window.gsap.to(progressFill, { width: `${pct}%`, duration: 0.65, ease: "expo.out" });
      } else {
        progressFill.style.width = `${pct}%`;
      }
    }
    window.location.hash = `slide-${clamped + 1}`;
    playSlideEntrance(incoming);
  }

  function nextSlide() {
    if (currentSlideIndex < slides.length - 1) showSlide(currentSlideIndex + 1);
  }

  function prevSlide() {
    if (currentSlideIndex > 0) showSlide(currentSlideIndex - 1);
  }

  // ---- Interactive Feature 1: Pointer-Reactive Card Sheen ----
  document.querySelectorAll(".mandate-tile, .kpi-card, .bento-card, .decision-box, .col-panel, .pipe-step, .figure-card, .aurora-mini-card, .prop-mini-card").forEach((card) => {
    card.classList.add("reactive-card");
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--my", `${e.clientY - rect.top}px`);
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
        showSlide(idx);
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

  // ---- Interactive Feature 3: Click-to-Zoom Q&A Figure Lightbox ----
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
    card.addEventListener("click", () => openLightbox(card));
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

  // ---- Interactive Feature 5: Shortcuts Cheat Sheet (?) ----
  function toggleShortcuts(forceState) {
    if (!shortcutsModal) return;
    const open = typeof forceState === "boolean" ? forceState : !shortcutsModal.classList.contains("is-open");
    closeOverlays(open ? "shortcuts" : null);
    if (open) {
      shortcutsModal.classList.add("is-open");
      shortcutsModal.setAttribute("aria-hidden", "false");
    }
  }

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

  // ---- Interactive Feature 6: Slide 3 / 11 / 12 Cross-Highlighting ----
  const s03Layers = document.querySelectorAll(".s03-inline-svg .s03-layer");
  document.querySelectorAll(".spec-sheet tbody tr[data-pin-target]").forEach((row) => {
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

  lightboxClose?.addEventListener("click", () => closeOverlays());
  lightboxModal?.addEventListener("click", (e) => {
    if (e.target === lightboxModal) closeOverlays();
  });
  shortcutsModal?.addEventListener("click", (e) => {
    if (e.target === shortcutsModal) closeOverlays();
  });

  window.addEventListener("resize", scaleStage);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (isLaserActive) toggleLaser(false);
      clearTradeTableFocus();
      closeOverlays();
      return;
    }
    if (["ArrowRight", "ArrowUp", " ", "PageDown"].includes(e.key)) {
      e.preventDefault();
      closeOverlays();
      nextSlide();
    } else if (["ArrowLeft", "ArrowDown", "PageUp"].includes(e.key)) {
      e.preventDefault();
      closeOverlays();
      prevSlide();
    } else if (e.key === "Home") {
      e.preventDefault();
      closeOverlays();
      showSlide(0);
    } else if (e.key === "End") {
      e.preventDefault();
      closeOverlays();
      showSlide(slides.length - 1);
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
      showSlide(parseInt(e.key, 10) - 1);
    }
  });

  const hashMatch = window.location.hash.match(/^#slide-(\d+)$/);
  const initialIndex = hashMatch ? parseInt(hashMatch[1], 10) - 1 : 0;
  scaleStage();
  showSlide(initialIndex);
})();
