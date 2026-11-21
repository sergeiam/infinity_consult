/* Shared behaviour for all candidates: content blocks, language switch, hash router, form stub.
   Load after i18n.js, at the end of <body>. Candidate scripts load after this one. */
(function () {
  'use strict';
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const LANGS = [['bg', 'BG'], ['en', 'EN'], ['zh', '中文']];
  const PAGES = ['home', 'services', 'process', 'about', 'contact'];

  let lang = new URLSearchParams(location.search).get('lang');
  if (!I18N[lang]) { try { lang = localStorage.getItem('ic-lang'); } catch (e) {} }
  if (!I18N[lang]) { const n = (navigator.language || 'bg').slice(0, 2).toLowerCase(); lang = I18N[n] ? n : 'bg'; }
  const t = k => I18N[lang][k] ?? I18N.en[k] ?? k;

  const LOGO = '<svg viewBox="0 0 32 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M16 10c-3-5-5.5-7-9-7a7 7 0 1 0 0 14c3.5 0 6-2 9-7zm0 0c3 5 5.5 7 9 7a7 7 0 1 0 0-14c-3.5 0-6 2-9 7z"/></svg>';
  const ICONS = [
    '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    '<path d="M4 12l8-8h8v8l-8 8z"/><circle cx="15.5" cy="8.5" r="1.5"/>',
    '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h7"/>',
    '<path d="M4 8h14l-3-3M20 16H6l3 3"/>'
  ];
  const ico = i => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[i - 1]}</svg>`;
  const list = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1)).join('');
  const STATS = [[300, '+'], [48, ''], [14, ''], [100, '%']];
  const BOM = [['STM32F103C8T6', '×500', 0], ['ESP32-WROOM-32E', '×500', 0], ['10 µF 0805 X7R', '×4 000', 1], ['10 kΩ 0603 1%', '×10 000', 1], ['USB-C 16P SMD', '×500', 2], ['LM2596S-5.0', '×500', 2]];

  const B = {
    hdr: () => `<a class="logo" href="#/home" aria-label="Infinity Consult">${LOGO}<span>Infinity<b>Consult</b></span></a>
      <button class="menu" type="button" aria-label="Menu"><span></span><span></span></button>
      <nav>${PAGES.map(p => `<a href="#/${p}" data-nav="${p}" data-i18n="nav.${p}"></a>`).join('')}</nav>
      <div class="langs" role="group" aria-label="Language">${LANGS.map(([c, l]) => `<button type="button" data-lang="${c}">${l}</button>`).join('')}</div>
      <a class="btn" href="#/contact" data-i18n="nav.cta"></a>`,
    head: el => { const k = el.dataset.k; return `<h2 data-i18n="${k}.title"></h2>` + (I18N.en[k + '.sub'] ? `<p data-i18n="${k}.sub"></p>` : ''); },
    services: () => list(6, i => `<article class="card"><span class="ico">${ico(i)}</span><h3 data-i18n="s${i}.t"></h3><p data-i18n="s${i}.d"></p></article>`),
    steps: () => list(5, i => `<li class="step"><span class="num">0${i}</span><div><h3 data-i18n="p${i}.t"></h3><p data-i18n="p${i}.d"></p></div></li>`),
    why: () => list(4, i => `<div class="why-item"><h3 data-i18n="w${i}.t"></h3><p data-i18n="w${i}.d"></p></div>`),
    values: () => list(3, i => `<div class="value"><h3 data-i18n="v${i}.t"></h3><p data-i18n="v${i}.d"></p></div>`),
    stats: () => STATS.map(([n, s], i) => `<div class="stat"><b data-count="${n}" data-suffix="${s}">${n}${s}</b><span data-i18n="stat${i + 1}"></span></div>`).join(''),
    cats: () => list(8, i => `<li data-i18n="c${i}"></li>`),
    demo: () => `<div class="demo-col bom"><h4 data-i18n="demo.bom"></h4><ul>${BOM.map(([p, q, o]) => `<li data-o="${o}"><code>${p}</code><span>${q}</span></li>`).join('')}</ul></div>
      <div class="demo-arrow" aria-hidden="true">→</div>
      <div class="demo-col orders"><h4 data-i18n="demo.orders"></h4>${['A', 'B', 'C'].map((l, o) => `<div class="order" data-o="${o}"><b>${l}</b><span data-i18n="demo.o${l}"></span><i>2</i></div>`).join('')}</div>`,
    form: () => `<form data-rfq>
      <label><span data-i18n="f.name"></span><input name="name" required autocomplete="name"></label>
      <label><span data-i18n="f.company"></span><input name="company" autocomplete="organization"></label>
      <label><span data-i18n="f.email"></span><input type="email" name="email" required autocomplete="email"></label>
      <label><span data-i18n="f.msg"></span><textarea name="msg" rows="4"></textarea></label>
      <label class="file"><span data-i18n="f.file"></span><input type="file" name="bom" accept=".xlsx,.xls,.csv,.pdf"></label>
      <button class="btn" type="submit" data-i18n="f.send"></button>
      <p class="form-ok" role="status" data-i18n="f.ok"></p></form>`,
    info: () => `<dl>
      <dt data-i18n="ct.office"></dt><dd data-i18n="ct.addr"></dd>
      <dt data-i18n="ct.email"></dt><dd><a href="mailto:office@infinity-consult.example">office@infinity-consult.example</a></dd>
      <dt data-i18n="ct.phone"></dt><dd>+359 2 000 0000</dd></dl><p class="hours" data-i18n="ct.hours"></p>`,
    cta: () => `<div class="wrap"><h2 data-i18n="cta.title"></h2><p data-i18n="cta.sub"></p><a class="btn" href="#/contact" data-i18n="hero.cta1"></a></div>`,
    footer: () => `<div class="wrap"><a class="logo" href="#/home">${LOGO}<span>Infinity<b>Consult</b></span></a><p data-i18n="brand.tag"></p><p class="copy">© 2026 Infinity Consult. <span data-i18n="foot.rights"></span></p></div>`
  };

  function apply() {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang;
    document.title = 'Infinity Consult — ' + t('brand.tag');
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang));
    dispatchEvent(new CustomEvent('ic:lang', { detail: lang }));
  }
  function setLang(l) {
    if (!I18N[l]) return;
    lang = l;
    try { localStorage.setItem('ic-lang', l); } catch (e) {}
    apply();
  }
  function route() {
    let p = location.hash.replace(/^#\/?/, '');
    if (!PAGES.includes(p)) p = 'home';
    $$('[data-page]').forEach(e => e.classList.toggle('active', e.dataset.page === p));
    $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === p));
    document.body.dataset.route = p;
    document.body.classList.remove('nav-open');
    scrollTo({ top: 0, behavior: 'instant' });
    dispatchEvent(new CustomEvent('ic:page', { detail: p }));
  }

  $$('[data-block]').forEach(el => { el.innerHTML = B[el.dataset.block](el); });
  document.addEventListener('click', e => {
    const lb = e.target.closest('[data-lang]');
    if (lb) setLang(lb.dataset.lang);
    if (e.target.closest('.menu')) document.body.classList.toggle('nav-open');
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('[data-rfq]');
    if (!f) return;
    e.preventDefault(); // prototype: no backend yet
    f.classList.add('sent');
  });
  window.IC = { t, setLang, get lang() { return lang; } };
  addEventListener('hashchange', route);
  apply();
  route();
})();
