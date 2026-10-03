const { jsPDF } = window.jspdf || {};

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"
];

const LANGUAGE_OPTIONS = ["English","Hindi","Marathi","Gujarati","Kannada","Tamil","Telugu","Bengali","Punjabi","Malayalam","Odia","Assamese","Konkani","Urdu","Nepali","Meitei","Mizo","Nagamese"];

const DEFAULT_STATE_LANGS = {
  "Maharashtra":["English","Hindi","Marathi"], "Gujarat":["English","Hindi","Gujarati"], "Karnataka":["English","Hindi","Kannada"],
  "Tamil Nadu":["English","Hindi","Tamil"], "Telangana":["English","Hindi","Telugu"], "Andhra Pradesh":["English","Hindi","Telugu"],
  "West Bengal":["English","Hindi","Bengali"], "Punjab":["English","Hindi","Punjabi"], "Kerala":["English","Hindi","Malayalam"],
  "Odisha":["English","Hindi","Odia"], "Assam":["English","Hindi","Assamese"], "Goa":["English","Hindi","Marathi","Konkani"],
  "Delhi":["English","Hindi"], "Jammu and Kashmir":["English","Hindi","Urdu"], "Puducherry":["English","Hindi","Tamil"]
};

const DEFAULT_FIELDS = [
  {key:"name",label:"Name",type:"text",required:true},
  {key:"gender",label:"Gender",type:"select",required:true,options:["Male","Female","Other"]},
  {key:"dob",label:"Date of Birth",type:"date",required:true},
  {key:"place",label:"Place of Birth",type:"text",required:true},
  {key:"mother",label:"Name of Mother",type:"text",required:false},
  {key:"father",label:"Name of Father",type:"text",required:false},
  {key:"address",label:"Address of Parents",type:"textarea",required:false},
  {key:"registration",label:"Registration Number",type:"text",required:false},
  {key:"registrationDate",label:"Date of Registration",type:"date",required:false},
  {key:"issueDate",label:"Date of Issue",type:"date",required:false}
];

