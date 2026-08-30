/* ============================================================
   THERAPEUTIC INDEX — card.js
   Shared card renderer: 6-style procedural art engine
   (structure · target · dose-response · plasma PK · organ ·
   formulation), front/back faces, 3D tilt, glare, flip.
   ============================================================ */

"use strict";

/* ---------- procedural artwork engine ---------- */
const ART=new Map();
const ART_STYLES=[
  {id:"molecule",label:"Structure"},
  {id:"receptor",label:"Target"},
  {id:"curve",label:"Dose–Response"},
  {id:"pk",label:"Plasma PK"},
  {id:"organ",label:"Organ"},
  {id:"form",label:"Formulation"},
];
const ROMAN=["I","II","III","IV","V","VI"];

/* Each drug's SIGNATURE plate is chosen deterministically, weighted by
   its real properties: potent drugs lean toward dose-response curves,
   long-half-life drugs toward PK profiles, etc. */
function sigStyleOf(d){
  const R=rng(hstr(d.id+"sig"));
  const w={
    molecule:3,
    receptor:2,
    curve:d.eff>=7?3:1,
    pk:(d.hl&&d.hl>=24)?3:1,
    organ:2,
    form:2,
  };
  const bag=[];
  for(const s of ART_STYLES)for(let i=0;i<w[s.id];i++)bag.push(s.id);
  return bag[Math.floor(R()*bag.length)];
}

function artFor(d,style){
  style=style||sigStyleOf(d);
  const key=d.id+"|"+style;
  if(ART.has(key))return ART.get(key);
  const cv=document.createElement("canvas");
  cv.width=560;cv.height=360;
  const g=cv.getContext("2d");
  const col=AREAS[d.a].c;
  const R=rng(hstr(d.id+style));
  artBase(g,R,col);
  ({molecule:artMolecule,receptor:artReceptor,curve:artCurve,pk:artPK,organ:artOrgan,form:artForm}[style])(g,d,R,col);
  artSign(g,d,style);
  ART.set(key,cv);
  return cv;
}

/* ---- shared backdrop & signature ---- */
function artBase(g,R,col){
  const bg=g.createLinearGradient(0,0,0,360);
  bg.addColorStop(0,"#0b1120");bg.addColorStop(1,"#111b31");
  g.fillStyle=bg;g.fillRect(0,0,560,360);
  g.globalAlpha=0.14;g.fillStyle=col;g.fillRect(0,0,560,360);
  g.globalAlpha=1;
  drawHexShape(g,470,80,84,R()*Math.PI,col,0.10,2);
  drawHexShape(g,60,300,60,R()*Math.PI,col,0.07,1.5);
  for(let i=0;i<12;i++){
    g.globalAlpha=0.10+R()*0.18;g.fillStyle="#cfe4ff";
    g.beginPath();g.arc(R()*560,R()*360,0.8+R()*1.5,0,7);g.fill();
  }
  g.globalAlpha=1;
}
function artSign(g,d,style){
  const idx=Math.max(0,ART_STYLES.findIndex(s=>s.id===style));
  g.font="600 11px JetBrains Mono,monospace";
  g.fillStyle="rgba(160,185,225,0.4)";
  g.fillText(`PLATE ${ROMAN[idx]} · ${ART_STYLES[idx].label.toUpperCase()} · #${hstr(d.id).toString(16).slice(0,6).toUpperCase()}`,16,344);
}

/* ---- PLATE I: molecular structure ---- */
function artMolecule(g,d,R,col){
  if(R()<0.45){
    const cx=120+R()*320,cy=90+R()*180,rr=34+R()*16;
    const pts=[];
    for(let i=0;i<6;i++){
      const a=R()*Math.PI+i*Math.PI/3;
      pts.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]);
    }
    strokePath(g,pts.concat([pts[0]]),col,0.85,2.5,true);
    g.beginPath();g.arc(cx,cy,rr*0.55,0,7);
    g.strokeStyle=col;g.globalAlpha=0.5;g.lineWidth=1.6;g.stroke();g.globalAlpha=1;
    for(const[px,py]of pts)drawAtom(g,px,py,5+R()*3,col);
  }
  const nodes=[];let x=200+R()*160,y=150+R()*80,ang=R()*Math.PI*2;
  const n=5+Math.floor(R()*4);
  for(let i=0;i<n;i++){
    nodes.push({x,y,r:6+R()*7});
    const step=46+R()*20;
    ang+=(R()-0.5)*2.1;
    x=clamp(x+Math.cos(ang)*step,50,510);
    y=clamp(y+Math.sin(ang)*step*0.72,50,310);
  }
  for(let i=0;i<nodes.length-1;i++){
    const a=nodes[i],b=nodes[i+1];
    const dbl=R()<0.3;
    strokeSeg(g,a.x,a.y,b.x,b.y,col,0.8,2.6,true);
    if(dbl){
      const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
      const ox=-dy/len*5,oy=dx/len*5;
      strokeSeg(g,a.x+ox,a.y+oy,b.x+ox,b.y+oy,col,0.55,1.8,false);
    }
  }
  for(const nd of nodes)drawAtom(g,nd.x,nd.y,nd.r,col);
}

