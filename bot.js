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
    </form>`;

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
  win.querySelector('#bot-close').addEventListener('click', () => win.classList.remove('open'));

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

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
})();