const DEFAULT_WATERMARK = "DEMO • SAMPLE • NOT AN OFFICIAL GOVERNMENT DOCUMENT";
const STATE_META = {
  "Andhra Pradesh":["AP","Andhra Pradesh"],"Arunachal Pradesh":["AR","Arunachal Pradesh"],"Assam":["AS","Assam"],"Bihar":["BR","Bihar"],
  "Chhattisgarh":["CG","Chhattisgarh"],"Goa":["GA","Goa"],"Gujarat":["GJ","Gujarat"],"Haryana":["HR","Haryana"],
  "Himachal Pradesh":["HP","Himachal Pradesh"],"Jharkhand":["JH","Jharkhand"],"Karnataka":["KA","Karnataka"],"Kerala":["KL","Kerala"],
  "Madhya Pradesh":["MP","Madhya Pradesh"],"Maharashtra":["MH","Maharashtra"],"Manipur":["MN","Manipur"],"Meghalaya":["ML","Meghalaya"],
  "Mizoram":["MZ","Mizoram"],"Nagaland":["NL","Nagaland"],"Odisha":["OD","Odisha"],"Punjab":["PB","Punjab"],
  "Rajasthan":["RJ","Rajasthan"],"Sikkim":["SK","Sikkim"],"Tamil Nadu":["TN","Tamil Nadu"],"Telangana":["TS","Telangana"],
  "Tripura":["TR","Tripura"],"Uttar Pradesh":["UP","Uttar Pradesh"],"Uttarakhand":["UK","Uttarakhand"],"West Bengal":["WB","West Bengal"],
  "Andaman and Nicobar Islands":["AN","Andaman & Nicobar"],"Chandigarh":["CH","Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu":["DN","Dadra & Nagar Haveli and Daman & Diu"],"Delhi":["DL","Delhi"],
  "Jammu and Kashmir":["JK","Jammu & Kashmir"],"Ladakh":["LA","Ladakh"],"Lakshadweep":["LD","Lakshadweep"],"Puducherry":["PY","Puducherry"]
};
function stateMeta(state){ return STATE_META[state] || ["ST",state]; }
function demoLogo(label, sub){ return `<div class="demo-logo"><div class="demo-logo-mark">${esc(label)}</div><div><strong>${esc(sub)}</strong><small>STATE LOGO • DEMO</small></div></div>`; }
function demoFormLogo(){ return `<div class="form-logo"><div class="form-logo-mark">FORM 5</div><small>FORM LOGO • DEMO</small></div>`; }


function readJSON(key, fallback){
  try { const v=JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch(e){ return fallback; }
}
function writeJSON(key,value){ localStorage.setItem(key,JSON.stringify(value)); }
function esc(v=""){ return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m])); }
function slug(v){ return String(v).toLowerCase().trim().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"") || "field"; }
function uid(prefix="id"){ return prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

let data = readJSON("bpp_data", null) || {
  states: STATES.map(name=>({id:uid("st"),name,active:true})),
  languages: STATES.map(state=>({id:uid("lg"),state,languages:DEFAULT_STATE_LANGS[state]||["English","Hindi"],active:true})),
  templates: [{id:uid("tpl"),name:"Maharashtra Birth Certificate — Demo",state:"Maharashtra",description:"A4 learning/demo template based on the supplied visual reference. Not an official document.",active:true,updated:new Date().toLocaleString()}],
  fields: DEFAULT_FIELDS,
  history: [],
  settings: {websiteName:"Birth Print Portal",logoText:"BP",defaultState:"Maharashtra",defaultLanguages:["English","Hindi","Marathi"],watermark:DEFAULT_WATERMARK,footerText:"NOT AN OFFICIAL GOVERNMENT DOCUMENT",maintenance:false}
};

// Normalize older project data without deleting it.
data.states = Array.isArray(data.states)&&data.states.length ? data.states.map(x=>({id:x.id||uid("st"),name:x.name||"Unnamed State",active:x.active!==false})) : STATES.map(name=>({id:uid("st"),name,active:true}));
data.languages = Array.isArray(data.languages)&&data.languages.length ? data.languages : STATES.map(state=>({id:uid("lg"),state,languages:DEFAULT_STATE_LANGS[state]||["English","Hindi"],active:true}));
data.templates = Array.isArray(data.templates)&&data.templates.length ? data.templates : [{id:uid("tpl"),name:"Maharashtra Birth Certificate — Demo",state:"Maharashtra",description:"Demo template",active:true,updated:new Date().toLocaleString()}];
data.fields = Array.isArray(data.fields)&&data.fields.length ? data.fields : DEFAULT_FIELDS;
data.history = Array.isArray(data.history) ? data.history : [];
data.settings = {...{websiteName:"Birth Print Portal",logoText:"BP",defaultState:"Maharashtra",defaultLanguages:["English","Hindi","Marathi"],watermark:DEFAULT_WATERMARK,footerText:"NOT AN OFFICIAL GOVERNMENT DOCUMENT",maintenance:false},...(data.settings||{})};
writeJSON("bpp_data",data);

let currentPage="dashboard";
let selectedState=data.settings.defaultState;
let selectedTemplate=data.templates.find(t=>t.active&&t.state===selectedState)?.id || data.templates.find(t=>t.active)?.id || data.templates[0]?.id;
let selectedLangs=[...(data.settings.defaultLanguages||DEFAULT_STATE_LANGS[selectedState]||["English","Hindi"])];
let formData={};
let editingTemplateId=null;
let editingFieldKey=null;
let editingLanguageId=null;

function save(){ writeJSON("bpp_data",data); }
function toast(msg){ const t=document.getElementById("toast"); if(!t)return; t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),2200); }
function activeStates(){ return data.states.filter(s=>s.active); }
function stateLanguages(state){ return data.languages.find(x=>x.state===state&&x.active)?.languages || DEFAULT_STATE_LANGS[state] || ["English","Hindi"]; }
function activeTemplates(){ return data.templates.filter(t=>t.active); }
function ensureFormDefaults(){ data.fields.forEach(f=>{if(formData[f.key]===undefined) formData[f.key]=f.key==="gender"?"Male":"";}); }
ensureFormDefaults();