/* ---- PLATE II: receptor / target docking ---- */
function artReceptor(g,d,R,col){
  const my=180;
  artLabel(g,"EXTRACELLULAR",20,my-66,col,0.5);
  artLabel(g,"CYTOSOL",20,my+80,col,0.5);
  // membrane slab + phospholipid heads
  g.save();g.globalAlpha=0.10;g.fillStyle=col;g.fillRect(0,my-46,560,92);g.restore();
  for(let x=14;x<560;x+=26){
    const j=Math.sin(x*0.05)*3;
    drawAtom(g,x,my-46+j,4.5,col);
    drawAtom(g,x+13,my+46+j,4.5,col);
  }
  // 7-transmembrane helices (GPCR-style bundle)
  for(let i=0;i<7;i++){
    const hx=196+i*24,tilt=(i-3)*3;
    g.save();
    g.strokeStyle=col;g.globalAlpha=0.75;g.lineWidth=9;g.lineCap="round";
    g.shadowColor=col;g.shadowBlur=8;
    g.beginPath();g.moveTo(hx+tilt,my-40);g.lineTo(hx-tilt,my+40);g.stroke();
    g.restore();g.globalAlpha=1;
  }
  // extracellular & intracellular loops
  g.save();g.strokeStyle=col;g.globalAlpha=0.55;g.lineWidth=2.5;
  g.beginPath();g.arc(232,my-52,42,Math.PI*1.05,Math.PI*1.95);g.stroke();
  g.beginPath();g.arc(248,my+56,52,Math.PI*0.1,Math.PI*0.9);g.stroke();
  g.restore();g.globalAlpha=1;
  // binding pocket glow
  const px=232,py=my-58;
  const pg=g.createRadialGradient(px,py,2,px,py,46);
  pg.addColorStop(0,"rgba(255,255,255,0.85)");pg.addColorStop(0.4,col);pg.addColorStop(1,"rgba(0,0,0,0)");
  g.save();g.globalAlpha=0.5;g.fillStyle=pg;g.beginPath();g.arc(px,py,46,0,7);g.fill();g.restore();g.globalAlpha=1;
  // ligand descending into pocket
  const ly=py-66-R()*10;
  dashSeg(g,px,py-8,px,ly+14,col,0.5,1.5);
  drawAtom(g,px,ly,10,col);
  drawAtom(g,px-16,ly+10,6,col);
  drawAtom(g,px+16,ly+10,6,col);
  strokeSeg(g,px,ly,px-16,ly+10,col,0.8,2.2,true);
  strokeSeg(g,px,ly,px+16,ly+10,col,0.8,2.2,true);
  artLabel(g,"LIGAND DOCKING · "+String(d.tg||"TARGET").slice(0,26).toUpperCase(),140,44,col,0.6);
}

/* ---- PLATE III: dose-response (pharmacodynamics) ---- */
function artCurve(g,d,R,col){
  const x0=70,y0=300,x1=520,y1=60;
  strokeSeg(g,x0,y0,x1+10,y0,"#9db8e0",0.7,2,false);
  strokeSeg(g,x0,y0,x0,y1-10,"#9db8e0",0.7,2,false);
  ["0.1","1","10","10²","10³"].forEach((t,i)=>{
    const tx=x0+30+i*((x1-x0-30)/4);
    artLabel(g,t,tx-6,y0+18,"#9db8e0",0.55);
    dashSeg(g,tx,y0,tx,y0+5,"#9db8e0",0.5,1);
  });
  artLabel(g,"DOSE (log)",x1-72,y0+34,"#9db8e0",0.55);
  artLabel(g,"EFFECT",x0-52,y1+6,"#9db8e0",0.55);
  const emax=y1+30+(10-d.eff)*4;          // Emax tracks real efficacy
  const ec50x=x0+60+R()*(x1-x0-140);      // potency = position
  const nn=2.2+R()*2;
  const f=x=>{const t=Math.max(0.001,(x-x0)/(ec50x-x0));return y0-(y0-emax)*(Math.pow(t,nn)/(1+Math.pow(t,nn)));};
  // placebo line
  dashSeg(g,x0,y0-14,x1,y0-14,"#8899bb",0.5,1.5);
  artLabel(g,"PLACEBO",x1-62,y0-20,"#8899bb",0.6);
  // the sigmoid
  g.save();g.strokeStyle=col;g.lineWidth=3.5;g.lineCap="round";
  g.shadowColor=col;g.shadowBlur=14;g.globalAlpha=0.95;
  g.beginPath();
  for(let x=x0;x<=x1;x+=4){const y=f(x);x===x0?g.moveTo(x,y):g.lineTo(x,y);}
  g.stroke();g.restore();g.globalAlpha=1;
  // EC50 marker
  dashSeg(g,ec50x,y0,ec50x,f(ec50x),"#ffd166",0.8,1.8);
  dashSeg(g,x0,f(ec50x),ec50x,f(ec50x),"#ffd166",0.8,1.8);
  drawAtom(g,ec50x,f(ec50x),5,"#ffd166");
  artLabel(g,"EC50",ec50x-14,f(ec50x)-12,"#ffd166",0.9);
  // scatter of real data points
  for(let i=0;i<10;i++){
    const x=x0+20+R()*(x1-x0-30);
    const y=f(x)+(R()-0.5)*26;
    g.globalAlpha=0.55;g.fillStyle="#cfe4ff";
    g.beginPath();g.arc(x,y,2.4,0,7);g.fill();g.globalAlpha=1;
  }
}

