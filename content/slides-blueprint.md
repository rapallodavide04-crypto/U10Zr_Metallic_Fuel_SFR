# Slides Blueprint — U-10Zr Metallic Fuel for Sodium Fast Reactors

> **Status:** Locked definitive slide copy & layout mapping (Ferraris Slide 4 template + Scisci trade-off model).

## Fixed Layout Rules (Ferraris Slide 4)
- **Fixed Header (Slides 2–14):** `U-10Zr Metallic Fuel for Sodium Fast Reactors`
- **Dynamic Subtitle:** Single-sentence key message of the slide (English)
- **Fixed Footer (Slides 2–14):** `Davide Rapallo – s324486@studenti.polito.it` | `Oklo Inc. (Simulated Case Study)` | `[Logo PoliTo]` | `Slide X / 14`

---

## SLIDE 1 — Cover
- **`[CENTRO]` Title:** `U-10Zr Metallic Fuel for Sodium Fast Reactors`
- **`[CENTRO]` Subtitle:** `Materials Selection, Degradation Mechanisms & Cladding Trade-Off`
- **`[BASSO SINISTRA / DESTRA]` Metadata:**
  - `01TVMXY / 01TVMND – Advanced Materials for Nuclear Applications (A.Y. 2026/27)`
  - `Davide Rapallo (s324486@studenti.polito.it) | Role-Play: Fuel Materials R&D – Oklo Inc.`
- **`[SFONDO / LATO]` Visual:** Official Oklo Aurora Powerhouse rendering (or INL A3F), clean, low opacity.

---

## SLIDE 2 — Industrial Mandate & Operating Envelope
- **`[SOTTOTITOLO — MESSAGGIO]`:** *Oklo’s Aurora SFR targets high burnup at 400–650 °C and 100–200 dpa, leveraging metallic fuel’s high fissile density.*
- **`[SINISTRA — 52%]` Visual:** 3D map by Zinkle, Was, Petti & Ukai (*Temperature vs dpa vs corrosion*) with highlighted **SFR** box (+ small INL Aurora Fuel Fabrication Facility A3F thumbnail in bottom-right of figure).
  - *Asset:* `assets/figures/s02-zinkle-was-3d.png` + `assets/branding/oklo-aurora.png`
  - *Caption:* `Adapted from Was et al., J. Nucl. Mater. 527 (2019) 151837; INL A3F facility (2025).`
- **`[DESTRA — 48%]` Text (4 concise bullets):**
  - **Company Mandate:** Select optimal fuel–cladding system for Oklo’s pool-type Aurora SFR (15–75 MWe).
  - **Why Metallic Fuel:** `~14.4 g_HM/cm³` (`16.0–16.2 g/cm³` alloy at 20 °C; `15.5` at 650 °C → `~50%` higher HM density than UO2/MOX `~9.7 g_HM/cm³`) and passive negative reactivity feedback.
  - **Core Operating Envelope:** Peak cladding temperature $\le 650\,^\circ\text{C}$, fast neutron dose $100\text{--}200\text{ dpa}$, benign $\text{Na}$ corrosion.
  - **Qualification Basis:** Legacy EBR-II/FFTF data framed under USNRC `NUREG-2246` & `NUREG/CR-7305`.

---

## SLIDE 3 — Reference Fuel Pin Architecture
- **`[SOTTOTITOLO — MESSAGGIO]`:** *A 75% smeared-density U-10Zr slug with liquid Na bond and HT9 cladding decouples swelling from early mechanical stress.*
- **`[SINISTRA — 52%]` Visual:** Clean vector longitudinal + radial sectional schematic ($\text{U-10Zr}$ slug, Na-bond gap, $\text{HT9}$ cladding, plenum, helical wire-wrap).
  - *Asset:* `assets/schematics/s03-fuel-pin-cross-section.svg`
  - *Caption:* `Author’s schematic based on reference parameters in USNRC NUREG/CR-7305 (2023).`