function nav(page){ currentPage=page; document.querySelectorAll(".nav-item[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page)); render(); }
function pageTitle(){ return {dashboard:"Dashboard",generator:"PDF Generator",templates:"Template Management",states:"State Management",languages:"Language Management",fields:"Form Builder",history:"Generated PDF History",settings:"Admin Settings"}[currentPage]||"Dashboard"; }

function render(){
  const title=document.getElementById("pageTitle"); if(title) title.textContent=pageTitle();
  const c=document.getElementById("content"); if(!c)return;
  ({dashboard:renderDashboard,generator:renderGenerator,templates:renderTemplates,states:renderStates,languages:renderLanguages,fields:renderFields,history:renderHistory,settings:renderSettings}[currentPage]||renderDashboard)(c);
  bindCommon();
}

function bindCommon(){
  document.querySelectorAll(".nav-item[data-page]").forEach(b=>b.onclick=()=>nav(b.dataset.page));
  const mm=document.getElementById("mobileMenu"); if(mm)mm.onclick=()=>document.querySelector(".sidebar")?.classList.toggle("open");
  const clock=document.getElementById("clock"); if(clock)clock.textContent=new Date().toLocaleString();
}

function renderDashboard(c){
  const activeS=activeStates().length, activeT=activeTemplates().length, hist=data.history.length;
  c.innerHTML=`<div class="page-head"><div><h1>Admin Dashboard</h1><p>Birth Print Portal — complete demo administration.</p></div><div class="demo-badge">DEMO MODE</div></div>
  <div class="stats-grid">
    <div class="stat-card"><span>Active States / UTs</span><strong>${activeS}</strong></div>
    <div class="stat-card"><span>Active Templates</span><strong>${activeT}</strong></div>
    <div class="stat-card"><span>Form Fields</span><strong>${data.fields.length}</strong></div>
    <div class="stat-card"><span>Generated History</span><strong>${hist}</strong></div>
  </div>
  <div class="panel-grid">
    <div class="panel"><h3>Workflow</h3><div class="workflow"><span>State</span>→<span>Language</span>→<span>Template</span>→<span>Form</span>→<span>A4 Preview</span>→<span>Demo PDF</span></div></div>
    <div class="panel"><h3>Quick Actions</h3><div class="quick-actions"><button class="btn primary" data-go="generator">Open PDF Generator</button><button class="btn" data-go="templates">Manage Templates</button><button class="btn" data-go="states">Manage States</button></div></div>
  </div>
  <div class="notice"><strong>Important:</strong> Every generated document is clearly marked DEMO/SAMPLE and NOT AN OFFICIAL GOVERNMENT DOCUMENT.</div>`;
  c.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>nav(b.dataset.go));
}

function renderStates(c){
  c.innerHTML=`<div class="page-head"><div><h1>State Management</h1><p>Manage all 28 States and 8 Union Territories.</p></div><button class="btn primary" id="addState">+ Add State / UT</button></div>
  <div class="toolbar"><input id="stateSearch" placeholder="Search state / UT"><select id="stateFilter"><option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
  <div class="table-wrap"><table><thead><tr><th>State / UT</th><th>Status</th><th>Actions</th></tr></thead><tbody id="stateRows"></tbody></table></div>`;
  const draw=()=>{const q=(c.querySelector("#stateSearch").value||"").toLowerCase(),f=c.querySelector("#stateFilter").value; c.querySelector("#stateRows").innerHTML=data.states.filter(s=>(!q||s.name.toLowerCase().includes(q))&&(f==="all"||(f==="active"?s.active:!s.active))).map((s,i)=>`<tr><td>${esc(s.name)}</td><td><span class="status ${s.active?"active":"inactive"}">${s.active?"Active":"Inactive"}</span></td><td><button class="btn small" data-edit="${s.id}">Edit</button> <button class="btn small" data-toggle="${s.id}">${s.active?"Deactivate":"Activate"}</button> <button class="btn small danger" data-delete="${s.id}">Delete</button></td></tr>`).join("")||`<tr><td colspan="3">No states found.</td></tr>`; c.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editState(b.dataset.edit)); c.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=()=>toggleState(b.dataset.toggle)); c.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteState(b.dataset.delete));};
  c.querySelector("#addState").onclick=addState; c.querySelector("#stateSearch").oninput=draw;c.querySelector("#stateFilter").onchange=draw;draw();
}
function addState(){const n=prompt("State / UT name");if(!n)return;const name=n.trim();if(data.states.some(s=>s.name.toLowerCase()===name.toLowerCase()))return toast("State already exists");data.states.push({id:uid("st"),name,active:true});data.languages.push({id:uid("lg"),state:name,languages:["English","Hindi"],active:true});save();render();toast("State added");}
function editState(id){const s=data.states.find(x=>x.id===id);if(!s)return;const n=prompt("Edit State / UT",s.name);if(!n)return;const name=n.trim();if(data.states.some(x=>x.id!==id&&x.name.toLowerCase()===name.toLowerCase()))return toast("State already exists");const old=s.name;s.name=name;const lm=data.languages.find(x=>x.state===old);if(lm)lm.state=name;save();render();toast("State updated");}
function toggleState(id){const s=data.states.find(x=>x.id===id);if(!s)return;s.active=!s.active;save();render();toast(s.active?"State activated":"State deactivated");}
function deleteState(id){if(data.states.length<=1)return toast("Keep at least one state");const s=data.states.find(x=>x.id===id);if(!s)return;if(!confirm(`Delete ${s.name}?`))return;data.states=data.states.filter(x=>x.id!==id);data.languages=data.languages.filter(x=>x.state!==s.name);save();render();toast("State deleted");}

