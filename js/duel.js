/* ============================================================
   THERAPEUTIC INDEX — duel.js
   "THE FORMULARY CUP" — Bo3 clinical cases vs AI.
   Shared patient chart: synergies reward smart polypharmacy,
   interactions punish careless polypharmacy.
   ============================================================ */

"use strict";

const DIFFS={
  intern:{label:"Intern",noise:0.45,blunder:0.3,desc:"Might prescribe kale for sepsis"},
  resident:{label:"Resident",noise:0.2,blunder:0.12,desc:"Competent, occasionally creative"},
  attending:{label:"Attending",noise:0.05,blunder:0.02,desc:"Reads the interaction table for fun"},
};

let M=null; // match state

/* ---------------- scoring engine ---------------- */
function matchInfo(d,cs){
  if(cs.key&&d.inds.join(" ").toLowerCase().includes(cs.key))
    return {mult:1.0,why:"Primary indication match"};
  for(const p of cs.pref||[]){
    if(p.ids&&p.ids.includes(d.id))return{mult:p.mult,why:p.why};
    if(p.tags&&p.tags.some(t=>d.tags.includes(t)))return{mult:p.mult,why:p.why};
  }
  if(d.a===cs.area)return{mult:0.55,why:"Same specialty, wrong tool"};
  return{mult:0.3,why:"Way off-label (still billable)"};
}
function toxOf(d,mods){
  let tox=(10-d.saf)*0.85;
  for(const m of mods){
    tox*=m.frag;
    if(m.hit.some(h=>d.tags.includes(h)))tox*=1.7;
  }
  return tox;
}
function hasTag(d,t){return d.tags.includes(t);}

function applyBoosters(chart){
  const msgs=[];
  for(const s of SYNERGIES){
    if(s.skip||!s.boost)continue;
    const src=chart.find(c=>c.d.id===s.boost.src);
    if(!src)continue;
    let tgt=null;
    if(s.boost.tgt==="__first_tag_art__")
      tgt=chart.find(c=>c.team===src.team&&hasTag(c.d,"art")&&c.d.id!==src.id);
    else
      tgt=chart.find(c=>c.team===src.team&&c.d.id===s.boost.tgt);
    if(tgt&&!tgt.boosted){
      tgt.boosted=true;tgt.effBoost=s.boost.mult;
      msgs.push({team:src.team,msg:s.msg});
    }
  }
  return msgs;
}
function teamSynergies(chart,team){
  const msgs=[];
  const mine=chart.filter(c=>c.team===team).map(c=>c.d);
  for(const s of SYNERGIES){
    if(s.skip||s.boost)continue;
    if(s.need.every(m=>mine.some(d=>matchesAny([m],d)))){
      msgs.push({bonus:s.bonus,msg:s.msg});
    }
  }
  return msgs;
}

