/* ============================================================
   THERAPEUTIC INDEX — main.js
   Router, home hero, ticker, help modal, collection tracking,
   foil mastery, achievements & daily clinical case mode
   ============================================================ */

"use strict";

/* ---------- collection / discovery tracker ---------- */
const Discovery = {
  getSet(){
    return new Set(Store.get("ti_discovered", []));
  },
  mark(id){
    if(!id || !DRUG[id]) return;
    const s = this.getSet();
    if(!s.has(id)){
      s.add(id);
      Store.set("ti_discovered", [...s]);
      if(s.size >= 30 && typeof Achievements!=="undefined") Achievements.unlock("collector_30");
      if(s.size >= 75 && typeof Achievements!=="undefined") Achievements.unlock("collector_75");
      if(s.size >= DRUGS.length && typeof Achievements!=="undefined") Achievements.unlock("collector_all");
      const el = $("#hero-stats-disc");
      if(el) el.textContent = `${s.size} / ${DRUGS.length}`;
    }
  },
  count(){
    return this.getSet().size;
  }
};

/* ---------- foil mastery storage ---------- */
const FoilMastery = {
  getSet(){
    return new Set(Store.get("ti_mastery", []));
  },
  has(id){
    return this.getSet().has(id);
  },
  unlock(id){
    if(!id || !DRUG[id]) return;
    const s = this.getSet();
    s.add(id);
    Store.set("ti_mastery", [...s]);
  }
};

/* ---------- achievements system ---------- */
const Achievements = {
  getUnlocked(){
    return new Set(Store.get("ti_achievements", []));
  },
  has(id){
    return this.getUnlocked().has(id);
  },
  unlock(id){
    if(typeof ACHIEVEMENTS==="undefined") return;
    const ach = ACHIEVEMENTS.find(a=>a.id===id);
    if(!ach) return;
    const s = this.getUnlocked();
    if(!s.has(id)){
      s.add(id);
      Store.set("ti_achievements", [...s]);
      toast(`<b>Achievement Unlocked:</b> ${ach.title}`, "gold", ach.icon);
      if(typeof SFX!=="undefined") SFX.good();
      if(typeof Haptics!=="undefined") Haptics.success();
      confettiCenter(["#ffd166","#4cc9f0","#ff8ba0"]);
    }
  },
  showModal(){
    const unl = this.getUnlocked();
    Modal.open({
      wide: true,
      kicker: "HALL OF FAME",
      title: `Achievements & Trophies (${unl.size}/${ACHIEVEMENTS.length})`,
      html: `
        <p class="mut">Milestones, honors, and medals grounded in real pharmacology and clinical mastery.</p>
        <div class="ach-grid">
          ${ACHIEVEMENTS.map(a=>{
            const isU = unl.has(a.id);
            return `
              <div class="ach-card ${isU?"unlocked":"locked"}">
                <div class="ach-icon">${icon(a.icon)}</div>
                <div class="ach-info">
                  <div class="ach-title">${esc(a.title)} <span class="ach-tag mono">${a.tag}</span></div>
                  <div class="ach-desc">${esc(a.desc)}</div>
                  <div class="ach-status mono">${isU?"UNLOCKED":"LOCKED"}</div>
                </div>
              </div>`;
          }).join("")}
        </div>`,
      actions: [{label:"Close", val:"ok", primary:true}],
    });
  }
};

