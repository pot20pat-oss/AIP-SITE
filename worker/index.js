// AIP contact form worker — receives POST from the site, stores submission in KV,
// and (if Email Routing is bound) forwards it to the owner's email.
// Deploy: wrangler deploy (see wrangler.toml).

export default {
  async fetch(request, env, ctx) {
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
      if (ct.includes('application/json')) {
        data = await request.json();
      } else {
        const form = await request.formData();
        data = Object.fromEntries(form.entries());
      }
    } catch (e) {
      return new Response('Requête invalide', { status: 400, headers: cors });
    }

    const nom = (data.nom || '').toString().slice(0, 200);
    const tel = (data.tel || '').toString().slice(0, 60);
    const message = (data.message || '').toString().slice(0, 4000);
    if (!nom || !tel || !message) {
      return new Response('Champs manquants', { status: 422, headers: cors });
    }

    const ts = new Date().toISOString();
    const id = ts + '-' + Math.random().toString(36).slice(2, 8);
    const record = { id, ts, nom, tel, message };

    // Store in KV (always) — await to guarantee write before responding
    if (env.AIP_CONTACTS) {
      try {
        await env.AIP_CONTACTS.put(id, JSON.stringify(record));
      } catch (e) {
        // non-fatal for the user, but log it
        console.error('KV put failed', e);
      }
    } else {
      console.error('AIP_CONTACTS binding missing');
    }

    // Forward by email if Email Routing is bound
    if (env.SEND_EMAIL) {
      const body = `Nouvelle demande AIP\n\nDe : ${nom}\nTél : ${tel}\n\n${message}\n\n(${ts})`;
      ctx.waitUntil(env.SEND_EMAIL.send({
        from: 'contact@atelierpotvin.ca',
        to: 'pot20pat@gmail.com',
        subject: `Demande AIP — ${nom}`,
        body,
      }).catch(() => {}));
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  },
};