/* Full resolution of the current chart */
function resolveChart(cs,mods){
  const boostMsgs=applyBoosters(M.chart);
  const rows=[],ixMsgs=[],synMsgs=[];
  const charged={0:0,1:0};

  // avoid-list penalties & mult overrides
  const avoidOf=d=>{
    for(const av of cs.avoid||[]){
      if(av.ids&&av.ids.includes(d.id))return av;
      if(av.tags&&av.tags.some(t=>hasTag(d,t)))return av;
    }
    return null;
  };

  // per-card rows
  for(const entry of M.chart){
    const d=entry.d;
    const info=matchInfo(d,cs);
    const av=avoidOf(d);
    let eff=d.eff*(entry.effBoost||1);
    let base=eff*info.mult*(1+0.12*(cs.sev-1));
    let why=info.why+(entry.effBoost?" · boosted":"");
    if(av){base*=av.mult;if(av.penalty)base-=av.penalty;why+=" · "+av.why;}
    // resistance pressure for antibiotics
    if(hasTag(d,"antibiotic")){
      const abx=M.chart.filter(c=>hasTag(c.d,"antibiotic"));
      const prior=abx.indexOf(entry);
      if(prior>0){const f=Math.pow(0.88,prior);base*=f;why+=` · resistance ×${prior}`;}
    }
    // CYP2D6 poor metabolizer
    if(mods.some(m=>m.id==="cyp2d6pm")&&d.cyp==="2D6"){base*=0.5;why+=" · CYP2D6 PM";}
    const tox=toxOf(d,mods);
    rows.push({team:entry.team,name:d.n,base,tox,net:base-tox,why});
  }

  // team synergies
  for(const team of [0,1]){
    for(const s of teamSynergies(M.chart,team)){
      synMsgs.push({team,msg:s.msg,bonus:s.bonus});
    }
  }

  // interactions (chart-global, split between owners)
  const pairsChecked=new Set();
  for(const ix of INTERACTIONS){
    if(ix.trio){
      const hasA=M.chart.some(c=>matchesAny(ix.a,c.d));
      const hasB=M.chart.some(c=>matchesAny(ix.b2[0],c.d));
      if(hasA&&hasB){
        const owners=M.chart.filter(c=>matchesAny(ix.a,c.d)||matchesAny(ix.b,c.d)||matchesAny(ix.b2,c.d));
        owners.forEach(o=>charged[o.team]+=ix.dmg/Math.max(1,owners.length));
        ixMsgs.push({msg:ix.msg,dmg:ix.dmg});
      }
      continue;
    }
    for(const ea of M.chart)for(const eb of M.chart){
      if(ea===eb||ea.d.id===eb.d.id)continue;
      if(matchesAny(ix.a,ea.d)&&matchesAny(ix.b,eb.d)){
        const pk=ix.msg+"|"+[ea.d.id,eb.d.id].sort().join("|");
        if(pairsChecked.has(pk))continue;
        pairsChecked.add(pk);
        charged[ea.team]+=ix.dmg/2;charged[eb.team]+=ix.dmg/2;
        ixMsgs.push({msg:ix.msg,dmg:ix.dmg});
      }
    }
  }
  charged[0]=Math.min(charged[0],22);charged[1]=Math.min(charged[1],22);

  // totals
  const totals={0:0,1:0},toxTotals={0:0,1:0};
  for(const r of rows){totals[r.team]+=r.base;toxTotals[r.team]+=r.tox;}
  for(const s of synMsgs)totals[s.team]+=s.bonus;
  for(const t of [0,1]){totals[t]-=charged[t];toxTotals[t]+=charged[t];}

  // asymmetric stability check
  let stabilityMsg=null;
  const totalTox=toxTotals[0]+toxTotals[1];
  if(totalTox>24){
    const p0 = (toxTotals[0] || 0) / Math.max(0.1, totalTox);
    const pen0 = clamp(Math.round(12 * p0), 1, 11);
    const pen1 = 12 - pen0;
    totals[0]-=pen0; totals[1]-=pen1;
    stabilityMsg=`Patient destabilized (Tox ${Math.round(totalTox)}). Destabilization penalty split by toxicity share: You −${pen0}, Rival −${pen1}.`;
  }

  // required-drug rule
  let reqMsg=null;
  if(cs.req){
    for(const team of [0,1]){
      if(!M.chart.some(c=>c.team===team&&cs.req.includes(c.d.id))){
        totals[team]=Math.min(totals[team],5);
        reqMsg=team===0?"You skipped the mandatory agent — your score is capped."
                        :"The rival skipped the mandatory agent — their score is capped.";
      }
    }
  }

  // specials
  const specialMsgs=[];
  if(cs.special==="tb_mono"){
    for(const team of [0,1]){
      const tb=M.chart.filter(c=>c.team===team&&hasTag(c.d,"tb"));
      if(tb.length===1){totals[team]-=4;specialMsgs.push({team,msg:"TB monotherapy breeds resistance — −4."});}
    }
  }
  if(cs.special==="haart"){
    for(const team of [0,1]){
      const arts=M.chart.filter(c=>c.team===team&&hasTag(c.d,"art"));
      if(arts.length>0&&arts.length<3){totals[team]-=3;specialMsgs.push({team,msg:"Incomplete ART regimen — resistance door left open (−3)."});}
    }
  }
  if(cs.special==="cure_hcv"){
    for(const team of [0,1]){
      if(M.chart.some(c=>c.team===team&&c.d.id==="sof")){
        totals[team]+=12;specialMsgs.push({team,msg:"Sustained virologic response — HCV CURED. +12."});
      }
    }
  }

  return {rows,totals,toxTotals,ixMsgs,synMsgs,stabilityMsg,reqMsg,specialMsgs,boostMsgs,totalTox};
}

/* ---------------- AI ---------------- */
function aiPick(cs,mods){
  const legal=M.hands[1];
  if(!legal.length)return null;
  const diff=DIFFS[M.diff];
  const save=M.chart;
  const scored=legal.map(id=>{
    const d=DRUG[id];
    M.chart=[...save,{d,team:1}];
    const r=resolveChart(cs,mods);
    M.chart=save;
    return {d,ev:r.totals[1]+(Math.random()-0.5)*diff.noise*10};
  }).sort((a,b)=>b.ev-a.ev);
  if(Math.random()<diff.blunder)return DRUG[pick(legal)];
  if(scored[0].ev<1.2)return null; // pass
  return scored[0].d;
}

/* ---------------- setup screen ---------------- */
function isDiffUnlocked(diff){
  if(diff==="intern")return true;
  if(diff==="resident")return Store.get("cup_won_intern",0)>=1 || Store.get("streak",0)>=1;
  if(diff==="attending")return Store.get("cup_won_resident",0)>=1;
  return false;
}

