/* Study site for The Self-Esteem Workbook for Teens. Everything you do here stays in this browser (localStorage). */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var DAY = 864e5, KEY = 'sew.state';
  var S;
  try { S = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { S = {}; }
  S.c = S.c || {}; S.done = S.done || {}; S.txt = S.txt || {}; S.my = S.my || [];
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var root = document.documentElement;
  function lang() { return root.dataset.lang || 'en'; }
  function T(en, zh) { return lang() === 'zh' ? zh : en; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var hooks = [];

  /* ---------- language ---------- */
  $$('[data-set-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      root.dataset.lang = b.dataset.setLang; root.lang = b.dataset.setLang === 'zh' ? 'zh-Hans' : 'en';
      try { localStorage.setItem('sew.lang', b.dataset.setLang); } catch (e) {}
      hooks.forEach(function (f) { f(); });
    });
  });

  /* ---------- Mermaid: render every diagram (both languages) once ---------- */
  function renderMermaid() {
    var srcs = $$('pre.mmd');
    if (!srcs.length) { root.dataset.mmd = 'done'; return; }
    if (!window.mermaid) { console.error('MERMAID-ERROR mermaid library missing'); root.dataset.mmd = 'error'; return; }
    window.mermaid.initialize({
      startOnLoad: false, securityLevel: 'strict', theme: 'base',
      fontFamily: getComputedStyle(document.body).fontFamily,
      themeVariables: {
        primaryColor: '#e3f0ed', primaryTextColor: '#3d3a35', primaryBorderColor: '#5f9e95',
        secondaryColor: '#fcebe3', tertiaryColor: '#efeaf7', lineColor: '#9a8f80', fontSize: '15px',
        cScale0: '#cfe6e1', cScale1: '#f6d3c4', cScale2: '#ddd3ee', cScale3: '#fbe7b5', cScale4: '#d3e4f2',
        cScale5: '#e8dccd', cScale6: '#cfe6e1', cScale7: '#f6d3c4', cScale8: '#ddd3ee', cScale9: '#fbe7b5', cScale10: '#d3e4f2', cScale11: '#e8dccd'
      },
      flowchart: { htmlLabels: true, curve: 'basis', useMaxWidth: true },
      mindmap: { useMaxWidth: true, padding: 10 }
    });
    var i = 0, errors = 0, nan = 0;
    function next() {
      if (i >= srcs.length) { root.dataset.mmd = errors ? 'error' : 'done'; root.dataset.mmdErrors = String(errors); root.dataset.mmdNan = String(nan); return; }
      var pre = srcs[i++], id = 'mmd' + i;
      var code = pre.textContent;
      var tries = 0;
      function attempt() {
        tries++;
        return Promise.resolve().then(function () { return window.mermaid.render(id + (tries > 1 ? 'r' + tries : ''), code); }).then(function (r) {
          // the mindmap layout occasionally produces an edge with NaN coordinates; try again, then drop that one edge
          if (/d="[^"]*NaN/.test(r.svg) && tries < 3) return attempt();
          if (/d="[^"]*NaN/.test(r.svg)) { nan++; r.svg = r.svg.replace(/<path[^>]*d="[^"]*NaN[^"]*"[^>]*>(<\/path>)?/g, ''); }
          return r;
        });
      }
      attempt().then(function (r) {
        if (/Syntax error/i.test(r.svg)) throw new Error('syntax error svg');
        var out = document.createElement('div');
        out.className = 'mmd-out ' + (pre.className.match(/l-(en|zh)/) || [''])[0];
        out.setAttribute('role', 'img');
        out.innerHTML = r.svg;
        pre.parentNode.insertBefore(out, pre);
        pre.hidden = true;
      }).catch(function (e) {
        errors++; console.error('MERMAID-ERROR in diagram ' + i + ': ' + (e && e.message ? e.message : e));
        var bad = document.getElementById('d' + id); if (bad) bad.remove();
      }).then(next);
    }
    next();
  }

  /* ---------- flip cards with 1-3-7 day spacing ---------- */
  var STEPS = [1, 3, 7, 14, 30];
  function today0() { var d = new Date(); d.setHours(0, 0, 0, 0); return +d; }
  function cardState(id) { return S.c[id]; }
  function isDue(id) { var s = S.c[id]; return !!s && s.due <= Date.now(); }
  function rate(id, how) {
    var s = S.c[id] || { n: 0 };
    if (how === 'got') { s.n = (s.n || 0) + 1; s.due = today0() + STEPS[Math.min(s.n, STEPS.length) - 1] * DAY; s.last = 'got'; }
    else { s.n = 0; s.due = Date.now(); s.last = 'again'; }
    S.c[id] = s; save();
  }
  function whenText(id) {
    var s = S.c[id]; if (!s) return '';
    if (s.last === 'again') return T('Will show again in “Look again”', '会出现在「再看」里');
    var d = Math.round((s.due - today0()) / DAY);
    return d <= 0 ? T('Ready to see again today', '今天可以再看一次') : T('Comes back in ' + d + (d === 1 ? ' day' : ' days'), d + ' 天后再出现');
  }
  function paintCard(fc) {
    var id = fc.dataset.card, s = S.c[id];
    $$('.cbtn button', fc).forEach(function (b) { b.classList.toggle('sel', !!s && s.last === b.dataset.rate && !(b.dataset.rate === 'got' && isDue(id))); });
    var w = $('.when', fc); if (w) w.textContent = whenText(id);
  }
  function wireCards(scope) {
    $$('.fc', scope).forEach(function (fc) {
      if (fc.dataset.wired) return; fc.dataset.wired = '1';
      var flip = $('.flip', fc);
      function toggle() { flip.classList.toggle('on'); }
      flip.addEventListener('click', toggle);
      flip.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
      $$('.cbtn button', fc).forEach(function (b) {
        b.addEventListener('click', function () { rate(fc.dataset.card, b.dataset.rate); paintCard(fc); filterCards(); cheer(); });
      });
      paintCard(fc);
    });
  }
  hooks.push(function () { $$('.fc[data-card]').forEach(paintCard); });

  /* cards page filters */
  var filt = { mode: 'all', part: '' };
  function filterCards() {
    var box = $('#cardlib'); if (!box) return;
    var shown = 0;
    $$('.fc', box).forEach(function (fc) {
      var id = fc.dataset.card, s = S.c[id], ok = true;
      if (filt.mode === 'due') ok = isDue(id);
      else if (filt.mode === 'new') ok = !s;
      else if (filt.mode === 'known') ok = !!s && s.last === 'got' && !isDue(id);
      if (ok && filt.part) ok = fc.dataset.part === filt.part;
      fc.hidden = !ok; if (ok) shown++;
    });
    var c = $('#cardcount'); if (c) c.textContent = shown;
    var due = Object.keys(S.c).filter(isDue).length;
    var d = $('#duecount'); if (d) d.textContent = due;
    var em = $('#cards-empty'); if (em) em.style.display = shown ? 'none' : 'block';
  }
  $$('.filters [data-mode]').forEach(function (b) {
    b.addEventListener('click', function () {
      filt.mode = b.dataset.mode;
      $$('.filters [data-mode]').forEach(function (x) { x.classList.toggle('on', x === b); });
      filterCards();
    });
  });
  var sel = $('#partsel'); if (sel) sel.addEventListener('change', function () { filt.part = sel.value; filterCards(); });
  var shuf = $('#shuffle'); if (shuf) shuf.addEventListener('click', function () {
    var box = $('#cardlib'); var items = $$('.fc', box);
    for (var i = items.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = items[i]; items[i] = items[j]; items[j] = t; }
    items.forEach(function (x) { box.appendChild(x); });
  });
  var flipAll = $('#flipall'); if (flipAll) flipAll.addEventListener('click', function () { $$('#cardlib .fc:not([hidden]) .flip').forEach(function (f) { f.classList.remove('on'); }); });

  /* a small cheer: the sign cat appears briefly after a few cards */
  var cheerN = 0;
  function cheer() {
    cheerN++; var c = $('#cheer'); if (!c || cheerN % 5) return;
    c.hidden = false; setTimeout(function () { c.hidden = true; }, 2600);
  }

  /* ---------- step mode on activity pages ---------- */
  var steps = $$('.steps .step');
  if (steps.length) {
    var cur = 0;
    var pref; try { pref = localStorage.getItem('sew.view'); } catch (e) {}
    if (pref !== 'all') root.classList.add('stepmode');
    var dots = $('.dots');
    steps.forEach(function () { if (dots) dots.appendChild(document.createElement('span')); });
    function go(n, scroll) {
      cur = Math.max(0, Math.min(steps.length - 1, n));
      steps.forEach(function (s, i) { s.classList.toggle('cur', i === cur); });
      if (dots) $$('span', dots).forEach(function (d, i) { d.classList.toggle('on', i <= cur); });
      var p = $('#prevstep'), nx = $('#nextstep');
      if (p) p.disabled = cur === 0;
      if (nx) nx.hidden = cur === steps.length - 1;
      var nxa = $('#nextact'); if (nxa) nxa.hidden = cur !== steps.length - 1;
      var lab = $('#steplabel'); if (lab) lab.textContent = (cur + 1) + ' / ' + steps.length;
      if (scroll && root.classList.contains('stepmode')) window.scrollTo({ top: 0 });
      if (root.classList.contains('stepmode')) history.replaceState(null, '', '#s' + (cur + 1));
    }
    var h = /^#s(\d+)$/.exec(location.hash);
    go(h ? +h[1] - 1 : 0, false);
    var p = $('#prevstep'), nx = $('#nextstep');
    if (p) p.addEventListener('click', function () { go(cur - 1, true); });
    if (nx) nx.addEventListener('click', function () { go(cur + 1, true); });
    document.addEventListener('keydown', function (e) {
      if (!root.classList.contains('stepmode') || /input|textarea/i.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight') go(cur + 1, true); if (e.key === 'ArrowLeft') go(cur - 1, true);
    });
    var tv = $('#toggleview');
    if (tv) tv.addEventListener('click', function () {
      var on = root.classList.toggle('stepmode');
      try { localStorage.setItem('sew.view', on ? 'steps' : 'all'); } catch (e) {}
      go(cur, true);
    });
  }

  /* ---------- done marks and progress ---------- */
  function paintDone() {
    $$('[data-act-link]').forEach(function (a) { a.classList.toggle('done', !!S.done[a.dataset.actLink]); });
    var n = Object.keys(S.done).filter(function (k) { return S.done[k]; }).length;
    $$('.progress i').forEach(function (i) { i.style.width = Math.round(100 * n / 46) + '%'; });
    $$('.donecount').forEach(function (e) { e.textContent = n; });
    var box = $('.done-box');
    if (box) { var a = box.dataset.act; box.classList.toggle('is-done', !!S.done[a]);
      var b = $('button', box); if (b) b.textContent = S.done[a] ? T('Done ✓ (tap to undo)', '完成 ✓（再点一下撤销）') : T('I did this one', '这一个我做过了'); }
  }
  var db = $('.done-box button');
  if (db) db.addEventListener('click', function () { var a = $('.done-box').dataset.act; S.done[a] = !S.done[a]; save(); paintDone(); });
  hooks.push(paintDone);

  /* ---------- notes you type are kept on this device ---------- */
  $$('[data-save]').forEach(function (el) {
    var k = el.dataset.save;
    if (el.type === 'checkbox') { el.checked = !!S.txt[k]; el.addEventListener('change', function () { S.txt[k] = el.checked; save(); }); }
    else { el.value = S.txt[k] || ''; el.addEventListener('input', function () { S.txt[k] = el.value; save(); }); }
  });

  /* ---------- your own cards ---------- */
  function paintMine() {
    var box = $('#mycards'); if (!box) return;
    box.innerHTML = S.my.map(function (c, i) {
      return '<div class="fc" data-card="my-' + i + '"><button class="del" data-del="' + i + '" aria-label="delete">×</button>' +
        '<div class="flip" tabindex="0"><div class="inner"><div class="face front">' + esc(c.q) + '</div><div class="face back">' + esc(c.a) + '</div></div></div></div>';
    }).join('');
    $$('[data-del]', box).forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); S.my.splice(+b.dataset.del, 1); save(); paintMine(); }); });
    $$('.flip', box).forEach(function (f) { f.addEventListener('click', function () { f.classList.toggle('on'); }); });
    var em = $('#my-empty'); if (em) em.style.display = S.my.length ? 'none' : 'block';
  }
  var addc = $('#addcard');
  if (addc) addc.addEventListener('click', function () {
    var q = $('#myq'), a = $('#mya');
    if (!q.value.trim()) { q.focus(); return; }
    S.my.push({ q: q.value.trim(), a: a.value.trim() }); save(); q.value = ''; a.value = ''; paintMine();
  });
  $$('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });

  wireCards(document); filterCards(); paintDone(); paintMine();
  renderMermaid();
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
