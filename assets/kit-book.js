// Category-site kit: audio list from data/media.json ({book -> audio[{ep, lang, url, title_en, title_zh}]}).
// Chinese labels come from data-zh-* on the box (this file stays 0-CJK so English-only sites can load it).
// Pages never hard-code audio URLs; adding an episode only republishes that book's audio repo and the manifest.
(function () {
  var box = document.getElementById('bml-audio');
  if (!box || location.protocol === 'file:') return;
  var langs = (box.dataset.langs || 'en').split(','), en = box.dataset.mode === 'en';
  function lab(e, zh) { return en ? e : '<span class="l-en" lang="en">' + e + '</span><span class="l-zh" lang="zh-Hans">' + zh + '</span>'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  fetch(box.dataset.manifest, {cache: 'no-cache'}).then(function (r) { return r.ok ? r.json() : null; }).then(function (m) {
    var b = m && m.books && m.books[box.dataset.book]; if (!b) return;
    var eps = (b.audio || []).filter(function (e) { return langs.indexOf(e.lang) >= 0; });
    if (!eps.length) return;
    box.innerHTML = '<h2>' + lab('Episodes', box.dataset.zhEpisodes) + '</h2>' + eps.map(function (e) {
      return '<div class="ep" data-ep="' + esc(e.ep) + '" data-lang="' + esc(e.lang) + '"><b>' + lab(esc(e.title_en), esc(e.title_zh)) + '</b>' +
        '<audio controls preload="metadata" src="' + esc(e.url) + '"></audio>' +
        '<a class="dl" href="' + esc(e.url) + '" download>' + lab('Download', box.dataset.zhDownload) + ' (' + (e.bytes / 1e6).toFixed(1) + ' MB)</a></div>';
    }).join('');
    box.hidden = false;
  }).catch(function () {});
})();