function enterDuel(){
  const wIntern = Store.get("cup_won_intern",0);
  const wRes = Store.get("cup_won_resident",0);
  const wAtt = Store.get("cup_won_attending",0);
  const totalCups = wIntern + wRes + wAtt;

  let selDeck=null,selDiff="intern";
  if(isDiffUnlocked("resident"))selDiff="resident";

  $("#d-root").innerHTML=`
  <div class="duel-setup">
    <h2 class="view-title">DUEL · THE FORMULARY CUP</h2>
    <p class="view-sub">The competitive training gym. Best-of-3 clinical cases against an AI rival on a shared patient chart using balanced archetype decks or your custom pharma franchise.</p>
    <div class="deck-row" id="deck-row"></div>
    <div class="diff-row">
      <span class="dim small mono" style="letter-spacing:.14em">OPPONENT SKILL</span>
      ${Object.entries(DIFFS).map(([k,v])=>{
        const unl = isDiffUnlocked(k);
        const lockReason = k==='resident'?'Beat Intern to unlock Resident':'Beat Resident to unlock Attending';
        return `<button class="fchip ${k===selDiff?"on":""} ${unl?"":"locked"}" data-diff="${k}" title="${unl?v.desc:'🔒 '+lockReason}" style="--fc:#ff5470">
          ${v.label} ${unl?"":"🔒"}
        </button>`;
      }).join("")}
      <span class="streak-note" id="streak-note"></span>
    </div>
    <div class="cup-trophy-strip mono small dim">
      <span>${icon("i-trophy")} TOTAL CUPS WON: <b>${totalCups}</b></span>
      <span>INTERN: <b>${wIntern}</b> · RESIDENT: <b>${wRes}</b> · ATTENDING: <b>${wAtt}</b></span>
    </div>
    <div class="m-actions" style="max-width:420px;margin-top:16px">
      <button class="btn btn-primary btn-lg" id="btn-start-duel" disabled>${icon("i-trophy")}Enter the Cup</button>
    </div>
  </div>`;

  const streak=Store.get("streak",0);
  $("#streak-note").textContent=streak>0?`CURRENT STREAK: ${streak}`:"";

  const camp = Store.get("campaign");
  const compCards = [...new Set([...(camp?.mkt||[]).map(m=>m.id), ...(camp?.pipe||[]).map(p=>p.id)])].filter(id=>DRUG[id]);
  const allArchetypes = [...ARCHETYPES];
  if(compCards.length > 0){
    const STAPLES = ["asp", "epi", "salbu", "amox", "furos", "lisin", "acetam", "diph"];
    const merged = [...compCards];
    for(const s of STAPLES){
      if(!merged.includes(s) && merged.length < 12) merged.push(s);
    }
    allArchetypes.unshift({
      id: "company_deck",
      name: `Pharma Franchise (Yr ${camp.year||1})`,
      icon: "i-flask",
      c: "#ffd166",
      desc: `Your company's pipeline (${compCards.slice(0,3).map(id=>DRUG[id].n).join(", ")}) + hospital emergency staples.`,
      cards: merged,
      isCompany: true
    });
  }

  const row=$("#deck-row");
  allArchetypes.forEach(a=>{
    const b=document.createElement("button");
    b.className=`deck-card ${a.isCompany?"company-deck-highlight":""}`;
    b.style.setProperty("--dc",a.c);
    const sample=(a.random?"random pool":a.cards.slice(0,4).map(id=>DRUG[id].n).join(", ")+"…");
    b.innerHTML=`<div class="dn">${icon(a.icon)}${a.name} ${a.isCompany?`<span class="mono tag-mini" style="color:var(--gold);border-color:rgba(255,209,102,0.4)">CUSTOM</span>`:""}</div><div class="dd">${a.desc}</div>
      <div class="dk">${(a.random?["?"]:a.cards.slice(0,5)).map(()=>"<span class='cb-tag'>card</span>").join("")}</div>
      <div class="small dim mono" style="margin-top:8px">${esc(sample)}</div>`;
    b.onclick=()=>{SFX.click();$$(".deck-card",row).forEach(x=>x.classList.remove("on"));b.classList.add("on");selDeck=a.id;$("#btn-start-duel").disabled=false;};
    row.appendChild(b);
  });
  $$("[data-diff]").forEach(b=>{
    b.onclick=()=>{
      const diff = b.dataset.diff;
      if(!isDiffUnlocked(diff)){
        SFX.bad();
        const req = diff==="resident"?"Beat Intern difficulty to unlock Resident!":"Beat Resident difficulty to unlock Attending!";
        toast(req, "info", "i-alert");
        return;
      }
      SFX.click();
      $$("[data-diff]").forEach(x=>x.classList.remove("on"));
      b.classList.add("on");selDiff=diff;
    };
  });
  $("#btn-start-duel").onclick=()=>{if(selDeck)startMatch(selDeck,selDiff);};
}

/* ---------------- match flow ---------------- */
function startMatch(deckId,diff){
  let arch=ARCHETYPES.find(a=>a.id===deckId);
  if(deckId === "company_deck"){
    const camp = Store.get("campaign");
    const compCards = [...new Set([...(camp?.mkt||[]).map(m=>m.id), ...(camp?.pipe||[]).map(p=>p.id)])].filter(id=>DRUG[id]);
    const STAPLES = ["asp", "epi", "salbu", "amox", "furos", "lisin", "acetam", "diph"];
    const merged = [...compCards];
    for(const s of STAPLES){
      if(!merged.includes(s) && merged.length < 12) merged.push(s);
    }
    arch = {
      id: "company_deck",
      name: `Pharma Franchise (Yr ${camp?.year||1})`,
      cards: merged
    };
  }
  const mkDeck=a=>a.random
    ?shuffle(DRUGS.filter(d=>d.r!=="BANNED")).slice(0,12).map(d=>d.id)
    :shuffle(a.cards);
  const aiArch=pick(ARCHETYPES.filter(a=>a.id!==deckId));
  const userDeck = mkDeck(arch);
  if(typeof Discovery!=="undefined"){
    userDeck.forEach(id=>Discovery.mark(id));
  }
  M={
    deckId,diff,
    decks:[userDeck,mkDeck(aiArch)],
    deckPos:[0,0],hands:[[],[]],
    chart:[],caseNo:0,score:[0,0],
    insights:new Set(),archNames:[arch.name,aiArch.name],
    rival:pick(RIVALS),busy:false,consultUsed:false,
  };
  renderArenaShell();
  nextCase();
}

