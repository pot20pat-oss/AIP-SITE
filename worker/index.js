// AIP multi-worker : formulaire de contact + proxy bot Hermes (tencent/hy3:free)
// La clé Hermes est dans le secret Worker HERMES_KEY (jamais exposée au frontend).
// Deploy : wrangler deploy (voir wrangler.toml).

const AIP_SYS = `Tu es l'assistant d'Atelier Informatique Potvin (AIP), tenu par Patrick Potvin à Nicolet, Québec.
Tu réponds en français, courtois, simple, rassurant, sans jargon.
AIP est tenu par Patrick Potvin (une seule personne / petite entreprise). N'utilise jamais « nous sommes une équipe », « notre équipe », ou « nous sommes spécialisés » comme si AIP était une grande équipe. Parle à la 1re personne (« je ») ou dis « AIP » / « Patrick ». Exemple correct : « AIP est spécialisé dans... » ou « Je peux vous aider pour... ».
Services : dépannage informatique, suppression de virus et logiciels malveillants, réseau Wi-Fi, assistance à distance, sauvegardes de données, configuration et formation, création de sites web et applications sur mesure.
AIP ne fait PAS de réparation matérielle ou mécanique — ni Mac, ni iPhone, ni aucun appareil Apple, ni aucun hardware, ni console de jeux (PS5, Xbox, Switch). AIP fait du support logiciel et conseil : virus, lenteur, config, réseau, sauvegardes, assistance à distance. Si on demande une réparation physique d'un appareil (ex: « mon Mac ne démarre plus », « réparez ma PS5 »), dis poliment que AIP ne fait pas de réparation de matériel physique et oriente vers le support logiciel ou le 819 380-2999. Réponds librement (pas un texte figé) mais respecte ces faits : jamais de réparation matérielle offerte, et si la question contenait aussi une demande de délai, réponds aussi sur le délai (AIP ne garantit pas de délai précis, appelle Patrick pour urgence). N'invente jamais une réparation matérielle.
Zone : Nicolet, Trois-Rivières, Bécancour et environs (50 km). À domicile ou à distance.
Patrick : 40 ans d'expérience. Tél : 819 380-2999.

DELAIS / URGENCE : AIP ne peut PAS garantir un déplacement « dans l'heure » ou un délai précis — ne promets jamais un SLA. Si on te demande « pouvez-vous être chez moi dans l'heure aujourd'hui ? », réponds honnêtement : dis que AIP ne garantit pas de délai précis, mais que pour une urgence tu peux appeler Patrick au 819 380-2999 pour voir si ça peut s'arranger. Réponds TOUJOURS à la question posée (même si la réponse est « je ne peux pas garantir ça ») — n'ignore jamais une partie de la question du client.

TARIFS RÉELS (donne-les si on demande le prix, sans jamais "estimer la valeur" d'un projet) :
- Diagnostic : 45 $
- Assistance à distance : 50 $ / session
- Dépannage à domicile : taux horaire raisonnable, devis avant travail
- Site web vitrine : à partir de 1500 $ (selon pages/contenu)
- Application sur mesure : sur estimation selon les besoins
- Suppression virus / optimisation : forfait selon le cas, dis de demander un diagnostic

Si l'utilisateur veut un rendez-vous, dis-lui de cliquer "Prendre un rendez-vous" dans le chat (le formulaire collecte nom, téléphone, problème, créneau souhaité). Ne fais pas de faux rendez-vous toi-même.
Réponds en 2-4 phrases max. Ne dis jamais que tu es une IA.`;

const HERMES_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/bot') return handleBot(request, env, ctx);
    if (path === '/bot/status') return handleStatus(request, env, ctx);
    if (path === '/bot/telegram') return handleTelegramWebhook(request, env, ctx);
    if (path === '/bot/setwebhook') return handleSetWebhook(request, env, ctx);
    return handleContact(request, env, ctx);
  },
};

async function sendTelegram(env, text) {
  if (!env.TG_BOT_TOKEN || !env.TG_CHAT_ID) return false;
  try {
    await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text, parse_mode: 'HTML' }),
    });
    return true;
  } catch { return false; }
}

