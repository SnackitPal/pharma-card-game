/* ============================================================
   THERAPEUTIC INDEX — audio.js
   Tiny procedural sound engine (WebAudio, no assets)
   ============================================================ */

"use strict";

const SFX={
  ctx:null,gain:null,muted:false,

  ensure(){
    if(this.ctx)return true;
    try{
      this.ctx=new (window.AudioContext||window.webkitAudioContext)();
      this.gain=this.ctx.createGain();
      this.gain.gain.value=this.muted?0:0.5;
      this.gain.connect(this.ctx.destination);
    }catch(e){return false;}
    return true;
  },
  unlock(){if(this.ensure()&&this.ctx.state==="suspended")this.ctx.resume();},
  setMuted(m){
    this.muted=m;
    if(this.gain)this.gain.gain.value=m?0:0.5;
  },
  blip(freq,dur,type="sine",vol=0.2,slide=0){
    if(!this.ensure()||this.muted)return;
    const t=this.ctx.currentTime;
    const o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),t+dur);
    g.gain.setValueAtTime(vol,t);
    g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.connect(g);g.connect(this.gain);
    o.start(t);o.stop(t+dur+0.02);
  },
  noise(dur=0.1,vol=0.12,freq=1200){
    if(!this.ensure()||this.muted)return;
    const t=this.ctx.currentTime,len=Math.floor(this.ctx.sampleRate*dur);
    const buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
    const src=this.ctx.createBufferSource();src.buffer=buf;
    const f=this.ctx.createBiquadFilter();f.type="bandpass";f.frequency.value=freq;
    const g=this.ctx.createGain();g.gain.value=vol;
    src.connect(f);f.connect(g);g.connect(this.gain);
    src.start(t);
  },
  seq(notes,step=0.09,type="sine",vol=0.16){
    notes.forEach((n,i)=>setTimeout(()=>this.blip(n,0.22,type,vol),i*step*1000));
  },
  click(){this.blip(680,0.05,"square",0.08);},
  tick(){this.blip(880,0.03,"sine",0.06);},
  flip(){this.noise(0.07,0.1,2400);this.blip(320,0.06,"triangle",0.1);},
  good(){this.seq([392,494,587,784]);},
  discover(){this.seq([523,659,784,1047],0.08,"sine",0.18);},
  bad(){this.blip(140,0.35,"sawtooth",0.16,-70);setTimeout(()=>this.blip(110,0.3,"sawtooth",0.12,-50),120);},
  cash(){this.seq([1046,1568],0.06,"square",0.1);},
  stamp(){this.blip(75,0.14,"triangle",0.3,-30);this.noise(0.05,0.1,300);},
  whoosh(){this.noise(0.18,0.08,900);},
  ecgBeep(high=false){this.blip(high?960:820,0.038,"sine",0.09);},
  ecgFlatline(){this.blip(440,1.2,"sine",0.14);},
  shock(){
    this.blip(60,0.25,"sawtooth",0.3,-20);
    this.noise(0.2,0.22,400);
    setTimeout(()=>this.blip(180,0.15,"triangle",0.15),150);
  },
  alarm(){this.seq([880,0,880,0,880],0.08,"square",0.09);},
};
document.addEventListener("pointerdown",()=>SFX.unlock(),{capture:true});