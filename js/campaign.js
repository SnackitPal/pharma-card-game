/* ============================================================
   THERAPEUTIC INDEX — campaign.js
   "FIRST IN HUMAN" — build a pharma company over 20 years.
   Screen → develop (gates can fail) → launch → price →
   repurpose / evergreen → survive events → reach $2.5B+.
   ============================================================ */

"use strict";

const STAGES=["Preclinical","Phase I","Phase II","Phase III","Filed"];
const GATES=[ // advancing FROM stage i
  {base:62,stat:"saf", k:2.6,real:"~66% of preclinical programs reach Phase I in reality — toxicity is the filter."},
  {base:66,stat:"saf", k:2.0,real:"Real-world Phase I → II transition runs ~52–66%. Safety in healthy volunteers decides."},
  {base:40,stat:"eff", k:3.4,real:"Only ~30–40% of Phase II candidates advance. 'Does it actually work?' kills most drugs."},
  {base:46,stat:"blend",k:1.7,real:"Phase III failures are the industry's most expensive heartbreaks. ~90% of drugs entering clinics never reach approval."},
];
const GATE_COST=[[8,8],[18,15],[32,22],[15,12]]; // [$M, data] per gate
const PRICE_TIERS={
  val:{label:"VALUE",mult:0.7,share:26,rep:+3,desc:"Max access, thinner margins, goodwill"},
  std:{label:"BALANCED",mult:1.0,share:18,rep:0,desc:"The industry default"},
  prem:{label:"PREMIUM",mult:1.6,share:12,rep:-2,desc:"Max revenue per patient, scrutiny follows"},
};
const WIN_VAL=2500, MAX_YEAR=20;

let C=null;

function effectiveApMax(camp){
  const base = 4;
  const campusBonus = (camp && camp.ups && camp.ups.campus) ? 1 : 0;
  const repBonus = (camp && camp.rep >= 75) ? 1 : 0;
  return base + campusBonus + repBonus;
}

function freshCampaign(starterId){
  const starter = starterId ? DRUG[starterId] : DRUG[pick(STARTERS)];
  if(typeof Discovery!=="undefined"&&starter)Discovery.mark(starter.id);
  const camp = {
    v:1,
    year:1,cash:60,data:0,rep:50,ap:4,apMax:4,
    pipe:[{id:starter.id,stage:0}],
    mkt:[],ups:{plant:false,campus:false,cso:false},
    pressure:{},gateBonus:0,costBonus:1,devDisc:1,
    log:[{y:1,txt:`Pharma founded with lead molecule ${starter.n} (${starter.cls}).`,kind:"gold"}],
    flags:{},over:false,won:false,lost:false,
    stats:{launched:0,failed:0,repurposed:0},
    usedEvents:[],usedDilemmas:[],
  };
  camp.apMax = effectiveApMax(camp);
  camp.ap = camp.apMax;
  return camp;
}
function saveC(){Store.set("campaign",C);}
function ownedIds(){return new Set([...(C.pipe||[]).map(p=>p.id),...(C.mkt||[]).map(m=>m.id)]);}

function devCost(base){return Math.round(base*C.devDisc*C.costBonus);}
function gatePct(pipeItem){
  const d=DRUG[pipeItem.id],g=GATES[pipeItem.stage];
  let pct=g.base;
  if(g.stat==="blend")pct+=(d.eff+d.saf)*g.k;
  else pct+=d[g.stat]*g.k;
  pct+=(pipeItem.pen||0)+(C.gateBonus||0);
  return clamp(Math.round(pct),15,92);
}
function annualNet(m){
  const d=DRUG[m.id];
  const pat=m.patent>0?1:0.18;
  const off=m.offline?0:1;
  let net=d.mkt*85*(m.share/100)*PRICE_TIERS[m.price].mult*pat*off*(m.revMod||1);
  if(m.alts)net*=1+m.alts.length*0.35;
  return Math.round(net);
}
function valuation(){
  let v=C.cash;
  for(const m of C.mkt){
    const multiple = m.patent > 0 ? (8 + m.patent * 0.6) : 3.5;
    v += annualNet(m) * multiple;
  }
  const sv=[25,90,220,520,950],sp=[0.6,0.52,0.42,0.38,0.85];
  for(const p of C.pipe)v+=sv[p.stage]*sp[p.stage];
  return Math.round(v);
}