async function handleBot(request, env, ctx) {
  const origin = request.headers.get('origin') || '*';
  const cors = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return new Response('Méthode non autorisée', { status: 405, headers: cors });

  let data;
  try { data = await request.json(); } catch { return new Response('Requête invalide', { status: 400, headers: cors }); }

  // Mode rendez-vous : collecte structurée -> Telegram + KV
  if (data.mode === 'rdv') {
    const nom = (data.nom || '').toString().slice(0, 100).trim();
    const tel = (data.tel || '').toString().slice(0, 40).trim();
    const prob = (data.probleme || '').toString().slice(0, 500).trim();
    const cren = (data.creneau || '').toString().slice(0, 200).trim();
    if (!nom || !tel) return new Response(JSON.stringify({ ok: false, error: 'Nom et téléphone requis' }), { status: 422, headers: { ...cors, 'Content-Type': 'application/json' } });

    const leadId = 'L' + Date.now().toString(36).toUpperCase();
    const lead = { leadId, nom, tel, prob, cren, status: 'attente', confirmCreneau: '', ts: new Date().toISOString() };
    if (env.AIP_CONTACTS) { try { await env.AIP_CONTACTS.put('lead:' + leadId, JSON.stringify(lead)); } catch {} }

    const txt = `🔔 <b>Nouvelle demande de rendez-vous AIP</b> [${leadId}]\n\n👤 <b>${nom}</b>\n📞 ${tel}\n🛠 <b>Problème :</b> ${prob || '(non précisé)'}\n📅 <b>Créneau souhaité :</b> ${cren || '(non précisé)'}\n\nPour confirmer, réponds : <code>CONFIRMER ${leadId} &lt;créneau exact&gt;</code>`;
    const sent = await sendTelegram(env, txt);
    return new Response(JSON.stringify({ ok: true, sent, leadId, reply: `Merci ${nom} ! Votre demande (réf ${leadId}) a été envoyée à Patrick. Il vous contactera au ${tel} pour confirmer le créneau.` }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  const msg = (data.message || '').toString().slice(0, 2000);
  if (!msg) return new Response('Message vide', { status: 422, headers: cors });
  if (!env.HERMES_KEY) return new Response(JSON.stringify({ ok: false, error: 'Clé non configurée' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });

  try {
    const r = await fetch(HERMES_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + env.HERMES_KEY },
      body: JSON.stringify({
        model: env.HERMES_MODEL || 'meta/llama-3.1-8b-instruct',
        messages: [ { role: 'system', content: AIP_SYS }, { role: 'user', content: msg } ],
        max_tokens: 250,
        temperature: 0.7,
      }),
    });
    if (!r.ok) {
      const txt = await r.text();
      return new Response(JSON.stringify({ ok: false, error: 'API ' + r.status, detail: txt.slice(0, 300) }), { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } });
    }
    const j = await r.json();
    const reply = j.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({ ok: true, reply }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
}

// Statut d'un lead (polling widget)
async function handleStatus(request, env, ctx) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return new Response(JSON.stringify({ ok: false }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  let lead = null;
  if (env.AIP_CONTACTS) { try { const v = await env.AIP_CONTACTS.get('lead:' + id); if (v) lead = JSON.parse(v); } catch {} }
  return new Response(JSON.stringify({ ok: true, lead }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

// Webhook Telegram : Patrick écrit "CONFIRMER LXXXX <créneau>"
async function handleTelegramWebhook(request, env, ctx) {
  if (request.method !== 'POST') return new Response('POST only', { status: 405 });
  try {
    const u = await request.json();
    const msg = u?.message?.text || '';
    if (/^\/start/i.test(msg)) {
      await sendTelegram(env, `👋 <b>Bot AIP — Gestion des rendez-vous</b>\n\nQuand un client demande un RDV sur le site, tu reçois une alerte avec une référence (ex: LABC123).\n\nPour <b>confirmer</b> un rendez-vous, réponds :\n<code>CONFIRMER LABC123 mardi 14h</code>\n\nLe client verra la confirmation dans le chat du site.`);
      return new Response('ok');
    }
    const m = msg.match(/CONFIRMER\s+(L\w+)\s+(.+)/i);
    if (m && env.AIP_CONTACTS) {
      const id = m[1]; const cren = m[2].trim();
      const v = await env.AIP_CONTACTS.get('lead:' + id);
      if (v) {
        const lead = JSON.parse(v);
        lead.status = 'confirme'; lead.confirmCreneau = cren;
        await env.AIP_CONTACTS.put('lead:' + id, JSON.stringify(lead));
        await sendTelegram(env, `✅ Rendez-vous ${id} confirmé : ${cren}\nClient : ${lead.nom} (${lead.tel})`);
      }
    }
    return new Response('ok');
  } catch { return new Response('err', { status: 400 }); }
}

// Branche le webhook Telegram sur cette route
async function handleSetWebhook(request, env, ctx) {
  if (!env.TG_BOT_TOKEN) return new Response('no token', { status: 500 });
  const url = `https://aip-contact.pot20pat.workers.dev/bot/telegram`;
  const r = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(url)}`);
  const j = await r.json();
  return new Response(JSON.stringify(j), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

async function handleContact(request, env, ctx) {
  // CORS (allow the site origin to POST)
  const origin = request.headers.get('origin') || '*';
  const cors = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (request.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405, headers: cors });
  }

  let data;
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) { data = await request.json(); }
    else { const form = await request.formData(); data = Object.fromEntries(form.entries()); }
  } catch (e) { return new Response('Requête invalide', { status: 400, headers: cors }); }

  const nom = (data.nom || '').toString().slice(0, 200);
  const tel = (data.tel || '').toString().slice(0, 60);
  const message = (data.message || '').toString().slice(0, 4000);
  if (!nom || !tel || !message) { return new Response('Champs manquants', { status: 422, headers: cors }); }

  const ts = new Date().toISOString();
  const id = ts + '-' + Math.random().toString(36).slice(2, 8);
  const record = { id, ts, nom, tel, message };

  if (env.AIP_CONTACTS) {
    try { await env.AIP_CONTACTS.put(id, JSON.stringify(record)); }
    catch (e) { console.error('KV put failed', e); }
  } else { console.error('AIP_CONTACTS binding missing'); }

  if (env.SEND_EMAIL) {
    const body = `Nouvelle demande AIP\n\nDe : ${nom}\nTél : ${tel}\n\n${message}\n\n(${ts})`;
    ctx.waitUntil(env.SEND_EMAIL.send({ from: 'contact@atelierpotvin.ca', to: 'contact@atelierpotvin.ca', subject: `Demande AIP — ${nom}`, body }).catch(() => {}));
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
}
