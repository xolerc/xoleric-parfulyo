(function () {
  'use strict'
  var API_KEY = 'AIzaSyAwpEdIA_5_1aDPoMP0Q_ROE_zTrhoxwKs'
  var CACHE_TTL = 30 * 60 * 1000
  var searchCache = {}
  var abortCtrl = null, searchTimer = null

  var CATEGORIES = [
    { id: 'all', label: 'Barcha', query: '' },
    { id: 'tech', label: 'Texnologiya', query: 'texnologiya 2026' },
    { id: 'music', label: 'Musiqa', query: 'musiqa 2026' },
    { id: 'coding', label: 'Dasturlash', query: 'dasturlash 2026' },
    { id: 'gaming', label: "O'yin", query: "o'yin 2026" }
  ]
  var currentCategory = 'all', currentQuery = ''

  function $(id) { return document.getElementById(id) }
  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
  function escAttr(s) { return (s || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;') }

  function ytApiUrl(path, params) {
    var p = ''; for (var k in params) { if (p) p += '&'; p += k + '=' + encodeURIComponent(params[k]) }
    return 'https://www.googleapis.com/youtube/v3/' + path + '?' + p + '&key=' + API_KEY
  }

  async function ytFetch(path, params) {
    if (abortCtrl) abortCtrl.abort()
    abortCtrl = new AbortController()
    var resp = await fetch(ytApiUrl(path, params), { signal: abortCtrl.signal })
    var data = await resp.json()
    if (data.error) throw new Error(data.error.message || 'YouTube API xatosi')
    if (!resp.ok) throw new Error('HTTP ' + resp.status)
    return data
  }

  function cacheKey(query) { return 'yt_' + query.toLowerCase().replace(/\s+/g, '_') }

  function getCached(query) {
    var key = cacheKey(query), raw = localStorage.getItem(key)
    if (!raw) return null
    try {
      var c = JSON.parse(raw)
      if (Date.now() - c.ts < CACHE_TTL) return c.data
    } catch (e) {}
    return null
  }

  function setCached(query, data) {
    var key = cacheKey(query)
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: data }))
  }

  function formatViews(n) {
    n = parseInt(n, 10) || 0
    if (n >= 1000000000) return (n / 1000000000).toFixed(1) + ' mlrd'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + ' mln'
    if (n >= 1000) return (n / 1000).toFixed(1) + ' ming'
    return n.toString()
  }

  function timeAgo(dateStr) {
    var now = Date.now(), then = new Date(dateStr).getTime(), diff = now - then
    var days = Math.floor(diff / 86400000)
    if (days < 1) return 'Bugun'
    if (days < 7) return days + ' kun oldin'
    if (days < 30) return Math.floor(days / 7) + ' hafta oldin'
    if (days < 365) return Math.floor(days / 30) + ' oy oldin'
    return Math.floor(days / 365) + ' yil oldin'
  }

  async function searchVideos(query) {
    var cached = getCached(query)
    if (cached) return cached
    var data = await ytFetch('search', { part: 'snippet', q: query, type: 'video', maxResults: 30, safeSearch: 'none' })
    if (!data.items || !data.items.length) throw new Error('Video topilmadi')
    var ids = [], items = []
    for (var i = 0; i < data.items.length; i++) {
      var v = data.items[i]
      if (v.id && v.id.videoId) { ids.push(v.id.videoId); items.push(v) }
    }
    if (!ids.length) throw new Error('Video topilmadi')
    var statsData = await ytFetch('videos', { part: 'statistics', id: ids.join(',') })
    var statsMap = {}
    if (statsData.items) {
      for (var j = 0; j < statsData.items.length; j++) {
        var s = statsData.items[j]
        statsMap[s.id] = s.statistics
      }
    }
    var result = items.map(function (v) {
      var st = statsMap[v.id.videoId] || {}
      return {
        id: v.id.videoId,
        title: v.snippet.title,
        thumb: v.snippet.thumbnails.high ? v.snippet.thumbnails.high.url : (v.snippet.thumbnails.medium ? v.snippet.thumbnails.medium.url : v.snippet.thumbnails.default.url),
        published: v.snippet.publishedAt,
        views: st.viewCount || '0',
        channelTitle: v.snippet.channelTitle,
        channelId: v.snippet.channelId
      }
    })
    setCached(query, result)
    return result
  }

  async function fetchTrending() {
    var cached = getCached('__trending__')
    if (cached) return cached
    var data = await ytFetch('videos', { part: 'snippet,statistics', chart: 'mostPopular', maxResults: 30 })
    if (!data.items || !data.items.length) throw new Error('Trending videolar topilmadi')
    var result = data.items.map(function (v) {
      return { id: v.id, title: v.snippet.title, thumb: v.snippet.thumbnails.high ? v.snippet.thumbnails.high.url : (v.snippet.thumbnails.medium ? v.snippet.thumbnails.medium.url : v.snippet.thumbnails.default.url), published: v.snippet.publishedAt, views: (v.statistics && v.statistics.viewCount) || '0', channelTitle: v.snippet.channelTitle, channelId: v.snippet.channelId }
    })
    setCached('__trending__', result)
    return result
  }

  function renderGrid(videos) {
    var grid = $('ytGrid'), loader = $('ytLoader'), error = $('ytError'), empty = $('ytEmpty')
    if (!grid) return
    if (loader) loader.style.display = 'none'
    if (error) error.style.display = 'none'
    if (empty) empty.style.display = 'none'
    if (!videos || !videos.length) {
      if (empty) { empty.style.display = 'flex'; grid.innerHTML = '' }
      return
    }
    var html = ''
    for (var i = 0; i < videos.length; i++) {
      var v = videos[i]
      html += '<div class="yt-card" data-id="' + v.id + '" onclick="window.playYTVideo(\'' + v.id + '\',\'' + escAttr(v.title) + '\')">' +
        '<div class="yt-thumb-wrap"><img class="yt-thumb" src="' + escAttr(v.thumb) + '" loading="lazy" alt="' + escAttr(v.title) + '" /><div class="yt-thumb-overlay"><span class="yt-play-icon">▶</span></div></div>' +
        '<div class="yt-card-info"><div class="yt-card-title">' + esc(v.title) + '</div><div class="yt-card-meta">' + esc(v.channelTitle) + ' · ' + formatViews(v.views) + ' marotaba ko\'rilgan · ' + timeAgo(v.published) + '</div></div></div>'
    }
    grid.innerHTML = html
  }

  function showLoading() {
    var loader = $('ytLoader'), grid = $('ytGrid'), error = $('ytError'), empty = $('ytEmpty')
    if (loader) loader.style.display = 'flex'
    if (grid) grid.innerHTML = ''
    if (error) error.style.display = 'none'
    if (empty) empty.style.display = 'none'
  }

  function showError(msg) {
    var loader = $('ytLoader'), grid = $('ytGrid'), error = $('ytError'), empty = $('ytEmpty'), desc = $('ytErrorDesc')
    if (loader) loader.style.display = 'none'
    if (grid) grid.innerHTML = ''
    if (empty) empty.style.display = 'none'
    if (desc && msg) desc.textContent = msg
    if (error) error.style.display = 'flex'
  }

  function showEmpty() {
    var loader = $('ytLoader'), grid = $('ytGrid'), error = $('ytError'), empty = $('ytEmpty')
    if (loader) loader.style.display = 'none'
    if (grid) grid.innerHTML = ''
    if (error) error.style.display = 'none'
    if (empty) empty.style.display = 'flex'
  }

  function renderChips(activeId) {
    var wrap = $('ytChips')
    if (!wrap) return
    var html = ''
    for (var i = 0; i < CATEGORIES.length; i++) {
      var c = CATEGORIES[i]
      html += '<button class="yt-chip' + (c.id === activeId ? ' active' : '') + '" data-cat="' + c.id + '">' + c.label + '</button>'
    }
    wrap.innerHTML = html
    wrap.querySelectorAll('.yt-chip').forEach(function (el) {
      el.addEventListener('click', function () {
        var catId = el.dataset.cat
        if (catId === currentCategory) return
        currentCategory = catId
        renderChips(catId)
        loadByCategory(catId)
      })
    })
  }

  async function loadByCategory(catId) {
    showLoading()
    var cat = null
    for (var i = 0; i < CATEGORIES.length; i++) { if (CATEGORIES[i].id === catId) { cat = CATEGORIES[i]; break } }
    try {
      if (catId === 'all') {
        var vids = await fetchTrending()
        if (vids && vids.length) renderGrid(vids)
        else showEmpty()
      } else if (cat && cat.query) {
        var results = await searchVideos(cat.query)
        if (results && results.length) renderGrid(results)
        else showEmpty()
      } else {
        showEmpty()
      }
    } catch (e) {
      if (e.name === 'AbortError') return
      console.error('YouTube error:', e)
      showError(e.message || 'Xatolik yuz berdi')
    }
  }

  async function doSearch(query) {
    if (!query || !query.trim()) {
      currentCategory = 'all'
      renderChips('all')
      loadByCategory('all')
      return
    }
    currentQuery = query.trim()
    currentCategory = ''
    renderChips('')
    showLoading()
    try {
      var results = await searchVideos(currentQuery)
      if (results && results.length) renderGrid(results)
      else showEmpty()
    } catch (e) {
      if (e.name === 'AbortError') return
      console.error('YouTube search error:', e)
      showError(e.message || 'Xatolik yuz berdi')
    }
  }

  function setupSearch() {
    var input = $('ytSearch')
    if (!input) return
    input.addEventListener('input', function () {
      if (searchTimer) clearTimeout(searchTimer)
      searchTimer = setTimeout(function () {
        var q = input.value.trim()
        if (q.length >= 2) doSearch(q)
        else if (q.length === 0) {
          currentCategory = 'all'
          renderChips('all')
          loadByCategory('all')
        }
      }, 500)
    })
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        if (searchTimer) clearTimeout(searchTimer)
        doSearch(input.value.trim())
      }
    })
  }

  // Player overlay
  window.playYTVideo = function (videoId, title) {
    var overlay = $('ytPlayerOverlay'), container = $('ytPlayer'), titleEl = $('ytPlayerTitle')
    if (!overlay || !container) return
    if (titleEl) titleEl.textContent = title || 'Video'
    container.innerHTML = '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>'
    overlay.style.display = 'flex'
  }

  function closePlayer() {
    var overlay = $('ytPlayerOverlay'), container = $('ytPlayer')
    if (overlay) overlay.style.display = 'none'
    if (container) container.innerHTML = ''
  }
  window.closeYTPlayer = closePlayer

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && $('ytPlayerOverlay') && $('ytPlayerOverlay').style.display === 'flex') closePlayer()
  })

  window.initYoutube = function () {
    renderChips('all')
    setupSearch()
    loadByCategory('all')
    var ov = $('ytPlayerOverlay')
    if (ov) ov.addEventListener('click', function (e) { if (e.target === ov) closePlayer() })
    var closeBtn = $('ytClosePlayer')
    if (closeBtn) closeBtn.addEventListener('click', closePlayer)
  }
})()