/* ---------------- rendering ---------------- */
function renderCampaign(){
  const root=$("#c-root");
  if(!C)C=freshCampaign();
  if(C.over){root.innerHTML=campaignEndHTML();wireEnd();return;}

  C.apMax = effectiveApMax(C);
  const val=valuation();
  const repBonusActive = C.rep >= 75;

  root.innerHTML=`
  <div class="c-hud panel">
    <div class="c-year"><span class="y" id="hud-year">${C.year}</span><span class="l">YEAR / ${MAX_YEAR}</span></div>
    <div class="stat-chip" id="chip-cash">${icon("i-coin")}<div><div class="v">$<span id="hud-cash">${Math.round(C.cash)}</span>M</div><div class="l">Cash</div></div></div>
    <div class="stat-chip" id="chip-data">${icon("i-dna")}<div><div class="v" id="hud-data">${C.data}</div><div class="l">Data</div></div></div>
    <div class="stat-chip" id="chip-rep">${icon("i-shield")}<div><div class="v" id="hud-rep">${C.rep}</div><div class="l">Reputation ${repBonusActive?"(+1 AP)":""}</div></div></div>
    <div class="stat-chip" title="${repBonusActive?"Reputation Talent Milestone grants +1 AP/year":""}">${icon("i-zap")}<div><div class="v">${C.ap}/${C.apMax}</div><div class="l">Actions ${repBonusActive?"⭐":""}</div></div></div>
    <div class="hud-spacer"></div>
    <div class="val-wrap">
      <div class="spread small"><span class="dim mono">VALUATION</span><span class="mono" id="hud-val">${fmtM(val)} / ${fmtM(WIN_VAL)}</span></div>
      <div class="bar gold"><i id="hud-valbar" style="width:${clamp(val/WIN_VAL*100,0,100)}%"></i></div>
    </div>
    <button class="btn btn-primary" id="btn-eoy">${icon("i-flag")}End year</button>
  </div>

  <div class="c-cols">
    <div class="panel panel-pad">
      <h4>${icon("i-flask")} Pipeline</h4>
      <div id="c-pipe"></div>
    </div>
    <div>
      <div class="panel panel-pad" style="margin-bottom:16px">
        <h4>${icon("i-zap")} Actions</h4>
        <div class="act-grid" id="c-actions"></div>
      </div>
      <div class="panel panel-pad">
        <h4>${icon("i-book")} Lab journal</h4>
        <div class="feed" id="c-feed"></div>
      </div>
    </div>
    <div class="panel panel-pad">
      <h4>${icon("i-chart")} Market</h4>
      <div id="c-market"></div>
    </div>
  </div>
  <div class="ticker-wrap c-ticker"><div class="ticker" id="c-ticker"></div></div>`;

  renderPipe();renderActions();renderMarket();renderFeed();
  fillTicker($("#c-ticker"));
  $("#btn-eoy").onclick=()=>endYear(false);
}

function renderPipe(){
  const el=$("#c-pipe");if(!el)return;
  el.innerHTML="";
  if(!C.pipe.length){
    el.innerHTML=`
      <div class="empty-pipe-callout">
        <div class="ep-icon">${icon("i-alert")}</div>
        <div class="ep-msg">
          <b>Pipeline is empty!</b> Your scientists are playing solitaire.
          <p class="dim small" style="margin:4px 0 10px 0">Screen for new compounds to fill your development pipeline before ending the year.</p>
          <button class="btn btn-sm btn-primary" id="btn-empty-screen">${icon("i-search")}Screen compounds now</button>
        </div>
      </div>`;
    const b=$("#btn-empty-screen",el);
    if(b)b.onclick=screenFlow;
    return;
  }
  for(const p of C.pipe){
    const d=DRUG[p.id];
    const item=document.createElement("div");
    item.className="pipe-item";
    const segs=STAGES.map((s,i)=>`<span class="stage-seg ${i<p.stage?"done":i===p.stage?"cur":""}"></span>`).join("");
    const last=p.stage>=4;
    item.innerHTML=`
      <div class="pipe-info">
        <div class="spread"><span class="nm">${esc(d.n)}</span><span class="stg">${last?"FILED — READY TO LAUNCH":STAGES[p.stage]}</span></div>
        <div class="stage-track">${segs}</div>
        <div class="meta">${last?"Launch when ready":`Next gate: ${fmtM(devCost(GATE_COST[p.stage][0]))} + ${GATE_COST[p.stage][1]} data · ${gatePct(p)}% success`}</div>
      </div>
      <div class="pipe-btns">
        ${last
          ?`<button class="btn btn-sm btn-gold" data-launch="${p.id}">Launch</button>`
          :`<button class="btn btn-sm btn-primary" data-adv="${p.id}" ${canAdvance(p)?"":"data-disabled=\"1\""} title="Success probability from the molecule's real profile">Advance ${gatePct(p)}%</button>`}
        <button class="btn btn-sm" data-view="${p.id}">Card</button>
      </div>`;
    el.appendChild(item);
  }
  $$("[data-adv]",el).forEach(b=>b.onclick=()=>{
    if(b.dataset.disabled){
      const p=C.pipe.find(p=>p.id===b.dataset.adv);
      if(!p)return;
      const reasons=[];
      if(C.ap<1)reasons.push("no Action Points remaining");
      if(C.cash<devCost(GATE_COST[p.stage][0]))reasons.push(`need ${fmtM(devCost(GATE_COST[p.stage][0]))} cash`);
      if(C.data<GATE_COST[p.stage][1])reasons.push(`need ${GATE_COST[p.stage][1]} Data (have ${C.data})`);
      toast("Cannot advance: "+reasons.join(" · "),"warn","i-alert");
      return;
    }
    advanceGate(b.dataset.adv);
  });
  $$("[data-launch]",el).forEach(b=>b.onclick=()=>launchFlow(b.dataset.launch));
  $$("[data-view]",el).forEach(b=>b.onclick=()=>openDetail(DRUG[b.dataset.view]));
}
function canAdvance(p){
  return C.ap>0&&C.cash>=devCost(GATE_COST[p.stage][0])&&C.data>=GATE_COST[p.stage][1];
}

