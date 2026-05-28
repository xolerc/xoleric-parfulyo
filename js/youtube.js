(function () {
  'use strict'
  var KEY = 'AIzaSyAwpEdIA_5_1aDPoMP0Q_ROE_zTrhoxwKs'
  var TTL = 30 * 60 * 1000
  var ctrl = null, st = null, cat = 'all', playing = null

  var CHIPS = [
    { id: 'all', label: 'Trends', q: '' },
    { id: 'tech', label: 'Texno', q: 'texnologiya 2026' },
    { id: 'music', label: 'Musiqa', q: 'musiqa 2026' },
    { id: 'code', label: 'Kod', q: 'dasturlash 2026' },
    { id: 'game', label: "O'yin", q: "o'yin 2026" }
  ]

  function $(s) { return document.getElementById(s) }
  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
  function escA(s) { return (s || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;') }

  function url(path, p) {
    var q = ''; for (var k in p) { if (q) q += '&'; q += k + '=' + encodeURIComponent(p[k]) }
    return 'https://www.googleapis.com/youtube/v3/' + path + '?' + q + '&key=' + KEY
  }

  async function fetchJSON(path, p) {
    if (ctrl) ctrl.abort()
    ctrl = new AbortController()
    var r = await fetch(url(path, p), { signal: ctrl.signal })
    var d = await r.json()
    if (d.error) throw new Error(d.error.message || 'API xatosi')
    if (!r.ok) throw new Error('HTTP ' + r.status)
    return d
  }

  function ck(q) { return 'vp_' + q.toLowerCase().replace(/\s+/g, '_') }
  function gc(q) { try { var r = localStorage.getItem(ck(q)); if (!r) return null; var c = JSON.parse(r); if (Date.now() - c.ts < TTL) return c.d } catch (e) {}; return null }
  function sc(q, d) { localStorage.setItem(ck(q), JSON.stringify({ ts: Date.now(), d: d })) }

  function fmt(n) { n = parseInt(n, 10) || 0; if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'; if (n >= 1000) return (n / 1000).toFixed(1) + 'K'; return '' + n }
  function ago(d) { var diff = Date.now() - new Date(d).getTime(), days = Math.floor(diff / 86400000); if (days < 1) return 'Bugun'; if (days < 7) return days + ' kun'; if (days < 30) return Math.floor(days / 7) + ' hafta'; if (days < 365) return Math.floor(days / 30) + ' oy'; return Math.floor(days / 365) + ' yil' }

  async function trending() {
    var c = gc('__tr__')
    if (c) return c
    var d = await fetchJSON('videos', { part: 'snippet,statistics', chart: 'mostPopular', maxResults: 30 })
    if (!d.items || !d.items.length) throw new Error('Hech narsa topilmadi')
    var r = d.items.map(function (v) {
      var t = v.snippet.thumbnails; var th = (t.maxres || t.high || t.medium || t.default).url
      return { id: v.id, title: v.snippet.title, thumb: th, published: v.snippet.publishedAt, views: (v.statistics && v.statistics.viewCount) || '0', channel: v.snippet.channelTitle }
    })
    sc('__tr__', r)
    return r
  }

  async function search(q) {
    var c = gc(q)
    if (c) return c
    var d = await fetchJSON('search', { part: 'snippet', q: q, type: 'video', maxResults: 30, safeSearch: 'none' })
    if (!d.items || !d.items.length) throw new Error('Hech narsa topilmadi')
    var ids = [], map = {}
    for (var i = 0; i < d.items.length; i++) { if (d.items[i].id && d.items[i].id.videoId) { ids.push(d.items[i].id.videoId); map[d.items[i].id.videoId] = d.items[i] } }
    if (!ids.length) throw new Error('Hech narsa topilmadi')
    var s = await fetchJSON('videos', { part: 'statistics', id: ids.join(',') })
    var sm = {}; if (s.items) { for (var j = 0; j < s.items.length; j++) sm[s.items[j].id] = s.items[j].statistics }
    var r = ids.map(function (id) {
      var v = map[id], st = sm[id] || {}, t = v.snippet.thumbnails, th = (t.high || t.medium || t.default).url
      return { id: id, title: v.snippet.title, thumb: th, published: v.snippet.publishedAt, views: st.viewCount || '0', channel: v.snippet.channelTitle }
    })
    sc(q, r)
    return r
  }

  function render(videos) {
    var grid = $('vpGrid'), load = $('vpLoad'), err = $('vpErr'), none = $('vpNone')
    if (!grid) return
    hide(load); hide(err); hide(none)
    if (!videos || !videos.length) { show(none); grid.innerHTML = ''; return }
    var html = ''
    for (var i = 0; i < videos.length; i++) {
      var v = videos[i], act = v.id === playing ? ' active' : ''
      html += '<div class="vp-card' + act + '" data-id="' + v.id + '">' +
        '<div class="vp-card-thumb"><img src="' + escA(v.thumb) + '" loading="lazy" alt="" /></div>' +
        '<div class="vp-card-body"><div class="vp-card-title">' + esc(v.title) + '</div>' +
        '<div class="vp-card-line">' + esc(v.channel) + '</div>' +
        '<div class="vp-card-line vp-card-meta">' + fmt(v.views) + ' · ' + ago(v.published) + '</div></div></div>'
    }
    grid.innerHTML = html
    grid.querySelectorAll('.vp-card').forEach(function (el) {
      el.addEventListener('click', function () { play(el.dataset.id) })
    })
  }

  function play(id) {
    if (!id) return
    playing = id
    var grid = $('vpGrid')
    if (grid) { grid.querySelectorAll('.vp-card.active').forEach(function (el) { el.classList.remove('active') }); var c = grid.querySelector('.vp-card[data-id="' + id + '"]'); if (c) c.classList.add('active') }
    var bar = $('vpPlayer'), vid = $('vpPlayerVid'), tEl = $('vpPlayerTitle'), sEl = $('vpPlayerSub')
    if (!bar || !vid) return
    var cd = cardData(id)
    if (tEl) tEl.textContent = cd ? cd.title : ''
    if (sEl && cd) sEl.textContent = cd.channel + ' · ' + fmt(cd.views)
    else if (sEl) sEl.textContent = ''
    vid.innerHTML = '<iframe style="position:absolute;top:0;left:0;width:100%;height:100%" src="https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>'
    bar.style.display = 'flex'
    resizeFeed()
  }

  function cardData(id) {
    var c = document.querySelector('.vp-card[data-id="' + id + '"]')
    if (!c) return null
    return { title: (c.querySelector('.vp-card-title') || {}).textContent || '', channel: (c.querySelector('.vp-card-line') || {}).textContent || '', views: ((c.querySelector('.vp-card-meta') || {}).textContent || '').split('·')[0].trim() }
  }

  function resizeFeed() {
    var bar = $('vpPlayer'), feed = $('vpFeed')
    if (!feed || !bar) return
    if (bar.style.display === 'none') { feed.style.maxHeight = ''; return }
    setTimeout(function () { feed.style.maxHeight = 'calc(100% - ' + (bar.offsetHeight + 52) + 'px)'; feed.style.overflowY = 'auto' }, 100)
  }

  function closeP() {
    var bar = $('vpPlayer'), vid = $('vpPlayerVid'), feed = $('vpFeed')
    if (bar) bar.style.display = 'none'
    if (vid) vid.innerHTML = ''
    if (feed) feed.style.maxHeight = ''
    playing = null
    var grid = $('vpGrid')
    if (grid) grid.querySelectorAll('.vp-card.active').forEach(function (el) { el.classList.remove('active') })
  }

  function hide(el) { if (el) el.style.display = 'none' }
  function show(el) { if (el) el.style.display = 'flex' }

  function chips(id) {
    var w = $('vpChips'); if (!w) return
    w.innerHTML = CHIPS.map(function (c) { return '<button class="vp-chip' + (c.id === id ? ' act' : '') + '" data-i="' + c.id + '">' + c.label + '</button>' }).join('')
    w.querySelectorAll('.vp-chip').forEach(function (el) {
      el.addEventListener('click', function () {
        var id2 = el.dataset.i; if (id2 !== cat) { cat = id2; chips(id2); load(id2) }
      })
    })
  }

  async function load(id) {
    var loadEl = $('vpLoad'), errEl = $('vpErr'), noneEl = $('vpNone'), descEl = $('vpErrDesc')
    show(loadEl); hide(errEl); hide(noneEl)
    var ch = null; for (var ci = 0; ci < CHIPS.length; ci++) { if (CHIPS[ci].id === id) { ch = CHIPS[ci]; break } }
    try {
      var v = id === 'all' ? await trending() : (ch && ch.q ? await search(ch.q) : null)
      if (v && v.length) render(v); else { hide(loadEl); show(noneEl); var g = $('vpGrid'); if (g) g.innerHTML = '' }
    } catch (e) { if (e.name === 'AbortError') return; console.error(e); hide(loadEl); show(errEl); if (descEl) descEl.textContent = e.message || 'Xatolik'; var g = $('vpGrid'); if (g) g.innerHTML = '' }
  }

  function doSearch(q) {
    q = q.trim()
    if (!q) { cat = 'all'; chips('all'); load('all'); return }
    cat = ''; chips(''); show($('vpLoad')); hide($('vpErr')); hide($('vpNone'))
    search(q).then(function (v) { if (v && v.length) render(v); else { hide($('vpLoad')); show($('vpNone')) } }).catch(function (e) { if (e.name === 'AbortError') return; console.error(e); hide($('vpLoad')); show($('vpErr')); var d = $('vpErrDesc'); if (d) d.textContent = e.message || 'Xatolik' })
  }

  function setupSearch() {
    var inp = $('vpSearch'); if (!inp) return
    inp.addEventListener('input', function () { if (st) clearTimeout(st); st = setTimeout(function () { var q = inp.value.trim(); q.length >= 2 ? doSearch(q) : q.length === 0 && (cat = 'all', chips('all'), load('all')) }, 500) })
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { if (st) clearTimeout(st); doSearch(inp.value.trim()) } })
  }

  window.addEventListener('resize', resizeFeed)

  window.initYoutube = function () {
    chips('all'); setupSearch(); load('all')
    var x = $('vpPlayerX'); if (x) x.addEventListener('click', closeP)
  }
})()
