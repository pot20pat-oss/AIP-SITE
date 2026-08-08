// AIP — Atelier Informatique Potvin | interactions légères
(function () {
  'use strict';

  // Menu mobile
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  // Header ombre au scroll
  var header = document.getElementById('header');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 12) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Animation d'entrée des cartes au scroll (IntersectionObserver)
  var cards = document.querySelectorAll('.card, .feature');
  if ('IntersectionObserver' in window && cards.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'none'; }
      });
    }, { threshold: 0.15 });
    cards.forEach(function (c) {
      c.style.opacity = '0';
      c.style.transform = 'translateY(16px)';
      c.style.transition = 'opacity .5s ease, transform .5s ease';
      io.observe(c);
    });
  }

  // Formulaire : envoi en AJAX (fetch) vers le Worker, reste sur la page
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault(); // reste sur le site, pas de redirection vers le Worker
      var status = document.getElementById('formStatus');
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours…'; }
      if (status) { status.style.display = 'none'; }

      var data = new FormData(form);
      fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      })
      .then(function () {
        if (status) {
          status.style.display = 'block';
          status.style.color = '#34d399';
          status.textContent = 'Merci ! On vous rappelle sous peu.';
        }
        form.reset();
        if (btn) { btn.disabled = false; btn.textContent = 'Envoyer la demande'; }
      })
      .catch(function () {
        if (status) {
          status.style.display = 'block';
          status.style.color = '#f87171';
          status.textContent = 'Erreur d\'envoi. Réessayez ou écrivez à pot20pat@gmail.com';
        }
        if (btn) { btn.disabled = false; btn.textContent = 'Envoyer la demande'; }
      });
    });
  }
})();