/* ---- PLATE IV: plasma concentration–time (PK) ---- */
function artPK(g,d,R,col){
  const x0=64,y0=300,x1=524,y1=56;
  strokeSeg(g,x0,y0,x1+8,y0,"#9db8e0",0.7,2,false);
  strokeSeg(g,x0,y0,x0,y1-8,"#9db8e0",0.7,2,false);
  artLabel(g,"TIME →",x1-56,y0+20,"#9db8e0",0.55);
  artLabel(g,"CONC",x0-44,y1+4,"#9db8e0",0.55);
  const hl=(d.hl&&d.hl>0)?d.hl:4;
  const ke=Math.log(2)/hl;
  const oral=["PO","SL","TD","INH"].includes(d.rt);
  const ka=ke*(3+R()*4);
  const C=t=>oral
    ?Math.max(0,2.2*(Math.exp(-ke*t)-Math.exp(-ka*t)))
    :2.4*Math.exp(-ke*t);
  const tmax=oral?6*hl:4.6*hl;
  const tp=oral?Math.log(ka/ke)/(ka-ke):0;
  const peak=Math.max(0.001,oral?C(tp):C(0));
  const X=t=>x0+(t/tmax)*(x1-x0);
  const Y=c=>y0-(c/peak)*(y0-y1-40);
  // AUC shade
  g.save();g.globalAlpha=0.12;g.fillStyle=col;g.beginPath();g.moveTo(x0,y0);
  for(let t=0;t<=tmax;t+=tmax/80)g.lineTo(X(t),Y(C(t)));
  g.lineTo(x1,y0);g.closePath();g.fill();g.restore();g.globalAlpha=1;
  // curve
  g.save();g.strokeStyle=col;g.lineWidth=3.5;g.shadowColor=col;g.shadowBlur=12;
  g.beginPath();
  for(let t=0;t<=tmax;t+=tmax/80){const x=X(t),y=Y(C(t));t===0?g.moveTo(x,y):g.lineTo(x,y);}
  g.stroke();g.restore();g.globalAlpha=1;
  // half-life decay markers
  for(let i=1;i<=3;i++){
    const ty=tp+i*hl;
    if(ty>tmax)break;
    dashSeg(g,X(ty),Y(peak/Math.pow(2,i)),X(ty),y0,"#ffd166",0.55,1.4);
    artLabel(g,"t½",X(ty)-6,y0-8,"#ffd166",0.8);
  }
  drawAtom(g,X(tp),Y(peak),5,col);
  artLabel(g,oral?"Cmax":"C₀",X(tp)+8,Y(peak)-8,col,0.85);
  artLabel(g,oral?"ORAL ABSORPTION → ELIMINATION":"IV BOLUS DECAY",x0+8,y1+2,col,0.5);
}

