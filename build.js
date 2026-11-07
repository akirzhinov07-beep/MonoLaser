// Сборка сайта MONO: node build.js  →  dist/ (содержимое загружается на хостинг)
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/site.json'), 'utf8'));
const D = site.domain.replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);

const esc = (s = '') => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rub = n => n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
const tel = p => p.replace(/[^\d+]/g, '');
const isTodo = s => !s || /TODO/.test(s);
const enc = encodeURIComponent;
const minPrice = pl => Math.min(...Object.values(pl.zones).map(z => z.price));
const nb = s => s.replace(/ (в|во|и|с|к|на|за|от|до|по|из) /g, ' $1 ');

function rmrf(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f), d = path.join(dst, f);
    fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
function write(rel, content) {
  const p = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

// ---------- фирменные знаки из хайлайтов Instagram ----------
const G = {
  flower: '<path d="M50 6c9 0 15 9 13 22 13-6 25-2 28 7s-5 18-19 20c10 10 11 22 4 28s-19 2-26-11c-7 13-19 17-26 11s-6-18 4-28C17 53 9 44 12 35s15-13 28-7C38 15 41 6 50 6Z"/>',
  petals: '<g><ellipse cx="50" cy="24" rx="14" ry="24"/><ellipse cx="50" cy="76" rx="14" ry="24"/><ellipse cx="24" cy="50" rx="24" ry="14"/><ellipse cx="76" cy="50" rx="24" ry="14"/></g>',
  star: '<path d="M50 0 57 37 92 14 64 44 100 50 64 56 92 86 57 63 50 100 43 63 8 86 36 56 0 50 36 44 8 14 43 37Z"/>',
};
const glyph = (name, cls = '', attrs = '') => `<svg class="g ${cls}" viewBox="0 0 100 100" aria-hidden="true" ${attrs}>${G[name]}</svg>`;

const icon = {
  ig: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/></svg>',
  pin: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  cal: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8"/></svg>',
  bus: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 11h14M8 21v-3M16 21v-3" stroke="currentColor" stroke-width="1.8"/></svg>',
  plus: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};

// ---------- адреса и карты ----------
const realStudios = c => c.studios.filter(st => !isTodo(st.address));
const hasPhone = c => !isTodo(c.phone);
const fullAddr = (c, st) => `${c.name}, ${st.address}`;
function routeUrl(c, st, mode = 'auto') {
  if (st && st.lat) return `https://yandex.ru/maps/?rtext=~${st.lat},${st.lon}&rtt=${mode}`;
  if (st && !isTodo(st.address)) return `https://yandex.ru/maps/?rtext=~${enc(fullAddr(c, st))}&rtt=${mode}`;
  return `https://yandex.ru/maps/?text=${enc(`${site.brand} лазерная эпиляция ${c.name}`)}`;
}
function mapSrc(c, st) {
  if (st.yandex_org_id) return `https://yandex.ru/map-widget/v1/?oid=${st.yandex_org_id}&ol=biz&z=16`;
  if (st.lat) return `https://yandex.ru/map-widget/v1/?ll=${st.lon},${st.lat}&z=16&pt=${st.lon},${st.lat},pm2dgl`;
  if (!isTodo(st.address)) return `https://yandex.ru/map-widget/v1/?text=${enc(fullAddr(c, st))}&z=16`;
  return `https://yandex.ru/map-widget/v1/?text=${enc(c.name)}&z=12`;
}
const yaLink = (c, st) => st && st.yandex_org_id ? `https://yandex.ru/maps/org/${st.yandex_org_id}/` : `https://yandex.ru/maps/?text=${enc(`${site.brand} лазерная эпиляция ${c.name}`)}`;
const addrLine = c => { const r = realStudios(c); return r.length ? r.map(st => st.address).join(' и ') : (c.studios.length > 1 ? `${c.studios.length} студии, адреса скоро` : 'Адрес скоро'); };
const studiosWord = n => n === 1 ? 'студия' : (n < 5 ? 'студии' : 'студий');

// ---------- общие части ----------
function head({ title, desc, url, jsonld = [], noindex = false }) {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#F3DFA2">
${site.yandex_verification ? `<meta name="yandex-verification" content="${esc(site.yandex_verification)}">` : ''}
<meta property="og:type" content="website">
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="${site.brand}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${D}/assets/img/og.png">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/unbounded-cyrillic-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/onest-cyrillic-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/style.css">
<script>document.documentElement.classList.add('js')</script>
${jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
${metrika()}
</head>`;
}

function metrika() {
  const id = site.yandex_metrika_id;
  if (!id) return '';
  return `<script>(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');ym(${Number(id)},'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});window.MONO_YM=${Number(id)};</script>
<noscript><div><img src="https://mc.yandex.ru/watch/${Number(id)}" style="position:absolute;left:-9999px" alt=""></div></noscript>`;
}

const logo = (cls = '') => `<span class="logo ${cls}">MONO</span>`;

function header(city) {
  return `<a class="skip" href="#main">Перейти к содержанию</a>
<header class="top" data-top>
  <div class="top__in">
    <a class="top__logo" href="/" aria-label="${site.brand} — на главную">${logo()}</a>
    <div class="city-pick">
      <button class="city-pick__btn" type="button" aria-expanded="false" aria-controls="city-list">
        ${icon.pin}<span>${city ? esc(city.name) : 'Выбрать город'}</span>
        <svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
      </button>
      <ul class="city-pick__list" id="city-list" hidden>
        ${site.cities.map(c => `<li><a href="/${c.slug}/"${city && city.slug === c.slug ? ' aria-current="page"' : ''}><span>${esc(c.name)}</span><small>${c.studios.length} ${studiosWord(c.studios.length)}</small></a></li>`).join('')}
      </ul>
    </div>
    ${city ? `<nav class="top__nav" aria-label="Разделы"><a href="#prices">Цены</a><a href="#visit">Как проходит</a><a href="#where">Адреса</a><a href="#reviews">Отзывы</a></nav>` : '<span class="top__gap"></span>'}
    ${city
      ? `<a class="btn btn--ink btn--sm js-book" href="${city.booking_url}" target="_blank" rel="noopener">Записаться</a>`
      : '<a class="btn btn--ink btn--sm" href="#cities">Записаться</a>'}
  </div>
</header>`;
}

function footer() {
  return `<footer class="foot">
  <div class="wrap">
    <div class="foot__top">
      <p class="foot__big">${logo('logo--xl')}</p>
      <p class="foot__lead">Сеть студий лазерной эпиляции. ${site.cities.length} городов, ${site.cities.reduce((n, c) => n + c.studios.length, 0)} студий.</p>
    </div>
    <ul class="foot__cities">
      ${site.cities.map(c => `<li>
        <a class="foot__city" href="/${c.slug}/">${esc(c.name)}</a>
        ${c.studios.map(st => `<span>${isTodo(st.address) ? 'Адрес скоро' : esc(st.address)}</span>`).join('')}
        ${hasPhone(c) ? `<a href="tel:${tel(c.phone)}">${esc(c.phone)}</a>` : ''}
        <a href="${c.instagram}" target="_blank" rel="noopener nofollow">${icon.ig}${esc(c.instagram_handle)}*</a>
        <a href="${c.booking_url}" target="_blank" rel="noopener">${icon.cal}Онлайн-запись</a>
      </li>`).join('')}
    </ul>
    <div class="foot__legal">
      <p>Онлайн-запись работает через YCLIENTS. Цены на сайте не являются публичной офертой — актуальную стоимость подтвердит администратор.</p>
      <p>* Instagram принадлежит компании Meta, признанной экстремистской организацией и запрещённой в России.</p>
      <p>Имеются противопоказания, необходима консультация специалиста.</p>
      <p>© ${new Date().getFullYear()} ${site.brand}</p>
    </div>
  </div>
</footer>`;
}

function mobileBar(city) {
  if (!city) return `<div class="mbar mbar--one"><a class="mbar__main" href="#cities">${icon.cal}<span>Выбрать город и записаться</span></a></div>`;
  return `<div class="mbar" role="navigation" aria-label="Быстрые действия">
  ${hasPhone(city) ? `<a href="tel:${tel(city.phone)}">${icon.ig}<span>Позвонить</span></a>` : `<a href="${city.instagram}" target="_blank" rel="noopener nofollow">${icon.ig}<span>Instagram*</span></a>`}
  <a href="#where">${icon.pin}<span>Адрес</span></a>
  <a class="mbar__main js-book" href="${city.booking_url}" target="_blank" rel="noopener">${icon.cal}<span>Записаться онлайн</span></a>
</div>`;
}

const faqBlock = () => `<section class="sec sec--faq" id="faq" aria-labelledby="h-faq">
  <div class="wrap faq">
    <h2 class="h2" id="h-faq" data-split>Частые вопросы</h2>
    <div class="faq__list">
      ${site.faq.map((f, i) => `<div class="faq__item">
        <h3><button type="button" class="faq__q" aria-expanded="false" aria-controls="faq-${i}">${esc(f.q)}<span class="faq__ic" aria-hidden="true">${icon.plus}</span></button></h3>
        <div class="faq__a" id="faq-${i}" role="region"><div><p>${esc(f.a)}</p></div></div>
      </div>`).join('')}
    </div>
  </div>
</section>`;

// ---------- прайс ----------
const SIZE_ORDER = ['large', 'medium', 'small'];
function priceBoard(pl) {
  const zone = (key, i) => {
    const z = pl.zones[key];
    return `<article class="zc zc--${key}" data-reveal>
      ${glyph(['petals', 'flower', 'star'][i], 'zc__g', 'data-spin')}
      <header class="zc__head"><h3>${z.title}</h3><p class="zc__price">${rub(z.price)}</p><p class="zc__per">за одну зону</p></header>
      <ul class="zc__list">${z.items.map(it => `<li>${esc(it)}</li>`).join('')}</ul>
    </article>`;
  };
  return `<div class="zcs">${SIZE_ORDER.map(zone).join('')}</div>
  <div class="cx">
    <h3 class="cx__h" data-split>Комплексы за один визит</h3>
    <div class="cx__grid" data-reveal>
      ${Object.entries(pl.complexes).map(([n, p]) => `<div class="cx__tile"><p class="cx__n">${n}<span>зоны</span></p><p class="cx__p">${rub(p)}</p></div>`).join('')}
      <div class="cx__tile cx__tile--face"><p class="cx__t">Лицо полностью</p><p class="cx__p">${rub(pl.face)}</p></div>
      ${pl.extra_zone ? `<div class="cx__tile cx__tile--extra"><p class="cx__t">Доп. зона к комплексу</p><ul><li>малая <b>+${rub(pl.extra_zone.small)}</b></li><li>средняя <b>+${rub(pl.extra_zone.medium)}</b></li><li>большая <b>+${rub(pl.extra_zone.large)}</b></li></ul></div>` : ''}
    </div>
    <div class="pk">
      ${pl.packages.map((p, i) => `<div class="pk__card pk__card--${i}" data-reveal>
        ${glyph(i ? 'star' : 'petals', 'pk__g', 'data-spin')}
        <h3 class="pk__name">${esc(p.name)}</h3>
        <p class="pk__price">${rub(p.price)}</p>
        <p class="pk__inc">${esc(p.includes)}</p>
      </div>`).join('')}
    </div>
  </div>`;
}

// ---------- страница города ----------
function cityPage(c) {
  const pl = site.price_lists[c.price_list];
  const from = minPrice(pl);
  const url = `${D}/${c.slug}/`;
  const n = c.studios.length;
  const title = `Лазерная эпиляция ${c.in} — цены от ${from} ₽ | ${site.brand}${c.former_name ? ` (ex. ${c.former_name})` : ''}`;
  const desc = `${n > 1 ? `${n} студии` : 'Студия'} лазерной эпиляции ${site.brand} ${c.in}${realStudios(c).length ? ': ' + addrLine(c) : ''}${c.former_name ? `, бывший ${c.former_name}` : ''}. Зоны от ${from} ₽, комплексы и «всё тело». Онлайн-запись, отзывы, как добраться.`;

  const offers = [];
  for (const k of SIZE_ORDER) for (const i of pl.zones[k].items) offers.push({ '@type': 'Offer', price: pl.zones[k].price, priceCurrency: 'RUB', itemOffered: { '@type': 'Service', name: `Лазерная эпиляция: ${i}` } });
  for (const p of pl.packages) offers.push({ '@type': 'Offer', price: p.price, priceCurrency: 'RUB', itemOffered: { '@type': 'Service', name: p.name, description: p.includes } });
  const businesses = c.studios.map((st, i) => ({
    '@context': 'https://schema.org', '@type': 'BeautySalon',
    '@id': `${url}#studio${i ? '-' + (i + 1) : ''}`, name: `${site.brand} — лазерная эпиляция ${c.in}`, url,
    alternateName: c.former_name || undefined,
    telephone: hasPhone(c) ? c.phone : undefined, image: `${D}/assets/img/og.png`,
    priceRange: `${from}–${pl.packages[pl.packages.length - 1].price} ₽`,
    address: { '@type': 'PostalAddress', addressCountry: 'RU', addressLocality: c.name, streetAddress: isTodo(st.address) ? undefined : st.address },
    geo: st.lat ? { '@type': 'GeoCoordinates', latitude: st.lat, longitude: st.lon } : undefined,
    openingHours: isTodo(c.hours) ? undefined : c.hours_schema,
    sameAs: [c.instagram, st.yandex_org_id ? yaLink(c, st) : null].filter(Boolean),
    potentialAction: { '@type': 'ReserveAction', target: c.booking_url },
    hasOfferCatalog: i === 0 ? { '@type': 'OfferCatalog', name: 'Прайс', itemListElement: offers } : undefined,
  }));
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: site.brand, item: D + '/' },
    { '@type': 'ListItem', position: 2, name: c.name, item: url }] };
  const faq = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: site.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };


  const photos = c.studios.flatMap(st => st.photos || []);
  const bubbles = (photos.length ? photos : [{ t: 'Ресепшен' }, { t: 'Кабинет' }, { t: 'Лазер' }, { t: 'Зона отдыха' }]).map((p, i) => `<li class="bub bub--${i % 4}">
      <span class="bub__ring">${p.file ? `<img src="/assets/img/${c.slug}/${p.file}" alt="${esc(p.alt || `Студия ${site.brand} ${c.in}`)}" loading="lazy" decoding="async">` : glyph(['petals', 'flower', 'star', 'petals'][i % 4], 'bub__g')}</span>
      <span class="bub__t">${esc(p.t || p.alt || 'Студия')}</span>
    </li>`).join('');

  const studios = c.studios.map((st, i) => `<article class="st${n > 1 ? ' st--half' : ''}" data-reveal>
    <div class="st__text">
      ${n > 1 ? `<p class="st__no">Студия ${i + 1}</p>` : ''}
      <h3 class="st__addr">${isTodo(st.address) ? 'Адрес скоро появится' : esc(st.address)}</h3>
      <p class="st__meta">${esc(c.name)}${st.metro && !isTodo(st.metro) ? `, ${esc(st.metro)}` : ''}${isTodo(c.hours) ? '' : ` · ${esc(c.hours)}`}</p>
      ${isTodo(st.directions) ? '' : `<p class="st__dir">${esc(st.directions)}</p>`}
      <div class="st__btns">
        <a class="btn btn--ink" href="${routeUrl(c, st)}" target="_blank" rel="noopener">${icon.pin}Маршрут на машине</a>
        <a class="btn btn--line" href="${routeUrl(c, st, 'mt')}" target="_blank" rel="noopener">${icon.bus}Общественный транспорт</a>
      </div>
    </div>
    <div class="st__map"><iframe title="Карта: ${site.brand}, ${esc(isTodo(st.address) ? c.name : fullAddr(c, st))}" src="${mapSrc(c, st)}" loading="lazy" allowfullscreen></iframe></div>
  </article>`).join('');

  const reviewOrgs = c.reviews_org_id ? [{ yandex_org_id: c.reviews_org_id, rating: c.reviews_rating, ratings_count: c.reviews_count, address: '' }] : c.studios.filter(st => st.yandex_org_id);
  const reviews = reviewOrgs.length
    ? reviewOrgs.map(st => `${reviewOrgs.length > 1 && st.address ? `<h3 class="rv__h">${esc(st.address)}</h3>` : ''}${st.rating ? `<p class="rv__score"><b>${st.rating}</b><span>${glyph('star', 'rv__star')}${st.ratings_count} оценок на Яндекс Картах</span></p>` : ''}<div class="rv__frame"><iframe title="Отзывы о ${site.brand} ${c.in} на Яндекс Картах" src="https://yandex.ru/maps-reviews-widget/${st.yandex_org_id}?comments" loading="lazy"></iframe></div>
       <p class="rv__more"><a class="btn btn--line" href="${yaLink(c, st)}reviews/" target="_blank" rel="noopener">Все отзывы и оставить свой</a></p>`).join('')
    : `<div class="rv__empty" data-reveal>${glyph('star', 'rv__g', 'data-spin')}<p>Отзывы клиентов из карточ${n > 1 ? 'ек студий' : 'ки студии'} на Яндекс Картах появятся здесь.</p><a class="btn btn--ink" href="${yaLink(c)}" target="_blank" rel="noopener">Открыть на Яндекс Картах</a></div>`;

  const others = site.cities.filter(o => o.slug !== c.slug);
  const lead = `${n > 1 ? `${n} студии ${c.in}. ` : ''}Зоны от ${rub(from)}, комплексы и «всё тело» за один визит. Запись онлайн за минуту.${(c.studios.find(st => st.rating) || (c.reviews_rating ? { rating: c.reviews_rating } : null)) ? ` Рейтинг ${(c.studios.find(st => st.rating) || { rating: c.reviews_rating }).rating} на Яндекс Картах.` : ''}`;

  return `${head({ title, desc, url, jsonld: [...businesses, crumbs, faq] })}
<body data-city="${c.slug}">
${header(c)}
<main id="main">

<section class="hero" data-hero>
  <div class="hero__art" aria-hidden="true">
    <div class="disc" data-disc>${logo('logo--disc')}</div>
    ${glyph('petals', 'orb orb--1', 'data-orb="1"')}${glyph('flower', 'orb orb--2', 'data-orb="2"')}${glyph('star', 'orb orb--3', 'data-orb="3"')}
  </div>
  <div class="wrap hero__in">
    <nav class="crumbs" aria-label="Хлебные крошки"><a href="/">${site.brand}</a><span aria-hidden="true">/</span><span>${esc(c.name)}</span></nav>
    <h1 class="hero__h" data-split>Лазерная эпиляция ${esc(c.in).replace(' ', ' ')}</h1>
    <p class="hero__lead" data-enter>${lead}${c.former_name ? `<br><span class="hero__former">Раньше — ${esc(c.former_name)}. Те же мастера, новое имя.</span>` : ''}</p>
    <div class="hero__cta" data-enter>
      <a class="btn btn--ink btn--lg js-book" href="${c.booking_url}" target="_blank" rel="noopener">${icon.cal}Записаться онлайн</a>
      <a class="btn btn--glass btn--lg" href="#prices">Смотреть цены</a>
    </div>
    <ul class="hero__studios" data-enter>
      ${c.studios.map(st => `<li><a href="${routeUrl(c, st)}" target="_blank" rel="noopener">${icon.pin}<span>${isTodo(st.address) ? 'Адрес скоро' : esc(st.address)}</span></a></li>`).join('')}
      <li><a href="${c.instagram}" target="_blank" rel="noopener nofollow">${icon.ig}<span>${esc(c.instagram_handle)}*</span></a></li>
    </ul>
  </div>
</section>


<section class="sec sec--prices" id="prices" aria-labelledby="h-prices">
  <div class="wrap">
    <div class="sec__head">
      <h2 class="h2" id="h-prices" data-split>Цены ${esc(c.in)}</h2>
      <p>Цена указана за одну процедуру. Все зоны делятся на большие, средние и малые: у каждой группы одна цена.</p>
    </div>
    ${priceBoard(pl)}
  </div>
</section>

<section class="sec sec--visit" id="visit" aria-labelledby="h-visit">
  <div class="wrap visit" data-visit>
    <div class="visit__side">
      <h2 class="h2" id="h-visit" data-split>Как проходит первый визит</h2>
      <div class="visit__meter" aria-hidden="true"><span class="visit__num" data-visit-num>1</span><span class="visit__of">/ 4</span></div>
      <div class="visit__bar" aria-hidden="true"><span data-visit-bar></span></div>
    </div>
    <ol class="visit__steps">
      <li data-step><h3>Запись</h3><p>Выберите зоны, мастера и время в онлайн-записи. Накануне напомним о визите.</p></li>
      <li data-step><h3>Подготовка</h3><p>Побрейте зону за 1–2 дня. За две недели — без загара, воска и шугаринга.</p></li>
      <li data-step><h3>Процедура</h3><p>Мастер оценит кожу и волос и подберёт режим лазера. Подмышки — около 10 минут.</p></li>
      <li data-step><h3>Курс</h3><p>Следующий визит — через 4–8 недель. С каждым разом волос меньше, и он тоньше.</p></li>
    </ol>
  </div>
</section>

<section class="sec sec--where" id="where" aria-labelledby="h-where">
  <div class="wrap">
    <div class="sec__head">
      <h2 class="h2" id="h-where" data-split>${n > 1 ? `${n} студии ${esc(c.in)}` : `Студия ${esc(c.in)}`}</h2>
      <p>Постройте маршрут в Яндекс Картах — на машине или общественном транспорте.</p>
    </div>
    <ul class="bubs" data-reveal>${bubbles}</ul>
    <div class="sts">${studios}</div>
  </div>
</section>

<section class="sec sec--reviews" id="reviews" aria-labelledby="h-reviews">
  <div class="wrap">
    <div class="sec__head"><h2 class="h2" id="h-reviews" data-split>Отзывы</h2><p>Настоящие отзывы клиентов с Яндекс Карт.</p></div>
    ${reviews}
  </div>
</section>

${faqBlock()}

<section class="sec sec--others" aria-labelledby="h-others">
  <div class="wrap">
    <h2 class="h2" id="h-others" data-split>${site.brand} в других городах</h2>
    <ul class="rows">${others.map(o => `<li><a class="row" href="/${o.slug}/"><span class="row__name">${esc(o.name)}</span><span class="row__addr">${esc(addrLine(o))}</span><span class="row__from">от ${rub(minPrice(site.price_lists[o.price_list]))}</span></a></li>`).join('')}</ul>
  </div>
</section>

</main>
${footer()}
${mobileBar(c)}
<script src="/assets/js/motion.min.js" defer></script>
<script src="/assets/js/app.js" defer></script>
</body>
</html>`;
}

