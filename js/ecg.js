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
    this.hasQT = false;
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
            <span class="ecg-hr-wrap">HR: <b id="ecg-hr" class="ecg-val">72</b> <small>BPM</small></span>
            <span class="ecg-qt-wrap">QTc: <b id="ecg-qt" class="ecg-val">410</b> <small>ms</small></span>
            <span class="ecg-tox-wrap">TOX: <b id="ecg-tox" class="ecg-val">0</b></span>
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
    this.qtEl = this.container.querySelector("#ecg-qt");
    this.toxEl = this.container.querySelector("#ecg-tox");
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

  updateHUD() {
    if (!this.hrEl) return;
    const hr = this.isFlatline ? 0 : Math.round(72 + Math.min(78, this.tox * 2.6) + (this.hasQT ? -6 : 0));
    const qtc = this.isFlatline ? 0 : Math.round(410 + (this.hasQT ? 115 : 0) + this.tox * 3.5);

    this.hrEl.textContent = hr;
    this.qtEl.textContent = qtc;
    this.toxEl.textContent = Math.round(this.tox);

    let status = "NORMAL SINUS RHYTHM";
    let color = "var(--mint, #2fd6a5)";

    if (this.isFlatline) {
      status = "ASYSTOLE / CARDIAC ARREST";
      color = "var(--rose, #ff5470)";
    } else if (this.tox >= 22) {
      status = "VENTRICULAR FIBRILLATION / ARREST IMMINENT";
      color = "var(--rose, #ff5470)";
    } else if (this.hasQT && this.tox >= 10) {
      status = "LONG QT SYNDROME · TORSADES RISK";
      color = "var(--gold, #ffd166)";
    } else if (this.tox >= 12) {
      status = "SINUS TACHYCARDIA";
      color = "var(--gold, #ffd166)";
    }

    this.rhythmEl.textContent = status;
    this.rhythmEl.style.color = color;
    this.hrEl.style.color = this.tox > 15 ? "var(--rose, #ff5470)" : "inherit";
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

      const hr = this.isFlatline ? 0 : (72 + Math.min(78, this.tox * 2.6));
      const freq = hr / 60; // beats per second

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