/* ---- PLATE V: organ / tissue (by therapeutic area) ---- */
function artOrgan(g,d,R,col){
  const cx=280,cy=180;
  if(d.a==="CARDIO"){
    const heart=()=>{g.beginPath();g.moveTo(cx,cy+95);
      g.bezierCurveTo(cx-130,cy+10,cx-95,cy-95,cx,cy-30);
      g.bezierCurveTo(cx+95,cy-95,cx+130,cy+10,cx,cy+95);};
    g.save();g.fillStyle=col;g.globalAlpha=0.16;heart();g.fill();
    g.strokeStyle=col;g.globalAlpha=0.9;g.lineWidth=3.5;g.shadowColor=col;g.shadowBlur=14;
    heart();g.stroke();g.restore();g.globalAlpha=1;
    // ECG trace across
    g.save();g.strokeStyle="#ffd166";g.lineWidth=2.5;g.shadowColor="#ffd166";g.shadowBlur=8;g.globalAlpha=0.9;
    g.beginPath();let ex=36;g.moveTo(ex,cy+8);
    const beats=[[28,0],[44,-6],[56,26],[68,-58],[80,30],[98,0]];
    while(ex<524){for(const[dx,dy]of beats){ex+=dx;if(ex>524)break;g.lineTo(ex,cy+8+dy);}}
    g.stroke();g.restore();g.globalAlpha=1;
  }else if(d.a==="NEURO"){
    // brain outline
    g.save();g.strokeStyle=col;g.lineWidth=3.5;g.shadowColor=col;g.shadowBlur=12;g.globalAlpha=0.9;
    g.beginPath();
    const n=14;
    for(let i=0;i<=n;i++){
      const a=Math.PI*1.12+i/n*Math.PI*1.76;
      const rr=88+Math.sin(i*2.7)*10;
      const x=cx+Math.cos(a)*rr*1.15,y=cy-6+Math.sin(a)*rr*0.82;
      i?g.lineTo(x,y):g.moveTo(x,y);
    }
    g.stroke();
    for(let i=0;i<5;i++){
      const sx=cx-62+i*30,sy=cy-46+((i*37)%70);
      g.globalAlpha=0.5;g.lineWidth=2;
      g.beginPath();g.moveTo(sx,sy);
      g.bezierCurveTo(sx+10,sy-12,sx+22,sy+10,sx+32,sy-4);
      g.stroke();g.globalAlpha=0.9;
    }
    g.restore();g.globalAlpha=1;
    // firing neuron
    const nx=cx,ny=cy+112;
    drawAtom(g,nx,ny,9,col);
    for(let i=0;i<5;i++){
      const a=Math.PI*1.15+i*Math.PI*0.175;
      strokeSeg(g,nx,ny,nx+Math.cos(a)*30,ny+Math.sin(a)*30,col,0.6,2,true);
    }
    strokeSeg(g,nx+9,ny,nx+70,ny,col,0.8,2.5,true);
    drawAtom(g,nx+78,ny,5,"#ffd166");
  }else if(d.a==="RESPI"){
    strokeSeg(g,cx,cy-124,cx,cy-40,"#cfe4ff",0.8,7,false);
    strokeSeg(g,cx,cy-40,cx-52,cy-6,"#cfe4ff",0.8,5,false);
    strokeSeg(g,cx,cy-40,cx+52,cy-6,"#cfe4ff",0.8,5,false);
    for(const s of[-1,1]){
      g.save();g.fillStyle=col;g.globalAlpha=0.15;
      g.beginPath();g.ellipse(cx+s*72,cy+40,52,86,s*0.16,0,7);g.fill();
      g.strokeStyle=col;g.globalAlpha=0.85;g.lineWidth=3;g.shadowColor=col;g.shadowBlur=10;
      g.beginPath();g.ellipse(cx+s*72,cy+40,52,86,s*0.16,0,7);g.stroke();
      g.restore();g.globalAlpha=1;
      for(let i=0;i<3;i++){
        strokeSeg(g,cx+s*40,cy-10+i*8,cx+s*(70+i*14),cy+30+i*26,col,0.4,1.6,false);
      }
    }
  }else if(d.a==="INFECT"){
    // rod bacterium
    g.save();g.translate(cx-30,cy);g.rotate(-0.25);
    g.strokeStyle=col;g.lineWidth=3.5;g.globalAlpha=0.9;g.shadowColor=col;g.shadowBlur=12;
    g.beginPath();g.ellipse(0,0,86,34,0,0,7);g.stroke();
    g.globalAlpha=0.12;g.fillStyle=col;g.fill();g.globalAlpha=0.9;
    g.restore();g.globalAlpha=1;
    for(let i=0;i<4;i++){
      g.save();g.strokeStyle=col;g.globalAlpha=0.5;g.lineWidth=1.8;
      g.beginPath();g.moveTo(cx-108,cy-10+i*8);
      g.bezierCurveTo(cx-140,cy-30+i*16,cx-150,cy+10+i*10,cx-175,cy-6+i*12);
      g.stroke();g.restore();g.globalAlpha=1;
    }
    // capsule crashing in
    g.save();g.translate(cx+105,cy-62);g.rotate(0.6);
    g.fillStyle="#ffd166";g.globalAlpha=0.95;roundRect(g,-34,-15,34,30,15);g.fill();
    g.fillStyle="#ff8ba0";roundRect(g,0,-15,34,30,15);g.fill();
    g.strokeStyle="rgba(0,0,0,0.35)";g.lineWidth=1.5;g.beginPath();g.moveTo(0,-15);g.lineTo(0,15);g.stroke();
    g.restore();g.globalAlpha=1;
    for(let i=0;i<6;i++){
      const a=R()*7;
      strokeSeg(g,cx+72,cy-42,cx+72+Math.cos(a)*22,cy-42+Math.sin(a)*22,"#ffffff",0.5,1.6,false);
    }
  }else if(d.a==="ONCO"){
    // mitosing cell
    for(const s of[-1,1]){
      g.save();g.fillStyle=col;g.globalAlpha=0.14;
      g.beginPath();g.ellipse(cx+s*34,cy,52,44,0,0,7);g.fill();
      g.strokeStyle=col;g.globalAlpha=0.85;g.lineWidth=3;g.shadowColor=col;g.shadowBlur=10;
      g.beginPath();g.ellipse(cx+s*34,cy,52,44,0,0,7);g.stroke();g.restore();g.globalAlpha=1;
      drawAtom(g,cx+s*34,cy,12,col);
    }
    for(let i=0;i<4;i++){
      const x=cx-20+R()*40,y=cy-30+R()*60;
      g.save();g.strokeStyle="#ffd166";g.globalAlpha=0.7;g.lineWidth=2;
      g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+8,y-10,x-8,y+10,x+4,y+2);g.stroke();g.restore();g.globalAlpha=1;
    }
    // crosshair
    g.save();g.strokeStyle="#ff5470";g.globalAlpha=0.8;g.lineWidth=2;
    g.beginPath();g.arc(cx,cy,86,0,7);g.stroke();
    strokeSeg(g,cx-102,cy,cx-74,cy,"#ff5470",0.8,2,false);
    strokeSeg(g,cx+74,cy,cx+102,cy,"#ff5470",0.8,2,false);
    strokeSeg(g,cx,cy-102,cx,cy-74,"#ff5470",0.8,2,false);
    strokeSeg(g,cx,cy+74,cx,cy+102,"#ff5470",0.8,2,false);
    g.restore();g.globalAlpha=1;
  }else if(d.a==="IMMUNO"){
    // antibody Y
    g.save();g.strokeStyle=col;g.lineCap="round";g.lineWidth=13;g.globalAlpha=0.9;g.shadowColor=col;g.shadowBlur=14;
    g.beginPath();g.moveTo(cx,cy+95);g.lineTo(cx,cy+10);g.stroke();
    g.beginPath();g.moveTo(cx,cy+10);g.lineTo(cx-72,cy-72);g.stroke();
    g.beginPath();g.moveTo(cx,cy+10);g.lineTo(cx+72,cy-72);g.stroke();
    g.restore();g.globalAlpha=1;
    strokeSeg(g,cx-14,cy+34,cx+14,cy+34,col,0.6,3,false);
    for(const[tx,ty]of[[cx-72,cy-72],[cx+72,cy-72]]){
      drawAtom(g,tx,ty-6,9,"#ffd166");
      drawAtom(g,tx-14,ty+6,6,"#ffd166");
      artLabel(g,"Ag",tx-6,ty-22,"#ffd166",0.8);
    }
  }else{ // METAB & everything else: glucose + insulin key
    const pts=[];
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3-Math.PI/6;
      pts.push([cx-30+Math.cos(a)*70,cy-20+Math.sin(a)*70]);
    }
    strokePath(g,pts.concat([pts[0]]),col,0.9,3.5,true);
    for(const[px,py]of pts)drawAtom(g,px,py,7,col);
    for(let i=0;i<6;i+=2){
      const[px,py]=pts[i];
      strokeSeg(g,px,py,px+(px-cx+30)*0.25,py+(py-cy+20)*0.25,col,0.6,2,true);
    }
    g.save();g.translate(cx+110,cy+92);g.rotate(-0.5);
    g.strokeStyle="#ffd166";g.lineWidth=5;g.globalAlpha=0.95;g.shadowColor="#ffd166";g.shadowBlur=10;
    g.beginPath();g.arc(-18,0,12,0,7);g.stroke();
    strokeSeg(g,-6,0,34,0,"#ffd166",0.95,5,true);
    strokeSeg(g,24,0,24,9,"#ffd166",0.95,4,false);
    strokeSeg(g,32,0,32,9,"#ffd166",0.95,4,false);
    g.restore();g.globalAlpha=1;
    artLabel(g,"GLUCOSE · INSULIN",cx-104,cy+118,col,0.5);
  }
}

