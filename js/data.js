/* ============================================================
   THERAPEUTIC INDEX — data.js
   The molecule universe: areas, tags, 133 real drugs,
   synergies, interactions, clinical cases, decks, events.
   Gameplay stats are derived from real pharmacology:
   eff = efficacy/potency · saf = safety/tolerability
   mkt ≈ peak annual sales $B · syn = manufacturing complexity
   hl = half-life hours · F = oral bioavailability %
   ============================================================ */

"use strict";

const AREAS = {
  CARDIO:{label:"Cardiovascular", c:"#ff5470", icon:"i-heart"},
  METAB :{label:"Metabolic",       c:"#ffb020", icon:"i-drop"},
  NEURO :{label:"Neuroscience",    c:"#a78bfa", icon:"i-brain"},
  INFECT:{label:"Anti-Infective",  c:"#2fd6a5", icon:"i-bug"},
  ONCO  :{label:"Oncology",        c:"#ee5fc4", icon:"i-target"},
  IMMUNO:{label:"Immunology",      c:"#4da3ff", icon:"i-shield"},
  RESPI :{label:"Respiratory",     c:"#35d6e8", icon:"i-lung"},
  GI    :{label:"Gastroenterology",c:"#b8e34d", icon:"i-gut"},
};

const RARITY = {
  COMMON:{label:"Common",  w:2},
  RARE  :{label:"Rare",    w:3},
  EPIC  :{label:"Epic",    w:2},
  LEGEND:{label:"Legendary",w:1},
  BANNED:{label:"Withdrawn",w:0},
};

const TAGS = {
  nsaid:"NSAID — prostaglandin inhibition",
  antiplatelet:"Antiplatelet effect",
  anticoag:"Anticoagulant — bleeding risk",
  gi:"GI irritation / ulcer risk",
  nephrotoxic:"Nephrotoxic potential",
  hepatotoxic:"Hepatotoxic potential",
  qt:"Prolongs QT interval",
  serotonergic:"Serotonergic activity",
  ssri:"SSRI antidepressant",
  maoi:"Monoamine oxidase inhibitor",
  tca:"Tricyclic structure",
  anticholinergic:"Anticholinergic burden",
  sedating:"CNS sedation",
  dependence:"Dependence / withdrawal liability",
  cyp3a4inh:"Strong CYP3A4 inhibitor",
  cyp3a4_inh:"Strong CYP3A4 inhibitor — blocks substrate clearance",
  cyp3a4_sub:"Major CYP3A4 substrate — vulnerable to accumulation",
  cyp2d6_inh:"Strong CYP2D6 inhibitor",
  cyp2d6_sub:"CYP2D6 substrate / prodrug",
  cyp_ind:"Potent hepatic enzyme inducer",
  renal_clear:"Exclusively renally cleared — accumulates in low eGFR",
  statin3a4:"Statin with clinically relevant CYP3A4 metabolism",
  teratogen:"Teratogen — avoid in pregnancy",
  betablocker:"Beta-adrenergic blockade",
  acei:"ACE inhibitor — bradykinin mediated effects",
  arb:"Angiotensin receptor blocker",
  mra:"Mineralocorticoid receptor antagonist",
  sglt2:"SGLT2 inhibitor",
  diuretic:"Diuretic — electrolyte effects",
  hypoglycemia:"Hypoglycemia risk",
  opioid:"Opioid receptor agonist",
  benzo:"Benzodiazepine",
  antibiotic:"Antibacterial",
  tb:"Anti-tuberculosis regimen component",
  art:"Antiretroviral",
  antifungal:"Antifungal",
  steroid:"Corticosteroid",
  immunosupp:"Immunosuppressant",
  biologic:"Biologic — protein therapeutic",
  infusion:"Infusion reactions possible",
  photosens:"Photosensitivity",
  disulfiram:"Disulfiram-like alcohol reaction",
  ototoxic:"Ototoxic potential",
  myelosup:"Myelosuppression",
  cardiotox:"Cumulative cardiotoxicity",
  eps:"Extrapyramidal symptoms",
  booster:"Pharmacokinetic / physiologic booster",
  rescue:"Emergency reversal agent",
  cure:"Definitive curative therapy",
  pgx:"Pharmacogenomic testing recommended",
  resistance:"Resistance develops with use",
};

/* ------------------------------------------------------------
   THE DRUGS
   ------------------------------------------------------------ */
