/* ============================================================
   THERAPEUTIC INDEX — bg.js
   Ambient molecular lattice background (canvas)
   ============================================================ */

"use strict";

(function initBG(){
  const cv=$("#bg");if(!cv)return;
  const g=cv.getContext("2d");
  let W,H,parts=[],mouse={x:-999,y:-999};
  let visible=true,frame=0;

  function resize(){W=cv.width=innerWidth;H=cv.height=innerHeight;}
  resize();
  addEventListener("resize",resize);
  addEventListener("pointermove",e=>{mouse.x=e.clientX;mouse.y=e.clientY;});

  const N=Math.min(64,Math.max(28,Math.floor(innerWidth/26)));
  for(let i=0;i<N;i++){
    parts.push({
      x:Math.random()*innerWidth,y:Math.random()*innerHeight,
      vx:(Math.random()-0.5)*0.22,vy:(Math.random()-0.5)*0.22,
      r:1+Math.random()*2.2,hex:Math.random()<0.18,hr:6+Math.random()*14,
      rot:Math.random()*Math.PI,vr:(Math.random()-0.5)*0.004,
    });
  }

  document.addEventListener("visibilitychange",()=>{
    visible=!document.hidden;
    if(visible&&!REDUCED)requestAnimationFrame(loop);
  });

  function drawHex(x,y,r,rot,alpha){
    g.beginPath();
    for(let i=0;i<6;i++){
      const a=rot+i*Math.PI/3;
      const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;
      i?g.lineTo(px,py):g.moveTo(px,py);
    }
    g.closePath();
    g.strokeStyle=`rgba(90,130,200,${alpha})`;
    g.lineWidth=1;g.stroke();
  }

  function loop(){
    if(!visible||REDUCED)return;
    // When a modal is open, pause canvas drawing to prevent GPU buffer collisions on mobile
    if(typeof Modal !== "undefined" && Modal.stack && Modal.stack.length > 0){
      setTimeout(() => requestAnimationFrame(loop), 250);
      return;
    }
    frame++;
    g.clearRect(0,0,W,H);

    for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++){
      const a=parts[i],b=parts[j];
      const dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy;
      if(d2<16900){
        g.strokeStyle=`rgba(70,110,180,${0.10*(1-d2/16900)})`;
        g.lineWidth=1;
        g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();
      }
    }
    for(const p of parts){
      const dx=p.x-mouse.x,dy=p.y-mouse.y,d2=dx*dx+dy*dy;
      if(d2<25600){
        g.strokeStyle=`rgba(120,180,255,${0.16*(1-d2/25600)})`;
        g.beginPath();g.moveTo(p.x,p.y);g.lineTo(mouse.x,mouse.y);g.stroke();
      }
    }
    for(const p of parts){
      p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;
      if(p.x<-20)p.x=W+20;if(p.x>W+20)p.x=-20;
      if(p.y<-20)p.y=H+20;if(p.y>H+20)p.y=-20;
      if(p.hex&&frame%2===0){drawHex(p.x,p.y,p.hr,p.rot,0.10);}
      else{
        g.beginPath();g.arc(p.x,p.y,p.r,0,7);
        g.fillStyle="rgba(110,150,215,0.32)";
        g.fill();
      }
    }
    requestAnimationFrame(loop);
  }
  if(!REDUCED)requestAnimationFrame(loop);
})();