function renderLanguages(c){
  c.innerHTML=`<div class="page-head"><div><h1>Language Management</h1><p>Configure state-wise languages and selectable combinations.</p></div><button class="btn primary" id="addLanguage">+ Add Mapping</button></div>
  <div class="toolbar"><input id="languageSearch" placeholder="Search state or language"><select id="languageFilter"><option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
  <div class="cards" id="languageCards"></div>`;
  const draw=()=>{const q=(c.querySelector("#languageSearch").value||"").toLowerCase(),f=c.querySelector("#languageFilter").value;c.querySelector("#languageCards").innerHTML=data.languages.filter(x=>(!q||x.state.toLowerCase().includes(q)||x.languages.some(l=>l.toLowerCase().includes(q)))&&(f==="all"||(f==="active"?x.active:!x.active))).map(x=>{const combos=[];for(let i=0;i<x.languages.length;i++)for(let j=i+1;j<x.languages.length;j++)combos.push(x.languages[i]+" + "+x.languages[j]);return `<div class="card"><div class="card-head"><div><h3>${esc(x.state)}</h3><p>${x.languages.length} language(s)</p></div><span class="status ${x.active?"active":"inactive"}">${x.active?"Active":"Inactive"}</span></div><div class="chips">${x.languages.map(l=>`<span>${esc(l)}</span>`).join("")}</div><small>Combinations: ${combos.length?combos.map(esc).join(" • "):"Single language"}</small><div class="actions"><button class="btn small" data-edit="${x.id}">Edit</button><button class="btn small" data-toggle="${x.id}">${x.active?"Deactivate":"Activate"}</button><button class="btn small danger" data-delete="${x.id}">Delete</button></div></div>`}).join("")||`<div class="panel">No mappings found.</div>`;c.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editLanguage(b.dataset.edit));c.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=()=>toggleLanguage(b.dataset.toggle));c.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteLanguage(b.dataset.delete));};
  c.querySelector("#addLanguage").onclick=()=>openLanguageEditor();c.querySelector("#languageSearch").oninput=draw;c.querySelector("#languageFilter").onchange=draw;draw();
}
function openLanguageEditor(id=null){editingLanguageId=id;const x=id?data.languages.find(v=>v.id===id):null;const state=prompt("State / UT",x?.state||selectedState);if(!state)return;const langs=prompt("Languages, comma separated",(x?.languages||stateLanguages(state)).join(","));if(!langs)return;const list=[...new Set(langs.split(",").map(v=>v.trim()).filter(v=>LANGUAGE_OPTIONS.includes(v)))];if(!list.length)return toast("Use supported language names");if(x){x.state=state.trim();x.languages=list;x.active=true;}else{if(data.languages.some(v=>v.state.toLowerCase()===state.trim().toLowerCase()))return toast("Mapping already exists");data.languages.push({id:uid("lg"),state:state.trim(),languages:list,active:true});}save();render();toast(id?"Language mapping updated":"Language mapping added");editingLanguageId=null;}
function editLanguage(id){openLanguageEditor(id)}
function toggleLanguage(id){const x=data.languages.find(v=>v.id===id);if(!x)return;x.active=!x.active;save();render();}
function deleteLanguage(id){if(data.languages.length<=1)return toast("Keep at least one mapping");if(confirm("Delete this language mapping?")){data.languages=data.languages.filter(v=>v.id!==id);save();render();}}

function renderTemplates(c){
  c.innerHTML=`<div class="page-head"><div><h1>Template Management</h1><p>Add, edit, enable/disable and delete A4 demo templates.</p></div><button class="btn primary" id="addTemplate">+ Add Template</button></div>
  <div class="table-wrap"><table><thead><tr><th>Template</th><th>State</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>${data.templates.map(t=>`<tr><td><strong>${esc(t.name)}</strong><br><small>${esc(t.description||"")}</small></td><td>${esc(t.state)}</td><td><span class="status ${t.active?"active":"inactive"}">${t.active?"Active":"Inactive"}</span></td><td>${esc(t.updated||"")}</td><td><button class="btn small" data-edit="${t.id}">Edit</button> <button class="btn small" data-toggle="${t.id}">${t.active?"Disable":"Enable"}</button> <button class="btn small danger" data-delete="${t.id}">Delete</button></td></tr>`).join("")}</tbody></table></div>`;
  c.querySelector("#addTemplate").onclick=()=>templateEditor();c.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>templateEditor(b.dataset.edit));c.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=()=>{const t=data.templates.find(x=>x.id===b.dataset.toggle);t.active=!t.active;save();render()});c.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>{if(data.templates.length<=1)return toast("Keep at least one template");if(confirm("Delete template?")){data.templates=data.templates.filter(x=>x.id!==b.dataset.delete);save();render();}});
}
function templateEditor(id=null){const t=id?data.templates.find(x=>x.id===id):null;const name=prompt("Template name",t?.name||"Birth Certificate Demo");if(!name)return;const state=prompt("State / UT",t?.state||selectedState);if(!state)return;const desc=prompt("Template description",t?.description||"A4 demo template — not an official document.");if(desc===null)return;if(t){t.name=name.trim();t.state=state.trim();t.description=desc;t.updated=new Date().toLocaleString();}else data.templates.push({id:uid("tpl"),name:name.trim(),state:state.trim(),description:desc,active:true,updated:new Date().toLocaleString()});save();render();toast(id?"Template updated":"Template added");}