const DRUGS = [
// ===== CARDIOVASCULAR =====
{id:"asp",n:"Aspirin",b:"Bayer Aspirin",y:1899,a:"CARDIO",cls:"NSAID / antiplatelet",moa:"Irreversibly acetylates COX-1/2, blocking prostaglandins & thromboxane",tg:"COX-1, COX-2",rt:"PO",hl:0.3,F:68,eff:6,saf:5,mkt:1,syn:2,r:"EPIC",inds:["pain","fever","MI & stroke prevention"],alt:["Colorectal cancer chemoprevention"],cyp:"",tags:["nsaid","antiplatelet","gi"],lore:"From willow bark to Bayer, 1899. Vane's mechanism won the 1982 Nobel — and a pediatric virus + aspirin can trigger Reye syndrome."},
{id:"warf",n:"Warfarin",b:"Coumadin",y:1954,a:"CARDIO",cls:"Vitamin K antagonist",moa:"Blocks vitamin K epoxide reductase, depleting active clotting factors II, VII, IX, X",tg:"VKORC1",rt:"PO",hl:36,F:95,eff:9,saf:3,mkt:0.6,syn:3,r:"EPIC",inds:["AF stroke prevention","DVT/PE treatment","Mechanical valves"],alt:[],cyp:"2C9",tags:["anticoag","pgx"],lore:"Born as rat poison after cattle bled on sweet clover; named for the Wisconsin Alumni Research Foundation. Eisenhower's 1955 heart attack made it famous."},
{id:"dig",n:"Digoxin",b:"Lanoxin",y:1785,a:"CARDIO",cls:"Cardiac glycoside",moa:"Inhibits Na⁺/K⁺-ATPase — positive inotrope and vagal rate control",tg:"Na⁺/K⁺-ATPase",rt:"PO",hl:40,F:70,eff:7,saf:3,mkt:0.1,syn:6,r:"RARE",inds:["Heart failure","Atrial fibrillation rate control"],alt:[],cyp:"",tags:["narrow_ti","renal_clear","qt"],lore:"William Withering's 1785 foxglove monograph is arguably pharmacology's birth certificate. Narrow index: nausea, yellow vision, arrhythmia."},
{id:"gtn",n:"Nitroglycerin",b:"Nitrostat",y:1879,a:"CARDIO",cls:"Nitrate vasodilator",moa:"NO donor — activates guanylyl cyclase, dilating veins and coronaries",tg:"soluble guanylyl cyclase",rt:"SL",hl:0.05,F:null,eff:8,saf:6,mkt:0.3,syn:2,r:"RARE",inds:["Acute angina","Hypertensive emergency"],alt:[],cyp:"",tags:[],lore:"Alfred Nobel — who built dynamite on nitroglycerin — was prescribed it for angina and noted the irony himself. Munitions workers got 'Monday disease' headaches."},
{id:"prop",n:"Propranolol",b:"Inderal",y:1964,a:"CARDIO",cls:"Beta-blocker (prototype)",moa:"Non-selective β₁/β₂ adrenergic receptor antagonism",tg:"β₁, β₂ receptors",rt:"PO",hl:4,F:25,eff:7,saf:7,mkt:0.4,syn:3,r:"EPIC",inds:["Angina","Hypertension","Migraine prophylaxis","Essential tremor"],alt:["Performance anxiety (off-label)"],cyp:"2D6",tags:["betablocker"],lore:"Sir James Black designed it at ICI by asking what angina patients needed, not what chemistry allowed — the 1988 Nobel followed. He then invented cimetidine too."},
{id:"capt",n:"Captopril",b:"Capoten",y:1981,a:"CARDIO",cls:"ACE inhibitor (first)",moa:"Inhibits angiotensin-converting enzyme; bradykinin potentiation causes cough",tg:"ACE",rt:"PO",hl:2,F:70,eff:8,saf:6,mkt:0.1,syn:6,r:"EPIC",inds:["Hypertension","Heart failure","Diabetic nephropathy"],alt:[],cyp:"",tags:["acei"],lore:"Designed from the snake venom peptide teprotide (Bothrops jararaca) — the first drug rationally engineered from a molecular structure. The dry cough is pure bradykinin."},
{id:"lisin",n:"Lisinopril",b:"Zestril / Prinivil",y:1987,a:"CARDIO",cls:"ACE inhibitor",moa:"ACE inhibition — lowers angiotensin II, spares potassium, protects kidneys",tg:"ACE",rt:"PO",hl:12,F:25,eff:8,saf:7,mkt:1.2,syn:4,r:"COMMON",inds:["Hypertension","Heart failure","Post-MI"],alt:[],cyp:"",tags:["acei"],lore:"Among the most prescribed drugs on Earth. Renally cleared, once daily, and the quiet backbone of half the world's hypertension care."},
{id:"losartan",n:"Losartan",b:"Cozaar",y:1995,a:"CARDIO",cls:"ARB (first)",moa:"Selective AT₁ angiotensin receptor blockade — ACE cough avoided",tg:"AT₁ receptor",rt:"PO",hl:2,F:33,eff:8,saf:8,mkt:1.5,syn:5,r:"RARE",inds:["Hypertension","Diabetic nephropathy","Stroke risk in AF (historic)"],alt:[],cyp:"2C9",tags:["arb"],lore:"The first sartan — built from an imidazole scaffold after screening failed elegantly. DuPont Merck's bet opened a decade of '-artans'."},
{id:"amlod",n:"Amlodipine",b:"Norvasc",y:1990,a:"CARDIO",cls:"Dihydropyridine CCB",moa:"L-type calcium channel blockade → arterial vasodilation, no reflex tachycardia",tg:"Caᵥ1.2 channels",rt:"PO",hl:40,F:64,eff:8,saf:8,mkt:2.5,syn:5,r:"RARE",inds:["Hypertension","Chronic stable angina"],alt:[],cyp:"3A4",tags:[],lore:"A 40-hour half-life makes missed doses almost irrelevant — Pfizer's generic-era volume king. Ankle edema is its one party trick."},
{id:"furos",n:"Furosemide",b:"Lasix",y:1964,a:"CARDIO",cls:"Loop diuretic",moa:"Blocks NKCC2 in the thick ascending limb — profound saline diuresis",tg:"NKCC2 cotransporter",rt:"PO",hl:2,F:60,eff:8,saf:6,mkt:0.5,syn:4,r:"RARE",inds:["Edema of heart failure","Pulmonary edema"],alt:[],cyp:"",tags:["diuretic","ototoxic"],lore:"Named for 'Lasts six hours'. Push it too fast IV and the inner ear pays — ototoxicity. Its hypokalemia quietly sets up digoxin toxicity."},
{id:"hctz",n:"Hydrochlorothiazide",b:"Microzide",y:1959,a:"CARDIO",cls:"Thiazide diuretic",moa:"Inhibits NCC in the distal tubule; modest diuresis, durable BP reduction",tg:"NCC cotransporter",rt:"PO",hl:9,F:70,eff:6,saf:6,mkt:0.6,syn:3,r:"COMMON",inds:["Hypertension","Kidney stones (citrate effect)"],alt:[],cyp:"",tags:["diuretic"],lore:"The 1960s VA trials made 'essential hypertension' treatable at all. Elderly women beware: hyponatremia is its stealth signature."},
{id:"spiro",n:"Spironolactone",b:"Aldactone",y:1959,a:"CARDIO",cls:"Aldosterone antagonist (MRA)",moa:"Blocks mineralocorticoid receptors — potassium sparing, anti-fibrotic",tg:"MR receptor",rt:"PO",hl:20,F:80,eff:7,saf:6,mkt:0.9,syn:6,r:"RARE",inds:["Heart failure","Resistant hypertension","Hyperaldosteronism"],alt:["Hormonal acne (anti-androgen)"],cyp:"",tags:["mra"],lore:"RALES (1999) showed a 30% mortality drop and rewrote heart failure. Anti-androgen side effects found a second life in dermatology clinics."},
{id:"entresto",n:"Sacubitril/Valsartan",b:"Entresto",y:2015,a:"CARDIO",cls:"ARNI",moa:"Neprilysin inhibition boosts natriuretic peptides + ARB blockade, in one co-crystal",tg:"neprilysin + AT₁",rt:"PO",hl:10,F:60,eff:9,saf:7,mkt:5,syn:7,r:"EPIC",inds:["Chronic heart failure (HFrEF)"],alt:[],cyp:"",tags:["arb"],lore:"LCZ696 is literally two drugs crystallised together — a supramolecular patent as much as a pharmacologic one. PARADIGM-HF stopped early for overwhelming benefit."},
{id:"atorva",n:"Atorvastatin",b:"Lipitor",y:1997,a:"CARDIO",cls:"Statin",moa:"HMG-CoA reductase inhibition — hepatic LDL receptor upregulation",tg:"HMG-CoA reductase",rt:"PO",hl:14,F:14,eff:9,saf:7,mkt:13,syn:7,r:"LEGEND",inds:["Hypercholesterolemia","ASCVD prevention"],alt:[],cyp:"3A4",tags:["statin3a4","cyp3a4_sub"],lore:"The best-selling small molecule ever: >$160B lifetime. Bioavailability is only ~14% — but that first-pass extraction into the liver IS the therapy."},
{id:"simva",n:"Simvastatin",b:"Zocor",y:1991,a:"CARDIO",cls:"Statin (prodrug)",moa:"Lactone prodrug hydrolysed to active β-hydroxy acid; CYP3A4 handles clearance",tg:"HMG-CoA reductase",rt:"PO",hl:3,F:5,eff:8,saf:6,mkt:4,syn:6,r:"RARE",inds:["Hypercholesterolemia","Post-MI survival (4S trial)"],alt:[],cyp:"3A4",tags:["statin3a4","cyp3a4_sub"],lore:"The Scandinavian 4S trial proved statins save lives, not just lab numbers. Its total CYP3A4 dependence makes it the classic interaction casualty."},
{id:"rosuva",n:"Rosuvastatin",b:"Crestor",y:2003,a:"CARDIO",cls:"Statin (most potent)",moa:"Highest-affinity HMG-CoA reductase inhibitor — LDL drops up to ~60%",tg:"HMG-CoA reductase",rt:"PO",hl:19,F:20,eff:9,saf:7,mkt:5,syn:7,r:"RARE",inds:["Severe hyperlipidemia","JUPITER primary prevention"],alt:[],cyp:"2C9",tags:[],lore:"Discovered in Japan (Shionogi), licensed by AstraZeneca when its own pipeline stalled. JUPITER even dragged inflammation (CRP) into cardiology."},
{id:"clopi",n:"Clopidogrel",b:"Plavix",y:1997,a:"CARDIO",cls:"P2Y12 inhibitor",moa:"Prodrug; active metabolite irreversibly blocks platelet ADP receptors",tg:"P2Y12 receptor",rt:"PO",hl:6,F:50,eff:8,saf:7,mkt:9,syn:5,r:"RARE",inds:["ACS (with aspirin)","Stent thrombosis prevention","Ischemic stroke"],alt:[],cyp:"2C19",tags:["antiplatelet","pgx"],lore:"A prodrug whose activation depends on CYP2C19 — poor metabolisers get a placebo with bleeding risk. Pharmacogenomics' poster child before PGx was cool."},
{id:"apixa",n:"Apixaban",b:"Eliquis",y:2012,a:"CARDIO",cls:"Factor Xa inhibitor (DOAC)",moa:"Direct, reversible factor Xa inhibition — no routine monitoring needed",tg:"Factor Xa",rt:"PO",hl:12,F:50,eff:9,saf:7,mkt:12,syn:7,r:"EPIC",inds:["AF stroke prevention","DVT/PE"],alt:[],cyp:"3A4",tags:["anticoag"],lore:"ARISTOTLE beat warfarin on both strokes AND bleeding — the rematch warfarin finally lost. Reversal agent andexanet alfa costs more than a year of the drug."},
{id:"amio",n:"Amiodarone",b:"Cordarone",y:1985,a:"CARDIO",cls:"Class III antiarrhythmic",moa:"Multi-channel blockade (K⁺ mainly) with β and Ca properties; iodine-rich molecule",tg:"IKr, IKs channels",rt:"PO",hl:1300,F:40,eff:8,saf:2,mkt:0.4,syn:3,r:"EPIC",inds:["VT/VF suppression","AF maintenance of sinus rhythm"],alt:[],cyp:"3A4",tags:["qt","hepatotoxic","thyroid","cyp3a4_inh"],lore:"Half-life measured in MONTHS — stop it today, still dosing your patient next quarter. Inspired by khellin from Ammi visnaga; thyroid, lungs, liver and skin all pay rent."},
{id:"silde",n:"Sildenafil",b:"Viagra / Revatio",y:1998,a:"CARDIO",cls:"PDE5 inhibitor",moa:"PDE5 inhibition → cGMP accumulation → smooth muscle relaxation",tg:"PDE5",rt:"PO",hl:4,F:40,eff:9,saf:7,mkt:3,syn:6,r:"EPIC",inds:["Erectile dysfunction","Pulmonary arterial hypertension"],alt:["Altitude sickness? (explored)"],cyp:"3A4",tags:[],lore:"Failed as an angina drug; Devonport, UK trials reported an inconvenient 'side effect' in 1992. The 1998 NO-signaling Nobel landed the same year as approval."},
{id:"tadala",n:"Tadalafil",b:"Cialis",y:2003,a:"CARDIO",cls:"PDE5 inhibitor",moa:"PDE5 inhibition with a 36-hour window — 'the weekender'",tg:"PDE5",rt:"PO",hl:17.5,F:40,eff:9,saf:8,mkt:2,syn:7,r:"RARE",inds:["ED","BPH","PAH"],alt:[],cyp:"3A4",tags:[],lore:"Its 17.5-hour half-life turned a pharmacy transaction into a lifestyle decision. Also approved for prostate symptoms — same vessel logic, different plumbing."},
{id:"minox",n:"Minoxidil",b:"Loniten / Rogaine",y:1979,a:"CARDIO",cls:"K⁺ channel opener",moa:"Opens ATP-sensitive K⁺ channels → potent arteriolar vasodilation",tg:"K(ATP) channels",rt:"PO",hl:4,F:90,eff:7,saf:5,mkt:0.5,syn:4,r:"RARE",inds:["Severe refractory hypertension"],alt:["Androgenic alopecia (topical)"],cyp:"",tags:[],lore:"Upjohn's oral vasodilator caused dramatic hypertrichosis in trial patients. Rather than hide the adverse event, they shipped it as Rogaine — repurposing folklore in action."},
{id:"terf",n:"Terfenadine",b:"Seldane",y:1985,a:"IMMUNO",cls:"Second-gen antihistamine (WITHDRAWN)",moa:"Peripheral H₁ blockade — until CYP3A4 inhibition floods the heart with parent drug",tg:"H₁ receptor / hERG",rt:"PO",hl:20,F:70,eff:6,saf:2,mkt:0,syn:4,r:"BANNED",inds:["Allergic rhinitis (historical)"],alt:[],cyp:"3A4",tags:["qt"],lore:"The first non-drowsy antihistamine — until ketoconazole co-prescription triggered fatal torsades. Withdrawn 1997; its safer metabolite survives as fexofenadine."},

// ===== METABOLIC =====
{id:"metf",n:"Metformin",b:"Glucophage",y:1957,a:"METAB",cls:"Biguanide",moa:"AMPK activation & reduced hepatic gluconeogenesis; euglycemic by design",tg:"AMPK / mitochondrial G3PDH",rt:"PO",hl:6,F:55,eff:8,saf:8,mkt:1.2,syn:2,r:"LEGEND",inds:["Type 2 diabetes (first-line)","PCOS"],alt:["Prediabetes","Longevity research"],cyp:"",tags:["renal_clear"],lore:"Synthesised in 1922 from goat's rue (Galega officinalis), ignored for 30 years, then Jean Sterne named it Glucophage — 'glucose eater'. Still undefeated."},
{id:"insulin",n:"Insulin (human)",b:"Humulin",y:1922,a:"METAB",cls:"Peptide hormone",moa:"Receptor tyrosine kinase activation → GLUT4 translocation, glucose uptake",tg:"INS receptor",rt:"SC",hl:5,F:0,eff:10,saf:6,mkt:20,syn:7,r:"LEGEND",inds:["Type 1 diabetes","Advanced T2DM","DKA/HHS"],alt:[],cyp:"",tags:["hypoglycemia","biologic"],lore:"Banting, Best, Collip & Macleod, Toronto 1921 — Leonard Thompson, age 14, was first injected Jan 1922. Banting shared his Nobel money with Best out of protest."},
{id:"sema",n:"Semaglutide",b:"Ozempic / Wegovy",y:2017,a:"METAB",cls:"GLP-1 receptor agonist",moa:"Long-acting GLP-1 mimic: glucose-dependent insulin release, satiety, slowed gastric emptying",tg:"GLP-1R",rt:"SC",hl:168,F:1,eff:9,saf:7,mkt:18,syn:8,r:"LEGEND",inds:["Type 2 diabetes","Obesity","CV risk reduction"],alt:["NAFLD/NASH","Alcohol craving (trials)"],cyp:"",tags:["biologic"],lore:"Albumin-bound for a ONE WEEK half-life. The oral version achieves ~1% bioavailability using an absorption enhancer — a formulation moonshot. Shortages became geopolitics."},
{id:"empa",n:"Empagliflozin",b:"Jardiance",y:2014,a:"METAB",cls:"SGLT2 inhibitor",moa:"Blocks renal glucose reabsorption; cardiorenal benefits beyond glucose",tg:"SGLT2",rt:"PO",hl:12,F:40,eff:8,saf:7,mkt:7,syn:6,r:"EPIC",inds:["T2DM","Heart failure (any EF)","CKD"],alt:[],cyp:"",tags:["sglt2"],lore:"EMPA-REG stunned everyone: a diabetes pill cut cardiovascular death 38%. Genital mycotic infections are the price; ketoacidosis with normal glucose is the riddle."},
{id:"levo",n:"Levothyroxine",b:"Synthroid",y:1955,a:"METAB",cls:"Thyroid hormone (T4)",moa:"Prohormone converted peripherally to T3; nuclear receptor transcription control",tg:"TRα/TRβ receptors",rt:"PO",hl:168,F:80,eff:9,saf:6,mkt:2,syn:5,r:"EPIC",inds:["Hypothyroidism","Myxedema coma","Thyroid cancer suppression"],alt:[],cyp:"",tags:[],lore:"America's most prescribed drug for years. Take it fasting, alone, 60 minutes before coffee — or measure nothing meaningful. A 7-day half-life forgives, but barely."},
{id:"glipi",n:"Glipizide",b:"Glucotrol",y:1984,a:"METAB",cls:"Sulfonylurea",moa:"Closes pancreatic K(ATP) channels → insulin secretion regardless of glucose",tg:"SUR1 / K(ATP)",rt:"PO",hl:4,F:90,eff:7,saf:4,mkt:0.3,syn:4,r:"COMMON",inds:["Type 2 diabetes"],alt:[],cyp:"2C9",tags:["hypoglycemia"],lore:"Insulin secretion without a glucose sensor means hypoglycemia — especially in elderly kidneys that clear it slowly. Cheap, effective, occasionally terrifying at 3 AM."},
{id:"allo",n:"Allopurinol",b:"Zyloprim",y:1966,a:"METAB",cls:"Xanthine oxidase inhibitor",moa:"Blocks uric acid synthesis; oxypurinol does the work with a 20 h life",tg:"xanthine oxidase",rt:"PO",hl:2,F:85,eff:8,saf:5,mkt:0.4,syn:3,r:"RARE",inds:["Chronic gout","Tumour lysis prophylaxis"],alt:[],cyp:"",tags:["pgx"],lore:"HLA-B*58:01 carriers risk Stevens-Johnson syndrome — one of pharmacogenomics' cleanest wins. And never start it during an acute flare; joints will riot."},
{id:"orli",n:"Orlistat",b:"Xenical / Alli",y:1999,a:"METAB",cls:"Lipase inhibitor",moa:"Covalently blocks gastric/pancreatic lipases — ~30% of fat passes unabsorbed",tg:"pancreatic lipase",rt:"PO",hl:2,F:0,eff:4,saf:6,mkt:0.3,syn:5,r:"COMMON",inds:["Obesity (adjunct)"],alt:[],cyp:"",tags:[],lore:"Almost zero systemic absorption — the mechanism IS the GI tract. Steatorrhea ('treatment effects') made it the honest warning label of weight loss."},
{id:"fina",n:"Finasteride",b:"Proscar / Propecia",y:1992,a:"METAB",cls:"5α-reductase inhibitor",moa:"Blocks testosterone→DHT conversion; type II isoform selectivity",tg:"5α-reductase II",rt:"PO",hl:6,F:63,eff:7,saf:6,mkt:1.2,syn:5,r:"RARE",inds:["BPH","Male-pattern baldness"],alt:["Prostate cancer prevention (PCPT)"],cyp:"3A4",tags:[],lore:"The PCPT trial showed 25% fewer prostate cancers — a prevention first. Sexual side effects remain debated; DHT's role in hair loss made it a cultural artifact."},

// ===== NEUROSCIENCE =====
{id:"fluox",n:"Fluoxetine",b:"Prozac",y:1987,a:"NEURO",cls:"SSRI",moa:"Selective serotonin reuptake inhibition; norfluoxetine lives for weeks",tg:"SERT",rt:"PO",hl:96,F:90,eff:7,saf:7,mkt:1,syn:4,r:"EPIC",inds:["Depression","OCD","Bulimia","PMDD"],alt:[],cyp:"2D6",tags:["ssri","serotonergic","cyp2d6_inh"],lore:"The molecule that made depression discussable at dinner tables. Its metabolite's 1–2 week half-life means stopping cold turkey barely registers — built-in taper."},
{id:"sertra",n:"Sertraline",b:"Zoloft",y:1991,a:"NEURO",cls:"SSRI",moa:"SERT inhibition with mild DAT activity; among the most-studied SSRIs",tg:"SERT",rt:"PO",hl:26,F:44,eff:7,saf:8,mkt:1.5,syn:5,r:"COMMON",inds:["Depression","PTSD","Social anxiety","Panic disorder"],alt:[],cyp:"2D6",tags:["ssri","serotonergic"],lore:"Pfizer's workhorse won the widest indication portfolio in psychiatry. The PONDER trial handed it to GPs worldwide as the default first step."},
{id:"amitrip",n:"Amitriptyline",b:"Elavil",y:1961,a:"NEURO",cls:"Tricyclic antidepressant",moa:"Serotonin+norepinephrine reuptake block with heavy antimuscarinic & H₁ load",tg:"SERT, NET, M receptors",rt:"PO",hl:20,F:48,eff:8,saf:3,mkt:0.3,syn:3,r:"RARE",inds:["Depression","Neuropathic pain","Migraine prophylaxis"],alt:[],cyp:"2D6",tags:["tca","anticholinergic","sedating","serotonergic"],lore:"Ten milligrams helps fibromyalgia; a handful can be lethal — TCAs own the grimmest overdose statistics in psychiatry. Dry mouth, blurry life."},
{id:"lith",n:"Lithium carbonate",b:"Lithobid",y:1949,a:"NEURO",cls:"Mood stabilizer",moa:"Inositol monophosphatase & GSK-3 inhibition — mechanism still partly mysterious",tg:"GSK-3β, IMPase",rt:"PO",hl:24,F:100,eff:9,saf:3,mkt:0.2,syn:1,r:"EPIC",inds:["Bipolar disorder","Suicide-risk reduction","Augmentation in depression"],alt:[],cyp:"",tags:["pgx","narrow_ti","renal_clear"],lore:"John Cade's 1949 guinea-pig urea experiments in an abandoned Melbourne kitchen. A plain salt — the simplest drug on this list — remains psychiatry's best anti-suicide tool."},
{id:"cloza",n:"Clozapine",b:"Clozaril",y:1989,a:"NEURO",cls:"Atypical antipsychotic",moa:"Promiscuous receptor profile; D4 & 5-HT2A bias; uniquely effective where others fail",tg:"D4, 5-HT2A, many",rt:"PO",hl:12,F:50,eff:9,saf:2,mkt:0.5,syn:5,r:"EPIC",inds:["Treatment-resistant schizophrenia","Suicidality in schizophrenia"],alt:[],cyp:"3A4",tags:["eps","myelosup","sedating","qt"],lore:"Withdrawn in 1975 after Finnish agranulocytosis deaths, resurrected in 1989 WITH mandatory blood monitoring — the ancestor of every modern REMS program. Gold standard, guarded like plutonium."},
{id:"arip",n:"Aripiprazole",b:"Abilify",y:2002,a:"NEURO",cls:"Partial dopamine agonist",moa:"D2 partial agonism — a 'dopamine stabilizer'; 5-HT1A partial agonist too",tg:"D2, 5-HT1A",rt:"PO",hl:75,F:87,eff:7,saf:7,mkt:5,syn:7,r:"RARE",inds:["Schizophrenia","Bipolar maintenance","Adjunct for MDD","Tourette's"],alt:[],cyp:"2D6",tags:["eps"],lore:"The first third-generation antipsychotic: agonist when dopamine is low, antagonist when high. Patent lawyers fought over crystal polymorphs as hard as chemists did over synthesis."},
{id:"halo",n:"Haloperidol",b:"Haldol",y:1958,a:"NEURO",cls:"Typical antipsychotic",moa:"Potent D2 antagonism — high EPS liability, QT prolongation IV",tg:"D2 receptor",rt:"PO",hl:20,F:60,eff:8,saf:5,mkt:0.1,syn:4,r:"RARE",inds:["Acute psychosis","Agitation","Tourette's"],alt:[],cyp:"3A4",tags:["eps","qt"],lore:"Paul Janssen's 1958 blockbuster launched an empire. Fifty years of tardive dyskinesia taught psychiatry what potency without finesse costs."},
{id:"levodopa",n:"Levodopa",b:"Sinemet (with carbidopa)",y:1967,a:"NEURO",cls:"Dopamine precursor",moa:"AA transport across BBB → decarboxylated to dopamine in the striatum",tg:"DOPA decarboxylase → DRD2",rt:"PO",hl:1.5,F:30,eff:9,saf:6,mkt:1,syn:6,r:"EPIC",inds:["Parkinson's disease"],alt:[],cyp:"",tags:[],lore:"George Cotzias' 1967 megadose oral regimen ended an era of tremor resignation. Monsanto's asymmetric hydrogenation to make L-DOPA earned a Nobel in chemistry."},
{id:"carbidopa",n:"Carbidopa",b:"(Sinemet partner)",y:1974,a:"NEURO",cls:"Decarboxylase inhibitor",moa:"Blocks peripheral DOPA decarboxylase so levodopa reaches the brain intact",tg:"peripheral DDC",rt:"PO",hl:2,F:60,eff:2,saf:7,mkt:0.1,syn:4,r:"COMMON",inds:["(Always with levodopa)"],alt:[],cyp:"",tags:["booster"],lore:"Useless alone, transformative paired: cuts needed levodopa dose ~75% and kills the nausea. The purest 'booster card' in real pharmacology."},
{id:"seleg",n:"Selegiline",b:"Eldepryl / Emsam",y:1989,a:"NEURO",cls:"MAO-B inhibitor",moa:"Irreversible MAO-B inhibition (low dose selective); L-methamphetamine metabolites!",tg:"MAO-B",rt:"PO",hl:10,F:10,eff:6,saf:6,mkt:0.2,syn:5,r:"RARE",inds:["Parkinson's adjunct","Major depression (patch)"],alt:[],cyp:"2D6",tags:["maoi"],lore:"Hungarian chemist Joseph Knoll's deprenyl. At low doses MAO-B selective; metabolising to amphetamine cousins gives some patients a very awake afternoon."},
{id:"donep",n:"Donepezil",b:"Aricept",y:1996,a:"NEURO",cls:"Cholinesterase inhibitor",moa:"Central AChE inhibition — modest symptomatic benefit in Alzheimer's",tg:"acetylcholinesterase",rt:"PO",hl:70,F:100,eff:5,saf:6,mkt:0.8,syn:5,r:"COMMON",inds:["Alzheimer's disease (all stages)"],alt:[],cyp:"2D6",tags:[],lore:"For two decades this was all Alzheimer's had: symptomatic, modest, real. Vivid dreams are the signature side effect — cholinergic REM intrusion."},
{id:"pheny",n:"Phenytoin",b:"Dilantin",y:1938,a:"NEURO",cls:"Anticonvulsant",moa:"Use-dependent Na⁺ channel blockade; saturable kinetics make dosing an art",tg:"Naᵥ channels",rt:"PO",hl:22,F:90,eff:8,saf:4,mkt:0.3,syn:2,r:"RARE",inds:["Generalized & focal seizures","Status epilepticus (IV)"],alt:[],cyp:"2C9",tags:["pgx"],lore:"Merritt & Putnam screened compounds by EEG in cats — rational drug discovery, 1938 edition. Zero-order kinetics: tiny dose changes, wild level swings."},
{id:"carba",n:"Carbamazepine",b:"Tegretol",y:1968,a:"NEURO",cls:"Anticonvulsant / mood stabilizer",moa:"Na⁺ channel blockade; induces its OWN metabolism within weeks (autoinduction)",tg:"Naᵥ channels",rt:"PO",hl:25,F:80,eff:8,saf:5,mkt:0.7,syn:4,r:"RARE",inds:["Focal seizures","Trigeminal neuralgia","Bipolar I"],alt:[],cyp:"3A4",tags:["pgx","cyp_ind"],lore:"The enzyme inducer's inducer — it speeds up everything including itself. HLA-B*15:02 testing for SJS risk in Han Chinese is textbook precision medicine."},
{id:"valpro",n:"Valproate",b:"Depakote",y:1967,a:"NEURO",cls:"Broad anticonvulsant",moa:"Multiple: Na⁺ channels, GABA transaminase, T-type Ca²⁺ — discovered by accident as a solvent!",tg:"many",rt:"PO",hl:12,F:100,eff:8,saf:4,mkt:1,syn:2,r:"EPIC",inds:["Generalized seizures","Bipolar mania","Migraine prophylaxis"],alt:[],cyp:"2C9",tags:["teratogen","hepatotoxic"],lore:"Found hiding inside test tubes as an inert lipid solvent in 1963. Broadly brilliant, narrowly forgiven: ~10% malformation risk in pregnancy reshaped entire guidelines."},
{id:"lamotr",n:"Lamotrigine",b:"Lamictal",y:1994,a:"NEURO",cls:"Anticonvulsant",moa:"Na⁺ channel blockade with glutamate release reduction; slow titration mandatory",tg:"Naᵥ channels",rt:"PO",hl:29,F:98,eff:8,saf:6,mkt:1.5,syn:4,r:"RARE",inds:["Focal seizures","Bipolar depression (maintenance)"],alt:[],cyp:"",tags:[],lore:"Rash risk taught neurology patience: double the titration speed, meet Stevens-Johnson. Valproate doubles its levels; the interaction table writes itself."},
{id:"diaze",n:"Diazepam",b:"Valium",y:1963,a:"NEURO",cls:"Benzodiazepine",moa:"Positive allosteric modulator at GABA-A — enhances inhibitory tone",tg:"GABA-A α subunit",rt:"PO",hl:43,F:100,eff:7,saf:5,mkt:0.2,syn:3,r:"RARE",inds:["Anxiety","Alcohol withdrawal","Status epilepticus","Muscle spasm"],alt:[],cyp:"2C19",tags:["benzo","sedating","dependence"],lore:"Leo Sternbach synthesised ~2,400 duds before Librium, then Valium. By 1974 it was America's most prescribed drug; the Rolling Stones sang about 'Mother's Little Helper'."},
{id:"ketam",n:"Ketamine",b:"Ketalar / Spravato",y:1970,a:"NEURO",cls:"NMDA antagonist anesthetic",moa:"Noncompetitive NMDA channel block; sub-anesthetic doses rapidly lift mood",tg:"NMDA receptor",rt:"IV",hl:2.5,F:20,eff:8,saf:5,mkt:0.5,syn:4,r:"EPIC",inds:["Anesthesia","Treatment-resistant depression","Acute pain (opioid-sparing)"],alt:["CRPS","Suicidal ideation (research)"],cyp:"",tags:["sedating","dependence"],lore:"Vietnam battlefield anesthesia turned Yale-lab antidepressant after a 2000 RCT — effects within HOURS, unheard of in psychiatry. Esketamine nasal spray approved 2019."},
{id:"morph",n:"Morphine",b:"MS Contin",y:1827,a:"NEURO",cls:"Opioid (prototype)",moa:"µ-opioid receptor agonism — analgesia, euphoria, respiratory depression",tg:"MOR",rt:"PO",hl:2.5,F:30,eff:9,saf:4,mkt:0.6,syn:8,r:"LEGEND",inds:["Moderate–severe pain","Palliative care","Acute MI"],alt:[],cyp:"2D6",tags:["opioid","dependence","gi"],lore:"Sertürner isolated it from opium in 1804 and named it after Morpheus — the first alkaloid ever purified. Total synthesis took until 1952; the poppy still wins."},
{id:"fenta",n:"Fentanyl",b:"Duragesic",y:1968,a:"NEURO",cls:"Synthetic opioid",moa:"High-affinity µ agonist, ~100× morphine; lipophilic enough for patches and bombs",tg:"MOR",rt:"TD",hl:4,F:92,eff:10,saf:2,mkt:1,syn:5,r:"EPIC",inds:["Breakthrough cancer pain","Perioperative anesthesia"],alt:[],cyp:"3A4",tags:["opioid","dependence"],lore:"Paul Janssen's 1960 masterpiece. Therapeutic doses measured in micrograms; the illicit analog crisis forced naloxone into every public building."},
{id:"trama",n:"Tramadol",b:"Ultram",y:1995,a:"NEURO",cls:"Atypical opioid",moa:"Weak µ agonism PLUS serotonin/norepinephrine reuptake inhibition",tg:"MOR + SERT/NET",rt:"PO",hl:6,F:70,eff:6,saf:5,mkt:1.2,syn:4,r:"COMMON",inds:["Moderate pain","Neuropathic pain (adjunct)"],alt:[],cyp:"2D6",tags:["opioid","serotonergic","dependence","pgx","cyp2d6_sub"],lore:"Two drugs in one coat: opioid AND SNRI. That dual nature means seizures and serotonin syndrome lurk — and CYP2D6 poor metabolisers feel nothing at all."},
{id:"bupre",n:"Buprenorphine",b:"Suboxone",y:2002,a:"NEURO",cls:"Partial µ agonist",moa:"Partial MOR agonist with ceiling effect — analgesia and safety in one curve",tg:"MOR (partial), KOR ant.",rt:"SL",hl:30,F:30,eff:8,saf:6,mkt:2.5,syn:8,r:"RARE",inds:["Opioid use disorder","Chronic pain"],alt:[],cyp:"3A4",tags:["opioid"],lore:"The oripavine chemistry is brutal (semi-synthesis from thebaine). Its ceiling effect let addiction medicine move from clinics to doctors' offices — DATA-2000 changed lives."},
{id:"nalox",n:"Naloxone",b:"Narcan",y:1971,a:"NEURO",cls:"Opioid antagonist",moa:"Competitive µ-receptor antagonist — reverses overdose in minutes",tg:"MOR (antagonist)",rt:"IN",hl:1.2,F:3,eff:9,saf:9,mkt:0.5,syn:7,r:"EPIC",inds:["Opioid overdose reversal"],alt:[],cyp:"",tags:["rescue"],lore:"Fishman's 1961 design: take oxymorphone, swap the allyl group, delete the analgesia. OTC since 2023; shorter half-life than most opioids — renarcotization is real."},
{id:"suma",n:"Sumatriptan",b:"Imitrex",y:1991,a:"NEURO",cls:"Triptan",moa:"5-HT1B/D agonism — cranial vasoconstriction + trigeminal peptide suppression",tg:"5-HT1B/1D",rt:"SC",hl:2,F:15,eff:8,saf:7,mkt:1,syn:5,r:"RARE",inds:["Acute migraine","Cluster headache"],alt:[],cyp:"3A4",tags:["serotonergic"],lore:"Glaxo's Patrick Humphrey tested 100+ candidates; 'Mr Imigran' delivered migraine relief where ergot and opioids had failed for a century. Subcutaneous bioavailability: 96%!"},
{id:"botox",n:"Botulinum toxin A",b:"Botox",y:1989,a:"NEURO",cls:"Neurotoxin therapeutic",moa:"SNARE proteolysis blocks acetylcholine release at the neuromuscular junction",tg:"SNAP-25",rt:"IM",hl:720,F:null,eff:8,saf:5,mkt:4,syn:10,r:"EPIC",inds:["Strabismus","Blepharospasm","Chronic migraine","Spasticity"],alt:["Cosmetic use","Axillary hyperhidrosis"],cyp:"",tags:[],lore:"The most toxic substance known (nanogram LD₅₀), domesticated by Alan Scott for crossed eyes in the 1970s. Cosmetic approval in 2002 funded two decades of neurology."},
{id:"caff",n:"Caffeine citrate",b:"Cafcit",y:1999,a:"NEURO",cls:"Methylxanthine",moa:"Adenosine receptor antagonism; neonatal formulation stimulates breathing drive",tg:"A₁/A₂A receptors",rt:"PO",hl:5,F:99,eff:5,saf:7,mkt:0.05,syn:2,r:"COMMON",inds:["Apnea of prematurity"],alt:["Everyone's morning (unregulated)"],cyp:"1A2",tags:["stimulant"],lore:"The world's favourite psychoactive, formally approved for premature babies' apnea. Neonatal half-life stretches to days; adult coffee drinkers clear it in hours."},

// ===== ANTI-INFECTIVE =====
{id:"peng",n:"Penicillin G",b:"Benzylpenicillin",y:1942,a:"INFECT",cls:"β-lactam (natural)",moa:"Transpeptidase acylation halts peptidoglycan cross-linking → cell wall suicide",tg:"PBPs",rt:"IV",hl:0.8,F:30,eff:9,saf:7,mkt:0.3,syn:5,r:"LEGEND",inds:["Syphilis (incl. neuro)","Streptococcal infection"],alt:[],cyp:"",tags:["antibiotic"],lore:"Fleming's messy 1928 petri dish; Florey & Chain's Oxford mice, 1940; the first patient died when the world's supply ran out. 'Yellow magic' won three people the 1945 Nobel."},
{id:"amox",n:"Amoxicillin",b:"Amoxil",y:1972,a:"INFECT",cls:"Aminopenicillin",moa:"Oral β-lactam with gram-negative reach; H. pylori triple-therapy pillar",tg:"PBPs",rt:"PO",hl:1.5,F:95,eff:8,saf:8,mkt:1,syn:4,r:"COMMON",inds:["Otitis media","Community pneumonia","H. pylori regimens"],alt:[],cyp:"",tags:["antibiotic"],lore:"Pediatrics' default prescription. The innocent-looking rash when given during infectious mononucleosis has confused generations of students — it's not allergy."},
{id:"augm",n:"Amoxicillin-clavulanate",b:"Augmentin",y:1981,a:"INFECT",cls:"β-lactam + inhibitor",moa:"Clavulanate sacrifices itself to β-lactamases so amoxicillin can work",tg:"PBPs + β-lactamases",rt:"PO",hl:1.2,F:70,eff:9,saf:7,mkt:0.8,syn:6,r:"RARE",inds:["Recurrent otitis","Sinusitis","Bite wounds","ESBL-ish UTIs"],alt:[],cyp:"",tags:["antibiotic"],lore:"Beecham's clavulanate came from Streptomyces clavuligerus — a 'suicide inhibitor' decades before the term was fashionable. Diarrhea is the tax."},
{id:"vanc",n:"Vancomycin",b:"Vancocin",y:1958,a:"INFECT",cls:"Glycopeptide",moa:"Binds D-Ala-D-Ala termini, physically jamming cell wall assembly",tg:"D-Ala-D-Ala",rt:"IV",hl:6,F:5,eff:9,saf:5,mkt:0.8,syn:6,r:"EPIC",inds:["MRSA bacteremia","C. difficile (oral!)"],alt:[],cyp:"",tags:["antibiotic","nephrotoxic","renal_clear"],lore:"'Mississippi mud' from Borneo soil, shelved for impurities, then crowned when MRSA arrived. Oral dosing never enters blood — which is exactly why it cures gut C. diff."},
{id:"gent",n:"Gentamicin",b:"Garamycin",y:1966,a:"INFECT",cls:"Aminoglycoside",moa:"30S ribosomal binding → mistranslation; concentration-dependent killing",tg:"30S subunit",rt:"IV",hl:2.5,F:0,eff:8,saf:3,mkt:0.1,syn:5,r:"RARE",inds:["Gram-negative sepsis","Endocarditis synergy"],alt:[],cyp:"",tags:["antibiotic","nephrotoxic","ototoxic","renal_clear"],lore:"Once-daily high-dose dosing exploits its post-antibiotic effect. Mitochondrial mutation m.1555G>A turns standard courses into lifelong deafness — pharmacogenetics of the ear."},
{id:"linez",n:"Linezolid",b:"Zyvox",y:2000,a:"INFECT",cls:"Oxazolidinone",moa:"Blocks 70S initiation complex formation — no cross-resistance with older classes",tg:"50S ribosome",rt:"PO",hl:5.5,F:100,eff:8,saf:6,mkt:0.6,syn:5,r:"RARE",inds:["MRSA pneumonia","VRE","Skin infections"],alt:[],cyp:"",tags:["antibiotic","maoi","myelosup","serotonergic"],lore:"100% oral bioavailability — switch from IV without thinking. It's a weak MAOI: pair it with an SSRI and serotonin syndrome becomes a chart review away."},
{id:"azith",n:"Azithromycin",b:"Zithromax",y:1991,a:"INFECT",cls:"Macrolide (15-membered)",moa:"50S translocation block; tissue penetration 50–100× plasma",tg:"50S subunit",rt:"PO",hl:68,F:38,eff:8,saf:7,mkt:2,syn:6,r:"RARE",inds:["Respiratory infections","STI (single dose)","Trachoma programs"],alt:[],cyp:"3A4",tags:["antibiotic","qt"],lore:"The Z-Pak: five days of dosing backed by a 68-hour tissue half-life. WHO mass-administers it for river-blindness-adjacent trachoma; QT warnings arrived fashionably late."},
{id:"clari",n:"Clarithromycin",b:"Biaxin",y:1990,a:"INFECT",cls:"Macrolide",moa:"50S blockage AND the strongest CYP3A4 inhibition of its class",tg:"50S subunit / CYP3A4",rt:"PO",hl:6,F:55,eff:7,saf:6,mkt:0.6,syn:6,r:"RARE",inds:["H. pylori triple therapy","MAC prophylaxis","Respiratory infections"],alt:[],cyp:"3A4",tags:["antibiotic","cyp3a4inh","cyp3a4_inh","qt"],lore:"Half antibiotic, half interaction engine. In H. pylori eradication it's a hero; near simvastatin or terfenadine it's a cardiac event waiting for paperwork."},
{id:"cipro",n:"Ciprofloxacin",b:"Cipro",y:1987,a:"INFECT",cls:"Fluoroquinolone",moa:"DNA gyrase & topoisomerase IV poisoning — rapid bactericidal sweep",tg:"gyrA/parC",rt:"PO",hl:4,F:70,eff:8,saf:5,mkt:1,syn:5,r:"RARE",inds:["UTI","Traveler's diarrhea","Anthrax exposure","Bone infection"],alt:[],cyp:"1A2",tags:["antibiotic","qt","resistance"],lore:"The 2001 anthrax letters made its name a household word. Tendon ruptures and aortic warnings eventually caught up; antacids quietly neutralise it via chelation."},
{id:"doxy",n:"Doxycycline",b:"Vibramycin",y:1966,a:"INFECT",cls:"Tetracycline",moa:"30S aminoacyl-tRNA blockade; also anti-inflammatory at low dose",tg:"30S subunit",rt:"PO",hl:20,F:95,eff:8,saf:6,mkt:0.8,syn:6,r:"RARE",inds:["Rickettsial disease","Malaria prophylaxis","Rosacea","Lyme disease"],alt:[],cyp:"",tags:["antibiotic","photosens"],lore:"Take with water, sitting upright — pill esophagitis is memorable. Under 8 years old it stains teeth; in malaria zones it's the nightly insurance policy."},
{id:"metro",n:"Metronidazole",b:"Flagyl",y:1959,a:"INFECT",cls:"Nitroimidazole",moa:"Reduced anaerobically to radicals that shred microbial DNA",tg:"DNA (anaerobes)",rt:"PO",hl:8,F:99,eff:8,saf:6,mkt:0.4,syn:3,r:"RARE",inds:["Anaerobic infection","Trichomoniasis","C. difficile","Bacterial vaginosis"],alt:[],cyp:"2C9",tags:["antibiotic","disulfiram"],lore:"One sip of wine on Flagyl = flushing, pounding, regret — the disulfiram-like reaction. Metallic taste included free of charge."},
{id:"clinda",n:"Clindamycin",b:"Cleocin",y:1966,a:"INFECT",cls:"Lincosamide",moa:"50S translocation inhibition; superb bone and anaerobe penetration",tg:"50S subunit",rt:"PO",hl:2.5,F:90,eff:7,saf:4,mkt:0.4,syn:4,r:"COMMON",inds:["Osteomyelitis","Dental abscess","Anaerobic chest infection"],alt:[],cyp:"3A4",tags:["antibiotic"],lore:"Dentists love it; C. difficile fears it — highest CDI association of any antibiotic. Great bones, terrible gut."},
{id:"tmpsmx",n:"Trimethoprim-Sulfamethoxazole",b:"Bactrim",y:1973,a:"INFECT",cls:"Folate antagonist combo",moa:"Sequential folate pathway blockade — synergy built into one tablet",tg:"DHFR + DHPS",rt:"PO",hl:10,F:90,eff:8,saf:5,mkt:0.5,syn:5,r:"RARE",inds:["UTI","Pneumocystis pneumonia (+prophylaxis)","MRSA skin"],alt:["Nocardia","Toxoplasmosis"],cyp:"2C9",tags:["antibiotic","nephrotoxic"],lore:"Two enzymes, one pathway, zero mercy. Trimethoprim acts like amiloride in the kidney — hyperkalemia sneaks up on ACE-inhibitor patients."},
{id:"rifamp",n:"Rifampin",b:"Rifadin",y:1968,a:"INFECT",cls:"Rifamycin",moa:"Binds bacterial RNA polymerase β-subunit; the body's strongest enzyme inducer",tg:"RNAP β-subunit",rt:"PO",hl:3.5,F:95,eff:9,saf:5,mkt:0.4,syn:7,r:"RARE",inds:["Tuberculosis (RIPE)","Leprosy","Prosthetic joint staph"],alt:[],cyp:"3A4",tags:["antibiotic","tb","hepatotoxic","cyp_ind"],lore:"Named after the French gangster film 'Rififi'. Turns tears, sweat and contact lenses orange — counselling point number one. Birth control pills fail in its wake."},
{id:"inh",n:"Isoniazid",b:"INH",y:1952,a:"INFECT",cls:"Anti-tubercular",moa:"Prodrug activated by KatG → InhA blockade, mycolic acid starvation",tg:"InhA (via KatG)",rt:"PO",hl:3,F:95,eff:9,saf:5,mkt:0.1,syn:2,r:"RARE",inds:["TB treatment & latent prophylaxis"],alt:[],cyp:"",tags:["antibiotic","tb","hepatotoxic","pgx"],lore:"Three companies published it the same month, 1952. NAT2 acetylator status splits humanity into fast and slow clearers — pharmacogenetics before the word existed. Pyridoxine prevents the neuropathy."},
{id:"fluco",n:"Fluconazole",b:"Diflucan",y:1990,a:"INFECT",cls:"Triazole",moa:"Lanosterol 14α-demethylase inhibition → fungal membrane collapse",tg:"CYP51 (fungal)",rt:"PO",hl:30,F:95,eff:8,saf:7,mkt:1,syn:4,r:"RARE",inds:["Candidiasis","Cryptococcal meningitis (consolidation)"],alt:[],cyp:"2C9",tags:["antifungal"],lore:"Once-daily thanks to a 30-hour half-life; single-dose vaginal candidiasis made it famous. A polite 2C9/3A4 inhibitor — interactions present but manageable."},
{id:"keto",n:"Ketoconazole",b:"Nizoral",y:1981,a:"INFECT",cls:"Imidazole",moa:"Fungal CYP51 blockade — and indiscriminate human CYP3A4 annihilation",tg:"CYP51 / CYP3A4",rt:"PO",hl:8,F:70,eff:8,saf:4,mkt:0.2,syn:5,r:"EPIC",inds:["Systemic mycoses (legacy)","Seborrheic dermatitis (shampoo)"],alt:[],cyp:"3A4",tags:["antifungal","cyp3a4inh","cyp3a4_inh","hepatotoxic"],lore:"The original interaction villain: co-prescription deaths on terfenadine rewrote drug-safety law. Demoted to shampoo for skin, immortal in pharmacology exams."},
{id:"aciclo",n:"Acyclovir",b:"Zovirax",y:1981,a:"INFECT",cls:"Nucleoside analog",moa:"Herpes thymidine kinase activates it; acyclo-GTP terminates viral DNA chains",tg:"HSV TK → DNA pol",rt:"PO",hl:2.5,F:20,eff:8,saf:8,mkt:0.8,syn:4,r:"RARE",inds:["HSV-1/2","Varicella zoster","Encephalitis (IV)"],alt:[],cyp:"",tags:[],lore:"Gertrude Elion's rational-design triumph — viral selectivity through the virus's OWN kinase. Poor oral absorption inspired valacyclovir, its prodrug upgrade. Hydrate: crystals hate kidneys."},
{id:"tenofo",n:"Tenofovir",b:"Viread / Truvada",y:2001,a:"INFECT",cls:"Nucleotide analog",moa:"Chain termination after RT phosphorylation; also suppresses HBV polymerase",tg:"RT / HBV pol",rt:"PO",hl:17,F:25,eff:9,saf:6,mkt:6,syn:7,r:"EPIC",inds:["HIV (backbone)","HBV","PrEP — HIV prevention"],alt:[],cyp:"",tags:["art"],lore:"Antonín Holý's Prague lab + Gilead. As Truvada PrEP (2012) it turned a fatal epidemic into a preventable one — a pill taken by the uninfected, once unthinkable."},
{id:"azt",n:"Zidovudine (AZT)",b:"Retrovir",y:1987,a:"INFECT",cls:"NRTI (first)",moa:"Thymidine analog chain terminator at reverse transcriptase",tg:"RT",rt:"PO",hl:1.1,F:64,eff:6,saf:4,mkt:0.1,syn:4,r:"EPIC",inds:["HIV (historic backbone)","Vertical transmission prevention"],alt:[],cyp:"",tags:["art","myelosup"],lore:"A 1964 cancer failure rescued in 1985 under ACT UP's pressure — FDA approval in under 21 months, then unthinkable. ACTG 076 cut mother-to-child transmission by two-thirds."},
{id:"lamiv",n:"Lamivudine",b:"Epivir (3TC)",y:1995,a:"INFECT",cls:"NRTI",moa:"Cytosine analog chain terminator; the M184V 'failure' actually attenuates HIV",tg:"RT",rt:"PO",hl:6,F:85,eff:7,saf:8,mkt:0.8,syn:5,r:"COMMON",inds:["HIV backbone","HBV"],alt:[],cyp:"",tags:["art"],lore:"Its signature resistance mutation weakens the virus itself — evolution's rare gift. Two pills' worth of history: HIV and hepatitis B share this backbone."},
{id:"riton",n:"Ritonavir",b:"Norvir",y:1996,a:"INFECT",cls:"PI / booster",moa:"Weak antiviral alone; devastating CYP3A4 inhibition 'boosts' partner PIs skyward",tg:"CYP3A4 (and HIV PR)",rt:"PO",hl:5,F:70,eff:5,saf:4,mkt:0.3,syn:8,r:"EPIC",inds:["Pharmacokinetic boosting of PIs"],alt:[],cyp:"3A4",tags:["art","cyp3a4inh","cyp3a4_inh","booster"],lore:"Reformulation hell: its gelcaps dissolved in summer heat, triggering a polymorph crisis that halted production. Reinvented itself as the ultimate booster — Paxlovid still uses the trick."},
{id:"dtg",n:"Dolutegravir",b:"Tivicay",y:2013,a:"INFECT",cls:"Integrase inhibitor",moa:"Strand-transfer inhibition with the highest barrier to resistance in HIV care",tg:"HIV integrase",rt:"PO",hl:14,F:65,eff:9,saf:8,mkt:2.5,syn:6,r:"RARE",inds:["HIV (first-line globally)","PEP"],alt:[],cyp:"3A4",tags:["art"],lore:"WHO's default first-line worldwide. A brief neural-tube signal faded under better data (Tsepamo); weight gain emerged as the class's new conversation."},
{id:"abaca",n:"Abacavir",b:"Ziagen",y:1998,a:"INFECT",cls:"NRTI",moa:"Guanosine analog chain terminator — IF (and only if) HLA-B*57:01 is negative",tg:"RT",rt:"PO",hl:1.5,F:83,eff:7,saf:6,mkt:0.8,syn:6,r:"RARE",inds:["HIV (HLA-screened)"],alt:[],cyp:"",tags:["art","pgx"],lore:"The PREDICT-1 trial made prospective HLA-B*57:01 genotyping standard: hypersensitivity reactions essentially vanished. Pharmacogenomics' cleanest kill."},
{id:"sof",n:"Sofosbuvir",b:"Sovaldi",y:2013,a:"INFECT",cls:"NS5B nucleotide inhibitor",moa:"Chain termination at NS5B polymerase — interferon-free HCV CURE in 12 weeks",tg:"NS5B",rt:"PO",hl:27,F:80,eff:10,saf:9,mkt:4,syn:8,r:"LEGEND",inds:["Chronic hepatitis C (all genotypes)"],alt:[],cyp:"",tags:["cure","art"],lore:"$1,000-a-pill fury met 95% cure rates. Pharmasset's science beat interferon's misery; pricing politics wrote the playbook pharma still argues about. Hepatitis C became optional."},
{id:"artem",n:"Artemisinin",b:"Coartem (partner)",y:1972,a:"INFECT",cls:"Sesquiterpene lactone",moa:"Endoperoxide bridge cleaved by parasite iron → radical burst kills Plasmodium",tg:"parasite membranes",rt:"PO",hl:2.5,F:30,eff:9,saf:7,mkt:0.3,syn:7,r:"LEGEND",inds:["Falciparum malaria (ACTs)"],alt:[],cyp:"2C19",tags:["antimalarial"],lore:"Tu Youyou read a 4th-century Ge Hong text, extracted Artemisia annua with cold ether, and saved millions — the 2015 Nobel shared the stage with ivermectin. Yeast now brews it."},
{id:"iverm",n:"Ivermectin",b:"Mectizan / Stromectol",y:1987,a:"INFECT",cls:"Avermectin",moa:"Glutamate-gated chloride channel opening — nematode & ectoparasite paralysis",tg:"Glu-Cl channels",rt:"PO",hl:18,F:65,eff:9,saf:7,mkt:0.4,syn:8,r:"EPIC",inds:["River blindness","Strongyloidiasis","Scabies","Lymphatic filariasis"],alt:[],cyp:"3A4",tags:["antiparasitic"],lore:"Ōmura's soil sample near a Japanese golf course; Campbell's avermectins; a 2015 Nobel. Merck donates 'as much as needed, for as long as needed' — Mectizan since 1987."},
{id:"prim",n:"Primaquine",b:"—",y:1950,a:"INFECT",cls:"8-aminoquinoline",moa:"Only licensed drug killing hypnozoites — the relapse bunkers of P. vivax",tg:"hypnozoites",rt:"PO",hl:6,F:96,eff:8,saf:5,mkt:0.05,syn:4,r:"RARE",inds:["Vivax malaria radical cure","P. jirovecii (alternative)"],alt:[],cyp:"2D6",tags:["antimalarial","pgx"],lore:"G6PD deficiency turns radical cure into hemolytic disaster — screen first. Even its activation needs CYP2D6; poor metabolisers get elegant failure."},
{id:"hcq",n:"Hydroxychloroquine",b:"Plaquenil",y:1955,a:"INFECT",cls:"Aminoquinoline",moa:"Lysosomotropic immune modulation; raises endosomal pH, tames TLR signaling",tg:"TLR pathways",rt:"PO",hl:480,F:70,eff:6,saf:6,mkt:0.5,syn:5,r:"RARE",inds:["Systemic lupus","Rheumatoid arthritis","Malaria"],alt:[],cyp:"2D6",tags:["antimalarial","pgx"],lore:"Lupus mortality fell when HCQ became routine; retinal screening keeps it honest. Its 2020 pandemic moment — EUA granted then revoked — is a case study in evidence under pressure."},

// ===== ONCOLOGY =====
{id:"cyclo",n:"Cyclophosphamide",b:"Cytoxan",y:1959,a:"ONCO",cls:"Alkylating agent",moa:"CYP-activated phosphoramide mustard cross-links DNA; acrolein irritates bladder",tg:"DNA cross-links",rt:"PO",hl:6,F:90,eff:8,saf:3,mkt:0.4,syn:5,r:"RARE",inds:["Lymphomas","Breast cancer","Vasculitis & SLE (off-label hero)"],alt:[],cyp:"2C9",tags:["myelosup","nephrotoxic"],lore:"Descended from WWI mustard gas research. Mesna and hydration tame the hemorrhagic cystitis; fertility counseling should come before the first dose."},
{id:"cispl",n:"Cisplatin",b:"Platinol",y:1978,a:"ONCO",cls:"Platinum coordination complex",moa:"Intrastrand GG cross-links stall replication; error-prone repair kills the cell",tg:"DNA adducts",rt:"IV",hl:30,F:0,eff:9,saf:2,mkt:0.3,syn:3,r:"RARE",inds:["Testicular cancer (curative)","Ovarian, lung, bladder"],alt:[],cyp:"",tags:["nephrotoxic","ototoxic","myelosup"],lore:"Barnett Rosenberg saw E. coli grow into filaments near platinum electrodes in 1965. Testicular cancer went from ~10% survival to >95%. Nausea was its brutal calling card — until ondansetron."},
{id:"doxo",n:"Doxorubicin",b:"Adriamycin",y:1974,a:"ONCO",cls:"Anthracycline",moa:"Topoisomerase II poisoning + free radicals; cumulative cardiac dose ceiling",tg:"Topo II / membranes",rt:"IV",hl:30,F:0,eff:9,saf:3,mkt:0.5,syn:7,r:"EPIC",inds:["Breast cancer","Lymphoma (CHOP/R-CHOP)","Sarcomas"],alt:[],cyp:"",tags:["cardiotox","myelosup"],lore:"'The red devil' — crimson vesicant, cornerstone of curative lymphoma therapy. Lifetime dose caps exist because the heart counts every milligram; dexrazoxane is its chaperone."},
{id:"pacli",n:"Paclitaxel",b:"Taxol",y:1992,a:"ONCO",cls:"Taxane",moa:"Hyper-stabilises microtubules — mitosis freezes mid-spindle",tg:"β-tubulin",rt:"IV",hl:10,F:0,eff:8,saf:4,mkt:1.2,syn:9,r:"EPIC",inds:["Ovarian","Breast","Lung cancer","Kaposi sarcoma"],alt:[],cyp:"3A4",tags:["myelosup"],lore:"Monroe Wall & Wani's yew bark discovery needed three trees per patient until semi-synthesis from needles saved the forests. Cremophor vehicle causes the infusions' infamous hypersensitivity."},
{id:"vincr",n:"Vincristine",b:"Oncovin",y:1963,a:"ONCO",cls:"Vinca alkaloid",moa:"Blocks tubulin polymerisation — spindle poisons differ from taxanes by direction",tg:"β-tubulin (assembly)",rt:"IV",hl:85,F:0,eff:8,saf:3,mkt:0.2,syn:9,r:"RARE",inds:["ALL (curative combos)","Lymphoma","Wilms tumor"],alt:[],cyp:"3A4",tags:["myelosup"],lore:"From Madagascar periwinkle leaves — tonnes of foliage per kilogram. 'Oncologic insulin' for childhood leukemia; intrathecal administration is uniformly fatal, so packaging safeguards exist."},
{id:"mtx",n:"Methotrexate",b:"Trexall",y:1947,a:"ONCO",cls:"Antifolate",moa:"DHFR inhibition starves thymidylate synthesis; low-dose weekly = anti-inflammatory",tg:"DHFR",rt:"PO",hl:8,F:60,eff:8,saf:4,mkt:0.6,syn:5,r:"EPIC",inds:["Leukemia (high-dose + rescue)","RA & psoriasis (low-dose)","Ectopic pregnancy"],alt:[],cyp:"",tags:["myelosup","teratogen","pgx"],lore:"Sidney Farber's 1948 childhood-leukemia remissions launched modern chemotherapy; Yellapragada Subbarow synthesized the drug. Same molecule, weekly, anchors rheumatology — with leucovorin as its escape hatch."},
{id:"5fu",n:"Fluorouracil",b:"5-FU",y:1962,a:"ONCO",cls:"Antimetabolite",moa:"FdUMP traps thymidylate synthase; incorporation corrupts RNA too",tg:"TYMS",rt:"IV",hl:0.3,F:0,eff:8,saf:4,mkt:0.4,syn:3,r:"RARE",inds:["Colorectal cancer (FOLFOX)","Topical actinic keratosis"],alt:[],cyp:"",tags:["myelosup","pgx"],lore:"Heidelberger's 1957 design was the first truly rationally-designed anticancer drug. DPD deficiency (DPYD*2A) turns standard doses lethal — genotyping now precedes it in Europe."},
{id:"tamox",n:"Tamoxifen",b:"Nolvadex",y:1977,a:"ONCO",cls:"SERM",moa:"ER antagonist in breast, agonist in uterus & bone — tissue-selective trickery",tg:"estrogen receptor",rt:"PO",hl:168,F:100,eff:8,saf:6,mkt:0.5,syn:4,r:"EPIC",inds:["ER+ breast cancer","Risk reduction in high-risk women"],alt:[],cyp:"2D6",tags:["pgx","hepatotoxic"],lore:"ICI's 'morning-after pill that failed' became oncology's longest-running success story — ATLAS showed 10 years beats 5. Endoxifen, its CYP2D6-made metabolite, does much of the work."},
{id:"imatinib",n:"Imatinib",b:"Gleevec",y:2001,a:"ONCO",cls:"BCR-ABL TKI",moa:"Locks the fusion kinase's ATP pocket shut — targeted therapy's proof of concept",tg:"BCR-ABL, KIT, PDGFR",rt:"PO",hl:20,F:98,eff:10,saf:7,mkt:4.5,syn:6,r:"LEGEND",inds:["Chronic myeloid leukemia","GIST"],alt:[],cyp:"3A4",tags:[],lore:"Philadelphia chromosome (1960) → BCR-ABL (1984) → Druker's molecule (1996) → FDA in 10 weeks (2001). Five-year survival in CML went from ~30% to >90%. The blueprint for everything after."},
{id:"osimert",n:"Osimertinib",b:"Tagrisso",y:2015,a:"ONCO",cls:"EGFR TKI (3rd gen)",moa:"Mutant-selective EGFR inhibition including the T790M gatekeeper resistance",tg:"EGFR T790M/L858R",rt:"PO",hl:48,F:60,eff:9,saf:7,mkt:5.5,syn:7,r:"RARE",inds:["EGFR-mutant NSCLC (first-line)","T790M resistance"],alt:[],cyp:"3A4",tags:[],lore:"Designed FOR a resistance mutation — evolution answered, chemistry countered. CNS penetration treats brain metastases without radiation. FLAURA made it first-line."},
{id:"pembro",n:"Pembrolizumab",b:"Keytruda",y:2014,a:"ONCO",cls:"Anti-PD-1 mAb",moa:"Releases the PD-1 brake on exhausted T cells — immune-related AEs are the cost",tg:"PD-1",rt:"IV",hl:600,F:0,eff:9,saf:6,mkt:25,syn:9,r:"LEGEND",inds:["Melanoma","NSCLC","+30 indications","MSI-high tumors (tissue-agnostic)"],alt:[],cyp:"",tags:["biologic","infusion","immunosupp"],lore:"Jimmy Carter's melanoma metastases vanished in 2015; Honjo's Nobel followed in 2018. Now the world's top-selling drug (~$25B/yr) — and colitis, thyroiditis and myocarditis ride along."},
{id:"ritux",n:"Rituximab",b:"Rituxan",y:1997,a:"ONCO",cls:"Anti-CD20 mAb",moa:"Complement + ADCC lysis of CD20+ B cells — first anticancer monoclonal",tg:"CD20",rt:"IV",hl:480,F:0,eff:8,saf:6,mkt:7.5,syn:8,r:"EPIC",inds:["DLBCL (R-CHOP)","Follicular lymphoma","RA","ANCA vasculitis"],alt:[],cyp:"",tags:["biologic","infusion"],lore:"IDEC's gamble on an unproven target created the mAb oncology era. First-infusion cytokine storms are expected; B-cell depletion quietly revolutionised rheumatology too."},
{id:"trast",n:"Trastuzumab",b:"Herceptin",y:1998,a:"ONCO",cls:"Anti-HER2 mAb",moa:"Blocks HER2 signaling + antibody-dependent cytotoxicity in amplified tumors",tg:"HER2",rt:"IV",hl:300,F:0,eff:8,saf:6,mkt:6,syn:8,r:"EPIC",inds:["HER2+ breast cancer","HER2+ gastric cancer"],alt:[],cyp:"",tags:["biologic","cardiotox","infusion"],lore:"Dennis Slamon chased HER2 amplification when nobody believed oncogenes mattered in solid tumors. With anthracyclines the heart suffers — HER2 signaling keeps cardiac muscle alive."},
{id:"lenali",n:"Lenalidomide",b:"Revlimid",y:2005,a:"ONCO",cls:"IMiD",moa:"Redirects cereblon E3 ligase to degrade IKZF1/3 — molecular glue pioneer",tg:"cereblon neosubstrates",rt:"PO",hl:3,F:95,eff:9,saf:5,mkt:12,syn:6,r:"RARE",inds:["Multiple myeloma","5q− MDS"],alt:[],cyp:"",tags:["myelosup","teratogen"],lore:"Thalidomide's rehabilitated child. Its mechanism stayed mysterious until 2010 — then revealed 'molecular glue' degradation, birthing an entire drug-discovery field. REMS-grade pregnancy controls persist."},
{id:"olaparib",n:"Olaparib",b:"Lynparza",y:2014,a:"ONCO",cls:"PARP inhibitor",moa:"Traps PARP on damaged DNA; BRCA-mutant cells lack homologous repair — synthetic lethality",tg:"PARP1/2",rt:"PO",hl:12,F:45,eff:8,saf:6,mkt:2.5,syn:7,r:"EPIC",inds:["BRCA ovarian/breast/pancreatic/prostate"],alt:[],cyp:"3A4",tags:["myelosup"],lore:"Synthetic lethality made clinical: exploit the second hit. KuDOS/AstraZeneca's bet validated a concept Alan Ashworth articulated — tumor genetics as the drug target itself."},
{id:"hydroxyurea",n:"Hydroxyurea",b:"Hydrea",y:1967,a:"ONCO",cls:"Ribonucleotide reductase inhibitor",moa:"Blocks DNA synthesis; in sickle cell, induces HbF — fetal hemoglobin returns",tg:"RRM2 / HbF induction",rt:"PO",hl:3.5,F:95,eff:7,saf:5,mkt:0.3,syn:2,r:"COMMON",inds:["Sickle cell disease","Myeloproliferative neoplasms"],alt:[],cyp:"",tags:["myelosup"],lore:"A 1960s cytotoxic reborn as sickle cell's daily pill: MSH trial pain crises nearly halved. Once-daily simplicity for a disease once managed only in crisis."},
{id:"tisacel",n:"Tisagenlecleucel",b:"Kymriah",y:2017,a:"ONCO",cls:"CAR-T cell therapy",moa:"Autologous T cells engineered with anti-CD19 CAR — a living, expanding drug",tg:"CD19",rt:"IV",hl:-1,F:0,eff:9,saf:4,mkt:0.6,syn:10,r:"EPIC",inds:["Relapsed/refractory B-ALL","DLBCL"],alt:[],cyp:"",tags:["biologic","immunosupp"],lore:"Emily Whitehead, age 6, was first in 2012 — now a healthy adult. Novartis priced the one-time cure at $475k and invented outcome-based contracts on the spot. CRS is treated with tocilizumab."},

// ===== IMMUNOLOGY =====
{id:"pred",n:"Prednisone",b:"Deltasone",y:1955,a:"IMMUNO",cls:"Corticosteroid",moa:"Glucocorticoid receptor agonism — genome-wide anti-inflammatory transcription",tg:"GR (nuclear)",rt:"PO",hl:3.5,F:80,eff:9,saf:4,mkt:0.8,syn:6,r:"EPIC",inds:["Asthma exacerbations","RA flares","Transplant rejection","Everything, briefly"],alt:[],cyp:"3A4",tags:["steroid"],lore:"Russell Marker's diosgenin degradation made steroids cheap overnight. The workhorse of a hundred specialties — and moon face, osteoporosis and adrenal suppression are the rent."},
{id:"ibu",n:"Ibuprofen",b:"Advil / Brufen",y:1969,a:"IMMUNO",cls:"NSAID",moa:"Reversible COX-1/2 inhibition; prostaglandin-mediated pain & fever relief",tg:"COX-1, COX-2",rt:"PO",hl:2,F:90,eff:7,saf:6,mkt:1.5,syn:3,r:"COMMON",inds:["Pain","Fever","Inflammatory arthritis","Neonatal PDA closure (IV)"],alt:[],cyp:"2C9",tags:["nsaid","gi","nephrotoxic"],lore:"Stewart Adams tested it on his own hangover before Boots filed in 1961. The Hoechst catalytic route later became green-chemistry canon. Kidneys and GI mucosa keep the ledger."},
{id:"celecoxib",n:"Celecoxib",b:"Celebrex",y:1998,a:"IMMUNO",cls:"COX-2 selective NSAID",moa:"COX-2 selectivity spares gastric protection — mostly",tg:"COX-2",rt:"PO",hl:11,F:40,eff:7,saf:6,mkt:2.5,syn:5,r:"RARE",inds:["OA/RA pain","Ankylosing spondylitis","Familial adenomatous polyposis"],alt:[],cyp:"2C9",tags:["nsaid"],lore:"Designed to keep Vioxx-class drugs' stomach promise. Then Vioxx imploded and Celebrex inherited both the market and the cardiovascular scrutiny. Sulfa allergy applies."},
{id:"rofecoxib",n:"Rofecoxib",b:"Vioxx",y:1999,a:"IMMUNO",cls:"COX-2 inhibitor (WITHDRAWN)",moa:"COX-2 selectivity — with prothrombotic prostacyclin loss nobody priced in",tg:"COX-2",rt:"PO",hl:17,F:92,eff:7,saf:2,mkt:0,syn:5,r:"BANNED",inds:["(Withdrawn 2004)"],alt:[],cyp:"",tags:["nsaid"],lore:"Merck pulled it in 2004 after APPROVe showed CV harm — at its peak, $2.5B/year. The litigation settlement reached $4.85B and permanently changed how post-marketing safety works."},
{id:"acetam",n:"Acetaminophen",b:"Tylenol / Paracetamol",y:1955,a:"IMMUNO",cls:"Analgesic-antipyretic",moa:"Central COX variant inhibition (and endocannabinoid tricks); no peripheral anti-inflammatory",tg:"COX-3? / TRPV1",rt:"PO",hl:2.5,F:75,eff:5,saf:6,mkt:1.3,syn:2,r:"EPIC",inds:["Pain","Fever"],alt:[],cyp:"",tags:["hepatotoxic"],lore:"The leading cause of acute liver failure in the West — safe at label doses, merciless above them. N-acetylcysteine is the antidote. The 1982 Chicago tampering case created tamper-proof packaging."},
{id:"aza",n:"Azathioprine",b:"Imuran",y:1968,a:"IMMUNO",cls:"Purine antimetabolite",moa:"6-MP conversion disrupts purine synthesis — transplant & autoimmune staple",tg:"de novo purine synthesis",rt:"PO",hl:5,F:55,eff:7,saf:5,mkt:0.3,syn:5,r:"RARE",inds:["Transplant immunosuppression","IBD","Lupus nephritis"],alt:[],cyp:"",tags:["immunosupp","myelosup","pgx"],lore:"Elion & Hitchings' rational antimetabolites earned a 1988 Nobel. TPMT testing predicts the myelosuppression — another pharmacogenomic flag planted decades early."},
{id:"humira",n:"Adalimumab",b:"Humira",y:2002,a:"IMMUNO",cls:"Anti-TNF mAb",moa:"Fully human TNF-neutralizing antibody — phage display's flagship",tg:"TNF-α",rt:"SC",hl:300,F:64,eff:9,saf:6,mkt:21,syn:9,r:"LEGEND",inds:["RA","Psoriasis","Crohn's","UC","Uveitis","HS"],alt:[],cyp:"",tags:["biologic","immunosupp"],lore:"The best-selling drug in history: >$200B lifetime, protected by a patent moat of 100+ filings. Greg Winter's phage-display Nobel (2018) traces directly here. Biosimilars finally breached the wall in 2023."},
{id:"diph",n:"Diphenhydramine",b:"Benadryl",y:1946,a:"IMMUNO",cls:"First-gen antihistamine",moa:"H₁ blockade that crosses the BBB — sleepiness is the feature and the bug",tg:"H₁ (central)",rt:"PO",hl:9,F:40,eff:5,saf:4,mkt:0.4,syn:2,r:"COMMON",inds:["Acute allergic reactions","Insomnia (self-medicated)","Dystonia rescue"],alt:[],cyp:"2D6",tags:["anticholinergic","sedating"],lore:"George Rieveschl's Cincinnati PhD project, 1943. Anticholinergic burden in aging brains is why geriatricians wage permanent war on it — delirium risk in every nighttime caplet."},
{id:"fexo",n:"Fexofenadine",b:"Allegra",y:1996,a:"IMMUNO",cls:"Second-gen antihistamine",moa:"Peripheral H₁ blockade; P-gp/OATP transport dynamics keep it out of the brain",tg:"H₁ (peripheral)",rt:"PO",hl:14,F:33,eff:6,saf:8,mkt:0.8,syn:5,r:"RARE",inds:["Allergic rhinitis","Chronic urticaria"],alt:[],cyp:"",tags:[],lore:"Literally terfenadine's safer metabolite — the withdrawal that produced its own replacement. Grapefruit and apple juice reduce absorption via OATP transporters: breakfast matters."},
{id:"epi",n:"Epinephrine",b:"EpiPen",y:1901,a:"IMMUNO",cls:"Adrenergic agonist",moa:"α₁ vasoconstriction + β₁ cardiac + β₂ bronchodilation — reverses anaphylaxis physiology",tg:"α₁, β₁, β₂",rt:"IM",hl:0.03,F:0,eff:10,saf:5,mkt:0.5,syn:3,r:"LEGEND",inds:["Anaphylaxis","Cardiac arrest","Severe asthma","Croup (nebulized)"],alt:[],cyp:"",tags:[],lore:"Jokichi Takamine isolated 'adrenaline' in 1901 — the first hormone ever purified. If you're wondering whether to give it, you give it. Mylan's 609% EpiPen price hike wrote its own scandal."},
{id:"cyclosporine",n:"Cyclosporine",b:"Sandimmune",y:1983,a:"IMMUNO",cls:"Calcineurin inhibitor",moa:"Cyclophilin binding → calcineurin blocked → IL-2 transcription silenced",tg:"calcineurin/NFAT",rt:"PO",hl:8.5,F:30,eff:9,saf:3,mkt:1,syn:7,r:"LEGEND",inds:["Transplant rejection prophylaxis","Psoriasis","Dry eye"],alt:[],cyp:"3A4",tags:["immunosupp","nephrotoxic","cyp3a4_sub"],lore:"Sandoz sample 24-556, from Norwegian mountain soil, nearly discarded twice. Transplant surgery's great unlock: organs stopped being death sentences. Nephrotoxicity is the permanent tax."},
{id:"sirolimus",n:"Sirolimus",b:"Rapamune",y:1999,a:"IMMUNO",cls:"mTOR inhibitor",moa:"FKBP12 complex inhibits mTORC1 — blocks IL-2 driven proliferation",tg:"mTORC1",rt:"PO",hl:62,F:14,eff:8,saf:5,mkt:0.8,syn:8,r:"EPIC",inds:["Transplant immunosuppression","Drug-eluting stents","LAM (rare lung disease)"],alt:["Longevity research (rapamycin)"],cyp:"3A4",tags:["immunosupp","cyp3a4_sub"],lore:"Found in Easter Island (Rapa Nui) soil — Streptomyces hygroscopicus, 1965. Named mTOR's discovery after it. Now darling of geroscience: the drug that extends mouse lifespan."},

// ===== RESPIRATORY =====
{id:"salbu",n:"Salbutamol",b:"Ventolin",y:1969,a:"RESPI",cls:"Short-acting β₂ agonist",moa:"β₂ Gs signaling relaxes airway smooth muscle within minutes",tg:"β₂ receptor",rt:"INH",hl:5,F:15,eff:8,saf:7,mkt:2,syn:4,r:"EPIC",inds:["Acute asthma","Exercise-induced bronchospasm","COPD reliever"],alt:[],cyp:"",tags:[],lore:"Allen & Hanburys' β₂-selective breakthrough ended adrenaline's reign in asthma. Using it >twice weekly is a formal marker of undertreated disease — the inhaler as symptom meter."},
{id:"formo",n:"Formoterol",b:"Foradil / in combos",y:2001,a:"RESPI",cls:"LABA (fast onset)",moa:"Full β₂ agonist with LABA duration AND SABA-like speed — unique duality",tg:"β₂ receptor",rt:"INH",hl:10,F:45,eff:8,saf:7,mkt:0.8,syn:5,r:"RARE",inds:["Asthma (with ICS)","COPD maintenance"],alt:[],cyp:"",tags:[],lore:"Onset in 1–3 minutes unlike salmeterol's 15 — enabling SMART therapy: one inhaler for both reliever and controller, proven to cut exacerbations and deaths."},
{id:"budesonide",n:"Budesonide",b:"Pulmicort / Entocort",y:1981,a:"RESPI",cls:"Inhaled corticosteroid",moa:"Local GR activation; 90% first-pass metabolism makes swallowed fraction harmless",tg:"GR (local)",rt:"INH",hl:3,F:30,eff:8,saf:8,mkt:1.5,syn:5,r:"RARE",inds:["Asthma controller","COPD (with formoterol)","Crohn's ileitis (Entocort)"],alt:[],cyp:"3A4",tags:["steroid"],lore:"Swedish Draco engineering: steroid potency with systemic silence. The same molecule treats asthma by inhaler and Crohn's by capsule — formulation as pharmacology."},
{id:"tiotropium",n:"Tiotropium",b:"Spiriva",y:2004,a:"RESPI",cls:"LAMA",moa:"M₃ receptor blockade lasting >24h — kinetic rebinding is the secret",tg:"M₃ receptor",rt:"INH",hl:144,F:19,eff:8,saf:8,mkt:3,syn:6,r:"RARE",inds:["COPD maintenance","Asthma add-on"],alt:[],cyp:"",tags:[],lore:"Boehringer's dry-powder HandiHaler made once-daily COPD real. UPLIFT confirmed the decline slows; the device was as much invention as the molecule."},
{id:"theo",n:"Theophylline",b:"Theo-Dur",y:1922,a:"RESPI",cls:"Methylxanthine",moa:"PDE inhibition + adenosine antagonism; narrow index demands serum levels",tg:"PDE / adenosine",rt:"PO",hl:8,F:100,eff:6,saf:3,mkt:0.1,syn:3,r:"RARE",inds:["COPD (third-line)","Asthma (where cheap matters)"],alt:[],cyp:"1A2",tags:["pgx"],lore:"Extracted from tea a century ago. Smokers clear it twice as fast; ciprofloxacin doubles it. Superseded everywhere except the economics of global health."},
{id:"monte",n:"Montelukast",b:"Singulair",y:1998,a:"RESPI",cls:"Leukotriene antagonist",moa:"CysLT1 receptor blockade — the pill for exercise- and allergen-triggered asthma",tg:"CysLT1",rt:"PO",hl:5,F:65,eff:6,saf:7,mkt:2,syn:7,r:"COMMON",inds:["Asthma (add-on)","Exercise-induced bronchospasm","Allergic rhinitis"],alt:[],cyp:"2C9",tags:[],lore:"Merck's leukotriene bet paid off until the 2020 boxed warning for neuropsychiatric events — dreams, agitation, rare despair. A decade of signals finally converged."},
{id:"ivacaftor",n:"Ivacaftor",b:"Kalydeco",y:2012,a:"RESPI",cls:"CFTR potentiator",moa:"Holds defective G551D channels open longer — function restored, not just symptoms",tg:"CFTR (G551D)",rt:"PO",hl:12,F:25,eff:9,saf:7,mkt:1,syn:7,r:"EPIC",inds:["CF with gating mutations (~4%)"],alt:[],cyp:"3A4",tags:[],lore:"Vertex's $300k/year precision medicine: the first drug treating a CF genetic CAUSE. FEV₁ improved within weeks — mutation-specific therapy became real."},
{id:"trikafta",n:"Elexacaftor/Tez/Iva",b:"Trikafta",y:2019,a:"RESPI",cls:"Triple CFTR modulator",moa:"Corrector + corrector + potentiator: folding fixed AND gates held open",tg:"CFTR (F508del)",rt:"PO",hl:25,F:25,eff:10,saf:7,mkt:9,syn:8,r:"LEGEND",inds:["CF — ~90% of patients"],alt:[],cyp:"3A4",tags:[],lore:"$322k/year for a triple combo that effectively normalizes CFTR function. Median cystic fibrosis life expectancy doubled in a generation — Vertex's moat and medicine both historic."},

// ===== GASTROENTEROLOGY =====
{id:"omepra",n:"Omeprazole",b:"Losec / Prilosec",y:1988,a:"GI",cls:"Proton pump inhibitor",moa:"Irreversibly binds gastric H⁺/K⁺-ATPase — acid secretion stops until new pumps",tg:"H⁺/K⁺-ATPase",rt:"PO",hl:1,F:40,eff:8,saf:7,mkt:3,syn:5,r:"EPIC",inds:["GERD","Peptic ulcer","H. pylori regimens","Zollinger-Ellison"],alt:[],cyp:"2C19",tags:[],lore:"Astra Hässle's acid-labile enteric pellets solved a formulation nightmare. Plasma half-life of an hour, acid suppression for a day — irreversible binding is the whole trick. Rebound hyperacidity greets abrupt stops."},
{id:"esome",n:"Esomeprazole",b:"Nexium",y:2000,a:"GI",cls:"PPI (enantiomer)",moa:"The S-enantiomer of omeprazole, with slightly less variable metabolism",tg:"H⁺/K⁺-ATPase",rt:"PO",hl:1.3,F:64,eff:8,saf:7,mkt:5,syn:5,r:"RARE",inds:["GERD","Erosive esophagitis healing"],alt:[],cyp:"2C19",tags:[],lore:"The purple pill: patent evergreening's most profitable case study — a single enantiomer launch timed to Losec's expiry, marketed with a $500M campaign. Clinically modest, commercially legendary."},
{id:"famo",n:"Famotidine",b:"Pepcid",y:1985,a:"GI",cls:"H₂ antagonist",moa:"Competitive histamine H₂ blockade on parietal cells — 30× cimetidine's potency",tg:"H₂ receptor",rt:"PO",hl:3,F:45,eff:7,saf:8,mkt:0.5,syn:4,r:"COMMON",inds:["Heartburn","Ulcer","GERD (breakthrough)"],alt:[],cyp:"",tags:[],lore:"The quiet survivor: when ranitidine fell to NDMA recalls, famotidine inherited the shelf. No meaningful CYP interactions — the anti-cimetidine in every way that matters."},
{id:"raniti",n:"Ranitidine",b:"Zantac",y:1981,a:"GI",cls:"H₂ antagonist (WITHDRAWN)",moa:"H₂ blockade — until NDMA impurity chemistry intervened",tg:"H₂ receptor",rt:"PO",hl:2.5,F:50,eff:7,saf:4,mkt:0,syn:4,r:"BANNED",inds:["(Withdrawn 2020)"],alt:[],cyp:"",tags:[],lore:"World's best-selling drug by 1988 — Glaxo's foundation. Then ranitidine molecules were found degrading into NDMA, a probable carcinogen, especially with heat and time. Market withdrawal, 2020."},
{id:"cimetidine",n:"Cimetidine",b:"Tagamet",y:1976,a:"GI",cls:"H₂ antagonist (first)",moa:"Histamine-competitive acid suppression; also a broad, weak CYP inhibitor",tg:"H₂ / CYP (weak)",rt:"PO",hl:2,F:70,eff:7,saf:6,mkt:0.2,syn:4,r:"RARE",inds:["Ulcer (historic)","Heartburn"],alt:[],cyp:"3A4",tags:["cyp3a4inh"],lore:"James Black's second Nobel-worthy molecule (after propranolol!) — the first drug designed by mechanism to sell $1B/year. Gynecomastia from anti-androgen effects surprised everyone; interactions defined an era."},
{id:"metoclop",n:"Metoclopramide",b:"Reglan",y:1964,a:"GI",cls:"Prokinetic antiemetic",moa:"D₂ antagonism centrally (antiemetic) + peripherally enhances motility",tg:"D₂ / 5-HT₄",rt:"PO",hl:5,F:80,eff:6,saf:4,mkt:0.3,syn:3,r:"RARE",inds:["Gastroparesis","Chemotherapy nausea (historic)","Post-op ileus"],alt:[],cyp:"2D6",tags:["eps"],lore:"Boxed warning for tardive dyskinesia beyond 12 weeks — one of few GI drugs wearing one. Diabetic stomachs empty again; movement disorders are the toll."},
{id:"ondan",n:"Ondansetron",b:"Zofran",y:1990,a:"GI",cls:"5-HT₃ antagonist",moa:"Blocks serotonin's emetic vagal & CTZ signaling — chemo vomiting finally tamed",tg:"5-HT₃ receptor",rt:"PO",hl:4,F:60,eff:8,saf:7,mkt:1.2,syn:5,r:"RARE",inds:["Chemotherapy-induced emesis","Post-operative nausea","Hyperemesis gravidarum"],alt:[],cyp:"2D6",tags:["qt"],lore:"Serotonin's role in emesis was heresy until it wasn't — cisplatin's cruelest side effect became manageable. Modest QT prolongation is the footnote pregnancy-safety data largely forgave."},
{id:"lopera",n:"Loperamide",b:"Imodium",y:1976,a:"GI",cls:"Antidiarrheal opioid",moa:"µ-agonism at the gut wall; P-gp efflux keeps it out of the brain at normal doses",tg:"MOR (peripheral)",rt:"PO",hl:10,F:40,eff:7,saf:6,mkt:0.4,syn:4,r:"COMMON",inds:["Acute diarrhea","Ileostomy output reduction"],alt:[],cyp:"3A4",tags:["opioid","qt"],lore:"An opioid designed to stay outside the skull — until megadose abuse broke the P-gp barrier and caused QT catastrophes. FDA warned in 2016; the gut keeps the secret at proper doses."},
{id:"disulf",n:"Disulfiram",b:"Antabuse",y:1948,a:"GI",cls:"ALDH2 inhibitor",moa:"Blocks aldehyde dehydrogenase — ethanol's toxic acetaldehyde accumulates brutally",tg:"ALDH2",rt:"PO",hl:60,F:80,eff:6,saf:5,mkt:0.05,syn:3,r:"RARE",inds:["Alcohol use disorder (deterrent)"],alt:[],cyp:"3A4",tags:["disulfiram"],lore:"Danish researchers testing it as an antiparasitic drank a toast at Carlsberg and got violently ill — the self-experiment that founded deterrent therapy. Mouthwash counts as drinking."},
];

