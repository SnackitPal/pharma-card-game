/* ============================================================
   THERAPEUTIC INDEX — library.js
   The Compendium: filterable grid, spotlight swipe deck,
   deep-inspect dossier modal
   ============================================================ */

"use strict";

const Lib={
  q:"",area:"ALL",rar:"ALL",era:"ALL",sort:"year_desc",mode:"grid",
  built:false,
};

function initLibrary(){
  if(Lib.built)return;
  Lib.built=true;
  renderLibTools();
  renderLibGrid();
  // "/" focuses the search box while in the Compendium
  document.addEventListener("keydown",e=>{
    if(e.key!=="/")return;
    const tag=document.activeElement&&document.activeElement.tagName;
    if(tag==="INPUT"||tag==="SELECT"||tag==="TEXTAREA")return;
    if(!$("#view-library").classList.contains("active"))return;
    const q=$("#lib-q");
    if(q){e.preventDefault();q.focus();}
  });
}

function renderLibTools(){
  const t=$("#lib-tools");
  t.innerHTML=`
    <div class="tool-search">
      ${icon("i-search")}
      <input id="lib-q" placeholder="Search name, class, target, indication…" value="${esc(Lib.q)}">
      <span class="search-kbd" title="Press / to focus search">/</span>
    </div>
    <select class="tool-sel" id="lib-area">
      <option value="ALL">All areas</option>
      ${Object.entries(AREAS).map(([k,v])=>`<option value="${k}" ${Lib.area===k?"selected":""}>${v.label}</option>`).join("")}
    </select>
    <select class="tool-sel" id="lib-rar">
      <option value="ALL">All rarities</option>
      ${Object.entries(RARITY).filter(([k])=>k!=="BANNED").map(([k,v])=>`<option value="${k}" ${Lib.rar===k?"selected":""}>${v.label}</option>`).join("")}
      <option value="BANNED" ${Lib.rar==="BANNED"?"selected":""}>Withdrawn</option>
    </select>
    <select class="tool-sel" id="lib-era">
      <option value="ALL">All eras</option>
      <option value="classic" ${Lib.era==="classic"?"selected":""}>Golden age (≤1970)</option>
      <option value="modern" ${Lib.era==="modern"?"selected":""}>Modern (1971–2000)</option>
      <option value="new" ${Lib.era==="new"?"selected":""}>New millennium (2001+)</option>
    </select>
    <select class="tool-sel" id="lib-sort">
      <option value="year_desc" ${Lib.sort==="year_desc"?"selected":""}>Newest first</option>
      <option value="year_asc" ${Lib.sort==="year_asc"?"selected":""}>Oldest first</option>
      <option value="eff" ${Lib.sort==="eff"?"selected":""}>Efficacy ↓</option>
      <option value="saf" ${Lib.sort==="saf"?"selected":""}>Safety ↓</option>
      <option value="mkt" ${Lib.sort==="mkt"?"selected":""}>Market ↓</option>
      <option value="hl" ${Lib.sort==="hl"?"selected":""}>Half-life ↓</option>
      <option value="name" ${Lib.sort==="name"?"selected":""}>A–Z</option>
    </select>
    <div class="seg">
      <button id="lib-vgrid" class="${Lib.mode==="grid"?"on":""}">${icon("i-grid")} Grid</button>
      <button id="lib-vspot" class="${Lib.mode==="spot"?"on":""}">${icon("i-stack")} Spotlight</button>
      <button id="lib-vcodex" class="${Lib.mode==="codex"?"on":""}">${icon("i-link")} Codex</button>
    </div>`;

  $("#lib-q").addEventListener("input",e=>{Lib.q=e.target.value;renderLibGrid();});
  $("#lib-area").addEventListener("change",e=>{Lib.area=e.target.value;renderLibGrid();});
  $("#lib-rar").addEventListener("change",e=>{Lib.rar=e.target.value;renderLibGrid();});
  $("#lib-era").addEventListener("change",e=>{Lib.era=e.target.value;renderLibGrid();});
  $("#lib-sort").addEventListener("change",e=>{Lib.sort=e.target.value;renderLibGrid();});
  $("#lib-vgrid").onclick=()=>{
    if(Lib.mode==="grid")return;
    Lib.mode="grid";
    $("#lib-vgrid").classList.add("on");
    $("#lib-vspot").classList.remove("on");
    $("#lib-vcodex").classList.remove("on");
    renderLibGrid();
  };
  $("#lib-vspot").onclick=()=>{Lib.mode="spot";openSpotlight(0);};
  $("#lib-vcodex").onclick=()=>{
    if(Lib.mode==="codex")return;
    Lib.mode="codex";
    $("#lib-vgrid").classList.remove("on");
    $("#lib-vspot").classList.remove("on");
    $("#lib-vcodex").classList.add("on");
    renderLibGrid();
  };
}

function libFiltered(){
  let list=DRUGS.slice();
  const q=Lib.q.trim().toLowerCase();
  if(q)list=list.filter(d=>
    d.n.toLowerCase().includes(q)||d.b.toLowerCase().includes(q)||
    d.cls.toLowerCase().includes(q)||d.tg.toLowerCase().includes(q)||
    d.moa.toLowerCase().includes(q)||d.inds.join(" ").toLowerCase().includes(q));
  if(Lib.area!=="ALL")list=list.filter(d=>d.a===Lib.area);
  if(Lib.rar!=="ALL")list=list.filter(d=>d.r===Lib.rar);
  if(Lib.era!=="ALL"){
    if(Lib.era==="classic")list=list.filter(d=>d.y<=1970);
    if(Lib.era==="modern")list=list.filter(d=>d.y>1970&&d.y<=2000);
    if(Lib.era==="new")list=list.filter(d=>d.y>=2001);
  }
  const cmp={
    year_desc:(a,b)=>b.y-a.y, year_asc:(a,b)=>a.y-b.y,
    eff:(a,b)=>b.eff-a.eff, saf:(a,b)=>b.saf-a.saf,
    mkt:(a,b)=>b.mkt-a.mkt, hl:(a,b)=>b.hl-a.hl,
    name:(a,b)=>a.n.localeCompare(b.n),
  }[Lib.sort];
  return list.sort(cmp);
}

