/* ============================================================
   THERAPEUTIC INDEX — casemaker.js
   Custom Clinical Case Maker & Shareable URLs
   ============================================================ */

"use strict";

const CaseMaker = {
  defaultCase: {
    ind: "Refractory Hypertensive Crisis with CKD",
    area: "CARDIO",
    sev: 2,
    key: "hypertension",
    prefTags: ["acei", "arb", "betablocker", "diuretic"],
    avoidTags: ["nsaid"],
    mods: ["renal", "elderly"],
    deck: ["lisin", "amlod", "furos", "prop", "spiro", "asp", "metf", "atorva"],
  },

  open(initialData = null) {
    const data = Object.assign({}, this.defaultCase, initialData || {});
    let modalBack = null;

    const renderForm = () => {
      return `
        <div class="casemaker-shell">
          <div class="m-kicker" style="color:var(--gold)">GRAND ROUNDS SANDBOX</div>
          <h3 style="margin:2px 0 10px 0">Custom Clinical Case Architect</h3>
          <p class="mut" style="margin-bottom:16px">Design authentic clinical dilemmas with bespoke comorbidities, guideline targets, and custom formularies. Share with students or colleagues via one-click URLs.</p>

          <div class="cm-grid">
            <div class="cm-col">
              <label class="cm-label">Primary Diagnosis / Indication Title</label>
              <input type="text" id="cm-ind" class="cm-input" value="${esc(data.ind)}" placeholder="e.g. Severe Septic Shock with ARDS">

              <div class="cm-row-split" style="margin-top:12px">
                <div style="flex:1">
                  <label class="cm-label">Therapeutic Area</label>
                  <select id="cm-area" class="cm-select">
                    ${Object.entries(AREAS).map(([k, v]) => `
                      <option value="${k}" ${data.area === k ? "selected" : ""}>${v.label}</option>
                    `).join("")}
                  </select>
                </div>
                <div style="flex:1">
                  <label class="cm-label">Case Severity (1–3 Skulls)</label>
                  <select id="cm-sev" class="cm-select">
                    <option value="1" ${data.sev === 1 ? "selected" : ""}>1 Skull (Mild)</option>
                    <option value="2" ${data.sev === 2 ? "selected" : ""}>2 Skulls (Moderate)</option>
                    <option value="3" ${data.sev === 3 ? "selected" : ""}>3 Skulls (Critical / ICU)</option>
                  </select>
                </div>
              </div>

              <label class="cm-label" style="margin-top:14px">Patient Comorbidity Modifiers</label>
              <div class="cm-tags-wrap" id="cm-mods-wrap">
                ${MODS.map(m => {
                  const sel = data.mods.includes(m.id);
                  return `<button class="fchip ${sel ? "on" : ""}" data-mod="${m.id}" style="--fc:var(--rose)">${esc(m.label)}</button>`;
                }).join("")}
              </div>
            </div>

            <div class="cm-col">
              <label class="cm-label">Custom Formulary Deck (Select 6–12 Drugs)</label>
              <div class="cm-deck-status mono small dim" id="cm-deck-status">SELECTED: ${data.deck.length} DRUGS</div>
              <div class="cm-pool-grid" id="cm-pool-grid">
                ${DRUGS.filter(d => d.r !== "BANNED").map(d => {
                  const sel = data.deck.includes(d.id);
                  return `
                    <div class="cm-drug-chip ${sel ? "picked" : ""}" data-drug="${d.id}" title="${d.n} (${d.cls})">
                      <b>${esc(d.n)}</b>
                      <small class="dim">${d.cls}</small>
                    </div>`;
                }).join("")}
              </div>
            </div>
          </div>
        </div>`;
    };

    modalBack = Modal.open({
      wide: true,
      html: renderForm(),
      actions: [
        {label: "Play Custom Case Now", val: "play", primary: true, icon: "i-play"},
        {label: "Copy Share URL", val: "share", icon: "i-stack"},
        {label: "Close", val: "close"},
      ],
    });

    const bindEvents = () => {
      const content = $(".m-body", modalBack);
      const indInput = $("#cm-ind", content);
      const areaSelect = $("#cm-area", content);
      const sevSelect = $("#cm-sev", content);

      if (indInput) indInput.oninput = () => { data.ind = indInput.value; };
      if (areaSelect) areaSelect.onchange = () => { data.area = areaSelect.value; };
      if (sevSelect) sevSelect.onchange = () => { data.sev = +sevSelect.value; };

      $$("[data-mod]", content).forEach(b => {
        b.onclick = () => {
          const m = b.dataset.mod;
          if (data.mods.includes(m)) data.mods.splice(data.mods.indexOf(m), 1);
          else data.mods.push(m);
          b.classList.toggle("on", data.mods.includes(m));
          SFX.click();
        };
      });

      $$("[data-drug]", content).forEach(b => {
        b.onclick = () => {
          const id = b.dataset.drug;
          if (data.deck.includes(id)) {
            data.deck.splice(data.deck.indexOf(id), 1);
          } else {
            if (data.deck.length >= 14) {
              toast("Formulary limit: 14 drugs maximum.", "warn");
              return;
            }
            data.deck.push(id);
          }
          b.classList.toggle("picked", data.deck.includes(id));
          const status = $("#cm-deck-status", content);
          if (status) status.textContent = `SELECTED: ${data.deck.length} DRUGS`;
          SFX.click();
        };
      });

      const acts = $$(".m-actions .btn", modalBack);
      if (acts[0]) {
        acts[0].onclick = (e) => {
          e.stopPropagation();
          if (data.deck.length < 4) {
            toast("Please select at least 4 drugs for the case formulary.", "warn");
            return;
          }
          Modal.close(modalBack);
          CaseMaker.playCase(data);
        };
      }
      if (acts[1]) {
        acts[1].onclick = (e) => {
          e.stopPropagation();
          const url = CaseMaker.encodeURL(data);
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url);
            toast("Custom Case URL copied to clipboard!", "ok", "i-link");
          } else {
            prompt("Shareable Case URL:", url);
          }
        };
      }
      if (acts[2]) {
        acts[2].onclick = () => Modal.close(modalBack);
      }
    };

    bindEvents();
  },

  encodeURL(data) {
    const payload = {
      i: data.ind,
      a: data.area,
      s: data.sev,
      m: data.mods,
      d: data.deck,
    };
    const json = JSON.stringify(payload);
    const b64 = btoa(encodeURIComponent(json));
    const base = location.origin + location.pathname;
    return `${base}#/case?code=${b64}`;
  },

  decodeCode(b64) {
    try {
      const json = decodeURIComponent(atob(b64));
      const payload = JSON.parse(json);
      return {
        ind: payload.i || "Custom Clinical Case",
        area: payload.a || "CARDIO",
        sev: payload.s || 2,
        mods: payload.m || ["renal"],
        deck: payload.d || ["lisin", "amlod", "asp", "metf"],
      };
    } catch (e) {
      return null;
    }
  },

  playCase(caseData) {
    const cs = {
      id: "custom_" + Date.now(),
      ind: caseData.ind || "Custom Clinical Scenario",
      area: caseData.area || "CARDIO",
      ca: AREAS[caseData.area]?.c || "#ff5470",
      sev: caseData.sev || 2,
      key: (caseData.ind || "").toLowerCase().slice(0, 8),
      pref: [
        {tags: ["antiplatelet", "acei", "arb", "betablocker", "statin3a4"], mult: 1.2, why: "Targeted guideline therapy"},
      ],
      avoid: [
        {tags: ["nsaid"], mult: 0.4, penalty: 3, why: "Contraindicated in severe dysfunction"},
      ],
    };

    const activeMods = MODS.filter(m => caseData.mods.includes(m.id));
    const userDeck = shuffle(caseData.deck.slice());
    const rivalPool = DRUGS.filter(d => d.a === caseData.area && !caseData.deck.includes(d.id));
    const rivalDeck = shuffle((rivalPool.length >= 6 ? rivalPool : DRUGS).slice(0, 10).map(d => d.id));

    // Launch into match engine
    if (typeof Discovery !== "undefined") {
      userDeck.forEach(id => Discovery.mark(id));
    }

    M = {
      isCustom: true,
      deckId: "custom_case",
      diff: "resident",
      decks: [userDeck, rivalDeck],
      deckPos: [0, 0],
      hands: [[], []],
      chart: [],
      caseNo: 1,
      ply: 0,
      passes: 0,
      score: [0, 0],
      insights: new Set(),
      archNames: ["Custom Deck", "Resident Dr. Shaw"],
      rival: "Dr. Shaw (Chief Resident)",
      busy: false,
      consultUsed: false,
      cs,
      mods: activeMods,
    };

    location.hash = "#/arena";
    // Switch view to arena
    $$(".view").forEach(v => v.classList.remove("active"));
    const view = $("#view-arena");
    if (view) view.classList.add("active");
    $$("#mainnav a").forEach(a => a.classList.toggle("on", a.dataset.route === "arena"));

    renderArenaShell();
    M.hands = [[], []];
    dealHands(); dealHands(); dealHands(); dealHands(); dealHands();
    renderCase();

    toast(`Playing custom case: <b>${esc(cs.ind)}</b>`, "gold", "i-atom");

    if (typeof Achievements !== "undefined") {
      Achievements.unlock("custom_architect");
    }
  },
};