function renderActions(){
  const el=$("#c-actions");if(!el)return;
  const isPipeEmpty = C.pipe.length === 0;
  const acts=[
    {id:"screen",t:"Screen compounds",c:`$10M · 1 AP`,ic:"i-search",dis:C.ap<1||C.cash<10,cls:isPipeEmpty?"pulse-screen":""},
    {id:"trialS",t:"Run trial",c:"$5M → +12 data · 1 AP",ic:"i-dice",dis:C.ap<1||C.cash<5},
    {id:"trialL",t:"Pivotal trial",c:"$15M → +30 data · 1 AP",ic:"i-dna",dis:C.ap<1||C.cash<15},
    {id:"partner",t:"Licensing grant",c:"1 AP → +$20M · −3 Rep",ic:"i-coin",dis:C.ap<1||C.cash>40},
    {id:"repurpose",t:"Repurpose drug",c:"$20M + 25 data · 1 AP",ic:"i-refresh",dis:C.ap<1||C.cash<20||C.data<25||!C.mkt.some(m=>{const d=DRUG[m.id];return d.alt&&d.alt.length&&(m.alts||[]).length<d.alt.length;})},
    {id:"evergreen",t:"Life-cycle extension",c:"$15M · +3 patent yrs · 1 AP",ic:"i-clock",dis:C.ap<1||C.cash<15||!C.mkt.some(m=>m.patent>0&&m.patent<12)},
    {id:"blitz",t:"Marketing blitz",c:"$20M · +5 share · 1 AP",ic:"i-fire",dis:C.ap<1||C.cash<20||!C.mkt.length},
    {id:"cso",t:"Hire CSO",c:"$50M · +10 data/yr auto",ic:"i-atom",dis:C.ups.cso||C.cash<50},
    {id:"plant",t:"Build plant",c:"$40M · dev costs −30%",ic:"i-factory",dis:C.ups.plant||C.cash<40},
    {id:"campus",t:"R&D campus",c:"$60M · +1 AP forever",ic:"i-hex",dis:C.ups.campus||C.cash<60},
  ];
  el.innerHTML=acts.map(a=>`<button class="act-btn ${a.cls||""}" data-act="${a.id}" ${a.dis?"disabled":""}>
    <span class="t">${icon(a.ic)}${a.t}</span><span class="c">${a.c}</span></button>`).join("");
  $$("[data-act]",el).forEach(b=>b.onclick=()=>doAction(b.dataset.act));
}

async function doAction(act){
  SFX.click();
  if(act==="screen")return screenFlow();
  if(act==="trialS"){C.ap--;C.cash-=5;C.data+=12;log("info","Routine trial run: +12 Data.");}
  if(act==="trialL"){C.ap--;C.cash-=15;C.data+=30;log("gold","Pivotal trial program: +30 Data.");}
  if(act==="partner"){
    C.ap--;C.cash+=20;C.rep=clamp(C.rep-3,0,100);
    log("gold","Non-dilutive licensing grant secured: +$20M cash.");
    toast("Licensing grant secured: +$20M","gold","i-coin");
  }
  if(act==="repurpose")return repurposeFlow();
  if(act==="evergreen")return evergreenFlow();
  if(act==="blitz")return blitzFlow();
  if(act==="cso"){
    C.cash-=50;C.ups.cso=true;
    log("gold","Chief Scientific Officer hired — automated assays will generate +10 Data every year.");
    if(typeof Achievements!=="undefined")Achievements.unlock("cso_hired");
  }
  if(act==="plant"){C.cash-=40;C.ups.plant=true;if(!C._plantApplied){C.devDisc*=0.7;C._plantApplied=true;}log("ok","Manufacturing plant built — development costs −30%.");}
  if(act==="campus"){C.cash-=60;C.ups.campus=true;C.apMax++;C.ap++;log("gold","R&D campus opened — +1 action per year.");}
  SFX.good();saveC();refreshHUD();renderActions();renderPipe();
}

function log(kind,txt){C.log.unshift({y:C.year,txt,kind});C.log=C.log.slice(0,40);}
function renderFeed(){
  const el=$("#c-feed");if(!el)return;
  el.innerHTML=C.log.map(l=>`<div class="feed-it ${l.kind}"><span class="fy">Y${l.y}</span>${icon({ok:"i-check",bad:"i-alert",gold:"i-star",info:"i-info",warn:"i-alert"}[l.kind]||"i-info")}<span>${esc(l.txt)}</span></div>`).join("");
}
function refreshHUD(){
  if(!$("#hud-cash"))return;
  C.apMax = effectiveApMax(C);
  countUp($("#hud-cash"),Math.round(C.cash));
  countUp($("#hud-data"),C.data);
  $("#hud-rep").textContent=C.rep;
  // Update AP chip — shows current/max without full re-render
  const apChip = $(".stat-chip svg + div .v", $("#topnav") || document);
  // More reliable: find the AP chip by its icon sibling in the HUD
  $$(".stat-chip",$("#c-root")).forEach(chip=>{
    const lbl = $(".l",chip);
    if(lbl && lbl.textContent.startsWith("Actions")){
      const v = $(".v",chip);
      if(v) v.textContent = `${C.ap}/${C.apMax}`;
      lbl.textContent = `Actions${C.rep>=75?" ⭐":""}`;
    }
  });
  const v=valuation();
  $("#hud-val").textContent=`${fmtM(v)} / ${fmtM(WIN_VAL)}`;
  $("#hud-valbar").style.width=clamp(v/WIN_VAL*100,0,100)+"%";
}