/* ---- PLATE VI: formulation / dosage form (by route) ---- */
function artForm(g,d,R,col){
  const cx=280,cy=180;
  if(d.rt==="PO"){
    g.save();g.translate(cx-70,cy-30);g.rotate(-0.5);
    g.fillStyle=col;g.globalAlpha=0.95;roundRect(g,-52,-20,52,40,20);g.fill();
    g.fillStyle="#e8f1ff";roundRect(g,0,-20,52,40,20);g.fill();
    g.strokeStyle="rgba(10,16,32,0.5)";g.lineWidth=2;g.beginPath();g.moveTo(0,-20);g.lineTo(0,20);g.stroke();
    g.strokeStyle="rgba(255,255,255,0.6)";g.lineWidth=3;g.beginPath();g.moveTo(-38,-8);g.lineTo(-16,-8);g.stroke();
    g.restore();g.globalAlpha=1;
    g.save();g.translate(cx+85,cy+45);
    g.fillStyle="#e8f1ff";g.globalAlpha=0.95;
    g.beginPath();g.arc(0,0,44,0,7);g.fill();
    g.strokeStyle=col;g.lineWidth=3;g.globalAlpha=0.7;g.beginPath();g.arc(0,0,44,0,7);g.stroke();
    g.globalAlpha=0.5;g.lineWidth=2;g.beginPath();g.moveTo(-30,0);g.lineTo(30,0);g.stroke();
    g.globalAlpha=0.8;g.fillStyle="#0b1120";g.font="700 22px JetBrains Mono,monospace";g.textAlign="center";g.fillText("℞",0,8);
    g.restore();g.textAlign="left";g.globalAlpha=1;
  }else if(d.rt==="IV"||d.rt==="IM"){
    g.save();g.translate(cx-70,cy);
    g.fillStyle="rgba(210,230,255,0.14)";roundRect(g,-34,-70,68,130,10);g.fill();
    g.strokeStyle="#cfe4ff";g.globalAlpha=0.8;g.lineWidth=2.5;roundRect(g,-34,-70,68,130,10);g.stroke();
    g.fillStyle=col;g.globalAlpha=0.55;roundRect(g,-30,-6,60,62,8);g.fill();
    g.fillStyle="#8899bb";g.globalAlpha=0.9;roundRect(g,-26,-84,52,16,4);g.fill();
    g.restore();g.globalAlpha=1;
    g.save();g.translate(cx+80,cy+10);g.rotate(-0.7);
    g.fillStyle="rgba(210,230,255,0.16)";roundRect(g,-20,-70,40,110,8);g.fill();
    g.strokeStyle="#cfe4ff";g.globalAlpha=0.85;g.lineWidth=2.5;roundRect(g,-20,-70,40,110,8);g.stroke();
    g.fillStyle=col;g.globalAlpha=0.6;roundRect(g,-15,-20,30,55,6);g.fill();
    strokeSeg(g,0,40,0,86,"#cfe4ff",0.9,3,false);
    strokeSeg(g,-5,86,5,86,"#cfe4ff",0.9,6,false);
    strokeSeg(g,0,-70,0,-92,"#cfe4ff",0.9,5,false);
    g.restore();g.globalAlpha=1;
  }else if(d.rt==="SC"){
    g.save();g.translate(cx,cy);g.rotate(-0.35);
    g.fillStyle=col;g.globalAlpha=0.85;roundRect(g,-30,-120,60,170,26);g.fill();
    g.fillStyle="#0b1120";g.globalAlpha=0.9;roundRect(g,-30,-120,60,54,26);g.fill();
    g.fillStyle="#e8f1ff";g.globalAlpha=0.9;roundRect(g,-10,-52,20,44,6);g.fill();
    g.fillStyle="#8899bb";g.globalAlpha=0.9;roundRect(g,-30,50,60,26,10);g.fill();
    g.restore();g.globalAlpha=1;
    artLabel(g,"PREFILLED PEN",cx-56,cy+124,col,0.55);
  }else if(d.rt==="INH"){
    g.save();g.translate(cx,cy);
    g.fillStyle=col;g.globalAlpha=0.85;roundRect(g,-34,-96,68,120,14);g.fill();
    g.fillStyle="#0b1120";g.globalAlpha=0.9;roundRect(g,-34,-96,68,30,14);g.fill();
    g.fillStyle="#8899bb";g.globalAlpha=0.9;roundRect(g,-22,24,44,34,8);g.fill();
    g.fillStyle="#e8f1ff";g.globalAlpha=0.9;roundRect(g,-14,58,28,26,6);g.fill();
    g.restore();g.globalAlpha=1;
    for(let i=0;i<5;i++){
      const a=-Math.PI/2+(R()-0.5)*1.2;
      drawAtom(g,cx+Math.cos(a)*(70+R()*40),cy-96+Math.sin(a)*(50+R()*30),3+R()*3,"#cfe4ff");
    }
  }else{ // TD patch, SL, anything else
    g.save();g.translate(cx,cy);
    g.fillStyle="#8899bb";g.globalAlpha=0.5;roundRect(g,-80,-60,160,120,18);g.fill();
    g.fillStyle=col;g.globalAlpha=0.8;roundRect(g,-56,-38,112,76,12);g.fill();
    g.strokeStyle="rgba(255,255,255,0.35)";g.lineWidth=1.2;g.globalAlpha=0.6;
    for(let x=-48;x<=48;x+=16){g.beginPath();g.moveTo(x,-38);g.lineTo(x,38);g.stroke();}
    for(let y=-30;y<=30;y+=15){g.beginPath();g.moveTo(-56,y);g.lineTo(56,y);g.stroke();}
    g.restore();g.globalAlpha=1;
  }
}

