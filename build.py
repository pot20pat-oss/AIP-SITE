#!/usr/bin/env python3
"""Build AIP-Site : fusionne content/*.json dans les templates HTML -> dist/"""
import json, os, shutil, glob

ROOT = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(ROOT, "content")
DIST = os.path.join(ROOT, "dist")

def load(name):
    with open(os.path.join(CONTENT, name), encoding="utf-8") as f:
        return json.load(f)

hero = load("hero.json")
footer = load("footer.json")
tarifs = load("tarifs.json")
avis = load("avis.json")
services = load("services.json")

# --- genere blocs HTML dynamiques ---
def card(title, desc, href, ico):
    return f'''        <a class="card" href="{href}">
          <div class="card-ico">{ico}</div>
          <h3>{title}</h3>
          <p>{desc}</p>
        </a>'''

icons_dep = ["🛠️", "🔧", "🐞", "💲"]
icons_cre = ["🌐", "📱", "👤", "❓"]
links_dep = ["services.html", "depannage-nicolet.html", "virus.html", "tarifs.html"]
links_cre = ["services.html#creation", "services.html#creation", "apropos.html", "faq.html"]

dep_cards = "\n".join(card(d["title"], d["desc"], links_dep[i], icons_dep[i]) for i, d in enumerate(services["depannage"]))
cre_cards = "\n".join(card(d["title"], d["desc"], links_cre[i], icons_cre[i]) for i, d in enumerate(services["creation"]))

reviews_html = "\n".join(f'''        <article class="card review">
          <div class="stars">★★★★★</div>
          <p>« {r['text']} »</p>
          <span class="review-author">— {r['author']}</span>
        </article>''' for r in avis["reviews"])

# placeholders disponibles
P = {
    # hero
    "{{hero_eyebrow}}": hero["eyebrow"],
    "{{hero_h1}}": hero["h1"],
    "{{hero_lead}}": hero["lead"],
    "{{hero_intro}}": hero["intro"],
    "{{hero_cta_primary}}": hero["cta_primary"],
    "{{hero_cta_secondary}}": hero["cta_secondary"],
    "{{hero_note}}": hero["note"],
    # footer
    "{{footer_phone}}": footer["phone"],
    "{{footer_address}}": footer["address"],
    "{{footer_copyright}}": footer["copyright"],
    # tarifs
    "{{tarif_diagnostic}}": tarifs["diagnostic"],
    "{{tarif_remote}}": tarifs["remote"],
    "{{tarif_horaire}}": tarifs["horaire"],
    "{{tarif_site}}": tarifs["site"],
    # avis
    "{{avis_count}}": str(avis["count"]),
    # JSON-LD reviewCount
    '"reviewCount": "X"': f'"reviewCount": "{avis["count"]}"',
}

# --- nettoyage dist ---
if os.path.exists(DIST):
    shutil.rmtree(DIST)
os.makedirs(DIST, exist_ok=True)

# copier assets/ css/ js/ admin/ worker/ sans ecraser les templates
for d in ["assets", "worker", "admin"]:
    src = os.path.join(ROOT, d)
    if os.path.exists(src):
        shutil.copytree(src, os.path.join(DIST, d), dirs_exist_ok=True)
for f in ["styles.css", "script.js", "favicon.ico", "cms.js"]:
    if os.path.exists(os.path.join(ROOT, f)):
        shutil.copy2(os.path.join(ROOT, f), os.path.join(DIST, f))

# --- traiter chaque html racine ---
html_files = glob.glob(os.path.join(ROOT, "*.html"))
for hf in html_files:
    name = os.path.basename(hf)
    with open(hf, encoding="utf-8") as f:
        html = f.read()
    for k, v in P.items():
        html = html.replace(k, v)
    # blocs dynamiques conditionnels
    if "{{dep_cards}}" in html:
        html = html.replace("{{dep_cards}}", dep_cards)
    if "{{cre_cards}}" in html:
        html = html.replace("{{cre_cards}}", cre_cards)
    if "{{reviews_block}}" in html:
        html = html.replace("{{reviews_block}}", reviews_html)
    with open(os.path.join(DIST, name), "w", encoding="utf-8") as f:
        f.write(html)

print("BUILD OK -> dist/")
