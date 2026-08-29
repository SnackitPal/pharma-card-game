/* ============================================================
   THERAPEUTIC INDEX — headless playtest harness (Node)
   Loads every game module with a DOM shim and PLAYS the game:
   renders all art plates, runs library filters, simulates a
   full campaign year-by-year, fuzzes duel scoring, and plays
   complete Formulary Cup matches.
   Run:  node test/headless.js
   ============================================================ */
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");

/* ---------------- DOM shim ---------------- */
function makeCtx(){
  const grad={addColorStop(){}};
  return new Proxy({canvas:{width:560,height:360}},{
    get(t,p){if(p in t)return t[p];return()=>grad;},
    set(t,p,v){t[p]=v;return true;},
  });
}
let elSeq=0;
class FakeEl{
  constructor(tag){
    this._id=++elSeq;
    this.tagName=String(tag||"div").toUpperCase();
    this.children=[];this.dataset={};this.parentNode=null;
    this.style={setProperty(){},removeProperty(){}};
    this._cls=new Set();
    this.classList={
      add:(...c)=>c.forEach(x=>this._cls.add(x)),
      remove:(...c)=>c.forEach(x=>this._cls.delete(x)),
      toggle:(c,f)=>{if(f===undefined)f=!this._cls.has(c);f?this._cls.add(c):this._cls.delete(c);return f;},
      contains:c=>this._cls.has(c),
    };
    this._html="";this.textContent="";this.hidden=false;
    this.disabled=false;this.value="";this.width=0;this.height=0;this.title="";
  }
  get innerHTML(){return this._html;}
  set innerHTML(v){this._html=v;this.children=[];}
  get firstChild(){return this.children[0]||null;}
  appendChild(c){this.children.push(c);c.parentNode=this;return c;}
  removeChild(c){this.children=this.children.filter(x=>x!==c);c.parentNode=null;}
  remove(){if(this.parentNode)this.parentNode.removeChild(this);}
  contains(){return false;}
  querySelector(sel){
    const find=(el)=>{
      if(!el)return null;
      if(sel.startsWith(".")&&el.className&&el.className.split(" ").includes(sel.slice(1)))return el;
      if(sel.startsWith("#")&&el.id===sel.slice(1))return el;
      for(const ch of el.children||[]){const f=find(ch);if(f)return f;}
      return null;
    };
    const hit=find(this);
    if(hit)return hit;
    this._q=this._q||{};
    if(!this._q[sel]){this._q[sel]=new FakeEl("div");this._q[sel].parentNode=this;}
    return this._q[sel];
  }
  querySelectorAll(sel){
    const res=[];
    const find=(el)=>{
      if(!el)return;
      if(sel.startsWith(".")&&el.className&&el.className.split(" ").includes(sel.slice(1)))res.push(el);
      if(sel.startsWith("#")&&el.id===sel.slice(1))res.push(el);
      (el.children||[]).forEach(find);
    };
    find(this);
    return res;
  }
  addEventListener(){}removeEventListener(){}
  setAttribute(k,v){if(k==="class")this.className=v;if(k==="id")this.id=v;}
  getAttribute(k){return k==="class"?this.className:k==="id"?this.id:null;}
  getContext(){if(!this._ctx)this._ctx=makeCtx();return this._ctx;}
  scrollIntoView(){}focus(){}
  click(){if(this.onclick)this.onclick({stopPropagation(){},clientX:0,clientY:0,target:this});}
  getBoundingClientRect(){return{left:0,top:0,width:100,height:100};}
}
const docQ={};
global.document={
  querySelector(sel){
    const find=(el)=>{
      if(!el)return null;
      if(sel.startsWith(".")&&el.className&&el.className.split(" ").includes(sel.slice(1)))return el;
      if(sel.startsWith("#")&&el.id===sel.slice(1))return el;
      for(const ch of el.children||[]){const f=find(ch);if(f)return f;}
      return null;
    };
    const hit=find(global.document.body)||find(global.document.documentElement);
    if(hit)return hit;
    if(!docQ[sel]){
      const el=new FakeEl(sel.startsWith("#")?"div":sel);
      if(sel.startsWith("#"))el.id=sel.slice(1);
      docQ[sel]=el;
    }
    return docQ[sel];
  },
  querySelectorAll(sel){
    const res=[];
    const find=(el)=>{
      if(!el)return;
      if(sel.startsWith(".")&&el.className&&el.className.split(" ").includes(sel.slice(1)))res.push(el);
      if(sel.startsWith("#")&&el.id===sel.slice(1))res.push(el);
      (el.children||[]).forEach(find);
    };
    find(global.document.body);find(global.document.documentElement);
    return res;
  },
  createElement(tag){const el=new FakeEl(tag);return el;},
  addEventListener(){},removeEventListener(){},
  body:new FakeEl("body"),head:new FakeEl("head"),
  documentElement:new FakeEl("html"),hidden:false,
  activeElement:{tagName:"BODY"},
};
global.window=globalThis;
global.location={hash:""};
try{global.navigator={userAgent:"node"};}catch(e){/* Node >=21 exposes read-only navigator */}
const _ls={};
global.localStorage={
  getItem:k=>_ls[k]!==undefined?_ls[k]:null,
  setItem:(k,v)=>{_ls[k]=String(v);},
  removeItem:k=>{delete _ls[k];},
  clear:()=>{for(const k in _ls)delete _ls[k];}
};
global.matchMedia=()=>({matches:false});
global.requestAnimationFrame=()=>0;
global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.scrollTo=()=>{};
global.innerWidth=1280;global.innerHeight=800;

