(function () {
  'use strict'
  var TABS = ['home', 'chat', 'playme', 'projects', 'contact', 'settings']
  var currentTab = 0
  var tabStack = [0]

  function navigateTo(idx, record) {
    if (idx < 0 || idx >= TABS.length || idx === currentTab) return
    currentTab = idx
    document.querySelectorAll('.tab-content').forEach(function (el, i) {
      el.classList.toggle('active', i === idx)
      el.setAttribute('aria-hidden', i !== idx ? 'true' : 'false')
    })
    document.querySelectorAll('.nav-btn, .bn-btn').forEach(function (b) {
      var a = b.dataset.tab === TABS[idx]
      b.classList.toggle('active', a)
      b.setAttribute('aria-selected', String(a))
    })
    if (record) { tabStack.push(idx); history.pushState({ tab: idx }, '') }
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
      if (p) { this.activeId = id; p.play().catch(function () { }) }
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
    exitPip: function () { if (document.pictureInPictureElement) document.exitPictureInPicture().catch(function () { }) },
    isPipActive: function () { return !!document.pictureInPictureElement }
  }
  window.controller = new VideoController()

  window.initEngine = function () {
    document.querySelectorAll('.nav-btn, .bn-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { window.switchTab(btn.dataset.tab || '') })
    })
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
    var hash = location.hash.replace('#', '')
    var start = (hash && TABS.indexOf(hash) >= 0) ? TABS.indexOf(hash) : 0
    currentTab = start; tabStack.length = 0; tabStack.push(start)
    history.replaceState({ tab: start }, '')
    document.querySelectorAll('.tab-content').forEach(function (el, i) {
      el.classList.toggle('active', i === start); el.setAttribute('aria-hidden', i !== start ? 'true' : 'false')
    })
    document.querySelectorAll('.nav-btn, .bn-btn').forEach(function (b) {
      var a = b.dataset.tab === TABS[start]; b.classList.toggle('active', a); b.setAttribute('aria-selected', String(a))
    })
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        var a = window.controller.getActive()
        if (a && !a.paused && !window.controller.isPipActive()) window.controller.enterPip()
      }
    })
  }
})()
