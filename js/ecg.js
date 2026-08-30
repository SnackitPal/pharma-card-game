/* ============================================================
   THERAPEUTIC INDEX — ecg.js
   Live Oscilloscope Cardiac Monitor (Canvas ECG Waveform)
   ============================================================ */

"use strict";

class ECGMonitor {
  constructor(containerEl, options = {}) {
    this.container = typeof containerEl === "string" ? document.querySelector(containerEl) : containerEl;
    this.options = Object.assign({
      audio: true,
      height: 74,
      color: "#2fd6a5",
      glowColor: "rgba(47, 214, 165, 0.45)",
    }, options);

    this.tox = 0;
    this.hr = 74;
    this.sys = 120;
    this.dia = 80;
    this.spo2 = 98;
    this.qtc = 410;
    this.hasQT = false;
    this.severeArrhythmia = false;
    this.isFlatline = false;
    this.running = false;
    this.rafId = null;
    this.lastTime = performance.now();
    this.phase = 0;
    this.lastBeepPhase = -1;

    this.initDOM();
    this.start();
  }

  initDOM() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="ecg-monitor panel">
        <div class="ecg-header spread mono small">
          <div class="ecg-lead"><span>LEAD II · 25mm/s</span></div>
          <div class="ecg-rhythm" id="ecg-rhythm">NORMAL SINUS RHYTHM</div>
          <div class="ecg-stats">
            <span class="ecg-hr-wrap">HR: <b id="ecg-hr" class="ecg-val">74</b> <small>BPM</small></span>
            <span class="ecg-bp-wrap">BP: <b id="ecg-bp" class="ecg-val">120/80</b></span>
            <span class="ecg-spo2-wrap">SpO2: <b id="ecg-spo2" class="ecg-val">98%</b></span>
            <span class="ecg-qt-wrap">QTc: <b id="ecg-qt" class="ecg-val">410</b> <small>ms</small></span>
          </div>
        </div>
        <div class="ecg-canvas-wrap">
          <canvas class="ecg-canvas" height="${this.options.height}"></canvas>
          <div class="ecg-scanline"></div>
        </div>
      </div>`;

    this.canvas = this.container.querySelector(".ecg-canvas");
    this.rhythmEl = this.container.querySelector("#ecg-rhythm");
    this.hrEl = this.container.querySelector("#ecg-hr");
    this.bpEl = this.container.querySelector("#ecg-bp");
    this.spo2El = this.container.querySelector("#ecg-spo2");
    this.qtEl = this.container.querySelector("#ecg-qt");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;

    this.resize();
    this._onResize = () => this.resize();
    window.addEventListener("resize", this._onResize);
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement || this.container;
    const rect = (parent && parent.getBoundingClientRect) ? parent.getBoundingClientRect() : {width: 420, height: this.options.height};
    const dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
    this.width = (rect && rect.width) || 420;
    this.height = this.options.height;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    if (this.canvas.style) {
      this.canvas.style.width = this.width + "px";
      this.canvas.style.height = this.height + "px";
    }
    if (this.ctx && this.ctx.setTransform) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  setToxicity(tox, hasQT = false, forceFlatline = false) {
    this.tox = Math.max(0, tox);
    this.hasQT = hasQT;
    this.isFlatline = forceFlatline || this.tox >= 30;
    this.updateHUD();
  }

  updateVitalsFromDrugs(drugs = [], baseHR = 74, baseSys = 120, baseDia = 80, baseSpO2 = 98) {
    let hrDelta = 0;
    let sysDelta = 0;
    let diaDelta = 0;
    let spo2Delta = 0;
    let qtExt = false;
    let severeArrhythmia = false;

    const drugIds = drugs.map(d => (d && d.id) || d);
    const drugObjs = drugIds.map(id => typeof id === "string" && typeof DRUG !== "undefined" ? DRUG[id] : id).filter(Boolean);

    drugObjs.forEach(d => {
      const cls = (d.cls || "").toLowerCase();
      const tags = d.tags || [];

      // 1. Heart rate & BP lowering (Beta-blockers, CCBs, Digoxin)
      if (tags.includes("bb") || cls.includes("beta-block") || cls.includes("calcium channel") || d.id === "dig") {
        hrDelta -= 12;
        sysDelta -= 10;
        diaDelta -= 6;
      }
      // 2. Sympathomimetics / Tachycardia (SABA, Epinephrine, Theophylline, Amphetamines)
      if (cls.includes("agonist") && (cls.includes("beta") || cls.includes("adrenerg")) || d.id === "epi" || d.id === "salb" || d.id === "theo") {
        hrDelta += 18;
        sysDelta += 8;
      }
      if (cls.includes("anticholinergic") || tags.includes("anticholinergic") || d.id === "atro") {
        hrDelta += 14;
      }
      // 3. Vasodilators & Antihypertensives (ACEi, ARB, Diuretics, Nitrates)
      if (tags.includes("acei") || tags.includes("arb") || tags.includes("diuretic") || tags.includes("nitrate") || cls.includes("vasodilator")) {
        sysDelta -= 14;
        diaDelta -= 9;
      }
      // 4. Respiratory Depression (Opioids, Benzodiazepines)
      if (tags.includes("opioid") || tags.includes("benzo") || cls.includes("sedative")) {
        spo2Delta -= 3;
      }
      // 5. QTc Prolongation
      if (tags.includes("qt_risk") || cls.includes("antiarrhythmic") || cls.includes("macrolide") || cls.includes("fluoroquinolone") || d.id === "amio" || d.id === "sotalol" || d.id === "hal") {
        qtExt = true;
      }
    });

    // Hazardous DDI Combinations
    const hasNitrate = drugObjs.some(d => (d.tags && d.tags.includes("nitrate")) || d.id === "ntg");
    const hasPDE5 = drugObjs.some(d => d.id === "sild" || d.id === "tad");
    if (hasNitrate && hasPDE5) {
      sysDelta -= 45;
      diaDelta -= 30;
      hrDelta += 28; // reflex tachycardia
      severeArrhythmia = true;
    }

    const hasOpioid = drugObjs.some(d => (d.tags && d.tags.includes("opioid")) || d.id === "morph" || d.id === "fent");
    const hasBenzo = drugObjs.some(d => (d.tags && d.tags.includes("benzo")) || d.id === "diaz" || d.id === "midaz");
    if (hasOpioid && hasBenzo) {
      spo2Delta -= 8;
    }

    this.hr = Math.max(34, Math.min(185, Math.round(baseHR + hrDelta + (this.tox * 2.2))));
    this.sys = Math.max(52, Math.min(220, Math.round(baseSys + sysDelta)));
    this.dia = Math.max(32, Math.min(130, Math.round(baseDia + diaDelta)));
    this.spo2 = Math.max(76, Math.min(100, Math.round(baseSpO2 + spo2Delta)));
    this.qtc = Math.round(410 + (qtExt ? 110 : 0) + (this.tox * 3.5));
    this.hasQT = qtExt;
    this.severeArrhythmia = severeArrhythmia;

    this.updateHUD();
  }

  updateHUD() {
    if (!this.hrEl) return;
    const hr = this.isFlatline ? 0 : this.hr;
    const qtc = this.isFlatline ? 0 : this.qtc;

    this.hrEl.textContent = hr;
    if (this.bpEl) this.bpEl.textContent = this.isFlatline ? "0/0" : `${this.sys}/${this.dia}`;
    if (this.spo2El) this.spo2El.textContent = this.isFlatline ? "0%" : `${this.spo2}%`;
    this.qtEl.textContent = qtc;

    let status = "NORMAL SINUS RHYTHM";
    let color = "var(--mint, #2fd6a5)";

    if (this.isFlatline) {
      status = "ASYSTOLE / CARDIAC ARREST";
      color = "var(--rose, #ff5470)";
    } else if (this.severeArrhythmia || this.tox >= 22) {
      status = "VENTRICULAR TACHYCARDIA / COLLAPSE";
      color = "var(--rose, #ff5470)";
    } else if (this.hasQT && (this.tox >= 8 || this.hr >= 110)) {
      status = "LONG QT · TORSADES RISK";
      color = "var(--gold, #ffd166)";
    } else if (this.spo2 < 90) {
      status = "ACUTE HYPOXIA / RESPIRATORY DEPRESSION";
      color = "var(--rose, #ff5470)";
    } else if (this.hr >= 105) {
      status = "SINUS TACHYCARDIA";
      color = "var(--gold, #ffd166)";
    } else if (this.hr <= 54) {
      status = "SINUS BRADYCARDIA";
      color = "var(--sky, #4cc9f0)";
    }

    this.rhythmEl.textContent = status;
    this.rhythmEl.style.color = color;
    this.hrEl.style.color = (this.hr > 115 || this.hr < 50) ? "var(--rose, #ff5470)" : "inherit";
    if (this.bpEl) this.bpEl.style.color = (this.sys < 90 || this.sys > 175) ? "var(--rose, #ff5470)" : "inherit";
    if (this.spo2El) this.spo2El.style.color = (this.spo2 < 92) ? "var(--rose, #ff5470)" : "inherit";
    this.qtEl.style.color = this.hasQT ? "var(--gold, #ffd166)" : "inherit";
  }

  getVoltage(p) {
    // p is in [0, 1) representing one cardiac cycle
    if (this.isFlatline) {
      return (Math.random() - 0.5) * 0.04;
    }

    // Arrhythmia ectopic noise when toxicity is high
    let v = 0;
    const qtShift = this.hasQT ? 0.08 : 0.0;

    // Baseline jitter
    v += (Math.random() - 0.5) * 0.02 * (this.tox / 10);

    // P Wave: 0.12 - 0.22
    if (p >= 0.12 && p < 0.22) {
      const ph = (p - 0.12) / 0.10;
      v += Math.sin(ph * Math.PI) * 0.18;
    }
    // Q Dip: 0.27 - 0.30
    else if (p >= 0.27 && p < 0.30) {
      const ph = (p - 0.27) / 0.03;
      v -= Math.sin(ph * Math.PI) * 0.16;
    }
    // R Peak (Tall Spike): 0.30 - 0.35
    else if (p >= 0.30 && p < 0.35) {
      const ph = (p - 0.30) / 0.05;
      v += Math.sin(ph * Math.PI) * 1.0;
    }
    // S Dip: 0.35 - 0.39
    else if (p >= 0.35 && p < 0.39) {
      const ph = (p - 0.35) / 0.04;
      v -= Math.sin(ph * Math.PI) * 0.26;
    }
    // T Wave (Repolarization): (0.46 + qtShift) - (0.64 + qtShift)
    else if (p >= 0.46 + qtShift && p < 0.64 + qtShift) {
      const ph = (p - (0.46 + qtShift)) / 0.18;
      const amp = this.hasQT ? 0.38 : 0.24;
      v += Math.sin(ph * Math.PI) * amp;
    }

    return v;
  }

  draw() {
    if (!this.ctx || !this.width) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const midY = h * 0.52;
    const amp = h * 0.38;

    // Fade trail
    ctx.fillStyle = "rgba(7, 11, 20, 0.22)";
    ctx.fillRect(0, 0, w, h);

    // Subtle grid lines
    ctx.strokeStyle = "rgba(47, 214, 165, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < w; x += 20) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = 0; y < h; y += 15) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();

    // Determine current color & glow based on toxicity/flatline
    let strokeColor = "#2fd6a5";
    let glowColor = "rgba(47, 214, 165, 0.6)";

    if (this.isFlatline) {
      strokeColor = "#ff5470";
      glowColor = "rgba(255, 84, 112, 0.8)";
    } else if (this.tox >= 20) {
      strokeColor = "#ff5470";
      glowColor = "rgba(255, 84, 112, 0.8)";
    } else if (this.tox >= 10 || this.hasQT) {
      strokeColor = "#ffd166";
      glowColor = "rgba(255, 209, 102, 0.7)";
    }

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    const step = 2;
    const totalPoints = Math.floor(w / step);
    const speed = this.isFlatline ? 0.3 : (0.75 + Math.min(1.0, this.tox * 0.04));

    for (let i = 0; i < totalPoints; i++) {
      const x = i * step;
      // Phase progresses along width
      const p = (this.phase + (x / w) * speed * 2.2) % 1.0;
      const v = this.getVoltage(p);
      const y = midY - v * amp;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();

    const loop = (t) => {
      if (!this.running) return;
      const dt = (t - this.lastTime) / 1000;
      this.lastTime = t;

      const hr = this.isFlatline ? 0 : this.hr;
      const freq = Math.max(0.5, hr / 60); // beats per second

      if (!this.isFlatline) {
        this.phase = (this.phase + dt * freq * 0.8) % 1.0;
        // Trigger beep near R peak (phase ~ 0.32)
        if (this.phase >= 0.30 && this.phase < 0.35 && this.lastBeepPhase < 0.30) {
          if (this.options.audio && typeof SFX !== "undefined" && !SFX.muted) {
            SFX.ecgBeep(this.tox >= 12);
          }
          this.lastBeepPhase = this.phase;
        } else if (this.phase < 0.30) {
          this.lastBeepPhase = -1;
        }
      } else {
        this.phase = (this.phase + dt * 0.1) % 1.0;
      }

      this.draw();
      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  destroy() {
    this.stop();
    window.removeEventListener("resize", this._onResize);
    if (this.container) this.container.innerHTML = "";
  }
}
