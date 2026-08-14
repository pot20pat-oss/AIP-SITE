const REPO="pot20pat-oss/AIP-SITE", BRANCH="main";
const FILES={
  hero:{label:"Page d'accueil",crumb:"Page d'accueil",
    fields:{
      eyebrow:{label:"Petit titre au-dessus du grand titre",type:"text"},
      h1:{label:"Grand titre principal",type:"text"},
      lead:{label:"Texte sous le grand titre",type:"area"},
      intro:{label:"Paragraphe de présentation",type:"area"},
      cta:{label:"Texte du bouton principal",type:"text"}
    }},
  footer:{label:"Coordonnées",crumb:"Coordonnées",
    fields:{
      phone:{label:"Numéro de téléphone",type:"text",validate:"phone"},
      address:{label:"Adresse complète",type:"text"},
      copyright:{label:"Texte légal en bas de page",type:"area"}
    }},
  tarifs:{label:"Prix",crumb:"Prix",
    fields:{
      diagnostic:{label:"Prix diagnostic ($)",type:"text",validate:"num"},
      remote:{label:"Prix assistance à distance ($)",type:"text",validate:"num"},
      horaire:{label:"Prix à l'heure ($)",type:"text",validate:"num"},
      site:{label:"Prix site web ($)",type:"text",validate:"num"}
    }},
  avis:{label:"Avis clients",crumb:"Avis clients",
    fields:{count:{label:"Nombre d'avis Google",type:"text",validate:"int"}}},
  services:{label:"Mes services",crumb:"Mes services",
    fields:{
      dep1_t:{label:"Service 1 — titre",type:"text"},dep1_d:{label:"Service 1 — description",type:"area"},
      dep2_t:{label:"Service 2 — titre",type:"text"},dep2_d:{label:"Service 2 — description",type:"area"},
      dep3_t:{label:"Service 3 — titre",type:"text"},dep3_d:{label:"Service 3 — description",type:"area"},
      dep4_t:{label:"Service 4 — titre",type:"text"},dep4_d:{label:"Service 4 — description",type:"area"},
      cre1_t:{label:"Création 1 — titre",type:"text"},cre1_d:{label:"Création 1 — description",type:"area"},
      cre2_t:{label:"Création 2 — titre",type:"text"},cre2_d:{label:"Création 2 — description",type:"area"},
      cre3_t:{label:"Création 3 — titre",type:"text"},cre3_d:{label:"Création 3 — description",type:"area"},
      cre4_t:{label:"Création 4 — titre",type:"text"},cre4_d:{label:"Création 4 — description",type:"area"}
    }}
};
const IMGDESC={
  "photo.jpg":{cat:"Accueil",desc:"Photo de Patrick (accueil + à propos)",size:"1024×1280",fmt:"jpg/png",max:"2 Mo"},
  "hero-bg.jpg":{cat:"Accueil",desc:"Fond page d'accueil",size:"1600×900",fmt:"jpg",max:"1.5 Mo"},
  "hero-pattern.png":{cat:"Accueil",desc:"Motif déco accueil",size:"400×400",fmt:"png",max:"500 Ko"},
  "pattern.png":{cat:"Général",desc:"Motif déco général",size:"400×400",fmt:"png",max:"500 Ko"},
  "atelier-ram.jpg":{cat:"Services",desc:"Atelier — mémoire RAM",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "atelier-soudure.jpg":{cat:"Services",desc:"Atelier — soudure",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "atelier-ecran.jpg":{cat:"Services",desc:"Atelier — écrans",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "reparation.jpg":{cat:"Services",desc:"Réparation",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "virus.jpg":{cat:"Services",desc:"Virus/sécurité",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "reseau.jpg":{cat:"Services",desc:"Réseau",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "sauvegarde.jpg":{cat:"Services",desc:"Sauvegarde",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "siteweb.jpg":{cat:"Services",desc:"Site web",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "formation.jpg":{cat:"Services",desc:"Formation",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "logo.png":{cat:"Branding",desc:"Logo entreprise",size:"200×200",fmt:"png",max:"300 Ko"},
  "logo-site.jpg":{cat:"Branding",desc:"Logo site",size:"200×200",fmt:"jpg/png",max:"300 Ko"},
  "logoiqui.png":{cat:"Branding",desc:"Logo secondaire",size:"200×200",fmt:"png",max:"300 Ko"},
  "favicon.ico":{cat:"Branding",desc:"Icône onglet",size:"64×64",fmt:"ico",max:"100 Ko"},
  "og-image.jpg":{cat:"Réseaux",desc:"Image partage réseaux",size:"1200×630",fmt:"jpg",max:"1 Mo"},
  "tsp.jpg":{cat:"Réseaux",desc:"Image TSP",size:"1200×630",fmt:"jpg",max:"1 Mo"},
  "fb.jpg":{cat:"Réseaux",desc:"Image Facebook",size:"1200×630",fmt:"jpg",max:"1 Mo"},
  "phone.svg":{cat:"Icônes",desc:"Icône téléphone",size:"24×24",fmt:"svg",max:"50 Ko"},
  "mail.svg":{cat:"Icônes",desc:"Icône courriel",size:"24×24",fmt:"svg",max:"50 Ko"}
};
const IMGCAT=["Accueil","Services","Branding","Réseaux","Icônes","Général"];
let cache={}, liveData={};
function headers(){return{Authorization:"Bearer "+document.getElementById("token").value,Accept:"application/vnd.github+json"};}
function toB64(s){return btoa(unescape(encodeURIComponent(s)));}
function toast(m,ok){const t=document.getElementById("toast");t.textContent=m;t.className="toast show";setTimeout(()=>t.className="toast",2600);}
function b64ToUtf8(b64){
  const bin=atob(b64);
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  return new TextDecoder("utf-8").decode(bytes);
}
async function ghGetRaw(path){
  const r=await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,{headers:headers()});
  if(!r.ok)throw new Error("GET "+path+": "+r.status);
  const j=await r.json();
  if(path.endsWith(".json"))return {sha:j.sha,data:JSON.parse(b64ToUtf8(j.content))};
  return {sha:j.sha,text:b64ToUtf8(j.content)};
}
async function ghPutRaw(path,content,sha,msg){
  return fetch(`https://api.github.com/repos/${REPO}/contents/${path}`,{method:"PUT",headers:headers(),
    body:JSON.stringify({message:msg,content,sha})});
}
function validate(v,type){
  if(type==="num"&&isNaN(Number(v)))return "doit être un nombre";
  if(type==="int"&&!Number.isInteger(Number(v)))return "doit être un nombre entier";
  if(type==="phone"&&!/^[0-9().\-\s]+$/.test(v))return "format de téléphone invalide";
  return null;
}
async function loadAll(){
  const tk=document.getElementById("token").value;
  if(!tk){alert("Entre ton token GitHub");return;}
  if(document.getElementById("remember").checked)sessionStorage.setItem("aip_cms_token",tk);
  document.getElementById("login").style.display="none";
  document.getElementById("app").style.display="flex";
  try{
    for(const f of Object.keys(FILES))cache[f]=await ghGetRaw(`content/${f}.json`);
    liveData=JSON.parse(JSON.stringify(cache));
    show("hero",document.querySelector('nav a[data-sec="hero"]'));
    updatePreview();
    toast("Site chargé ✓");
  }catch(e){toast("Erreur chargement: "+e.message,false);}
}
function show(sec,el){
  document.querySelectorAll("nav a").forEach(a=>a.classList.remove("active"));
  el.classList.add("active");
  const panel=document.getElementById("panel");
  if(sec==="images"){document.getElementById("crumb").textContent="Photos du site";renderImages(panel);return;}
  document.getElementById("crumb").textContent=FILES[sec].crumb;
  let h=`<div class="card"><h3>${FILES[sec].label}</h3><p class="hint">Modifie le texte, puis « Enregistrer ». Le changement apparaît sur le site en quelques minutes. L'aperçu à droite se met à jour en direct.</p>`;
  for(const k of Object.keys(FILES[sec].fields)){
    const f=FILES[sec].fields[k];
    const val=String(liveData[sec].data[k]??"");
    h+=`<label>${f.label}</label>`;
    if(f.type==="area")h+=`<textarea id="f-${sec}-${k}" oninput="liveEdit('${sec}','${k}',this.value)">${val.replace(/</g,"&lt;")}</textarea>`;
    else h+=`<input type="text" id="f-${sec}-${k}" value="${val.replace(/"/g,"&quot;")}" oninput="liveEdit('${sec}','${k}',this.value)" />`;
  }
  h+=`<div style="margin-top:18px"><button class="btn" onclick="save('${sec}')">Enregistrer</button><span class="msg" id="m-${sec}"></span></div></div>`;
  panel.innerHTML=h;
}
function liveEdit(sec,k,v){
  liveData[sec].data[k]=v;
  updatePreview();
  const m=document.getElementById("m-"+sec);
  if(m&&!m.textContent.includes("✓")){m.className="msg";m.textContent="";}
}
async function save(sec){
  const m=document.getElementById("m-"+sec);
  const data={...cache[sec].data};
  for(const k of Object.keys(FILES[sec].fields)){
    const f=FILES[sec].fields[k];
    const v=document.getElementById(`f-${sec}-${k}`).value;
    const err=validate(v,f.validate);
    if(err){m.className="msg err";m.textContent="✗ "+f.label+": "+err;return;}
    data[k]=v;
  }
  m.className="msg";m.textContent="Enregistrement...";
  try{
    const r=await ghPutRaw(`content/${sec}.json`,toB64(JSON.stringify(data,null,2)),cache[sec].sha,"CMS: maj "+sec);
    if(!r.ok)throw new Error("PUT "+r.status);
    cache[sec]=await ghGetRaw(`content/${sec}.json`);
    liveData[sec]=cache[sec];
    m.className="msg ok";m.textContent="✓ Enregistré";
    toast("✓ "+FILES[sec].label+" mis à jour");
  }catch(e){m.className="msg err";m.textContent="✗ Erreur: "+e.message;}
}
function renderImages(panel){
  let h=`<div class="card"><h3>Photos &amp; images du site</h3><p class="hint">Remplace une image en choisissant un fichier. <b>Même nom = même emplacement</b> sur le site. Les tailles recommandées sont indicatives.</p>`;
  for(const cat of IMGCAT){
    const names=Object.keys(IMGDESC).filter(n=>IMGDESC[n].cat===cat);
    if(!names.length)continue;
    h+=`<div class="imgcat"><h4>${cat}</h4>`;
    for(const name of names){
      const m=IMGDESC[name];
      h+=`<div class="imgrow">
        <img src="assets/${name}" onerror="this.style.opacity=.2" id="prev-${name}">
        <div style="flex:1">
          <div class="name">${name}</div>
          <div class="desc">${m.desc}</div>
          <div class="meta">📐 ${m.size} · 📁 ${m.fmt} · ⚖️ max ${m.max}</div>
          <img id="new-${name}" style="display:none;max-width:120px;margin-top:6px;border:2px solid #22c55e;border-radius:6px">
          <input type="file" accept="image/*" onchange="previewThenUpload('${name}',this)" style="margin-top:6px">
          <span id="ok-${name}" class="ok" style="display:none">✓ Remplacée</span>
        </div>
      </div>`;
    }
    h+=`</div>`;
  }
  h+=`</div><div id="img-err" class="err" style="margin-top:10px"></div>`;
  panel.innerHTML=h;
}
async function previewThenUpload(name,input){
  const file=input.files[0];
  if(!file)return;
  const m=IMGDESC[name];
  const maxBytes=parseMax(m.max);
  if(file.size>maxBytes){toast("✗ "+name+": trop lourde ("+Math.round(file.size/1024)+" Ko > "+m.max+")",false);return;}
  const errBox=document.getElementById("img-err");
  if(errBox)errBox.textContent="";
  // apercu avant/apres
  const reader=new FileReader();
  reader.onload=e=>{const pv=document.getElementById("new-"+name);if(pv){pv.src=e.target.result;pv.style.display="block";}};
  reader.readAsDataURL(file);
  toast("Envoi de "+name+"...");
  try{
    const r0=await fetch(`https://api.github.com/repos/${REPO}/contents/assets/${name}?ref=${BRANCH}`,{headers:headers()});
    const sha=r0.ok?(await r0.json()).sha:undefined;
    const b64=await fileToB64(file);
    const r=await fetch(`https://api.github.com/repos/${REPO}/contents/assets/${name}`,{method:"PUT",headers:headers(),
      body:JSON.stringify({message:"CMS: img "+name,content:b64,sha})});
    if(!r.ok){const t=await r.text();throw new Error("PUT "+r.status+" "+t.slice(0,300));}
    const ok=document.getElementById("ok-"+name);if(ok){ok.style.display="inline";}
    toast("✓ "+name+" remplacée");
    updatePreview();
  }catch(e){console.error(e);const msg="✗ "+name+": "+e.message;toast(msg,false);if(errBox)errBox.textContent=msg;}
}
function parseMax(s){const n=parseInt(s);if(s.includes("Mo"))return n*1e6;if(s.includes("Ko"))return n*1024;return 8e6;}
function fileToB64(file){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result.split(",")[1]);fr.onerror=rej;fr.readAsDataURL(file);});}
async function updatePreview(){
  if(!document.getElementById("preview").classList.contains("show"))return;
  try{
    const tpl=await ghGetRaw("index.html");
    let html=tpl.text;
    html=html.replace("<head>","<head>\n<base href=\"https://atelierpotvin.ca/\">\n<style>.cms-edit{cursor:pointer;outline:2px dashed transparent;transition:outline .15s}.cms-edit:hover{outline:2px dashed #6366f1;background:rgba(99,102,241,.06)}.cms-edit::after{content:'✎ modifier';position:absolute;top:6px;right:6px;background:#6366f1;color:#fff;font:12px sans-serif;padding:2px 6px;border-radius:4px;opacity:0}.cms-edit:hover::after{opacity:1}</style>\n<script>window.addEventListener('DOMContentLoaded',()=>{const M={accueil:'hero',explorer:'services',avis-accueil:'avis','site-footer':'footer'};for(const id in M){const el=document.getElementById(id);if(el){el.classList.add('cms-edit');el.style.position='relative';el.onclick=()=>window.parent.show(M[id],window.parent.document.querySelector('nav a[data-sec=\"'+M[id]+'\"]'));}}const cards=document.querySelectorAll('.services-grid .card');cards.forEach(c=>{c.classList.add('cms-edit');c.style.position='relative';c.onclick=e=>{e.preventDefault();window.parent.show('services',window.parent.document.querySelector('nav a[data-sec=\"services\"]'));}});});<\/script>");
    for(const f of Object.keys(FILES)){
      const d=liveData[f].data;
      for(const k of Object.keys(d)){
        html=html.split("{{"+f+"_"+k+"}}").join(d[k]);
      }
    }
    const svc=liveData.services.data;
    const iconsDep=["🛠️","🔧","🐞","💲"],iconsCre=["🌐","📱","👤","❓"];
    const linksDep=["services.html","depannage-nicolet.html","virus.html","tarifs.html"];
    const linksCre=["services.html#creation","services.html#creation","apropos.html","faq.html"];
    const card=(t,d,href,ico)=>`<a class="card" href="${href}"><div class="card-ico" style="font-size:30px;line-height:1">${ico}</div><h3>${t}</h3><p>${d}</p></a>`;
    const depCards=svc.depannage.map((x,i)=>card(x.title,x.desc,linksDep[i],iconsDep[i])).join("\n");
    const creCards=svc.creation.map((x,i)=>card(x.title,x.desc,linksCre[i],iconsCre[i])).join("\n");
    const revs=liveData.avis.data.reviews.map(r=>`<article class="card review"><div class="stars">★★★★★</div><p>« ${r.text} »</p><span class="review-author">— ${r.author}</span></article>`).join("\n");
    html=html.replace(/{{avis_count}}/g,liveData.avis.data.count);
    html=html.replace(/{{footer_phone}}/g,liveData.footer.data.phone);
    html=html.replace(/{{footer_copyright}}/g,liveData.footer.data.copyright);
    html=html.replace(/{{reviews_block}}/g,revs);
    html=html.replace(/{{dep_cards}}/g,depCards);
    html=html.replace(/{{cre_cards}}/g,creCards);
    document.getElementById("pframe").srcdoc=html;
  }catch(e){/* preview silencieux */}
}
function togglePreview(){
  const p=document.getElementById("preview");
  p.classList.toggle("show");
  if(p.classList.contains("show"))updatePreview();
}
(function(){const t=sessionStorage.getItem("aip_cms_token");if(t){document.getElementById("token").value=t;document.getElementById("remember").checked=true;}})();