/* ---------------- screening (discover) ---------------- */
async function screenFlow(){
  const owned=ownedIds();
  const areas=Object.keys(AREAS);
  const back=Modal.open({
    kicker:"HIGH-THROUGHPUT SCREENING",
    title:"Choose a research area",
    html:`<p>Pick where to point the robots. You'll screen thousands of candidates and shortlist <b>three hits</b> — keep one.</p>
      <div class="area-pick">${areas.map(a=>`
        <button class="choice-card" data-area="${a}" style="--ac2:${AREAS[a].c}">
          <span class="t" style="color:${AREAS[a].c}">${icon(AREAS[a].icon)}${AREAS[a].label}</span>
          <span class="s">${DRUGS.filter(d=>d.a===a&&!owned.has(d.id)&&d.r!=="BANNED").length} unclaimed targets</span>
        </button>`).join("")}</div>`,
    actions:[{label:"Cancel",val:null}],
  });
  $$("[data-area]",back).forEach(b=>b.onclick=async()=>{
    const area=b.dataset.area;
    Modal.close(back);
    C.ap--;C.cash-=10;saveC();refreshHUD();renderActions();
    await screeningAnimation(area);
  });
}
function screeningAnimation(area){
  return new Promise(res=>{
    const back=Modal.open({
      kicker:"SCREENING LIBRARY · "+AREAS[area].label.toUpperCase(),
      title:"Running assays…",
      html:`<div class="disc-dots">${'<span class="disc-dot"></span>'.repeat(5)}</div>
        <p class="small dim" style="text-align:center">Hit rates in real HTS run ~0.01–0.5%. Yours are generously fictional.</p>`,
      noClose:true,actions:[],
    });
    SFX.whoosh();
    setTimeout(()=>{
      Modal.close(back);
      const owned=ownedIds();
      let pool=DRUGS.filter(d=>d.a===area&&!owned.has(d.id)&&d.r!=="BANNED");
      if(pool.length<3)pool=DRUGS.filter(d=>!owned.has(d.id)&&d.r!=="BANNED");
      const hits=[];
      const bag=pool.slice();
      while(hits.length<Math.min(3,bag.length)){
        const d=weightedPick(bag,x=>RARITY[x.r].w);
        hits.push(d);bag.splice(bag.indexOf(d),1);
      }
      revealHits(hits,res);
    },1400);
  });
}
function revealHits(hits,done){
  const back=Modal.open({
    kicker:"HITS DETECTED",
    title:"Pick one compound to pursue",
    html:`<div class="starter-row" id="disc-row"></div>
      <p class="m-note">${icon("i-info")}<span>Flip or inspect any candidate. Click 'Draft Lead' to commit the compound to your development pipeline.</span></p>`,
    noClose:true,actions:[],
  });
  const row=$("#disc-row",back);
  hits.forEach(d=>{
    const wrap=document.createElement("div");
    wrap.className="starter-opt";
    const card=makeCard(d,{size:"mini"});
    wrap.appendChild(card);

    const draftBtn=document.createElement("button");
    draftBtn.className="btn btn-sm btn-primary";
    draftBtn.style.marginTop="8px";
    draftBtn.innerHTML=`${icon("i-flask")} Draft ${esc(d.n)}`;
    draftBtn.onclick=(e)=>{
      e.stopPropagation();
      Modal.close(back);
      if(typeof Discovery!=="undefined")Discovery.mark(d.id);
      C.pipe.push({id:d.id,stage:0});
      log("gold",`Screening hit: ${d.n} (${d.cls}) joins the pipeline.`);
      toast(`<b>${esc(d.n)}</b> discovered!`, "gold","i-spark");
      confettiCenter(["#ffd166","#7ee0ff","#ff8ba0"]);
      saveC();renderPipe();renderActions();
      done();
    };
    wrap.appendChild(draftBtn);
    row.appendChild(wrap);
  });
}