- **`[DESTRA — 48%]` Text (mini-table + 2 bullets):**
  - *Mini-Table `NUREG/CR-7305` Reference Pin:*
    - `Fuel / Bond / Cladding:` $\text{U-10wt\%Zr}$ / Liquid $\text{Na}$ / $\text{HT9}$
    - `Fuel OD / Cladding OD:` $5.0\text{ mm}$ / $6.9\text{ mm}$ ($0.6\text{ mm}$ wall)
    - `Smeared Density / Plenum:` $75\%$ max / $1.4\times$ fuel volume
    - `BOL Peak LHGR / Burnup:` $40\text{--}55\text{ kW/m}$ / $10\text{ at\%}$ envelope
  - **Thermal Design Role:** Liquid $\text{Na}$ bond minimizes BOL fuel $\Delta T$; $75\%$ smear density leaves space for early swelling.
  - **Interface Limit:** Steady-state PICT capped at **$650\,^\circ\text{C}$** to limit creep, FCCI, and liquefaction.

---

## SLIDE 4 — U-10Zr Metallurgy & Phase Behavior
- **`[SOTTOTITOLO — MESSAGGIO]`:** *Adding 10 wt% Zr raises the solidus well above 1200 °C and stabilizes BCC γ-phase, despite complex solid-state transitions.*
- **`[SINISTRA — 52%]` Visual:** Binary $\text{U–Zr}$ phase diagram with highlighted vertical dashed line at $\text{U-10wt\%Zr}$ ($\sim 22\text{ at\% Zr}$).
  - *Asset:* `assets/figures/s04-u-zr-phase-diagram.png`
  - *Caption:* `U–Zr binary phase diagram, Yao et al., Front. Nucl. Eng. 1 (2023) 1050262.`
- **`[DESTRA — 48%]` Text (mini-table + 3 bullets):**
  - *Mini-Table `U-10Zr` vs `MOX`:*
    - `As-cast density:` $15.5\text{--}16.2\text{ g/cm}^3$ vs $\sim 10.9\text{ g/cm}^3$
    - `Thermal conductivity:` $\sim 32\text{ W/(m}\cdot\text{K)}$ vs $\sim 2\text{--}4\text{ W/(m}\cdot\text{K)}$
  - **Role of 10 wt% Zr:** Raises solidus to $\sim 1248\,^\circ\text{C}$ ($1521\text{ K}$) / liquidus $\sim 1355\text{--}1360\,^\circ\text{C}$ (lowest U–Zr solidus $>1100\,^\circ\text{C}$ vs $1135\,^\circ\text{C}$ pure U) and slows U–Fe interdiffusion.
  - **Sub-Solidus Transitions:** $\alpha\text{-U}+\delta\text{-UZr}_2 \xrightarrow{617\,^\circ\text{C}} \alpha+\gamma_2 \xrightarrow{662\,^\circ\text{C}} \beta+\gamma_2 \xrightarrow{693\,^\circ\text{C}} \beta+\gamma_1 \xrightarrow{>693\text{--}715\,^\circ\text{C}} \gamma\text{-bcc}$.
  - **Isotropy Advantage:** High-temperature **$\gamma$-BCC** phase resists anisotropic irradiation growth seen in orthorhombic $\alpha$-U.

---

## SLIDE 5 — Fabrication, Na-Bonding & Joining
- **`[SOTTOTITOLO — MESSAGGIO]`:** *Injection casting, Na-bond inspection, and HT9 end-cap welding with PWHT govern as-built pin integrity.*
- **`[SINISTRA — 50%]` Visual:** Pin fabrication flow (*PNNL-35642* / *Carmack 2009*) paired with TIG end-plug weld schematic (`IAEA-TECDOC-1689`, Fig. 3.4).
  - *Asset:* `assets/figures/s05-fabrication-tig-weld.png`
  - *Caption:* `Adapted from IAEA-TECDOC-1689 (2013) Fig. 3.4 and PNNL-35642 (2024).`