function renderFields(c){
  c.innerHTML=`<div class="page-head"><div><h1>Form Builder</h1><p>Manage generator fields and required/optional status.</p></div><button class="btn primary" id="addField">+ Add Field</button></div>
  <div class="table-wrap"><table><thead><tr><th>Label</th><th>Key</th><th>Type</th><th>Required</th><th>Actions</th></tr></thead><tbody>${data.fields.map(f=>`<tr><td>${esc(f.label)}</td><td><code>${esc(f.key)}</code></td><td>${esc(f.type)}</td><td><span class="status ${f.required?"active":"inactive"}">${f.required?"Required":"Optional"}</span></td><td><button class="btn small" data-edit="${esc(f.key)}">Edit</button> <button class="btn small danger" data-delete="${esc(f.key)}">Delete</button></td></tr>`).join("")}</tbody></table></div>`;
  c.querySelector("#addField").onclick=()=>fieldEditor();c.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>fieldEditor(b.dataset.edit));c.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>{if(data.fields.length<=1)return toast("Keep at least one field");if(confirm("Delete field?")){data.fields=data.fields.filter(f=>f.key!==b.dataset.delete);delete formData[b.dataset.delete];save();render();}});
}
function fieldEditor(key=null){const f=key?data.fields.find(x=>x.key===key):null;const label=prompt("Field label",f?.label||"New Field");if(!label)return;const type=prompt("Type: text, date, textarea, select",f?.type||"text");if(!type)return;const required=confirm("Make this field required?");let options=f?.options||[];if(type==="select"){const raw=prompt("Dropdown options, comma separated",options.join(",")||"Male,Female,Other");if(raw===null)return;options=raw.split(",").map(v=>v.trim()).filter(Boolean);}const newKey=f?f.key:slug(label);if(!f&&data.fields.some(x=>x.key===newKey))return toast("Field already exists");if(f){f.label=label.trim();f.type=type;f.required=required;f.options=options;}else data.fields.push({key:newKey,label:label.trim(),type,required,options});save();ensureFormDefaults();render();toast(key?"Field updated":"Field added");}

