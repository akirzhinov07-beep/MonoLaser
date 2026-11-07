(function () {
  'use strict';
  var root = document.documentElement;
  var M = window.Motion;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MO = !!(M && M.animate && !calm);
  root.classList.add(MO ? 'mo' : 'nomo');

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var rub = function (n) { return n.toLocaleString('ru-RU') + ' ₽'; };
  var plural = function (n, a, b, c) { var m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c); };
  var goal = function (name) { if (window.ym && window.MONO_YM) window.ym(window.MONO_YM, 'reachGoal', name); };
  var SPRING = MO ? { type: M.spring, visualDuration: 0.55, bounce: 0.18 } : null;
  var SNAP = MO ? { type: M.spring, visualDuration: 0.3, bounce: 0.4 } : null;

  // ---------- разбиение заголовков на слова ----------
  $$('[data-split]').forEach(function (el) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/( )/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (p === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
            if (!p) return;
            var w = document.createElement('span'); w.className = 'w';
            var i = document.createElement('span'); i.textContent = p;
            w.appendChild(i); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    el.setAttribute('aria-label', el.textContent);
    walk(el);
    $$('.w', el).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
  });

  // ---------- шапка ----------
  var top = $('[data-top]'), lastY = 0;
  function onScrollTop() {
    var y = window.scrollY;
    if (top) {
      top.classList.toggle('is-solid', y > 30);
      top.classList.toggle('is-hidden', y > 500 && y > lastY + 4 && !$('.city-pick__btn[aria-expanded=true]'));
      if (y < lastY - 4) top.classList.remove('is-hidden');
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScrollTop, { passive: true }); onScrollTop();

  // ---------- выбор города ----------
  $$('.city-pick').forEach(function (box) {
    var btn = $('.city-pick__btn', box), list = $('.city-pick__list', box);
    var close = function () { btn.setAttribute('aria-expanded', 'false'); list.hidden = true; };
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = btn.getAttribute('aria-expanded') === 'true';
      if (open) return close();
      btn.setAttribute('aria-expanded', 'true'); list.hidden = false;
      if (MO) {
        M.animate(list, { opacity: [0, 1], y: [-8, 0], scale: [0.96, 1] }, SNAP);
        M.animate($$('li', list), { opacity: [0, 1], x: [-8, 0] }, { delay: M.stagger(0.03), duration: 0.25 });
      }
      var a = $('a', list); if (a) a.focus();
    });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !list.hidden) { close(); btn.focus(); } });
  });

  // запоминаем город
  var current = document.body.getAttribute('data-city');
  if (current) store.set('mono_city', current);
  var saved = store.get('mono_city');
  var savedCard = saved && $('.pick__card[data-city="' + saved + '"]');
  if (savedCard) { savedCard.classList.add('is-saved'); $('.pick__badge', savedCard).hidden = false; }

  // цели Метрики
  $$('.js-book').forEach(function (el) { el.addEventListener('click', function () { goal('booking_click'); }); });
  $$('a[href^="tel:"]').forEach(function (el) { el.addEventListener('click', function () { goal('phone_click'); }); });
  $$('a[href*="rtext="]').forEach(function (el) { el.addEventListener('click', function () { goal('route_click'); }); });

  // ---------- FAQ ----------
  $$('.faq__q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq__item'), open = q.getAttribute('aria-expanded') === 'true';
      q.setAttribute('aria-expanded', String(!open)); item.classList.toggle('is-open', !open);
    });
  });

  // ---------- движение ----------
  if (MO) {
    // вход героя
    var hero = $('[data-hero]');
    if (hero) {
      M.animate($$('.hero__h .w>span', hero), { y: ['105%', '0%'] }, { type: M.spring, visualDuration: 0.8, bounce: 0.12, delay: M.stagger(0.07, { startDelay: 0.1 }) });
      M.animate($$('[data-enter]', hero), { opacity: [0, 1], y: [18, 0] }, { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: M.stagger(0.1, { startDelay: 0.45 }) });
      var mono = $$('[data-mono] span', hero);
      if (mono.length) M.animate(mono, { opacity: [0, 1], y: ['30%', '0%'], rotate: [-6, 0] }, { type: M.spring, visualDuration: 0.9, bounce: 0.25, delay: M.stagger(0.08, { startDelay: 0.1 }) });
      var picks = $$('.pick__card', hero);
      if (picks.length) M.animate(picks, { opacity: [0, 1], y: [40, 0], scale: [0.96, 1] }, { type: M.spring, visualDuration: 0.7, bounce: 0.2, delay: M.stagger(0.07, { startDelay: 0.5 }) });
      var disc = $('[data-disc]', hero);
      if (disc) M.animate(disc, { opacity: [0, 1], scale: [0.7, 1] }, { type: M.spring, visualDuration: 1.1, bounce: 0.2, delay: 0.15 });
      $$('[data-orb]', hero).forEach(function (o, i) {
        M.animate(o, { opacity: [0, 1], scale: [0, 1] }, { type: M.spring, visualDuration: 0.9, bounce: 0.45, delay: 0.35 + i * 0.12 });
      });

      // параллакс при прокрутке
      if (disc) M.scroll(M.animate(disc, { y: ['0%', '18%'], rotate: [0, 24] }, { ease: 'linear' }), { target: hero, offset: ['start start', 'end start'] });
      $$('[data-orb]', hero).forEach(function (o, i) {
        var d = [-160, 220, -260][i % 3], r = [120, -160, 200][i % 3];
        M.scroll(M.animate(o, { y: [0, d], rotate: [0, r] }, { ease: 'linear' }), { target: hero, offset: ['start start', 'end start'] });
      });
      // лёгкая реакция на курсор
      var art = $('.hero__art', hero);
      if (art && matchMedia('(pointer:fine)').matches) {
        hero.addEventListener('pointermove', function (e) {
          var r = hero.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          M.animate(art, { x: x * -24, y: y * -18 }, { type: M.spring, visualDuration: 0.8, bounce: 0 });
        });
      }
    }

    // заголовки секций и блоки при появлении
    $$('[data-split]').forEach(function (el) {
      if (hero && hero.contains(el)) return;
      M.inView(el, function () {
        M.animate($$('.w>span', el), { y: ['105%', '0%'] }, { type: M.spring, visualDuration: 0.7, bounce: 0.12, delay: M.stagger(0.06) });
      }, { amount: 0.4 });
    });
    $$('[data-reveal]').forEach(function (el) {
      M.inView(el, function () {
        M.animate(el, { opacity: [0, 1], y: [28, 0] }, { duration: 0.8, ease: [0.16, 1, 0.3, 1] });
        var items = $$('.zc__list li, .cx__tile', el);
        if (items.length) M.animate(items, { opacity: [0, 1], y: [14, 0] }, { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: M.stagger(0.04, { startDelay: 0.15 }) });
        var kids = $$('.bub', el);
        if (kids.length) M.animate(kids, { opacity: [0, 1], scale: [0.6, 1] }, { type: M.spring, visualDuration: 0.6, bounce: 0.4, delay: M.stagger(0.07) });
      }, { amount: 0.2 });
    });
    // вращение фирменных знаков при прокрутке
    $$('[data-spin]').forEach(function (g) {
      M.scroll(M.animate(g, { rotate: [-40, 140] }, { ease: 'linear' }), { target: g, offset: ['start end', 'end start'] });
    });
    // отклик кнопок
    M.press('.btn, .row, .faq__q, .pick__card', function (el) {
      M.animate(el, { scale: 0.97 }, { duration: 0.1 });
      return function () { M.animate(el, { scale: 1 }, SNAP); };
    });
  }

  // ---------- «Как проходит визит»: сценарий при прокрутке ----------
  var visit = $('[data-visit]');
  if (visit) {
    var steps = $$('[data-step]', visit), num = $('[data-visit-num]', visit), bar = $('[data-visit-bar]', visit), cur = -1;
    var setStep = function (i) {
      if (i === cur) return; var dir = i > cur ? 1 : -1; cur = i;
      steps.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      if (MO) {
        M.animate(num, { opacity: [1, 0], y: ['0%', (-30 * dir) + '%'] }, { duration: 0.15 }).finished.then(function () {
          num.textContent = String(i + 1);
          M.animate(num, { opacity: [0, 1], y: [(30 * dir) + '%', '0%'] }, SPRING);
        });
        M.animate(bar, { scaleX: (i + 1) / steps.length }, SPRING);
      } else { num.textContent = String(i + 1); bar.style.transform = 'scaleX(' + ((i + 1) / steps.length) + ')'; }
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) setStep(steps.indexOf(e.target)); });
      }, { rootMargin: '-45% 0px -45% 0px' });
      steps.forEach(function (s) { io.observe(s); });
    }
    setStep(0);
  }

})();