- **`[DESTRA — 50%]` Text (3 concise blocks):**
  - **Slug Casting vs Extrusion:** Vacuum *injection casting* in quartz molds (EBR-II heritage) vs hot extrusion to avoid mold waste.
  - **HT9 Cladding & Na-Bonding:** VIM $\to$ extrusion $\to$ cold drawing (normalized $\sim 1050\,^\circ\text{C}$ + tempered $\sim 750\,^\circ\text{C}$); molten $\text{Na}$ centrifuged & UT-inspected against voids.
  - **End-Cap Joining (Critical):** GTAW/TIG or Pressure Resistance Welding (RPW); **PWHT required** in HT9 to temper hard, brittle martensite in HAZ.

---

## SLIDE 6 — In-Pile Fuel Evolution: Swelling, FGR & Zr Migration
- **`[SOTTOTITOLO — MESSAGGIO]`:** *Interconnected gas porosity vents ~70–80% of fission gas at ~30% swelling, while thermal gradients drive radial Zr redistribution.*
- **`[SINISTRA — 55%]` Visual:** Irradiated $\text{U-10Zr}$ (`3.3% FIMA`) cross-section SEM + $\text{U, Zr, Si, Nd}$ EDS maps (Yao et al., 2023, Fig. 11).
  - *Asset:* `assets/figures/s06-swelling-zr-redistribution.webp`
  - *Caption:* `Irradiated U-10Zr (3.3% FIMA) cross-section & SEM-EDS maps, Yao et al., Front. Nucl. Eng. 1 (2023) 1050262.`
- **`[DESTRA — 45%]` Text (4 concise bullets):**
  - **Early Gas Swelling:** Rapid expansion ($\sim 30\text{--}33\%$ vol.) closes the initial gap without excessive FCMI.
  - **Fission Gas Release (FGR):** Interconnected porosity forms and vents **$\sim 70\text{--}80\%$ of fission gas** into the plenum.
  - **Na Infiltration:** Liquid $\text{Na}$ enters open pores—preserving thermal conductivity, but creating fast transport paths for lanthanides.
  - **Radial Zr Redistribution:** Thermal gradient pushes $\text{Zr}$ to hot center ($\gamma$-phase) and outer rim, leaving a Zr-depleted mid-radius zone.

---

## SLIDE 7 — Fuel-Cladding Chemical Interaction (FCCI) & Eutectic Melting
- **`[SOTTOTITOLO — MESSAGGIO]`:** *Lanthanides migrate via Na-filled pores to thin HT9 cladding and risk U–Fe eutectic liquefaction above ~725 °C.*
- **`[DESTRA — 45%]` Visual:** Optical metallograph of FCCI and CCCI wastage layers in EBR-II `X447/A` pin `DP04` (`ANL/CFCT-21/19`, Fig. 2-1) with 4-layer legend (`CCCI CD`, `Unaffected HT9`, `FCCI CD`, `FCCI FP`).
  - *Asset:* `assets/figures/s07-fcci-ebr2-eds.png`
  - *Caption:* `Optical metallograph of FCCI and CCCI wastage layers in EBR-II X447/A pin DP04, Miao et al., ANL/CFCT-21/19 (2021).`
- **`[DESTRA — 45%]` Text (3 concise bullets):**
  - **Lanthanide Attack:** Fission-product lanthanides ($\text{Nd, Ce, La, Pr}$) migrate to the cladding ID and form brittle $\text{Ln–Fe}$ intermetallics.
  - **Cladding Wastage:** $\text{Cr/Fe}$ outward interdiffusion leaves a weak, thinned load-bearing wall (limiting lifetime at $T>600\,^\circ\text{C}$).
  - **Eutectic Liquefaction:** $\text{U}_6\text{Fe}$ and $\text{UFe}_2$ form a low-melting **$\text{U–Fe}$ eutectic at $\sim 725\,^\circ\text{C}$**, causing rapid cladding breach during transients.

---