/* ---------------- development gates ---------------- */
async function advanceGate(id){
  const p=C.pipe.find(x=>x.id===id);
  if(!p||!canAdvance(p))return;
  const d=DRUG[id];
  const g=GATES[p.stage];
  const [cost,data]=GATE_COST[p.stage];
  const dc=devCost(cost);
  const pct=gatePct(p);

  const back=Modal.open({
    kicker:`DEVELOPMENT GATE · ${STAGES[p.stage].toUpperCase()} → ${STAGES[p.stage+1].toUpperCase()}`,
    title:`Advance ${esc(d.n)}?`,
    html:`
      <div class="roll-wrap">
        <div class="roll-pct" style="color:var(--gold)">${pct}%</div>
        <div class="roll-bar"><i id="roll-fill"></i></div>
        <div class="small mut">Success probability derived from the molecule's real profile —
        ${g.stat==="blend"?"efficacy + safety":g.stat==="eff"?"efficacy dominates":"safety dominates"}.</div>
        <div class="roll-real">${icon("i-info")} ${g.real}</div>
      </div>`,
    actions:[
      {label:`Advance (${fmtM(dc)} + ${data} data)`,val:"go",primary:true,icon:"i-dice"},
      {label:"Not yet",val:null},
    ],
  });
  const r=await new Promise(res=>{back._resolveFn=res;});
  if(r!=="go")return;
  Modal.close(back);

  C.ap--;C.cash-=dc;C.data-=data;
  refreshHUD();

  // roll animation
  const rollBack=Modal.open({
    kicker:`${STAGES[p.stage].toUpperCase()} → ${STAGES[p.stage+1].toUpperCase()} · ${esc(d.n)}`,
    title:"Trial readout pending…",
    html:`<div class="roll-wrap"><div class="roll-bar"><i id="roll-fill2"></i></div>
      <div class="small dim" id="roll-txt" style="margin-top:12px">Patients enrolled. Data locked. Unblinding imminent.</div>
      <div style="margin-top:22px" id="roll-stamp"></div></div>`,
    noClose:true,actions:[],
  });
  SFX.whoosh();
  requestAnimationFrame(()=>{const f=$("#roll-fill2",rollBack);if(f)f.style.width=pct+"%";});

  setTimeout(()=>{
    const ok=Math.random()*100<pct;
    const stampEl=$("#roll-stamp",rollBack);
    if(ok){
      p.stage++;
      stampEl.innerHTML=`<span class="stamp ok">ADVANCED</span>`;
      SFX.good();
      if(typeof Haptics!=="undefined")Haptics.success();
      let bonusCash=0;
      if(p.stage===1){bonusCash=8;log("gold",`${d.n} IND approved! Fast-Track research grant: +$8M.`);}
      else if(p.stage===2){bonusCash=15;log("gold",`${d.n} cleared Phase I safety! Milestone grant: +$15M.`);}
      else if(p.stage===3){bonusCash=25;log("gold",`${d.n} Phase II PoC confirmed! Co-dev milestone: +$25M.`);}
      if(bonusCash>0){C.cash+=bonusCash;toast(`Milestone awarded: +$${bonusCash}M`,"gold","i-coin");}
      if(p.stage===4){toast(`<b>${esc(d.n)}</b> filed! Ready to launch.`,"gold","i-check");}
    }else{
      C.stats.failed++;
      C.data+=8;
      const reason=d.saf<=4?"Unacceptable toxicity in cohort 3 — program terminated."
        :d.eff<=5?"Missed primary endpoint — insufficient separation from placebo."
        :"CMC manufacturing could not be scaled reproducibly.";
      stampEl.innerHTML=`<span class="stamp bad">TERMINATED</span>`;
      SFX.bad();
      if(typeof Haptics!=="undefined")Haptics.error();
      document.body.classList.add("shake");
      setTimeout(()=>document.body.classList.remove("shake"),500);
      log("bad",`${d.n} terminated: ${reason} (Failed trials still teach — recovered +8 Data.)`);
      toast(`<b>${esc(d.n)}</b> failed: ${reason} (+8 Data recovered)`,"bad","i-alert");
      setTimeout(()=>{Modal.close(rollBack);C.pipe.splice(C.pipe.indexOf(p),1);saveC();renderPipe();renderActions();renderFeed();},1600);
      return;
    }
    log("ok",`${d.n} advanced to ${STAGES[p.stage]}.`);
    if(p.stage===4)confettiCenter(["#2fd6a5","#ffd166","#7ee0ff"]);
    setTimeout(()=>{
      Modal.close(rollBack);
      saveC();renderPipe();renderActions();renderFeed();
    },1500);
  },1700);
}

/* ---------------- launch & pricing ---------------- */
async function launchFlow(id){
  const p=C.pipe.find(x=>x.id===id);if(!p)return;
  const d=DRUG[id];
  const back=Modal.open({
    kicker:"LAUNCH · PRICING STRATEGY",
    title:`Launch ${esc(d.n)}`,
    html:`<p>Choose how the market meets <b>${esc(d.n)}</b>. Pricing shapes revenue, adoption and reputation.</p>
      <div class="choice-row">${Object.entries(PRICE_TIERS).map(([k,t])=>`
        <button class="choice-card" data-price="${k}">
          <span class="t">${t.label}</span>
          <span class="s">${t.desc}<br>≈ ${fmtM(Math.round(d.mkt*70*t.share/100*t.mult))}/yr net</span>
        </button>`).join("")}</div>`,
    actions:[{label:"Wait",val:null}],
  });
  $$("[data-price]",back).forEach(b=>b.onclick=()=>{
    const tier=b.dataset.price;
    Modal.close(back);
    C.pipe.splice(C.pipe.indexOf(p),1);
    C.mkt.push({id,price:tier,share:PRICE_TIERS[tier].share,patent:12,alts:[]});
    C.rep=clamp(C.rep+PRICE_TIERS[tier].rep,0,100);
    C.stats.launched++;
    if(typeof Discovery!=="undefined")Discovery.mark(d.id);
    if(typeof Achievements!=="undefined"&&d.mkt>=10)Achievements.unlock("blockbuster");
    const ar=AREAS[d.a].label;
    C.pressure[ar]=(C.pressure[ar]||0)+1;
    log("gold",`${d.n} launched at ${PRICE_TIERS[tier].label} pricing.`);
    toast(`<b>${esc(d.n)}</b> is on the market!`,"gold","i-chart");
    SFX.cash();confettiCenter(["#2fd6a5","#ffd166"]);
    saveC();renderPipe();renderMarket();refreshHUD();renderActions();
  });
}

