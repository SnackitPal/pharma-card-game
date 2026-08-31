/* ============================================================
   THERAPEUTIC INDEX — tutorial.js
   "CASE ZERO: THE FIRST PRESCRIPTION"
   Interactive 3-turn guided clinical walkthrough
   ============================================================ */

"use strict";

const CaseZero = {
  step: 1,
  active: false,
  modalBack: null,
  chart: [],
  hand: ["asp", "clopi", "warf", "ibu", "amio"],
  rivalHand: ["prop"],

  cs: {
    id: "case_zero_stemi",
    ind: "Acute Anterior STEMI (Myocardial Infarction)",
    area: "CARDIO",
    ca: "#ff5470",
    sev: 3,
    key: "MI",
    pref: [
      {tags: ["antiplatelet"], mult: 1.25, why: "Antiplatelet core of ACS care"},
      {ids: ["prop"], mult: 1.1, why: "Beta-blockade reduces myocardial oxygen demand"},
      {tags: ["statin3a4"], mult: 1.15, why: "High-intensity statin plaque stabilization"},
    ],
    avoid: [
      {tags: ["nsaid"], mult: 0.3, penalty: 4, why: "NSAIDs are contraindicated post-MI"},
    ],
  },
  mods: [
    {id: "renal", label: "Renal impairment (eGFR 28)", frag: 1.2, hit: ["nephrotoxic", "renal_clear"], note: "Renally-cleared drugs accumulate"},
  ],

  start() {
    this.step = 1;
    this.active = true;
    this.chart = [];
    this.hand = ["asp", "clopi", "warf", "ibu", "amio"];
    this.rivalHand = ["prop"];

    // Mark discovered
    if (typeof Discovery !== "undefined") {
      this.hand.forEach(id => Discovery.mark(id));
      Discovery.mark("prop");
    }

    this.render();
  },

  render() {
    const cs = this.cs;
    const mods = this.mods;

    const modalHTML = `
      <div class="tutorial-shell">
        <div class="tut-header spread">
          <div>
            <div class="m-kicker" style="color:var(--mint)">INTERACTIVE CLINICAL TUTORIAL</div>
            <h3 style="margin:2px 0 0 0">CASE ZERO: The First Prescription</h3>
          </div>
          <div class="step-badge mono">STEP ${Math.min(3, this.step)} / 3</div>
        </div>

        <div class="tut-coachmark panel panel-pad" id="tut-coachmark">
          ${this.getCoachmarkHTML()}
        </div>

        <div class="case-panel panel" style="--ca:${cs.ca};margin-top:12px">
          <div class="spread">
            <div>
              <div class="m-kicker" style="color:${cs.ca}">EMERGENCY DEPARTMENT · ROOM 4</div>
              <div class="case-ind">${esc(cs.ind)}</div>
            </div>
            <div class="case-sev" title="Severity">${icon("i-skull").repeat(cs.sev)}</div>
          </div>
          <div class="case-mods">
            ${mods.map(m => `<span class="mod-chip" title="${esc(m.note)}">${icon("i-alert")}${esc(m.label)}</span>`).join("")}
          </div>
        </div>

        <div id="tut-ecg-mount" style="margin:10px 0"></div>

        <div class="chart-zone" style="margin-bottom:12px">
          <div class="tray you" id="tut-tray-you"><span class="tray-label">YOUR ORDERS</span></div>
          <div class="tray ai" id="tut-tray-ai"><span class="tray-label">DR. ADAMS (RESIDENT)</span></div>
        </div>

        <div class="hand-dock panel">
          <div class="spread" style="margin-bottom:6px">
            <h4 style="margin:0">${icon("i-stack")} Your Formulary Hand</h4>
            <span class="small dim mono">CLICK THE RECOMMENDED MEDICATION</span>
          </div>
          <div class="hand-cards" id="tut-hand-cards"></div>
        </div>
      </div>`;

    if (!this.modalBack) {
      this.modalBack = Modal.open({
        wide: true,
        html: modalHTML,
        actions: [{label: "Exit Tutorial", val: "exit"}],
      });
      const acts = $$(".m-actions .btn", this.modalBack);
      acts.forEach(b => b.onclick = () => this.close());
    } else {
      const body = $(".m-body", this.modalBack);
      if (body) body.innerHTML = modalHTML;
    }

    this.initECG();
    this.renderTrays();
    this.renderHand();
  },

  getCoachmarkHTML() {
    if (this.step === 1) {
      return `
        <div class="coach-inner">
          <div class="coach-icon" style="color:var(--mint)">${icon("i-spark")}</div>
          <div>
            <div class="coach-title">Step 1: Guideline Indication Matching</div>
            <p>Your 62-year-old patient has arrived in the Emergency Department with crushing substernal chest pain and acute ST elevation. First-line clinical guidelines demand immediate antiplatelet therapy. Click <b>Aspirin</b> in your hand below to administer it to the chart.</p>
          </div>
        </div>`;
    }
    if (this.step === 2) {
      return `
        <div class="coach-inner">
          <div class="coach-icon" style="color:var(--gold)">${icon("i-link")}</div>
          <div>
            <div class="coach-title">Step 2: Shared Patient Chart & Polypharmacy</div>
            <p>Rival Resident Dr. Adams just administered <b>Propranolol</b> (Beta-Blocker) into the shared chart. Notice how both teams' orders affect the same patient. Propranolol reduces heart rate and oxygen demand without triggering any dangerous drug interactions!</p>
            <button class="btn btn-sm btn-primary" id="btn-tut-step2-next" style="margin-top:8px">${icon("i-play")} Proceed to Step 3 →</button>
          </div>
        </div>`;
    }
    if (this.step === 3) {
      return `
        <div class="coach-inner">
          <div class="coach-icon" style="color:var(--cyan)">${icon("i-shield")}</div>
          <div>
            <div class="coach-title">Step 3: Synergy vs Dangerous Interactions</div>
            <p><b>Warfarin</b> is an anticoagulant; giving it alongside Aspirin causes severe bleeding on compromised mucosa. Instead, <b>Clopidogrel</b> forms evidence-based <b>Dual Antiplatelet Therapy (DAPT)</b>! Administer <b>Clopidogrel</b> to complete the regimen.</p>
          </div>
        </div>`;
    }
    return `
      <div class="coach-inner">
        <div class="coach-icon" style="color:var(--gold)">${icon("i-check")}</div>
        <div>
          <div class="coach-title">Step 4: Case Victory & Resolution</div>
          <p>Fantastic work! You created a synergistic DAPT cardiac regimen with 0 toxic adverse interactions. Click <b>Resolve Case</b> to finalize the chart and graduate!</p>
          <button class="btn btn-sm btn-gold" id="btn-tut-resolve" style="margin-top:8px">${icon("i-trophy")} Resolve Case & Graduate →</button>
        </div>
      </div>`;
  },

  initECG() {
    const mount = $("#tut-ecg-mount", this.modalBack);
    if (!mount || typeof ECGMonitor === "undefined") return;
    if (this.ecg) {
      try { this.ecg.destroy(); } catch (e) {}
    }
    try {
      this.ecg = new ECGMonitor(mount, {height: 58});
    } catch (e) {}
  },

  renderTrays() {
    const trayYou = $("#tut-tray-you", this.modalBack);
    const trayAi = $("#tut-tray-ai", this.modalBack);
    if (!trayYou || !trayAi) return;

    $$(".card", trayYou).forEach(c => c.remove());
    $$(".card", trayAi).forEach(c => c.remove());
    $(".tray-empty", trayYou)?.remove();
    $(".tray-empty", trayAi)?.remove();

    let youCount = 0, aiCount = 0;
    for (const e of this.chart) {
      const c = makeCard(DRUG[e.d.id], {size: "xmini"});
      if (e.team === 0) {
        trayYou.appendChild(c);
        youCount++;
      } else {
        trayAi.appendChild(c);
        aiCount++;
      }
    }

    if (!youCount) {
      const sp = document.createElement("span");
      sp.className = "tray-empty"; sp.textContent = "awaiting orders…";
      trayYou.appendChild(sp);
    }
    if (!aiCount) {
      const sp = document.createElement("span");
      sp.className = "tray-empty"; sp.textContent = "awaiting orders…";
      trayAi.appendChild(sp);
    }

    let tox = 0;
    for (const e of this.chart) tox += toxOf(e.d, this.mods);
    if (this.ecg) {
      this.ecg.setToxicity(tox, false, false);
    }
  },

  renderHand() {
    const el = $("#tut-hand-cards", this.modalBack);
    if (!el) return;
    el.innerHTML = "";

    this.hand.forEach(id => {
      const d = DRUG[id];
      const card = makeCard(d, {size: "mini"});
      const isTarget = (this.step === 1 && id === "asp") || (this.step === 3 && id === "clopi");

      if (isTarget) {
        card.classList.add("playable", "pulse-card");
        card.onclick = () => this.handlePlayCard(id);
      } else {
        card.classList.add("dimmed");
        if (id === "warf") card.title = "⚠ Warfarin + Aspirin = Severe Bleeding Risk!";
        else if (id === "ibu") card.title = "⚠ NSAIDs contraindicated post-MI!";
        else card.title = `${d.n} — Not indicated right now`;
      }
      el.appendChild(card);
    });

    const step2Btn = $("#btn-tut-step2-next", this.modalBack);
    if (step2Btn) {
      step2Btn.onclick = () => {
        this.step = 3;
        this.render();
      };
    }

    const resolveBtn = $("#btn-tut-resolve", this.modalBack);
    if (resolveBtn) {
      resolveBtn.onclick = () => this.finishTutorial();
    }
  },

  handlePlayCard(id) {
    if (this.step === 1 && id === "asp") {
      this.chart.push({d: DRUG.asp, team: 0});
      this.hand.splice(this.hand.indexOf("asp"), 1);
      SFX.flip();
      if (typeof Haptics !== "undefined") Haptics.light();
      toast("Aspirin administered: +4.5 Primary Guideline Match!", "ok", "i-check");

      // Auto play rival Propranolol
      setTimeout(() => {
        this.chart.push({d: DRUG.prop, team: 1});
        this.step = 2;
        SFX.good();
        this.render();
      }, 700);
    } else if (this.step === 3 && id === "clopi") {
      this.chart.push({d: DRUG.clopi, team: 0});
      this.hand.splice(this.hand.indexOf("clopi"), 1);
      SFX.flip();
      if (typeof Haptics !== "undefined") Haptics.synergy();
      toast("DAPT Synergy Triggered! Aspirin + Clopidogrel (+3.0 pts)", "gold", "i-spark");
      this.step = 4;
      this.render();
    }
  },

  finishTutorial() {
    this.close();
    if (typeof Achievements !== "undefined") {
      Achievements.unlock("case_zero");
    }

    Modal.ask({
      wide: true,
      kicker: "CASE ZERO CONCLUDED",
      title: "Honorary Resident — Certification Granted!",
      html: `
        <div class="end-hero" style="margin: 0 auto">
          <div class="cup-icon" style="color:var(--mint)">${icon("i-trophy")}</div>
          <div class="end-rank">CLINICAL TUTORIAL PASSED</div>
          <p class="mut">Final Regimen Score: <b>+15.2 pts</b> · Adverse Rx: 0 · DAPT Synergy: Active</p>
          <div class="end-stats" style="margin: 16px 0">
            <div><b>3</b>ORDERS</div>
            <div><b>+3.0</b>DAPT SYNERGY</div>
            <div><b>0</b>TOXICITY OVERLOAD</div>
            <div><b>PASSED</b>EVALUATION</div>
          </div>
          <p style="text-align:left;font-size:13.5px;color:var(--mut);line-height:1.6">
            You have mastered the core loops of <b>Therapeutic Index</b>: matching guideline indications, monitoring shared patient telemetry, and leveraging synergistic polypharmacy while evading adverse drug interactions.
          </p>
        </div>`,
      actions: [
        {label: "Play Daily Case", val: "daily", primary: true, icon: "i-spark"},
        {label: "Enter Formulary Cup", val: "arena", icon: "i-trophy"},
        {label: "Return Home", val: "home"},
      ],
    }).then(res => {
      if (res === "daily" && typeof go === "function") go("daily");
      else if (res === "arena" && typeof go === "function") go("arena");
      else if (typeof go === "function") go("home");
    });

    if (typeof confettiCenter === "function") {
      confettiCenter(["#2fd6a5", "#ffd166", "#4cc9f0"]);
    }
    if (typeof SFX !== "undefined") SFX.good();
    if (typeof Haptics !== "undefined") Haptics.success();
  },

  close() {
    this.active = false;
    if (this.ecg) {
      try { this.ecg.destroy(); } catch (e) {}
      this.ecg = null;
    }
    if (this.modalBack) {
      Modal.close(this.modalBack);
      this.modalBack = null;
    }
  },
};