const DRUG = {};
DRUGS.forEach(d=>DRUG[d.id]=d);

/* ------------------------------------------------------------
   SYNERGIES — positive combinations (evaluated per team)
   need: array of matchers [ ["id","x"] | ["tag","y"] ]
   ------------------------------------------------------------ */
const SYNERGIES = [
  {need:[["tag","acei"],["tag","betablocker"],["tag","mra"],["tag","sglt2"]],bonus:10,msg:"Four pillars of modern heart-failure therapy assembled (RAAS + BB + MRA + SGLT2)"},
  {need:[["id","budesonide"],["id","formoterol"]],bonus:7,msg:"SMART single-inhaler therapy (budesonide/formoterol) — proven to cut exacerbations"},
  {need:[["id","salbu"],["tag","steroid"]],bonus:5,msg:"Controller + reliever pairing: ICS with salbutamol"},
  {need:[["id","levodopa"],["id","carbidopa"]],boost:{src:"carbidopa",tgt:"levodopa",mult:1.6},msg:"Carbidopa blocks peripheral decarboxylation — levodopa dose requirement drops ~75%"},
  {need:[["id","riton"],["tag","art"]],boost:{src:"riton",tgt:"__first_tag_art__",mult:1.5},msg:"Ritonavir boosting: CYP3A4 inhibition raises partner antiretroviral exposure"},
  {need:[["id","isoniazid"],["id","rifamp"]],bonus:6,msg:"DOTS combination therapy — multidrug regimens prevent TB resistance"},
  {need:[["tag","art"],["tag","art"],["tag","art"]],bonus:8,msg:"Triple antiretroviral regimen — HAART builds the resistance wall"},
  {need:[["id","asp"],["id","clopi"]],bonus:5,msg:"Dual antiplatelet therapy (DAPT) — the ACS standard"},
  {need:[["id","clari"],["id","omepra"],["id","amox"]],bonus:8,msg:"Complete H. pylori triple therapy (PPI + clarithromycin + amoxicillin)"},
  {need:[["id","ritux"],["id","doxo"],["id","cyclo"],["id","vincr"]],bonus:10,msg:"R-CHOP assembled from components — the DLBCL curative regimen"},
  {need:[["id","tamsulosin"]],skip:true}, // placeholder removed
  {need:[["id","seleg"],["id","levodopa"]],bonus:4,msg:"Selegiline adjunct delays levodopa wearing-off"},
  {need:[["id","acetam"],["tag","nsaid"],["tag","opioid"]],bonus:6,msg:"Multimodal analgesia — opioid-sparing triple combination"},
  {need:[["id","methotrexate_x"]],skip:true},
];
SYNERGIES.forEach(s=>{ if(s.boost && s.boost.tgt==="__first_art__") s.boost.tgt="__first_tag_art__"; });