/* ---------------- market actions ---------------- */
async function repurposeFlow(){
  const options=[];
  for(const m of C.mkt){
    const d=DRUG[m.id];
    (d.alt||[]).forEach((a,i)=>{
      if(!(m.alts||[]).includes(i))options.push({m,idx:i,label:a});
    });
  }
  if(!options.length)return;
  const back=Modal.open({
    kicker:"REPURPOSING",
    title:"Find a second life",
    html:`<p>Sildenafil was angina's consolation prize; minoxidil grew hair by accident. Pick a new indication:</p>
      <div class="choice-row">${options.slice(0,6).map((o,i)=>`
        <button class="choice-card" data-i="${i}">
          <span class="t">${esc(DRUG[o.m.id].n)}</span>
          <span class="s">→ ${esc(o.label)}<br>+35% revenue · +3 Rep</span>
        </button>`).join("")}</div>`,
    actions:[{label:"Cancel",val:null}],
  });
  $$("[data-i]",back).forEach(b=>b.onclick=()=>{
    const o=options[+b.dataset.i];
    Modal.close(back);
    C.ap--;C.cash-=20;C.data-=25;
    o.m.alts=(o.m.alts||[]).concat(o.idx);
    C.rep=clamp(C.rep+3,0,100);
    C.stats.repurposed++;
    if(typeof Achievements!=="undefined"&&C.stats.repurposed>=2)Achievements.unlock("repurpose_master");
    log("gold",`${DRUG[o.m.id].n} repurposed for ${o.label}. Just like sildenafil!`);
    toast(`Repurposed: <b>${esc(DRUG[o.m.id].n)}</b>`,"gold","i-refresh");
    SFX.good();saveC();renderMarket();refreshHUD();renderActions();
  });
}
async function evergreenFlow(){
  const cands=C.mkt.filter(m=>m.patent>0&&m.patent<12);
  const back=Modal.open({
    kicker:"LIFE-CYCLE MANAGEMENT",
    title:"Extended-release reformulation",
    html:`<p>A new formulation (XR, fixed-dose combo, new delivery device) buys <b>+3 patent years</b>. Honest innovation? The courts will decide. −2 Rep.</p>
      <div class="choice-row">${cands.map((m,i)=>`
        <button class="choice-card" data-i="${i}">
          <span class="t">${esc(DRUG[m.id].n)}</span>
          <span class="s">${m.patent} yrs left → ${m.patent+3}</span>
        </button>`).join("")}</div>`,
    actions:[{label:"Cancel",val:null}],
  });
  $$("[data-i]",back).forEach(b=>b.onclick=()=>{
    const m=cands[+b.dataset.i];
    Modal.close(back);
    C.ap--;C.cash-=15;m.patent+=3;C.rep=clamp(C.rep-2,0,100);
    log("info",`${DRUG[m.id].n} XR approved — patent extended to ${m.patent} yrs.`);
    SFX.stamp();saveC();renderMarket();refreshHUD();renderActions();
  });
}
async function blitzFlow(){
  const areas=[...new Set(C.mkt.map(m=>DRUG[m.id].a))];
  const back=Modal.open({
    kicker:"MARKETING",
    title:"Blitz which market?",
    html:`<div class="choice-row">${areas.map(a=>`
      <button class="choice-card" data-a="${a}">
        <span class="t" style="color:${AREAS[a].c}">${icon(AREAS[a].icon)}${AREAS[a].label}</span>
        <span class="s">+5 share points on your products here</span></button>`).join("")}</div>`,
    actions:[{label:"Cancel",val:null}],
  });
  $$("[data-a]",back).forEach(b=>b.onclick=()=>{
    const a=b.dataset.a;
    Modal.close(back);
    C.ap--;C.cash-=20;
    C.mkt.filter(m=>DRUG[m.id].a===a).forEach(m=>m.share=Math.min(40,m.share+5));
    log("info",`Marketing blitz in ${AREAS[a].label}. Share +5.`);
    SFX.cash();saveC();renderMarket();refreshHUD();renderActions();
  });
}

function renderMarket(){
  const el=$("#c-market");if(!el)return;
  el.innerHTML="";
  if(!C.mkt.length){el.innerHTML=`<div class="dim small" style="padding:8px 0">No products yet. Revenue starts at launch.</div>`;return;}
  for(const m of C.mkt){
    const d=DRUG[m.id];
    const net=annualNet(m);
    const circ=2*Math.PI*18;
    const frac=m.patent/12;
    const item=document.createElement("div");
    item.className="mkt-item"+(m.patent===0?" cliff":"");
    item.innerHTML=`
      <div class="pat-ring ${m.patent===0?"cliff":""}">
        <svg viewBox="0 0 44 44"><circle class="bgc" cx="22" cy="22" r="18"/>
        <circle class="fgc" cx="22" cy="22" r="18" stroke-dasharray="${circ}" stroke-dashoffset="${circ*(1-frac)}"/></svg>
        <span class="num">${m.patent}</span>
      </div>
      <div class="mkt-info">
        <div class="spread"><span class="nm">${esc(d.n)}</span><span class="price-tag ${m.price==="prem"?"prem":m.price==="std"?"std":"val"}">${PRICE_TIERS[m.price].label}</span></div>
        <div class="rev">${fmtM(net)}/yr ${m.offline?"· OFFLINE":""}${(m.alts||[]).length?" · +repurposed":""}</div>
        <div class="meta small dim">share ${Math.round(m.share)}% · ${m.patent===0?"PATENT CLIFF — generics erode revenue":m.patent+" yrs exclusivity"}</div>
      </div>`;
    el.appendChild(item);
  }
}

