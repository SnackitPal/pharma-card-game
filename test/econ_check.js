const fs=require("fs");
const s=fs.readFileSync(__dirname+"/../js/data.js","utf8");
const mkts=[...s.matchAll(/mkt:([0-9.]+)/g)].map(x=>+x[1]).sort((a,b)=>b-a);
console.log("top mkt values:",mkts.slice(0,10));
// best-case annualNet: mkt=mkts[0], VALUE tier share26 mult0.7
const top=mkts[0];
console.log("best-case annualNet (VALUE tier):",Math.round(top*70*0.26*0.7),"$M/yr");
console.log("=> valuation contribution x6:",Math.round(top*70*0.26*0.7*6),"$M");
console.log("with 3 repurposes (+35% each):",Math.round(top*70*0.26*0.7*(1+3*0.35)*6),"$M");
console.log("$4B goal needs roughly",(4000/(top*70*0.26*0.7*6)).toFixed(1),"blockbusters at once");