/* ------------------------------------------------------------
   INTERACTIONS — penalties (chart-global, split between owners)
   a/b: matcher arrays; dmg split evenly
   ------------------------------------------------------------ */
const INTERACTIONS = [
  {a:[["tag","cyp3a4inh"]],b:[["id","simva"]],dmg:9,msg:"CYP3A4 blocked → simvastatin exposure skyrockets → myopathy/rhabdomyolysis risk"},
  {a:[["tag","cyp3a4inh"]],b:[["id","atorva"]],dmg:6,msg:"CYP3A4 inhibition raises atorvastatin levels — monitor for myalgia"},
  {a:[["tag","cyp3a4_inh"]],b:[["tag","cyp3a4_sub"]],dmg:7,msg:"Strong CYP3A4 inhibition blocks substrate clearance → toxic accumulation / rhabdomyolysis / profound sedation"},
  {a:[["tag","cyp_ind"]],b:[["tag","cyp3a4_sub"]],dmg:6,msg:"Potent enzyme induction accelerates substrate breakdown → therapeutic failure"},
  {a:[["tag","cyp2d6_inh"]],b:[["tag","cyp2d6_sub"]],dmg:6,msg:"CYP2D6 inhibition blocks metabolic activation/clearance → clinical instability"},
  {a:[["tag","cyp3a4inh"]],b:[["id","terf"]],dmg:13,msg:"THE textbook catastrophe: ketoconazole-class inhibition + terfenadine → torsades. This exact pair got Seldane withdrawn"},
  {a:[["id","gtn"]],b:[["id","silde"]],dmg:14,msg:"Nitrate + PDE5 inhibitor → catastrophic hypotension. Absolutely contraindicated"},
  {a:[["id","gtn"]],b:[["id","tadala"]],dmg:14,msg:"Nitrate + PDE5 inhibitor → catastrophic hypotension. Absolutely contraindicated"},
  {a:[["id","dig"]],b:[["id","amio"]],dmg:9,msg:"Amiodarone doubles digoxin levels — classic toxicity setup"},
  {a:[["id","dig"]],b:[["id","furos"]],dmg:7,msg:"Furosemide's hypokalemia potentiates digoxin toxicity"},
  {a:[["id","lith"]],b:[["tag","nsaid"]],dmg:8,msg:"NSAIDs slash lithium renal clearance → lithium toxicity"},
  {a:[["id","lith"]],b:[["id","hctz"]],dmg:8,msg:"Thiazides + lithium: sodium loss drags lithium along — toxicity"},
  {a:[["id","lith"]],b:[["tag","acei"]],dmg:7,msg:"ACE inhibitors raise lithium levels"},
  {a:[["id","warf"]],b:[["id","tmpsmx"]],dmg:9,msg:"TMP-SMX spikes INR dramatically — bleeding risk"},
  {a:[["id","warf"]],b:[["tag","nsaid"]],dmg:7,msg:"Warfarin + NSAID: additive bleeding risk on GI mucosa"},
  {a:[["id","warf"]],b:[["tag","antiplatelet"]],dmg:7,msg:"Anticoagulant + antiplatelet — combined hemostasis sabotage"},
  {a:[["tag","anticoag"]],b:[["tag","nsaid"]],dmg:6,msg:"DOAC + NSAID — GI bleeding risk stacks"},
  {a:[["id","mtx"]],b:[["tag","nsaid"]],dmg:6,msg:"NSAIDs reduce methotrexate clearance — marrow watch"},
  {a:[["id","mtx"]],b:[["id","tmpsmx"]],dmg:9,msg:"Methotrexate + TMP-SMX → pancytopenia (double antifolate strike)"},
  {a:[["id","allo"]],b:[["id","aza"]],dmg:8,msg:"Allopurinol blocks azathioprine metabolism → profound myelosuppression"},
  {a:[["id","theo"]],b:[["id","cipro"]],dmg:7,msg:"Ciprofloxacin doubles theophylline levels — seizures, arrhythmia"},
  {a:[["id","theo"]],b:[["id","clari"]],dmg:7,msg:"Clarithromycin raises theophylline into toxic range"},
  {a:[["id","gent"]],b:[["id","vanc"]],dmg:7,msg:"Aminoglycoside + vancomycin — synergistic nephrotoxicity"},
  {a:[["tag","ssri"]],b:[["id","trama"]],dmg:6,msg:"SSRI + tramadol → serotonin syndrome risk (plus seizure threshold)"},
  {a:[["tag","ssri"]],b:[["id","suma"]],dmg:4,msg:"SSRI + triptan — mild serotonin excess (monitor)"},
  {a:[["tag","ssri"]],b:[["id","linez"]],dmg:7,msg:"Linezolid is a weak MAOI — with an SSRI, serotonin syndrome is documented"},
  {a:[["tag","maoi"]],b:[["tag","serotonergic"]],dmg:10,msg:"MAOI + serotonergic agent → serotonin syndrome (autonomic storm)"},
  {a:[["tag","opioid"]],b:[["tag","benzo"]],dmg:8,msg:"Opioid + benzodiazepine → respiratory depression (boxed warning)"},
  {a:[["tag","acei"]],b:[["id","spiro"]],dmg:6,msg:"ACEi + spironolactone → hyperkalemia watch"},
  {a:[["tag","arb"]],b:[["id","spiro"]],dmg:6,msg:"ARB + spironolactone → hyperkalemia watch"},
  {a:[["tag","acei"]],b:[["id","tmpsmx"]],dmg:7,msg:"TMP-SMX (trimethoprim = amiloride-like) + ACEi → dangerous hyperkalemia"},
  {a:[["tag","nsaid"]],b:[["tag","acei"]],b2:[["tag","diuretic"]],dmg:8,trio:true,msg:"The 'triple whammy': NSAID + ACE inhibitor + diuretic → acute kidney injury"},
  {a:[["tag","hepatotoxic"]],b:[["tag","hepatotoxic"]],dmg:4,cap:8,msg:"Stacked hepatotoxins — liver burden accumulates"},
  {a:[["tag","qt"]],b:[["tag","qt"]],dmg:4,cap:12,msg:"QT-prolonging agents stack → torsades risk climbs"},
  {a:[["tag","anticholinergic"]],b:[["tag","anticholinergic"]],dmg:4,msg:"Double anticholinergic burden → confusion, urinary retention, delirium"},
  {a:[["tag","steroid"]],b:[["tag","nsaid"]],dmg:4,msg:"Corticosteroid + NSAID — peptic ulcer risk multiplies"},
  {a:[["id","pheny"]],b:[["id","valpro"]],dmg:5,msg:"Valproate displaces phenytoin from proteins — free level surges"},
];