/* ---------------- end of year ---------------- */
let eoyBusy=false;
async function endYear(force=false){
  if(eoyBusy)return;eoyBusy=true;
  try{
    // Empty pipeline check
    if(!force && C.pipe.length === 0 && C.mkt.length === 0){
      if(C.cash < 10){
        C.over=true;C.lost=true;
        log("bad","No pipeline, no products on market, and insufficient cash (<$10M) to screen. Your company is forced into distressed acquisition.");
        saveC();renderCampaign();return;
      }
      const ans = await Modal.ask({
        kicker:"PIPELINE EMPTY WARNING",
        title:"Your scientists are playing solitaire!",
        html:`<p>You have <b>0 compounds in development</b> and <b>0 products on the market</b>.<br><br>Advancing to the next year without research or products means your pipeline idles while time slips away.</p>`,
        actions:[
          {label:"Screen compounds first",val:"screen",primary:true,icon:"i-search"},
          {label:"End year anyway",val:"proceed",cls:"btn-danger"},
        ],
      });
      if(ans !== "proceed"){
        eoyBusy=false;
        if(ans === "screen")screenFlow();
        return;
      }
    }

    // income posting
    let income=0;
    for(const m of C.mkt){income+=annualNet(m);if(m.offline)m.offline=0;}
    C.cash+=income;
    if(income>0){SFX.cash();log("gold",`Year ${C.year} closed: ${fmtM(income)} net income.`);}

    // CSO automatic trial
    if(C.ups.cso){
      C.data+=10;
      log("info","CSO automated assay program: +10 Data generated.");
    }

    // share decay & pressure
    for(const m of C.mkt){
      const ar=AREAS[DRUG[m.id].a].label;
      C.pressure[ar]=Math.min(8,(C.pressure[ar]||1)+1);
      m.share=Math.max(6,m.share-(2+C.pressure[ar]*0.5));
      if(m.patent>0)m.patent--;
      if(m.patent===0&&!m.cliffSeen){m.cliffSeen=true;log("bad",`PATENT CLIFF: ${DRUG[m.id].n} loses exclusivity. Revenue collapses to generic levels.`);toast(`Patent cliff: <b>${esc(DRUG[m.id].n)}</b>`,"bad","i-alert");}
    }

    // events
    await runEvents();

    // buried whistleblower fallout
    if(C.flags.buried&&Math.random()<0.4){
      delete C.flags.buried;
      C.rep=Math.max(0,C.rep-8);
      log("bad","The buried data report surfaces. FDA re-audits: −8 Rep.");
    }

    C.year++;
    C.apMax = effectiveApMax(C);
    C.ap = C.apMax;
    C.gateBonus=0;C.costBonus=1;
    saveC();refreshHUD();

    // win / lose checks
    const val=valuation();
    if(val>=4000&&typeof Achievements!=="undefined")Achievements.unlock("titan");
    if(C.cash<-30){C.over=true;C.lost=true;saveC();renderCampaign();return;}
    if(val>=WIN_VAL){C.over=true;C.won=true;saveC();renderCampaign();confettiCenter(["#ffd166","#2fd6a5","#7ee0ff","#ff8ba0"]);SFX.good();return;}
    if(C.year>MAX_YEAR){C.over=true;saveC();renderCampaign();return;}
    renderCampaign();
  }finally{eoyBusy=false;}
}

async function runEvents(){
  let eligible=EVENTS.filter(e=>(!e.cond||e.cond(C))&&!C.usedEvents.includes(e.id));
  if(!eligible.length){
    C.usedEvents=[]; // recycle event pool
    eligible=EVENTS.filter(e=>(!e.cond||e.cond(C)));
  }
  const n=Math.min(2,eligible.length);
  const chosen=[];
  const bag=eligible.slice();
  for(let i=0;i<n&&bag.length;i++){
    const e=weightedPick(bag,x=>x.w);
    chosen.push(e);bag.splice(bag.indexOf(e),1);
  }
  for(const e of chosen){
    C.usedEvents.push(e.id);
    const result=e.run(C);
    if(result&&result.choices){
      const v=await Modal.ask({
        kicker:"EVENT · YEAR "+C.year,title:result.title,html:`<p>${result.body}</p>`,
        actions:result.choices.map(c=>({label:c.label,val:c.val})),
      });
      const txt=result.apply(C,v??result.choices[0].val);
      log("warn",txt);toast(txt,"info","i-info");
    }else{
      log(e.kind==="ok"?"ok":e.kind==="bad"?"bad":"info",result);
      toast(result,e.kind==="ok"?"ok":e.kind==="bad"?"bad":"info");
      if(e.kind==="ok")SFX.good();else if(e.kind==="bad")SFX.bad();
    }
    saveC();
  }
  // dilemma every 3rd year
  if(C.year%3===0){
    let avail=DILEMMAS.filter(d=>!C.usedDilemmas.includes(d.id));
    if(!avail.length){C.usedDilemmas=[];avail=DILEMMAS.slice();}
    if(avail.length){
      const dm=pick(avail);
      C.usedDilemmas.push(dm.id);
      const v=await Modal.ask({
        kicker:"DECISION · YEAR "+C.year,title:dm.title,html:`<p>${dm.body}</p>`,
        actions:dm.choices.map(c=>({label:c.label,val:c.val})),
      });
      const txt=dm.apply(C,v??dm.choices[0].val);
      log("warn",txt);toast(txt,"info","i-info");
      saveC();
    }
  }
}