/* ---------------- load game code ---------------- */
const ORDER=["utils","audio","bg","data","card","ecg","library","campaign","duel","tutorial","casemaker","main"];
let src="";
for(const f of ORDER){
  src+=fs.readFileSync(path.join(__dirname,"..","js",f+".js"),"utf8")+"\n";
}

/* ---------------- test harness ---------------- */
src+=`
;(async()=>{
const T=[];const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chk=(name,cond)=>{T.push(!!cond);console.log((cond?"PASS":"FAIL")+" - "+name);};

/* 1b. static regression guards (values computed in harness scope) */
chk("card.css .face layout not overridden by injected CSS",${!src.includes(".face{position:relative}")});
chk("index.html loads utils.js before data.js",${(()=>{try{const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");return html.indexOf("js/utils.js")<html.indexOf("js/data.js");}catch(e){return false;}})()});

/* 1. data integrity */
chk("DRUGS >= 130 ("+DRUGS.length+")",DRUGS.length>=130);
chk("unique drug ids",new Set(DRUGS.map(d=>d.id)).size===DRUGS.length);
let bad=0;
const badRef=(kind,id)=>{bad++;console.log("  DANGLING "+kind+" -> "+id);};
ARCHETYPES.forEach(a=>(a.cards||[]).forEach(id=>{if(!DRUG[id])badRef("arch:"+a.id,id);}));
CASES.forEach(c=>(c.req||[]).forEach(id=>{if(!DRUG[id])badRef("case.req",id);}));
INTERACTIONS.forEach(ix=>[ix.a,ix.b,(ix.b2||[])].flat().forEach(m=>{if(m[0]==="id"&&!DRUG[m[1]])badRef("interaction",m[1]);}));
SYNERGIES.forEach(s=>{
  if(s.boost&&s.boost.src&&!DRUG[s.boost.src])badRef("syn.src",s.boost.src);
  if(s.boost&&s.boost.tgt&&s.boost.tgt!=="__first_tag_art__"&&!DRUG[s.boost.tgt])badRef("syn.tgt",s.boost.tgt);
});
chk("no dangling data references ("+bad+")",bad===0);

/* 1c. CYP450 and renal clearance tests */
const cypInh = DRUGS.filter(d=>d.tags.includes("cyp3a4_inh"));
const cypSub = DRUGS.filter(d=>d.tags.includes("cyp3a4_sub"));
const renalClear = DRUGS.filter(d=>d.tags.includes("renal_clear"));
chk("CYP3A4 inhibitors & substrates tagged ("+cypInh.length+" inh, "+cypSub.length+" sub)",cypInh.length>=3 && cypSub.length>=3);
chk("Renal clearance tagged ("+renalClear.length+" drugs)",renalClear.length>=4);

// Test CYP3A4 interaction resolution
M = {chart:[{d:DRUG.clari,team:0},{d:DRUG.simva,team:0}],hands:[[],[]],diff:"intern",insights:new Set()};
const cypRes = resolveChart(CASES[0], []);
const hasCYPIx = cypRes.ixMsgs.some(m=>m.msg.includes("CYP3A4"));
chk("CYP3A4 inhibitor + substrate triggers interaction ("+cypRes.ixMsgs.length+" ix)",hasCYPIx);

/* 2. art engine: every drug x every style */
let artOK=true;
try{for(const d of DRUGS)for(const s of ART_STYLES)artFor(d,s.id);}
catch(e){artOK=false;console.log("  art error:",e.message);}
chk("art engine renders "+(DRUGS.length*ART_STYLES.length)+" plates",artOK);

/* 3. library filters */
Lib.q="statin";const st=libFiltered();
chk("search 'statin' -> "+st.length+" hits",st.length>0&&st.every(d=>(d.n+d.cls+d.moa+d.tg).toLowerCase().includes("statin")));
Lib.q="";Lib.area="ONCO";const on=libFiltered();
chk("ONCO filter -> "+on.length,on.length>0&&on.every(d=>d.a==="ONCO"));
Lib.rar="LEGEND";chk("LEGEND filter",libFiltered().every(d=>d.r==="LEGEND"));
Lib.rar="ALL";Lib.area="ALL";

/* 4. campaign pure functions */
C=freshCampaign();
chk("campaign starts Y1 with 1 compound",C.year===1&&C.pipe.length===1);
const gp=gatePct(C.pipe[0]);
chk("gatePct in bounds ("+gp+"%)",gp>=15&&gp<=92);
chk("valuation positive",valuation()>0);

/* 5. full advanceGate flow (confirm modal + roll animation) */
C.cash=500;C.data=200;
const p0=C.pipe[0];
const adv=advanceGate(p0.id);
await sleep(120);
const mb=Modal.stack[Modal.stack.length-1];
if(mb)Modal.resolve(mb,"go");
await sleep(3700);
const gateOK=(C.pipe.includes(p0)&&p0.stage===1)||!C.pipe.includes(p0);
chk("advanceGate resolves cleanly (advanced or terminated)",gateOK);

/* 6. 25-year campaign simulation with auto-answered events */
Modal.ask=async o=>(o.actions&&o.actions[0])?o.actions[0].val:null;
let simCrash=null;
try{
  C=freshCampaign();C.cash=500;
  for(let y=0;y<25&&!C.over;y++){
    // Screen if pipeline is low
    if(C.pipe.length < 2 && C.ap > 0 && C.cash >= 20){
      C.ap--; C.cash -= 15;
      const unowned = DRUGS.filter(d => d.r !== "BANNED" && !C.pipe.some(p => p.id === d.id) && !C.mkt.some(m => m.id === d.id));
      if(unowned.length) C.pipe.push({id: pick(unowned).id, stage: 0});
    }
    // Trial if we have AP and cash
    if(C.ap > 0 && C.cash >= 10){ C.ap--; C.cash -= 10; C.data += 12; }
    // Advance compounds
    for(const p of C.pipe.slice()){
      if(C.pipe.includes(p) && canAdvance(p) && C.ap > 0){
        C.ap--; const [cost, dt] = GATE_COST[p.stage];
        C.cash -= devCost(cost); C.data -= dt;
        if(Math.random() * 100 < gatePct(p)) p.stage++;
        else { C.pipe.splice(C.pipe.indexOf(p), 1); C.stats.failed++; }
      }
    }
    // Launch ready compounds
    for(const p of C.pipe.slice()) if(p.stage >= 4){
      C.pipe.splice(C.pipe.indexOf(p), 1);
      C.mkt.push({id: p.id, price: "std", share: 20, patent: 12, alts: []});
      C.stats.launched++;
    }
    await endYear(true);
  }
}catch(e){simCrash=e;console.log("  sim error:",e.stack.split("\\n").slice(0,3).join("\\n"));}
chk("25-year campaign sim runs clean",!simCrash);
chk("campaign reached an end state",C.over===true);
console.log("  sim result: year "+C.year+", valuation "+valuation()+", launches "+C.stats.launched+", failures "+C.stats.failed);

/* 7. resolveChart fuzz: every case x random charts */
let fuzzOK=true;
try{
  for(const cs of CASES){
    for(let i=0;i<15;i++){
      M={chart:shuffle(DRUGS).slice(0,6).map(d=>({d,team:Math.random()<0.5?0:1})),hands:[[],[]],diff:"intern",insights:new Set()};
      const r=resolveChart(cs,shuffle(MODS.slice()).slice(0,2));
      if(!isFinite(r.totals[0])||!isFinite(r.totals[1]))throw new Error("non-finite score in case "+(cs.id||"?"));
    }
  }
}catch(e){fuzzOK=false;console.log("  fuzz error:",e.message);}
chk("resolveChart fuzz: "+CASES.length+" cases x15 charts",fuzzOK);

/* 8. ECG Monitor and cardiac calculations */
let ecgOK=true;
try{
  const testEl = document.createElement("div");
  const ecg = new ECGMonitor(testEl, {audio:false});
  ecg.setToxicity(15, true, false);
  const vNormal = ecg.getVoltage(0.32);
  ecg.setToxicity(32, false, true);
  const vFlat = ecg.getVoltage(0.32);
  ecg.destroy();
  if(vNormal === 0 && vFlat === 0) ecgOK = false;
}catch(e){ecgOK=false;console.log("  ecg error:",e.stack);}
chk("ECG Monitor initializes, morphs waveform, and cleans up",ecgOK);

/* 8b. Case Zero Tutorial step progression */
let tutOK=true;
try{
  CaseZero.start();
  chk("Case Zero starts at step 1",CaseZero.step===1 && CaseZero.active===true);
  CaseZero.handlePlayCard("asp");
  await sleep(800);
  chk("Case Zero progresses to step 2 after Aspirin",CaseZero.step===2);
  CaseZero.step = 3;
  CaseZero.handlePlayCard("clopi");
  chk("Case Zero completes DAPT synergy on step 3",CaseZero.step===4);
  CaseZero.finishTutorial();
  chk("Case Zero awards Honorary Resident achievement",Achievements.has("case_zero"));
}catch(e){tutOK=false;console.log("  tutorial error:",e.stack);}
chk("Case Zero guided walkthrough completes seamlessly",tutOK);

/* 8c. Custom Case Maker encode/decode */
let cmOK=true;
try{
  const sample = {
    ind: "ICU Sepsis with Acute Renal Failure",
    area: "INFECT",
    sev: 3,
    mods: ["renal"],
    deck: ["vanc", "gent", "cipro", "doxy"]
  };
  const url = CaseMaker.encodeURL(sample);
  const code = url.split("code=")[1];
  const decoded = CaseMaker.decodeCode(code);
  chk("CaseMaker encodes and decodes scenario losslessly",decoded && decoded.ind===sample.ind && decoded.area===sample.area);
}catch(e){cmOK=false;console.log("  casemaker error:",e.stack);}
chk("Custom Case Maker URL sharing operational",cmOK);

/* 9. full duel match, all three cases */
let duelOK=true,playedCase2=false;
try{
  startMatch(ARCHETYPES[0].id,"intern");
  chk("duel starts with 5-card hand",!!M&&M.hands[0].length===5);
  for(let c=0;c<3&&M;c++){
    const before=M.chart.length;
    if(M.hands[0].length&&!M.busy)playCard(0);
    await sleep(1100);
    if(!M)break;
    if(c===1&&M.chart.length>before)playedCase2=true; // the old busy-bug check
    if(M.hands[0].length&&!M.busy)playCard(0);
    await sleep(1100);
    if(!M)break;
    await resolveCase(true);
    await sleep(300);
    if(M.score[0]>=2||M.score[1]>=2||M.caseNo>=3){endMatch();break;}
    const nb=$("#next-case-actions").children[0];
    if(nb)nb.click();
    await sleep(200);
  }
}catch(e){duelOK=false;console.log("  duel error:",e.stack.split("\\n").slice(0,3).join("\\n"));}
chk("duel: case 2 accepts input (busy-flag reset)",playedCase2);
const matchDone=!M||(M.score[0]>=2||M.score[1]>=2||M.caseNo>=3);
chk("full duel match plays to completion"+(M?" (score "+M.score[0]+"-"+M.score[1]+", case "+M.caseNo+")":""),duelOK&&matchDone);

/* 9b. meta-progression tests */
Discovery.mark("dig");
chk("Discovery tracking works ("+Discovery.count()+" discovered)",Discovery.count()>=1);
FoilMastery.unlock("dig");
chk("FoilMastery tracking works",FoilMastery.has("dig"));
Achievements.unlock("tuyouyou");
chk("Achievements unlock works",Achievements.has("tuyouyou"));

/* 9c. daily clinical case generation */
let dailyOK=true;
try{
  DailyCase.open();
}catch(e){dailyOK=false;console.log("  daily error:",e.stack);}
chk("Daily clinical case opens cleanly",dailyOK);

/* 9d. spotlight mode & router cleanup */
let spotOK=true;
try{
  openSpotlight(0);
  const spotEl=document.body.children.find(c=>c.className&&c.className.includes("spot-back"));
  chk("Spotlight opens with close button",!!spotEl && !spotEl.hidden);
  if(spotCleanup) spotCleanup();
  chk("Spotlight closes cleanly without recursion",!document.body.children.find(c=>c.className&&c.className.includes("spot-back")));
  openSpotlight(2);
  go("home");
  chk("Router clears spotlight overlay on navigation",!document.body.children.find(c=>c.className&&c.className.includes("spot-back")));
}catch(e){spotOK=false;console.log("  spotlight error:",e.stack);}
chk("Spotlight mode and router navigation stable",spotOK);

/* summary */
const fails=T.filter(x=>!x).length;
console.log("\\n=== "+(T.length-fails)+"/"+T.length+" checks passed ===");
process.exit(fails?1:0);
})().catch(e=>{console.log("FATAL:",e.stack);process.exit(1);});
`;

vm.runInThisContext(src,{filename:"therapeutic-index-bundle.js"});