function renderLibGrid(){
  if(Lib.mode==="codex"){
    renderCodex();
    return;
  }
  const list=libFiltered();
  const grid=$("#lib-grid");
  const disc = typeof Discovery!=="undefined" ? Discovery.count() : 0;
  $("#lib-count").textContent=`${list.length} OF ${DRUGS.length} FILTERED · DISCOVERED ${disc} / ${DRUGS.length}`;
  $("#lib-empty").hidden=list.length>0;
  grid.innerHTML="";
  const frag=document.createDocumentFragment();
  for(const d of list){
    const card=makeCard(d,{size:""});
    card.onclick=()=>{
      SFX.click();
      if(typeof Discovery!=="undefined")Discovery.mark(d.id);
      openDetail(d);
    };
    frag.appendChild(card);
  }
  grid.appendChild(frag);
}

/* ---------- Interactions & Synergies Codex Engine ---------- */
/* ---------- Interactions & Synergies Codex Engine ---------- */
function formatCodexSynergy(s, idx) {
  const msg = s.msg;
  let title = "Guideline Combination";
  let domain = "CLINICAL PRACTICE";
  let domainCol = "var(--mint)";
  
  if (msg.includes("heart-failure") || msg.includes("DAPT")) {
    domain = "CARDIOLOGY";
    domainCol = "#ff5470";
    title = msg.includes("heart-failure") ? "Four Pillars of Heart Failure (HFrEF)" : "Dual Antiplatelet Therapy (DAPT)";
  } else if (msg.includes("SMART") || msg.includes("salbutamol")) {
    domain = "PULMONOLOGY";
    domainCol = "#35d6e8";
    title = msg.includes("SMART") ? "SMART Single-Inhaler Regimen" : "Controller + Reliever Pairing";
  } else if (msg.includes("levodopa") || msg.includes("Selegiline")) {
    domain = "NEUROLOGY";
    domainCol = "#a78bfa";
    title = msg.includes("Carbidopa") ? "DOPA Decarboxylase Protection" : "MAO-B Dopamine Extension";
  } else if (msg.includes("TB") || msg.includes("DOTS") || msg.includes("HAART") || msg.includes("Ritonavir") || msg.includes("pylori")) {
    domain = "INFECTIOUS DISEASE";
    domainCol = "#2fd6a5";
    title = msg.includes("DOTS") ? "DOTS Tuberculosis Multi-Drug Therapy" :
            msg.includes("HAART") ? "HAART Triple Antiretroviral Barrier" :
            msg.includes("Ritonavir") ? "Ritonavir Pharmacokinetic Boosting" : "H. pylori Triple Eradication";
  } else if (msg.includes("R-CHOP")) {
    domain = "ONCOLOGY";
    domainCol = "#ee5fc4";
    title = "R-CHOP Curative Lymphoma Protocol";
  } else if (msg.includes("analgesia") || msg.includes("opioid-sparing")) {
    domain = "PAIN MANAGEMENT";
    domainCol = "#ffb020";
    title = "Multimodal Opioid-Sparing Analgesia";
  }

  const partners = s.need.map(([kind, val]) => {
    if (kind === "id") return DRUG[val] ? { type: "drug", drug: DRUG[val] } : { type: "raw", name: val };
    const matching = DRUGS.filter(d => d.tags.includes(val));
    return {
      type: "tag",
      tag: val,
      label: TAGS[val] ? TAGS[val].split("—")[0].trim() : val,
      matchingDrugs: matching
    };
  });

  return {
    type: "syn",
    id: "syn_" + idx,
    title,
    domain,
    domainCol,
    badge: s.bonus ? `+${s.bonus}.0 PTS` : (s.boost ? `×${s.boost.mult} BOOST` : "+5.0 PTS"),
    desc: msg,
    partners
  };
}