/* ------------------------------------------------------------
   CLINICAL CASES (Arena)
   key: substring matched against drug.inds for primary match
   pref: [{ids?,tags?,cls?,mult,why}] preferred classes
   avoid:[{ids?,tags?,mult,penalty?,why}]
   req: team must include ≥1 of these ids or capped
   ------------------------------------------------------------ */
const CASES = [
  {id:"htn",ind:"Hypertension, Stage 2",area:"CARDIO",ca:"#ff5470",sev:1,key:"hypertension",
   pref:[{ids:["lisin","capt","losartan","entresto"],mult:1.15,why:"RAAS blockade — guideline anchor"},{ids:["amlod"],mult:1.15,why:"First-line calcium channel blocker"},{ids:["hctz"],mult:1.1,why:"Thiazide — proven outcomes"},{tags:["betablocker"],mult:1.0,why:"Beta-blockade"}]},
  {id:"acs",ind:"Acute Coronary Syndrome (NSTEMI)",area:"CARDIO",ca:"#ff5470",sev:3,key:"MI",
   pref:[{tags:["antiplatelet"],mult:1.2,why:"Antiplatelet core of ACS care"},{tags:["statin3a4"],mult:1.15,why:"High-intensity statin"},{ids:["prop"],mult:1.05,why:"Beta-blockade"},{ids:["gtn"],mult:1.0,why:"Antianginal relief"}],
   avoid:[{tags:["nsaid"],mult:0.3,penalty:4,why:"NSAIDs are contraindicated post-MI"}]},
  {id:"hfref",ind:"Heart Failure (HFrEF, NYHA III)",area:"CARDIO",ca:"#ff5470",sev:2,key:"heart failure",
   pref:[{ids:["entresto","lisin","capt","losartan"],mult:1.15,why:"RAAS pillar"},{tags:["betablocker"],mult:1.1,why:"Beta-blocker pillar"},{ids:["spiro"],mult:1.1,why:"MRA pillar"},{ids:["empa"],mult:1.15,why:"SGLT2 pillar"},{ids:["furos"],mult:0.9,why:"Congestion relief (symptomatic)"}],
   avoid:[{ids:["verapamil_x"],mult:1},{tags:["nsaid"],mult:0.4,penalty:3,why:"NSAIDs worsen HF fluid retention"}]},
  {id:"af",ind:"Atrial Fibrillation — Stroke Prevention",area:"CARDIO",ca:"#ff5470",sev:2,key:"atrial fibrillation",
   pref:[{tags:["anticoag"],mult:1.25,why:"Anticoagulation is THE intervention"},{ids:["dig"],mult:0.9,why:"Rate control (older agent)"},{tags:["betablocker"],mult:1.0,why:"Rate control"}],
   avoid:[{tags:["nsaid"],mult:0.4,penalty:3,why:"NSAIDs raise bleed & stroke risk in AF"}]},
  {id:"t2dm",ind:"Type 2 Diabetes — Uncontrolled",area:"METAB",ca:"#ffb020",sev:1,key:"type 2 diabetes",
   pref:[{ids:["metf"],mult:1.2,why:"Metformin remains first-line"},{ids:["sema"],mult:1.15,why:"GLP-1 RA — weight & CV benefit"},{ids:["empa"],mult:1.15,why:"SGLT2 — cardiorenal benefit"},{ids:["glipi"],mult:0.85,why:"Sulfonylurea — effective, hypoglycemia"},{ids:["insulin"],mult:1.0,why:"Insulin therapy"}]},
  {id:"cap",ind:"Community-Acquired Pneumonia",area:"INFECT",ca:"#2fd6a5",sev:2,key:"pneumonia",
   pref:[{ids:["amox","augm"],mult:1.15,why:"Beta-lactam coverage of S. pneumoniae"},{ids:["azith"],mult:1.1,why:"Atypical coverage (macrolide)"},{ids:["doxy"],mult:1.05,why:"Alternative atypical coverage"},{ids:["levofloxacin_x"],mult:1}]},
  {id:"mrsa",ind:"MRSA Bacteremia",area:"INFECT",ca:"#2fd6a5",sev:3,key:"MRSA",
   pref:[{ids:["vanc"],mult:1.25,why:"Vancomycin — the MRSA workhorse"},{ids:["linez"],mult:1.2,why:"Oxazolidinone alternative"}],
   avoid:[{ids:["amox","augm","peng"],mult:0.25,penalty:3,why:"MRSA resists beta-lactams — PBPs altered"}]},
  {id:"tb",ind:"Active Pulmonary Tuberculosis",area:"INFECT",ca:"#2fd6a5",sev:2,key:"tuberculosis",
   pref:[{ids:["inh"],mult:1.2,why:"INH — RIPE backbone"},{ids:["rifamp"],mult:1.2,why:"Rifampin — RIPE backbone"}],
   special:"tb_mono"},
  {id:"hiv",ind:"Newly Diagnosed HIV",area:"INFECT",ca:"#2fd6a5",sev:2,key:"HIV",
   pref:[{tags:["art"],mult:1.0,why:"Antiretroviral therapy"}],
   special:"haart"},
  {id:"hcv",ind:"Chronic Hepatitis C",area:"INFECT",ca:"#2fd6a5",sev:2,key:"hepatitis c",
   pref:[{ids:["sof"],mult:1.5,why:"Direct-acting antiviral — curative era"},{ids:["interferon_ghost"],mult:1}],
   special:"cure_hcv"},
  {id:"malaria",ind:"Falciparum Malaria",area:"INFECT",ca:"#2fd6a5",sev:2,key:"malaria",
   pref:[{ids:["artem"],mult:1.25,why:"Artemisinin — rapid parasite clearance"},{ids:["prim"],mult:0.9,why:"Radical cure role (vivax)"}],
   avoid:[{ids:["hcq"],mult:0.5,penalty:2,why:"Chloroquine resistance widespread in falciparum"}]},
  {id:"mdd",ind:"Major Depressive Disorder",area:"NEURO",ca:"#a78bfa",sev:1,key:"depression",
   pref:[{tags:["ssri"],mult:1.15,why:"SSRI — first-line"},{ids:["amitrip"],mult:0.95,why:"Effective, harsher tolerability"},{ids:["ketam"],mult:1.0,why:"Rapid-acting option (TRD)"},{ids:["lith"],mult:0.9,why:"Augmentation strategy"}],
   avoid:[{tags:["maoi"],mult:0.85,penalty:2,why:"MAOIs reserved — diet & drug landmines"}]},
  {id:"trs",ind:"Treatment-Resistant Schizophrenia",area:"NEURO",ca:"#a78bfa",sev:2,key:"schizophrenia",
   pref:[{ids:["cloza"],mult:1.35,why:"Clozapine — the ONLY agent proven for TRS"},{ids:["arip","halo"],mult:0.8,why:"Already failed two adequate trials"},{ids:["diaze"],mult:0.6,why:"Adjunct sedation only"}]},
  {id:"gtcs",ind:"Generalized Tonic-Clonic Epilepsy",area:"NEURO",ca:"#a78bfa",sev:2,key:"seizures",
   pref:[{ids:["valpro"],mult:1.2,why:"Broad-spectrum efficacy"},{ids:["levetiracetam_x"],mult:1},{ids:["lamotr"],mult:1.05,why:"Well tolerated long-term"},{ids:["carba"],mult:1.1,why:"Solid efficacy"},{ids:["pheny"],mult:0.95,why:"Old guard, narrow index"}]},
  {id:"asthma",ind:"Acute Severe Asthma",area:"RESPI",ca:"#35d6e8",sev:3,key:"asthma",
   pref:[{ids:["salbu"],mult:1.25,why:"SABA — the acute reliever"},{ids:["formo"],mult:1.15,why:"Fast LABA"},{ids:["budesonide"],mult:1.1,why:"ICS — inflammation"},{ids:["tiotropium"],mult:0.9,why:"Add-on bronchodilation"},{ids:["theo"],mult:0.85,why:"Legacy third-line"},{ids:["monte"],mult:0.9,why:"Modest add-on"},{ids:["pred"],mult:1.05,why:"Systemic steroid burst"}]},
  {id:"anaph",ind:"Anaphylaxis",area:"IMMUNO",ca:"#4da3ff",sev:3,key:"anaphylaxis",
   pref:[{ids:["epi"],mult:2.0,why:"Epinephrine IM — the ONLY first-line drug"},{ids:["diph"],mult:0.3,why:"Adjunct only — never delays epi"},{ids:["fexo"],mult:0.3,why:"Adjunct only"},{ids:["pred"],mult:0.3,why:"Late-phase adjunct"},{ids:["salbu"],mult:0.6,why:"Bronchospasm adjunct"}],
   req:["epi"]},
  {id:"ood",ind:"Opioid Overdose",area:"NEURO",ca:"#a78bfa",sev:3,key:"overdose",
   pref:[{ids:["nalox"],mult:2.5,why:"Naloxone — competitive reversal"},{ids:["diaze"],mult:0.5,why:"Supportive if mixed ingestion"}],
   req:["nalox"],
   avoid:[{tags:["opioid"],mult:0.1,penalty:6,why:"Adding an opioid to an opioid overdose?!"}]},
  {id:"pain",ind:"Postoperative Pain (moderate-severe)",area:"NEURO",ca:"#a78bfa",sev:1,key:"pain",
   pref:[{tags:["opioid"],mult:1.1,why:"Opioid — titrated"},{ids:["acetam"],mult:1.05,why:"Multimodal base"},{tags:["nsaid"],mult:1.05,why:"Multimodal base"}],
   special:"multi_pain"},
  {id:"raflare",ind:"Rheumatoid Arthritis Flare",area:"IMMUNO",ca:"#4da3ff",sev:2,key:"arthritis",
   pref:[{ids:["mtx"],mult:1.2,why:"Methotrexate — the anchor drug"},{tags:["nsaid"],mult:1.0,why:"Symptomatic bridge"},{ids:["pred"],mult:1.0,why:"Bridge therapy"},{ids:["hcq"],mult:0.9,why:"Conventional DMARD"},{ids:["humira"],mult:1.05,why:"Biologic escalation"}]},
  {id:"gout",ind:"Acute Gout Flare",area:"METAB",ca:"#ffb020",sev:2,key:"gout",
   pref:[{tags:["nsaid"],mult:1.2,why:"NSAID — first-line for flare"},{ids:["pred"],mult:1.15,why:"Steroid — equally first-line"}],
   avoid:[{ids:["allo"],mult:0.15,penalty:4,why:"Never START allopurinol during an acute flare — urate mobilization worsens it"}]},
  {id:"gerd",ind:"Severe GERD (erosive)",area:"GI",ca:"#b8e34d",sev:1,key:"GERD",
   pref:[{ids:["omepra","esome"],mult:1.25,why:"PPI — superior acid control"},{ids:["famo"],mult:0.9,why:"H₂RA — weaker healing rates"},{ids:["cimetidine"],mult:0.85,why:"Historic option, interaction baggage"}]},
  {id:"obesity",ind:"Obesity with Prediabetes",area:"METAB",ca:"#ffb020",sev:1,key:"obesity",
   pref:[{ids:["sema"],mult:1.3,why:"Semaglutide (Wegovy) — ~15% weight loss"},{ids:["metf"],mult:1.0,why:"Modest, metabolic bonus"},{ids:["orli"],mult:0.8,why:"Modest efficacy, GI theatrics"}]},
  {id:"cf",ind:"Cystic Fibrosis (G551D/F508del)",area:"RESPI",ca:"#35d6e8",sev:2,key:"cystic fibrosis",
   pref:[{ids:["trikafta"],mult:1.45,why:"Triple modulator — near-normal CFTR"},{ids:["ivacaftor"],mult:1.4,why:"Potentiator — precision medicine"}],
   avoid:[{ids:["theo"],mult:0.3,penalty:2,why:"Supportive-only era has passed"}]},
  {id:"cml",ind:"Chronic Myeloid Leukemia",area:"ONCO",ca:"#ee5fc4",sev:2,key:"leukemia",
   pref:[{ids:["imatinib"],mult:1.5,why:"Imatinib — transformed CML into a chronic condition"},{ids:["hydroxyurea"],mult:0.4,why:"Cytoreductive bridge only"}]},
  {id:"her2bc",ind:"HER2+ Breast Cancer",area:"ONCO",ca:"#ee5fc4",sev:2,key:"breast cancer",
   pref:[{ids:["trast"],mult:1.3,why:"Anti-HER2 backbone"},{ids:["pacli"],mult:1.0,why:"Taxane partner"},{ids:["doxo"],mult:0.9,why:"Effective but cardiotoxic with trastuzumab"},{ids:["tamox"],mult:0.7,why:"Endocrine route if HR+"}]},
  {id:"melanoma",ind:"Metastatic Melanoma",area:"ONCO",ca:"#ee5fc4",sev:3,key:"melanoma",
   pref:[{ids:["pembro"],mult:1.25,why:"Anti-PD-1 — durable responses"}]},
  {id:"dlbcl",ind:"Diffuse Large B-Cell Lymphoma",area:"ONCO",ca:"#ee5fc4",sev:3,key:"lymphoma",
   pref:[{ids:["ritux"],mult:1.3,why:"Rituximab — R in R-CHOP"},{ids:["doxo"],mult:1.1,why:"H in CHOP"},{ids:["cyclo"],mult:1.05,why:"C in CHOP"},{ids:["vincr"],mult:1.05,why:"O in CHOP"},{ids:["pred"],mult:1.0,why:"P in CHOP"}],
   special:"rchop"},
  {id:"brcaov",ind:"BRCA+ Ovarian Cancer",area:"ONCO",ca:"#ee5fc4",sev:2,key:"ovarian",
   pref:[{ids:["olaparib"],mult:1.3,why:"PARPi — synthetic lethality exploited"},{ids:["cispl"],mult:1.1,why:"Platinum sensitivity"},{ids:["pacli"],mult:1.0,why:"Standard cytotoxic"}]},
  {id:"sickle",ind:"Sickle Cell Crisis",area:"ONCO",ca:"#ee5fc4",sev:2,key:"sickle",
   pref:[{ids:["hydroxyurea"],mult:1.2,why:"HbF induction — fewer crises"},{tags:["opioid"],mult:1.1,why:"Aggressive analgesia is appropriate here"},{tags:["nsaid"],mult:0.9,why:"Multimodal support"}]},
  {id:"hypothy",ind:"Overt Hypothyroidism",area:"METAB",ca:"#ffb020",sev:1,key:"hypothyroid",
   pref:[{ids:["levo"],mult:1.5,why:"Levothyroxine — simple replacement"}],
   avoid:[{ids:["metf"],mult:0.3,penalty:2,why:"Wrong organ system entirely"}]},
  {id:"migraine",ind:"Acute Migraine",area:"NEURO",ca:"#a78bfa",sev:1,key:"migraine",
   pref:[{ids:["suma"],mult:1.3,why:"Triptan — mechanism-targeted abortive"},{tags:["nsaid"],mult:1.0,why:"Evidence-based abortive"},{ids:["prop"],mult:0.8,why:"That's prophylaxis, not acute care"}],
   avoid:[{tags:["opioid"],mult:0.5,penalty:2,why:"Opioids worsen chronification in headache"}]},
];