function renderArenaShell(){
  $("#d-root").innerHTML=`
  <div class="duel-top">
    <div class="row">
      <span class="chip">${icon("i-user")}YOU · ${esc(M.archNames[0])}</span>
      <span class="vs-pill">VS</span>
      <span class="chip">${icon("i-user")}${esc(M.rival)} · ${esc(M.archNames[1])}</span>
    </div>
    <div class="pips" id="match-pips"></div>
    <button class="btn btn-sm" id="btn-forfeit" style="margin-left:auto">${icon("i-x")}Forfeit</button>
  </div>
  <div id="duel-body"></div>`;
  $("#btn-forfeit").onclick=async()=>{
    const v=await Modal.ask({title:"Forfeit the match?",html:"<p>The cup remembers cowardice.</p>",
      actions:[{label:"Keep fighting",val:null},{label:"Forfeit",val:"yes",cls:"btn-danger"}]});
    if(v==="yes"){M=null;enterDuel();}
  };
  updatePips();
}
function updatePips(){
  const el=$("#match-pips");if(!el)return;
  el.innerHTML=[0,1].map(t=>{
    const wins=M.score[t];
    return `<span class="pip ${wins>0?"won":""} ${t===0?"you":"ai"}"></span>`.repeat(Math.min(wins,2));
  }).join("")||'<span class="dim small mono">FIRST TO 2 CASES</span>';
}

function nextCase(){
  M.caseNo++;
  M.chart=[];M.hands=[[],[]];M.deckPos=[0,0];M.passes=0;M.ply=0;M.busy=false;M.consultUsed=false;
  const {cs,mods}=pickCase();
  M.cs=cs;M.mods=mods;
  dealHands();dealHands();dealHands();dealHands();dealHands(); // deal up to 5 each
  renderCase();
  SFX.whoosh();
}

function pickCase(){
  for(let tries=0;tries<40;tries++){
    const cs=pick(CASES);
    const modsN=Math.random()<0.65?1:2;
    const mods=shuffle(MODS.slice()).slice(0,modsN);
    const union=[...M.decks[0],...M.decks[1]];
    const hasAnswer=union.some(id=>matchInfo(DRUG[id],cs).mult>=0.9);
    if(hasAnswer||tries===39)return {cs,mods};
  }
}

function dealHands(){
  for(const t of [0,1]){
    if(M.hands[t].length<5&&M.deckPos[t]<M.decks[t].length){
      M.hands[t].push(M.decks[t][M.deckPos[t]++]);
    }
  }
}

function renderCase(){
  const cs=M.cs;
  const deckRemaining = Math.max(0, M.decks[0].length - M.deckPos[0]);
  $("#duel-body").innerHTML=`
  <div class="case-panel panel" style="--ca:${cs.ca}">
    <div class="spread">
      <div>
        <div class="m-kicker" style="color:${cs.ca}">CLINICAL CASE ${M.caseNo} OF 3</div>
        <div class="case-ind">${esc(cs.ind)}</div>
      </div>
      <div class="case-sev" title="Severity">${icon("i-skull").repeat(cs.sev)}</div>
    </div>
    <div class="case-mods">
      ${M.mods.map(m=>`<span class="mod-chip" title="${esc(m.note)}">${icon("i-alert")}${esc(m.label)}</span>`).join("")}
    </div>
  </div>

  <div class="chart-zone">
    <div class="tray you" id="tray-you"><span class="tray-label">YOUR ORDERS</span></div>
    <div class="tray ai" id="tray-ai"><span class="tray-label">${esc(M.rival).toUpperCase()}</span></div>
  </div>

  <div id="ecg-monitor-mount">
    <div class="stability panel">
      <span class="lbl">PATIENT CARDIAC MONITOR</span>
      <div class="bar rose"><i id="stab-fill" style="width:0%"></i></div>
      <span class="val" id="stab-val">0</span>
    </div>
  </div>

  <div class="hand-dock panel">
    <div class="spread" style="margin-bottom:4px">
      <h4 style="margin:0">${icon("i-stack")} Your hand — click a card to administer</h4>
      <span class="small dim mono" id="ply-count"></span>
    </div>
    <div class="hand-cards" id="hand-cards"></div>
    <div class="duel-controls">
      <button class="btn btn-sm btn-ctrl" id="btn-consult" ${M.consultUsed||M.busy||!M.hands[0].length||deckRemaining===0?"disabled":""} title="Consult senior: Swap a card from hand for the next card in your deck">
        ${icon("i-refresh")}<span class="ctrl-lbl">Senior</span> <span class="deck-count-badge">(${deckRemaining})</span>
      </button>
      <button class="btn btn-sm btn-ctrl" id="btn-pass" title="Pass turn to opponent">
        ${icon("i-clock")}<span class="ctrl-lbl">Pass</span>
      </button>
      <button class="btn btn-sm btn-primary btn-ctrl" id="btn-resolve" title="Conclude case and calculate scores">
        ${icon("i-check")}<span class="ctrl-lbl">Resolve</span>
      </button>
    </div>
    <div class="duel-hint mono small dim" style="margin-top:8px;letter-spacing:.08em">CLICK CARD TO ADMINISTER · PASS TURN · RESOLVE ANYTIME · FORFEIT ↗</div>
    <div id="ai-thinking"></div>
  </div>

  <div class="panel panel-pad ledger-box" id="ledger-box" hidden>
    <h4>${icon("i-book")} Case resolution</h4>
    <div id="ledger-body"></div>
    <div class="score-duel" id="score-duel"></div>
    <div class="m-actions" id="next-case-actions"></div>
  </div>`;

  if(typeof ECGMonitor !== "undefined"){
    const mount = $("#ecg-monitor-mount");
    if(mount){
      if(M.ecg) { try{ M.ecg.destroy(); }catch(e){} }
      try {
        M.ecg = new ECGMonitor(mount);
      } catch(e){}
    }
  }

  renderHand();renderTrays();
  $("#btn-consult").onclick=consultSenior;
  $("#btn-pass").onclick=playerPass;
  $("#btn-resolve").onclick=()=>resolveCase(true);
}