function formatCodexInteraction(ix, idx) {
  const msg = ix.msg;
  let title = "Drug-Drug Interaction";
  let domain = "CONTRAINDICATION";
  let domainCol = "var(--rose)";

  if (msg.includes("CYP3A4") || msg.includes("CYP2D6") || msg.includes("induction")) {
    domain = "CYP450 METABOLISM";
    domainCol = "#ffb020";
    title = msg.includes("simvastatin") ? "CYP3A4 Statin Myopathy Cascade" :
            msg.includes("atorvastatin") ? "CYP3A4 Atorvastatin Accumulation" :
            msg.includes("terfenadine") || msg.includes("Seldane") ? "Fatal Seldane Arrhythmia Trap" :
            msg.includes("induction") ? "Enzyme Induction Clearance Failure" :
            msg.includes("2D6") ? "CYP2D6 Prodrug Activation Failure" : "Strong CYP3A4 Substrate Blockade";
  } else if (msg.includes("hypotension") || msg.includes("PDE5") || msg.includes("Nitrate")) {
    domain = "CRITICAL CARDIOLOGY";
    domainCol = "#ff5470";
    title = "Nitrate + PDE5 Hemodynamic Collapse";
  } else if (msg.includes("digoxin") || msg.includes("Digoxin") || msg.includes("amiodarone")) {
    domain = "CARDIOLOGY";
    domainCol = "#ff5470";
    title = msg.includes("amiodarone") ? "Amiodarone-Digoxin Heart Block" : "Hypokalemia Digoxin Toxicity";
  } else if (msg.includes("lithium") || msg.includes("Lithium")) {
    domain = "NEPHROLOGY & PSYCH";
    domainCol = "#a78bfa";
    title = msg.includes("NSAID") ? "NSAID Lithium Clearance Inhibition" :
            msg.includes("Thiazide") ? "Thiazide Lithium Retention" : "RAAS Lithium Excretion Block";
  } else if (msg.includes("Warfarin") || msg.includes("warfarin") || msg.includes("DOAC") || msg.includes("bleeding")) {
    domain = "HEMOSTASIS & HEMATOLOGY";
    domainCol = "#ff5470";
    title = msg.includes("TMP-SMX") ? "TMP-SMX Warfarin INR Surge" :
            msg.includes("antiplatelet") ? "Combined Hemostasis Sabotage" :
            msg.includes("DOAC") ? "DOAC-NSAID Mucosal Bleed Risk" : "Warfarin-NSAID Ulcer Bleeding";
  } else if (msg.includes("methotrexate") || msg.includes("Methotrexate") || msg.includes("azathioprine") || msg.includes("Allopurinol")) {
    domain = "ONCOLOGY & IMMUNOLOGY";
    domainCol = "#ee5fc4";
    title = msg.includes("azathioprine") ? "Allopurinol-Azathioprine Myelosuppression" :
            msg.includes("TMP-SMX") ? "Double Antifolate Pancytopenia" : "NSAID Methotrexate Clearance Failure";
  } else if (msg.includes("serotonin") || msg.includes("Serotonin")) {
    domain = "NEUROLOGY & PSYCH";
    domainCol = "#a78bfa";
    title = msg.includes("MAOI") ? "MAOI-Serotonergic Autonomic Storm" :
            msg.includes("Linezolid") ? "Linezolid MAOI Serotonin Syndrome" :
            msg.includes("tramadol") ? "SSRI-Tramadol Serotonin & Seizure Risk" : "SSRI-Triptan Serotonin Excess";
  } else if (msg.includes("respiratory depression") || msg.includes("benzodiazepine")) {
    domain = "CRITICAL CARE";
    domainCol = "#ff5470";
    title = "Opioid + Benzo Fatal Apnea (Boxed Warning)";
  } else if (msg.includes("triple whammy") || msg.includes("Triple whammy")) {
    domain = "RENAL MEDICINE";
    domainCol = "#35d6e8";
    title = "The 'Triple Whammy' Acute Kidney Injury";
  } else if (msg.includes("hyperkalemia") || msg.includes("spironolactone")) {
    domain = "ELECTROLYTES & RENAL";
    domainCol = "#ffb020";
    title = msg.includes("TMP-SMX") ? "TMP-SMX Amiloride-Like Hyperkalemia" : "RAAS-Spironolactone Potassium Surge";
  } else if (msg.includes("theophylline") || msg.includes("Theophylline")) {
    domain = "PULMONOLOGY";
    domainCol = "#35d6e8";
    title = msg.includes("Ciprofloxacin") ? "Ciprofloxacin Theophylline Neurotoxicity" : "Clarithromycin Theophylline Overdose";
  } else if (msg.includes("vancomycin") || msg.includes("Gentamicin")) {
    domain = "INFECTIOUS & RENAL";
    domainCol = "#2fd6a5";
    title = "Aminoglycoside-Vancomycin Nephrotoxicity";
  } else if (msg.includes("hepatotoxic") || msg.includes("Hepatotoxins")) {
    domain = "HEPATOLOGY";
    domainCol = "#ffb020";
    title = "Stacked Hepatotoxicity Liver Burden";
  } else if (msg.includes("QT") || msg.includes("torsades")) {
    domain = "ELECTROPHYSIOLOGY";
    domainCol = "#ff5470";
    title = "Cumulative QTc Prolongation Arrhythmia";
  } else if (msg.includes("anticholinergic") || msg.includes("Anticholinergic")) {
    domain = "GERIATRICS";
    domainCol = "#a78bfa";
    title = "Double Anticholinergic Delirium Burden";
  } else if (msg.includes("peptic ulcer") || msg.includes("Steroid")) {
    domain = "GASTROENTEROLOGY";
    domainCol = "#b8e34d";
    title = "Steroid + NSAID Peptic Ulcer Perforation";
  } else if (msg.includes("phenytoin") || msg.includes("Phenytoin")) {
    domain = "NEUROLOGY";
    domainCol = "#a78bfa";
    title = "Valproate Phenytoin Protein Displacement";
  }

  const aPartners = ix.a.map(([kind, val]) => {
    if (kind === "id") return DRUG[val] ? { type: "drug", drug: DRUG[val] } : { type: "raw", name: val };
    return { type: "tag", tag: val, label: TAGS[val] ? TAGS[val].split("—")[0].trim() : val, matchingDrugs: DRUGS.filter(d => d.tags.includes(val)) };
  });
  const bPartners = ix.b.map(([kind, val]) => {
    if (kind === "id") return DRUG[val] ? { type: "drug", drug: DRUG[val] } : { type: "raw", name: val };
    return { type: "tag", tag: val, label: TAGS[val] ? TAGS[val].split("—")[0].trim() : val, matchingDrugs: DRUGS.filter(d => d.tags.includes(val)) };
  });
  const b2Partners = ix.b2 ? ix.b2.map(([kind, val]) => {
    if (kind === "id") return DRUG[val] ? { type: "drug", drug: DRUG[val] } : { type: "raw", name: val };
    return { type: "tag", tag: val, label: TAGS[val] ? TAGS[val].split("—")[0].trim() : val, matchingDrugs: DRUGS.filter(d => d.tags.includes(val)) };
  }) : [];

  return {
    type: "ix",
    id: "ix_" + idx,
    title,
    domain,
    domainCol,
    badge: `−${ix.dmg}.0 DMG`,
    desc: msg,
    trio: ix.trio,
    aPartners,
    bPartners,
    b2Partners
  };
}