/* modifiers pool */
const MODS = [
  {id:"renal",label:"Renal impairment (eGFR 28)",frag:1.3,hit:["nephrotoxic","renal_clear"],note:"Renally-cleared drugs accumulate; nephrotoxins doubly risky"},
  {id:"hepatic",label:"Hepatic impairment (Child-Pugh B)",frag:1.3,hit:["hepatotoxic","cyp3a4_sub"],note:"Hepatically-metabolised drugs linger; CYP3A4 substrates accumulate"},
  {id:"elderly",label:"Elderly patient (84 yo)",frag:1.2,hit:["anticholinergic","sedating","hypoglycemia"],note:"Beers criteria territory: anticholinergics, sedatives, hypoglycemics"},
  {id:"pregnant",label:"Pregnant (12 weeks)",frag:1.25,hit:["teratogen"],note:"Teratogens are catastrophic; ACEi/ARB fetotoxic in later pregnancy"},
  {id:"pediatric",label:"Pediatric patient (6 yo)",frag:1.15,hit:["tetracycline"],note:"Dosing forms matter; tetracyclines stain teeth"},
  {id:"qt",label:"Long QT history",frag:1.2,hit:["qt"],note:"Any further QT prolongation invites torsades"},
  {id:"bleeder",label:"GI bleed last year",frag:1.25,hit:["anticoag","antiplatelet","nsaid"],note:"Hemostasis already on thin ice"},
  {id:"g6pd",label:"G6PD deficiency",frag:1.1,hit:["oxidative"],note:"Oxidative drugs trigger hemolysis (primaquine!)"},
  {id:"cyp2d6pm",label:"CYP2D6 poor metabolizer",frag:1.0,hit:["cyp2d6_sub"],note:"2D6-dependent prodrugs & substrates underperform or cause unexpected tox"},
  {id:"asa_asthma",label:"Aspirin-sensitive asthma",frag:1.15,hit:["nsaid"],note:"NSAIDs can precipitate severe bronchospasm"},
];