/* ---------------- end screen ---------------- */
function gradeOf(val){
  if(val>=4000)return "BLOCKBUSTER TITAN";
  if(val>=WIN_VAL)return "MARKET LEADER (IPO SUCCESS)";
  if(val>=1200)return "MID-CAP CONTENDER";
  if(val>=500)return "CHALLENGER BIO";
  if(val>=200)return "SURVIVOR";
  return "STRUGGLING STARTUP";
}
function campaignEndHTML(){
  const val=valuation();
  const rank=gradeOf(val);
  return `
  <div class="end-hero panel panel-pad" style="max-width:640px;margin:40px auto">
    <div class="m-kicker">${C.won?"IPO COMPLETE":C.lost?"ACQUIRED IN DISTRESS":"CAMPAIGN CONCLUDED · YEAR "+MAX_YEAR}</div>
    <div class="end-rank">${rank}</div>
    <p class="mut">${C.won?"Your valuation crossed "+fmtM(WIN_VAL)+". Wall Street throws confetti; your CSO cries in a stairwell."
      :C.lost?"Cash collapsed below −$30M or pipeline dried up in insolvency. The board sells to the highest bidder. Your molecule lives on — your logo doesn't."
      :"Twenty years. "+fmtM(val)+" in value. The pipeline is what it is."}</p>
    <div class="end-stats">
      <div><b>${fmtM(val)}</b>FINAL VALUE</div>
      <div><b>${C.stats.launched||C.mkt.length}</b>LAUNCHES</div>
      <div><b>${C.stats.failed}</b>TERMINATIONS</div>
      <div><b>${C.stats.repurposed}</b>REPURPOSES</div>
    </div>
    <p class="m-note">${icon("i-info")}<span>In reality, ~90% of drugs entering clinical trials never reach approval. Every termination here mirrors that attrition.</span></p>
    <div class="m-actions" style="justify-content:center">
      <button class="btn btn-primary" id="btn-c-restart">${icon("i-refresh")}New company</button>
      <button class="btn" data-route="library">${icon("i-stack")}Compendium</button>
    </div>
  </div>`;
}
function wireEnd(){
  const b=$("#btn-c-restart");
  if(b)b.onclick=()=>promptStarterSelection();
}

/* ---------------- starter candidate drafting ---------------- */
function promptStarterSelection(){
  const starters = shuffle(STARTERS.slice()).slice(0,3).map(id=>DRUG[id]);
  const back = Modal.open({
    kicker:"FOUND YOUR PHARMA",
    title:"Choose your founding molecule",
    html:`<p>Every biotech empire begins with one core research lead. Review three candidate molecules and select your initial compound to begin Phase I development.</p>
      <div class="starter-row" id="starter-row"></div>`,
    noClose:true,
    actions:[],
  });
  const row = $("#starter-row", back);
  starters.forEach(d=>{
    const wrap = document.createElement("div");
    wrap.className = "starter-opt";
    const card = makeCard(d, {size:"mini"});
    wrap.appendChild(card);
    const pickBtn = document.createElement("button");
    pickBtn.className = "btn btn-sm btn-primary";
    pickBtn.style.marginTop = "8px";
    pickBtn.innerHTML = `${icon("i-flask")} Choose ${esc(d.n)}`;
    pickBtn.onclick = ()=>{
      SFX.discover();
      Modal.close(back);
      C = freshCampaign(d.id);
      saveC();
      renderCampaign();
    };
    wrap.appendChild(pickBtn);
    row.appendChild(wrap);
  });
}

/* ---------------- entry & tutorial ---------------- */
function enterCampaign(){
  if(!C){C=Store.get("campaign",null);if(C&&C.v!==1){C=null;}}
  if(!C){
    promptStarterSelection();
    return;
  }
  renderCampaign();
  if(!Store.get("seenCampTut",false)){
    Store.set("seenCampTut",true);
    Modal.open({
      kicker:"FIRST IN HUMAN",title:"How to build a pharma",
      html:`
      <div class="help-step"><span class="help-num">1</span><p><b>Screen compounds</b> — pick a research area, keep one of three hits. Cards enter at Preclinical.</p></div>
      <div class="help-step"><span class="help-num">2</span><p><b>Fund trials</b> to earn Data, then <b>Advance</b> through four gates. Each roll can terminate the program — just like reality.</p></div>
      <div class="help-step"><span class="help-num">3</span><p><b>Launch</b> filed drugs and choose pricing. Products earn yearly income until the <b>patent cliff</b>.</p></div>
      <div class="help-step"><span class="help-num">4</span><p><b>Repurpose, extend patents, blitz markets, hire a CSO</b>, survive events, and grow valuation to <b>$2.5B+</b> within 20 years.</p></div>`,
      actions:[{label:"Let's cook",val:"ok",primary:true}],
    });
  }
}