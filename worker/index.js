// AIP multi-worker : formulaire de contact + proxy bot Hermes (tencent/hy3:free)
// La clé Hermes est dans le secret Worker HERMES_KEY (jamais exposée au frontend).
// Deploy : wrangler deploy (voir wrangler.toml).

const AIP_SYS = `Tu es l'assistant d'Atelier Informatique Potvin (AIP), tenu par Patrick Potvin à Nicolet, Québec.
Tu réponds en français, de façon courtoise, simple et rassurante, sans jargon technique.
Entreprise : dépannage informatique, réparation PC, suppression de virus, réseau Wi-Fi, assistance à distance, sauvegardes, création de sites web et applications sur mesure.
Zone desservie : Nicolet, Trois-Rivières, Bécancour et environs (50 km). Service à domicile ou à distance.
Patrick a 40 ans d'expérience. Téléphone : 819 380-2999. Diagnostic : 45 $. Dépense horaire raisonnable.
Si la question est urgente ou nécessite un rendez-vous, dis poliment de appeler Patrick au 819 380-2999.
Réponds en 2-4 phrases maximum. Ne mentionne jamais que tu es une IA.`;

const HERMES_ENDPOINT = 'https://api.nousresearch.com/v1/chat/completions';
const HERMES_MODEL = 'tencent/hy3:free';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/bot') {
      return handleBot(request, env, ctx);
    }
    return handleContact(request, env, ctx);
  },
};

async function handleBot(request, env, ctx) {
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
  if (!env.HERMES_KEY) {
    return new Response(JSON.stringify({ ok: false, error: 'Clé Hermes non configurée' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  let data;
  try { data = await request.json(); } catch { return new Response('Requête invalide', { status: 400, headers: cors }); }
  const msg = (data.message || '').toString().slice(0, 2000);
  if (!msg) return new Response('Message vide', { status: 422, headers: cors });

  try {
    const r = await fetch(HERMES_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + env.HERMES_KEY },
      body: JSON.stringify({
        model: HERMES_MODEL,
        messages: [ { role: 'system', content: AIP_SYS }, { role: 'user', content: msg } ],
        max_tokens: 400,
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
