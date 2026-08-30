/* ============================================================
   THERAPEUTIC INDEX — utils.js
   DOM helpers, seeded RNG, formatters, modal/toast systems,
   confetti, count-up animations
   ============================================================ */

"use strict";

const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

function esc(s){
  return String(s).replace(/[&<>"']/g,c=>(
    c==="&"?"\u0026amp;":
    c==="<"?"\u0026lt;":
    c===">"?"\u0026gt;":
    c==="\""?"\u0026quot;":
    "\u0026#39;"
  ));
}
function icon(id,cls=""){return `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;}

/* ---- deterministic randomness ---- */
function hstr(s){let h=1779033703;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return h>>>0;}
function rng(seed){let a=seed;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function shuffle(arr){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
function weightedPick(items,wfn){ // items with weight fn
  let tot=0;const ws=items.map(it=>{const w=wfn(it);tot+=w;return w;});
  let r=Math.random()*tot;
  for(let i=0;i<items.length;i++){r-=ws[i];if(r<=0)return items[i];}
  return items[items.length-1];
}

/* ---- formatters ---- */
function fmtM(n){ // n in $ millions
  const neg=n<0;n=Math.abs(n);
  const s=n>=1000?"$"+(n/1000).toFixed(n>=10000?0:1)+"B":"$"+Math.round(n)+"M";
  return neg?"−"+s:s;
}
function fmtHL(h){
  if(h==null)return "—";
  if(h<0)return "expands";
  if(h<0.5)return Math.round(h*60)+" min";
  if(h<48)return (Math.round(h*10)/10)+" h";
  const d=h/24;
  return d<21?(Math.round(d*10)/10)+" d":Math.round(d)+" d";
}
function fmtRoute(rt){
  return {PO:"oral",IV:"intravenous",SC:"subcutaneous",IM:"intramuscular",SL:"sublingual",INH:"inhaled",TD:"transdermal"}[rt]||rt.toLowerCase();
}
function routeIcon(rt){
  if(["IV","IM","SC"].includes(rt))return "i-syringe";
  if(rt==="INH")return "i-wind";
  if(rt==="TD")return "i-patch";
  return "i-pill";
}

/* ---- count-up animation ---- */
function countUp(el,to,dur=800,fmt=v=>Math.round(v)){
  if(REDUCED){el.textContent=fmt(to);return;}
  const from=parseFloat((el.dataset.v)||"0");el.dataset.v=to;
  const t0=performance.now();
  (function tick(t){
    const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);
    el.textContent=fmt(from+(to-from)*e);
    if(p<1)requestAnimationFrame(tick);
  })(t0);
}

/* ---- toasts ---- */
function toast(msg,type="info",ic=null){
  const root=$("#toast-root");
  while(root.children.length>4)root.firstChild.remove();
  const icons={ok:"i-check",bad:"i-alert",info:"i-info",gold:"i-star"};
  const el=document.createElement("div");
  el.className=`toast ${type}`;
  el.innerHTML=icon(ic||icons[type]||"i-info")+`<div>${msg}</div>`;
  root.appendChild(el);
  setTimeout(()=>{el.classList.add("out");setTimeout(()=>el.remove(),320);},4200);
}

/* ---- haptics ---- */
const Haptics={
  light(){try{if(typeof navigator!=="undefined"&&navigator.vibrate)navigator.vibrate(10);}catch(_){}},
  medium(){try{if(typeof navigator!=="undefined"&&navigator.vibrate)navigator.vibrate(25);}catch(_){}},
  success(){try{if(typeof navigator!=="undefined"&&navigator.vibrate)navigator.vibrate([15,30,15]);}catch(_){}},
  error(){try{if(typeof navigator!=="undefined"&&navigator.vibrate)navigator.vibrate([40,40,40]);}catch(_){}},
  synergy(){try{if(typeof navigator!=="undefined"&&navigator.vibrate)navigator.vibrate([15,30,15]);}catch(_){}},
  gateSuccess(){try{if(typeof navigator!=="undefined"&&navigator.vibrate)navigator.vibrate([15,30,15]);}catch(_){}},
  gateFail(){try{if(typeof navigator!=="undefined"&&navigator.vibrate)navigator.vibrate([40,40,40]);}catch(_){}},
};

/* ---- modal system ---- */
const Modal={
  stack:[],
  open({title,kicker,body,html,actions,wide,narrow,noClose,onClose}){
    const back=document.createElement("div");
    back.className="modal-back";
    back.style.zIndex=String(900 + Modal.stack.length * 10);
    back.innerHTML=`<div class="modal ${wide?"wide":""} ${narrow?"narrow":""}" role="dialog" aria-modal="true">
      <div class="modal-handle"></div>
      <button class="icon-btn modal-x" aria-label="Close">${icon("i-x")}</button>
      ${kicker?`<div class="m-kicker">${kicker}</div>`:""}
      ${title?`<h3 class="m-title">${title}</h3>`:""}
      <div class="m-body">${html||body||""}</div>
      <div class="m-actions"></div>
    </div>`;
    const acts=$(".m-actions",back);
    (actions||[{label:"OK",val:"ok",primary:true}]).forEach(a=>{
      const b=document.createElement("button");
      b.className="btn"+(a.primary?" btn-primary":"")+(a.cls?" "+a.cls:"");
      b.innerHTML=(a.icon?icon(a.icon):"")+esc(a.label);
      b.onclick=()=>Modal.resolve(back,a.val);
      acts.appendChild(b);
    });
    back._noClose=noClose;
    $(".modal-x",back).onclick=()=>{if(!noClose)Modal.resolve(back,null);};
    back.addEventListener("click",e=>{
      if(e.target===back && !noClose && Modal.stack[Modal.stack.length-1]===back){
        Modal.resolve(back,null);
      }
    });

    // Strict pull-down: ONLY on the dedicated top handle pill (.modal-handle)
    // Never intercepts touches on the modal body, text, or content
    const modalEl=$(".modal",back);
    const handleEl=$(".modal-handle",back);
    if(handleEl&&modalEl){
      let startY=null,curY=null,isDraggingHandle=false;
      const onTouchStart=e=>{
        if(noClose) return;
        startY=e.touches[0].clientY;
        curY=startY;
        isDraggingHandle=true;
      };
      const onTouchMove=e=>{
        if(startY==null||!isDraggingHandle||noClose) return;
        curY=e.touches[0].clientY;
        const dy=curY-startY;
        if(dy>0){
          modalEl.style.transition="none";
          modalEl.style.transform=`translateY(${dy}px)`;
          back.style.background=`rgba(4,7,14,${Math.max(0.2, 0.72*(1 - dy/500))})`;
        }
      };
      const onTouchEnd=e=>{
        if(startY==null||!isDraggingHandle||noClose) return;
        if(e.changedTouches&&e.changedTouches.length){
          curY=e.changedTouches[0].clientY;
        }
        const dy=curY-startY;
        if(dy>120){
          modalEl.style.transition="transform .22s ease-out";
          modalEl.style.transform="translateY(100%)";
          back.style.transition="opacity .2s";
          back.style.opacity="0";
          Haptics.light();
          setTimeout(()=>Modal.resolve(back,null),180);
        }else{
          modalEl.style.transition="transform .24s cubic-bezier(.2,1.2,.3,1)";
          modalEl.style.transform="";
          back.style.background="";
        }
        startY=null;curY=null;isDraggingHandle=false;
      };

      handleEl.addEventListener("touchstart",onTouchStart,{passive:true});
      handleEl.addEventListener("touchmove",onTouchMove,{passive:true});
      handleEl.addEventListener("touchend",onTouchEnd,{passive:true});
      handleEl.addEventListener("touchcancel",onTouchEnd,{passive:true});
    }

    $("#modal-root").appendChild(back);
    back._onClose=onClose;
    Modal.stack.push(back);

    // Focus trap — keep keyboard focus inside the modal
    const FOCUSABLE = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    back._trapFocus = e => {
      if(e.key !== "Tab") return;
      const focusable = [...back.querySelectorAll(FOCUSABLE)].filter(el => !el.closest('[hidden]'));
      if(!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if(e.shiftKey){
        if(document.activeElement === first){ e.preventDefault(); last.focus(); }
      } else {
        if(document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    };
    back.addEventListener("keydown", back._trapFocus);
    // Move initial focus into the modal
    requestAnimationFrame(()=>{
      const firstFocus = back.querySelector(FOCUSABLE);
      if(firstFocus) firstFocus.focus();
    });

    return back;
  },
  close(back){
    const i=Modal.stack.indexOf(back);
    if(i>=0)Modal.stack.splice(i,1);
    back.classList.add("closing");
    setTimeout(()=>{
      if(back.parentNode)back.remove();
      if(back._onClose)back._onClose();
    },190);
  },
  resolve(back,val){
    if(back._resolved)return;
    back._resolved=true;
    Modal.close(back);
    if(back._resolveFn)back._resolveFn(val);
  },
  ask(opts){ // promise-based choice
    return new Promise(res=>{
      const back=Modal.open({...opts,noClose:opts.noClose!==false});
      back._resolveFn=res;
    });
  },
  info(opts){return Modal.ask({...opts});},
};
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&Modal.stack.length){
    const top=Modal.stack[Modal.stack.length-1];
    if(top&&!top._noClose)Modal.resolve(top,null);
  }
});

/* ---- high-dpi crisp confetti ---- */
const FX={parts:[],running:false,dpr:1};
FX.resize=function(){
  const cv=$("#fx");
  if(!cv)return;
  FX.dpr=Math.min(window.devicePixelRatio||1,3);
  const w=window.innerWidth, h=window.innerHeight;
  if(cv.width!==Math.round(w*FX.dpr)||cv.height!==Math.round(h*FX.dpr)){
    cv.width=Math.round(w*FX.dpr);
    cv.height=Math.round(h*FX.dpr);
  }
};
FX.burst=function(x,y,colors,n=120){
  if(REDUCED)return;
  FX.resize();
  const dpr=FX.dpr;
  const px=x*dpr, py=y*dpr;
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2,sp=(4+Math.random()*11)*dpr;
    FX.parts.push({
      x:px, y:py,
      vx:Math.cos(a)*sp, vy:Math.sin(a)*sp - 6*dpr,
      w:(5+Math.random()*7)*dpr, h:(3+Math.random()*6)*dpr,
      rot:Math.random()*Math.PI*2, vr:(Math.random()-0.5)*0.25,
      c:pick(colors), life:1, decay:0.010+Math.random()*0.006
    });
  }
  if(!FX.running){FX.running=true;requestAnimationFrame(FX.tick);}
};
FX.tick=function(){
  const cv=$("#fx");
  if(!cv)return;
  const g=cv.getContext("2d");
  g.clearRect(0,0,cv.width,cv.height);
  FX.parts=FX.parts.filter(p=>p.life>0);
  const gravity=0.32*FX.dpr;
  for(const p of FX.parts){
    p.x+=p.vx;p.y+=p.vy;p.vy+=gravity;p.vx*=0.985;p.rot+=p.vr;p.life-=p.decay;
    g.save();
    g.translate(p.x,p.y);
    g.rotate(p.rot);
    g.globalAlpha=Math.max(0,Math.min(1,p.life*1.5));
    g.fillStyle=p.c;
    g.beginPath();
    if(g.roundRect){
      g.roundRect(-p.w/2,-p.h/2,p.w,p.h,2*FX.dpr);
      g.fill();
    }else{
      g.fillRect(-p.w/2,-p.h/2,p.w,p.h);
    }
    g.restore();
  }
  if(FX.parts.length){
    requestAnimationFrame(FX.tick);
  }else{
    FX.running=false;
    g.clearRect(0,0,cv.width,cv.height);
  }
};
function confettiCenter(colors){
  const w=window.innerWidth, h=window.innerHeight;
  const mobile = w < 600;
  const n1 = mobile ? 70 : 140;
  const n2 = mobile ? 40 : 80;
  FX.burst(w*0.5,h*0.35,colors,n1);
  setTimeout(()=>FX.burst(w*0.3,h*0.3,colors,n2),220);
  setTimeout(()=>FX.burst(w*0.7,h*0.3,colors,n2),400);
}
if(typeof window!=="undefined"){
  window.addEventListener("resize",()=>FX.resize());
}

/* ---- persistence ---- */
const Store={
  get(k,def){try{const v=localStorage.getItem("ti_"+k);return v?JSON.parse(v):def;}catch(e){return def;}},
  set(k,v){try{localStorage.setItem("ti_"+k,JSON.stringify(v));}catch(e){}},
  del(k){try{localStorage.removeItem("ti_"+k);}catch(e){}},
};

/* ---------- Post-Case Clinical Debrief & Discharge Summary ---------- */
function showClinicalDebriefModal({
  title = "Case Debrief",
  diagnosis = "Clinical Presentation",
  outcome = "won",
  score = 0,
  rivalScore = null,
  rivalName = null,
  vitals = { hr: 74, bp: "120/80", spo2: "98%", tox: 0 },
  drugs = [],
  synergies = [],
  interactions = [],
  pearl = "",
  actionLabel = "Continue",
  onClose = () => {}
}) {
  const isWon = outcome === "won";
  const statusBadge = isWon
    ? `<span class="discharge-badge good">${icon("i-check")} STABLE DISCHARGE / CLINICAL REMISSION</span>`
    : outcome === "lost"
    ? `<span class="discharge-badge bad">${icon("i-alert")} ICU TRANSFER / TOXICITY EVENT</span>`
    : `<span class="discharge-badge warn">${icon("i-info")} EQUIVOCAL STABILIZATION</span>`;

  const drugListHTML = drugs.map(d => {
    const drugObj = typeof d === "string" && typeof DRUG !== "undefined" ? DRUG[d] : d;
    if (!drugObj) return "";
    const col = (typeof AREAS !== "undefined" && AREAS[drugObj.a]?.c) || "var(--acc)";
    return `
      <div class="deb-rx-item" style="--ac:${col}">
        <span class="deb-rx-dot"></span>
        <div class="deb-rx-info">
          <b>${esc(drugObj.n)}</b> <span class="dim">(${esc(drugObj.cls)})</span>
          <div class="deb-rx-moa">${esc(drugObj.moa)}</div>
        </div>
        <span class="deb-rx-stats mono"><b>${drugObj.eff}/10</b> EFF · <b>${drugObj.saf}/10</b> SAF</span>
      </div>`;
  }).join("");

  const synHTML = synergies.length ? `
    <div class="deb-section">
      <div class="deb-sec-title good">${icon("i-link")} GUIDELINE SYNERGIES TRIGGERED</div>
      <div class="deb-events-list">
        ${synergies.map(s => `<div class="deb-event good">${icon("i-spark")} <span>${esc(s)}</span></div>`).join("")}
      </div>
    </div>` : "";

  const ixHTML = interactions.length ? `
    <div class="deb-section">
      <div class="deb-sec-title bad">${icon("i-alert")} ADVERSE INTERACTIONS / DDI PENALTIES</div>
      <div class="deb-events-list">
        ${interactions.map(ix => `<div class="deb-event bad">${icon("i-skull")} <span>${esc(ix)}</span></div>`).join("")}
      </div>
    </div>` : "";

  const pearlText = pearl || (isWon
    ? "Guideline-directed medical therapy successfully balanced target organ perfusion while mitigating off-target receptor toxicity."
    : "Review metabolic clearance (CYP450 / renal) and synergistic pharmacodynamics when prescribing multiple active agents.");

  const back = Modal.open({
    wide: true,
    kicker: "CLINICAL AUDIT · MORBIDITY & DISCHARGE REPORT",
    title: `Discharge Summary: ${esc(title)}`,
    html: `
      <div class="deb-wrap">
        <div class="deb-top-card panel">
          <div class="deb-meta-row">
            <div><small class="mono dim">DIAGNOSIS</small><div class="deb-meta-val">${esc(diagnosis)}</div></div>
            <div><small class="mono dim">CLINICAL AUDIT SCORE</small><div class="deb-meta-val" style="color:${isWon?"var(--mint)":"var(--rose)"}">${score>=0?"+":""}${score.toFixed(1)} PTS</div></div>
            ${rivalScore!=null?`<div><small class="mono dim">RIVAL (${esc(rivalName||"RIVAL")})</small><div class="deb-meta-val">${rivalScore.toFixed(1)} PTS</div></div>`:""}
          </div>
          <div class="deb-status-row">${statusBadge}</div>
        </div>

        <div class="deb-vitals-strip mono panel">
          <div class="deb-vital"><small>HEART RATE</small><b style="color:${vitals.hr>115||vitals.hr<52?"var(--rose)":"var(--mint)"}">${vitals.hr} BPM</b></div>
          <div class="deb-vital"><small>BLOOD PRESSURE</small><b>${vitals.bp||"120/80"} mmHg</b></div>
          <div class="deb-vital"><small>SpO2</small><b style="color:${parseInt(vitals.spo2)<92?"var(--rose)":"var(--mint)"}">${vitals.spo2||"98%"}</b></div>
          <div class="deb-vital"><small>SYSTEMIC TOXICITY</small><b style="color:${vitals.tox>15?"var(--rose)":"var(--mint)"}">${vitals.tox}</b></div>
        </div>

        <div class="deb-section">
          <div class="deb-sec-title">${icon("i-flask")} ADMINISTERED REGIMEN & PHARMACOLOGY</div>
          <div class="deb-rx-list">${drugListHTML || "<p class='dim'>No medications ordered.</p>"}</div>
        </div>

        ${synHTML}
        ${ixHTML}

        <div class="deb-pearl panel">
          <div class="deb-pearl-head">${icon("i-star")} KEY CLINICAL PEARL</div>
          <p>${esc(pearlText)}</p>
        </div>
      </div>`,
    actions: [
      { label: actionLabel, primary: true, icon: "i-ar" }
    ]
  });

  const nextBtn = back.querySelector(".m-actions .btn");
  if (nextBtn) {
    nextBtn.onclick = () => {
      Modal.close(back);
      if (onClose) onClose();
    };
  }
}