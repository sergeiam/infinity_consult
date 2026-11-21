/* Candidate 2 effects. Runs after shared/site.js. */
(function () {
  'use strict';
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Seeded RNG so the circuit looks the same on every load.
  let seed = 11;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // Hero circuit: traces grow in from both edges, end in a pad, and carry signal pulses.
  (function traces() {
    const svg = document.querySelector('.traces'); if (!svg) return;
    const W = 1200, H = 700; let out = '';
    for (let i = 0; i < 28; i++) {
      const dir = i % 2 ? -1 : 1;
      let x = dir > 0 ? 0 : W, y = Math.round((30 + rnd() * (H - 60)) / 20) * 20;
      let d = `M${x} ${y}`;
      const n = 2 + (rnd() * 3 | 0);
      for (let k = 0; k < n; k++) {
        x += dir * (70 + rnd() * 190); d += `H${x.toFixed(0)}`;
        if (k < n - 1) { const dy = (rnd() < .5 ? -1 : 1) * (20 + (rnd() * 4 | 0) * 20); x += dir * Math.abs(dy); y += dy; d += `L${x.toFixed(0)} ${y}`; }
      }
      const delay = (rnd() * 1.6).toFixed(2);
      out += `<path d="${d}" pathLength="1" style="--d:${delay}s"/><circle class="pad" cx="${x.toFixed(0)}" cy="${y}" r="5" style="--d:${delay}s"/>`;
      if (!reduce && i % 2 === 0) out += `<circle class="pulse" r="3"><animateMotion dur="${(4 + rnd() * 5).toFixed(1)}s" begin="${(2.5 + rnd() * 4).toFixed(1)}s" repeatCount="indefinite" path="${d}"/></circle>`;
    }
    svg.innerHTML = out;
  })();

  // Headline: split into words that rise one after another (re-split on language change).
  function split() {
    const h = document.querySelector('.hero h1'); if (!h) return;
    const txt = IC.t('hero.title'), zh = IC.lang === 'zh';
    const parts = zh ? txt.split(/(?<=[,。])/) : txt.split(' ');
    h.setAttribute('aria-label', txt);
    h.innerHTML = parts.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(zh ? '' : ' ');
  }
  addEventListener('ic:lang', split); split();

  // Scroll reveal with a small stagger between siblings.
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
    if (e.target.classList.contains('stat')) count(e.target.querySelector('b'));
  }), { threshold: .15 });
  $$('.sec-head,.card,.step,.stat,.why-item,.value,.demo,.route-svg,.contact>*,.cta-band .wrap,.prose p,.about-lead').forEach(el => {
    el.classList.add('rv');
    el.style.transitionDelay = (Array.prototype.indexOf.call(el.parentNode.children, el) % 6) * 70 + 'ms';
    io.observe(el);
  });

  function count(b) {
    const n = +b.dataset.count, suf = b.dataset.suffix; if (reduce) return;
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - t0) / 1400), e = 1 - Math.pow(1 - p, 3);
      b.textContent = Math.round(n * e) + suf;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  // BOM → orders: each BOM line lights up and drops into its order.
  $$('.demo').forEach(demo => {
    const rows = $$('.bom li', demo), orders = $$('.order', demo);
    if (reduce) return;
    let i = 0;
    const reset = () => { rows.forEach(r => r.classList.remove('hot', 'used')); orders.forEach(o => { o.classList.remove('hot', 'done'); o.querySelector('i').textContent = '0'; }); };
    reset();
    setInterval(() => {
      if (!demo.offsetParent) return; // page hidden
      rows.forEach(r => r.classList.remove('hot')); orders.forEach(o => o.classList.remove('hot'));
      if (i < rows.length) {
        const r = rows[i], o = orders[+r.dataset.o];
        r.classList.add('hot', 'used'); o.classList.add('hot');
        o.querySelector('i').textContent = +o.querySelector('i').textContent + 1;
      } else if (i === rows.length) orders.forEach(o => o.classList.add('done'));
      else if (i === rows.length + 3) { reset(); i = -1; }
      i++;
    }, 850);
  });

  // Cursor-following glow on cards, scroll progress bar.
  document.addEventListener('pointermove', e => {
    const c = e.target.closest && e.target.closest('.card'); if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px');
  });
  const bar = document.querySelector('.progress');
  const prog = () => { const m = document.documentElement.scrollHeight - innerHeight; bar.style.setProperty('--p', m > 0 ? scrollY / m : 0); };
  addEventListener('scroll', prog, { passive: true }); addEventListener('ic:page', prog); prog();
})();