function renderGenerator(c){
  const activeS=activeStates();if(!activeS.length){c.innerHTML=`<div class="notice">Activate at least one State / UT first.</div>`;return;}
  if(!activeS.some(s=>s.name===selectedState))selectedState=activeS[0].name;
  const langs=stateLanguages(selectedState);selectedLangs=selectedLangs.filter(x=>langs.includes(x));if(!selectedLangs.length)selectedLangs=[langs[0]||"English"];
  const templates=activeTemplates().filter(t=>t.state===selectedState||t.state==="All States");if(!templates.some(t=>t.id===selectedTemplate))selectedTemplate=templates[0]?.id||activeTemplates()[0]?.id;
  ensureFormDefaults();
  c.innerHTML=`<div class="page-head"><div><h1>PDF Generator</h1><p>Fill the demo form and preview an A4 document before generating.</p></div><div><button class="btn" id="resetForm">Reset</button></div></div>
  <div class="generator-grid"><div class="panel"><h3>Document Settings</h3><div class="field-grid"><div class="field"><label>State / UT</label><select id="genState">${activeS.map(s=>`<option ${s.name===selectedState?"selected":""}>${esc(s.name)}</option>`).join("")}</select></div><div class="field"><label>Template</label><select id="genTemplate">${templates.map(t=>`<option value="${t.id}" ${t.id===selectedTemplate?"selected":""}>${esc(t.name)}</option>`).join("")}</select></div></div><div class="field"><label>Languages</label><div class="check-grid">${langs.map(l=>`<label><input type="checkbox" class="lang-check" value="${esc(l)}" ${selectedLangs.includes(l)?"checked":""}> ${esc(l)}</label>`).join("")}</div></div><h3>Form Fields</h3><div class="field-grid">${data.fields.map(fieldHtml).join("")}</div><div class="actions"><button class="btn primary" id="generateBtn">Generate Demo PDF</button><button class="btn" id="saveHistoryBtn">Save to History</button></div></div>
  <div class="panel preview-panel"><div class="preview-head"><h3>Live A4 Preview</h3><span>Scale preview</span></div><div class="a4-wrap"><div id="paper" class="a4-paper">${paperHtml()}</div></div></div></div>`;
  c.querySelector("#genState").onchange=e=>{selectedState=e.target.value;selectedLangs=stateLanguages(selectedState);selectedTemplate=activeTemplates().find(t=>t.state===selectedState)?.id||activeTemplates()[0]?.id;render();};
  c.querySelector("#genTemplate").onchange=e=>{selectedTemplate=e.target.value;updatePreview();};
  c.querySelectorAll("[data-key]").forEach(el=>el.oninput=()=>{formData[el.dataset.key]=el.value;updatePreview();});
  c.querySelectorAll(".lang-check").forEach(el=>el.onchange=()=>{selectedLangs=[...c.querySelectorAll(".lang-check:checked")].map(x=>x.value);updatePreview();});
  c.querySelector("#generateBtn").onclick=generatePdf;c.querySelector("#saveHistoryBtn").onclick=saveHistory;c.querySelector("#resetForm").onclick=()=>{formData={};ensureFormDefaults();render();toast("Form reset")};
}
function fieldHtml(f){const v=formData[f.key]??"";if(f.type==="textarea")return `<div class="field wide"><label>${esc(f.label)} ${f.required?"*":""}</label><textarea data-key="${esc(f.key)}" ${f.required?"required":""}>${esc(v)}</textarea></div>`;if(f.type==="select")return `<div class="field"><label>${esc(f.label)} ${f.required?"*":""}</label><select data-key="${esc(f.key)}">${(f.options||["Male","Female","Other"]).map(o=>`<option ${v===o?"selected":""}>${esc(o)}</option>`).join("")}</select></div>`;return `<div class="field"><label>${esc(f.label)} ${f.required?"*":""}</label><input data-key="${esc(f.key)}" type="${f.type==="date"?"date":"text"}" value="${esc(v)}" ${f.required?"required":""}></div>`;}
function paperHtml(){
  const t=data.templates.find(x=>x.id===selectedTemplate);
  const state=selectedState;
  const [abbr,stateLabel]=stateMeta(state);
  const langs=selectedLangs.length?selectedLangs:["English"];
  const v=k=>formData[k]||"—";
  const maharashtra = state === "Maharashtra";
  return `<div class="paper-watermark">${esc(data.settings.watermark)}</div>
    <div class="certificate-demo-strip">DEMO / SAMPLE — FOR EDUCATIONAL & UI TESTING ONLY</div>
    <div class="certificate-header">
      ${demoLogo(abbr,stateLabel)}
      <div class="certificate-title">
        <div class="gov-title">${esc(maharashtra?"GOVERNMENT OF MAHARASHTRA":"GOVERNMENT / STATE ADMINISTRATION — DEMO")}</div>
        <div class="dept-title">${esc(maharashtra?"DEPARTMENT OF HEALTH":"DEPARTMENT / LOCAL AUTHORITY — DEMO")}</div>
        <h2>BIRTH CERTIFICATE</h2><div class="hindi-title">जन्म प्रमाण पत्र</div>
      </div>
      ${demoFormLogo()}
    </div>
    <div class="legal-text"><b>ISSUED UNDER SECTION 12/17 OF THE REGISTRATION OF BIRTHS &amp; DEATHS ACT, 1969</b><br>
    <span>जन्म और मृत्यु पंजीकरण अधिनियम, 1969 की संबंधित धाराओं के अंतर्गत — DEMO / SAMPLE</span></div>
    <div class="certificate-rule"></div>
    <div class="source-text"><b>THIS IS TO CERTIFY THAT THE FOLLOWING INFORMATION HAS BEEN TAKEN FROM THE ORIGINAL RECORD OF BIRTH — DEMO COPY ONLY.</b><br>
    <span>यह प्रमाणित किया जाता है कि नीचे दी गई जानकारी केवल डेमो/शैक्षणिक नमूने के लिए है और किसी सरकारी रिकॉर्ड का प्रमाण नहीं है।</span></div>
    <div class="identity-grid">
      <div><b>NAME / नाम</b><span>${esc(v("name"))}</span></div><div><b>SEX / लिंग</b><span>${esc(v("gender"))}</span></div>
      <div><b>AADHAAR NUMBER / आधार नंबर</b><span>XXXXXXXX XXXX — DEMO</span></div><div><b>DATE OF BIRTH / जन्म तिथि</b><span>${esc(v("dob"))}</span></div>
      <div><b>PLACE OF BIRTH / जन्म स्थान</b><span>${esc(v("place"))}</span></div><div><b>REGISTRATION NUMBER / पंजीकरण संख्या</b><span>${esc(v("registration"))}</span></div>
      <div><b>NAME OF MOTHER / माता का नाम</b><span>${esc(v("mother"))}</span></div><div><b>NAME OF FATHER / पिता का नाम</b><span>${esc(v("father"))}</span></div>
      <div><b>AADHAAR NUMBER OF MOTHER / माता का आधार</b><span>XXXXXXXX XXXX — DEMO</span></div><div><b>AADHAAR NUMBER OF FATHER / पिता का आधार</b><span>XXXXXXXX XXXX — DEMO</span></div>
      <div class="full"><b>ADDRESS OF PARENTS AT THE TIME OF BIRTH OF THE CHILD / बच्चे के जन्म के समय माता-पिता का पता</b><span>${esc(v("address"))}</span></div>
      <div class="full"><b>PERMANENT ADDRESS OF PARENTS / माता-पिता का स्थायी पता</b><span>${esc(v("address"))}</span></div>
      <div><b>DATE OF REGISTRATION / पंजीकरण तारीख</b><span>${esc(v("registrationDate"))}</span></div><div><b>DATE OF ISSUE / जारी करने की तिथि</b><span>${esc(v("issueDate"))}</span></div>
      <div><b>STATE / UNION TERRITORY</b><span>${esc(state)}</span></div><div><b>LANGUAGES / भाषाएँ</b><span>${esc(langs.join(" + "))}</span></div>
    </div>
    <div class="certificate-bottom">
      <div><b>S.No. / क्रमांक</b><span>1</span></div><div><b>FORM</b><span>5 — DEMO</span></div><div><b>AUTHORITY / प्राधिकारी</b><span>SUB-REGISTRAR / LOCAL AUTHORITY — DEMO</span></div>
    </div>
    <div class="qr-sign-row"><div class="demo-qr">DEMO<br>QR<br>AREA</div><div class="issue-note">Updated / Issued: ${esc(v("issueDate"))}<br><br>Signature of Issuing Authority / जारी करने वाला प्राधिकारी<br><b>DEMO SIGNATURE AREA</b></div></div>
    <div class="certificate-footer"><span>${esc(t?.name||"Demo Birth Certificate Template")}</span><b>ENSURE REGISTRATION OF EVERY BIRTH AND DEATH — DEMO TEXT</b></div>
    <div class="certificate-disclaimer">${esc(data.settings.footerText)} • No authenticity verification is provided.</div>
  </div>`;
}