/* ------------------------------------------------------------
   DECK ARCHETYPES (Arena)
   ------------------------------------------------------------ */
const ARCHETYPES = [
  {id:"codeblue",name:"Code Blue",icon:"i-zap",c:"#ff5470",desc:"Emergency essentials. Fast answers for chaos — carries its own bleeding hazard.",
   cards:["epi","nalox","salbu","amio","apixa","asp","gtn","furos","pred","diph","diaze","acetam"]},
  {id:"heartvessels",name:"Heart & Vessels",icon:"i-heart",c:"#ff5470",desc:"Cardiology deep bench. Contains digoxin AND amiodarone — handle with respect.",
   cards:["atorva","simva","lisin","losartan","amlod","prop","spiro","empa","dig","amio","warf","entresto"]},
  {id:"microbe",name:"Bug Hunters",icon:"i-bug",c:"#2fd6a5",desc:"Anti-infective arsenal spanning bacteria, fungi, viruses — and one TB timebomb.",
   cards:["amox","augm","vanc","linez","azith","cipro","doxy","metro","tmpsmx","fluco","aciclo","tenofo"]},
  {id:"mindmatters",name:"Mind Matters",icon:"i-brain",c:"#a78bfa",desc:"Psychiatry & neurology. Serotonin syndrome and lithium landmines included.",
   cards:["sertra","fluox","lith","cloza","halo","arip","diaze","trama","seleg","levodopa","donep","suma"]},
  {id:"precisiononc",name:"Precision Oncology",icon:"i-target",c:"#ee5fc4",desc:"Targeted therapy era. Methotrexate ships with its own leucovorin antidote.",
   cards:["imatinib","osimert","olaparib","pembro","trast","ritux","doxo","pacli","cispl","mtx","ondan","pred"]},
  {id:"metabolic",name:"Metabolic Engines",icon:"i-drop",c:"#ffb020",desc:"Diabetes, thyroid, lipids, gout — plus the allopurinol flare trap.",
   cards:["metf","sema","empa","glipi","insulin","levo","rosuva","atorva","allo","orli","fina","spiro"]},
  {id:"airways",name:"Airways & Allergy",icon:"i-lung",c:"#35d6e8",desc:"Respiratory mastery with the SMART combo built in. NSAIDs welcome (carefully).",
   cards:["salbu","formo","budesonide","tiotropium","theo","monte","epi","diph","fexo","pred","acetam","ibu"]},
  {id:"wildcards",name:"Wildcard Ward Round",icon:"i-spark",c:"#ffd166",desc:"Twelve random compounds. Chaos is a valid clinical strategy.",random:true},
];