/* ---------- daily clinical case mode ---------- */
const DailyCase = {
  getDateStr(){
    return new Date().toISOString().slice(0,10);
  },
  getSeedKey(){
    return "daily_" + this.getDateStr();
  },
  isCompleted(){
    return !!Store.get("ti_daily_done_" + this.getDateStr(), null);
  },
  open(){
    const dateStr = this.getDateStr();
    const doneData = Store.get("ti_daily_done_" + dateStr, null);
    const R = rng(hstr(this.getSeedKey()));
    const cs = CASES[Math.floor(R() * CASES.length)];
    // Use seeded RNG for mods so daily modifiers are identical across reloads
    const modsN = R() < 0.5 ? 1 : 2;
    const modsShuffled = MODS.slice().sort(()=>R()-0.5);
    const mods = modsShuffled.slice(0, modsN);

    // Pick 6 curated daily cards deterministically (seeded)
    const pool = DRUGS.filter(d=>d.r!=="BANNED");
    const hand = [];
    const bag = pool.slice();
    // Guarantee up to 2 plausible answers in the daily pool
    const candidates = bag.filter(d=>matchInfo(d, cs).mult >= 0.9);
    let candidatesAdded = 0;
    while(candidatesAdded < 2 && candidates.length){
      const idx = Math.floor(R() * candidates.length);
      const chosen = candidates.splice(idx, 1)[0];
      hand.push(chosen);
      bag.splice(bag.indexOf(chosen), 1);
      candidatesAdded++;
    }
    while(hand.length < 6 && bag.length){
      const d = bag[Math.floor(R() * bag.length)];
      hand.push(d);
      bag.splice(bag.indexOf(d), 1);
    }

    if(doneData){
      this.showCompletedModal(dateStr, cs, doneData);
      return;
    }

    this.showPlayModal(dateStr, cs, mods, hand);
  },

  showPlayModal(dateStr, cs, mods, hand){
    const selected = [];
    let modalBack = null;

    const getDrugRisk = (d) => {
      // Check case avoid list
      for(const av of cs.avoid||[]){
        if(av.ids&&av.ids.includes(d.id))return {type:"bad",why:av.why};
        if(av.tags&&av.tags.some(t=>d.tags.includes(t)))return {type:"bad",why:av.why};
      }
      // Check modifier hits
      for(const m of mods){
        if(m.hit.some(h=>d.tags.includes(h)))return {type:"warn",why:m.label+" toxicity risk"};
      }
      // Check interactions with currently selected drugs
      for(const sel of selected){
        if(sel.id === d.id) continue;
        for(const ix of INTERACTIONS){
          if(ix.trio) continue;
          if((matchesAny(ix.a, d)&&matchesAny(ix.b, sel)) || (matchesAny(ix.b, d)&&matchesAny(ix.a, sel))){
            return {type:"bad",why:ix.msg};
          }
        }
      }
      return null;
    };

    const render = ()=>{
      const chartTox = selected.reduce((s, d)=>s + toxOf(d, mods), 0);
      const ordersHTML = selected.map((d, i)=>{
        const risk = getDrugRisk(d);
        return `
        <div class="daily-order-chip ${risk ? (risk.type==="bad"?"has-contra":"has-warn"):""}">
          <span>${icon(routeIcon(d.rt))} <b>${esc(d.n)}</b> (${esc(d.cls)})</span>
          <div style="display:flex;align-items:center;gap:6px">
            ${risk ? `<span class="daily-risk-badge ${risk.type}" title="${esc(risk.why)}">${icon("i-alert")} ${esc(risk.why)}</span>` : ""}
            <button class="btn-remove" data-del="${i}" title="Remove order">${icon("i-x")}</button>
          </div>
        </div>`;
      }).join("") || '<span class="dim small mono">No orders prescribed yet (Pick up to 3)</span>';

      const cardsHTML = hand.map((d, i)=>{
        const isSel = selected.includes(d);
        const risk = getDrugRisk(d);
        return `
          <div class="daily-card-opt ${isSel?"picked":""}" data-pick="${i}">
            <div class="spread">
              <div class="opt-name"><b>${esc(d.n)}</b> <span class="dim small">${d.cls}</span></div>
              <div style="display:flex;gap:5px;align-items:center">
                ${risk ? `<span class="daily-risk-badge ${risk.type}" title="${esc(risk.why)}">${icon("i-alert")}</span>` : ""}
                <span class="info-icon-badge" data-info="${i}" title="View ${d.n} Monograph">${icon("i-help")}</span>
              </div>
            </div>
            <div class="opt-stats mono small">EFF: ${d.eff} · SAF: ${d.saf} · ${fmtRoute(d.rt)}</div>
          </div>`;
      }).join("");

      return `
        <div class="daily-wrap">
          <div class="m-kicker" style="color:${cs.ca}">DAILY CLINICAL CHALLENGE · ${dateStr}</div>
          <h3>${esc(cs.ind)}</h3>
          <div class="case-mods" style="margin: 8px 0 14px 0">
            ${mods.map(m=>`<span class="mod-chip" title="${esc(m.note)}">${icon("i-alert")}${esc(m.label)}</span>`).join("")}
          </div>
          <div class="daily-chart-box panel panel-pad">
            <div class="spread small mono"><span>PRESCRIBED REGIMEN (${selected.length}/3)</span><span>EST. TOXICITY: ${Math.round(chartTox)}</span></div>
            <div class="daily-orders-list">${ordersHTML}</div>
          </div>
          <div class="daily-pool-header small mono dim" style="margin-top:14px">AVAILABLE FORMULARY (CLICK TO ORDER · ? TO INSPECT):</div>
          <div class="daily-pool-grid">${cardsHTML}</div>
        </div>`;
    };

    modalBack = Modal.open({
      wide: true,
      html: render(),
      actions: [
        {label: "Administer Regimen", val: "submit", primary: true, icon: "i-check"},
        {label: "Close", val: "cancel"}
      ]
    });

    const bind = ()=>{
      const content = $(".m-body", modalBack);
      $$("[data-info]", content).forEach(b=>{
        b.onclick = (e)=>{
          e.stopPropagation();
          const idx = +b.dataset.info;
          const d = hand[idx];
          if(d) openDetail(d);
        };
      });
      $$("[data-pick]", content).forEach(b=>{
        b.onclick = ()=>{
          const idx = +b.dataset.pick;
          const d = hand[idx];
          if(selected.includes(d)){
            selected.splice(selected.indexOf(d), 1);
          } else if(selected.length < 3){
            selected.push(d);
            Discovery.mark(d.id);
            const risk = getDrugRisk(d);
            if(risk && risk.type === "bad"){
              toast(`⚠ Caution: ${d.n} has contraindication risk!`, "bad", "i-alert");
            }
            SFX.click();
          } else {
            toast("Maximum 3 medications per daily regimen.", "info");
          }
          content.innerHTML = render();
          bind();
        };
      });
      $$("[data-del]", content).forEach(b=>{
        b.onclick = (e)=>{
          e.stopPropagation();
          selected.splice(+b.dataset.del, 1);
          content.innerHTML = render();
          bind();
        };
      });
    };

    bind();

    // Wire actions
    const acts = $$(".m-actions .btn", modalBack);
    acts.forEach(b=>{
      b.onclick = ()=>{
        const val = b.getAttribute("data-val") || (b.classList.contains("btn-primary")?"submit":"cancel");
        if(val === "submit"){
          if(!selected.length){
            toast("Prescribe at least 1 medication before submitting.", "warn", "i-alert");
            return;
          }
          Modal.close(modalBack);
          this.resolve(dateStr, cs, mods, selected);
        } else {
          Modal.close(modalBack);
        }
      };
    });
  },

  resolve(dateStr, cs, mods, selected){
    // Fake chart for resolution
    const prevM = M;
    M = {
      chart: selected.map(d=>({d, team: 0})),
      hands: [[],[]],
    };
    const r = resolveChart(cs, mods);
    M = prevM;

    const score = Math.max(0, r.totals[0]);
    const cured = score >= 8 && r.toxTotals[0] <= 18;
    const streak = Store.get("ti_daily_streak", 0) + (cured ? 1 : 0);
    if(cured) Store.set("ti_daily_streak", streak);

    const doneData = {
      score: score.toFixed(1),
      cured,
      streak,
      drugs: selected.map(d=>d.n),
      chartTox: Math.round(r.toxTotals[0]),
      interactions: r.ixMsgs.length,
      synergies: r.synMsgs.length,
    };

    Store.set("ti_daily_done_" + dateStr, doneData);
    Achievements.unlock("daily_champ");
    selected.forEach(d=>Discovery.mark(d.id));
    if(typeof Haptics!=="undefined"){
      if(r.synMsgs.length>0||cured) Haptics.synergy();
      else if(!cured) Haptics.error();
    }

    this.showCompletedModal(dateStr, cs, doneData);
  },

  showCompletedModal(dateStr, cs, data){
    const pctile = data.cured ? Math.min(99, Math.round(82 + Math.random() * 16)) : Math.round(30 + Math.random() * 35);
    const shareText = `THERAPEUTIC INDEX · Daily Case #${dateStr}\n` +
      `🩺 Diagnosis: ${cs.ind}\n` +
      `${data.cured ? "🟢 STABILIZED" : "🔴 SUBOPTIMAL"} · Score: +${data.score} pts (Top ${100 - pctile}%)\n` +
      `💊 Regimen: ${data.drugs.join(" + ")}\n` +
      `🔥 Streak: ${data.streak} Day${data.streak > 1 ? "s" : ""}\n` +
      `Play: https://snackitpal.github.io/pharma-card-game/`;

    Modal.open({
      wide: true,
      kicker: "DAILY CLINICAL CASE COMPLETE",
      title: data.cured ? "Case Successfully Managed" : "Case Concluded",
      html: `
        <div class="end-hero" style="margin: 0 auto">
          <div class="cup-icon" style="color:${data.cured?"var(--mint)":"var(--gold)"}">${icon(data.cured?"i-check":"i-spark")}</div>
          <div class="end-rank">${data.cured ? "PATIENT STABILIZED" : "CASE RESOLVED"}</div>
          <p class="mut">Final Score: <b>+${data.score} pts</b> · <span class="mono" style="color:var(--mint)">Top ${100 - pctile}% Guideline Concordance</span></p>
          <div class="end-stats" style="margin: 16px 0">
            <div><b>${data.streak}</b>DAILY STREAK</div>
            <div><b>${data.drugs.length}</b>ORDERS</div>
            <div><b>${data.synergies}</b>SYNERGIES</div>
            <div><b>${data.interactions}</b>ADVERSE RX</div>
          </div>
          <div class="share-box panel" style="padding:12px;text-align:left;font-family:var(--font-mono);font-size:12px;white-space:pre-wrap;background:rgba(0,0,0,0.3)">${esc(shareText)}</div>
        </div>`,
      actions: [
        {label: "Discharge Summary", val: "debrief", icon: "i-flask"},
        {label: "Copy Result", val: "copy", primary: true, icon: "i-stack"},
        {label: "Close", val: "close"}
      ]
    }).then?.(null);

    const backs = $$("#modal-root .modal-back");
    const top = backs[backs.length-1];
    const debriefBtn = $(".m-actions .btn:nth-child(1)", top);
    const copyBtn = $(".m-actions .btn-primary", top);
    
    if(debriefBtn){
      debriefBtn.onclick = ()=>{
        showClinicalDebriefModal({
          title: `Daily Case (${cs.ind})`,
          diagnosis: cs.ind,
          outcome: data.cured ? "won" : "lost",
          score: data.score,
          vitals: { hr: data.cured ? 68 : 118, bp: data.cured ? "118/76" : "148/94", spo2: data.cured ? "99%" : "91%", tox: data.chartTox },
          drugs: data.drugs,
          synergies: data.synMsgs || [],
          interactions: data.ixMsgs || [],
          pearl: cs.pearl || (data.cured ? "Guideline-concordant therapy achieved optimal therapeutic index." : "Monitor for clinical contraindications and drug metabolism competition.")
        });
      };
    }

    if(copyBtn){
      copyBtn.onclick = ()=>{
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(shareText);
          toast("Results copied to clipboard!", "ok", "i-check");
        } else {
          toast("Result ready to share!", "info");
        }
      };
    }
  }
};