function updatePreview(){const p=document.getElementById("paper");if(p)p.innerHTML=paperHtml();}
function validateRequired(){for(const f of data.fields){if(f.required&&!String(formData[f.key]||"").trim()){toast(`${f.label} is required`);return false;}}return true;}
function saveHistory(){if(!validateRequired())return;data.history.unshift({id:uid("hist"),date:new Date().toLocaleString(),state:selectedState,templateId:selectedTemplate,languages:[...selectedLangs],name:formData.name||"",form:{...formData}});save();toast("Saved to PDF History");}
async function generatePdf(){
  if(!validateRequired())return;
  const paper=document.getElementById("paper");
  if(!paper){toast("A4 preview not found");return;}
  if(!window.jspdf?.jsPDF || !window.html2canvas){toast("PDF tools are still loading");return;}
  try{
    toast("Preparing A4 PDF…");
    const canvas=await window.html2canvas(paper,{scale:2,backgroundColor:"#ffffff",useCORS:true,logging:false});
    const doc=new window.jspdf.jsPDF({unit:"pt",format:"a4",orientation:"portrait"});
    const w=doc.internal.pageSize.getWidth(),h=doc.internal.pageSize.getHeight();
    doc.addImage(canvas.toDataURL("image/jpeg",0.96),"JPEG",0,0,w,h,undefined,"FAST");
    const filename="birth-print-demo-"+new Date().toISOString().slice(0,10)+".pdf";
    doc.save(filename);
    saveHistory();
    toast("A4 Demo PDF downloaded — preview and PDF match");
  }catch(err){console.error(err);toast("PDF generation failed. Please try again.");}
}