function renderCodex(){
  const grid=$("#lib-grid");
  const q=Lib.q.trim().toLowerCase();
  Lib.codexTab=Lib.codexTab||"all";

  const synList=SYNERGIES.filter(s=>!s.skip).map((s,idx)=>formatCodexSynergy(s,idx));
  const ixList=INTERACTIONS.map((ix,idx)=>formatCodexInteraction(ix,idx));

  let filteredSyn=synList;
  let filteredIx=ixList;
  if(q){
    filteredSyn=synList.filter(s=>
      s.title.toLowerCase().includes(q)||
      s.domain.toLowerCase().includes(q)||
      s.desc.toLowerCase().includes(q)||
      s.partners.some(p=>(p.drug&&p.drug.n.toLowerCase().includes(q))||(p.label&&p.label.toLowerCase().includes(q))||(p.matchingDrugs&&p.matchingDrugs.some(d=>d.n.toLowerCase().includes(q))))
    );
    filteredIx=ixList.filter(ix=>
      ix.title.toLowerCase().includes(q)||
      ix.domain.toLowerCase().includes(q)||
      ix.desc.toLowerCase().includes(q)||
      ix.aPartners.some(p=>(p.drug&&p.drug.n.toLowerCase().includes(q))||(p.label&&p.label.toLowerCase().includes(q))||(p.matchingDrugs&&p.matchingDrugs.some(d=>d.n.toLowerCase().includes(q))))||
      ix.bPartners.some(p=>(p.drug&&p.drug.n.toLowerCase().includes(q))||(p.label&&p.label.toLowerCase().includes(q))||(p.matchingDrugs&&p.matchingDrugs.some(d=>d.n.toLowerCase().includes(q))))
    );
  }

  const totalVisible=(Lib.codexTab==="syn"?filteredSyn.length:Lib.codexTab==="ix"?filteredIx.length:(filteredSyn.length+filteredIx.length));
  $("#lib-count").textContent=`${filteredSyn.length} GUIDELINE SYNERGIES · ${filteredIx.length} INTERACTION TRAPS`;
  $("#lib-empty").hidden=totalVisible>0;
  grid.innerHTML="";

  const container=document.createElement("div");
  container.className="codex-wrap";

  const tabStrip=document.createElement("div");
  tabStrip.className="codex-tabs";
  tabStrip.innerHTML=`
    <button class="codex-tab ${Lib.codexTab==="all"?"on":""}" data-tab="all">${icon("i-atom")} All Combinations (${filteredSyn.length+filteredIx.length})</button>
    <button class="codex-tab syn ${Lib.codexTab==="syn"?"on":""}" data-tab="syn">${icon("i-link")} Guideline Synergies (${filteredSyn.length})</button>
    <button class="codex-tab ix ${Lib.codexTab==="ix"?"on":""}" data-tab="ix">${icon("i-alert")} Dangerous DDIs (${filteredIx.length})</button>
  `;
  tabStrip.querySelectorAll(".codex-tab").forEach(btn=>{
    btn.onclick=()=>{
      Lib.codexTab=btn.dataset.tab;
      renderCodex();
    };
  });
  container.appendChild(tabStrip);

  const itemsGrid=document.createElement("div");
  itemsGrid.className="codex-grid";

  // Synergies Cards
  if(Lib.codexTab==="all"||Lib.codexTab==="syn"){
    filteredSyn.forEach(s=>{
      const card=document.createElement("div");
      card.className="codex-card syn";
      
      let formulaHTML="";
      s.partners.forEach((p,pIdx)=>{
        if(pIdx>0)formulaHTML+=`<span class="codex-op plus">+</span>`;
        if(p.type==="drug"){
          const col=AREAS[p.drug.a]?.c||"var(--mint)";
          formulaHTML+=`<button class="codex-chip" style="--ac:${col}" data-id="${p.drug.id}" title="Click to view ${esc(p.drug.n)} monograph"><span class="chip-dot"></span><b>${esc(p.drug.n)}</b></button>`;
        }else if(p.type==="tag"){
          formulaHTML+=`<span class="codex-chip tag" title="Includes: ${p.matchingDrugs.map(d=>d.n).join(", ")}"><span class="chip-dot"></span><b>${esc(p.label)}</b> <span class="tag-count">(${p.matchingDrugs.length})</span></span>`;
        }else{
          formulaHTML+=`<span class="codex-chip tag"><b>${esc(p.name)}</b></span>`;
        }
      });

      card.innerHTML=`
        <div class="codex-top">
          <span class="codex-domain" style="--domain-col:${s.domainCol}">${icon("i-spark")} ${esc(s.domain)}</span>
          <span class="codex-badge syn">${icon("i-link")} ${esc(s.badge)}</span>
        </div>
        <h4 class="codex-title">${esc(s.title)}</h4>
        <p class="codex-desc">${esc(s.desc)}</p>
        <div class="codex-formula">
          ${formulaHTML}
        </div>
      `;

      card.querySelectorAll(".codex-chip[data-id]").forEach(btn=>{
        btn.onclick=e=>{
          e.stopPropagation();
          const d=DRUG[btn.dataset.id];
          if(d){
            SFX.click();
            if(typeof Discovery!=="undefined")Discovery.mark(d.id);
            openDetail(d);
          }
        };
      });

      itemsGrid.appendChild(card);
    });
  }

  // Interactions Cards
  if(Lib.codexTab==="all"||Lib.codexTab==="ix"){
    filteredIx.forEach(ix=>{
      const card=document.createElement("div");
      card.className="codex-card ix";

      let aHTML=ix.aPartners.map(p=>{
        if(p.type==="drug"){
          const col=AREAS[p.drug.a]?.c||"var(--rose)";
          return `<button class="codex-chip" style="--ac:${col}" data-id="${p.drug.id}" title="Click to view ${esc(p.drug.n)} monograph"><span class="chip-dot"></span><b>${esc(p.drug.n)}</b></button>`;
        }
        return `<span class="codex-chip tag" title="Includes: ${p.matchingDrugs.map(d=>d.n).join(", ")}"><span class="chip-dot"></span><b>${esc(p.label)}</b></span>`;
      }).join("");

      let bHTML=ix.bPartners.map(p=>{
        if(p.type==="drug"){
          const col=AREAS[p.drug.a]?.c||"var(--rose)";
          return `<button class="codex-chip" style="--ac:${col}" data-id="${p.drug.id}" title="Click to view ${esc(p.drug.n)} monograph"><span class="chip-dot"></span><b>${esc(p.drug.n)}</b></button>`;
        }
        return `<span class="codex-chip tag" title="Includes: ${p.matchingDrugs.map(d=>d.n).join(", ")}"><span class="chip-dot"></span><b>${esc(p.label)}</b></span>`;
      }).join("");

      let b2HTML=ix.b2Partners.map(p=>{
        if(p.type==="drug"){
          const col=AREAS[p.drug.a]?.c||"var(--rose)";
          return `<button class="codex-chip" style="--ac:${col}" data-id="${p.drug.id}" title="Click to view ${esc(p.drug.n)} monograph"><span class="chip-dot"></span><b>${esc(p.drug.n)}</b></button>`;
        }
        return `<span class="codex-chip tag" title="Includes: ${p.matchingDrugs.map(d=>d.n).join(", ")}"><span class="chip-dot"></span><b>${esc(p.label)}</b></span>`;
      }).join("");

      card.innerHTML=`
        <div class="codex-top">
          <span class="codex-domain" style="--domain-col:${ix.domainCol}">${icon("i-alert")} ${esc(ix.domain)}</span>
          <span class="codex-badge ix">${icon("i-skull")} ${esc(ix.badge)}</span>
        </div>
        <h4 class="codex-title">${esc(ix.title)}</h4>
        <p class="codex-desc">${esc(ix.desc)}</p>
        <div class="codex-formula">
          ${aHTML} <span class="codex-op flash">⚡</span> ${bHTML} ${b2HTML?`<span class="codex-op flash">⚡</span> ${b2HTML}`:""}
        </div>
      `;

      card.querySelectorAll(".codex-chip[data-id]").forEach(btn=>{
        btn.onclick=e=>{
          e.stopPropagation();
          const d=DRUG[btn.dataset.id];
          if(d){
            SFX.click();
            if(typeof Discovery!=="undefined")Discovery.mark(d.id);
            openDetail(d);
          }
        };
      });

      itemsGrid.appendChild(card);
    });
  }

  container.appendChild(itemsGrid);
  grid.appendChild(container);
}

