const { jsPDF } = window.jspdf || {};
const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"];
const LANGS = ["English","Hindi","Marathi","Gujarati","Kannada","Tamil","Telugu","Bengali","Punjabi","Malayalam","Odia","Assamese"];
const defaultFields = [
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
const stateLangs = {
 "Maharashtra":["English","Hindi","Marathi"],"Gujarat":["English","Hindi","Gujarati"],"Karnataka":["English","Hindi","Kannada"],
 "Tamil Nadu":["English","Hindi","Tamil"],"Telangana":["English","Hindi","Telugu"],"West Bengal":["English","Hindi","Bengali"],
 "Punjab":["English","Hindi","Punjabi"],"Kerala":["English","Hindi","Malayalam"],"Odisha":["English","Hindi","Odia"],"Assam":["English","Hindi","Assamese"]
};
let data = JSON.parse(localStorage.getItem("bpp_data")||"null") || {
 templates:[{id:1,name:"Birth Certificate — Maharashtra Demo",state:"Maharashtra",active:true}],
 fields:defaultFields, history:[], settings:{logoText:"Birth Print Portal",watermark:"DEMO • SAMPLE • NOT AN OFFICIAL GOVERNMENT DOCUMENT"}
};
let currentPage="dashboard", formData={name:"",gender:"Male",dob:"",place:"",mother:"",father:"",address:"",registration:"",registrationDate:"",issueDate:""}, selectedState="Maharashtra", selectedLangs=["English","Hindi","Marathi"];

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function save(){localStorage.setItem("bpp_data",JSON.stringify(data));}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function escapeHtml(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function optionsState(){return STATES.map(s=>`<option ${s===selectedState?"selected":""}>${s}</option>`).join("")}
function availableLangs(){return stateLangs[selectedState]||["English","Hindi"];}
function render(){
  $("#pageTitle").textContent=({dashboard:"Dashboard",generator:"PDF Generator",templates:"Templates",states:"States",languages:"Languages",fields:"Form Fields",history:"PDF History",settings:"Settings"})[currentPage];
  const c=$("#content"); c.innerHTML=pages[currentPage]();
  bindPage();
}
const pages={
 dashboard(){return `<div class="page-head"><div><h3>Admin Dashboard</h3><p>Everything is managed from this single control center.</p></div><button class="primary" onclick="go('generator')">+ Create Demo PDF</button></div>
 <div class="grid stats">
  <div class="card stat"><div class="label">Templates</div><div class="value">${data.templates.length}</div><div class="hint">Active system templates</div></div>
  <div class="card stat"><div class="label">States / UTs</div><div class="value">${STATES.length}</div><div class="hint">India coverage</div></div>
  <div class="card stat"><div class="label">Generated PDFs</div><div class="value">${data.history.length}</div><div class="hint">Saved in this browser</div></div>
  <div class="card stat"><div class="label">Form Fields</div><div class="value">${data.fields.length}</div><div class="hint">Admin configurable</div></div>
 </div>
 <div class="grid two" style="margin-top:18px">
  <div class="card"><h3>Quick Start</h3><p style="color:var(--muted)">Select a State and language combination, fill the demo form, preview the A4 layout and generate a clearly marked sample PDF.</p><div class="actions"><button class="primary" onclick="go('generator')">Open Generator</button><button class="secondary" onclick="go('templates')">Manage Templates</button></div></div>
  <div class="card"><h3>System Status</h3><p>Frontend: <b>Ready</b></p><p>Local storage: <b>Connected</b></p><p>PDF library: <b>${jsPDF?"Loaded":"Waiting"}</b></p><p>Mode: <span class="pill">DEMO</span></p></div>
 </div>`},
 generator(){return `<div class="page-head"><div><h3>PDF Generator</h3><p>Build an educational sample document from the selected template.</p></div><button class="ghost" onclick="resetForm()">Reset</button></div>
 <div class="grid two">
  <div class="card">
   <div class="form-grid">
    <div class="field"><label>State</label><select id="stateSelect">${optionsState()}</select></div>
    <div class="field"><label>Template</label><select id="templateSelect">${data.templates.map(t=>`<option value="${t.id}">${escapeHtml(t.name)}</option>`).join("")}</select></div>
    <div class="field full-field"><label>Language Selection (multiple)</label><div class="check-list" id="langChecks">${availableLangs().map(l=>`<label class="check"><input type="checkbox" value="${l}" ${selectedLangs.includes(l)?"checked":""}>${l}</label>`).join("")}</div></div>
    ${data.fields.map(f=>fieldHtml(f)).join("")}
   </div>
   <div class="actions" style="margin-top:16px"><button class="primary" id="generateBtn">Generate Demo PDF</button><button class="secondary" id="saveHistoryBtn">Save to History</button></div>
  </div>
  <div class="card"><div class="page-head"><div><h3>Live A4 Preview</h3><p>Updates as you fill the form.</p></div></div><div class="preview-wrap"><div class="paper" id="paper">${paperHtml()}</div></div></div>
 </div>`},
 templates(){return `<div class="page-head"><div><h3>Templates</h3><p>Manage demo templates used by the generator.</p></div><button class="primary" onclick="addTemplate()">+ Add Template</button></div>
 <div class="card table-wrap"><table class="table"><thead><tr><th>Template</th><th>State</th><th>Status</th><th>Actions</th></tr></thead><tbody>${data.templates.map(t=>`<tr><td>${escapeHtml(t.name)}</td><td>${escapeHtml(t.state)}</td><td><span class="pill ${t.active?"":"off"}">${t.active?"Active":"Disabled"}</span></td><td><div class="actions"><button class="ghost" onclick="toggleTemplate(${t.id})">${t.active?"Disable":"Enable"}</button><button class="danger" onclick="deleteTemplate(${t.id})">Delete</button></div></td></tr>`).join("")}</tbody></table></div>`},
 states(){return `<div class="page-head"><div><h3>States & UTs</h3><p>${STATES.length} locations available for template selection.</p></div></div><div class="card"><div class="check-list">${STATES.map(s=>`<div class="check">${escapeHtml(s)}<br><small style="color:var(--muted)">${(stateLangs[s]||["English","Hindi"]).join(" • ")}</small></div>`).join("")}</div></div>`},
 languages(){return `<div class="page-head"><div><h3>Languages</h3><p>Language combinations are selected per document.</p></div></div><div class="grid three">${LANGS.map(l=>`<div class="card"><b>${escapeHtml(l)}</b><p style="color:var(--muted);font-size:12px">Available language option</p></div>`).join("")}</div>`},
 fields(){return `<div class="page-head"><div><h3>Form Fields</h3><p>Fields used by the PDF Generator.</p></div><button class="primary" onclick="addField()">+ Add Field</button></div>
 <div class="card table-wrap"><table class="table"><thead><tr><th>Label</th><th>Key</th><th>Type</th><th>Required</th><th>Action</th></tr></thead><tbody>${data.fields.map(f=>`<tr><td>${escapeHtml(f.label)}</td><td>${escapeHtml(f.key)}</td><td>${f.type}</td><td>${f.required?"Yes":"No"}</td><td><button class="danger" onclick="deleteField('${f.key}')">Delete</button></td></tr>`).join("")}</tbody></table></div>`},
 history(){return `<div class="page-head"><div><h3>Generated PDF History</h3><p>Saved locally in this browser.</p></div><button class="danger" onclick="clearHistory()">Clear History</button></div>
 <div class="card table-wrap"><table class="table"><thead><tr><th>Date</th><th>State</th><th>Languages</th><th>Name</th><th>Actions</th></tr></thead><tbody>${data.history.length?data.history.slice().reverse().map((h,i)=>`<tr><td>${escapeHtml(h.date)}</td><td>${escapeHtml(h.state)}</td><td>${escapeHtml(h.languages.join(" + "))}</td><td>${escapeHtml(h.name||"—")}</td><td><button class="danger" onclick="deleteHistory(${data.history.length-1-i})">Delete</button></td></tr>`).join(""):`<tr><td colspan="5">No PDFs saved yet.</td></tr>`}</tbody></table></div>`},
 settings(){return `<div class="page-head"><div><h3>Settings</h3><p>Basic portal and demo PDF settings.</p></div><button class="primary" onclick="saveSettings()">Save Settings</button></div>
 <div class="card form-grid"><div class="field"><label>Portal Name</label><input id="setLogo" value="${escapeHtml(data.settings.logoText)}"></div><div class="field"><label>Demo Watermark</label><input id="setWater" value="${escapeHtml(data.settings.watermark)}"></div><div class="field full-field"><label>Note</label><textarea disabled>This educational portal generates sample/demo PDFs only. Do not represent generated documents as official government records.</textarea></div></div>`}
};
function fieldHtml(f){
 let v=formData[f.key]||"";
 if(f.type==="textarea") return `<div class="field full-field"><label>${escapeHtml(f.label)}</label><textarea data-key="${f.key}" ${f.required?"required":""}>${escapeHtml(v)}</textarea></div>`;
 if(f.type==="select") return `<div class="field"><label>${escapeHtml(f.label)}</label><select data-key="${f.key}">${(f.options||["Male","Female","Other"]).map(o=>`<option ${v===o?"selected":""}>${o}</option>`).join("")}</select></div>`;
 return `<div class="field"><label>${escapeHtml(f.label)}</label><input data-key="${f.key}" type="${f.type}" value="${escapeHtml(v)}" ${f.required?"required":""}></div>`;
}
function paperHtml(){
 const langLine=selectedLangs.length?selectedLangs.join(" • "):"Select language";
 const label=(en,hi,mar)=>selectedLangs.includes("Marathi")?mar:(selectedLangs.includes("Hindi")?hi:en);
 return `<div class="watermark">${escapeHtml(data.settings.watermark)}</div>
 <div class="gov">DEMO / SAMPLE — ${escapeHtml(selectedState.toUpperCase())}</div>
 <div class="sub">${escapeHtml(data.settings.logoText)}</div>
 <div class="title">BIRTH CERTIFICATE</div><div class="sub">जन्म प्रमाण पत्र</div>
 <div class="small">Educational template — ${escapeHtml(langLine)}</div><div class="rule"></div>
 <div class="small" style="text-align:left"><b>${escapeHtml(label("This is a sample layout for learning PDF generation.","यह PDF generation सीखने के लिए नमूना लेआउट है।","हा PDF generation शिकण्यासाठी नमुना आराखडा आहे."))}</b></div>
 <div class="cert-grid" style="margin-top:12px">
  <div><b>NAME / नाम / नाव</b>${escapeHtml(formData.name||"—")}</div>
  <div><b>SEX / लिंग / लिंग</b>${escapeHtml(formData.gender||"—")}</div>
  <div><b>DATE OF BIRTH / जन्म तिथि / जन्म तारीख</b>${escapeHtml(formData.dob||"—")}</div>
  <div><b>PLACE OF BIRTH / जन्म स्थान / जन्मस्थळ</b>${escapeHtml(formData.place||"—")}</div>
  <div><b>NAME OF MOTHER / माता का नाम / आईचे नाव</b>${escapeHtml(formData.mother||"—")}</div>
  <div><b>NAME OF FATHER / पिता का नाम / वडिलांचे नाव</b>${escapeHtml(formData.father||"—")}</div>
  <div class="wide"><b>ADDRESS / पता / पत्ता</b>${escapeHtml(formData.address||"—")}</div>
  <div><b>REGISTRATION NUMBER / पंजीकरण संख्या / नोंदणी क्रमांक</b>${escapeHtml(formData.registration||"—")}</div>
  <div><b>DATE OF REGISTRATION / पंजीकरण तारीख / नोंदणी तारीख</b>${escapeHtml(formData.registrationDate||"—")}</div>
  <div><b>DATE OF ISSUE / जारी करने की तिथि / जारी तारीख</b>${escapeHtml(formData.issueDate||"—")}</div>
  <div><b>STATE / राज्य / राज्य</b>${escapeHtml(selectedState)}</div>
 </div>
 <div class="paper-footer"><span>FORM 5 — DEMO TEMPLATE</span><span>NOT AN OFFICIAL GOVERNMENT DOCUMENT</span></div>`;
}
function collect(){
 $$("[data-key]").forEach(el=>formData[el.dataset.key]=el.value);
 selectedLangs=$$("#langChecks input:checked").map(x=>x.value);
 $("#paper").innerHTML=paperHtml();
}
function bindPage(){
 if(currentPage==="generator"){
  $("#stateSelect").onchange=e=>{selectedState=e.target.value;selectedLangs=availableLangs();render()};
  $$("[data-key]").forEach(el=>el.addEventListener("input",collect));
  $$("#langChecks input").forEach(el=>el.addEventListener("change",collect));
  $("#generateBtn").onclick=generatePdf;
  $("#saveHistoryBtn").onclick=saveHistory;
 }
}
function go(page){currentPage=page;$$(".nav-item[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));render()}
function resetForm(){formData={name:"",gender:"Male",dob:"",place:"",mother:"",father:"",address:"",registration:"",registrationDate:"",issueDate:""};render();toast("Form reset")}
function addTemplate(){const name=prompt("Template name","New Birth Certificate Demo");if(!name)return;data.templates.push({id:Date.now(),name,state:selectedState,active:true});save();render();toast("Template added")}
function toggleTemplate(id){const t=data.templates.find(x=>x.id===id);if(t){t.active=!t.active;save();render()}}
function deleteTemplate(id){if(data.templates.length===1)return toast("Keep at least one template");if(confirm("Delete this template?")){data.templates=data.templates.filter(x=>x.id!==id);save();render();}}
function addField(){const label=prompt("Field label","New Field");if(!label)return;const key=label.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");if(data.fields.some(f=>f.key===key))return toast("Field already exists");data.fields.push({key,label,type:"text",required:false});save();render();toast("Field added")}
function deleteField(key){if(data.fields.length<=1)return toast("Keep at least one field");data.fields=data.fields.filter(f=>f.key!==key);delete formData[key];save();render()}
function saveHistory(){collect();data.history.push({date:new Date().toLocaleString(),state:selectedState,languages:[...selectedLangs],name:formData.name,form:{...formData}});save();toast("Saved to history")}
function clearHistory(){if(confirm("Clear all local history?")){data.history=[];save();render()}}
function deleteHistory(i){data.history.splice(i,1);save();render()}
function saveSettings(){data.settings.logoText=$("#setLogo").value;data.settings.watermark=$("#setWater").value;save();toast("Settings saved")}
function generatePdf(){
 collect(); if(!jsPDF)return toast("PDF library not loaded");
 const doc=new jsPDF({unit:"pt",format:"a4"}), w=doc.internal.pageSize.getWidth(), h=doc.internal.pageSize.getHeight();
 doc.setTextColor(20,30,45);doc.setFont("helvetica","bold");doc.setFontSize(16);doc.text("BIRTH CERTIFICATE",w/2,60,{align:"center"});
 doc.setFontSize(10);doc.text("DEMO / SAMPLE — "+selectedState.toUpperCase(),w/2,78,{align:"center"});
 doc.setFont("helvetica","normal");doc.setFontSize(8);doc.text("Language: "+(selectedLangs.join(" + ")||"Not selected"),w/2,94,{align:"center"});
 doc.setDrawColor(30);doc.line(42,108,w-42,108);
 let y=130; const rows=[
  ["Name",formData.name],["Gender",formData.gender],["Date of Birth",formData.dob],["Place of Birth",formData.place],
  ["Name of Mother",formData.mother],["Name of Father",formData.father],["Address",formData.address],
  ["Registration Number",formData.registration],["Date of Registration",formData.registrationDate],["Date of Issue",formData.issueDate],["State",selectedState]
 ];
 doc.setFontSize(9);
 rows.forEach(([k,v])=>{doc.setFont("helvetica","bold");doc.text(k,55,y);doc.setFont("helvetica","normal");doc.text(String(v||"—").slice(0,100),190,y);doc.line(45,y+8,w-45,y+8);y+=38});
 doc.setTextColor(210,55,55);doc.setFont("helvetica","bold");doc.setFontSize(28);doc.text("DEMO • SAMPLE",w/2,h/2,{align:"center",angle:25});
 doc.setTextColor(70);doc.setFontSize(8);doc.text("NOT AN OFFICIAL GOVERNMENT DOCUMENT",w/2,h-35,{align:"center"});
 doc.save("birth-print-demo.pdf"); saveHistory(); toast("Demo PDF downloaded");
}
const ADMIN_EMAIL="digital9637832490@gmail.com";
$("#loginBtn").onclick=()=>{const email=$("#loginEmail").value.trim().toLowerCase();if(email!==ADMIN_EMAIL){alert("Please use the registered Admin email: "+ADMIN_EMAIL);return;}$("#adminAvatar").textContent="A";$("#loginScreen").classList.add("hidden");$("#app").classList.remove("hidden");render()};
$("#logoutBtn").onclick=()=>{$("#app").classList.add("hidden");$("#loginScreen").classList.remove("hidden")};
$$(".nav-item[data-page]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.page)));
$("#mobileMenu").onclick=()=>$(".sidebar").classList.toggle("open");
setInterval(()=>$("#clock").textContent=new Date().toLocaleString(),1000);
