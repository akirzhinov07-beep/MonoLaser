(function () {
  'use strict';
  var root = document.documentElement;
  var G = window.gsap, ST = window.ScrollTrigger;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var GS = !!(G && ST && !calm);
  root.classList.add(GS ? 'mo' : 'nomo');

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var goal = function (name) { if (window.ym && window.MONO_YM) window.ym(window.MONO_YM, 'reachGoal', name); };
  var DESKTOP = '(min-width: 1061px) and (pointer: fine)';
  var isDesktop = function () { return matchMedia(DESKTOP).matches; };

  // Фирменные фигуры для морфинга
  var SHAPES = {
    flower: 'M50 6c9 0 15 9 13 22 13-6 25-2 28 7s-5 18-19 20c10 10 11 22 4 28s-19 2-26-11c-7 13-19 17-26 11s-6-18 4-28C17 53 9 44 12 35s15-13 28-7C38 15 41 6 50 6Z',
    petals: 'M50 4C62 4 66 28 54 46 72 34 96 38 96 50S72 66 54 54C66 72 62 96 50 96S34 72 46 54C28 66 4 62 4 50S28 34 46 46C34 28 38 4 50 4Z',
    star: 'M50 0 57 37 92 14 64 44 100 50 64 56 92 86 57 63 50 100 43 63 8 86 36 56 0 50 36 44 8 14 43 37Z'
  };
  var ORDER = ['flower', 'petals', 'star', 'petals'];

  // ---------- разбиение текста ----------
  function splitWords(el) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/( )/).forEach(function (p) {
            if (p === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
            if (!p) return;
            var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
            var i = document.createElement('span'); i.textContent = p; w.appendChild(i); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains('laser')) walk(n);
      });
    };
    el.setAttribute('aria-label', el.textContent.trim()); walk(el);
  }
  function splitChars(el) {
    var chars = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      n.textContent.split(/( )/).forEach(function (p) {
        if (p === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
        if (!p) return;
        var wd = document.createElement('span'); wd.style.whiteSpace = 'nowrap'; wd.setAttribute('aria-hidden', 'true');
        Array.from(p).forEach(function (c) { var s = document.createElement('span'); s.className = 'ch'; s.textContent = c; wd.appendChild(s); chars.push(s); });
        frag.appendChild(wd);
      });
      n.parentNode.replaceChild(frag, n);
    });
    return chars;
  }
  $$('[data-split]').forEach(splitWords);
  var laserH = $('[data-laser]'), laserChars = [];
  if (laserH) { laserH.setAttribute('aria-label', laserH.textContent.trim()); if (GS) laserChars = splitChars(laserH); }

  // ---------- плавная прокрутка (только компьютер) ----------
  var smoother = null;
  if (GS && window.ScrollSmoother && isDesktop() && $('#smooth-wrapper')) {
    smoother = window.ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1.1, effects: false, normalizeScroll: false });
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var t = $(id); if (!t) return;
      if (smoother) { e.preventDefault(); smoother.scrollTo(t, true, 'top 70px'); }
    });
  });

  // ---------- шапка ----------
  var top = $('[data-top]'), lastY = 0;
  function onScrollTop() {
    var y = window.scrollY;
    if (top) {
      top.classList.toggle('is-solid', y > 30);
      if (y > 500 && y > lastY + 4 && !$('.city-pick__btn[aria-expanded=true]')) top.classList.add('is-hidden');
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
      if (btn.getAttribute('aria-expanded') === 'true') return close();
      btn.setAttribute('aria-expanded', 'true'); list.hidden = false;
      if (GS) {
        G.fromTo(list, { autoAlpha: 0, y: -10, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.8)' });
        G.fromTo($$('li', list), { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.3, stagger: 0.035, ease: 'power2.out' });
      }
      var a = $('a', list); if (a) a.focus();
    });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !list.hidden) { close(); btn.focus(); } });
  });

  var current = document.body.getAttribute('data-city');
  if (current) store.set('mono_city', current);
  var saved = store.get('mono_city');
  var savedCard = saved && $('.pick__card[data-city="' + saved + '"]');
  if (savedCard) { savedCard.classList.add('is-saved'); $('.pick__badge', savedCard).hidden = false; }

  $$('.js-book').forEach(function (el) { el.addEventListener('click', function () { goal('booking_click'); }); });
  $$('a[href^="tel:"]').forEach(function (el) { el.addEventListener('click', function () { goal('phone_click'); }); });
  $$('a[href*="rtext="]').forEach(function (el) { el.addEventListener('click', function () { goal('route_click'); }); });

  // ---------- FAQ ----------
  $$('.faq__q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq__item'), open = q.getAttribute('aria-expanded') === 'true';
      q.setAttribute('aria-expanded', String(!open)); item.classList.toggle('is-open', !open);
      if (smoother) setTimeout(function () { ST.refresh(); }, 480);
    });
  });

  if (!GS) return;

  // =====================================================================
  //  ДАЛЬШЕ — ТОЛЬКО АНИМАЦИЯ (GSAP)
  // =====================================================================
  var hero = $('[data-hero]');

  // ---------- 1. космос: звёзды и цветы MONO в глубине ----------
  var canvas = hero && $('[data-space]', hero);
  if (canvas) {
    var ctx = canvas.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0;
    var N = isDesktop() ? 80 : 30, parts = [], px = 0, py = 0, tx = 0, ty = 0, t = 0;
    var resize = function () { W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); window.addEventListener('resize', resize);
    for (var i = 0; i < N; i++) parts.push({ x: Math.random(), y: Math.random(), z: 0.25 + Math.random() * 0.75, s: Math.random() < 0.35 ? 'star' : 'dot', r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.01, ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 1.6, blue: Math.random() < 0.3 });
    var star = function (x, y, R) { ctx.beginPath(); for (var k = 0; k < 8; k++) { var a = k * Math.PI / 4, rr = k % 2 ? R * 0.28 : R; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); };
    var draw = function () {
      t += 0.016; tx += (px - tx) * 0.05; ty += (py - ty) * 0.05;
      var sy = window.scrollY;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y -= 0.00012 * p.z * p.sp; if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
        p.r += p.vr;
        var x = p.x * W + tx * 40 * p.z, y = p.y * H + ty * 30 * p.z - sy * 0.25 * p.z;
        var a = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(t * p.sp + p.ph));
        ctx.globalAlpha = a * (0.4 + p.z * 0.6);
        ctx.fillStyle = p.blue ? '#BFD2F0' : '#FFFFFF';
        if (p.s === 'star') { ctx.save(); ctx.translate(x, y); ctx.rotate(p.r); star(0, 0, 3 + p.z * 7); ctx.restore(); }
        else { ctx.beginPath(); ctx.arc(x, y, 0.8 + p.z * 1.8, 0, 6.28); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
    };
    var running = false;
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (e.isIntersecting && !running) { G.ticker.add(draw); running = true; }
      else if (!e.isIntersecting && running) { G.ticker.remove(draw); running = false; }
    }); });
    io.observe(hero);
    hero.addEventListener('pointermove', function (e) { var r = hero.getBoundingClientRect(); px = (e.clientX - r.left) / r.width - 0.5; py = (e.clientY - r.top) / r.height - 0.5; });
  }

  // ---------- свет под курсором и параллакс сцены ----------
  var glow = hero && $('[data-glow]', hero), art = hero && $('.hero__art', hero);
  if (hero && isDesktop()) {
    var gx = glow && G.quickTo(glow, 'x', { duration: 0.6, ease: 'power3' }), gy = glow && G.quickTo(glow, 'y', { duration: 0.6, ease: 'power3' });
    var ax = art && G.quickTo(art, 'x', { duration: 1.2, ease: 'power3' }), ay = art && G.quickTo(art, 'y', { duration: 1.2, ease: 'power3' });
    hero.addEventListener('pointerenter', function () { if (glow) G.to(glow, { opacity: 1, duration: 0.6 }); });
    hero.addEventListener('pointerleave', function () { if (glow) G.to(glow, { opacity: 0, duration: 0.6 }); });
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (gx) { gx(x); gy(y); }
      if (ax) { ax((x / r.width - 0.5) * -30); ay((y / r.height - 0.5) * -22); }
    });
  }

  // ---------- 2. вход: лазер сканирует заголовок ----------
  if (hero) {
    var tl = G.timeline({ defaults: { ease: 'expo.out' } });
    if (laserH && laserChars.length) {
      var beam = $('.laser', laserH), Wh = laserH.offsetWidth, hr = laserH.getBoundingClientRect();
      G.set(laserChars, { opacity: 0.12 });
      tl.set(beam, { opacity: 1, x: -30 }, 0.15)
        .to(beam, { x: Wh + 30, duration: 1.5, ease: 'power2.inOut' }, 0.15)
        .to(beam, { opacity: 0, duration: 0.3 }, 1.55);
      laserChars.forEach(function (ch) {
        var cr = ch.getBoundingClientRect(), k = Math.max(0, Math.min(1, (cr.left + cr.width / 2 - hr.left) / Wh));
        var at = 0.15 + 1.5 * (k < 0.5 ? Math.sqrt(k / 2) : 1 - Math.sqrt((1 - k) / 2)); // power2.inOut обратная
        tl.to(ch, { opacity: 1, duration: 0.25, ease: 'none' }, at)
          .fromTo(ch, { textShadow: '0 0 22px rgba(255,255,255,1), 0 0 6px rgba(255,255,255,1)', color: '#fff' }, { textShadow: '0 0 0px rgba(255,255,255,0), 0 0 0px rgba(255,255,255,0)', color: '#2A201C', duration: 0.9, ease: 'power2.out' }, at);
      });
    }
    var mono = $$('[data-mono] span', hero);
    if (mono.length) tl.fromTo(mono, { autoAlpha: 0, yPercent: 40, rotation: -8, filter: 'blur(12px)' }, { autoAlpha: 1, yPercent: 0, rotation: 0, filter: 'blur(0px)', duration: 1.3, stagger: 0.09 }, 0.1);
    tl.fromTo($$('[data-enter]', hero), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1 }, laserChars.length ? 0.9 : 0.45);
    var picks = $$('.pick__card', hero);
    if (picks.length) tl.fromTo(picks, { autoAlpha: 0, y: 60, rotationX: -25, transformPerspective: 900 }, { autoAlpha: 1, y: 0, rotationX: 0, duration: 1.1, stagger: 0.08, ease: 'back.out(1.4)' }, 0.6);
    var disc = $('[data-disc]', hero);
    if (disc) tl.fromTo(disc, { autoAlpha: 0, scale: 0.6, rotation: -30 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 1.8 }, 0.1);
    var orbs = $$('[data-orb]', hero);
    tl.fromTo(orbs, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 1.2, stagger: 0.12, ease: 'back.out(2.2)' }, 0.4);
    if (canvas) tl.fromTo(canvas, { autoAlpha: 0 }, { autoAlpha: 1, duration: 2 }, 0.2);

    // 3. фигуры перетекают одна в другую
    orbs.forEach(function (o, i) {
      var path = $('path', o); if (!path) return;
      var seq = G.timeline({ repeat: -1, delay: 1.5 + i * 0.6 });
      for (var k = 1; k <= ORDER.length; k++) seq.to(path, { morphSVG: SHAPES[ORDER[(i + k) % ORDER.length]], duration: 1.6, ease: 'expo.inOut' }, '+=2.2');
      G.to(o, { y: -14, duration: 2.6 + i * 0.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    });
    // параллакс при прокрутке
    if (disc) G.to(disc, { yPercent: 22, rotation: 30, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    orbs.forEach(function (o, i) {
      G.to(o, { yPercent: [-120, 160, -200][i % 3], rotation: [140, -180, 220][i % 3], ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } });
    });
    if (laserH) G.to(laserH, { yPercent: -18, autoAlpha: 0.2, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }

  // ---------- заголовки и блоки при появлении ----------
  $$('[data-split]').forEach(function (el) {
    if (hero && hero.contains(el)) return;
    G.fromTo($$('.w>span', el), { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1.1, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });
  $$('[data-reveal]').forEach(function (el) {
    var is3d = el.classList.contains('zc') || el.classList.contains('pk__card');
    G.fromTo(el, { autoAlpha: 0, y: is3d ? 90 : 40, rotationX: is3d ? 28 : 0, transformPerspective: 1000, transformOrigin: '50% 100%' },
      { autoAlpha: 1, y: 0, rotationX: 0, duration: 1.2, ease: 'expo.out', delay: el.classList.contains('zc') ? 0.1 * $$('.zc').indexOf(el) : 0, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    var items = $$('.zc__list li, .cx__tile', el);
    if (items.length) G.fromTo(items, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.04, delay: 0.25, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    var bubs = $$('.bub', el);
    if (bubs.length) G.fromTo(bubs, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.9, stagger: 0.08, ease: 'back.out(2)', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  $$('[data-spin]').forEach(function (g) {
    G.fromTo(g, { rotation: -50 }, { rotation: 160, ease: 'none', scrollTrigger: { trigger: g, start: 'top bottom', end: 'bottom top', scrub: 0.8 } });
  });

  // ---------- 4. «Как проходит визит»: сцена с закреплением ----------
  var visit = $('[data-visit]');
  if (visit) {
    var steps = $$('[data-step]', visit), num = $('[data-visit-num]', visit), bar = $('[data-visit-bar]', visit);
    var shape = $('[data-morph]', visit), line = $('[data-draw]', visit), cur = -1;
    var setStep = function (i, instant) {
      if (i === cur) return; var dir = i > cur ? 1 : -1, prev = cur; cur = i;
      steps.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      if (visit.classList.contains('is-pinned')) {
        G.to(steps.filter(function (s, k) { return k !== i; }), { autoAlpha: 0, y: -50 * dir, filter: 'blur(8px)', duration: 0.28, ease: 'power3.in', overwrite: true });
        G.fromTo(steps[i], { autoAlpha: 0, y: 60 * dir, filter: 'blur(8px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: instant ? 0 : 0.8, delay: instant ? 0 : 0.25, ease: 'expo.out', overwrite: true });
      }
      if (num) G.timeline().to(num, { yPercent: -40 * dir, autoAlpha: 0, duration: 0.18, ease: 'power2.in' }).add(function () { num.textContent = String(i + 1); }).fromTo(num, { yPercent: 40 * dir }, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'expo.out' });
      if (bar) G.to(bar, { scaleX: (i + 1) / steps.length, duration: 0.8, ease: 'expo.out' });
      if (shape) G.to(shape, { morphSVG: SHAPES[ORDER[i % ORDER.length]], rotation: i * 45, transformOrigin: '50% 50%', duration: 1.1, ease: 'expo.inOut' });
    };
    var mm = G.matchMedia();
    mm.add('(min-width: 1061px)', function () {
      visit.classList.add('is-pinned'); visit.closest('.sec').style.padding = '0';
      G.set(steps, { autoAlpha: 0 }); cur = -1; setStep(0, true);
      var tlv = G.timeline({ scrollTrigger: {
        trigger: visit.closest('.sec'), start: 'top top', end: '+=' + (steps.length * 70) + '%', pin: true, scrub: 0.6,
        onUpdate: function (self) { setStep(Math.min(steps.length - 1, Math.floor(self.progress * steps.length * 0.999))); }
      } });
      if (line) tlv.fromTo(line, { drawSVG: '0%' }, { drawSVG: '100%', ease: 'none' });
      return function () { visit.classList.remove('is-pinned'); visit.closest('.sec').style.padding = ''; G.set(steps, { clearProps: 'all' }); };
    });
    mm.add('(max-width: 1060px)', function () {
      steps.forEach(function (s) { G.fromTo(s, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 85%', once: true } }); });
    });
  }

  // ---------- кнопки: упругое нажатие ----------
  $$('.btn, .row, .faq__q, .pick__card').forEach(function (el) {
    el.addEventListener('pointerdown', function () { G.to(el, { scale: 0.97, duration: 0.12, ease: 'power2.out' }); });
    var up = function () { G.to(el, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.4)' }); };
    el.addEventListener('pointerup', up); el.addEventListener('pointerleave', up);
  });

  // ---------- 6. переход: карточка города раскрывается в страницу ----------
  $$('.pick__card').forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      var r = card.getBoundingClientRect(), href = card.getAttribute('href');
      var ov = document.createElement('div'); ov.className = 'pt'; ov.innerHTML = '<span class="logo">MONO</span>';
      G.set(ov, { left: r.left, top: r.top, width: r.width, height: r.height, borderRadius: 24, background: '#fff' });
      document.body.appendChild(ov);
      G.timeline({ onComplete: function () { location.href = href; } })
        .to(ov, { left: 0, top: 0, width: innerWidth, height: innerHeight, borderRadius: 0, background: '#F3DFA2', duration: 0.75, ease: 'expo.inOut' })
        .to($('.logo', ov), { opacity: 1, duration: 0.3 }, '-=0.25');
      setTimeout(function () { location.href = href; }, 1600);
    });
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) $$('.pt').forEach(function (o) { o.remove(); }); });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
})();
