(function () {
  'use strict'
  var TABS = ['home', 'chat', 'video', 'playme', 'ai', 'projects', 'contact', 'settings']
  var currentTab = 0, tabStack = [0]

  function navigateTo(idx, record) {
    if (idx < 0 || idx >= TABS.length || idx === currentTab) return
    currentTab = idx
    var tabs = document.querySelectorAll('.tab-content')
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('active', i === idx)
      tabs[i].setAttribute('aria-hidden', i !== idx ? 'true' : 'false')
    }
    var btns = document.querySelectorAll('.nav-btn, .bn-btn')
    for (var j = 0; j < btns.length; j++) {
      var a = btns[j].dataset.tab === TABS[idx]
      btns[j].classList.toggle('active', a)
      btns[j].setAttribute('aria-selected', String(a))
    }
    if (record) { tabStack.push(idx); history.pushState({ tab: idx }, '') }
    document.dispatchEvent(new CustomEvent('tabChange', { detail: { tab: TABS[idx], index: idx } }))
  }

  window.switchTab = function (name) {
    var idx = TABS.indexOf(name)
    if (idx >= 0) navigateTo(idx, true)
  }
  window.getCurrentTab = function () { return currentTab }

  function VideoController() {
    if (VideoController._instance) return VideoController._instance
    this.players = new Map()
    this.activeId = null
    this._pipSupported = 'pictureInPictureEnabled' in document
    VideoController._instance = this
  }
  VideoController.prototype = {
    register: function (id, el) { this.players.set(id, el) },
    unregister: function (id) { this.players.delete(id); if (this.activeId === id) this.activeId = null },
    play: function (id) {
      this.stopAllExcept(id)
      var p = this.players.get(id)
      if (p) { this.activeId = id; p.play().catch(function () {}) }
    },
    pause: function (id) {
      var p = this.players.get(id)
      if (p) p.pause()
      if (this.activeId === id) this.activeId = null
    },
    stopAll: function () { var s = this; s.players.forEach(function (p) { p.pause(); p.currentTime = 0 }); s.activeId = null },
    stopAllExcept: function (id) { var s = this; s.players.forEach(function (p, pid) { if (pid !== id) { p.pause(); p.currentTime = 0 } }) },
    getActive: function () { return this.activeId ? this.players.get(this.activeId) || null : null },
    async enterPip(id) {
      if (!this._pipSupported) return false
      var p = this.players.get(id || this.activeId || '')
      if (!p) return false
      try { await p.requestPictureInPicture(); return true } catch (e) { return false }
    },
    exitPip: function () { if (document.pictureInPictureElement) document.exitPictureInPicture().catch(function () {}) },
    isPipActive: function () { return !!document.pictureInPictureElement }
  }
  window.controller = new VideoController()

  window.initEngine = function () {
    var btns = document.querySelectorAll('.nav-btn, .bn-btn')
    for (var b = 0; b < btns.length; b++) {
      btns[b].addEventListener('click', function () { window.switchTab(this.dataset.tab || '') })
    }
    var ws = document.querySelector('.workspace')
    if (ws) {
      var sx = 0, dx = 0, dragging = false
      ws.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; dragging = true }, { passive: true })
      ws.addEventListener('touchmove', function (e) { if (dragging) dx = e.touches[0].clientX - sx }, { passive: true })
      ws.addEventListener('touchend', function () {
        if (!dragging) return; dragging = false
        if (Math.abs(dx) > 50) navigateTo(Math.max(0, Math.min(TABS.length - 1, currentTab + (dx < 0 ? 1 : -1))), true)
        dx = 0
      })
    }
    window.addEventListener('popstate', function (e) {
      if (e.state && e.state.tab !== undefined && e.state.tab !== currentTab) { navigateTo(e.state.tab, false); return }
      if (tabStack.length > 1) { tabStack.pop(); var p = tabStack[tabStack.length - 1]; history.replaceState({ tab: p }, ''); navigateTo(p, false) }
    })
    var hash = location.hash.replace('#', ''), start = (hash && TABS.indexOf(hash) >= 0) ? TABS.indexOf(hash) : 0
    currentTab = start; tabStack.length = 0; tabStack.push(start)
    history.replaceState({ tab: start }, '')
    var tabs = document.querySelectorAll('.tab-content')
    for (var i = 0; i < tabs.length; i++) { tabs[i].classList.toggle('active', i === start); tabs[i].setAttribute('aria-hidden', i !== start ? 'true' : 'false') }
    var nav = document.querySelectorAll('.nav-btn, .bn-btn')
    for (var n = 0; n < nav.length; n++) { var a = nav[n].dataset.tab === TABS[start]; nav[n].classList.toggle('active', a); nav[n].setAttribute('aria-selected', String(a)) }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        var a = window.controller.getActive()
        if (a && !a.paused && !window.controller.isPipActive()) window.controller.enterPip()
      }
    })
  }
})()