/* ---------- spotlight swipe mode ---------- */
/* ---------- 3D Stacked Deck Spotlight Swipe Engine (Flawless Single-Pass Queue) ---------- */
let spotIdx=0,spotCleanup=null;

function openSpotlight(idx){
  const list=libFiltered();
  if(!list.length)return;
  spotIdx=((idx%list.length)+list.length)%list.length;

  const back=document.createElement("div");
  back.className="spot-back";
  back.innerHTML=`
    <button class="spot-close-btn" id="spot-close" aria-label="Close spotlight">${icon("i-x")} Close</button>
    <div class="spot-count mono" id="spot-count"></div>
    <div class="spot-stage" id="spot-stage"></div>
    <div class="spot-meta">
      <div class="nm" id="spot-nm"></div>
      <div class="sub" id="spot-sub"></div>
    </div>
    <div class="spot-nav">
      <button class="btn btn-sm" id="spot-prev">${icon("i-al")} Prev</button>
      <button class="btn btn-sm btn-primary" id="spot-details">${icon("i-eye")} Details</button>
      <button class="btn btn-sm" id="spot-next">Next ${icon("i-ar")}</button>
    </div>
    <div class="spot-hint">SWIPE / DRAG DECK · TAP TO FLIP · ← → ARROWS · ESC TO CLOSE</div>`;
  document.body.appendChild(back);

  const stage=$("#spot-stage",back);

  const POS_TOP = "translate3d(0, 0, 0) scale(1) rotate(0deg)";
  const POS_NEXT = "translate3d(0, 10px, -28px) scale(0.93) rotate(2deg)";
  const POS_THIRD = "translate3d(0, 20px, -56px) scale(0.86) rotate(-1.5deg)";
  const POS_FLY_LEFT = "translate3d(-125%, -20px, 0) scale(0.92) rotate(-26deg)";

  function makeLayer(d, pos, opacity, zIndex, pointerEvents){
    const wrap = document.createElement("div");
    wrap.className = "spot-card-layer";
    wrap.style.transform = pos;
    wrap.style.opacity = String(opacity);
    wrap.style.zIndex = String(zIndex);
    wrap.style.pointerEvents = pointerEvents ? "auto" : "none";
    const card = makeCard(d, {size: "big", flip: false});
    card.classList.add("spotlight");
    wrap.appendChild(card);
    return wrap;
  }

  let lTop = null, lNext = null, lThird = null;

  function initDeck(){
    stage.innerHTML = "";
    const len = list.length;
    const dTop = list[spotIdx];
    const dNext = list[(spotIdx + 1) % len];
    const dThird = list[(spotIdx + 2) % len];

    if(len > 2){
      lThird = makeLayer(dThird, POS_THIRD, 0.55, 6, false);
      stage.appendChild(lThird);
    } else { lThird = null; }

    if(len > 1){
      lNext = makeLayer(dNext, POS_NEXT, 0.85, 8, false);
      stage.appendChild(lNext);
    } else { lNext = null; }

    lTop = makeLayer(dTop, POS_TOP, 1, 10, true);
    stage.appendChild(lTop);

    updateMeta();
  }

  function updateMeta(){
    const dTop = list[spotIdx];
    if(typeof Discovery!=="undefined") Discovery.mark(dTop.id);
    $("#spot-count",back).textContent = `${spotIdx + 1} / ${list.length}`;
    $("#spot-nm",back).textContent = dTop.n;
    $("#spot-sub",back).textContent = `${AREAS[dTop.a].label} · ${dTop.cls} · ${dTop.y}`;
  }

  initDeck();

  let isAnimating = false;

  const moveNext = () => {
    if(isAnimating || list.length <= 1) return;
    isAnimating = true;
    SFX.whoosh();
    if(typeof Haptics!=="undefined") Haptics.light();

    const oldTop = lTop;
    const oldNext = lNext;
    const oldThird = lThird;

    oldTop.style.transition = "transform .22s cubic-bezier(.2,.9,.3,1), opacity .20s";
    oldTop.style.transform = POS_FLY_LEFT;
    oldTop.style.opacity = "0";
    oldTop.style.pointerEvents = "none";

    if(oldNext){
      oldNext.style.transition = "transform .22s cubic-bezier(.2,.9,.3,1), opacity .22s";
      oldNext.style.transform = POS_TOP;
      oldNext.style.opacity = "1";
      oldNext.style.zIndex = "10";
      oldNext.style.pointerEvents = "auto";
    }

    if(oldThird){
      oldThird.style.transition = "transform .22s cubic-bezier(.2,.9,.3,1), opacity .22s";
      oldThird.style.transform = POS_NEXT;
      oldThird.style.opacity = "0.85";
      oldThird.style.zIndex = "8";
    }

    setTimeout(()=>{
      oldTop.remove();
      spotIdx = (spotIdx + 1) % list.length;
      lTop = oldNext;
      lNext = oldThird;

      if(list.length > 2){
        const dThird = list[(spotIdx + 2) % list.length];
        lThird = makeLayer(dThird, POS_THIRD, 0, 6, false);
        stage.prepend(lThird);
        requestAnimationFrame(()=>{
          lThird.style.transition = "opacity .18s";
          lThird.style.opacity = "0.55";
        });
      } else {
        lThird = null;
      }

      updateMeta();
      isAnimating = false;
    }, 220);
  };

  const movePrev = () => {
    if(isAnimating || list.length <= 1) return;
    isAnimating = true;
    SFX.whoosh();
    if(typeof Haptics!=="undefined") Haptics.light();

    const oldTop = lTop;
    const oldNext = lNext;
    const oldThird = lThird;

    const prevIdx = (spotIdx - 1 + list.length) % list.length;
    const dPrev = list[prevIdx];
    const newTop = makeLayer(dPrev, POS_FLY_LEFT, 0, 12, false);
    stage.appendChild(newTop);

    requestAnimationFrame(()=>{
      newTop.style.transition = "transform .22s cubic-bezier(.2,.9,.3,1), opacity .22s";
      newTop.style.transform = POS_TOP;
      newTop.style.opacity = "1";
      newTop.style.pointerEvents = "auto";

      oldTop.style.transition = "transform .22s cubic-bezier(.2,.9,.3,1), opacity .22s";
      oldTop.style.transform = POS_NEXT;
      oldTop.style.opacity = "0.85";
      oldTop.style.zIndex = "8";
      oldTop.style.pointerEvents = "none";

      if(oldNext){
        oldNext.style.transition = "transform .22s cubic-bezier(.2,.9,.3,1), opacity .22s";
        oldNext.style.transform = POS_THIRD;
        oldNext.style.opacity = "0.55";
        oldNext.style.zIndex = "6";
      }

      if(oldThird){
        oldThird.style.transition = "opacity .18s";
        oldThird.style.opacity = "0";
      }
    });

    setTimeout(()=>{
      if(oldThird) oldThird.remove();
      spotIdx = prevIdx;
      lThird = oldNext;
      lNext = oldTop;
      lTop = newTop;

      updateMeta();
      isAnimating = false;
    }, 220);
  };

  $("#spot-prev",back).onclick=()=>movePrev();
  $("#spot-next",back).onclick=()=>moveNext();
  $("#spot-details",back).onclick=()=>openDetail(libFiltered()[spotIdx]);
  $("#spot-close",back).onclick=()=>closeSpot();

  // Drag / Touch gesture
  let isDragging = false, sx = null, sy = null, dx = 0, dy = 0;
  let dragPrevEl = null;

  const onStart = e => {
    if(isAnimating) return;
    isDragging = true;
    sx = e.clientX; sy = e.clientY; dx = 0; dy = 0;
    try{ stage.setPointerCapture(e.pointerId); }catch(_){}
    stage.classList.add("dragging");
  };

  const onMove = e => {
    if(!isDragging || sx == null || isAnimating) return;
    dx = e.clientX - sx;
    dy = e.clientY - sy;

    if(dx < 0){
      if(dragPrevEl){ dragPrevEl.remove(); dragPrevEl = null; }

      const p = Math.min(1, Math.abs(dx) / 160);
      lTop.style.transition = "none";
      lTop.style.transform = `translate3d(${dx}px, ${dy * 0.3}px, 0) rotate(${dx * 0.075}deg)`;

      if(lNext){
        lNext.style.transition = "none";
        lNext.style.transform = `translate3d(0, ${10 - 10*p}px, ${-28 + 28*p}px) scale(${0.93 + 0.07*p}) rotate(${2 - 2*p}deg)`;
        lNext.style.opacity = `${0.85 + 0.15*p}`;
      }
      if(lThird){
        lThird.style.transition = "none";
        lThird.style.transform = `translate3d(0, ${20 - 10*p}px, ${-56 + 28*p}px) scale(${0.86 + 0.07*p}) rotate(${-1.5 + 3.5*p}deg)`;
        lThird.style.opacity = `${0.55 + 0.30*p}`;
      }
    } else {
      if(!dragPrevEl && list.length > 1){
        const prevIdx = (spotIdx - 1 + list.length) % list.length;
        dragPrevEl = makeLayer(list[prevIdx], POS_FLY_LEFT, 0, 12, false);
        stage.appendChild(dragPrevEl);
      }

      const p = Math.min(1, dx / 160);
      if(dragPrevEl){
        dragPrevEl.style.transition = "none";
        dragPrevEl.style.transform = `translate3d(${-380 + 380*p}px, ${dy * 0.3}px, 0) scale(${0.94 + 0.06*p}) rotate(${-22 + 22*p}deg)`;
        dragPrevEl.style.opacity = `${p}`;
      }

      lTop.style.transition = "none";
      lTop.style.transform = `translate3d(0, ${10*p}px, ${-28*p}px) scale(${1 - 0.07*p}) rotate(${2*p}deg)`;
      lTop.style.opacity = `${1 - 0.15*p}`;

      if(lNext){
        lNext.style.transition = "none";
        lNext.style.transform = `translate3d(0, ${10 + 10*p}px, ${-28 - 28*p}px) scale(${0.93 - 0.07*p}) rotate(${2 - 3.5*p}deg)`;
        lNext.style.opacity = `${0.85 - 0.30*p}`;
      }
    }
  };

  const onEnd = e => {
    if(!isDragging) return;
    isDragging = false;
    stage.classList.remove("dragging");
    try{ if(e && e.pointerId != null) stage.releasePointerCapture(e.pointerId); }catch(_){}

    const dist = Math.abs(dx);
    if(dist > 60){
      if(dx < 0){
        if(dragPrevEl){ dragPrevEl.remove(); dragPrevEl = null; }
        moveNext();
      } else {
        if(dragPrevEl){ dragPrevEl.remove(); dragPrevEl = null; }
        movePrev();
      }
    } else {
      lTop.style.transition = "transform .22s cubic-bezier(.2,1.2,.3,1), opacity .22s";
      lTop.style.transform = POS_TOP;
      lTop.style.opacity = "1";

      if(lNext){
        lNext.style.transition = "transform .22s cubic-bezier(.2,1.2,.3,1), opacity .22s";
        lNext.style.transform = POS_NEXT;
        lNext.style.opacity = "0.85";
      }
      if(lThird){
        lThird.style.transition = "transform .22s cubic-bezier(.2,1.2,.3,1), opacity .22s";
        lThird.style.transform = POS_THIRD;
        lThird.style.opacity = "0.55";
      }
      if(dragPrevEl){
        dragPrevEl.style.transition = "transform .2s, opacity .2s";
        dragPrevEl.style.transform = POS_FLY_LEFT;
        dragPrevEl.style.opacity = "0";
        const tmp = dragPrevEl;
        setTimeout(()=>tmp?.remove(), 200);
        dragPrevEl = null;
      }

      if(dist < 8 && Math.abs(dy) < 8){
        const card = lTop.querySelector(".card");
        if(card){
          card.classList.toggle("flipped");
          SFX.flip();
          if(typeof Haptics!=="undefined") Haptics.light();
        }
      }
    }
    sx = null; sy = null; dx = 0; dy = 0;
  };

  stage.addEventListener("pointerdown", onStart);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerup", onEnd);
  stage.addEventListener("pointercancel", onEnd);

  const keys = e => {
    if(e.key === "ArrowLeft") movePrev();
    else if(e.key === "ArrowRight") moveNext();
    else if(e.key === "Escape") closeSpot();
  };
  document.addEventListener("keydown", keys);

  function closeSpot(){
    document.removeEventListener("keydown", keys);
    spotCleanup = null;
    if(back && back.parentNode) back.remove();
    if(Lib.mode === "spot"){
      Lib.mode = "grid";
      const gBtn = $("#lib-vgrid"), sBtn = $("#lib-vspot");
      if(gBtn && sBtn){ gBtn.classList.add("on"); sBtn.classList.remove("on"); }
    }
  }
  spotCleanup = closeSpot;
  back.addEventListener("click", e => { if(e.target === back) closeSpot(); });
}