/* ------------------------------------------------------------
   CAMPAIGN EVENTS
   ------------------------------------------------------------ */
const EVENTS = [
  {id:"breakthrough",w:6,label:"Breakthrough Therapy Designation",kind:"ok",
   run:C=>{C.data+=15;C.gateBonus=10;return "FDA grants Breakthrough Therapy designation. +15 Data, next development gate +10% success."}},
  {id:"crl",w:8,label:"Complete Response Letter",kind:"bad",cond:C=>C.pipe.some(p=>p.stage>=3)||C.mkt.length>0,
   run:C=>{
     const t=C.pipe.filter(p=>p.stage>=3)[0]||null;
     if(t){t.pen=(t.pen||0)-8;return "FDA issues a Complete Response Letter on "+DRUG[t.id].n+". Next gate −8%.";}
     C.cash-=10;return "Legal & consulting fees around a regulatory query: −$10M.";}},
  {id:"competitor",w:8,label:"Competitor Launch",kind:"bad",cond:C=>C.mkt.length>0,
   run:C=>{const m=pick(C.mkt);m.share=Math.max(6,m.share-6);return pick(RIVALS)+" launches a me-too rival in "+AREAS[DRUG[m.id].a].label+". Your share −6pts."}},
  {id:"patentfight",w:6,label:"Patent Challenge",kind:"warn",cond:C=>C.mkt.some(m=>m.patent>2),
   run:C=>({choices:[
     {label:"Fight it in court",sub:"−$25M, keep patents",val:"fight"},
     {label:"Settle & license",sub:"lose 3 patent years",val:"settle"}],
     title:"Patent challenge!",
     body:"A generics giant files an Paragraph-IV challenge against your franchise. How do you respond?",
     apply:(C,v)=>{const m=C.mkt.find(x=>x.patent>2);
       if(v==="fight"){C.cash-=25;return "Legal team earns their retainer. Patent upheld. −$25M.";}
       if(m)m.patent=Math.max(0,m.patent-3);return "You settle. Three exclusivity years gone.";}})},
  {id:"scandal",w:6,label:"Pricing Scandal",kind:"bad",cond:C=>C.mkt.some(m=>m.price==="prem"),
   run:C=>{C.cash-=30;C.rep=Math.max(0,C.rep-6);return "Congress notices your premium pricing. Fine & reputational damage: −$30M, −6 Rep."}},
  {id:"safety",w:6,label:"Safety Signal",kind:"bad",cond:C=>C.mkt.some(m=>DRUG[m.id].saf<=5),
   run:C=>{const m=C.mkt.find(x=>DRUG[x.id].saf<=5);m.revMod=(m.revMod||1)*0.75;
     return "Post-market signal on "+DRUG[m.id].n+": boxed warning added. Revenue −25%."}},
  {id:"grant",w:5,label:"NIH Grant Windfall",kind:"ok",
   run:C=>{C.cash+=25;return "A translational research grant lands: +$25M."}},
  {id:"pr",w:5,label:"Viral PR Moment",kind:"ok",
   run:C=>{C.rep=Math.min(100,C.rep+6);return "Your CSO's conference talk goes viral. +6 Reputation."}},
  {id:"supply",w:6,label:"Supply Chain Disruption",kind:"warn",cond:C=>C.mkt.length>0,
   run:C=>({choices:[
     {label:"Air-freight & fix it",sub:"−$15M",val:"fix"},
     {label:"Let one product go offline",sub:"miss a year of revenue",val:"offline"}],
     title:"Manufacturing disruption",
     body:"A CMO batch failure interrupts supply. The plant is down for a year unless you pay for expedited remediation.",
     apply:(C,v)=>{if(v==="fix"){C.cash-=15;return "Remediation complete. −$15M, no interruption.";}
       const m=pick(C.mkt);m.offline=1;return DRUG[m.id].n+" goes offline for a year.";}})},
  {id:"poached",w:5,label:"Investigator Poached",kind:"bad",cond:C=>C.data>=15,
   run:C=>{C.data-=15;return "A star investigator leaves for Big Pharma. −15 Data."}},
  {id:"voucher",w:4,label:"Priority Review Voucher",kind:"ok",
   run:C=>{C.costBonus=0.75;return "FDA priority-review voucher acquired: next development gate costs −25%."}},
  {id:"lawsuit",w:5,label:"IP Lawsuit Settled",kind:"bad",cond:C=>C.cash>=18,
   run:C=>{C.cash-=18;return "An IP dispute settles quietly: −$18M."}},
  {id:"award",w:5,label:"Industry Award",kind:"ok",
   run:C=>{C.rep=Math.min(100,C.rep+4);C.data+=8;return "Pipeline of the Year award: +4 Rep, +8 Data."}},
  {id:"cmo",w:5,label:"CMO Partnership",kind:"ok",
   run:C=>{C.devDisc=(C.devDisc||1)*0.9;return "A manufacturing partnership cuts all future development costs by 10%."}},
];

const DILEMMAS = [
  {id:"compassion",title:"Compassionate use request",
   body:"A dying patient's physician requests your Phase III compound outside the trial. Compassionate access could set precedent.",
   choices:[
     {label:"Grant access",sub:"+5 Rep, −$8M program cost",val:"give"},
     {label:"Decline — protect the trial",sub:"−4 Rep",val:"deny"}],
   apply:(C,v)=>v==="give"?(C.rep=Math.min(100,C.rep+5),C.cash-=8,"Access granted. The story reaches the press — positively."):(C.rep=Math.max(0,C.rep-4),"Request declined. Advocacy groups note it.")},
  {id:"cro",title:"A faster CRO",
   body:"A contract research organization promises unusually fast enrollment. Their methods are... flexible.",
   choices:[
     {label:"Sign with them",sub:"+25 Data now, hidden scandal risk",val:"sign"},
     {label:"Stick with the rigorous ones",sub:"+1 Rep",val:"pass"}],
   apply:(C,v)=>{if(v!=="sign"){C.rep=Math.min(100,C.rep+1);return "Slow is smooth, smooth is fast. +1 Rep.";}
     C.data+=25;C.flags.croRisk=(C.flags.croRisk||0)+1;return "Data flows quickly. Perhaps too quickly...";}},
  {id:"buyout",title:"Buyout offer",
   body:"A large pharma offers $180M for your lead compound outright. Walk away rich, or see it through?",
   choices:[
     {label:"Sell the lead",sub:"+$180M, lose your most advanced compound",val:"sell"},
     {label:"Refuse",sub:"keep building",val:"keep"}],
   apply:(C,v)=>{if(v!=="keep")return "You kept building. The board approves.";
     const adv=C.pipe.slice().sort((a,b)=>b.stage-a.stage)[0];
     if(!adv)return "Nothing to sell — the offer expires.";
     C.pipe.splice(C.pipe.indexOf(adv),1);C.cash+=180;return DRUG[adv.id].n+" changes hands. +$180M.";}},
  {id:"whistle",title:"Whistleblower report",
   body:"An internal report alleges irregularities in a Phase II dataset. Audit quietly, or hope it stays buried?",
   choices:[
     {label:"Commission an audit",sub:"−$15M, clears the air",val:"audit"},
     {label:"Ignore it",sub:"risk later consequences",val:"ignore"}],
   apply:(C,v)=>{if(v==="audit"){C.cash-=15;delete C.flags.croRisk;return "Audit complete. Data integrity affirmed. −$15M.";}
     C.flags.buried=(C.flags.buried||0)+1;return "The report disappears into a drawer...";}},
  {id:"hearing",title:"Congressional hearing",
   body:"You're invited to testify on drug pricing. Tone matters.",
   choices:[
     {label:"Fight aggressively",sub:"−3 Rep, +2 share everywhere",val:"fight"},
     {label:"Show humility",sub:"+2 Rep, −1 share everywhere",val:"humble"}],
   apply:(C,v)=>{if(v==="fight"){C.rep=Math.max(0,C.rep-3);C.mkt.forEach(m=>m.share+=2);return "Soundbites dominate the news cycle. Prescribers notice your defiance.";}
     C.rep=Math.min(100,C.rep+2);C.mkt.forEach(m=>m.share=Math.max(6,m.share-1));return "A measured performance. Washington nods; marketing winces.";}},
  {id:"activists",title:"Activist occupation",
   body:"Animal-rights activists occupy your research lobby. Cameras everywhere.",
   choices:[
     {label:"Negotiate & fund alternatives",sub:"−$10M, delay one program a year",val:"neg"},
     {label:"Court injunction",sub:"−5 Rep, timeline intact",val:"court"}],
   apply:(C,v)=>{if(v==="neg"){C.cash-=10;if(C.pipe[0])C.pipe[0].delay=1;return "A compromise announced jointly. One program slips a year.";}
     C.rep=Math.max(0,C.rep-5);return "Injunction granted. The footage airs on evening news.";}},
  {id:"celebrity",title:"Celebrity endorsement",
   body:"An A-list actor offers to champion your newest launch — for a fee.",
   choices:[
     {label:"Sign the deal",sub:"−$25M, +4 share in biggest area, 20% backfire",val:"sign"},
     {label:"Politely decline",sub:"nothing happens",val:"pass"}],
   apply:(C,v)=>{if(v!=="sign")return "You pass. Quiet dignity.";
     C.cash-=25;
     if(Math.random()<0.2){C.rep=Math.max(0,C.rep-6);return "The celebrity's scandal breaks the same week. −$25M, −6 Rep.";}
     const m=C.mkt.slice().sort((a,b)=>DRUG[b.id].mkt-DRUG[a.id].mkt)[0];
     if(m)m.share+=4;return "The campaign shines. Share +4 in your biggest market.";}},
];

const RIVALS=["MedCorp United","GenRx Labs","Helix Therapeutics","NovaMed AG","Corvus Pharma","BluePeak Biotech"];

const TICKER=[
  "Journal retracts bee-venom arthritis paper after authors admit the bees were unnamed",
  "<b>Lipitor</b> becomes first drug to pass $100B lifetime sales",
  "Phase III herb-drug trial enrolls exclusively wellness influencers",
  "FDA commissioner spotted carrying suspiciously branded coffee mug",
  "Generics maker announces 'generic-er' generics: same molecule, more attitude",
  "Study finds placebo arm outperformed placebo arm; statisticians baffled",
  "<b>Semaglutide</b> shortage declared; endocrinologists begin triaging by vibes",
  "Rival CEO promises 'AI-discovered drug by Tuesday'",
  "CRO admits enrolling the same 12 patients in 9 trials",
  "Patent office accidentally approves perpetual motion machine, cites obviousness of pharma filings",
  "Meta-analysis of meta-analyses concludes: it depends",
  "Investigator vows to read the protocol 'this time, honestly'",
  "Blockbuster definition updated to $2B 'because inflation'",
  "Lab notebook found: contains actual dates, scientists suspicious",
  "Key opinion leader changes mind, stock moves 4%",
  "Mouse model results fail to translate — for the 4,000th time this quarter",
];

/* starter gift pool for campaign */
const STARTERS=["losartan","amlod","sertra","allo","monte","famo","doxy","metf"];

/* ------------------------------------------------------------
   ACHIEVEMENTS & MEDALS
   ------------------------------------------------------------ */
const ACHIEVEMENTS = [
  {id:"tuyouyou", title:"Tu Youyou Medal", icon:"i-spark", desc:"Win a clinical case using Artemisinin", tag:"Arena"},
  {id:"primum", title:"First, Do No Harm", icon:"i-shield", desc:"Win a clinical case with 0 total patient toxicity generated", tag:"Arena"},
  {id:"polypharm", title:"Polypharmacy Wizard", icon:"i-link", desc:"Trigger 2 or more synergistic combinations in a single match", tag:"Arena"},
  {id:"attending_cup", title:"Chief of Medicine", icon:"i-trophy", desc:"Defeat the Attending AI in the Formulary Cup", tag:"Arena"},
  {id:"hcv_cure", title:"Direct-Acting Miracle", icon:"i-zap", desc:"Achieve sustained virologic response (Cure HCV) with Sofosbuvir", tag:"Arena"},
  {id:"anaphylaxis_hero", title:"Epinephrine Protocol", icon:"i-syringe", desc:"Administer first-line Epinephrine in an Anaphylaxis emergency", tag:"Arena"},
  {id:"blockbuster", title:"Blockbuster Empire", icon:"i-chart", desc:"Launch a drug with $10B+ peak market potential in Campaign", tag:"Campaign"},
  {id:"repurpose_master", title:"Second Life Pioneer", icon:"i-refresh", desc:"Repurpose 2 or more compounds in a single campaign run", tag:"Campaign"},
  {id:"titan", title:"Blockbuster Titan", icon:"i-coin", desc:"Achieve a $4.0B+ market valuation in Campaign mode", tag:"Campaign"},
  {id:"cso_hired", title:"Executive Pipeline", icon:"i-atom", desc:"Hire a Chief Scientific Officer (CSO) in Campaign mode", tag:"Campaign"},
  {id:"daily_champ", title:"Daily Round Champion", icon:"i-book", desc:"Successfully solve a Daily Clinical Case", tag:"Daily"},
  {id:"case_zero", title:"Honorary Resident", icon:"i-check", desc:"Complete Case Zero: The First Prescription guided tutorial", tag:"Tutorial"},
  {id:"custom_architect", title:"Grand Rounds Architect", icon:"i-atom", desc:"Create and solve a custom clinical case in Case Maker", tag:"Case Maker"},
  {id:"collector_30", title:"Junior Fellow", icon:"i-stack", desc:"Discover 30 molecules in the Compendium", tag:"Compendium"},
  {id:"collector_75", title:"Senior Pharmacologist", icon:"i-stack", desc:"Discover 75 molecules in the Compendium", tag:"Compendium"},
  {id:"collector_all", title:"Master Pharmacopeia", icon:"i-star", desc:"Discover all compounds in the Compendium", tag:"Compendium"},
];