function consultSenior(){
  if(M.consultUsed || M.busy || !M.hands[0].length) return;
  const deckRemaining = Math.max(0, M.decks[0].length - M.deckPos[0]);
  const back = Modal.open({
    kicker:"CONSULT SENIOR · MULLIGAN",
    title:"Swap one card from hand",
    html:`<p>Select one medication from your hand to discard. You'll draw the next compound from your deck in its place <b>(${deckRemaining} remaining in deck)</b>. <i>(Once per case)</i></p>
      <div class="starter-row" id="consult-row"></div>`,
    actions:[{label:"Cancel",val:null}],
  });
  const row = $("#consult-row", back);
  M.hands[0].forEach((id, idx)=>{
    const d = DRUG[id];
    const wrap = document.createElement("div");
    wrap.className = "starter-opt";
    const card = makeCard(d, {size:"mini"});
    wrap.appendChild(card);
    const swapBtn = document.createElement("button");
    swapBtn.className = "btn btn-sm btn-primary";
    swapBtn.style.marginTop = "8px";
    swapBtn.innerHTML = `${icon("i-refresh")} Discard ${esc(d.n)}`;
    swapBtn.onclick = ()=>{
      Modal.close(back);
      M.hands[0].splice(idx, 1);
      M.consultUsed = true;
      if(M.deckPos[0] < M.decks[0].length){
        const newId = M.decks[0][M.deckPos[0]++];
        M.hands[0].push(newId);
        toast(`Consultation complete: Swapped <b>${esc(d.n)}</b> for <b>${esc(DRUG[newId].n)}</b>.`, "info", "i-check");
      }else{
        toast(`Consultation complete: Discarded <b>${esc(d.n)}</b> (Deck empty).`, "info", "i-info");
      }
      SFX.flip();
      renderHand();
      const b=$("#btn-consult");if(b)b.disabled=true;
    };
    wrap.appendChild(swapBtn);
    row.appendChild(wrap);
  });
}

function renderHand(){
  const el=$("#hand-cards");if(!el)return;
  el.innerHTML="";
  M.hands[0].forEach((id,i)=>{
    const d=DRUG[id];
    const card=makeCard(d,{size:"mini"});
    if(M.busy){
      card.classList.add("dimmed");
    }else{
      card.classList.add("playable");
      card.onclick=()=>playCard(i);
    }
    const risk = quickRisk(d);
    if(risk){
      card.classList.add("has-risk");
      card.title=`⚠ RISK: ${risk}\n${d.n} — ${d.cls}`;
      const pip = document.createElement("span");
      pip.className = "danger-pip";
      pip.title = `⚠ Interacts with chart: ${risk}`;
      pip.innerHTML = icon("i-alert");
      card.appendChild(pip);
    }else{
      card.title=d.n+" — "+d.cls;
    }
    el.appendChild(card);
  });
  $("#ply-count").textContent=`ROUND ${Math.floor(M.ply/2)+1} · ${M.chart.length} ORDERS ON CHART`;

  const deckRemaining = Math.max(0, M.decks[0].length - M.deckPos[0]);
  const btnConsult = $("#btn-consult");
  if(btnConsult) btnConsult.disabled = M.consultUsed || M.busy || !M.hands[0].length || deckRemaining === 0;
  const btnPass = $("#btn-pass");
  if(btnPass) btnPass.disabled = M.busy || M.ply >= 8;
  const btnResolve = $("#btn-resolve");
  if(btnResolve) btnResolve.disabled = M.busy;
}
function renderTrays(){
  for(const t of [0,1]){
    const tray=$(t===0?"#tray-you":"#tray-ai");
    if(!tray)continue;
    $$(".card",tray).forEach(c=>c.remove());
    let empty=true;
    for(const e of M.chart){
      if(e.team!==t)continue;empty=false;
      const c=makeCard(DRUG[e.d.id],{size:"xmini"});
      tray.appendChild(c);
    }
    if(empty){
      const sp=document.createElement("span");
      sp.className="tray-empty";sp.textContent="awaiting orders…";
      tray.appendChild(sp);
    }
  }
  let tox = 0;
  try {
    const r = resolveChart(M.cs, M.mods);
    tox = r.totalTox !== undefined ? r.totalTox : M.chart.reduce((s,e)=>s+toxOf(e.d,M.mods),0);
  } catch(e) {
    tox = M.chart.reduce((s,e)=>s+toxOf(e.d,M.mods),0);
  }
  const hasQT = M.chart.some(e=>hasTag(e.d, "qt"));
  const isFlatline = tox >= 30;
  if(M && M.ecg){
    try {
      M.ecg.setToxicity(tox, hasQT, isFlatline);
    } catch(e){}
  }
  const stabFill = $("#stab-fill");
  if(stabFill) stabFill.style.width=clamp(tox/30*100,0,100)+"%";
  const stabVal = $("#stab-val");
  if(stabVal) stabVal.textContent=Math.round(tox);
  const stabEl = $(".stability");
  if(stabEl) stabEl.classList.toggle("hot",tox>18);
}