/* ---- drawing helpers ---- */
function drawHexShape(g,x,y,r,rot,col,alpha,lw){
  g.save();g.beginPath();
  for(let i=0;i<6;i++){
    const a=rot+i*Math.PI/3;
    const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;
    i?g.lineTo(px,py):g.moveTo(px,py);
  }
  g.closePath();
  g.strokeStyle=col;g.globalAlpha=alpha;g.lineWidth=lw;g.stroke();
  g.restore();g.globalAlpha=1;
}
function strokeSeg(g,x1,y1,x2,y2,col,alpha,lw,glow){
  g.save();
  g.strokeStyle=col;g.globalAlpha=alpha;g.lineWidth=lw;g.lineCap="round";
  if(glow){g.shadowColor=col;g.shadowBlur=12;}
  g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();
  g.restore();g.globalAlpha=1;
}
function strokePath(g,pts,col,alpha,lw,glow){
  g.save();
  g.strokeStyle=col;g.globalAlpha=alpha;g.lineWidth=lw;g.lineJoin="round";
  if(glow){g.shadowColor=col;g.shadowBlur=12;}
  g.beginPath();
  pts.forEach(([px,py],i)=>i?g.lineTo(px,py):g.moveTo(px,py));
  g.stroke();g.restore();g.globalAlpha=1;
}
function dashSeg(g,x1,y1,x2,y2,col,alpha=0.5,lw=1.5){
  g.save();g.setLineDash([5,5]);g.strokeStyle=col;g.globalAlpha=alpha;g.lineWidth=lw;
  g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();
  g.restore();g.globalAlpha=1;
}
function artLabel(g,txt,x,y,col,alpha=0.55){
  g.save();g.font="600 11px JetBrains Mono,monospace";g.fillStyle=col;g.globalAlpha=alpha;
  g.fillText(txt,x,y);g.restore();g.globalAlpha=1;
}
function roundRect(g,x,y,w,h,r){
  g.beginPath();
  g.moveTo(x+r,y);
  g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);
  g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);
  g.closePath();
}
function drawAtom(g,x,y,r,col){
  const grad=g.createRadialGradient(x-r*0.35,y-r*0.35,r*0.15,x,y,r);
  grad.addColorStop(0,"#ffffff");
  grad.addColorStop(0.35,col);
  grad.addColorStop(1,colorMix(col,"#0a1020",0.75));
  g.save();
  g.shadowColor=col;g.shadowBlur=16;
  g.fillStyle=grad;
  g.beginPath();g.arc(x,y,r,0,7);g.fill();
  g.restore();
}
function colorMix(hex,hex2,t){
  const p=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const a=p(hex),b=p(hex2);
  return "#"+a.map((v,i)=>Math.round(v*(1-t)+b[i]*t).toString(16).padStart(2,"0")).join("");
}

/* ---------- derived gameplay text ---------- */
function roleOf(d){
  if(d.tags.includes("cure"))return "Endgame — definitive therapy";
  if(d.tags.includes("rescue"))return "Emergency counter — saves regimens";
  if(d.tags.includes("booster"))return "Force multiplier — play beside its star";
  if(d.eff>=8&&d.saf>=7)return "Cornerstone — reliable flagship";
  if(d.eff>=8&&d.saf<=4)return "Glass cannon — massive effect, real risk";
  if(d.eff<=5&&d.saf>=7)return "Gentle support — low reward, low risk";
  if(d.hl>=100)return "Marathon PK — stays in the system";
  return "Situational tool — context is king";
}

/* ---------- HTML builders ---------- */
function statRailHTML(cls,label,val){
  return `<div class="rail ${cls}"><span class="rl">${label}</span><span class="rt"><i data-w="${val*10}"></i></span><span class="rv">${val}</span></div>`;
}

function cardFrontHTML(d){
  const A=AREAS[d.a];
  return `
  <div class="cf">
    <div class="cf-top">
      <span>${d.y}</span><span style="opacity:.4">·</span><span>${A.label.toUpperCase()}</span>
      <span class="rar-gem"><i></i>${d.r==="LEGEND"?"LEGEND":d.r==="BANNED"?"WITHDRAWN":d.r}</span>
    </div>
    <div>
      <div class="cf-name">${esc(d.n)}</div>
      ${d.b&&d.b!=="—"?`<div class="cf-brand">${esc(d.b)}</div>`:""}
    </div>
    <div class="cf-art"></div>
    <div class="cf-moa"><b>${esc(d.cls)}</b><br>${esc(d.moa)}</div>
    <div class="cf-stats">
      ${statRailHTML("eff","EFF",d.eff)}
      ${statRailHTML("saf","SAF",d.saf)}
    </div>
    <div class="cf-chips">
      <span class="cf-chip">${icon(routeIcon(d.rt))}${d.rt}</span>
      <span class="cf-chip">${icon("i-clock")}${fmtHL(d.hl)}</span>
      <span class="cf-chip">${icon("i-chart")}$${d.mkt}B</span>
    </div>
    <div class="cf-foot"><span class="cls">${esc(d.cls)}</span><span>TI-${hstr(d.id).toString(16).slice(0,4).toUpperCase()}</span></div>
  </div>`;
}

