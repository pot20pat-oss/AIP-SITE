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
  "hero-repair.jpg":{cat:"Accueil",desc:"Image principale page d'accueil",size:"1600×900",fmt:"jpg",max:"1.5 Mo"},
  "hero-tech.jpg":{cat:"Accueil",desc:"Image techno accueil",size:"1600×900",fmt:"jpg",max:"1.5 Mo"},
  "bg-mesh.png":{cat:"Accueil",desc:"Fond décoratif",size:"400×400",fmt:"png",max:"500 Ko"},
  "atelier-ram.jpg":{cat:"Services",desc:"Atelier — mémoire RAM",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "atelier-soudure.jpg":{cat:"Services",desc:"Atelier — soudure",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "atelier-ecran.jpg":{cat:"Services",desc:"Atelier — écrans",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "repair-workstation.jpg":{cat:"Services",desc:"Poste de réparation",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "security-workstation.jpg":{cat:"Services",desc:"Sécurité / virus",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "network-backup.jpg":{cat:"Services",desc:"Réseau & sauvegarde",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "web-dev-workstation.jpg":{cat:"Services",desc:"Création web",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "remote-monitoring.jpg":{cat:"Services",desc:"Assistance à distance",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "formation.jpg":{cat:"Services",desc:"Formation",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "installation.jpg":{cat:"Services",desc:"Installation",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "reparation2.jpg":{cat:"Services",desc:"Réparation 2",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "reseau-router.jpg":{cat:"Services",desc:"Routeur réseau",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "debug.jpg":{cat:"Services",desc:"Débogage",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "remote.jpg":{cat:"Services",desc:"Bureau distant",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "web-dev.jpg":{cat:"Services",desc:"Développement web",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "app-dev.jpg":{cat:"Services",desc:"Développement application",size:"1200×800",fmt:"jpg",max:"1 Mo"},
  "logo.png":{cat:"Branding",desc:"Logo entreprise",size:"200×200",fmt:"png",max:"300 Ko"},
  "apercu-bois.png":{cat:"Branding",desc:"Aperçu démo Bois Morphée",size:"600×400",fmt:"png",max:"300 Ko"},
  "apercu-fabri.png":{cat:"Branding",desc:"Aperçu démo Fabri-Meuble",size:"600×400",fmt:"png",max:"300 Ko"},
  "apercu-houlec.png":{cat:"Branding",desc:"Aperçu démo Houlec",size:"600×400",fmt:"png",max:"300 Ko"}
};
const IMGCAT=["Accueil","Services","Branding"];
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
    else h+=`<input type="text" id="f-${sec}-${k}" value="${val.replace(/"/g,"&quot;")}" oninput="liveEdit('${sec}','${k}',this.value)" ${k==='cta'&&!val?'placeholder="Décrire mon problème"':''} />`;
  }
  if(sec==="avis"){
    h+=`<h4 style="margin-top:20px">Avis clients (nom + citation)</h4><div id="avis-items">`;
    (liveData.avis.data.reviews||[]).forEach((r,i)=>{
      h+=`<div style="border:1px solid var(--line);border-radius:10px;padding:10px;margin:8px 0;display:flex;flex-direction:column;gap:6px">
        <input type="text" id="f-avis-rev-name-${i}" value="${(r.author||"").replace(/"/g,"&quot;")}" placeholder="Nom du client" oninput="liveEditReview(${i},'author',this.value)" style="font-weight:600">
        <textarea id="f-avis-rev-text-${i}" placeholder="Citation" oninput="liveEditReview(${i},'text',this.value)">${(r.text||"").replace(/</g,"&lt;")}</textarea>
        <button class="btn btn-ghost" onclick="removeReview(${i})">Retirer cet avis</button>
      </div>`;
    });
    h+=`</div><button class="btn btn-ghost" onclick="addReview()">+ Ajouter un avis</button>`;
  }
  if(sec==="services"){
    h+=`<h4 style="margin-top:20px">Icônes des cartes (SVG) + libellés commerciaux</h4>`;
    liveData.services.data.depannage.concat(liveData.services.data.creation).forEach((x,i)=>{
      const key=i<4?"depannage":"creation";const idx=i<4?i:i-4;
      const cur=liveData.services.data[key][idx].icon||"";
      h+=`<div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="width:160px">${x.title}</span>`+
        `<input type="file" accept=".svg,image/svg+xml" onchange="uploadIcon('${key}',${idx},this)">`+
        `<span style="font-size:12px;color:#64748b">${cur?("actuel: "+cur):"défaut"}</span></div>`;
      h+=`<div style="margin:2px 0 10px 170px"><input type="text" id="f-services-cta-${key}-${idx}" value="${(liveData.services.data[key][idx].cta||"").replace(/"/g,"&quot;")}" oninput="liveEditCta('${key}',${idx},this.value)" placeholder="Libellé orienté client (ex: Faire réparer mon ordi)" style="width:320px"></div>`;
    });
  }
  h+=`<div style="margin-top:18px;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn" onclick="save('${sec}')">Enregistrer les modifications</button><button class="btn btn-ghost" onclick="scrollToPreview('${sec}')">👁 Voir dans le preview</button><button class="btn btn-ghost" onclick="revert('${sec}')">Rétablir la dernière version</button><button class="btn btn-ghost" onclick="window.open('https://atelierpotvin.ca/','_blank')">Voir le site publié</button><span class="msg" id="m-${sec}"></span></div></div>`;
  panel.innerHTML=h;
}
function parentGo(sec){show(sec,document.querySelector('nav a[data-sec="'+sec+'"]'));}
function scrollToPreview(sec){
  const p=document.getElementById("preview");
  if(!p.classList.contains("show")){p.classList.add("show");updatePreview();}
  const sel={hero:"#accueil",services:".services-grid",avis:"#avis-accueil",footer:".site-footer"}[sec];
  const t=document.querySelector("#pframe "+sel);
  if(t){setTimeout(()=>{t.scrollIntoView({behavior:"smooth",block:"center"});t.style.outline="3px solid #22c55e";setTimeout(()=>t.style.outline="",2500);},400);}
}
function liveEdit(sec,k,v){
  liveData[sec].data[k]=v;
  updatePreview();
  const m=document.getElementById("m-"+sec);
  if(m&&!m.textContent.includes("✓")){m.className="msg";m.textContent="";}
}
function liveEditCta(key,idx,v){
  liveData.services.data[key][idx].cta=v;
  updatePreview();
}
function ensureReviews(){if(!liveData.avis.data.reviews)liveData.avis.data.reviews=[];}
function liveEditReview(i,field,v){
  ensureReviews();
  liveData.avis.data.reviews[i]=liveData.avis.data.reviews[i]||{};
  liveData.avis.data.reviews[i][field]=v;
  updatePreview();
  const m=document.getElementById("m-avis");if(m&&!m.textContent.includes("✓")){m.className="msg";m.textContent="";}
}
function addReview(){
  ensureReviews();
  liveData.avis.data.reviews.push({author:"",text:""});
  show("avis",document.querySelector('nav a[data-sec="avis"]'));
}
function removeReview(i){
  ensureReviews();
  liveData.avis.data.reviews.splice(i,1);
  show("avis",document.querySelector('nav a[data-sec="avis"]'));
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
  if(sec==="avis"){ensureReviews();data.reviews=liveData.avis.data.reviews;}
  m.className="msg";m.textContent="Enregistrement...";
  setState("publishing","Publication en cours…");
  try{
    const r=await ghPutRaw(`content/${sec}.json`,toB64(JSON.stringify(data,null,2)),cache[sec].sha,"CMS: maj "+sec);
    if(!r.ok)throw new Error("PUT "+r.status);
    cache[sec]=await ghGetRaw(`content/${sec}.json`);
    liveData[sec]=cache[sec];
    m.className="msg ok";m.textContent="✓ Enregistré";
    toast("✓ "+FILES[sec].label+" mis à jour");
    const now=new Date();
    const stamp="Dernière sauvegarde : "+now.toLocaleDateString("fr-CA")+" à "+now.toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"});
    localStorage.setItem("aip_lastsave",stamp);
    setState("updated","✓ Site mis à jour — "+stamp+" (quelques minutes pour le site public)");
    dirty[sec]=false;
    sessionStorage.removeItem("aip_draft_"+sec);
  }catch(e){m.className="msg err";m.textContent="✗ Erreur: "+e.message;setState("idle","✗ Erreur d'enregistrement");}
}
function setState(cls,msg){
  const s=document.getElementById("save-state");
  if(!s)return;
  s.className="save-state"+(cls&&cls!=="idle"?" "+cls:"");
  s.textContent=msg||"";
}
function revert(sec){
  if(!confirm("Rétablir la dernière version enregistrée ? Vos modifications non enregistrées seront perdues."))return;
  ghGetRaw(`content/${sec}.json`).then(j=>{cache[sec]=j;liveData[sec]=j;show(sec,document.querySelector('nav a[data-sec="'+sec+'"]'));setState("idle","✓ Dernière version rechargée");});
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
        <img src="https://atelierpotvin.ca/assets/${name}" onerror="this.style.display='none'" id="prev-${name}">
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
    const b64=await compressToWebP(file,maxBytes);
    const r=await fetch(`https://api.github.com/repos/${REPO}/contents/assets/${name}`,{method:"PUT",headers:headers(),
      body:JSON.stringify({message:"CMS: img "+name,content:b64,sha})});
    if(!r.ok){const t=await r.text();throw new Error("PUT "+r.status+" "+t.slice(0,300));}
    const ok=document.getElementById("ok-"+name);if(ok){ok.style.display="inline";}
    toast("✓ "+name+" remplacée");
    updatePreview();
  }catch(e){console.error(e);const msg="✗ "+name+": "+e.message;toast(msg,false);if(errBox)errBox.textContent=msg;}
}
// Convertit en WebP (qualité 0.85) si plus léger que l'original, sinon garde l'original
async function compressToWebP(file,maxBytes){
  if(!window.OffscreenCanvas && !document.createElement("canvas").getContext)return await fileToB64(file);
  try{
    const bmp=await createImageBitmap(file);
    const cvs=document.createElement("canvas");
    cvs.width=bmp.width;cvs.height=bmp.height;
    const ctx=cvs.getContext("2d");
    ctx.drawImage(bmp,0,0);
    const webp=cvs.toDataURL("image/webp",0.85);
    const orig=await fileToB64(file);
    if(webp.length<orig.length)return webp.split(",")[1];
    return orig.split(",")[1];
  }catch(e){return (await fileToB64(file)).split(",")[1];}
}
function uploadIcon(key,idx,input){
  const file=input.files[0];
  if(!file)return;
  if(file.type!=="image/svg+xml"&&!file.name.endsWith(".svg")){toast("✗ icône: seulement SVG",false);return;}
  const name="icone-"+key+"-"+idx+".svg";
  toast("Envoi "+name+"...");
  file.arrayBuffer().then(async buf=>{
    const b64=btoa(String.fromCharCode(...new Uint8Array(buf)));
    try{
      const r0=await fetch(`https://api.github.com/repos/${REPO}/contents/assets/${name}?ref=${BRANCH}`,{headers:headers()});
      const sha=r0.ok?(await r0.json()).sha:undefined;
      const r=await fetch(`https://api.github.com/repos/${REPO}/contents/assets/${name}`,{method:"PUT",headers:headers(),
        body:JSON.stringify({message:"CMS: icon "+name,content:b64,sha})});
      if(!r.ok)throw new Error("PUT "+r.status);
      liveData.services.data[key][idx].icon=name;
      // sauvegarde services.json
      const sd={...cache.services.data};
      for(const kk of Object.keys(FILES.services.fields))sd[kk]=liveData.services.data[kk];
      sd.depannage=liveData.services.data.depannage;
      sd.creation=liveData.services.data.creation;
      const rr=await ghPutRaw(`content/services.json`,toB64(JSON.stringify(sd,null,2)),cache.services.sha,"CMS: icons");
      if(!rr.ok)throw new Error("save services "+rr.status);
      cache.services=await ghGetRaw("content/services.json");
      liveData.services=cache.services;
      toast("✓ "+name+" installée");
      updatePreview();
    }catch(e){console.error(e);toast("✗ "+name+": "+e.message,false);}
  });
}
function parseMax(s){const n=parseInt(s);if(s.includes("Mo"))return n*1e6;if(s.includes("Ko"))return n*1024;return 8e6;}
function fileToB64(file){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result.split(",")[1]);fr.onerror=rej;fr.readAsDataURL(file);});}
let previewTimer=null;
async function updatePreview(){
  const pw=document.getElementById("preview");
  if(!pw.classList.contains("show"))return;
  clearTimeout(previewTimer);
  previewTimer=setTimeout(async()=>{
    try{
      const tpl=await ghGetRaw("index.html");
      let html=tpl.text;
      html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="https://atelierpotvin.ca/styles.css"></head>');
      for(const f of Object.keys(FILES)){
        const d=liveData[f].data;
        for(const k of Object.keys(d)){
          html=html.split("{{"+f+"_"+k+"}}").join(d[k]);
        }
      }
      const svc=liveData.services.data;
      const fallback=["wrench","tool","bug","dollar"],fallbackCre=["globe","phone","user","help"];
      const linksDep=["services.html","depannage-nicolet.html","virus.html","tarifs.html"];
      const linksCre=["services.html#creation","services.html#creation","apropos.html","faq.html"];
      const icoFor=(x,i,fb)=>x.icon?`<img src="https://atelierpotvin.ca/assets/${x.icon}" alt="" style="width:30px;height:30px;object-fit:contain">`:icSvg(fb[i]);
      const card=(x,href,i,fb)=>`<a class="card" href="${href}"><div class="card-ico" style="font-size:30px;line-height:1;display:flex;align-items:center">${icoFor(x,i,fb)}</div><h3>${x.title}</h3><p class="card-cta">${x.cta||""}</p><p>${x.desc}</p></a>`;
      const depCards=svc.depannage.map((x,i)=>card(x,linksDep[i],i,fallback)).join("\n");
      const creCards=svc.creation.map((x,i)=>card(x,linksCre[i],i,fallbackCre)).join("\n");
      const revs=liveData.avis.data.reviews.map(r=>`<article class="card review"><div class="stars">★★★★★</div><p>« ${r.text} »</p><span class="review-author">— ${r.author}</span></article>`).join("\n");
      html=html.replace(/{{avis_count}}/g,liveData.avis.data.count);
      html=html.replace(/{{footer_phone}}/g,liveData.footer.data.phone);
      html=html.replace(/{{footer_copyright}}/g,liveData.footer.data.copyright);
      html=html.replace(/{{reviews_block}}/g,revs);
      html=html.replace(/{{dep_cards}}/g,depCards);
      html=html.replace(/{{cre_cards}}/g,creCards);
      // liens cliquables vers les sections CMS (via parentGo dans l'iframe)
      html=html.replace('<section class="hero" id="accueil">','<section class="hero cms-edit" id="accueil" onclick="parentGo(\'hero\')">');
      html=html.replace('<section class="section section-alt" id="explorer">','<section class="section section-alt cms-edit" id="explorer" onclick="parentGo(\'services\')">');
      html=html.replace('<section class="section" id="avis-accueil">','<section class="section cms-edit" id="avis-accueil" onclick="parentGo(\'avis\')">');
      html=html.replace('<footer class="site-footer">','<footer class="site-footer cms-edit" onclick="parentGo(\'footer\')">');
      const pf=document.getElementById("pframe");
      pf.innerHTML=html;
      pf.querySelectorAll(".cms-edit").forEach(el=>{el.style.cursor="pointer";el.style.position="relative";
        el.addEventListener("mouseenter",()=>{el.style.outline="2px dashed #6366f1";});
        el.addEventListener("mouseleave",()=>{el.style.outline="";});});
    }catch(e){
      console.error("updatePreview error:",e);
      const pf=document.getElementById("pframe");
      if(pf)pf.innerHTML='<p style="padding:20px;color:#dc2626;font-family:sans-serif">Erreur preview: '+(e.message||e)+'</p>';
    }
  },300);
}
function icSvg(kind){
  const p={
    wrench:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2-2 2.4-2.4z"/>',
    tool:'<path d="M3 3l7 7-2 2-7-7 2-2zM14 14l7 7-2 2-7-7 2-2z"/>',
    bug:'<path d="M12 2v4M12 18v4M4 12H2M22 12h-2M6 6L4 4M20 4l-2 2M6 18l-2 2M18 20l2-2M8 12a4 4 0 0 0 8 0 4 4 0 0 0-8 0z"/>',
    dollar:'<path d="M12 1v22M16 5a4 4 0 0 0-4-2c-2 0-4 1-4 3s2 3 4 3 4 1 4 3-2 3-4 3a4 4 0 0 1-4-2"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
    phone:'<path d="M5 4h4l2 4-2 2a12 12 0 0 0 6 6l2-2 4 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 3-3 5M12 17h.01"/>'
  }[kind]||'';
  return '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#4338ca" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
}
function togglePreview(){
  const p=document.getElementById("preview");
  p.classList.toggle("show");
  if(p.classList.contains("show"))updatePreview();
}
(function(){const t=sessionStorage.getItem("aip_cms_token");if(t){document.getElementById("token").value=t;document.getElementById("remember").checked=true;}})();
