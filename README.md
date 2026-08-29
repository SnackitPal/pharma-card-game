# 🧪 THERAPEUTIC INDEX

> **Play god with 132 real medicines. Every stat is grounded in science.**

[![GitHub Pages](https://img.shields.io/badge/Hosted%20With-GitHub%20Pages-blue?style=flat-square&logo=github)](https://pages.github.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Pure Vanilla JS](https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20HTML5%20%7C%20CSS3-green?style=flat-square)](https://developer.mozilla.org/)
[![No Build Step](https://img.shields.io/badge/Build-Zero%20Dependencies%20%2F%20Zero%20Config-brightgreen?style=flat-square)]()

---

## 📖 Overview

**THERAPEUTIC INDEX** is an authentic pharmacology collectible strategy card game and clinical simulator. 

Every card is a real medicine whose stats, clinical indications, and side effects derive from actual pharmacological literature — molecular weight, half-life ({1/2}$), bioavailability ($), mechanism of action, receptor targets, CYP450 metabolism, and renal excretion profiles.

---

## 🎮 Game Modes

### 🎓 1. Case Zero: Guided Tutorial
An interactive 3-turn emergency department walkthrough teaching first-line guideline matching, shared patient chart mechanics, and dual antiplatelet therapy (DAPT) synergy while steering clear of fatal drug interactions.

### 🏢 2. Campaign: "First in Human"
Found a biotech pharmaceutical empire over a 20-year timeline with \ in seed capital and 4 Action Points per year:
- **High-Throughput Screening**: Screen thousands of candidate leads across 8 therapeutic areas.
- **Clinical Trial Pipeline**: Fund programs through brutal gates (*Preclinical &rarr; Phase I &rarr; Phase II &rarr; Phase III &rarr; Filed*). Failed trials teach **+8 Data**.
- **Commercial Launch & Pricing**: Select VALUE, BALANCED, or PREMIUM market pricing strategies.
- **Market Operations**: Repurpose off-patent compounds, execute marketing blitzes, and extend patent exclusivity.
- **Target Goal**: Achieve a **\.5B+ market valuation** before year 20.

### 🏆 3. Arena: "The Formulary Cup"
Draft a specialized 10-card deck archetype (*Code Blue, Heart & Vessels, Bug Hunters, Mind Matters, Precision Oncology, Metabolic Engines, Airways & Allergy, Wildcard*) and duel clinical AI rivals (*Intern, Resident, Attending*) across best-of-3 patient emergencies:
- **Shared Patient Chart**: Both teams prescribe into the same patient.
- **🫀 Live ECG Oscilloscope**: Real-time canvas cardiac monitor tracking heart rate, QTc interval, and arrhythmia danger (*Normal Sinus Rhythm &rarr; Prolonged QTc &rarr; Torsades de Pointes / V-Fib*).
- **Synergies & Interactions**: Real pharmacology guidelines award bonuses; toxic combinations (e.g. CYP3A4 inhibitors + statins, NSAIDs + lithium, allopurinol during acute gout) incur severe penalties.

### 🩺 4. Daily Clinical Case Challenge
A daily seeded clinical emergency challenge. Review patient comorbidities, select a 3-drug formulary regimen, stabilize the patient, maintain daily streak counters, and share formatted score cards with friends.

### 🛠️ 5. Custom Clinical Case Architect
Construct custom clinical dilemmas with bespoke comorbidities (e.g. *Renal eGFR 28, Hepatic Child-Pugh B, Elderly 84yo, G6PD deficiency*), indication guidelines, and custom formulary decks. Share cases instantly via one-click URL hashes.

### 📚 6. The Compendium
Search and filter all 132 real compounds across 8 therapeutic areas and 5 rarities.
- **6-Plate Scientific Lenses**: Procedural canvas views for *Chemical Structure, Target Binding, Dose-Response Curve, Plasma Pharmacokinetics ({max}/t_{1/2}$), Organ Distribution, and Formulation*.
- **3D Stacked Deck Spotlight**: Swipeable mobile-friendly 3D card inspection mode.
- **Holo Foil Masteries**: Unlock holographic foil badges by winning matches with clinical MVP cards.

---

## 🚀 Quick Start (Local Run)

This project has **zero build steps** and **zero external npm dependencies**.

1. **Clone the repository**:
   `ash
   git clone https://github.com/<your-username>/therapeutic-index.git
   cd therapeutic-index
   `

2. **Run locally using Node**:
   `ash
   node serve.js
   `
   *Or open index.html directly in any modern browser!*

3. **Visit**: http://localhost:3000/

---

## 🌐 Deploy to GitHub Pages (100% Free & Permanent)

1. Push this repository to your GitHub account:
   `ash
   git add .
   git commit -m "Initial commit of THERAPEUTIC INDEX"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   `
2. On GitHub, navigate to: **Settings &rarr; Pages**.
3. Under **Build and deployment &rarr; Source**, select **Deploy from a branch**.
4. Set branch to **main** and folder to **/(root)**, then click **Save**.
5. Your game will be live at: https://<your-username>.github.io/<your-repo-name>/ 🎉

---

## 🧬 Therapeutic Areas Covered

| Code | Therapeutic Area | Card Count | Notable Examples |
| :--- | :--- | :---: | :--- |
| **CARDIO** | Cardiovascular | 22 | Aspirin, Atorvastatin, Lisinopril, Amiodarone, Epinephrine |
| **METAB** | Metabolic & Endocrine | 9 | Metformin, Semaglutide, Levothyroxine, Empagliflozin |
| **NEURO** | Neuroscience & Psychiatry | 25 | Sertraline, Levodopa/Carbidopa, Clozapine, Lithium |
| **INFECT** | Anti-Infective & Antimicrobial | 29 | Amoxicillin, Vancomycin, Sofosbuvir, Artemisinin |
| **ONCO** | Precision Oncology | 17 | Imatinib, Pembrolizumab, Trastuzumab, Methotrexate |
| **IMMUNO** | Immunology & Rheumatology | 13 | Prednisone, Adalimumab, Cyclosporine, Tacrolimus |
| **RESPI** | Respiratory & Pulmonary | 8 | Albuterol, Elexacaftor/Tezacaftor/Ivacaftor, Montelukast |
| **GI** | Gastrointestinal & Hepatic | 9 | Omeprazole, Ondansetron, Loperamide, Lactulose |

---

## 📄 License & Disclaimer

- **MIT License** &copy; 2026.
- *Medical Disclaimer*: For educational and entertainment gameplay purposes only. Not intended as clinical prescribing advice.