## SLIDE 8 — Cladding Metallurgy: FCC Austenitics vs BCC F/M (HT9)
- **`[SOTTOTITOLO — MESSAGGIO]`:** *BCC HT9 suppresses void swelling (<2% at 200 dpa) via low dislocation bias, trading off low-T DBTT shift and >650 °C creep limits.*
- **`[SINISTRA — 52%]` Visual:** Experimental Charpy $\Delta\text{DBTT}$ curves for **HT9** pre/post FFTF irradiation (`ORNL/TM-2004/176`, Fig. 4 / `IAEA-TECDOC-1689`) + `316SS` vs `HT9` strain/swelling comparison (`ANL/CFCT-21/19`).
  - *Asset:* `assets/figures/s08-ht9-dbtt-swelling.png`
  - *Caption:* `Charpy impact shift of FFTF-irradiated HT9, Klueh, ORNL/TM-2004/176 (2004).`
- **`[DESTRA — 48%]` Text (4 concise bullets):**
  - **HT9 Chemistry (wt%):** `Fe–12Cr–1Mo–0.5W–0.5Ni–0.3V–0.2C` tempered martensite (BCC) vs austenitic `316SS/D9` (FCC).
  - **Void Swelling:** FCC austenitics swell steeply after incubation; **BCC HT9 stays $<2\%$ at $200\text{ dpa}$ ($400\text{--}420\,^\circ\text{C}$)** via high lath sink density.
  - **Low-T Embrittlement:** Below $\sim 400\,^\circ\text{C}$ ($T < 0.4\,T_m$), hardening + Cr-rich $\alpha'$ ($>9\text{ wt\% Cr}$) drive **$\Delta\text{DBTT}\approx +155\,^\circ\text{C}$**, saturating by $5\text{--}10\text{ dpa}$ ($10$ & $17\text{ dpa}$ overlap).
  - **Creep Ceiling:** Rapid loss of thermal creep-rupture strength above **$600\text{--}650\,^\circ\text{C}$** ($\sim 60\text{ MPa}$ at $10^5\text{ h}/600\,^\circ\text{C}$).

---

## SLIDE 9 — Legacy Irradiation Database (EBR-II & FFTF)
- **`[SOTTOTITOLO — MESSAGGIO]`:** *Over 1,260 U-10Zr/HT9 pins tested to 14–20 at% burnup prove steady-state reliability and bound failure thresholds.*
- **`[SINISTRA — 52%]` Visual:** Experimental HT9 cladding diametral profilometry on EBR-II `X447/A` pins (`ANL/CFCT-21/19`, Fig. 2-16/2-17) or EBR-II/FFTF database summary.
  - *Asset:* `assets/figures/s09-ebr2-x447-strain.png`
  - *Caption:* `HT9 cladding profilometry vs model (EBR-II X447/A), Miao et al., ANL/CFCT-21/19 (2021).`
- **`[DESTRA — 48%]` Text (4 concise bullets):**
  - **Massive US Heritage:** $>130{,}000$ metallic pins irradiated overall; **`NUREG/CR-7305` qualifies 1,262 $\text{U-10Zr/HT9}$ rods** (404 EBR-II + 858 FFTF).
  - **Proven Burnup:** Reached $\sim 14\text{ at\%}$ ($143\text{ GWd/MTHM}$) in FFTF and **$>17\text{--}20\text{ at\%}$** in EBR-II with low cladding strain.
  - **Strain Reliability:** Zero strain-induced breaches for $\le 75\%$ smear density below $17\text{ at\%}$ burnup ($370\text{--}615\,^\circ\text{C}$).
  - **Failure Boundary:** Breaches in EBR-II `X447` occurred at **$660\,^\circ\text{C}$** at top of fuel column ($z/L \approx 1.0$) due to combined FCCI thinning and thermal creep.

---

