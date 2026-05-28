(function () {
  'use strict'
  var V_PATH = 'https://xolerc.github.io/me/videos'
  var VIDEOS = [
    { file: V_PATH + '/2_5211184992486459614.mp4', title: 'Video 1' },
    { file: V_PATH + '/2_5235775282278869717.mp4', title: 'Video 2' },
    { file: V_PATH + '/2_5237973231792597901.mp4', title: 'Video 3' },
    { file: V_PATH + '/2_5282749129141818157.mp4', title: 'Video 4' },
    { file: V_PATH + '/2_5287781263149656497.mp4', title: 'Video 5' },
    { file: V_PATH + '/2_5373350012551988338.mp4', title: 'Video 6' },
    { file: V_PATH + '/2_5447322629427989855.mp4', title: 'Video 7' },
    { file: V_PATH + '/2_5452074624193953955.mp4', title: 'Video 8' },
    { file: V_PATH + '/2_5458622658318987050.mp4', title: 'Video 9' },
    { file: V_PATH + '/2_5458751034891467046.mp4', title: 'Video 10' },
    { file: V_PATH + '/2_5458751034891467056.mp4', title: 'Video 11' },
    { file: V_PATH + '/2_5462948497839910298.mp4', title: 'Video 12' }
  ]
  var VID = 'playme-main'
  var STORAGE_KEY = 'xolerc_playlist'

  function fmt(s) { if (!s || !isFinite(s)) return '0:00'; var m = Math.floor(s / 60), sec = Math.floor(s % 60); return m + ':' + (sec < 10 ? '0' : '') + sec }

  function savePlaylist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(VIDEOS)) } catch (e) {}
  }

  function loadPlaylist() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY)
      if (raw) { var parsed = JSON.parse(raw); if (Array.isArray(parsed) && parsed.length) { VIDEOS.length = 0; parsed.forEach(function (v) { VIDEOS.push(v) }); return true } }
    } catch (e) {}
    return false
  }

  window.initPlayme = function () {
    var video = document.getElementById('playmeVideo')
    var list = document.getElementById('playmeList')
    var titleEl = document.getElementById('playmeVideoTitle')
    var playBtn = document.getElementById('playmePlayBtn')
    var prevBtn = document.getElementById('playmePrevBtn')
    var nextBtn = document.getElementById('playmeNextBtn')
    var fullBtn = document.getElementById('playmeFullBtn')
    var pipBtn = document.getElementById('playmePipBtn')
    var currentEl = document.getElementById('playmeCurrent')
    var durEl = document.getElementById('playmeDuration')
    var progressFill = document.getElementById('playmeProgressFill')
    var progressThumb = document.getElementById('playmeProgressThumb')
    var progressWrap = document.getElementById('playmeProgress')
    var volumeEl = document.getElementById('playmeVolume')
    var volumeIcon = document.getElementById('playmeVolumeIcon')
    var loader = document.getElementById('playmeLoader')
    var controls = document.getElementById('playmeControls')
    var wrap = document.getElementById('playmeWrap')
    var saveBtn = document.getElementById('playmeSaveBtn')
    var loadBtn = document.getElementById('playmeLoadBtn')
    var subBtn = document.getElementById('playmeSubBtn')
    var subInput = document.getElementById('playmeSubInput')
    var subLabel = document.getElementById('playmeSubLabel')
    if (!video) return

    window.controller.register(VID, video)
    loadPlaylist()
    var ci = 0, pd = false, ct = null, durs = {}, preloaded = false, dragIdx = null

    function showCtrl() {
      controls.classList.add('visible')
      if (ct) clearTimeout(ct)
      ct = setTimeout(function () { if (!video.paused) controls.classList.remove('visible') }, 3000)
    }
    video.addEventListener('mousemove', showCtrl)
    video.addEventListener('touchstart', showCtrl)
    controls.addEventListener('mouseenter', function () { if (ct) clearTimeout(ct); controls.classList.add('visible') })
    controls.addEventListener('mouseleave', showCtrl)

    function playVideo(i) {
      if (i < 0 || i >= VIDEOS.length) return
      ci = i
      var v = VIDEOS[i]
      if (video.src !== v.file) { video.src = v.file; loader.classList.remove('hidden') }
      window.controller.play(VID)
      titleEl.textContent = v.title
      wrap.classList.remove('playing')
      preloaded = false
      renderList()
    }

    function getDur(i) { return durs[i] !== undefined ? fmt(durs[i]) : '' }

    function renderList() {
      list.innerHTML = VIDEOS.map(function (v, i) {
        return '<div class="playme-item' + (i === ci ? ' active' : '') + '" data-index="' + i + '" draggable="true">' +
          '<div class="playme-item-drag" data-index="' + i + '">⠿</div>' +
          '<div class="playme-item-thumb"><span class="playme-item-num">' + String(i + 1).padStart(2, '0') + '</span></div>' +
          '<div class="playme-item-body"><span class="playme-item-title">' + v.title + '</span>' +
          (getDur(i) ? '<div class="playme-item-duration">' + getDur(i) + '</div>' : '') + '</div></div>'
      }).join('')
      list.querySelectorAll('.playme-item').forEach(function (el) {
        el.addEventListener('click', function (e) { if (e.target.closest('.playme-item-drag')) return; playVideo(parseInt(el.dataset.index, 10)) })
      })
      var act = list.querySelector('.playme-item.active')
      if (act) act.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      initDragDrop()
    }

    /* Drag‑drop reorder */
    function initDragDrop() {
      var items = list.querySelectorAll('.playme-item')
      items.forEach(function (item) {
        item.addEventListener('dragstart', function (e) {
          dragIdx = parseInt(item.dataset.index, 10)
          item.classList.add('dragging')
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/plain', dragIdx)
        })
        item.addEventListener('dragend', function () { item.classList.remove('dragging'); dragIdx = null })
        item.addEventListener('dragover', function (e) {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          var overIdx = parseInt(item.dataset.index, 10)
          if (overIdx === dragIdx) return
          var rect = item.getBoundingClientRect()
          var after = e.clientY > rect.top + rect.height / 2
          item.style.borderTop = !after ? '2px solid var(--accent)' : ''
          item.style.borderBottom = after ? '2px solid var(--accent)' : ''
        })
        item.addEventListener('dragleave', function () { item.style.borderTop = ''; item.style.borderBottom = '' })
        item.addEventListener('drop', function (e) {
          e.preventDefault()
          item.style.borderTop = ''; item.style.borderBottom = ''
          var from = dragIdx; var to = parseInt(item.dataset.index, 10)
          if (from === null || from === to) return
          var moved = VIDEOS.splice(from, 1)[0]
          VIDEOS.splice(to, 0, moved)
          if (ci === from) ci = to
          else if (ci > from && ci <= to) ci--
          else if (ci < from && ci >= to) ci++
          savePlaylist()
          renderList()
        })
      })
    }

    playBtn.addEventListener('click', function () { if (video.paused) window.controller.play(VID); else window.controller.pause(VID) })
    prevBtn.addEventListener('click', function () { if (video.currentTime > 3) { video.currentTime = 0; return } playVideo(ci - 1 >= 0 ? ci - 1 : VIDEOS.length - 1) })
    nextBtn.addEventListener('click', function () { playVideo((ci + 1) % VIDEOS.length) })
    fullBtn.addEventListener('click', function () { if (document.fullscreenElement) document.exitFullscreen(); else video.requestFullscreen() })
    if (pipBtn) pipBtn.addEventListener('click', function () { if (window.controller.isPipActive()) window.controller.exitPip(); else window.controller.enterPip(VID) })

    video.addEventListener('play', function () { playBtn.classList.add('playing'); wrap.classList.add('playing'); showCtrl(); preloadNext() })
    video.addEventListener('pause', function () { playBtn.classList.remove('playing'); wrap.classList.remove('playing'); controls.classList.add('visible') })
    video.addEventListener('ended', function () { wrap.classList.remove('playing'); playVideo((ci + 1) % VIDEOS.length) })
    video.addEventListener('timeupdate', function () {
      currentEl.textContent = fmt(video.currentTime)
      durEl.textContent = fmt(video.duration)
      var pct = video.duration ? (video.currentTime / video.duration * 100) : 0
      progressFill.style.width = pct + '%'
      if (progressThumb) progressThumb.style.left = pct + '%'
    })
    video.addEventListener('loadedmetadata', function () {
      durEl.textContent = fmt(video.duration); loader.classList.add('hidden')
      if (durs[ci] === undefined) { durs[ci] = video.duration; renderList() }
    })
    video.addEventListener('canplay', function () { loader.classList.add('hidden') })
    video.addEventListener('error', function () {
      loader.classList.add('hidden')
      if (video.error && (video.error.code === 3 || video.error.code === 4)) {
        controls.classList.add('visible')
        titleEl.textContent = 'Bu videoni qurilmangiz qo\'llab-quvvatlamaydi'
      }
    })

    progressWrap.addEventListener('mousedown', function (e) { pd = true; seek(e) })
    document.addEventListener('mousemove', function (e) { if (pd) seek(e) })
    document.addEventListener('mouseup', function () { pd = false })
    progressWrap.addEventListener('touchstart', function (e) { pd = true; seek(e.touches[0]) })
    document.addEventListener('touchmove', function (e) { if (pd) seek(e.touches[0]) })
    document.addEventListener('touchend', function () { pd = false })

    function seek(e) {
      var rect = progressWrap.getBoundingClientRect()
      var pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      if (video.duration) video.currentTime = pct * video.duration
    }

    volumeEl.addEventListener('input', function () { video.volume = parseFloat(volumeEl.value); volumeIcon.classList.toggle('muted', video.volume === 0) })
    volumeIcon.addEventListener('click', function () {
      if (video.volume > 0) { video.dataset.prevVolume = String(video.volume); video.volume = 0; volumeEl.value = '0' }
      else { var pv = parseFloat(video.dataset.prevVolume || '0.8'); video.volume = pv; volumeEl.value = String(pv) }
      volumeIcon.classList.toggle('muted', video.volume === 0)
    })

    function preloadNext() {
      if (preloaded) return; preloaded = true
      var ni = (ci + 1) % VIDEOS.length
      if (ni === ci) return
      var l = document.createElement('link'); l.rel = 'preload'; l.as = 'video'; l.href = VIDEOS[ni].file; document.head.appendChild(l)
    }

    /* Save/Load playlist */
    if (saveBtn) saveBtn.addEventListener('click', function () { savePlaylist(); saveBtn.textContent = '✅'; setTimeout(function () { saveBtn.textContent = '💾' }, 1500) })
    if (loadBtn) loadBtn.addEventListener('click', function () {
      if (loadPlaylist()) { ci = 0; renderList(); playVideo(0); loadBtn.textContent = '✅'; setTimeout(function () { loadBtn.textContent = '📂' }, 1500) }
      else { loadBtn.textContent = '❌'; setTimeout(function () { loadBtn.textContent = '📂' }, 1500) }
    })

    /* Subtitle support */
    if (subBtn && subInput) {
      subBtn.addEventListener('click', function () { subInput.click() })
      subInput.addEventListener('change', function () {
        var file = subInput.files[0]
        if (!file) return
        var reader = new FileReader()
        reader.onload = function (e) {
          var content = e.target.result
          var oldTrack = video.querySelector('track')
          if (oldTrack) oldTrack.remove()
          /* SRT → VTT conversion */
          if (file.name.endsWith('.srt')) { content = 'WEBVTT\n\n' + content.replace(/\r\n/g, '\n').replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, '$1:$2:$3.$4') }
          var blob = new Blob([content], { type: 'text/vtt' })
          var track = document.createElement('track')
          track.kind = 'subtitles'
          track.label = 'Subtitr'
          track.srclang = 'uz'
          track.src = URL.createObjectURL(blob)
          track.default = true
          video.appendChild(track)
          subBtn.textContent = '✅'
          setTimeout(function () { subBtn.textContent = '📄' }, 1500)
        }
        reader.readAsText(file)
      })
    }

    /* Load metadata for all videos */
    ;(function preloadFirstMeta() {
      var tmp = document.createElement('video'); tmp.preload = 'metadata'; tmp.src = VIDEOS[0].file
      tmp.addEventListener('loadedmetadata', function () { durs[0] = tmp.duration; renderList(); tmp.remove() })
      tmp.addEventListener('error', function () { tmp.remove() })
    })()

    renderList()
    /* Show controls so user can tap play */
    controls.classList.add('visible')
    /* Don't autoplay on init - browser blocks it */
    var first = VIDEOS[0]
    if (first) { video.src = first.file; titleEl.textContent = first.title }
    /* Click to start */
    wrap.addEventListener('click', function startOnce(e) {
      if (e.target.closest('.playme-controls, .playme-item, .playme-tool-btn')) return
      if (video.paused && video.currentTime === 0) { playVideo(0); controls.classList.remove('visible') }
    }, { once: true })
  }
})()