/* ---------- router ---------- */
const ROUTES=["home","campaign","library","arena"];

function go(route){
  if(typeof spotCleanup==="function"&&spotCleanup)spotCleanup();
  $$(".spot-back").forEach(el=>el.remove());

  // Handle query params e.g. #/case?code=...
  if(location.hash.startsWith("#/case")){
    const match = location.hash.match(/[?&]code=([^&]+)/);
    if(match && match[1] && typeof CaseMaker!=="undefined"){
      const data = CaseMaker.decodeCode(match[1]);
      if(data){
        CaseMaker.playCase(data);
        return;
      }
    }
  }

  if(route==="daily" && typeof DailyCase!=="undefined"){
    DailyCase.open();
    return;
  }
  if(route==="tutorial" && typeof CaseZero!=="undefined"){
    CaseZero.start();
    return;
  }
  if(route==="casemaker" && typeof CaseMaker!=="undefined"){
    CaseMaker.open();
    return;
  }

  if(!ROUTES.includes(route))route="home";
  $$(".view").forEach(v=>v.classList.remove("active"));
  const view=$("#view-"+route);
  if(view)view.classList.add("active");
  $$("#mainnav a").forEach(a=>{
    const isOn=a.dataset.route===route;
    a.classList.toggle("on",isOn);
    if(isOn&&a.scrollIntoView){
      try{a.scrollIntoView({inline:"center",behavior:"smooth",block:"nearest"});}catch(_){}
    }
  });
  if(route==="home")initHome();
  if(route==="campaign")enterCampaign();
  if(route==="library")initLibrary();
  if(route==="arena" && (!M || !M.isCustom)) enterDuel();
  scrollTo({top:0,behavior:"instant"in document.documentElement.style?"instant":"auto"});
}
function routeFromHash(){
  const raw=location.hash.replace(/^#\//,"").split("?")[0];
  return ROUTES.includes(raw)?raw:"home";
}
addEventListener("hashchange",()=>go(routeFromHash()));

document.addEventListener("click",e=>{
  const t=e.target.closest("[data-route]");
  if(!t)return;
  e.preventDefault();
  const r=t.dataset.route;
  if(r==="daily"){
    DailyCase.open();
    return;
  }
  if(r==="tutorial"){
    if(typeof CaseZero!=="undefined") CaseZero.start();
    return;
  }
  if(r==="casemaker"){
    if(typeof CaseMaker!=="undefined") CaseMaker.open();
    return;
  }
  if(location.hash==="#/"+r)go(r);
  else location.hash="#/"+r;
});

/* ---------- home hero ---------- */
function initHome(){
  // stats strip
  const legendaries=DRUGS.filter(d=>d.r==="LEGEND").length;
  const eras=new Set(DRUGS.map(d=>Math.floor(d.y/25)*25)).size;
  const discCount=Discovery.count();

  $("#hero-stats").innerHTML=`
    <span><b id="hero-stats-disc">${discCount} / ${DRUGS.length}</b>DISCOVERED</span>
    <span><b>${DRUGS.length}</b>REAL MEDICINES</span>
    <span><b>${Object.keys(AREAS).length}</b>THERAPEUTIC AREAS</span>
    <span><b>${legendaries}</b>LEGENDARY CARDS</span>
    <span><b>${INTERACTIONS.length}</b>INTERACTION RULES</span>
    <span><b>${eras}</b>ERAS OF DISCOVERY</span>`;

  // returning player continue campaign button
  const savedCamp = Store.get("campaign", null);
  const heroCtas = $(".hero-ctas");
  if(heroCtas && savedCamp && !savedCamp.over && savedCamp.year <= 20){
    let contBtn = $("#btn-hero-continue");
    if(!contBtn){
      contBtn = document.createElement("button");
      contBtn.id = "btn-hero-continue";
      contBtn.className = "btn btn-gold btn-lg";
      contBtn.innerHTML = `${icon("i-flask")} Continue Pharma (Year ${savedCamp.year} · ${fmtM(savedCamp.cash)})`;
      contBtn.onclick = ()=>{ location.hash = "#/campaign"; };
      heroCtas.prepend(contBtn);
    }
  }

  // floating legendary cards
  const holder=$("#hero-cards");
  if(!holder) return;
  if(window.innerWidth <= 920){
    holder.innerHTML = "";
    fillTicker($("#home-ticker"));
    return;
  }
  const legends=DRUGS.filter(d=>d.r==="LEGEND");
  const chosen=shuffle(legends).slice(0,3);
  holder.innerHTML="";

  const setupHeroCard=(wrap,d)=>{
    wrap.style.cursor="pointer";
    wrap.title=`Click to inspect ${d.n} (${d.cls})`;
    wrap.onclick=(e)=>{
      e.stopPropagation();
      SFX.click();
      if(typeof Discovery!=="undefined")Discovery.mark(d.id);
      openDetail(d);
    };
  };

  chosen.forEach(d=>{
    const wrap=document.createElement("div");
    wrap.className="hc";
    const card=makeCard(d,{flip:false});
    card.dataset.drugId=d.id;
    wrap.appendChild(card);
    setupHeroCard(wrap,d);
    holder.appendChild(wrap);
  });
  setInterval(()=>{
    if(window.innerWidth <= 920) return;
    if(!$("#view-home").classList.contains("active"))return;
    const wraps=$$("#hero-cards .hc");
    if(!wraps.length)return;
    const w=pick(wraps);
    w.style.transition="opacity .5s,transform .5s";
    w.style.opacity="0";w.style.transform="translateY(30px)";
    setTimeout(()=>{
      // Collect IDs of currently visible drugs to avoid duplicates
      const shownIds=new Set($$("#hero-cards .card").map(c=>c.dataset.drugId).filter(Boolean));
      const available=legends.filter(d=>!shownIds.has(d.id));
      const nextDrug=pick(available.length?available:legends);
      w.innerHTML="";
      const newCard=makeCard(nextDrug,{flip:false});
      newCard.dataset.drugId=nextDrug.id;
      w.appendChild(newCard);
      setupHeroCard(w,nextDrug);
      w.style.transition="none";w.style.transform="translateY(-30px)";
      requestAnimationFrame(()=>{
        w.style.transition="opacity .6s,transform .6s";
        w.style.opacity="";w.style.transform="";
      });
    },520);
  },5200);

  fillTicker($("#home-ticker"));
}

/* ---------- ticker ---------- */
function fillTicker(el){
  if(!el)return;
  const items=TICKER.map(t=>`<span><i>◆</i>${t}</span>`).join("");
  el.innerHTML=items+items; // duplicate for seamless marquee
}

/* ---------- sound toggle ---------- */
function wireSound(){
  const btn=$("#btn-sound");
  const setIcon=()=>{btn.innerHTML=icon(SFX.muted?"i-volx":"i-vol");};
  SFX.setMuted(Store.get("mute",false));
  setIcon();
  btn.onclick=()=>{SFX.setMuted(!SFX.muted);Store.set("mute",SFX.muted);setIcon();if(!SFX.muted)SFX.click();};
}

/* ---------- help modal ---------- */
function showHelp(){
  Modal.open({
    wide:true,
    kicker:"FIELD MANUAL",
    title:"How THERAPEUTIC INDEX works",
    html:`
      <div class="help-step"><span class="help-num">℞</span><p><b>The premise.</b> Every card is a real medicine whose gameplay stats derive from its actual pharmacology — half-life, bioavailability, efficacy, safety, CYP metabolism, and renal clearance.</p></div>
      <div class="help-step"><span class="help-num">1</span><p><b>Campaign — First in Human.</b> Screen compounds, fund trials for Data, push drugs through four development gates (they can fail — ~90% do in reality), launch, price, repurpose, extend patents, hire a CSO, survive events. Reach a $2.5B+ valuation in 20 years.</p></div>
      <div class="help-step"><span class="help-num">2</span><p><b>Arena — The Formulary Cup.</b> Draft a deck archetype, then treat best-of-3 clinical cases against an AI rival. Both teams prescribe into ONE shared chart with live <b>oscilloscope ECG cardiac monitoring</b>: guideline synergies pay out, CYP450 competition and real drug interactions hurt everyone nearby.</p></div>
      <div class="help-step"><span class="help-num">3</span><p><b>Case Zero Tutorial & Case Maker.</b> Master prescribing with an interactive 3-turn tutorial, or construct and share custom clinical cases via URL hashes.</p></div>
      <div class="help-step"><span class="help-num">4</span><p><b>The Compendium.</b> Browse all ${DRUGS.length} molecules. Filter by area, rarity, era; swipe through Spotlight mode; flip any card for its monograph; unlock Holo Foil masteries.</p></div>
      <div class="help-step"><span class="help-num">5</span><p><b>Daily Clinical Case.</b> Solve a unique seeded clinical case every day, earn streak trophies, and copy shareable results to your clipboard.</p></div>
      <div class="help-step"><span class="help-num">⚠</span><p><b>Watch for traps.</b> Terfenadine + ketoconazole got a drug withdrawn. CYP3A4 inhibitors with statins cause rhabdomyolysis. Allopurinol during an acute gout flare is a classic error. Anaphylaxis without epinephrine caps your score. The science IS the strategy.</p></div>`,
    actions:[{label:"Understood",val:"ok",primary:true}],
  });
}

/* ---------- boot ---------- */
(function boot(){
  wireSound();
  const btnHelp = $("#btn-help");
  if(btnHelp) btnHelp.onclick = showHelp;
  const btnDaily = $("#btn-daily");
  if(btnDaily) btnDaily.onclick = ()=>DailyCase.open();
  const btnTrophies = $("#btn-trophies");
  if(btnTrophies) btnTrophies.onclick = ()=>Achievements.showModal();
  initHome();
  go(routeFromHash());
})();