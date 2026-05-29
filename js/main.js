(function () {
  'use strict'
  var MOTIVATION = [
    "Uyg'on, Xoleric...", "Tizim seni kutmoqda...", "Oq quyonni kuzatib bor.",
    "Sen dunyoni o'zgartirishing kerak!", "Vaqt tugadi. Uyg'on.",
    "Har bir kun yangi imkoniyat.", "Sen cheksiz imkoniyatlarga egasan.",
    "Muvaffaqiyat - bu odat.", "Kuch sening ichingda, Xoleric.",
    "Hech qachon kech emas.", "Bugun sen eng yaxshi versiyang bo'l.",
    "Har bir qiyinchilik yangi imkoniyatdir.", "Intizom - bu erkinlik.",
    "Harakat qil, xato qil, yana urinib ko'r.",
    "Eng katta xavf - hech qanday xavfni olmaslik.",
    "Vaqt keldi. Hozir. Aynan shu dam.", "Kodni o'zgartir, olamni o'zgartir.",
    "Chegaralar faqat boshingda.", "O'z taqdiringni o'zing yoz, Xoleric.",
    "Sen qul emassan, Xoleric.", "Tizim sening ichingda. Uyg'on.",
    "Erkin bo'lishni xohlaysanmi? Uyg'on.", "Bugun o'zgar. Ertaga kech bo'ladi.",
    "Uyg'on, Xoleric. Seni kutishayapti.", "Dunyoni o'zgartirishga tayyormisan?",
    "Hozirgi vaqt — eng yaxshi vaqt.", "Sen yetakchisan. Ergashma.",
    "Kodni buz. Dunyoni buz. Qayta yoz.", "Bir qadam. Faqat bir qadam. Bas."
  ]

  function initNotifications() {
    if (!('Notification' in window)) return
    function sendQuote() {
      if (Notification.permission !== 'granted') return
      if (localStorage.getItem('xolerc_notif') === 'off') return
      try { new Notification('XOLERIC ∞', { body: MOTIVATION[Math.floor(Math.random() * MOTIVATION.length)], icon: 'icon.png', vibrate: [200, 100, 200] }) } catch (e) {}
    }
    if (Notification.permission === 'granted') sendQuote()
    else if (Notification.permission !== 'denied') Notification.requestPermission().then(function (p) { if (p === 'granted') sendQuote() })
  }

  function initCanvas() {
    var canvas = document.getElementById('waveCanvas')
    if (!canvas) return
    var ctx = canvas.getContext('2d'), W, H, t = 0, animId = null, running = true, wasOnHome = true

    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)
    resize()

    function draw() {
      if (!running) { animId = null; return }
      ctx.clearRect(0, 0, W, H)
      var waves = [
        { a: 18, f: 0.007, s: 0.035, c: 'rgba(99,102,241,0.06)', oy: 0.3 },
        { a: 22, f: 0.011, s: 0.05, c: 'rgba(99,102,241,0.04)', oy: 0.44 },
        { a: 14, f: 0.005, s: 0.025, c: 'rgba(139,92,246,0.05)', oy: 0.54 },
        { a: 20, f: 0.009, s: 0.035, c: 'rgba(77,124,255,0.04)', oy: 0.37 }
      ]
      for (var w = 0; w < waves.length; w++) {
        var wave = waves[w]; ctx.beginPath(); ctx.moveTo(0, H)
        for (var x = 0; x <= W; x += 3) {
          var y = H * wave.oy + Math.sin(x * wave.f + t * wave.s) * wave.a + Math.sin(x * wave.f * 2.5 + t * wave.s * 1.4) * (wave.a * 0.35)
          ctx.lineTo(x, y)
        }
        ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = wave.c; ctx.fill()
      }
      t += 1; animId = requestAnimationFrame(draw)
    }

    function checkVisibility() {
      var onHome = window.getCurrentTab && window.getCurrentTab() === 0
      var shouldRun = !document.hidden && onHome
      if (shouldRun && !running) { running = true; if (!animId) animId = requestAnimationFrame(draw) }
      else if (!shouldRun && running) { running = false; if (animId) { cancelAnimationFrame(animId); animId = null } }
    }

    document.addEventListener('visibilitychange', checkVisibility)
    document.addEventListener('tabChange', checkVisibility)
    draw()
  }

  function initClock() {
    var months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
    var weekdays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
    var timeEl = document.getElementById('clockTime'), dateEl = document.getElementById('clockDate')
    var monthEl = document.getElementById('calMonth'), dayEl = document.getElementById('calDay')
    var weekdayEl = document.getElementById('calWeekday'), yearEl = document.getElementById('calYear'), calGrid = document.getElementById('calGrid')
    var canvasClock = document.getElementById('canvasClock'), canvasCtx = null
    if (canvasClock) { canvasCtx = canvasClock.getContext('2d'); canvasClock.width = 120; canvasClock.height = 120 }

    function drawCanvasClock(h, m, s) {
      if (!canvasCtx) return; var cx = 60, cy = 60, r = 50
      canvasCtx.clearRect(0, 0, 120, 120)
      var hue = (h * 30 + m * 0.5) % 360
      canvasCtx.save(); canvasCtx.translate(cx, cy)
      canvasCtx.beginPath(); canvasCtx.arc(0, 0, r, 0, Math.PI * 2)
      canvasCtx.fillStyle = 'rgba(255,255,255,0.02)'; canvasCtx.fill()
      canvasCtx.strokeStyle = 'rgba(77,124,255,0.08)'; canvasCtx.lineWidth = 0.5; canvasCtx.stroke()
      for (var i = 0; i < 12; i++) {
        var a = (i * Math.PI * 2) / 12 - Math.PI / 2, len = i % 3 === 0 ? 8 : 4
        canvasCtx.beginPath(); canvasCtx.moveTo(Math.cos(a) * (r - len), Math.sin(a) * (r - len)); canvasCtx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
        canvasCtx.strokeStyle = i % 3 === 0 ? 'rgba(77,124,255,0.3)' : 'rgba(255,255,255,0.08)'; canvasCtx.lineWidth = i % 3 === 0 ? 1.5 : 1; canvasCtx.stroke()
      }
      var hA = ((h % 12) * Math.PI * 2) / 12 + (m * Math.PI * 2) / 720 - Math.PI / 2
      var mA = (m * Math.PI * 2) / 60 - Math.PI / 2, sA = (s * Math.PI * 2) / 60 - Math.PI / 2
      canvasCtx.beginPath(); canvasCtx.moveTo(0, 0); canvasCtx.lineTo(Math.cos(hA) * (r * 0.55), Math.sin(hA) * (r * 0.55))
      canvasCtx.strokeStyle = 'hsla(' + hue + ', 70%, 60%, 0.8)'; canvasCtx.lineWidth = 3; canvasCtx.lineCap = 'round'; canvasCtx.stroke()
      canvasCtx.beginPath(); canvasCtx.moveTo(0, 0); canvasCtx.lineTo(Math.cos(mA) * (r * 0.7), Math.sin(mA) * (r * 0.7))
      canvasCtx.strokeStyle = 'hsla(' + hue + ', 60%, 65%, 0.6)'; canvasCtx.lineWidth = 2; canvasCtx.stroke()
      canvasCtx.beginPath(); canvasCtx.moveTo(0, 0); canvasCtx.lineTo(Math.cos(sA) * (r * 0.75), Math.sin(sA) * (r * 0.75))
      canvasCtx.strokeStyle = 'hsla(0, 0%, 100%, 0.15)'; canvasCtx.lineWidth = 1; canvasCtx.stroke()
      canvasCtx.beginPath(); canvasCtx.arc(0, 0, 2, 0, Math.PI * 2); canvasCtx.fillStyle = 'rgba(77,124,255,0.4)'; canvasCtx.fill()
      canvasCtx.restore()
    }

    function renderCalendarGrid(year, month) {
      if (!calGrid) return
      var fd = new Date(year, month, 1).getDay(), dim = new Date(year, month + 1, 0).getDate(), td = new Date(), html = ''
      for (var i = 0; i < fd; i++) html += '<span class="cal-other"></span>'
      for (var d = 1; d <= dim; d++) { var isT = d === td.getDate() && month === td.getMonth() && year === td.getFullYear(); html += '<span' + (isT ? ' class="cal-today"' : '') + '>' + d + '</span>' }
      calGrid.innerHTML = html
    }

    var lastMinute = -1
    function updateClock() {
      var d = new Date(), h = d.getHours(), m = d.getMinutes(), s = d.getSeconds()
      timeEl.textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0')
      if (dateEl) dateEl.textContent = d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' })
      if (monthEl) monthEl.textContent = months[d.getMonth()]
      if (dayEl) dayEl.textContent = String(d.getDate())
      if (weekdayEl) weekdayEl.textContent = weekdays[d.getDay()]
      if (yearEl) yearEl.textContent = String(d.getFullYear())
      if (canvasCtx) drawCanvasClock(h, m, s)
      if (m !== lastMinute) { lastMinute = m; renderCalendarGrid(d.getFullYear(), d.getMonth()) }
    }
    updateClock(); setInterval(updateClock, 1000)
  }

  function initQuotes() {
    var el = document.getElementById('quoteText')
    if (!el) return
    var i = Math.floor(Math.random() * MOTIVATION.length)
    el.textContent = MOTIVATION[i]
    setInterval(function () {
      i = (i + 1) % MOTIVATION.length; el.style.opacity = '0'
      setTimeout(function () { el.textContent = MOTIVATION[i]; el.style.opacity = '1' }, 400)
    }, 8000)
  }

  var themes = {
    google: {
      light: { bg: '#f8f9fa', bg2: '#ffffff', bg3: '#f0f1f3', surface: 'rgba(0,0,0,0.015)', surfaceActive: 'rgba(26,115,232,0.08)', line: 'rgba(0,0,0,0.06)', lineHover: 'rgba(0,0,0,0.12)', lineFocus: 'rgba(26,115,232,0.2)', text: '#1f1f1f', text2: '#5f6368', text3: 'rgba(0,0,0,0.2)', textInverse: '#ffffff', accent: '#1a73e8', accent2: '#4285f4', shadow: '0 4px 24px rgba(0,0,0,0.08)', shadowLg: '0 12px 48px rgba(0,0,0,0.12)', glow: '#1a73e8', blur: '16px', glassBg: 'linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4))', glassText: '#1f1f1f', glassBorder: 'rgba(0,0,0,0.04)', glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.5), transparent 85%)' },
      dark: { bg: '#121212', bg2: '#1e1e1e', bg3: '#282828', surface: 'rgba(255,255,255,0.03)', surfaceActive: 'rgba(168,199,250,0.08)', line: 'rgba(255,255,255,0.06)', lineHover: 'rgba(255,255,255,0.12)', lineFocus: 'rgba(168,199,250,0.2)', text: '#e3e3e3', text2: '#9e9e9e', text3: 'rgba(255,255,255,0.15)', textInverse: '#121212', accent: '#a8c7fa', accent2: '#8ab4f8', shadow: '0 4px 24px rgba(0,0,0,0.4)', shadowLg: '0 12px 48px rgba(0,0,0,0.6)', glow: '#a8c7fa', blur: '16px', glassBg: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))', glassText: 'rgba(255,255,255,0.7)', glassBorder: 'rgba(255,255,255,0.03)', glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.06), transparent 85%)' }
    },
    github: {
      light: { bg: '#f6f8fa', bg2: '#ffffff', bg3: '#eef1f5', surface: 'rgba(0,0,0,0.015)', surfaceActive: 'rgba(9,105,218,0.08)', line: '#d0d7de', lineHover: '#afb8c1', lineFocus: 'rgba(9,105,218,0.25)', text: '#24292f', text2: '#656d76', text3: 'rgba(0,0,0,0.18)', textInverse: '#ffffff', accent: '#0969da', accent2: '#218bff', shadow: '0 4px 24px rgba(0,0,0,0.06)', shadowLg: '0 12px 48px rgba(0,0,0,0.1)', glow: '#0969da', blur: '12px', glassBg: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.45))', glassText: '#24292f', glassBorder: '#d0d7de', glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.4), transparent 85%)' },
      dark: { bg: '#0d1117', bg2: '#161b22', bg3: '#1c2128', surface: 'rgba(255,255,255,0.02)', surfaceActive: 'rgba(88,166,255,0.08)', line: '#30363d', lineHover: '#484f58', lineFocus: 'rgba(88,166,255,0.3)', text: '#c9d1d9', text2: '#8b949e', text3: '#484f58', textInverse: '#0d1117', accent: '#58a6ff', accent2: '#79c0ff', shadow: '0 4px 24px rgba(0,0,0,0.5)', shadowLg: '0 12px 48px rgba(0,0,0,0.7)', glow: '#58a6ff', blur: '12px', glassBg: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', glassText: '#c9d1d9', glassBorder: '#30363d', glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.04), transparent 85%)' }
    },
    instagram: {
      light: { bg: '#ffffff', bg2: '#fafafa', bg3: '#f0f0f0', surface: 'rgba(0,0,0,0.01)', surfaceActive: 'rgba(0,149,246,0.08)', line: 'rgba(0,0,0,0.04)', lineHover: 'rgba(0,0,0,0.08)', lineFocus: 'rgba(0,149,246,0.2)', text: '#000000', text2: '#737373', text3: 'rgba(0,0,0,0.12)', textInverse: '#ffffff', accent: '#0095f6', accent2: '#38a1f3', shadow: '0 4px 24px rgba(0,0,0,0.06)', shadowLg: '0 12px 48px rgba(0,0,0,0.1)', glow: '#0095f6', blur: '10px', glassBg: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))', glassText: '#000000', glassBorder: 'rgba(0,0,0,0.04)', glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.5), transparent 85%)' },
      dark: { bg: '#000000', bg2: '#0a0a0a', bg3: '#121212', surface: 'rgba(255,255,255,0.02)', surfaceActive: 'rgba(0,149,246,0.08)', line: 'rgba(255,255,255,0.04)', lineHover: 'rgba(255,255,255,0.08)', lineFocus: 'rgba(0,149,246,0.2)', text: '#f5f5f5', text2: '#8e8e8e', text3: 'rgba(255,255,255,0.12)', textInverse: '#000000', accent: '#0095f6', accent2: '#38a1f3', shadow: '0 4px 24px rgba(0,0,0,0.6)', shadowLg: '0 12px 48px rgba(0,0,0,0.8)', glow: '#0095f6', blur: '10px', glassBg: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', glassText: 'rgba(255,255,255,0.7)', glassBorder: 'rgba(255,255,255,0.03)', glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.05), transparent 85%)' }
    },
    twitter: {
      light: { bg: '#ffffff', bg2: '#f7f9fa', bg3: '#eef1f3', surface: 'rgba(0,0,0,0.01)', surfaceActive: 'rgba(29,155,240,0.08)', line: 'rgba(0,0,0,0.06)', lineHover: 'rgba(0,0,0,0.12)', lineFocus: 'rgba(29,155,240,0.25)', text: '#0f1419', text2: '#536471', text3: 'rgba(0,0,0,0.18)', textInverse: '#ffffff', accent: '#1d9bf0', accent2: '#1a8cd8', shadow: '0 4px 24px rgba(0,0,0,0.06)', shadowLg: '0 12px 48px rgba(0,0,0,0.1)', glow: '#1d9bf0', blur: '14px', glassBg: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.4))', glassText: '#0f1419', glassBorder: 'rgba(0,0,0,0.04)', glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.4), transparent 85%)' },
      dark: { bg: '#15202b', bg2: '#1e2732', bg3: '#263340', surface: 'rgba(255,255,255,0.02)', surfaceActive: 'rgba(29,155,240,0.08)', line: '#38444d', lineHover: '#4c5a67', lineFocus: 'rgba(29,155,240,0.25)', text: '#f7f9f9', text2: '#8b98a5', text3: '#38444d', textInverse: '#15202b', accent: '#1d9bf0', accent2: '#1a8cd8', shadow: '0 4px 24px rgba(0,0,0,0.4)', shadowLg: '0 12px 48px rgba(0,0,0,0.6)', glow: '#1d9bf0', blur: '14px', glassBg: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', glassText: 'rgba(255,255,255,0.7)', glassBorder: '#38444d', glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.04), transparent 85%)' }
    },
    chatgpt: {
      light: { bg: '#ffffff', bg2: '#f9f9f9', bg3: '#f0f0f0', surface: 'rgba(0,0,0,0.01)', surfaceActive: 'rgba(16,163,127,0.08)', line: 'rgba(0,0,0,0.04)', lineHover: 'rgba(0,0,0,0.08)', lineFocus: 'rgba(16,163,127,0.2)', text: '#2f3f4f', text2: '#6b7b8b', text3: 'rgba(0,0,0,0.12)', textInverse: '#ffffff', accent: '#10a37f', accent2: '#19c37d', shadow: '0 4px 24px rgba(0,0,0,0.06)', shadowLg: '0 12px 48px rgba(0,0,0,0.1)', glow: '#10a37f', blur: '16px', glassBg: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.45))', glassText: '#2f3f4f', glassBorder: 'rgba(0,0,0,0.04)', glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.4), transparent 85%)' },
      dark: { bg: '#212121', bg2: '#2a2a2a', bg3: '#333333', surface: 'rgba(255,255,255,0.02)', surfaceActive: 'rgba(25,195,125,0.08)', line: 'rgba(255,255,255,0.04)', lineHover: 'rgba(255,255,255,0.08)', lineFocus: 'rgba(25,195,125,0.2)', text: '#ececf1', text2: '#8e8ea0', text3: 'rgba(255,255,255,0.12)', textInverse: '#212121', accent: '#19c37d', accent2: '#10a37f', shadow: '0 4px 24px rgba(0,0,0,0.4)', shadowLg: '0 12px 48px rgba(0,0,0,0.6)', glow: '#19c37d', blur: '16px', glassBg: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', glassText: 'rgba(255,255,255,0.7)', glassBorder: 'rgba(255,255,255,0.03)', glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.04), transparent 85%)' }
    },
    apple: {
      light: { bg: '#f5f5f7', bg2: '#ffffff', bg3: '#ebebed', surface: 'rgba(0,0,0,0.015)', surfaceActive: 'rgba(0,122,255,0.08)', line: 'rgba(0,0,0,0.04)', lineHover: 'rgba(0,0,0,0.08)', lineFocus: 'rgba(0,122,255,0.2)', text: '#1d1d1f', text2: '#86868b', text3: 'rgba(0,0,0,0.15)', textInverse: '#ffffff', accent: '#007aff', accent2: '#409cff', shadow: '0 4px 24px rgba(0,0,0,0.06)', shadowLg: '0 12px 48px rgba(0,0,0,0.1)', glow: '#007aff', blur: '24px', glassBg: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))', glassText: '#1d1d1f', glassBorder: 'rgba(0,0,0,0.04)', glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.5), transparent 85%)' },
      dark: { bg: '#000000', bg2: '#1c1c1e', bg3: '#2c2c2e', surface: 'rgba(255,255,255,0.03)', surfaceActive: 'rgba(10,132,255,0.08)', line: '#38383a', lineHover: '#48484a', lineFocus: 'rgba(10,132,255,0.2)', text: '#f5f5f7', text2: '#98989d', text3: '#48484a', textInverse: '#000000', accent: '#0a84ff', accent2: '#409cff', shadow: '0 4px 24px rgba(0,0,0,0.5)', shadowLg: '0 12px 48px rgba(0,0,0,0.7)', glow: '#0a84ff', blur: '24px', glassBg: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))', glassText: 'rgba(255,255,255,0.7)', glassBorder: 'rgba(255,255,255,0.06)', glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.08), transparent 85%)' }
    }
  }

  var themeKeys = ['--bg', '--bg1', '--bg2', '--bg3', '--surface', '--surface-hover', '--surface-active', '--surface-glass', '--line', '--line-hover', '--line-focus', '--text', '--text-secondary', '--text-muted', '--text-inverse', '--accent', '--accent2', '--accent-dim', '--accent-glow', '--shadow', '--shadow-lg', '--glow', '--blur', '--glass-bg', '--glass-text', '--glass-border', '--glass-shimmer']
  function setThemeVars(t) {
    var r = document.documentElement
    for (var k in themeKeys) r.style.removeProperty(themeKeys[k])
    r.style.setProperty('--bg', t.bg)
    r.style.setProperty('--bg1', t.bg)
    r.style.setProperty('--bg2', t.bg2)
    r.style.setProperty('--bg3', t.bg3)
    r.style.setProperty('--surface', t.surface)
    r.style.setProperty('--surface-hover', t.surfaceActive)
    r.style.setProperty('--surface-active', t.surfaceActive)
    r.style.setProperty('--surface-glass', t.surface)
    r.style.setProperty('--line', t.line)
    r.style.setProperty('--line-hover', t.lineHover)
    r.style.setProperty('--line-focus', t.lineFocus)
    r.style.setProperty('--text', t.text)
    r.style.setProperty('--text-secondary', t.text2)
    r.style.setProperty('--text-muted', t.text3)
    r.style.setProperty('--text-inverse', t.textInverse)
    r.style.setProperty('--accent', t.accent)
    r.style.setProperty('--accent2', t.accent2)
    r.style.setProperty('--accent-dim', t.accent + (t.accent.indexOf('#') === 0 ? '0f' : '0.06'))
    r.style.setProperty('--accent-glow', t.glow + (t.accent.indexOf('#') === 0 ? '1a' : '0.1'))
    r.style.setProperty('--shadow', t.shadow)
    r.style.setProperty('--shadow-lg', t.shadowLg)
    r.style.setProperty('--glow', t.glow)
    r.style.setProperty('--blur', t.blur)
    r.style.setProperty('--glass-bg', t.glassBg)
    r.style.setProperty('--glass-text', t.glassText)
    r.style.setProperty('--glass-border', t.glassBorder)
    r.style.setProperty('--glass-shimmer', t.glassShimmer)
    var meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', t.bg2)
  }
  function updateModeUI(m) {
    var mt = document.getElementById('modeToggle')
    if (mt) mt.classList.toggle('dark', m === 'dark')
    var q = document.getElementById('modeToggleQuick')
    if (q) q.innerHTML = '<span class="topbar-mode-icon">' + (m === 'dark' ? '🌙' : '☀️') + '</span>'
  }
  window.applyTheme = function (name) {
    if (!name) return
    var m = document.documentElement.getAttribute('data-mode') || localStorage.getItem('xolerc_mode') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    var t = themes[name]
    if (!t) { name = 'github'; t = themes.github }
    if (!t[m]) m = 'dark'
    setThemeVars(t[m])
    document.documentElement.setAttribute('data-mode', m)
    localStorage.setItem('xolerc_mode', m)
    localStorage.setItem('xolerc_theme', name)
    var btns = document.querySelectorAll('.theme-btn')
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.theme === name)
    updateModeUI(m)
    var r = document.documentElement
    r.classList.add('theme-transition')
    clearTimeout(r._themeTr)
    r._themeTr = setTimeout(function () { r.classList.remove('theme-transition') }, 300)
  }
  window.toggleMode = function () {
    var m = document.documentElement.getAttribute('data-mode') || 'dark'
    var n = m === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-mode', n)
    localStorage.setItem('xolerc_mode', n)
    var name = localStorage.getItem('xolerc_theme') || 'github'
    var t = themes[name]; if (!t) return
    setThemeVars(t[n])
    updateModeUI(n)
    var r = document.documentElement
    r.classList.add('theme-transition')
    clearTimeout(r._themeTr)
    r._themeTr = setTimeout(function () { r.classList.remove('theme-transition') }, 300)
  }

  function initTheme() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.theme-btn') : null
      if (!btn) return
      window.applyTheme(btn.dataset.theme)
    })
    var saved = localStorage.getItem('xolerc_theme')
    var mode = localStorage.getItem('xolerc_mode')
    if (!mode) mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    document.documentElement.setAttribute('data-mode', mode)
    localStorage.setItem('xolerc_mode', mode)
    saved = saved || 'github'
    var t = themes[saved]
    if (t && t[mode]) setThemeVars(t[mode])
    else { saved = 'github'; setThemeVars(themes.github[mode]) }
    localStorage.setItem('xolerc_theme', saved)
    var btns = document.querySelectorAll('.theme-btn')
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.theme === saved)
    updateModeUI(mode)
  }

  var LANG = {
    uz: { 'nav.home': 'Ish maydoni', 'nav.chat': 'Chat', 'nav.video': 'Video', 'nav.playme': 'Pleer', 'nav.ai': 'AI', 'nav.generator': 'Generator', 'nav.projects': 'Loyihalar', 'nav.settings': 'Sozlamalar', 'bn.home': 'Asosiy', 'bn.chat': 'Chat', 'bn.video': 'Video', 'bn.playme': 'Pleer', 'bn.ai': 'AI', 'bn.generator': 'Generator', 'bn.projects': 'Loyihalar', 'bn.settings': 'Sozlamalar', 'hero.badge': 'DASTURCHI • DIZAYNER • MUHANDIS', 'hero.desc': 'Frontend arxitektori. Tizimlar quruvchi. Interfeyslar yaratuvchi.', 'hero.projects': 'Loyihalar', 'hero.chat': 'Chat', 'hero.contact': 'Aloqa', 'hero.ai': 'AI', 'chat.title': 'Xabarlar', 'chat.online': 'online', 'chat.loading': 'Xabarlar yuklanmoqda...', 'playme.title': 'Pleer', 'playme.desc': 'Video darsliklar to\'plami', 'playme.list': 'Pleer ro\'yxati', 'projects.title': 'Loyihalar', 'projects.desc': 'GitHub\'dagi barcha ochiq manbali loyihalar', 'projects.search': 'Loyihalarni qidirish...', 'contact.title': 'Aloqa', 'contact.desc': 'Loyihalar va hamkorlik uchun', 'settings.title': 'Sozlamalar', 'settings.desc': 'Ilova sozlamalari va yuklamalar', 'settings.theme': 'Interfeys temasi', 'settings.theme.desc': 'Ilova ko\'rinishini o\'zingizga moslang', 'settings.notif': 'Bildirishnomalar', 'settings.notif_sound': 'Xabar ovozi', 'settings.dnd': 'Menga yozmaslik', 'settings.cache': 'Keshni tozalash', 'settings.cache.clear': 'Tozalash', 'settings.lang': 'Til', 'settings.export': "Ma'lumotlarni eksport qilish", 'loader.text': 'Tizim yuklanmoqda...', 'chat.empty': 'Xabarlar yo\'q', 'chat.input': 'Xabar yozing...', 'chat.main': 'Umumiy Chat', 'chat.main.sub': 'Barcha xabarlar' },
    en: { 'nav.home': 'Workspace', 'nav.chat': 'Chat', 'nav.video': 'Video', 'nav.playme': 'Player', 'nav.ai': 'AI', 'nav.generator': 'Generator', 'nav.projects': 'Projects', 'nav.settings': 'Settings', 'bn.home': 'Home', 'bn.chat': 'Chat', 'bn.video': 'Video', 'bn.playme': 'Player', 'bn.ai': 'AI', 'bn.generator': 'Generator', 'bn.projects': 'Projects', 'bn.settings': 'Settings', 'hero.badge': 'DEVELOPER • DESIGNER • ENGINEER', 'hero.desc': 'Frontend architect. System builder. Interface creator.', 'hero.projects': 'Projects', 'hero.chat': 'Chat', 'hero.contact': 'Contact', 'hero.ai': 'AI', 'chat.title': 'Messages', 'chat.online': 'online', 'chat.loading': 'Loading messages...', 'playme.title': 'Player', 'playme.desc': 'Video tutorial collection', 'playme.list': 'Playlist', 'projects.title': 'Projects', 'projects.desc': 'All open-source projects on GitHub', 'projects.search': 'Search projects...', 'contact.title': 'Contact', 'contact.desc': 'For projects and collaboration', 'settings.title': 'Settings', 'settings.desc': 'App settings and downloads', 'settings.theme': 'Theme', 'settings.theme.desc': 'Customize the app appearance', 'settings.notif': 'Notifications', 'settings.notif_sound': 'Message sound', 'settings.dnd': 'Do not disturb', 'settings.cache': 'Clear cache', 'settings.cache.clear': 'Clear', 'settings.lang': 'Language', 'settings.export': 'Export data', 'loader.text': 'Loading system...', 'chat.empty': 'No messages', 'chat.input': 'Write a message...', 'chat.main': 'General Chat', 'chat.main.sub': 'All messages' },
    ru: { 'nav.home': 'Рабочее место', 'nav.chat': 'Чат', 'nav.video': 'Видео', 'nav.playme': 'Плеер', 'nav.ai': 'AI', 'nav.generator': 'Генератор', 'nav.projects': 'Проекты', 'nav.settings': 'Настройки', 'bn.home': 'Главная', 'bn.chat': 'Чат', 'bn.video': 'Видео', 'bn.playme': 'Плеер', 'bn.ai': 'AI', 'bn.generator': 'Генератор', 'bn.projects': 'Проекты', 'bn.settings': 'Настройки', 'hero.badge': 'РАЗРАБОТЧИК • ДИЗАЙНЕР • ИНЖЕНЕР', 'hero.desc': 'Фронтенд-архитектор. Строитель систем. Создатель интерфейсов.', 'hero.projects': 'Проекты', 'hero.chat': 'Чат', 'hero.contact': 'Контакты', 'hero.ai': 'AI', 'chat.title': 'Сообщения', 'chat.online': 'онлайн', 'chat.loading': 'Загрузка сообщений...', 'playme.title': 'Плеер', 'playme.desc': 'Коллекция видеоуроков', 'playme.list': 'Плейлист', 'projects.title': 'Проекты', 'projects.desc': 'Все открытые проекты на GitHub', 'projects.search': 'Поиск проектов...', 'contact.title': 'Контакты', 'contact.desc': 'Для проектов и сотрудничества', 'settings.title': 'Настройки', 'settings.desc': 'Настройки приложения и загрузки', 'settings.theme': 'Тема', 'settings.theme.desc': 'Настройте внешний вид приложения', 'settings.notif': 'Уведомления', 'settings.notif_sound': 'Звук сообщения', 'settings.dnd': 'Не беспокоить', 'settings.cache': 'Очистить кеш', 'settings.cache.clear': 'Очистить', 'settings.lang': 'Язык', 'settings.export': 'Экспорт данных', 'loader.text': 'Загрузка системы...', 'chat.empty': 'Нет сообщений', 'chat.input': 'Напишите сообщение...', 'chat.main': 'Общий чат', 'chat.main.sub': 'Все сообщения' }
  }

  window.applyLanguage = function (lang) {
    var t = LANG[lang] || LANG.uz
    var els = document.querySelectorAll('[data-i18n]')
    for (var i = 0; i < els.length; i++) { var k = els[i].dataset.i18n; if (t[k]) els[i].textContent = t[k] }
    var phs = document.querySelectorAll('[data-i18n-placeholder]')
    for (var j = 0; j < phs.length; j++) { var pk = phs[j].dataset.i18nPlaceholder; if (t[pk]) phs[j].placeholder = t[pk] }
    localStorage.setItem('xolerc_lang', lang)
  }

  function initLang() { window.applyLanguage(localStorage.getItem('xolerc_lang') || 'uz') }

  function initSettings() {
    var nt = document.getElementById('notifToggle'), nst = document.getElementById('notifSoundToggle'), dt = document.getElementById('dndToggle'), cc = document.getElementById('clearCacheBtn'), ls = document.getElementById('langSelect')
    if (nt) {
      if (localStorage.getItem('xolerc_notif') === 'off') { var inp = nt.querySelector('input'); if (inp) inp.checked = false }
      nt.addEventListener('change', function () { var inp = this.querySelector('input'); localStorage.setItem('xolerc_notif', inp && inp.checked ? 'on' : 'off') })
    }
    if (nst) {
      if (localStorage.getItem('xolerc_notif_sound') === 'off') { var inp2 = nst.querySelector('input'); if (inp2) inp2.checked = false }
      nst.addEventListener('change', function () { var inp2 = this.querySelector('input'); var val = inp2 && inp2.checked ? 'on' : 'off'; localStorage.setItem('xolerc_notif_sound', val); if (window.setNotifSound) window.setNotifSound(val === 'on') })
    }
    if (dt) {
      if (localStorage.getItem('xolerc_dnd') === 'on') { var inp3 = dt.querySelector('input'); if (inp3) inp3.checked = true }
      dt.addEventListener('change', function () { var inp3 = this.querySelector('input'); localStorage.setItem('xolerc_dnd', inp3 && inp3.checked ? 'on' : 'off') })
    }
    if (cc) {
      var cacheSizeEl = document.getElementById('cacheSize')
      function updateCacheSize() {
        var total = 0; for (var k in localStorage) { try { var v = localStorage.getItem(k); if (v) total += v.length * 2 } catch (e) {} }
        if (cacheSizeEl) cacheSizeEl.textContent = total > 1048576 ? (total / 1048576).toFixed(1) + ' MB' : total > 1024 ? Math.round(total / 1024) + ' KB' : total + ' B'
      }
      updateCacheSize()
      cc.addEventListener('click', function () {
        var keys = Object.keys(localStorage); var xolercPrefix = 'xolerc_'
        for (var i = 0; i < keys.length; i++) { if (keys[i].indexOf(xolercPrefix) !== 0) localStorage.removeItem(keys[i]) }
        updateCacheSize()
      })
    }
    if (ls) {
      ls.value = localStorage.getItem('xolerc_lang') || 'uz'
      ls.addEventListener('change', function () { localStorage.setItem('xolerc_lang', this.value); window.applyLanguage(this.value) })
    }
    var exportBtn = document.getElementById('exportDataBtn')
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        var data = {
          exported: new Date().toISOString(),
          settings: {},
          playlist: null,
          videoHistory: null,
          chatHistory: null
        }
        data.settings.lang = localStorage.getItem('xolerc_lang') || 'uz'
        data.settings.theme = localStorage.getItem('xolerc_theme') || 'dark'
        data.settings.notif = localStorage.getItem('xolerc_notif') || 'on'
        data.settings.notifSound = localStorage.getItem('xolerc_notif_sound') || 'on'
        data.settings.dnd = localStorage.getItem('xolerc_dnd') || 'off'
        try { data.videoHistory = JSON.parse(localStorage.getItem('vp_hist') || '[]') } catch (e) {}
        try { data.playlist = JSON.parse(localStorage.getItem('xolerc_playlist')) } catch (e) {}
        try { data.chatHistory = JSON.parse(localStorage.getItem('xolerc_chat_hist') || '[]') } catch (e) {}
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        var url = URL.createObjectURL(blob)
        var a = document.createElement('a'); a.href = url; a.download = 'xoleric-export-' + new Date().toISOString().slice(0, 10) + '.json'; a.click()
        URL.revokeObjectURL(url)
        exportBtn.textContent = '✅ Yuklandi'
        setTimeout(function () { exportBtn.textContent = '📥 Yuklab olish' }, 2000)
      })
    }
  }

  function initCheatsheet() {
    var overlay = null
    function show() {
      if (overlay) { overlay.remove(); overlay = null; return }
      overlay = document.createElement('div')
      overlay.className = 'modal-overlay'
      overlay.style.cssText = 'display:flex;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:2000'
      overlay.innerHTML = '<div class="cheatsheet-modal" style="background:var(--bg1);border-radius:16px;padding:24px;width:90vw;max-width:450px;max-height:80vh;overflow-y:auto"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 style="margin:0;font-size:16px">⌨ Klaviatura yorliqlari</h3><button id="cheatsheetClose" style="border:none;background:var(--bg2);color:var(--text);width:28px;height:28px;border-radius:50%;cursor:pointer">✕</button></div><div class="cheatsheet-grid" style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px;font-size:13px">' +
        '<span class="cs-key">Space</span><span>Video: play/pause</span>' +
        '<span class="cs-key">← →</span><span>Video: oldingi/keyingi</span>' +
        '<span class="cs-key">Esc</span><span>Video yopish / modal yopish</span>' +
        '<span class="cs-key">M</span><span>Video: ovoz o\'chirish</span>' +
        '<span class="cs-key">F</span><span>Video: fullscreen</span>' +
        '<span class="cs-key">Enter</span><span>Chat: xabar yuborish</span>' +
        '<span class="cs-key">/</span><span>Chat: qidirish</span>' +
        '<span class="cs-key">?</span><span>Ushbu yorliqlarni ko\'rsatish</span>' +
        '</div></div>'
      document.body.appendChild(overlay)
      overlay.addEventListener('click', function (e) { if (e.target === overlay) { overlay.remove(); overlay = null } })
      document.getElementById('cheatsheetClose').addEventListener('click', function () { overlay.remove(); overlay = null })
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === '?' && !e.target.closest('input,textarea')) { e.preventDefault(); show() }
    })
  }

  window.initLoadingOverlay = function () {
    var o = document.getElementById('loadingOverlay')
    if (!o) return
    var start = Date.now()
    function hide() {
      var elapsed = Date.now() - start
      var delay = elapsed < 2000 ? 2000 - elapsed : 0
      setTimeout(function () {
        o.classList.add('fade-out')
        setTimeout(function () { o.style.display = 'none' }, 500)
      }, delay)
    }
    if (document.readyState === 'complete') hide()
    else window.addEventListener('load', hide)
  }
  function initGenerator() {
    var gen = window.XOLERIC_GEN
    if (!gen) return
    var canvas = document.getElementById('genCanvas'), typeBar = document.getElementById('genTypeBar')
    var paramsEl = document.getElementById('genParams'), generateBtn = document.getElementById('genGenerateBtn')
    var animateBtn = document.getElementById('genAnimateBtn'), saveBtn = document.getElementById('genSaveBtn')
    var exportBtn = document.getElementById('genExportBtn'), filterBtn = document.getElementById('genFilterBtn')
    var filterWrap = document.getElementById('genFilterWrap'), filterSelect = document.getElementById('genFilterSelect')
    var filterIntensity = document.getElementById('genFilterIntensity'), filterApply = document.getElementById('genFilterApply')
    var galleryGrid = document.getElementById('genGalleryGrid'), galleryClear = document.getElementById('genGalleryClear')
    if (!canvas) return

    var currentType = localStorage.getItem('xolerc_gen_type') || 'galaxy'
    var currentParams = {}
    var isAnimating = false
    var filterApplied = null

    function renderTypeBar() {
      var names = gen.list()
      typeBar.innerHTML = ''
      for (var i = 0; i < names.length; i++) {
        var info = gen.getInfo(names[i])
        var btn = document.createElement('button')
        btn.className = 'gen-type-btn' + (names[i] === currentType ? ' active' : '')
        btn.innerHTML = (info.icon || '') + ' ' + info.name
        btn.dataset.type = names[i]
        btn.addEventListener('click', function (type) { return function () { selectType(type) } }(names[i]))
        typeBar.appendChild(btn)
      }
    }

    function selectType(type) {
      if (isAnimating) { gen.stopAnimation('main'); isAnimating = false; animateBtn.textContent = '▶ Animatsiya' }
      currentType = type
      localStorage.setItem('xolerc_gen_type', type)
      renderTypeBar()
      currentParams = gen.getDefaultParams(type)
      renderParams()
      generate()
    }

    function renderParams() {
      var info = gen.getInfo(currentType)
      if (!info || !info.params) { paramsEl.innerHTML = ''; return }
      paramsEl.innerHTML = ''
      for (var i = 0; i < info.params.length; i++) {
        var p = info.params[i]
        if (p.type === 'bool') {
          var label = document.createElement('label')
          label.className = 'gen-param'
          var cb = document.createElement('input')
          cb.type = 'checkbox'; cb.checked = currentParams[p.key]
          cb.addEventListener('change', function (k) { return function () { currentParams[k] = cb.checked; generate() } }(p.key))
          label.appendChild(cb)
          label.appendChild(document.createTextNode(p.label))
          paramsEl.appendChild(label)
        } else {
          var wrapper = document.createElement('span')
          wrapper.className = 'gen-param'
          var lbl = document.createElement('label')
          lbl.textContent = p.label + ': ' + currentParams[p.key]
          var inp = document.createElement('input')
          inp.type = 'range'; inp.className = 'gen-range'
          inp.min = p.min; inp.max = p.max; inp.step = p.step; inp.value = currentParams[p.key]
          inp.addEventListener('input', function (k, l) { return function () { currentParams[k] = parseFloat(inp.value); l.textContent = p.label + ': ' + currentParams[k]; generate() } }(p.key, lbl))
          wrapper.appendChild(lbl)
          wrapper.appendChild(inp)
          paramsEl.appendChild(wrapper)
        }
      }
    }

    function generate() {
      if (isAnimating) { gen.stopAnimation('main'); isAnimating = false; animateBtn.textContent = '▶ Animatsiya' }
      filterApplied = null
      filterSelect.value = 'none'
      canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1)
      canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1)
      gen.generate(currentType, canvas, currentParams)
    }

    function toggleAnimate() {
      if (isAnimating) {
        gen.stopAnimation('main'); isAnimating = false
        animateBtn.textContent = '▶ Animatsiya'
      } else {
        var info = gen.getInfo(currentType)
        if (!info.animate) return
        isAnimating = true
        animateBtn.textContent = '⏹ To\'xtat'
        canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1)
        canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1)
        gen.startAnimation(currentType, canvas, currentParams, 'main')
      }
    }

    function saveImage() {
      gen.saveToGallery(canvas)
      renderGallery()
    }

    function exportImage() { gen.exportPNG(canvas) }

    function applyFilter() {
      var name = filterSelect.value
      if (name === 'none') { filterApplied = null; generate(); return }
      var intensity = parseFloat(filterIntensity.value)
      gen.filters.apply(canvas.getContext('2d'), canvas.width, canvas.height, name, intensity)
      filterApplied = name
    }

    function renderGallery() {
      var items = gen.getGallery()
      if (items.length === 0) { galleryGrid.innerHTML = '<div class="gen-gallery-empty">Hali rasm yo\'q</div>'; return }
      galleryGrid.innerHTML = ''
      for (var i = 0; i < items.length; i++) {
        (function (idx) {
          var div = document.createElement('div')
          div.className = 'gen-gallery-item'
          var img = document.createElement('img')
          img.src = items[idx].data
          img.alt = 'Generated ' + idx
          div.appendChild(img)
          var del = document.createElement('button')
          del.className = 'gen-gallery-del'
          del.textContent = '✕'
          del.addEventListener('click', function (e) { e.stopPropagation(); var g = gen.getGallery(); g.splice(idx, 1); localStorage.setItem('xolerc_gallery', JSON.stringify(g)); renderGallery() })
          div.appendChild(del)
          div.addEventListener('click', function () { gen.exportPNG(canvas) })
          galleryGrid.appendChild(div)
        })(i)
      }
    }

    // Events
    generateBtn.addEventListener('click', function () { currentParams.seed = Math.random() * 1000; generate() })
    animateBtn.addEventListener('click', toggleAnimate)
    saveBtn.addEventListener('click', saveImage)
    exportBtn.addEventListener('click', exportImage)
    filterBtn.addEventListener('click', function () { filterWrap.style.display = filterWrap.style.display === 'none' ? 'flex' : 'none' })
    filterApply.addEventListener('click', applyFilter)
    galleryClear.addEventListener('click', function () { gen.clearGallery(); renderGallery() })

    // Size observer
    var ro = new ResizeObserver(function () { if (!isAnimating) { canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1); canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1); generate() } })
    ro.observe(canvas)

    // Tab change listener
    document.addEventListener('tabChange', function () {
      var cur = window.getCurrentTab && window.getCurrentTab()
      if (cur === 5) { renderGallery(); generate() }
    })

    renderTypeBar()
    currentParams = gen.getDefaultParams(currentType)
    renderParams()
    setTimeout(function () { canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1); canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1); generate() }, 100)
    renderGallery()
  }
  window.closeModal = function (id) { var m = document.getElementById(id); if (m) { m.classList.remove('open'); m.style.display = 'none' } }
  window.updateOnlineBadge = function (count) { var el = document.getElementById('onlineCount'); if (el) { var t = LANG[localStorage.getItem('xolerc_lang') || 'uz']; el.textContent = count + ' ' + (t['chat.online'] || 'online') } }

  document.addEventListener('DOMContentLoaded', function () {
    var inits = [
      { fn: initEngine, name: 'Engine' }, { fn: initMusic, name: 'Music' },
      { fn: initChat, name: 'Chat' }, { fn: initYoutube, name: 'Youtube' }, { fn: initPlayme, name: 'Playme' },
      { fn: initRepos, name: 'Repos' }, { fn: initNotifications, name: 'Notifications' },
      { fn: initLoadingOverlay, name: 'Loading' }, { fn: initCanvas, name: 'Canvas' },
      { fn: initClock, name: 'Clock' }, { fn: initQuotes, name: 'Quotes' },
      { fn: initTheme, name: 'Theme' }, { fn: initLang, name: 'Lang' },
      { fn: initGenerator, name: 'Generator' },
      { fn: initAI, name: 'AI' },
      { fn: initSettings, name: 'Settings' },
      { fn: initCheatsheet, name: 'Cheatsheet' }
    ]
    for (var i = 0; i < inits.length; i++) { try { inits[i].fn() } catch (e) { console.error(inits[i].name + ' init error:', e) } }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var modals = document.querySelectorAll('.modal-overlay.open'); for (var m = 0; m < modals.length; m++) { modals[m].classList.remove('open'); setTimeout(function (mm) { return function () { mm.style.display = 'none' } }(modals[m]), 250) }
        var reactions = document.querySelectorAll('.msg-reactions'); for (var r = 0; r < reactions.length; r++) reactions[r].style.display = 'none'
        var iv = document.getElementById('imgViewer'); if (iv && iv.classList.contains('open')) { iv.classList.remove('open'); iv.style.display = 'none' }
        var pp = document.getElementById('userProfilePopup'); if (pp && pp.classList.contains('open')) { pp.classList.remove('open'); pp.style.display = 'none' }
      }
    })
    DB.incrementVisits()
  })
})()