// ---------- главная ----------
function homePage() {
  const url = D + '/';
  const minAll = Math.min(...Object.values(site.price_lists).map(minPrice));
  const total = site.cities.reduce((n, c) => n + c.studios.length, 0);
  const title = `${site.brand} — студии лазерной эпиляции: ${site.cities.map(c => c.name).join(', ')}`;
  const desc = `Сеть студий лазерной эпиляции ${site.brand} (ex. Just beauty bar): ${site.cities.map(c => c.name).join(', ')}. Зоны от ${minAll} ₽, комплексы, онлайн-запись.`;
  const org = { '@context': 'https://schema.org', '@type': 'Organization', name: site.brand, url, alternateName: 'Just beauty bar',
    sameAs: site.cities.map(c => c.instagram),
    subOrganization: site.cities.flatMap(c => c.studios.map((st, i) => ({ '@id': `${D}/${c.slug}/#studio${i ? '-' + (i + 1) : ''}` }))) };
  const ws = { '@context': 'https://schema.org', '@type': 'WebSite', name: site.brand, url, inLanguage: 'ru' };

  return `${head({ title, desc, url, jsonld: [org, ws] })}
<body class="home">
${header(null)}
<main id="main">
<section class="hero hero--home" data-hero>
  <div class="hero__art" aria-hidden="true">
    ${glyph('petals', 'orb orb--1', 'data-orb="1"')}${glyph('flower', 'orb orb--2', 'data-orb="2"')}${glyph('star', 'orb orb--3', 'data-orb="3"')}
  </div>
  <div class="wrap hero__in">
    <div class="home__h">
      <div class="home__mono" data-mono aria-hidden="true">${'MONO'.split('').map(l => `<span>${l}</span>`).join('')}</div>
      <h1 class="home__sub" data-enter>Студии лазерной эпиляции<span class="vh"> MONO</span></h1>
    </div>
    <p class="home__ask" data-enter id="cities">В каком городе вам удобно?</p>
    <ul class="pick" aria-labelledby="cities">
      ${site.cities.map(c => `<li><a class="pick__card" href="/${c.slug}/" data-city="${c.slug}">
        <span class="pick__badge" hidden>Вы выбирали</span>
        <span class="pick__name">${esc(c.name)}</span>
        <span class="pick__addr">${esc(addrLine(c))}</span>
        <span class="pick__foot"><span class="pick__from">зоны от ${rub(minPrice(site.price_lists[c.price_list]))}</span><span class="pick__go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>
      </a></li>`).join('')}
    </ul>
    <p class="home__former" data-enter>В Махачкале, Нальчике и Владикавказе мы раньше назывались Just beauty bar: те же студии и мастера, новое имя.</p>
  </div>
</section>

<section class="sec sec--pillars" aria-labelledby="h-why">
  <div class="wrap">
    <h2 class="h2" id="h-why" data-split>Просто и понятно</h2>
    <ul class="pillars">
      <li data-reveal>${glyph('petals', 'pl__g')}<h3>Одна цена за зону</h3><p>Все зоны — малые, средние и большие. Никаких «от» и доплат на месте.</p></li>
      <li data-reveal>${glyph('flower', 'pl__g')}<h3>Комплексы дешевле</h3><p>Чем больше зон за визит, тем ниже цена каждой. Комплексы из 2, 3 и 4 зон и «всё тело».</p></li>
      <li data-reveal>${glyph('star', 'pl__g')}<h3>Запись за минуту</h3><p>Свободное время видно онлайн. Выбрали — администратор подтвердит.</p></li>
    </ul>
  </div>
</section>

${faqBlock()}
</main>
${footer()}
<script src="/assets/js/motion.min.js" defer></script>
<script src="/assets/js/app.js" defer></script>
</body>
</html>`;
}

