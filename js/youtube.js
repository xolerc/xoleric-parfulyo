(function () {
  'use strict'
  var API_KEY = 'AIzaSyAwpEdIA_5_1aDPoMP0Q_ROE_zTrhoxwKs'
  var CACHE_TTL = 30 * 60 * 1000
  var searchCache = {}
  var abortCtrl = null, searchTimer = null
  var currentCategory = 'all', playingId = null

  var CATEGORIES = [
    { id: 'all', label: 'Barcha', query: '' },
    { id: 'tech', label: 'Texnologiya', query: 'texnologiya 2026' },
    { id: 'music', label: 'Musiqa', query: 'musiqa 2026' },
    { id: 'coding', label: 'Dasturlash', query: 'dasturlash 2026' },
    { id: 'gaming', label: "O'yin", query: "o'yin 2026" }
  ]

  function $(id) { return document.getElementById(id) }
  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
  function escAttr(s) { return (s || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;') }

  function ytApi(path, params) {
    var p = ''; for (var k in params) { if (p) p += '&'; p += k + '=' + encodeURIComponent(params[k]) }
    return 'https://www.googleapis.com/youtube/v3/' + path + '?' + p + '&key=' + API_KEY
  }

  async function ytFetch(path, params) {
    if (abortCtrl) abortCtrl.abort()
    abortCtrl = new AbortController()
    var resp = await fetch(ytApi(path, params), { signal: abortCtrl.signal })
    var data = await resp.json()
    if (data.error) throw new Error(data.error.message || 'YouTube API xatosi')
    if (!resp.ok) throw new Error('HTTP ' + resp.status)
    return data
  }

  function cacheKey(q) { return 'yt_' + q.toLowerCase().replace(/\s+/g, '_') }

  function getCached(q) {
    try { var raw = localStorage.getItem(cacheKey(q)); if (!raw) return null; var c = JSON.parse(raw); if (Date.now() - c.ts < CACHE_TTL) return c.data } catch (e) {}
    return null
  }
  function setCached(q, data) { localStorage.setItem(cacheKey(q), JSON.stringify({ ts: Date.now(), data: data })) }

  function fmt(n) { n = parseInt(n, 10) || 0; if (n >= 1000000) return (n / 1000000).toFixed(1) + ' mln'; if (n >= 1000) return (n / 1000).toFixed(1) + ' ming'; return n.toString() }

  function ago(d) {
    var diff = Date.now() - new Date(d).getTime(), days = Math.floor(diff / 86400000)
    if (days < 1) return 'Bugun'; if (days < 7) return days + ' kun oldin'; if (days < 30) return Math.floor(days / 7) + ' hafta oldin'; if (days < 365) return Math.floor(days / 30) + ' oy oldin'; return Math.floor(days / 365) + ' yil oldin'
  }

  function flatVideos(items, mode) {
    if (mode === 'search') {
      var ids = [], map = {}
      for (var i = 0; i < items.length; i++) {
        if (items[i].id && items[i].id.videoId) { ids.push(items[i].id.videoId); map[items[i].id.videoId] = items[i] }
      }
      return { ids: ids, map: map }
    }
    return { ids: items.map(function (v) { return v.id }), map: {} }
  }

  async function loadTrending() {
    var cached = getCached('__trending__')
    if (cached) return cached
    var data = await ytFetch('videos', { part: 'snippet,statistics', chart: 'mostPopular', maxResults: 30 })
    if (!data.items || !data.items.length) throw new Error('Trending topilmadi')
    var res = data.items.map(function (v) { return { id: v.id, title: v.snippet.title, thumb: (v.snippet.thumbnails.high || v.snippet.thumbnails.medium || v.snippet.thumbnails.default).url, published: v.snippet.publishedAt, views: v.statistics && v.statistics.viewCount || '0', channel: v.snippet.channelTitle, channelId: v.snippet.channelId } })
    setCached('__trending__', res)
    return res
  }

  async function searchVids(query) {
    var cached = getCached(query)
    if (cached) return cached
    var data = await ytFetch('search', { part: 'snippet', q: query, type: 'video', maxResults: 30, safeSearch: 'none' })
    if (!data.items || !data.items.length) throw new Error('Video topilmadi')
    var flat = flatVideos(data.items, 'search')
    if (!flat.ids.length) throw new Error('Video topilmadi')
    var st = await ytFetch('videos', { part: 'statistics', id: flat.ids.join(',') })
    var stMap = {}; if (st.items) { for (var i = 0; i < st.items.length; i++) { stMap[st.items[i].id] = st.items[i].statistics } }
    var res = flat.ids.map(function (id) {
      var v = flat.map[id]; var s = stMap[id] || {}
      return { id: id, title: v.snippet.title, thumb: (v.snippet.thumbnails.high || v.snippet.thumbnails.medium || v.snippet.thumbnails.default).url, published: v.snippet.publishedAt, views: s.viewCount || '0', channel: v.snippet.channelTitle, channelId: v.snippet.channelId }
    })
    setCached(query, res)
    return res
  }

  function renderGrid(videos) {
    var grid = $('ytGrid'), loader = $('ytLoader'), error = $('ytError'), empty = $('ytEmpty')
    if (!grid) return
    hideLoader(); hideError(); hideEmpty()
    if (!videos || !videos.length) { showEmpty(); return }
    var html = '', prevId = playingId
    for (var i = 0; i < videos.length; i++) {
      var v = videos[i], active = v.id === prevId ? ' active' : ''
      html += '<div class="yt-card' + active + '" data-id="' + v.id + '">' +
        '<div class="yt-thumb-wrap"><img class="yt-thumb" src="' + escAttr(v.thumb) + '" loading="lazy" alt="' + escAttr(v.title) + '" />' +
        '<div class="yt-duration"></div></div>' +
        '<div class="yt-card-body">' +
        '<div class="yt-card-title">' + esc(v.title) + '</div>' +
        '<div class="yt-card-channel">' + esc(v.channel) + '</div>' +
        '<div class="yt-card-meta">' + fmt(v.views) + ' · ' + ago(v.published) + '</div></div></div>'
    }
    grid.innerHTML = html
    grid.querySelectorAll('.yt-card').forEach(function (el) {
      el.addEventListener('click', function () { playVideo(el.dataset.id) })
    })
  }

  function playVideo(id) {
    if (!id) return
    playingId = id
    var grid = $('ytGrid')
    if (grid) { grid.querySelectorAll('.yt-card.active').forEach(function (el) { el.classList.remove('active') }); var card = grid.querySelector('.yt-card[data-id="' + id + '"]'); if (card) card.classList.add('active') }
    var bar = $('ytPlayerBar'), container = $('ytPlayer'), titleEl = $('ytPlayerTitle'), metaEl = $('ytPlayerMeta')
    if (!bar || !container) return
    var cardData = findVideoData(id)
    if (titleEl) titleEl.textContent = cardData ? cardData.title : 'Video'
    if (metaEl && cardData) metaEl.innerHTML = esc(cardData.channel) + ' · ' + fmt(cardData.views) + ' marotaba ko\'rilgan'
    else if (metaEl) metaEl.innerHTML = ''
    container.innerHTML = '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>'
    bar.style.display = 'flex'
    var feed = $('ytFeed')
    if (feed) { feed.style.maxHeight = ''; setTimeout(function () { feed.style.maxHeight = 'calc(100% - ' + (bar.offsetHeight + 60) + 'px)'; feed.style.overflowY = 'auto' }, 50) }
  }

  function findVideoData(id) {
    var cards = document.querySelectorAll('.yt-card[data-id="' + id + '"]')
    if (!cards.length) return null
    var el = cards[0]
    return { title: el.querySelector('.yt-card-title').textContent, channel: el.querySelector('.yt-card-channel').textContent, views: el.querySelector('.yt-card-meta').textContent.split('·')[0].trim() }
  }

  function closePlayer() {
    var bar = $('ytPlayerBar'), container = $('ytPlayer'), feed = $('ytFeed')
    if (bar) bar.style.display = 'none'
    if (container) container.innerHTML = ''
    if (feed) feed.style.maxHeight = ''
    playingId = null
    var grid = $('ytGrid')
    if (grid) grid.querySelectorAll('.yt-card.active').forEach(function (el) { el.classList.remove('active') })
  }

  function hideLoader() { var el = $('ytLoader'); if (el) el.style.display = 'none' }
  function showLoader() { var el = $('ytLoader'); if (el) el.style.display = 'flex' }
  function hideError() { var el = $('ytError'); if (el) el.style.display = 'none' }
  function showError(msg) { var el = $('ytError'), d = $('ytErrorDesc'); if (el) el.style.display = 'flex'; if (d && msg) d.textContent = msg }
  function hideEmpty() { var el = $('ytEmpty'); if (el) el.style.display = 'none' }
  function showEmpty() { var el = $('ytEmpty'); if (el) el.style.display = 'flex' }

  function renderChips(activeId) {
    var wrap = $('ytChips'); if (!wrap) return
    wrap.innerHTML = CATEGORIES.map(function (c) { return '<button class="yt-chip' + (c.id === activeId ? ' active' : '') + '" data-cat="' + c.id + '">' + c.label + '</button>' }).join('')
    wrap.querySelectorAll('.yt-chip').forEach(function (el) {
      el.addEventListener('click', function () { var id = el.dataset.cat; if (id !== currentCategory) { currentCategory = id; renderChips(id); loadByCategory(id) } })
    })
  }

  async function loadByCategory(catId) {
    showLoader(); hideError(); hideEmpty()
    var cat = null; for (var ci = 0; ci < CATEGORIES.length; ci++) { if (CATEGORIES[ci].id === catId) { cat = CATEGORIES[ci]; break } }
    try {
      var vids = catId === 'all' ? await loadTrending() : cat && cat.query ? await searchVids(cat.query) : null
      if (vids && vids.length) renderGrid(vids); else { showEmpty(); var g = $('ytGrid'); if (g) g.innerHTML = '' }
    } catch (e) { if (e.name === 'AbortError') return; console.error(e); showError(e.message || 'Xatolik'); var g = $('ytGrid'); if (g) g.innerHTML = '' }
  }

  async function doSearch(query) {
    query = query.trim()
    if (!query) { currentCategory = 'all'; renderChips('all'); loadByCategory('all'); return }
    currentCategory = ''; renderChips(''); showLoader(); hideError(); hideEmpty()
    try {
      var vids = await searchVids(query)
      if (vids && vids.length) renderGrid(vids); else showEmpty()
    } catch (e) { if (e.name === 'AbortError') return; console.error(e); showError(e.message || 'Xatolik') }
  }

  function setupSearch() {
    var input = $('ytSearch'); if (!input) return
    input.addEventListener('input', function () { if (searchTimer) clearTimeout(searchTimer); searchTimer = setTimeout(function () { var q = input.value.trim(); q.length >= 2 ? doSearch(q) : q.length === 0 && (currentCategory = 'all', renderChips('all'), loadByCategory('all')) }, 500) })
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { if (searchTimer) clearTimeout(searchTimer); doSearch(input.value.trim()) } })
  }

  window.initYoutube = function () {
    renderChips('all'); setupSearch(); loadByCategory('all')
    var closeBtn = $('ytPlayerClose')
    if (closeBtn) closeBtn.addEventListener('click', closePlayer)
  }
})()
