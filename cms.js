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
  "photo.jpg":"Photo de Patrick (accueil + à propos)","atelier-ram.jpg":"Atelier — mémoire RAM",
  "atelier-soudure.jpg":"Atelier — soudure","atelier-ecran.jpg":"Atelier — écrans","logo.png":"Logo entreprise",
  "favicon.ico":"Icône onglet","hero-bg.jpg":"Fond page d'accueil","hero-pattern.png":"Motif déco accueil",
  "pattern.png":"Motif déco général","og-image.jpg":"Image partage réseaux","tsp.jpg":"Image TSP","fb.jpg":"Image Facebook",
  "reparation.jpg":"Réparation","virus.jpg":"Virus/sécurité","reseau.jpg":"Réseau","sauvegarde.jpg":"Sauvegarde",
  "siteweb.jpg":"Site web","formation.jpg":"Formation","logo-site.jpg":"Logo site","logoiqui.png":"Logo secondaire",
  "phone.svg":"Icône téléphone","mail.svg":"Icône courriel"
};
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
  let h=`<div class="card"><h3>Photos du site</h3><p class="hint">Choisis une image sur ton ordinateur pour la remplacer. Même nom = même emplacement.</p>`;
  for(const name of Object.keys(IMGDESC)){
    h+=`<div class="imgrow"><img src="assets/${name}" onerror="this.style.opacity=.2"><div style="flex:1"><div class="name">${name}</div><div class="desc">${IMGDESC[name]}</div>`+
       `<input type="file" accept="image/*" onchange="uploadImg('${name}',this)" style="margin-top:6px"></div></div>`;
  }
  h+=`</div><div id="img-err" class="err" style="margin-top:10px"></div>`;
  panel.innerHTML=h;
}
async function uploadImg(name,input){
  const file=input.files[0];
  if(!file)return;
  if(file.size>8e6){toast("Image trop grosse (max 8 Mo)",false);return;}
  const errBox=document.getElementById("img-err");
  if(errBox)errBox.textContent="";
  toast("Envoi de "+name+"...");
  try{
    const r0=await fetch(`https://api.github.com/repos/${REPO}/contents/assets/${name}?ref=${BRANCH}`,{headers:headers()});
    const sha=r0.ok?(await r0.json()).sha:undefined;
    const b64=await fileToB64(file);
    const r=await fetch(`https://api.github.com/repos/${REPO}/contents/assets/${name}`,{method:"PUT",headers:headers(),
      body:JSON.stringify({message:"CMS: img "+name,content:b64,sha})});
    if(!r.ok){const t=await r.text();throw new Error("PUT "+r.status+" "+t.slice(0,300));}
    toast("✓ "+name+" remplacée");
    updatePreview();
  }catch(e){console.error(e);const m="✗ "+name+": "+e.message;toast(m,false);if(errBox)errBox.textContent=m;}
}
function fileToB64(file){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result.split(",")[1]);fr.onerror=rej;fr.readAsDataURL(file);});}
async function updatePreview(){
  if(!document.getElementById("preview").classList.contains("show"))return;
  try{
    const tpl=await ghGetRaw("index.html");
    let html=tpl.text;
    html=html.replace("<head>","<head>\n<base href=\"https://atelierpotvin.ca/\">");
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