function notFound() {
  return `${head({ title: `Страница не найдена | ${site.brand}`, desc: 'Страница не найдена', url: D + '/404.html', noindex: true })}
<body>${header(null)}<main id="main" class="sec"><div class="wrap nf"><h1 class="h2">Такой страницы нет</h1><p>Возможно, ссылка устарела. Выберите город:</p><ul class="rows">${site.cities.map(o => `<li><a class="row" href="/${o.slug}/"><span class="row__name">${esc(o.name)}</span></a></li>`).join('')}</ul></div></main>${footer()}<script src="/assets/js/motion.min.js" defer></script><script src="/assets/js/app.js" defer></script></body></html>`;
}

// ---------- сборка ----------
rmrf(DIST);
copyDir(path.join(ROOT, 'src/assets'), path.join(DIST, 'assets'));
write('index.html', homePage());
for (const c of site.cities) write(`${c.slug}/index.html`, cityPage(c));
write('404.html', notFound());
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /404.html\n\nSitemap: ${D}/sitemap.xml\n`);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${D}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>
${site.cities.map(c => `  <url><loc>${D}/${c.slug}/</loc><lastmod>${today}</lastmod><priority>0.9</priority></url>`).join('\n')}
</urlset>
`);
fs.copyFileSync(path.join(ROOT, 'src/htaccess.txt'), path.join(DIST, '.htaccess'));
const todos = JSON.stringify(site.cities).match(/TODO/g);
console.log(`Готово: dist/ — ${site.cities.length + 2} страниц.` + (todos ? `  Осталось заглушек TODO: ${todos.length}` : ''));