function cardBackHTML(d){
  const ix=interactionsOf(d).slice(0,3);
  const syn=synergyPartnersOf(d).slice(0,3);
  return `
  <div class="cb">
    <div class="cb-head"><span class="k">MONOGRAPH</span><span class="n">${esc(d.n)}</span></div>
    <div class="cb-scroll">
      <div class="cb-sec"><span class="h">Mechanism</span><b>${esc(d.cls)}.</b> ${esc(d.moa)}. Target: ${esc(d.tg)}.</div>
      <div class="cb-sec"><span class="h">Kinetics</span>${fmtRoute(d.rt)} · t½ ${fmtHL(d.hl)} · F ${d.F==null?"(non-oral)":d.F+"%"}${d.cyp?` · CYP${esc(d.cyp)}`:""}</div>
      <div class="cb-sec"><span class="h">Indications</span>${d.inds.map(esc).join(" · ")}</div>
      ${d.alt&&d.alt.length?`<div class="cb-sec"><span class="h">Repurpose path</span>${d.alt.map(esc).join(" · ")}</div>`:""}
      ${ix.length?`<div class="cb-sec"><span class="h">Interactions</span>${ix.map(x=>"⚠ "+esc(x.short)).join("<br>")}</div>`:""}
      ${syn.length?`<div class="cb-sec"><span class="h">Synergy</span>${syn.map(x=>"✚ "+esc(x)).join("<br>")}</div>`:""}
      <div class="cb-sec"><span class="h">Role</span>${roleOf(d)}</div>
      <div class="cb-lore">${esc(d.lore)}</div>
    </div>
  </div>`;
}

/* ---------- interaction/synergy lookup (for backs & planning) ---------- */
function matchesAny(matchers,d){
  return matchers.some(([kind,val])=>kind==="id"?d.id===val:d.tags.includes(val));
}
function interactionsOf(d){
  const out=[];
  for(const ix of INTERACTIONS){
    if(ix.trio)continue;
    if(matchesAny(ix.a,d)){
      const bSide=ix.b;
      const partners=DRUGS.filter(o=>o.id!==d.id&&matchesAny(bSide,o));
      if(partners.length)out.push({short:`${partners[0].cls.split("(")[0].trim()} × ${d.n}: ${ix.msg}`,full:ix.msg});
    }
  }
  // also check reverse direction
  for(const ix of INTERACTIONS){
    if(ix.trio)continue;
    if(matchesAny(ix.b,d)&&!matchesAny(ix.a,d)){
      const partners=DRUGS.filter(o=>o.id!==d.id&&matchesAny(ix.a,o));
      if(partners.length&&!out.some(o=>o.full===ix.msg))out.push({short:`${partners[0].n} × ${d.n}: ${ix.msg}`,full:ix.msg});
    }
  }
  return out;
}
function synergyPartnersOf(d){
  const out=[];
  for(const s of SYNERGIES){
    if(s.skip)continue;
    const inThis=s.need.filter(m=>matchesAny([m],d));
    if(!inThis.length)continue;
    const others=s.need.filter(m=>!matchesAny([m],d));
    if(others.length===0)continue;
    const names=others.map(m=>m[0]==="id"?(DRUG[m[1]]?DRUG[m[1]].n:m[1]):TAGS[m[1]]?TAGS[m[1]].split("—")[0].trim():m[1]);
    out.push(`pairs with ${names.join(" + ")}`);
  }
  return [...new Set(out)];
}

/* ---------- full card element ---------- */
function makeCard(d,opts={}){
  const size=opts.size||"";
  const el=document.createElement("div");
  const isFoil = typeof FoilMastery!=="undefined" && FoilMastery.has(d.id);
  el.className=`card ${size} ${isFoil?"mastery-foil":""}`;
  el.dataset.r=d.r;
  el.style.setProperty("--ac",AREAS[d.a].c);
  el.innerHTML=`
    <div class="cin">
      <div class="face front">${cardFrontHTML(d)}<div class="holo"></div><div class="glare"></div>${opts.flip!==false?`<button class="flip-btn" title="Flip to monograph" aria-label="Flip card">${icon("i-flip")}</button>`:""}</div>
      <div class="face back">${cardBackHTML(d)}<div class="holo"></div><div class="glare"></div>${opts.flip!==false?`<button class="flip-btn" title="Flip to front" aria-label="Flip card">${icon("i-flip")}</button>`:""}</div>
    </div>
    ${d.r==="BANNED"?`<div class="banned-band">WITHDRAWN</div>`:""}`;
  if(opts.flip!==false){
    el.addEventListener("dblclick",()=>{
      el.classList.toggle("flipped");
      if(typeof Discovery!=="undefined")Discovery.mark(d.id);
      SFX.flip();
      if(typeof Haptics!=="undefined")Haptics.light();
    });

    // Mobile thumb double-tap to flip
    let lastTouchTime=0;
    el.addEventListener("touchend",e=>{
      const now=Date.now();
      const diff=now-lastTouchTime;
      if(diff<340&&diff>40){
        e.preventDefault();
        el.classList.toggle("flipped");
        if(typeof Discovery!=="undefined")Discovery.mark(d.id);
        SFX.flip();
        if(typeof Haptics!=="undefined")Haptics.light();
      }
      lastTouchTime=now;
    },{passive:false});

    $$(".flip-btn",el).forEach(fb=>fb.onclick=e=>{
      e.stopPropagation();
      el.classList.toggle("flipped");
      if(typeof Discovery!=="undefined")Discovery.mark(d.id);
      SFX.flip();
      if(typeof Haptics!=="undefined")Haptics.light();
    });
  }
  attachArt(el,d,opts);
  attachTilt(el);
  return el;
}
function attachArt(el,d,opts={}){
  const slot=$(".front .cf-art",el);
  if(!slot||slot.firstChild)return;
  el.dataset.art=el.dataset.art||sigStyleOf(d);

  // Eager render for single inspection cards or if IntersectionObserver is unavailable
  if(opts.eager || typeof IntersectionObserver==="undefined"){
    slot.appendChild(cloneCanvas(artFor(d,el.dataset.art)));
    animateRails(el);
    return;
  }

  // Lazy art observer: draws canvas when card enters or nears (350px) the viewport
  if(!window._cardArtObserver){
    window._cardArtObserver=new IntersectionObserver((entries,obs)=>{
      for(const entry of entries){
        if(entry.isIntersecting){
          const card=entry.target;
          obs.unobserve(card);
          const data=card._drugData;
          const artSlot=$(".front .cf-art",card);
          if(data&&artSlot&&!artSlot.firstChild){
            card.dataset.art=card.dataset.art||sigStyleOf(data);
            artSlot.appendChild(cloneCanvas(artFor(data,card.dataset.art)));
            animateRails(card);
          }
        }
      }
    },{rootMargin:"350px 0px"});
  }

  el._drugData=d;
  window._cardArtObserver.observe(el);
}
function setCardArt(el,d,style){
  el.dataset.art=style;
  const slot=$(".front .cf-art",el);
  if(!slot)return;
  slot.innerHTML="";
  slot.appendChild(cloneCanvas(artFor(d,style)));
  SFX.flip();
}
function cloneCanvas(src){
  const c=document.createElement("canvas");c.width=src.width;c.height=src.height;
  c.getContext("2d").drawImage(src,0,0);return c;
}
function animateRails(scope){
  setTimeout(()=>$$(".rail .rt i",scope).forEach(i=>i.style.width=i.dataset.w+"%"),60);
}

