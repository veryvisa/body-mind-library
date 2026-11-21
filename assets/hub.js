/* Body & Mind Library: language switch, Mermaid (per language, themed with semantic tokens), Chart.js (per language), book filter. No network, no tracking. */
(function () {
  'use strict';
  var root = document.documentElement, figErrors = 0, pending = 0;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function cssv(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }
  function dark() { var m = root.getAttribute('data-mode'); if (m) return m === 'dark'; return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; }
  function lang() { return root.getAttribute('data-lang') || 'both'; }
  function setLang(l) {
    root.setAttribute('data-lang', l); store('bml.lang', l);
    document.title = l === 'zh' ? (root.getAttribute('data-title-zh') || document.title) : (root.getAttribute('data-title-en') || document.title);
    root.setAttribute('lang', l === 'zh' ? 'zh' : 'en');
    renderAll();
  }
  var saved = store('bml.lang'); var q = (location.search.match(/lang=(en|both|zh)/) || [])[1];
  if (q) root.setAttribute('data-lang', q); else if (saved === 'en' || saved === 'zh' || saved === 'both') root.setAttribute('data-lang', saved);
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-set-lang]'); if (b) setLang(b.getAttribute('data-set-lang')); });

  /* ---------- Mermaid ---------- */
  var N = 0, mmReady = false;
  function mmInit() {
    window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base', fontFamily: cssv('--font') || 'sans-serif',
      themeVariables: { darkMode: dark(), background: cssv('--surface'), primaryColor: cssv('--a-soft'), primaryTextColor: cssv('--ink'), primaryBorderColor: cssv('--a'),
        lineColor: cssv('--ink-3'), textColor: cssv('--ink'), mainBkg: cssv('--a-soft'), nodeBorder: cssv('--a'), clusterBkg: cssv('--surface-2'), clusterBorder: cssv('--line'), fontSize: '15px' },
      flowchart: { htmlLabels: false, curve: 'basis', useMaxWidth: true }, mindmap: { useMaxWidth: true, padding: 10 } });
    mmReady = true;
  }
  function renderMmd(box) {
    var out = box.querySelector('.mmd-out'); if (out.getAttribute('data-done') === (dark() ? 'd' : 'l')) return Promise.resolve();
    var code = box.querySelector('.mmd-src').textContent.replace(/var\(--([a-z0-9_-]+)\)/g, function (_, n) { return cssv('--' + n) || '#888888'; });
    pending++;
    return Promise.resolve().then(function () { return window.mermaid.render('mmd' + (++N), code); }).then(function (r) {
      if (/Syntax error/i.test(r.svg)) throw new Error('syntax error');
      out.innerHTML = r.svg; out.setAttribute('data-done', dark() ? 'd' : 'l');
      var svg = out.querySelector('svg'); var vb = ((svg && svg.getAttribute('viewBox')) || '').split(/[ ,]+/); var nat = +vb[2] || 0, cw = out.clientWidth || 320;
      if (svg && nat && nat * 0.7 > cw) { svg.style.maxWidth = 'none'; svg.style.width = Math.round(nat * 0.7) + 'px'; out.classList.add('wide'); }
    }).catch(function (e) { figErrors++; box.setAttribute('data-error', String(e && e.message || e)); console.error('MERMAID-ERROR', e); }).then(function () { pending--; });
  }
  /* ---------- Chart.js ---------- */
  var charts = {};
  function L(o, l) { if (l === 'both') return o.en.map(function (s, i) { return s + ' · ' + o.zh[i]; }); return o[l]; }
  function renderChart(cv) {
    var spec = JSON.parse(cv.getAttribute('data-spec')), l = lang(); if (charts[cv.id]) charts[cv.id].destroy();
    var ink = cssv('--ink-2'), grid = cssv('--line'), ds, cfg;
    var tok = function (t) { return cssv('--' + t) || '#888'; };
    if (spec.type === 'doughnut') {
      cfg = { type: 'doughnut', data: { labels: L(spec.labels, l), datasets: [{ data: spec.data, backgroundColor: spec.tokens.map(tok), borderColor: cssv('--surface'), borderWidth: 2 }] },
        options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: ink, boxWidth: 14 } } } } };
    } else if (spec.type === 'bar') {
      cfg = { type: 'bar', data: { labels: L(spec.labels, l), datasets: [{ data: spec.data, backgroundColor: spec.tokens.map(tok), borderColor: cssv('--surface'), borderWidth: 1 }] },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: ink }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: ink, precision: 0 }, grid: { color: grid } } } } };
    } else {
      cfg = { type: 'bar', data: { labels: L(spec.labels, l), datasets: spec.stack.map(function (s) { return { label: l === 'both' ? s.name.en + ' · ' + s.name.zh : s.name[l], data: s.data, backgroundColor: tok(s.token), borderColor: cssv('--surface'), borderWidth: 1 }; }) },
        options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: ink, boxWidth: 14 } } }, scales: { x: { stacked: true, ticks: { color: ink, precision: 0 }, grid: { color: grid } }, y: { stacked: true, ticks: { color: ink }, grid: { display: false } } } } };
    }
    try { charts[cv.id] = new Chart(cv, cfg); } catch (e) { figErrors++; console.error('CHART-ERROR', e); }
  }
  function visible(el) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }
  function renderAll() {
    if (window.mermaid && !mmReady) mmInit();
    var jobs = [];
    document.querySelectorAll('.mmd').forEach(function (b) { if (window.mermaid && visible(b)) jobs.push(renderMmd(b)); });
    if (window.Chart) document.querySelectorAll('canvas.hh-chart').forEach(renderChart);
    Promise.all(jobs).then(function () { root.setAttribute('data-figs', figErrors ? 'error' : 'done'); });
  }
  /* ---------- all-books filter ---------- */
  var tbl = document.getElementById('all');
  if (tbl) {
    var f = '', qs = '';
    function apply() { tbl.querySelectorAll('tbody tr').forEach(function (r) { r.style.display = ((!f || r.dataset.cat === f) && (!qs || r.dataset.q.indexOf(qs) > -1)) ? '' : 'none'; }); }
    document.querySelectorAll('.fchip').forEach(function (b) { b.addEventListener('click', function () { document.querySelectorAll('.fchip').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); f = b.dataset.f; apply(); }); });
    document.getElementById('q').addEventListener('input', function (e) { qs = e.target.value.toLowerCase(); apply(); });
    if (location.hash.length > 1) { var h = location.hash.slice(1), btn = document.querySelector('.fchip[data-f="' + h + '"]'); if (btn) btn.click(); }
  }
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renderAll);
  window.addEventListener('load', function () { setLang(lang()); });
})();