function playCard(handIdx){
  if(M.busy||M.ply>=8)return;
  const id=M.hands[0][handIdx];
  if(!id)return;
  M.busy=true;
  M.hands[0].splice(handIdx,1);
  M.chart.push({d:DRUG[id],team:0});
  M.passes=0;M.ply++;
  if(typeof Discovery!=="undefined")Discovery.mark(id);
  SFX.flip();
  if(typeof Haptics!=="undefined")Haptics.light();
  renderHand();renderTrays();
  $("#ai-thinking").innerHTML=`<div class="thinking"><span class="dots"><i></i><i></i><i></i></span>${esc(M.rival)} is reviewing clinical guidelines…</div>`;
  // warn about obvious interaction risk
  const risk=quickRisk(DRUG[id]);
  if(risk){
    toast(risk,"bad","i-alert");
    if(typeof Haptics!=="undefined")Haptics.error();
  }
  setTimeout(aiTurn,750);
}

function quickRisk(d){
  for(const ix of INTERACTIONS){
    if(ix.trio)continue;
    if(matchesAny(ix.a,d)&&M.chart.some(c=>matchesAny(ix.b,c.d)&&c.d.id!==d.id))return ix.msg;
    if(matchesAny(ix.b,d)&&M.chart.some(c=>matchesAny(ix.a,c.d)&&c.d.id!==d.id))return ix.msg;
  }
  return null;
}

function playerPass(){
  if(M.busy||M.ply>=8)return;
  M.busy=true;M.passes++;M.ply++;
  renderHand();
  toast("You pass.","info");
  $("#ai-thinking").innerHTML=`<div class="thinking"><span class="dots"><i></i><i></i><i></i></span>${esc(M.rival)} is considering next move…</div>`;
  if(M.passes>=2)return setTimeout(()=>resolveCase(false),400);
  setTimeout(aiTurn,600);
}

function aiTurn(){
  dealHands();
  const d=aiPick(M.cs,M.mods);
  if(!d){
    M.passes++;M.ply++;
    $("#ai-thinking").innerHTML=`<div class="thinking"><span class="dots"><i></i><i></i><i></i></span>${esc(M.rival)} passes…</div>`;
    if(M.passes>=2)return setTimeout(()=>resolveCase(false),700);
    M.busy=false;renderHand();
    return;
  }
  M.passes=0;M.ply++;
  const idx=M.hands[1].indexOf(d.id);
  if(idx>=0)M.hands[1].splice(idx,1);
  M.chart.push({d,team:1});
  if(typeof Discovery!=="undefined")Discovery.mark(d.id);
  $("#ai-thinking").innerHTML=`<div class="thinking"><span class="dots"><i></i><i></i><i></i></span>${esc(M.rival)} administers <b>${esc(d.n)}</b>…</div>`;
  SFX.flip();
  renderTrays();
  setTimeout(()=>{$("#ai-thinking").innerHTML="";M.busy=false;renderHand();},850);
  if(M.ply>=8)setTimeout(()=>{M.busy=false;resolveCase(false);},1100);
}