/* ---------- 3D tilt + glare ---------- */
function attachTilt(el){
  if(REDUCED||matchMedia("(hover:none)").matches)return;
  const inner=$(".cin",el);
  el.addEventListener("pointermove",e=>{
    const r=el.getBoundingClientRect();
    const px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
    el.classList.add("tilting");
    inner.style.transform=`rotateX(${((py-0.5)*-13).toFixed(2)}deg) rotateY(${((px-0.5)*15).toFixed(2)}deg)`;
    el.style.setProperty("--gx",(px*100).toFixed(1)+"%");
    el.style.setProperty("--gy",(py*100).toFixed(1)+"%");
  });
  el.addEventListener("pointerleave",()=>{
    el.classList.remove("tilting");
    inner.style.transform="";
  });
  el.addEventListener("pointercancel",()=>{
    el.classList.remove("tilting");
    inner.style.transform="";
  });
}

/* ---------- art-picker styles (injected once) ---------- */
(function artCSS(){
  const st=document.createElement("style");
  st.textContent=`
  .art-picker{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;justify-content:center}
  .art-chip{font:600 10px 'JetBrains Mono',monospace;letter-spacing:.08em;color:var(--mut,#8ea6c8);
    background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:999px;
    padding:5px 11px;cursor:pointer;transition:all .15s}
  .art-chip:hover{color:var(--fg,#e8f1ff);border-color:var(--acc,#4cc9f0)}
  .art-chip.on{color:#0b1120;background:var(--acc,#4cc9f0);border-color:transparent}
  .flip-btn{position:absolute;top:6px;right:6px;z-index:8;width:38px;height:38px;min-width:38px;min-height:38px;border-radius:50%;
    border:1px solid rgba(255,255,255,.24);background:rgba(10,16,32,.78);color:#8ea6c8;
    display:grid;place-items:center;cursor:pointer;padding:0;
    opacity:0;transition:opacity .15s,color .15s,border-color .15s,transform .15s;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
  .flip-btn svg{width:17px;height:17px;flex-shrink:0}
  .card:hover .flip-btn{opacity:1}
  .flip-btn:hover{color:#fff;border-color:var(--ac,#4cc9f0);transform:scale(1.08)}
  @media(hover:none){.flip-btn{opacity:.92!important}}`;
  document.head.appendChild(st);
})();

/* ---------- Gyroscope 3D Holo Foil Tilt for Mobile Devices ---------- */
const GyroTilt = {
  enabled: false,
  listening: false,
  targetX: 0,
  targetY: 0,
  curX: 0,
  curY: 0,
  rafId: null,

  init() {
    if (this.listening || typeof window === "undefined" || REDUCED) return;
    if (!window.DeviceOrientationEvent) return;

    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission()
        .then(state => {
          if (state === "granted") this.bind();
        })
        .catch(() => {});
    } else {
      this.bind();
    }
  },

  bind() {
    if (this.listening) return;
    this.listening = true;
    window.addEventListener("deviceorientation", e => {
      if (e.gamma == null || e.beta == null) return;
      const rawX = Math.max(-1, Math.min(1, e.gamma / 26));
      const rawY = Math.max(-1, Math.min(1, (e.beta - 42) / 26));
      this.targetX = rawX;
      this.targetY = rawY;

      if (!this.enabled) {
        this.enabled = true;
        this.loop();
      }
    }, { passive: true });
  },

  loop() {
    if (!this.enabled) return;
    this.curX += (this.targetX - this.curX) * 0.12;
    this.curY += (this.targetY - this.curY) * 0.12;

    const px = (((this.curX + 1) / 2) * 100).toFixed(1);
    const py = (((this.curY + 1) / 2) * 100).toFixed(1);
    const rotX = (this.curY * -12).toFixed(2);
    const rotY = (this.curX * 14).toFixed(2);

    const targets = document.querySelectorAll(".modal .card, .spot-card-layer.layer-top .card, .card.mastery-foil");
    targets.forEach(card => {
      if (!card.classList.contains("tilting")) {
        const inner = card.querySelector(".cin");
        if (inner) {
          inner.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        }
        card.style.setProperty("--gx", `${px}%`);
        card.style.setProperty("--gy", `${py}%`);
      }
    });

    this.rafId = requestAnimationFrame(() => this.loop());
  }
};

if (typeof window !== "undefined") {
  window.addEventListener("touchstart", () => GyroTilt.init(), { once: true, passive: true });
  window.addEventListener("click", () => GyroTilt.init(), { once: true, passive: true });
}