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

  // Formulaire : envoi réel via POST + confirmation visuelle (pas de mailto)
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      // Laisse le navigateur faire le POST vers action= (Formspree/Worker).
      // On affiche une confirmation après un court délai si toujours sur la page.
      var status = document.getElementById('formStatus');
      var btn = form.querySelector('button[type="submit"]');
      if (status && btn) {
        setTimeout(function () {
          if (document.body.contains(form)) {
            btn.disabled = true;
            btn.textContent = 'Envoi en cours…';
          }
        }, 50);
      }
    });
  }
})();