function renderHistory(c){c.innerHTML=`<div class="page-head"><div><h1>Generated PDF History</h1><p>Local browser history of generated/saved demo documents.</p></div><button class="btn danger" id="clearHistory">Clear History</button></div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Name</th><th>State</th><th>Languages</th><th>Actions</th></tr></thead><tbody>${data.history.map(h=>`<tr><td>${esc(h.date)}</td><td>${esc(h.name||"—")}</td><td>${esc(h.state)}</td><td>${esc((h.languages||[]).join(" + "))}</td><td><button class="btn small" data-preview="${h.id}">Preview</button> <button class="btn small danger" data-delete="${h.id}">Delete</button></td></tr>`).join("")||`<tr><td colspan="5">No history yet.</td></tr>`}</tbody></table></div>`;c.querySelector("#clearHistory").onclick=()=>{if(confirm("Clear all history?")){data.history=[];save();render();}};c.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>{data.history=data.history.filter(h=>h.id!==b.dataset.delete);save();render();});c.querySelectorAll("[data-preview]").forEach(b=>b.onclick=()=>{const h=data.history.find(x=>x.id===b.dataset.preview);if(!h)return;selectedState=h.state;selectedTemplate=h.templateId;selectedLangs=h.languages||["English"];formData={...(h.form||{})};nav("generator");});}

function renderSettings(c){c.innerHTML=`<div class="page-head"><div><h1>Admin Settings</h1><p>Control portal name, defaults, PDF watermark and demo mode.</p></div></div><div class="panel settings-form"><div class="field-grid"><div class="field"><label>Website Name</label><input id="setName" value="${esc(data.settings.websiteName)}"></div><div class="field"><label>Logo Text</label><input id="setLogo" value="${esc(data.settings.logoText)}"></div><div class="field"><label>Default State</label><select id="setState">${STATES.map(s=>`<option ${data.settings.defaultState===s?"selected":""}>${esc(s)}</option>`).join("")}</select></div><div class="field"><label>Demo Watermark</label><input id="setWatermark" value="${esc(data.settings.watermark)}"></div><div class="field wide"><label>PDF Footer</label><input id="setFooter" value="${esc(data.settings.footerText)}"></div><div class="field wide"><label>Default Languages</label><div class="check-grid" id="defaultLangs">${LANGUAGE_OPTIONS.map(l=>`<label><input type="checkbox" value="${esc(l)}" ${(data.settings.defaultLanguages||[]).includes(l)?"checked":""}> ${esc(l)}</label>`).join("")}</div></div></div><div class="actions"><button class="btn primary" id="saveSettings">Save Settings</button><button class="btn" id="resetSettings">Reset Defaults</button></div><div class="notice">Maintenance mode is available as an admin setting. This demo stores settings locally in the browser.</div></div><div class="panel"><h3>Deployment — Point 12</h3><p>Static deployment is supported on GitHub Pages. Upload the project files to the repository root, enable Pages from the repository settings, and use the generated Pages URL. A custom domain can be connected later.</p><p><strong>Current storage:</strong> browser localStorage/sessionStorage. No external database is required for this free demo build.</p></div>`;c.querySelector("#saveSettings").onclick=()=>{data.settings.websiteName=c.querySelector("#setName").value.trim()||"Birth Print Portal";data.settings.logoText=c.querySelector("#setLogo").value.trim()||"BP";data.settings.defaultState=c.querySelector("#setState").value;data.settings.watermark=c.querySelector("#setWatermark").value.trim()||DEFAULT_WATERMARK;data.settings.footerText=c.querySelector("#setFooter").value.trim()||"NOT AN OFFICIAL GOVERNMENT DOCUMENT";data.settings.defaultLanguages=[...c.querySelectorAll("#defaultLangs input:checked")].map(x=>x.value);save();toast("Settings saved");};c.querySelector("#resetSettings").onclick=()=>{if(confirm("Reset settings?")){data.settings={websiteName:"Birth Print Portal",logoText:"BP",defaultState:"Maharashtra",defaultLanguages:["English","Hindi","Marathi"],watermark:DEFAULT_WATERMARK,footerText:"NOT AN OFFICIAL GOVERNMENT DOCUMENT",maintenance:false};save();render();}};}

// Navigation and logout are bound here. Login itself is handled only in index.html.
document.querySelectorAll(".nav-item[data-page]").forEach(b=>b.addEventListener("click",()=>nav(b.dataset.page)));
const logout=document.getElementById("logoutBtn");
if(logout) logout.addEventListener("click",()=>{sessionStorage.clear();location.reload();});
setInterval(()=>{const c=document.getElementById("clock");if(c)c.textContent=new Date().toLocaleString();},1000);
render();
