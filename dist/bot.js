// Widget chat AIP — appelle le Worker proxy /bot (cle Hermes/NVIDIA cote serveur, jamais exposee)
(function () {
  const BOT_API = 'https://aip-contact.pot20pat.workers.dev/bot';

  const btn = document.createElement('button');
  btn.id = 'bot-toggle';
  btn.setAttribute('aria-label', 'Ouvrir le chat AIP');
  btn.innerHTML = '💬<span>Besoin d’aide ?</span>';

  const win = document.createElement('div');
  win.id = 'bot-win';
  win.innerHTML = `
    <div class="bot-head">
      <div><strong>Patrick — Assistant AIP</strong><br><span class="bot-sub">Atelier Informatique Potvin</span></div>
      <button id="bot-close" aria-label="Fermer">✕</button>
    </div>
    <div class="bot-msgs" id="bot-msgs">
      <div class="bot-msg bot-bot">Bonjour ! Je suis l’assistant d’Atelier Informatique Potvin. Une question sur le dépannage, les prix ou la zone desservie ? Sinon, appelez Patrick au <strong>819 380-2999</strong>.</div>
    </div>
    <form class="bot-input" id="bot-form">
      <input id="bot-text" type="text" placeholder="Votre question…" autocomplete="off" />
      <button type="submit">Envoyer</button>
    </form>
    <button id="bot-rdv" type="button">📅 Prendre un rendez-vous</button>
    <div id="bot-rdv-form" style="display:none; padding:10px; border-top:1px solid var(--line); background:#fff;">
      <input id="rdv-nom" type="text" placeholder="Votre nom" style="width:100%;margin-bottom:6px;padding:8px;border:1px solid var(--line);border-radius:8px" />
      <input id="rdv-tel" type="text" placeholder="Téléphone" style="width:100%;margin-bottom:6px;padding:8px;border:1px solid var(--line);border-radius:8px" />
      <textarea id="rdv-prob" placeholder="Votre problème" style="width:100%;margin-bottom:6px;padding:8px;border:1px solid var(--line);border-radius:8px;font-family:inherit"></textarea>
      <input id="rdv-cren" type="text" placeholder="Créneau souhaité (ex: mardi 14h)" style="width:100%;margin-bottom:8px;padding:8px;border:1px solid var(--line);border-radius:8px" />
      <button id="rdv-send" type="button" style="width:100%;background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;border:none;border-radius:10px;padding:10px;font-weight:600;cursor:pointer">Envoyer la demande</button>
    </div>`;

  document.body.appendChild(btn);
  document.body.appendChild(win);

  const msgs = win.querySelector('#bot-msgs');
  const form = win.querySelector('#bot-form');
  const text = win.querySelector('#bot-text');

  function addMsg(who, html) {
    const d = document.createElement('div');
    d.className = 'bot-msg ' + (who === 'user' ? 'bot-user' : 'bot-bot');
    d.innerHTML = html;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  btn.addEventListener('click', () => {
    win.classList.toggle('open');
    if (win.classList.contains('open')) text.focus();
  });
  win.querySelector('#bot-rdv').addEventListener('click', () => {
    const f = win.querySelector('#bot-rdv-form');
    f.style.display = f.style.display === 'none' ? 'block' : 'none';
  });
  win.querySelector('#rdv-send').addEventListener('click', async () => {
    const nom = win.querySelector('#rdv-nom').value.trim();
    const tel = win.querySelector('#rdv-tel').value.trim();
    if (!nom || !tel) { alert('Nom et téléphone requis'); return; }
    const payload = {
      mode: 'rdv',
      nom, tel,
      probleme: win.querySelector('#rdv-prob').value.trim(),
      creneau: win.querySelector('#rdv-cren').value.trim(),
    };
    const busy = document.createElement('div');
    busy.className = 'bot-msg bot-bot'; busy.textContent = '…'; msgs.appendChild(busy);
    try {
      const r = await fetch(BOT_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json();
      busy.remove();
      if (j.ok) {
        addMsg('bot', escapeHtml(j.reply));
        if (j.leadId) {
          const ref = document.createElement('div');
          ref.className = 'bot-msg bot-bot';
          ref.id = 'rdv-status-' + j.leadId;
          ref.innerHTML = `Réf <b>${j.leadId}</b> — en attente de confirmation par Patrick…`;
          msgs.appendChild(ref);
          pollStatus(j.leadId);
        }
      }
      else addMsg('bot', 'Erreur lors de l’envoi. Appelez Patrick au <strong>819 380-2999</strong>.');
    } catch { busy.remove(); addMsg('bot', 'Problème de connexion. Appelez Patrick au <strong>819 380-2999</strong>.'); }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = text.value.trim();
    if (!v) return;
    addMsg('user', escapeHtml(v));
    text.value = '';
    const busy = document.createElement('div');
    busy.className = 'bot-msg bot-bot';
    busy.textContent = '…';
    msgs.appendChild(busy);
    try {
      const r = await fetch(BOT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: v }),
      });
      const j = await r.json();
      busy.remove();
      if (j.ok) addMsg('bot', escapeHtml(j.reply));
      else addMsg('bot', 'Désolé, je n’arrive pas à répondre pour l’instant. Appelez Patrick au <strong>819 380-2999</strong>.');
    } catch (err) {
      busy.remove();
      addMsg('bot', 'Désolé, problème de connexion. Appelez Patrick au <strong>819 380-2999</strong>.');
    }
  });

  function pollStatus(leadId) {
    const ref = document.getElementById('rdv-status-' + leadId);
    const tick = async () => {
      try {
        const r = await fetch(BOT_API + '/status?id=' + encodeURIComponent(leadId));
        const j = await r.json();
        if (j.ok && j.lead && j.lead.status === 'confirme') {
          if (ref) ref.innerHTML = `✅ <b>${leadId}</b> confirmé par Patrick : ${escapeHtml(j.lead.confirmCreneau)}`;
          return; // arrêt du poll
        }
      } catch {}
      setTimeout(tick, 8000); // re-poll toutes les 8s
    };
    setTimeout(tick, 4000);
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
})();
