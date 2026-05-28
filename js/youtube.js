(function () {
  'use strict'
  var API_KEY = 'AIzaSyAwpEdIA_5_1aDPoMP0Q_ROE_zTrhoxwKs'
  var CHANNEL_HANDLE = '@xoleric'
  var CHANNEL_ID_KEY = 'xolerc_yt_channel'
  var cache = { channelId: localStorage.getItem(CHANNEL_ID_KEY), videos: null }

  function $(id) { return document.getElementById(id) }
  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
  function escAttr(s) { return (s || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;') }

  function ytApiUrl(path, params) {
    var p = ''; for (var k in params) { if (p) p += '&'; p += k + '=' + encodeURIComponent(params[k]) }
    return 'https://www.googleapis.com/youtube/v3/' + path + '?' + p + '&key=' + API_KEY
  }

  async function ytFetch(path, params) {
    var resp = await fetch(ytApiUrl(path, params))
    var data = await resp.json()
    if (data.error) throw new Error(data.error.message || 'YouTube API xatosi')
    if (!resp.ok) throw new Error('HTTP ' + resp.status)
    return data
  }

  async function getChannelId() {
    if (cache.channelId) return cache.channelId
    var data = await ytFetch('channels', { part: 'id', forHandle: CHANNEL_HANDLE })
    if (!data.items || !data.items.length) {
      data = await ytFetch('channels', { part: 'id', forUsername: CHANNEL_HANDLE.replace('@', '') })
    }
    if (!data.items || !data.items.length) throw new Error('Kanal topilmadi')
    cache.channelId = data.items[0].id
    localStorage.setItem(CHANNEL_ID_KEY, cache.channelId)
    return cache.channelId
  }

  async function fetchVideos() {
    var channelId = await getChannelId()
    var data = await ytFetch('search', { part: 'snippet', channelId: channelId, order: 'date', maxResults: 30, type: 'video' })
    if (!data.items || !data.items.length) throw new Error('Videolar topilmadi')
    var ids = data.items.map(function (v) { return v.id.videoId }).join(',')
    var statsData = await ytFetch('videos', { part: 'statistics', id: ids })
    var statsMap = {}
    if (statsData.items) {
      for (var i = 0; i < statsData.items.length; i++) {
        var s = statsData.items[i]
        statsMap[s.id] = s.statistics
      }
    }
    return data.items.map(function (v) {
      var st = statsMap[v.id.videoId] || {}
      return {
        id: v.id.videoId,
        title: v.snippet.title,
        thumb: v.snippet.thumbnails.high ? v.snippet.thumbnails.high.url : (v.snippet.thumbnails.medium ? v.snippet.thumbnails.medium.url : v.snippet.thumbnails.default.url),
        published: v.snippet.publishedAt,
        views: st.viewCount || '0',
        channelTitle: v.snippet.channelTitle
      }
    })
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

  function renderGrid(videos) {
    var grid = $('ytGrid'), loader = $('ytLoader'), error = $('ytError')
    if (!grid) return
    if (error) error.style.display = 'none'
    if (loader) loader.style.display = 'none'
    var html = ''
    for (var i = 0; i < videos.length; i++) {
      var v = videos[i]
      html += '<div class="yt-card" data-id="' + v.id + '" onclick="window.playYTVideo(\'' + v.id + '\',\'' + escAttr(v.title) + '\')">' +
        '<div class="yt-thumb-wrap"><img class="yt-thumb" src="' + escAttr(v.thumb) + '" loading="lazy" alt="' + escAttr(v.title) + '" /><div class="yt-thumb-overlay"><span class="yt-play-icon">▶</span></div></div>' +
        '<div class="yt-card-info"><div class="yt-card-title">' + esc(v.title) + '</div><div class="yt-card-meta">' + esc(v.channelTitle) + ' · ' + formatViews(v.views) + ' marotaba ko\'rilgan · ' + timeAgo(v.published) + '</div></div></div>'
    }
    grid.innerHTML = html
  }

  function showError(msg) {
    var loader = $('ytLoader'), grid = $('ytGrid'), error = $('ytError'), desc = $('ytErrorDesc')
    if (loader) loader.style.display = 'none'
    if (grid) grid.innerHTML = ''
    if (desc && msg) desc.textContent = msg
    if (error) error.style.display = 'block'
  }

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

  async function loadVideos() {
    try {
      var videos = await fetchVideos()
      cache.videos = videos
      renderGrid(videos)
    } catch (e) {
      console.error('YouTube load error:', e)
      showError(e.message || 'Keyinroq urinib ko\'ring.')
    }
  }

  var searchTimer = null
  function setupSearch() {
    var input = $('ytSearch')
    if (!input) return
    input.addEventListener('input', function () {
      if (searchTimer) clearTimeout(searchTimer)
      searchTimer = setTimeout(function () {
        var q = input.value.toLowerCase().trim()
        var cards = document.querySelectorAll('.yt-card')
        for (var i = 0; i < cards.length; i++) {
          cards[i].style.display = q === '' || cards[i].textContent.toLowerCase().indexOf(q) >= 0 ? '' : 'none'
        }
      }, 300)
    })
  }

  window.initYoutube = function () {
    loadVideos()
    setupSearch()
    var ov = $('ytPlayerOverlay')
    if (ov) ov.addEventListener('click', function (e) { if (e.target === ov) closePlayer() })
  }
})()