## SLIDE 10 — Advanced Mitigation Levers
- **`[SOTTOTITOLO — MESSAGGIO]`:** *Four material engineering strategies target FCCI elimination, sodium-bond waste, and the 650 °C HT9 creep limit.*
- **`[GRIGLIA 2×2 PULITA]` Four compact cards (icon/thumbnail + max 2 lines each):**
  1. **Internal Anti-FCCI Barriers:** Co-extruded **$\text{Zr}$ liner** or thin $\text{V/Cr/TiN}$ inner coating blocks $\text{Ln–Fe}$ and $\text{U–Fe}$ interdiffusion.
  2. **Fuel Dopants ($\text{Pd, Sn, Sb}$):** Small additions bind lanthanides inside the slug as stable intermetallics ($\text{Pd–Ln}$, $\text{Sn–Ln}$).
  3. **Annular He-Bonded ($55\%$ smear):** Eliminates liquid $\text{Na}$ bond (removes fast $\text{Ln}$ paths & pyrophoric Na disposal issues; tighter gap tolerance).
  4. **9Cr-ODS Cladding (`Fe-9Cr-2W-0.2Ti-0.35Y2O3`):** Nano-oxides ($1\text{--}3\text{ nm}$ $\text{Y–Ti–O}$) suppress $\alpha'$ brittleness ($9\text{Cr}$), trap He, and raise creep limit to **$\sim 700\,^\circ\text{C}$** (requires solid-state **PRW** welding).
- **`[BASSO]` Source:** `Synthesized from Xie et al. (2018), Yao et al. (2023), Seki et al. (2004), and IAEA (2013).`

---

## SLIDE 11 — Comparative Trade-Off Table *(Mandatory — Ferraris Slide 5)*
- **`[SOTTOTITOLO — MESSAGGIO]`:** *Selecting a metallic fuel architecture requires balancing licensing maturity against temperature margin and back-end waste.*
- **`[PIENA LARGHEZZA]` 4-column table:**

| Fuel–Cladding Concept | Advantages | Disadvantages | Limiting Factor(s) |
| :--- | :--- | :--- | :--- |
| **`U-10Zr (Na)` / `316SS–D9`** | High early creep strength; no low-$T$ DBTT; historical EBR-II data | Severe FCC void swelling after incubation; Ni leaching/FCCI | **Void swelling** ($\sim 10\text{ at\%}$ BU cap) |
| **`U-10Zr (Na)` / `HT9`** *(Baseline)* | $<2\%$ swelling at $200\text{ dpa}$; **1,262-pin NRC database**; high $k$ | High-burnup FCCI wastage; reactive $\text{Na}$-bond waste | **Creep $>650\,^\circ\text{C}$**; **$\text{U–Fe}$ eutectic ($725\,^\circ\text{C}$)** |
| **`U-10Zr (Na + Liner/Pd)` / `HT9`** | Cuts FCCI wastage & extends burnup using qualified HT9 tube | Extra fabrication/coating cost; unaddressed HT9 creep ceiling | **HT9 thermal creep $>650\,^\circ\text{C}$**; liner bonding QA |
| **`Annular U-10Zr (He)` / `9Cr-ODS`** | No reactive $\text{Na}$ waste; creep to $\sim 700\,^\circ\text{C}$; low $\alpha'$ risk | Lower gap $k_{\text{He}}$; expensive PM/MA tubing; low TRL | **PRW end-cap weld** qual.; tight gap tolerances |
| **`MOX` / `15-15Ti`** *(Benchmark)* | Mature oxide/LWR fabrication & European LFR/SFR heritage | $8\text{--}10\times$ lower $k$; lower fissile density; no Na-bond synergy | **Centerline $T$ margin**; 15-15Ti swelling $>120\text{ dpa}$ |

---

## SLIDE 12 — Selection, My Opinion & Real Limitations *(Mandatory — Ferraris Slide 5)*
- **`[SOTTOTITOLO — MESSAGGIO]`:** *A two-stage deployment strategy pairs immediate NRC licensability with next-generation high-temperature performance.*
- **`[SINISTRA — 45%]` Visual:** Clean 2-stage visual roadmap (`Stage 1: Commercial Launch 2027–2030` $\longrightarrow$ `Stage 2: High-Burnup / Na-Free Core`).
  - *Asset:* `assets/schematics/s12-two-stage-roadmap.svg`