/* ---------------- resolution ---------------- */
async function resolveCase(early){
  if(M.busy&&early)return;
  M.busy=true;
  const r=resolveChart(M.cs,M.mods);

  // collect insights
  r.ixMsgs.forEach(x=>M.insights.add("⚠ "+x.msg));
  r.synMsgs.forEach(x=>M.insights.add("✚ "+x.msg));
  r.specialMsgs.forEach(x=>M.insights.add("★ "+x.msg));
  if(r.stabilityMsg)M.insights.add("⚠ "+r.stabilityMsg);
  if(r.reqMsg)M.insights.add("⚠ "+r.reqMsg);

  // check achievements
  if(typeof Achievements!=="undefined"){
    if(M.chart.some(c=>c.team===0&&c.d.id==="artem") && r.totals[0]>r.totals[1])Achievements.unlock("tuyouyou");
    if(r.toxTotals[0]===0 && r.totals[0]>r.totals[1])Achievements.unlock("primum");
    if(r.synMsgs.filter(s=>s.team===0).length>=2)Achievements.unlock("polypharm");
    if(M.cs.id==="anaph" && M.chart.some(c=>c.team===0&&c.d.id==="epi"))Achievements.unlock("anaphylaxis_hero");
    if(M.cs.id==="hcv" && M.chart.some(c=>c.team===0&&c.d.id==="sof"))Achievements.unlock("hcv_cure");
  }

  const box=$("#ledger-box");box.hidden=false;
  const body=$("#ledger-body");
  body.innerHTML="";
  box.scrollIntoView({behavior:"smooth",block:"nearest"});

  const seq=[
    ...r.rows.map(row=>({kind:"row",row})),
    ...r.boostMsgs.map(b=>({kind:"msg",cls:"good",txt:b.msg})),
    ...r.synMsgs.map(s=>({kind:"msg",cls:"good",txt:`${s.msg} (+${s.bonus})`})),
    ...r.ixMsgs.map(x=>({kind:"msg",cls:"warn",txt:`${x.msg} (−${x.dmg} split)`})),
    ...r.specialMsgs.map(s=>({kind:"msg",cls:s.msg.includes("CURED")||s.msg.includes("+")?"good":"warn",txt:s.msg})),
    ...(r.stabilityMsg?[{kind:"msg",cls:"warn",txt:r.stabilityMsg}]:[]),
    ...(r.reqMsg?[{kind:"msg",cls:"warn",txt:r.reqMsg}]:[]),
  ];

  for(const item of seq){
    await new Promise(res=>setTimeout(res,240));
    if(item.kind==="row"){
      const el=document.createElement("div");
      el.className="res-row";
      el.innerHTML=`<span class="who" style="background:${item.row.team===0?"var(--sky)":"var(--rose)"}"></span>
        <span class="cn">${esc(item.row.name)}</span>
        <span class="why">${esc(item.row.why)}</span>
        <span class="delta ${item.row.net>=0?"pos":"neg"}">${item.row.net>=0?"+":""}${item.row.net.toFixed(1)}</span>`;
      body.appendChild(el);
      SFX.tick();
    }else{
      const el=document.createElement("div");
      el.className=`res-msg ${item.cls}`;
      el.innerHTML=icon(item.cls==="good"?"i-link":"i-alert")+`<span>${esc(item.txt)}</span>`;
      body.appendChild(el);
      if(item.cls==="good"){
        SFX.good();
        if(typeof Haptics!=="undefined")Haptics.synergy();
      }else{
        SFX.bad();
        if(typeof Haptics!=="undefined")Haptics.error();
      }
    }
  }

  // score bars
  const maxT=Math.max(1,Math.abs(r.totals[0]),Math.abs(r.totals[1]));
  $("#score-duel").innerHTML=`
    <div class="sd-side"><div class="lbl">YOU</div><div class="num" style="color:${r.totals[0]>=r.totals[1]?"var(--sky)":"var(--mut)"}">${r.totals[0].toFixed(1)}</div></div>
    <div class="sd-vs">VS</div>
    <div class="sd-side" style="text-align:right"><div class="lbl">${esc(M.rival).toUpperCase()}</div><div class="num" style="color:${r.totals[1]>=r.totals[0]?"var(--rose)":"var(--mut)"}">${r.totals[1].toFixed(1)}</div></div>`;

  await new Promise(res=>setTimeout(res,500));

  // winner
  let winner=-1;
  if(r.totals[0]>r.totals[1])winner=0;
  else if(r.totals[1]>r.totals[0])winner=1;
  else{
    // tie-break: cleaner regimen
    if(r.toxTotals[0]<r.toxTotals[1])winner=0;
    else if(r.toxTotals[1]<r.toxTotals[0])winner=1;
  }
  if(winner>=0){
    M.score[winner]++;
    const stamp=document.createElement("div");
    stamp.style.textAlign="center";stamp.style.marginTop="12px";
    stamp.innerHTML=`<span class="stamp ${winner===0?"ok":"bad"}">${winner===0?"CASE WON":"CASE LOST"}</span>`;
    body.appendChild(stamp);
    if(winner===0){
      SFX.good();
      if(typeof Haptics!=="undefined")Haptics.success();
    }else{
      SFX.bad();
      if(typeof Haptics!=="undefined")Haptics.error();
    }
    if(winner===0)confettiCenter(["#4cc9f0","#ffd166"]);
  }else{
    const stamp=document.createElement("div");
    stamp.style.textAlign="center";stamp.style.marginTop="12px";
    stamp.innerHTML=`<span class="stamp" style="color:var(--mut);border-color:var(--mut)">DEAD HEAT</span>`;
    body.appendChild(stamp);
  }
  updatePips();

  // next / end / discharge debrief
  const acts=$("#next-case-actions");
  acts.innerHTML="";

  const done=M.score[0]>=2||M.score[1]>=2||M.caseNo>=3;
  const yourOrders=M.chart.filter(e=>e.team===0).map(e=>e.d);

  if(!M.caseSummaries) M.caseSummaries = [];
  const curSummary = {
    title: M.cs.n || `Clinical Case #${M.caseNo}`,
    diagnosis: M.cs.ind || "Clinical Presentation",
    outcome: winner===0?"won":winner===1?"lost":"draw",
    score: r.totals[0],
    rivalScore: r.totals[1],
    rivalName: M.rival,
    vitals: {
      hr: M.ecg ? M.ecg.hr : 74,
      bp: M.ecg && M.ecg.bpEl ? M.ecg.bpEl.textContent : "120/80",
      spo2: M.ecg && M.ecg.spo2El ? M.ecg.spo2El.textContent : "98%",
      tox: Math.round(r.toxTotals[0])
    },
    drugs: yourOrders,
    synergies: r.synMsgs,
    interactions: r.ixMsgs,
    pearl: M.cs.pearl || (winner===0?"Target organ perfusion stabilized under guideline regimen.":"Review adverse drug interaction pathways before multi-agent ordering.")
  };
  M.caseSummaries.push(curSummary);

  if (M.isPivotalTrial) {
    const won = winner === 0;
    const camp = Store.get("campaign");
    if (camp) {
      const p = camp.pipe.find(x => x.id === M.pivotalDrugId);
      if (won) {
        if (p) p.stage = 4; // Filed / FDA ready
        camp.cash = (camp.cash || 0) + 35;
        camp.rep = Math.min(100, (camp.rep || 50) + 6);
        toast(`Pivotal Trial Won! ${DRUG[M.pivotalDrugId]?.n} FDA Filing Secured (+$35M)`, "gold", "i-trophy");
      } else {
        camp.data = (camp.data || 0) + 15;
        toast(`Trial missed primary endpoint (+15 Data harvested)`, "info", "i-dna");
      }
      Store.set("campaign", camp);
    }
    
    const openPivotalDebrief = () => {
      showClinicalDebriefModal({
        ...curSummary,
        actionLabel: won ? "Return to Pharma Empire (Filing Secured) →" : "Return to Pharma Empire →",
        onClose: () => {
          location.hash = "#/campaign";
        }
      });
    };
    
    const pBtn = document.createElement("button");
    pBtn.className = "btn btn-primary";
    pBtn.innerHTML = icon("i-flask") + (won ? "Return to Campaign (Approved)" : "Return to Campaign");
    pBtn.onclick = () => { location.hash = "#/campaign"; };
    acts.appendChild(pBtn);

    setTimeout(openPivotalDebrief, 650);
    return;
  }

  const openDebrief = () => {
    showClinicalDebriefModal({
      ...curSummary,
      actionLabel: done ? "See Match Verdict" : "Next Clinical Case",
      onClose: () => {
        if(done){
          endMatch();
        } else {
          box.hidden = true;
          nextCase();
        }
      }
    });
  };

  // Button in bottom ledger
  const debriefBtn=document.createElement("button");
  debriefBtn.className="btn btn-outline";
  debriefBtn.innerHTML=icon("i-flask")+"Discharge Summary";
  debriefBtn.onclick=openDebrief;
  acts.appendChild(debriefBtn);

  const btn=document.createElement("button");
  btn.className="btn btn-primary";
  if(done){btn.innerHTML=icon("i-flag")+"See verdict";btn.onclick=endMatch;}
  else{btn.innerHTML=icon("i-ar")+"Next case";btn.onclick=()=>{box.hidden=true;nextCase();};}
  acts.appendChild(btn);

  // Automatically open the debrief modal after suspense
  setTimeout(openDebrief, 650);
}

