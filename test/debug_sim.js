/* ============================================================
   THERAPEUTIC INDEX — debug playthrough (player simulation)
   Traces campaign state year by year to find why the naive
   strategy produced 0 launches in 20 years.
   Run:  node test/debug_sim.js
   ============================================================ */
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");

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
  removeChild(c){this.children=this.children.filter(x=>x!==c);}
  remove(){if(this.parentNode)this.parentNode.removeChild(this);}
  contains(){return false;}
  querySelector(sel){
    this._q=this._q||{};
    if(!this._q[sel]){this._q[sel]=new FakeEl("div");this._q[sel].parentNode=this;}
    return this._q[sel];
  }
  querySelectorAll(){return [];}
  addEventListener(){}removeEventListener(){}
  setAttribute(){}getAttribute(){return null;}
  getContext(){if(!this._ctx)this._ctx=makeCtx();return this._ctx;}
  scrollIntoView(){}focus(){}
  click(){if(this.onclick)this.onclick({stopPropagation(){},clientX:0,clientY:0,target:this});}
  getBoundingClientRect(){return{left:0,top:0,width:100,height:100};}
}
const docQ={};
global.document={
  querySelector(sel){if(!docQ[sel])docQ[sel]=new FakeEl("div");return docQ[sel];},
  querySelectorAll(){return [];},
  createElement(tag){return new FakeEl(tag);},
  addEventListener(){},removeEventListener(){},
  body:new FakeEl("body"),head:new FakeEl("head"),
  documentElement:new FakeEl("html"),hidden:false,
  activeElement:{tagName:"BODY"},
};
global.window=globalThis;
global.location={hash:""};
try{global.navigator={userAgent:"node"};}catch(e){}
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

const ORDER=["utils","audio","bg","data","card","library","campaign","duel","main"];
let src="";
for(const f of ORDER){
  src+=fs.readFileSync(path.join(__dirname,"..","js",f+".js"),"utf8")+"\n";
}
src+=`
;(async()=>{
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
console.log("STARTERS:",JSON.stringify(STARTERS));

// auto-answer all modals with first choice
Modal.ask=async o=>(o.actions&&o.actions[0])?o.actions[0].val:null;

let agg={launches:0,fails:0,wins:0,games:30,valSum:0,yearsSum:0};
for(let g=0;g<agg.games;g++){
  C=freshCampaign(); // Real $60M start
  let trace=g===0;
  while(!C.over&&C.year<=MAX_YEAR){
    // Partner licensing grant if cash is tight
    if(C.cash < 20 && C.ap > 0){
      C.ap--; C.cash += 20; C.rep = clamp(C.rep - 3, 0, 100);
    }
    // Upgrade CSO when profitable
    if(!C.ups.cso && C.cash >= 100 && C.ap > 0){
      C.ap--; C.cash -= 50; C.ups.cso = true;
    }
    // Screen when pipeline has room (< 3 compounds) and we have cash
    if(C.pipe.length < 3 && C.ap > 0 && C.cash >= 25){
      C.ap--; C.cash -= 10;
      const unowned = DRUGS.filter(d => d.r !== "BANNED" && !C.pipe.some(p => p.id === d.id) && !C.mkt.some(m => m.id === d.id));
      if(unowned.length) C.pipe.push({id: pick(unowned).id, stage: 0});
    }
    // Trial only when data is needed for next gate
    const neededData = C.pipe.reduce((max, p) => Math.max(max, GATE_COST[p.stage][1]), 0);
    while(C.data < neededData && C.ap > 0 && C.cash >= 10){
      C.ap--; C.cash -= 5; C.data += 12;
    }
    // Advance compounds
    for(const p of C.pipe.slice()){
      if(C.pipe.includes(p) && p.stage < 4 && canAdvance(p) && C.ap > 0){
        C.ap--;
        const ok = Math.random() * 100 < gatePct(p);
        const [cost, dt] = GATE_COST[p.stage];
        C.cash -= devCost(cost); C.data -= dt;
        if(ok) {
          p.stage++;
          if(p.stage === 1) C.cash += 8;
          else if(p.stage === 2) C.cash += 15;
          else if(p.stage === 3) C.cash += 25;
        } else {
          C.pipe.splice(C.pipe.indexOf(p), 1);
          C.data += 8; // Recovered data
          C.stats.failed++;
        }
      }
    }
    // Launch ready compounds
    for(const p of C.pipe.slice()) if(p.stage >= 4){
      C.pipe.splice(C.pipe.indexOf(p), 1);
      C.mkt.push({id: p.id, price: "std", share: 22, patent: 12, alts: []});
      C.stats.launched++;
    }
    // Repurpose or extend patents if we have launched products
    for(const m of C.mkt){
      if(m.patent <= 3 && m.patent > 0 && C.cash >= 30 && C.ap > 0){
        C.ap--; C.cash -= 15; m.patent += 3;
      }
    }

    if(trace)console.log("Y"+C.year,"ap="+C.ap,"cash="+Math.round(C.cash),"data="+Math.round(C.data),
      "pipe="+JSON.stringify(C.pipe.map(p=>DRUG[p.id].n+"@"+p.stage)),
      "mkt="+C.mkt.length,"val="+fmtM(valuation()));
    await endYear(true);
  }
  agg.launches+=C.stats.launched;agg.fails+=C.stats.failed;
  agg.valSum+=valuation();agg.yearsSum+=C.year;
  if(C.won || valuation() >= WIN_VAL)agg.wins++;
}
console.log("\\n=== "+agg.games+" games, realistic $60M start, active bot ===");
console.log("avg launches:",(agg.launches/agg.games).toFixed(2));
console.log("avg terminations:",(agg.fails/agg.games).toFixed(2));
console.log("win rate:",agg.wins+"/"+agg.games,"(" + Math.round(agg.wins/agg.games*100) + "%)");
console.log("avg final valuation:",fmtM(Math.round(agg.valSum/agg.games)));
console.log("avg years played:",(agg.yearsSum/agg.games).toFixed(1));
process.exit(0);
})().catch(e=>{console.log("FATAL:",e.stack);process.exit(1);});
`;
vm.runInThisContext(src,{filename:"debug-bundle.js"});