- **`[DESTRA — 42%]` Engineering Proposals & Bottlenecks (3 cards):**
  - **MY PROPOSAL 01 • Duplex PVD/ALD Inner Barrier:** Replace thick co-extruded Zr-rind with an ultra-thin PVD/ALD duplex coating (`Cr/V + Y2O3` or `TiN` ceramic diffusion barrier, analogous to ATF anti-eutectic barriers): suppresses both Ln wastage and `725 °C` U–Fe liquefaction inside standard HT9 tubes.
  - **MY PROPOSAL 02 • Recycled-Pd Doping in Annular Fuel:** Valorize noble fission-product Pd recovered during EBR-II electrorefining (`~1–2 wt%` Pd addition) inside an annular He-bonded slug: traps lanthanides as stable `Pd3Ln` intermetallics while eliminating pyrophoric Na-bond disposal.
  - **HONEST BOTTLENECKS • Joining & Industrial Scale-Up:** Fusion welding destroys 9Cr-ODS nano-oxides (`Y2O3` coarsening): Stage 2 requires industrial qualification of solid-state **PRW** end-cap joining, lower PM/MA tubing cost, tight He-gap tolerances, and prototypic TREAT transient tests.

---

## SLIDE 13 — References *(Mandatory — Ferraris Slide 5)*
- **`[SOTTOTITOLO — MESSAGGIO]`:** *Primary peer-reviewed literature and regulatory technical reports supporting this evaluation.*
- **`[2 COLONNE COMPATTE]` 10 verified primary entries:**
  1. USNRC, `NUREG/CR-7305`, *Metal Fuel Qualification* (2023) — `ML23214A065`.
  2. Wray & Geelhood, `PNNL-35642` / OSTI `3030076`, *SFR Metallic Fuel Degradation* (2024/2026).
  3. Janney, `INL/EXT-15-36520-Rev003`, *Metallic Fuels Handbook* (2018); Janney & Hayes, *Nucl. Technol.* 203 (2018).
  4. Crawford, Porter & Hayes, *J. Nucl. Mater.* 371 (2007) 202–231; Crawford & Porter, *Prog. Nucl. Energy* 171 (2024).
  5. Yao et al., *Front. Nucl. Eng.* 1 (2023) 1050262; Matthews et al., *J. Nucl. Mater.* 578 (2023) 154343.
  6. Carmack et al., *J. Nucl. Mater.* 473 (2016) 167–177; Wang et al., *J. Nucl. Mater.* 566 (2022) 153754.
  7. Miao et al., `ANL/CFCT-21/19` (2021); Salvato et al., *J. Nucl. Mater.* 570 (2022) 153963.
  8. Klueh, `ORNL/TM-2004/176` (2004); `UCRL-TR-223397` (2006); `IAEA-TECDOC-1689` (2013).
  9. Xie et al., *Prog. Nucl. Energy* 109 (2018); Benson et al., *J. Nucl. Mater.* 544 (2021); Seki et al., *J. Nucl. Mater.* 329–333 (2004).
  10. Was, Petti, Ukai & Zinkle, *J. Nucl. Mater.* 527 (2019) 151837; Oklo Inc. Aurora FSAR / A3F INL records (2025–2026).

---

## SLIDE 14 — Thank You & AI Disclosure *(Ferraris Slide 3 Rule)*
- **`[CENTRO]`:** `Thank you for your attention` / `Questions & Discussion`
- **`[CENTRO BASSO]` Contact:** `Davide Rapallo | s324486@studenti.polito.it | Politecnico di Torino`
- **`[BOX TRASPARENZA IN BASSO]` AI Tools Disclosure:**
  > *AI assistance was used for literature structuring, slide layout drafting, and language refinement. All technical data, phase transitions, irradiation limits, and micrographs were independently verified against primary USNRC, INL, ANL, PNNL, IAEA, and peer-reviewed sources.*