function endMatch(){
  const won=M.score[0]>=2;
  if(won){
    Store.set("streak",Store.get("streak",0)+1);
    Store.set("cup_won_"+M.diff, Store.get("cup_won_"+M.diff, 0) + 1);
    if(M.diff==="attending"&&typeof Achievements!=="undefined")Achievements.unlock("attending_cup");
    if(typeof FoilMastery!=="undefined"&&M.decks[0].length){
      const mvp = pick(M.decks[0]);
      FoilMastery.unlock(mvp);
      toast(`<b>Mastery Unlocked:</b> Holo Foil ${DRUG[mvp].n}!`, "gold", "i-star");
    }
    confettiCenter(["#ffd166","#2fd6a5","#7ee0ff","#ff8ba0"]);
    SFX.good();
    if(typeof Haptics!=="undefined")Haptics.success();
  }else{
    const prevStreak = Store.get("streak", 0);
    Store.set("streak",0);
    if(prevStreak > 0) toast(`Streak broken — back to 0. (Was ${prevStreak})`, "bad", "i-alert");
    SFX.bad();
    if(typeof Haptics!=="undefined")Haptics.error();
  }
  const insights=[...M.insights].slice(0,10);
  Modal.open({
    wide:true,
    kicker:"THE FORMULARY CUP",
    title:won?"CUP SECURED":"CUP LOST",
    html:`
      <div class="end-hero">
        <div class="cup-icon">${icon("i-trophy")}</div>
        <div class="end-rank" style="font-size:24px">${won?"CHAMPIONS OF THE WARD ROUND":"THE RIVAL SERVICE WINS"}</div>
        <p class="mut">Final score: <b>You ${M.score[0]} — ${M.score[1]} ${esc(M.rival)}</b>. Streak: ${Store.get("streak",0)}</p>
        ${insights.length?`<div class="insight-list" style="text-align:left;margin-top:16px">
          <b class="small mono dim" style="letter-spacing:.16em">WHAT THE CHART TAUGHT YOU</b>
          ${insights.map(i=>`<div class="res-msg ${i.startsWith("✚")||i.startsWith("★")?"good":"warn"}">${icon(i.startsWith("✚")||i.startsWith("★")?"i-link":"i-alert")}<span>${esc(i.slice(2))}</span></div>`).join("")}
        </div>`:""}
      </div>`,
    actions:[
      {label:"Review Discharge Report",val:"summary",icon:"i-flask"},
      {label:"Rematch",val:"again",primary:true,icon:"i-refresh"},
      {label:"Change deck",val:"setup"},
    ],
  }).then?.(null);

  const backs=$$("#modal-root .modal-back");
  const top=backs[backs.length-1];
  const btns=$$(".m-actions .btn",top);
  
  if(btns[0]){ // Review Discharge Report
    btns[0].onclick=()=>{
      if(M.caseSummaries && M.caseSummaries.length){
        const last = M.caseSummaries[M.caseSummaries.length - 1];
        showClinicalDebriefModal({
          ...last,
          actionLabel: "Back to Match Verdict",
          onClose: () => {
            endMatch();
          }
        });
      }
    };
  }
  if(btns[1]){ // Rematch
    btns[1].onclick=()=>{
      Modal.close(top);
      startMatch(M.deckId,M.diff);
    };
  }
  if(btns[2]){ // Change deck
    btns[2].onclick=()=>{
      Modal.close(top);
      enterDuel();
    };
  }
}