/* ---------- detail dossier modal ---------- */
function openDetail(d){
  if(typeof Discovery!=="undefined")Discovery.mark(d.id);
  const A=AREAS[d.a];
  const ix=interactionsOf(d);
  const syn=synergyPartnersOf(d);
  const tagList=d.tags.map(t=>`<span class="cb-tag" title="${esc(TAGS[t]||"")}">${esc(t)}</span>`).join("");
  const isFoil = typeof FoilMastery!=="undefined" && FoilMastery.has(d.id);

  const tabs={
    pharm:`
      <div class="kv">
        <span class="k">Class</span><span><b>${esc(d.cls)}</b></span>
        <span class="k">Mechanism</span><span>${esc(d.moa)}</span>
        <span class="k">Target(s)</span><span>${esc(d.tg)}</span>
        <span class="k">Route</span><span>${fmtRoute(d.rt)} (${d.rt})</span>
        <span class="k">Bioavailability</span><span>${d.F==null?"n/a — non-oral":d.F+"%"}</span>
        <span class="k">Half-life</span><span>${fmtHL(d.hl)}</span>
        <span class="k">Metabolism</span><span>${d.cyp?"CYP"+esc(d.cyp)+" plays a major role":"Not CYP-dominated"}</span>
        <span class="k">Approved</span><span>${d.y}</span>
      </div>`,
    play:`
      <div class="row" style="flex-wrap:wrap;gap:8px">
        <span class="role-badge" style="--ac:${A.c}">${icon("i-spark")}${roleOf(d)}</span>
        ${isFoil?`<span class="badge-foil">${icon("i-star")} HOLO FOIL MASTERED</span>`:""}
      </div>
      <div class="kv">
        <span class="k">Efficacy</span><span><b>${d.eff}/10</b> — potency & clinical effect size</span>
        <span class="k">Safety</span><span><b>${d.saf}/10</b> — tolerability & therapeutic index</span>
        <span class="k">Market gravity</span><span>$${d.mkt}B ≈ peak annual sales</span>
        <span class="k">Complexity</span><span>${d.syn}/10 — manufacturing difficulty</span>
        <span class="k">PK character</span><span>t½ ${fmtHL(d.hl)}${d.hl>=100?" — effects persist across rounds":""}</span>
      </div>
      ${ix.length?`<div><b>Known interactions:</b><div class="ix-list">${ix.map(x=>`<div class="ix-it">${icon("i-alert")}<span>${esc(x.full)}</span></div>`).join("")}</div></div>`:""}
      ${syn.length?`<div><b>Synergy partners:</b><div class="ix-list">${syn.map(x=>`<div class="ix-it syn">${icon("i-link")}<span>${esc(x)}</span></div>`).join("")}</div></div>`:""}
      ${tagList?`<div><b>Clinical flags:</b><div class="cb-tags" style="margin-top:6px">${tagList}</div></div>`:""}`,
    lore:`
      <div class="det-quote">${esc(d.lore)}</div>
      <div class="kv" style="margin-top:12px">
        <span class="k">Indications</span><span>${d.inds.map(esc).join(" · ")}</span>
        ${d.alt&&d.alt.length?`<span class="k">Repurpose paths</span><span>${d.alt.map(esc).join(" · ")}</span>`:""}
        <span class="k">Rarity</span><span>${RARITY[d.r]?RARITY[d.r].label:d.r}${d.r==="LEGEND"?" — transformative, history-making":d.r==="BANNED"?" — removed from the playable pool":""}</span>
      </div>`,
  };

  const back=Modal.open({
    wide:true,
    html:`
    <div class="det-wrap">
      <div class="det-card-col">
        <div id="det-card-slot"></div>
        <div class="det-flip-hint">${icon("i-flip")} DOUBLE-CLICK CARD or use FLIP button to flip</div>
        <div class="art-picker" id="art-picker"></div>
      </div>
      <div class="det-info">
        <div class="m-kicker" style="color:${A.c}">${A.label.toUpperCase()} · ${d.y}</div>
        <h3>${esc(d.n)} ${isFoil?`<span class="foil-star" title="Holo Foil Mastered">⭐</span>`:""}</h3>
        <div class="brand">${esc(d.b)} · ${esc(d.cls)}</div>
        <div class="det-tabs" style="--dt:${A.c}">
          <button class="det-tab on" data-tab="pharm">Pharmacology</button>
          <button class="det-tab" data-tab="play">Gameplay</button>
          <button class="det-tab" data-tab="lore">Story</button>
        </div>
        <div class="det-pane" id="det-pane"></div>
      </div>
    </div>`,
    actions:[],
  });

  const slot=$("#det-card-slot",back);
  const card=makeCard(d,{size:"big"});
  card.classList.add("det-card");
  slot.appendChild(card);

  // art plate switcher — view the molecule through 6 scientific lenses
  const picker=$("#art-picker",back);
  ART_STYLES.forEach(s=>{
    const b=document.createElement("button");
    b.className="art-chip"+(s.id===sigStyleOf(d)?" on":"");
    b.style.setProperty("--acc",A.c);
    b.textContent=s.label;
    b.title="Art plate: "+s.label;
    b.onclick=()=>{
      $$(".art-chip",picker).forEach(x=>x.classList.remove("on"));
      b.classList.add("on");
      setCardArt(card,d,s.id);
    };
    picker.appendChild(b);
  });

  const pane=$("#det-pane",back);
  const showTab=k=>{
    pane.innerHTML=tabs[k];
    pane.style.setProperty("--ac",A.c);
    $$(".det-tab",back).forEach(b=>b.classList.toggle("on",b.dataset.tab===k));
  };
  $$(".det-tab",back).forEach(b=>b.onclick=()=>{SFX.click();showTab(b.dataset.tab);});
  showTab("pharm");
}