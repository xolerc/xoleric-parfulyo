(function () {
  'use strict'
  var KEY = 'AIzaSyAwpEdIA_5_1aDPoMP0Q_ROE_zTrhoxwKs'
  var TTL = 6 * 60 * 60 * 1000
  var ctrl = null, st = null, cat = 'all', playing = null, chanFilter = null
  var ytPlayer = null, manualPause = false, playerReady = false, YT_API_LOADED = false
  var retryTimer = null, pageToken = null, allVideos = [], loadMtx = false
  var SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2], speedIdx = 2
  var hist = JSON.parse(localStorage.getItem('vp_hist') || '[]')
  var cw = JSON.parse(localStorage.getItem('vp_cw') || '{}')
  var vol = parseInt(localStorage.getItem('vp_vol') || '100', 10)

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
    var r, d
    try {
      r = await fetch(url(path, p), { signal: ctrl.signal })
      d = await r.json()
    } catch (e) {
      if (e.name === 'AbortError') throw e
      if (r && !r.ok) throw new Error('HTTP ' + r.status)
      throw new Error('Tarmoq xatosi')
    }
    if (d && d.error) {
      if (d.error.message && d.error.message.indexOf('quota') >= 0) throw new Error('QUOTA_EXCEEDED')
      throw new Error(d.error.message || 'API xatosi')
    }
    if (!r.ok) throw new Error('HTTP ' + r.status)
    return d
  }

  function ck(q) { return 'vp_' + q.toLowerCase().replace(/[\s_]+/g, '_') }
  function gc(q) { try { var r = localStorage.getItem(ck(q)); if (!r) return null; var c = JSON.parse(r); if (Date.now() - c.ts < TTL) return c.d } catch (e) {}; return null }
  function gcStale(q) { try { var r = localStorage.getItem(ck(q)); if (!r) return null; return JSON.parse(r).d } catch (e) {}; return null }
  function sc(q, d) { localStorage.setItem(ck(q), JSON.stringify({ ts: Date.now(), d: d })) }

  function fmt(n) { n = parseInt(n, 10) || 0; if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'; if (n >= 1000) return (n / 1000).toFixed(1) + 'K'; return '' + n }
  function ago(d) { var diff = Date.now() - new Date(d).getTime(), days = Math.floor(diff / 86400000); if (days < 1) return 'Bugun'; if (days < 7) return days + ' kun'; if (days < 30) return Math.floor(days / 7) + ' hafta'; if (days < 365) return Math.floor(days / 30) + ' oy'; return Math.floor(days / 365) + ' yil' }

  function sec(s) { var m = Math.floor(s / 60), sec = Math.floor(s % 60); return m + ':' + (sec < 10 ? '0' : '') + sec }
  function mapQual(q) { return { hd1080: '1080p', hd720: '720p', large: '480p', medium: '360p', small: '240p' }[q] || q }

  function addHist(v) {
    hist = hist.filter(function (h) { return h.id !== v.id })
    hist.unshift(v)
    if (hist.length > 50) hist = hist.slice(0, 50)
    localStorage.setItem('vp_hist', JSON.stringify(hist))
    renderHist()
  }

  function saveCW(id, t) { cw[id] = { t: t, ts: Date.now() }; localStorage.setItem('vp_cw', JSON.stringify(cw)) }
  function getCW(id) { var c = cw[id]; if (!c) return 0; if (Date.now() - c.ts > 86400000) { delete cw[id]; localStorage.setItem('vp_cw', JSON.stringify(cw)); return 0 }; return c.t }

  function renderHist() {
    var el = $('vpHistory'), list = $('vpHistoryList')
    if (!el || !list) return
    if (!hist.length) { el.style.display = 'none'; return }
    el.style.display = 'block'
    list.innerHTML = hist.map(function (h) { return '<span class="vp-history-chip" data-id="' + escA(h.id) + '">' + esc(h.title) + '</span>' }).join('')
    list.querySelectorAll('.vp-history-chip').forEach(function (c) { c.addEventListener('click', function () { play(c.dataset.id) }) })
  }

  function renderSkel() {
    var sk = $('vpGridSkel')
    if (!sk) return
    var h = ''
    for (var i = 0; i < 6; i++) h += '<div class="vp-skel-card"><div class="vp-skel-thumb"></div><div class="vp-skel-body"><div class="vp-skel-line"></div><div class="vp-skel-line"></div><div class="vp-skel-line"></div></div></div>'
    sk.innerHTML = h
    sk.style.display = 'grid'
  }

  function hideSkel() { var sk = $('vpGridSkel'); if (sk) sk.style.display = 'none' }

  function addChanChip(name) {
    var w = $('vpChips'), all = $('vpChipsAll')
    if (!w || !all) return
    var ex = w.querySelector('.vp-chip[data-chan]')
    if (ex) { ex.textContent = name; ex.dataset.chan = escA(name); return }
    var b = document.createElement('button')
    b.className = 'vp-chip act'; b.dataset.chan = escA(name); b.textContent = name
    b.addEventListener('click', function () { chanFilter = null; this.remove(); chips(cat); load(cat) })
    all.after(b)
  }

  function render(videos, append) {
    hideSkel()
    var grid = $('vpGrid'), load = $('vpLoad'), err = $('vpErr'), none = $('vpNone')
    if (!grid) return
    hide(load); hide(err); hide(none)
    if (!videos || !videos.length) { if (!append) { show(none); grid.innerHTML = '' }; return }
    var html = ''
    for (var i = 0; i < videos.length; i++) {
      var v = videos[i], act = v.id === playing ? ' active' : ''
      html += '<div class="vp-card' + act + '" data-id="' + v.id + '">' +
        '<div class="vp-card-thumb"><img src="' + escA(v.thumb) + '" loading="lazy" alt="" /></div>' +
        '<div class="vp-card-body"><div class="vp-card-title">' + esc(v.title) + '</div>' +
        '<div class="vp-card-line chan-link" data-chan="' + escA(v.channel) + '">' + esc(v.channel) + '</div>' +
        '<div class="vp-card-line vp-card-meta">' + fmt(v.views) + ' · ' + ago(v.published) + '</div></div></div>'
    }
    if (append) grid.insertAdjacentHTML('beforeend', html); else grid.innerHTML = html
    grid.querySelectorAll('.vp-card').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.closest('.chan-link')) return
        play(el.dataset.id)
      })
    })
    grid.querySelectorAll('.chan-link').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation()
        var ch = el.dataset.chan
        chanFilter = ch; addChanChip(ch); load(cat)
      })
    })
  }

  function ensureYTAPI() {
    if (YT_API_LOADED) return Promise.resolve()
    return new Promise(function (resolve) {
      var waited = 0
      var check = function () {
        if (typeof YT !== 'undefined' && YT.loaded) { YT_API_LOADED = true; resolve(); return }
        waited += 200
        if (waited > 10000) { resolve(); return }
        setTimeout(check, 200)
      }
      check()
    })
  }

  function updateToggle() {
    var btn = $('vpPlayerToggle')
    if (!btn) return
    if (!ytPlayer || !playerReady) { btn.textContent = '▶'; btn.classList.add('paused'); return }
    var s = ytPlayer.getPlayerState()
    if (s === 1) { btn.textContent = '⏸'; btn.classList.remove('paused') }
    else { btn.textContent = '▶'; btn.classList.add('paused') }
  }

  function updateTime() {
    if (!ytPlayer || !playerReady) return
    try {
      var cur = ytPlayer.getCurrentTime(), dur = ytPlayer.getDuration()
      var el = $('vpVidTime')
      if (el) el.textContent = sec(cur) + ' / ' + sec(dur || 0)
    } catch (e) {}
  }

  var timeIv = null, bgIv = null

  function startTimeTick() { stopTimeTick(); timeIv = setInterval(updateTime, 1000) }
  function stopTimeTick() { if (timeIv) { clearInterval(timeIv); timeIv = null } }

  function stopBgPlay() { if (bgIv) { clearInterval(bgIv); bgIv = null } }

  function startBgPlay() {
    stopBgPlay()
    if (!document.hidden || manualPause || !ytPlayer || !playerReady) return
    bgIv = setInterval(function () {
      if (!ytPlayer || !playerReady || manualPause || !document.hidden) { stopBgPlay(); return }
      try {
        if (ytPlayer.getPlayerState() === 2) ytPlayer.playVideo()
      } catch (e) {}
    }, 400)
  }

  function stopRetry() { if (retryTimer) { clearInterval(retryTimer); retryTimer = null } }

  function startRetry() {
    stopRetry()
    var tries = 0
    retryTimer = setInterval(function () {
      if (!ytPlayer || manualPause || !playerReady) { stopRetry(); return }
      tries++
      if (tries > 20) { stopRetry(); return }
      var s = ytPlayer.getPlayerState()
      if (s === 1) { stopRetry(); return }
      if (s === 2 || s === 0) { stopRetry(); return }
      try { ytPlayer.playVideo() } catch (ex) {}
    }, 500)
  }

  function createPlayer(videoId) {
    if (ytPlayer) { ytPlayer.destroy(); ytPlayer = null }
    stopRetry(); stopTimeTick()
    playerReady = false; manualPause = false
    var vid = $('vpPlayerVid')
    if (!vid) return
    ensureYTAPI().then(function () {
      vid.innerHTML = ''
      if (typeof YT !== 'undefined' && YT.Player) {
        var div = document.createElement('div'); div.id = 'vpYouTubePlayer'
        vid.appendChild(div)
        ytPlayer = new YT.Player(div, {
          width: '100%', height: '100%',
          videoId: videoId,
          playerVars: { autoplay: 1, rel: 0, controls: 1, playsinline: 1 },
          events: {
            onReady: function () {
              playerReady = true
              try { ytPlayer.setVolume(vol) } catch (ex) {}
              try { ytPlayer.setPlaybackRate(SPEEDS[speedIdx]) } catch (ex) {}
              var seek = getCW(videoId)
              if (seek > 5) { try { ytPlayer.seekTo(seek, true) } catch (ex) {} }
              if (ytPlayer) ytPlayer.playVideo()
              updateToggle(); startTimeTick()
            },
            onStateChange: function (e) {
              var state = e.data
              stopRetry()
              if (state === 1) {
                manualPause = false; updateToggle(); startTimeTick()
                var cd = cardData(videoId)
                if (cd) addHist({ id: videoId, title: cd.title, channel: cd.channel })
              } else if (state === 2) {
                if (!document.hidden && !manualPause) manualPause = true
                updateToggle(); stopTimeTick()
                try { saveCW(videoId, ytPlayer.getCurrentTime()) } catch (ex) {}
              } else if (state === 3) {
                if (!manualPause) startRetry()
                updateToggle()
              } else if (state === 0) {
                stopTimeTick(); updateToggle()
                if (manualPause) return
                setTimeout(function () {
                  if (!ytPlayer || manualPause) return
                  var grid = $('vpGrid')
                  if (!grid) return
                  var act = grid.querySelector('.vp-card.active')
                  var next = act ? act.nextElementSibling : null
                  while (next && !next.classList.contains('vp-card')) next = next.nextElementSibling
                  if (next && next.dataset.id) play(next.dataset.id)
                }, 800)
              }
            }
          }
        })
      } else {
        vid.innerHTML = '<iframe style="position:absolute;top:0;left:0;width:100%;height:100%" src="https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0&playsinline=1" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>'
        playerReady = true; startTimeTick()
      }
    })
  }

  function loadRec(id) {
    var cd = cardData(id)
    if (!cd) return
    cat = ''; chanFilter = null
    $('vpChipsAll') && $('vpChipsAll').classList.remove('act')
    renderSkel()
    var q = cd.title.split(' ').slice(0, 4).join(' ')
    search(q).then(function (v) {
      if (!v || !v.length) { hideSkel(); return }
      v = v.filter(function (x) { return x.id !== id })
      if (v.length > 12) v = v.slice(0, 12)
      render(v)
    }).catch(function () { hideSkel() })
  }

  function loadRelated(id) {
    var cd = cardData(id)
    if (!cd) { $('vpRelated') && ($('vpRelated').style.display = 'none'); return }
    var q = cd.title.split(' ').slice(0, 4).join(' ')
    var relEl = $('vpRelated'), listEl = $('vpRelatedList')
    if (!relEl || !listEl) return
    search(q).then(function (v) {
      if (!v || !v.length) { relEl.style.display = 'none'; return }
      v = v.filter(function (x) { return x.id !== id })
      if (v.length > 8) v = v.slice(0, 8)
      if (!v.length) { relEl.style.display = 'none'; return }
      listEl.innerHTML = v.map(function (x) {
        return '<div class="vp-rel-card" data-id="' + escA(x.id) + '">' +
          '<div class="vp-rel-thumb"><img src="' + escA(x.thumb) + '" loading="lazy" alt="" /></div>' +
          '<div class="vp-rel-body"><div class="vp-rel-title">' + esc(x.title) + '</div>' +
          '<div class="vp-rel-chan">' + esc(x.channel) + '</div></div></div>'
      }).join('')
      listEl.querySelectorAll('.vp-rel-card').forEach(function (el) {
        el.addEventListener('click', function () { play(el.dataset.id) })
      })
      relEl.style.display = 'block'
    }).catch(function () { relEl.style.display = 'none' })
  }

  function play(id) {
    if (!id) return
    playing = id; manualPause = false
    var grid = $('vpGrid')
    if (grid) {
      grid.querySelectorAll('.vp-card.active').forEach(function (el) { el.classList.remove('active') })
      var c = grid.querySelector('.vp-card[data-id="' + id + '"]')
      if (c) c.classList.add('active')
    }
    var bar = $('vpPlayer'), tEl = $('vpPlayerTitle'), sEl = $('vpPlayerSub')
    if (!bar) return
    bar.classList.remove('mini')
    var cd = cardData(id)
    if (tEl) tEl.textContent = cd ? cd.title : ''
    if (sEl && cd) sEl.textContent = cd.channel + ' · ' + fmt(cd.views)
    else if (sEl) sEl.textContent = ''
    bar.style.display = 'flex'
    createPlayer(id)
    resizeF()
    setupShare()
    loadRelated(id)
  }

  var shareTimer = null

  function setupShare() {
    var sEl = $('vpPlayerSub')
    if (!sEl) return
    sEl.title = 'Bosish orqali link nusxalash'
    if (sEl._shareSet) return
    sEl._shareSet = true
    sEl.addEventListener('click', function () {
      var id = playing
      if (!id) return
      var url = 'https://youtu.be/' + id
      if (navigator.clipboard) navigator.clipboard.writeText(url).catch(function () {})
      var orig = this.textContent
      this.textContent = '✅ Link nusxalandi!'
      if (shareTimer) clearTimeout(shareTimer)
      shareTimer = setTimeout(function () { sEl.textContent = orig }, 2000)
    })
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (ytPlayer && playerReady && !manualPause) startBgPlay()
    } else {
      stopBgPlay()
      if (ytPlayer && playerReady && !manualPause) {
        try {
          var s = ytPlayer.getPlayerState()
          if (s === 2 || s === 3 || s === -1) ytPlayer.playVideo()
        } catch (e) {}
      }
    }
  })

  function cardData(id) {
    var c = document.querySelector('.vp-card[data-id="' + id + '"]')
    if (!c) return null
    return {
      title: (c.querySelector('.vp-card-title') || {}).textContent || '',
      channel: ((c.querySelector('.chan-link') || c.querySelector('.vp-card-line')) || {}).textContent || '',
      views: ((c.querySelector('.vp-card-meta') || {}).textContent || '').split('·')[0].trim()
    }
  }

  function resizeF() { var f = $('vpFeed'); if (f) f.style.maxHeight = '' }

  function closeP() {
    stopRetry(); stopTimeTick()
    var bar = $('vpPlayer'), feed = $('vpFeed')
    if (ytPlayer) {
      try { saveCW(playing, ytPlayer.getCurrentTime()) } catch (ex) {}
      try { ytPlayer.destroy() } catch (ex) {}
      ytPlayer = null
    }
    playerReady = false; manualPause = false; playing = null
    if (bar) { bar.style.display = 'none'; bar.classList.remove('mini') }
    if (feed) feed.style.maxHeight = ''
    var grid = $('vpGrid')
    if (grid) grid.querySelectorAll('.vp-card.active').forEach(function (el) { el.classList.remove('active') })
  }

  function hide(el) { if (el) el.style.display = 'none' }
  function show(el) { if (el) el.style.display = 'flex' }

  function chips(id) {
    var w = $('vpChips'); if (!w) return
    w.innerHTML = '<button class="vp-chip' + (id === 'all' && !chanFilter ? ' act' : '') + '" id="vpChipsAll" data-i="all">Trends</button>' +
      CHIPS.slice(1).map(function (c) { return '<button class="vp-chip' + (c.id === id && !chanFilter ? ' act' : '') + '" data-i="' + c.id + '">' + c.label + '</button>' }).join('')
    w.querySelectorAll('.vp-chip:not([data-chan])').forEach(function (el) {
      el.addEventListener('click', function () {
        var id2 = el.dataset.i
        if (id2 === cat && !chanFilter) { load(id2); return }
        cat = id2; chanFilter = null; chips(id2); load(id2)
      })
    })
  }

  var statsCache = {}, statsCacheKeys = []

  async function fetchSearch(q, pt) {
    var cq = (q || '') + (chanFilter ? ' ' + chanFilter : '')
    var cacheKey = 'search_' + cq + (pt || '')
    var c = gc(cacheKey)
    if (c && !pt) return c
    var params = { part: 'snippet', q: cq, type: 'video', maxResults: 30, safeSearch: 'none' }
    if (pt) params.pageToken = pt
    if (ctrl) ctrl.abort()
    ctrl = new AbortController()
    var d = await fetchJSON('search', params)
    pageToken = d.nextPageToken || null
    if (!d.items || !d.items.length) throw new Error('Hech narsa topilmadi')
    var ids = [], map = {}
    for (var i = 0; i < d.items.length; i++) { if (d.items[i].id && d.items[i].id.videoId) { ids.push(d.items[i].id.videoId); map[d.items[i].id.videoId] = d.items[i] } }
    if (!ids.length) throw new Error('Hech narsa topilmadi')
    /* Fetch stats for unseen IDs only, use in-memory cache for same batch */
    var missingIds = ids.filter(function (id) { return !statsCache[id] })
    if (missingIds.length) {
      var chunkSize = 50
      for (var ci = 0; ci < missingIds.length; ci += chunkSize) {
        var chunk = missingIds.slice(ci, ci + chunkSize)
        try {
          var s = await fetchJSON('videos', { part: 'statistics', id: chunk.join(',') })
          if (s.items) for (var j = 0; j < s.items.length; j++) {
            statsCache[s.items[j].id] = s.items[j].statistics
            statsCacheKeys.push(s.items[j].id)
          }
        } catch (e) { if (e.message === 'QUOTA_EXCEEDED') throw e }
      }
      while (statsCacheKeys.length > 500) { var old = statsCacheKeys.shift(); delete statsCache[old] }
    }
    var r = ids.map(function (id) {
      var v = map[id], st = statsCache[id] || {}, t = v.snippet.thumbnails, th = (t.high || t.medium || t.default).url
      return { id: id, title: v.snippet.title, thumb: th, published: v.snippet.publishedAt, views: st.viewCount || '0', channel: v.snippet.channelTitle }
    })
    if (!pt) sc(cacheKey, r)
    return r
  }

  async function fetchTrending(pt) {
    var cacheKey = 'trending_' + (pt || '')
    if (chanFilter) return fetchSearch('', pt)
    var c = gc(cacheKey)
    if (c && !pt) return c
    if (ctrl) ctrl.abort()
    ctrl = new AbortController()
    var params = { part: 'snippet,statistics', chart: 'mostPopular', maxResults: 30 }
    if (pt) params.pageToken = pt
    var d = await fetchJSON('videos', params)
    pageToken = d.nextPageToken || null
    if (!d.items || !d.items.length) throw new Error('Hech narsa topilmadi')
    var r = d.items.map(function (v) {
      var t = v.snippet.thumbnails; var th = (t.maxres || t.high || t.medium || t.default).url
      return { id: v.id, title: v.snippet.title, thumb: th, published: v.snippet.publishedAt, views: (v.statistics && v.statistics.viewCount) || '0', channel: v.snippet.channelTitle }
    })
    if (!pt) sc(cacheKey, r)
    return r
  }

  async function search(q) {
    return fetchSearch(q)
  }

  async function trending() {
    return fetchTrending()
  }

  async function load(id) {
    var loadEl = $('vpLoad'), errEl = $('vpErr'), noneEl = $('vpNone'), descEl = $('vpErrDesc'), moreEl = $('vpLoadMore')
    allVideos = []; pageToken = null; hide(moreEl)
    show(loadEl); hide(errEl); hide(noneEl); renderSkel()
    var ch = null; for (var ci = 0; ci < CHIPS.length; ci++) { if (CHIPS[ci].id === id) { ch = CHIPS[ci]; break } }
    try {
      var v
      if (id === 'all') v = await trending()
      else if (ch && ch.q) v = await search(ch.q)
      else v = null
      if (v && v.length) { allVideos = v; render(v); if (pageToken) show(moreEl) } else { hide(loadEl); show(noneEl); var g = $('vpGrid'); if (g) g.innerHTML = '' }
    } catch (e) {
      if (e.name === 'AbortError') { hideSkel(); return }
      console.error(e); hide(loadEl)
      /* Try stale cache on error */
      var staleKey = id === 'all' ? 'trending_' : (ch ? ch.q : null)
      var stale = staleKey ? gcStale(staleKey) : null
      if (stale && stale.length) { allVideos = stale; render(stale); if (descEl) descEl.textContent = 'Kesh ma\'lumotlari ko\'rsatilmoqda (yangilash imkonsiz)'; return }
      show(errEl)
      if (descEl) descEl.textContent = e.message === 'QUOTA_EXCEEDED' ? 'Kunlik limit tugadi. Ertaga qayta urinib ko\'ring.' : (e.message || 'Xatolik')
      var g = $('vpGrid'); if (g) g.innerHTML = ''
    }
    hideSkel(); hide(loadEl)
  }

  async function loadMore() {
    if (!pageToken || loadMtx) return
    loadMtx = true
    var btn = $('vpLoadMoreBtn')
    if (btn) btn.disabled = true
    try {
      var newV
      if (cat === 'all') newV = await fetchTrending(pageToken)
      else {
        var ch = null; for (var ci = 0; ci < CHIPS.length; ci++) { if (CHIPS[ci].id === cat) { ch = CHIPS[ci]; break } }
        if (!ch || !ch.q) { loadMtx = false; if (btn) btn.disabled = false; return }
        newV = await fetchSearch(ch.q, pageToken)
      }
      if (newV && newV.length) { allVideos = allVideos.concat(newV); render(newV, true) }
      if (!pageToken) $('vpLoadMore').style.display = 'none'
    } catch (e) {
      console.error(e)
      var descEl = $('vpErrDesc')
      if (descEl && e.message) descEl.textContent = e.message === 'QUOTA_EXCEEDED' ? 'Kunlik limit tugadi' : e.message
    }
    loadMtx = false
    if (btn) btn.disabled = false
  }

  var searchMtx = false

  function doSearch(q) {
    q = q.trim()
    if (!q) { cat = 'all'; chanFilter = null; chips('all'); load('all'); return }
    if (searchMtx) { if (ctrl) ctrl.abort(); searchMtx = false }
    cat = ''; chanFilter = null; chips(''); renderSkel(); hide($('vpErr')); hide($('vpNone')); hide($('vpLoadMore'))
    searchMtx = true
    search(q).then(function (v) {
      searchMtx = false
      if (v && v.length) { allVideos = v; render(v); if (pageToken) show($('vpLoadMore')) } else { hideSkel(); show($('vpNone')) }
    }).catch(function (e) {
      searchMtx = false
      if (e.name === 'AbortError') return; console.error(e)
      var staleKey = 'search_' + q
      var stale = gcStale(staleKey)
      if (stale && stale.length) { hideSkel(); allVideos = stale; render(stale); var d = $('vpErrDesc'); if (d) d.textContent = 'Kesh ma\'lumotlari (yangilash imkonsiz)'; return }
      hideSkel(); show($('vpErr')); var d = $('vpErrDesc'); if (d) d.textContent = e.message === 'QUOTA_EXCEEDED' ? 'Kunlik limit tugadi. Ertaga qayta urinib ko\'ring.' : (e.message || 'Xatolik')
    })
  }

  function setupSearch() {
    var inp = $('vpSearch'); if (!inp) return
    inp.addEventListener('input', function () { if (st) clearTimeout(st); st = setTimeout(function () { var q = inp.value.trim(); q.length >= 2 ? doSearch(q) : q.length === 0 && (cat = 'all', chips('all'), load('all')) }, 500) })
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { if (st) clearTimeout(st); doSearch(inp.value.trim()) } })
  }

  function getVideos() {
    return Array.from(document.querySelectorAll('#vpGrid .vp-card')).map(function (c) { return c.dataset.id }).filter(Boolean)
  }

  function nav(step) {
    var ids = getVideos()
    if (!ids.length) return
    var idx = ids.indexOf(playing)
    if (idx === -1) { if (step > 0) play(ids[0]); return }
    var next = idx + step
    if (next < 0) next = ids.length - 1
    if (next >= ids.length) next = 0
    play(ids[next])
  }

  function setupKeyboard() {
    document.addEventListener('keydown', function (e) {
      if ($('tab-video') && $('tab-video').style.display !== 'none') {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
        switch (e.key) {
          case ' ': e.preventDefault()
            if (!ytPlayer || !playerReady) return
            if (ytPlayer.getPlayerState() === 1) { manualPause = true; ytPlayer.pauseVideo() }
            else { manualPause = false; ytPlayer.playVideo() }
            updateToggle(); break
          case 'ArrowLeft': e.preventDefault(); nav(-1); break
          case 'ArrowRight': e.preventDefault(); nav(1); break
          case 'Escape': e.preventDefault(); closeP(); break
          case 'm': case 'M': e.preventDefault()
            if (!ytPlayer || !playerReady) return
            if (ytPlayer.isMuted()) { ytPlayer.unMute(); updateVolBtn() } else { ytPlayer.mute(); updateVolBtn() }; break
          case 'f': case 'F': e.preventDefault()
            if (!ytPlayer || !playerReady) return
            var ifr = document.querySelector('#vpYouTubePlayer iframe')
            if (ifr && ifr.requestFullscreen) ifr.requestFullscreen(); break
        }
      }
    })
    var hint = $('vpSearch')
    if (hint) { hint.placeholder = 'Qidirish...  [Space: ▶⏸  ←→: nav  Esc: yopish]'; hint.title = hint.placeholder }
    setTimeout(function () { if (hint) hint.placeholder = 'Qidirish...' }, 6000)
  }

  function updateVolBtn() {
    var btn = $('vpVolBtn'), sl = $('vpVolSlider')
    if (!btn) return
    if (!ytPlayer || !playerReady) { btn.textContent = '🔊'; return }
    var muted = ytPlayer.isMuted()
    if (muted) btn.textContent = '🔇'
    else if (vol < 30) btn.textContent = '🔈'
    else if (vol < 70) btn.textContent = '🔉'
    else btn.textContent = '🔊'
    if (sl) sl.value = muted ? 0 : vol
  }

  function setupVolume() {
    var btn = $('vpVolBtn'), sl = $('vpVolSlider')
    if (btn) btn.addEventListener('click', function () {
      if (!ytPlayer || !playerReady) return
      if (ytPlayer.isMuted()) { ytPlayer.unMute(); updateVolBtn() }
      else { ytPlayer.mute(); updateVolBtn() }
    })
    if (sl) {
      sl.addEventListener('input', function () {
        vol = parseInt(sl.value, 10)
        if (!ytPlayer || !playerReady) return
        if (vol === 0) ytPlayer.mute(); else { ytPlayer.unMute(); ytPlayer.setVolume(vol) }
        localStorage.setItem('vp_vol', '' + vol)
        updateVolBtn()
      })
    }
  }

  function setupSpeed() {
    var btn = $('vpSpeedBtn')
    if (!btn) return
    btn.addEventListener('click', function () {
      speedIdx = (speedIdx + 1) % SPEEDS.length
      var rate = SPEEDS[speedIdx]
      btn.textContent = rate + 'x'
      if (ytPlayer && playerReady) try { ytPlayer.setPlaybackRate(rate) } catch (ex) {}
    })
  }

  function setupQuality() {
    var btn = $('vpQualityBtn'), menu = $('vpQualMenu')
    if (!btn || !menu) return
    btn.addEventListener('click', function () {
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block'
      if (menu.style.display === 'block' && ytPlayer && playerReady) {
        try {
          var av = ytPlayer.getAvailableQualityLevels() || []
          var cur = ytPlayer.getPlaybackQuality()
          menu.innerHTML = av.map(function (q) { return '<button class="vp-qual-item' + (q === cur ? ' act' : '') + '" data-q="' + q + '">' + mapQual(q) + '</button>' }).join('')
          menu.querySelectorAll('.vp-qual-item').forEach(function (el) {
            el.addEventListener('click', function () {
              try { ytPlayer.setPlaybackQuality(el.dataset.q) } catch (ex) {}
              menu.style.display = 'none'
              btn.textContent = mapQual(el.dataset.q)
            })
          })
        } catch (ex) { menu.innerHTML = '<div class="vp-qual-item">Sifat mavjud emas</div>' }
      }
    })
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && e.target !== btn) menu.style.display = 'none'
    })
  }

  function setupMinimize() {
    var btn = $('vpMinimizeBtn'), bar = $('vpPlayer')
    if (!btn || !bar) return
    btn.addEventListener('click', function () {
      bar.classList.toggle('mini')
      btn.textContent = bar.classList.contains('mini') ? '🗖' : '🗕'
      resizeF()
    })
    bar.addEventListener('click', function (e) {
      if (bar.classList.contains('mini') && !e.target.closest('.vp-player-x') && !e.target.closest('.vp-player-vid')) {
        bar.classList.remove('mini')
        btn.textContent = '🗕'
        resizeF()
      }
    })
  }

  function setupHistClear() {
    var clr = $('vpHistoryClear')
    if (!clr) return
    clr.addEventListener('click', function () { hist = []; localStorage.setItem('vp_hist', JSON.stringify(hist)); renderHist() })
  }

  function setupScrollRefresh() {
    var feed = $('vpFeed')
    if (!feed) return
    var lastTop = 0
    feed.addEventListener('scroll', function () {
      var top = feed.scrollTop
      if (top <= -20 && lastTop <= -20 && cat && !loadMtx) {
        feed.scrollTop = 0
        load(cat)
      }
      lastTop = top
    })
  }

  window.initYoutube = function () {
    chips('all'); setupSearch(); setupVolume(); setupSpeed(); setupQuality(); setupMinimize()
    setupKeyboard(); setupHistClear(); renderHist(); setupScrollRefresh()
    var x = $('vpPlayerX'); if (x) x.addEventListener('click', closeP)
    var lm = $('vpLoadMoreBtn'); if (lm) lm.addEventListener('click', loadMore)
    load('all')
  }
})()
