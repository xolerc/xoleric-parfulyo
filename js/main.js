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
    midnight: {
      bg: '#05080f', bg2: '#0a0e1a', bg3: '#070c1a',
      surface: 'rgba(255,255,255,0.02)', surfaceActive: 'rgba(77,124,255,0.06)',
      line: 'rgba(255,255,255,0.04)', lineHover: 'rgba(255,255,255,0.08)', lineFocus: 'rgba(77,124,255,0.15)',
      text: 'rgba(255,255,255,0.88)', text2: 'rgba(255,255,255,0.45)', text3: 'rgba(255,255,255,0.2)', textInverse: '#0a0e1a',
      accent: '#4d7cff', accent2: '#6366f1',
      shadow: '0 4px 24px rgba(0,0,0,0.3)', shadowLg: '0 12px 48px rgba(0,0,0,0.5)',
      glow: '#4d7cff', blur: '12px',
      glassBg: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))',
      glassText: 'rgba(255,255,255,0.7)', glassBorder: 'rgba(255,255,255,0.04)',
      glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.07), transparent 85%)'
    },
    pearl: {
      bg: '#f8f6f2', bg2: '#fff', bg3: '#fcfaf7',
      surface: 'rgba(0,0,0,0.02)', surfaceActive: 'rgba(99,102,241,0.08)',
      line: 'rgba(0,0,0,0.06)', lineHover: 'rgba(0,0,0,0.12)', lineFocus: 'rgba(99,102,241,0.2)',
      text: '#1a1a1a', text2: '#666', text3: 'rgba(0,0,0,0.25)', textInverse: '#fff',
      accent: '#6366f1', accent2: '#818cf8',
      shadow: '0 4px 24px rgba(0,0,0,0.06)', shadowLg: '0 12px 48px rgba(0,0,0,0.1)',
      glow: '#6366f1', blur: '16px',
      glassBg: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))',
      glassText: '#333', glassBorder: 'rgba(0,0,0,0.06)',
      glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.4), transparent 85%)'
    },
    matrix: {
      bg: '#000c00', bg2: '#000a00', bg3: '#001000',
      surface: 'rgba(0,255,65,0.02)', surfaceActive: 'rgba(0,255,65,0.06)',
      line: 'rgba(0,255,65,0.06)', lineHover: 'rgba(0,255,65,0.12)', lineFocus: 'rgba(0,255,65,0.2)',
      text: '#00ff41', text2: '#00aa2a', text3: 'rgba(0,255,65,0.15)', textInverse: '#000',
      accent: '#00ff41', accent2: '#00cc33',
      shadow: '0 4px 24px rgba(0,0,0,0.6)', shadowLg: '0 12px 48px rgba(0,0,0,0.8)',
      glow: '#00ff41', blur: '8px',
      glassBg: 'linear-gradient(180deg, rgba(0,255,65,0.06), rgba(0,255,65,0.01))',
      glassText: 'rgba(0,255,65,0.7)', glassBorder: 'rgba(0,255,65,0.04)',
      glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(0,255,65,0.07), transparent 85%)'
    },
    aurora: {
      bg: '#0a0514', bg2: '#0f081a', bg3: '#140a1e',
      surface: 'rgba(121,40,202,0.03)', surfaceActive: 'rgba(0,212,170,0.06)',
      line: 'rgba(121,40,202,0.06)', lineHover: 'rgba(0,212,170,0.1)', lineFocus: 'rgba(0,212,170,0.18)',
      text: '#e8e0f0', text2: '#a088c0', text3: 'rgba(160,136,192,0.2)', textInverse: '#0a0514',
      accent: '#00d4aa', accent2: '#7928ca',
      shadow: '0 4px 24px rgba(0,0,0,0.5)', shadowLg: '0 12px 48px rgba(0,0,0,0.7)',
      glow: '#00d4aa', blur: '14px',
      glassBg: 'linear-gradient(180deg, rgba(121,40,202,0.06), rgba(0,212,170,0.02))',
      glassText: 'rgba(200,180,230,0.7)', glassBorder: 'rgba(121,40,202,0.04)',
      glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(0,212,170,0.06), transparent 85%)'
    },
    sunset: {
      bg: '#0f0805', bg2: '#140a06', bg3: '#1a0c07',
      surface: 'rgba(255,107,53,0.02)', surfaceActive: 'rgba(247,201,72,0.06)',
      line: 'rgba(255,107,53,0.06)', lineHover: 'rgba(247,201,72,0.1)', lineFocus: 'rgba(247,201,72,0.18)',
      text: '#f0e8e0', text2: '#c09070', text3: 'rgba(192,144,112,0.2)', textInverse: '#0f0805',
      accent: '#ff6b35', accent2: '#f7c948',
      shadow: '0 4px 24px rgba(0,0,0,0.5)', shadowLg: '0 12px 48px rgba(0,0,0,0.7)',
      glow: '#ff6b35', blur: '12px',
      glassBg: 'linear-gradient(180deg, rgba(255,107,53,0.06), rgba(247,201,72,0.02))',
      glassText: 'rgba(240,200,170,0.7)', glassBorder: 'rgba(255,107,53,0.04)',
      glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(247,201,72,0.06), transparent 85%)'
    },
    ocean: {
      bg: '#040e10', bg2: '#061214', bg3: '#081618',
      surface: 'rgba(13,115,119,0.03)', surfaceActive: 'rgba(20,163,168,0.06)',
      line: 'rgba(13,115,119,0.06)', lineHover: 'rgba(20,163,168,0.1)', lineFocus: 'rgba(20,163,168,0.18)',
      text: '#d0ece8', text2: '#60b0b0', text3: 'rgba(96,176,176,0.2)', textInverse: '#040e10',
      accent: '#14a3a8', accent2: '#0d7377',
      shadow: '0 4px 24px rgba(0,0,0,0.5)', shadowLg: '0 12px 48px rgba(0,0,0,0.7)',
      glow: '#14a3a8', blur: '12px',
      glassBg: 'linear-gradient(180deg, rgba(13,115,119,0.06), rgba(20,163,168,0.02))',
      glassText: 'rgba(180,220,216,0.7)', glassBorder: 'rgba(13,115,119,0.04)',
      glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(20,163,168,0.06), transparent 85%)'
    },
    rose: {
      bg: '#0e060a', bg2: '#14080d', bg3: '#180a10',
      surface: 'rgba(232,67,147,0.02)', surfaceActive: 'rgba(253,121,168,0.06)',
      line: 'rgba(232,67,147,0.05)', lineHover: 'rgba(253,121,168,0.1)', lineFocus: 'rgba(253,121,168,0.18)',
      text: '#f0e0e8', text2: '#c080a0', text3: 'rgba(192,128,160,0.2)', textInverse: '#0e060a',
      accent: '#fd79a8', accent2: '#e84393',
      shadow: '0 4px 24px rgba(0,0,0,0.5)', shadowLg: '0 12px 48px rgba(0,0,0,0.7)',
      glow: '#fd79a8', blur: '12px',
      glassBg: 'linear-gradient(180deg, rgba(232,67,147,0.06), rgba(253,121,168,0.02))',
      glassText: 'rgba(230,200,215,0.7)', glassBorder: 'rgba(232,67,147,0.04)',
      glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(253,121,168,0.06), transparent 85%)'
    },
    amber: {
      bg: '#0c0800', bg2: '#0f0a00', bg3: '#140e00',
      surface: 'rgba(212,160,23,0.02)', surfaceActive: 'rgba(255,215,0,0.06)',
      line: 'rgba(212,160,23,0.06)', lineHover: 'rgba(255,215,0,0.1)', lineFocus: 'rgba(255,215,0,0.18)',
      text: '#e8e0c8', text2: '#b09840', text3: 'rgba(176,152,64,0.2)', textInverse: '#0c0800',
      accent: '#ffd700', accent2: '#d4a017',
      shadow: '0 4px 24px rgba(0,0,0,0.5)', shadowLg: '0 12px 48px rgba(0,0,0,0.7)',
      glow: '#ffd700', blur: '12px',
      glassBg: 'linear-gradient(180deg, rgba(212,160,23,0.06), rgba(255,215,0,0.02))',
      glassText: 'rgba(220,210,180,0.7)', glassBorder: 'rgba(212,160,23,0.04)',
      glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,215,0,0.06), transparent 85%)'
    }
  }

  var themeKeys = ['--bg', '--bg1', '--bg2', '--bg3', '--surface', '--surface-hover', '--surface-active', '--surface-glass', '--line', '--line-hover', '--line-focus', '--text', '--text-secondary', '--text-muted', '--text-inverse', '--accent', '--accent2', '--accent-dim', '--accent-glow', '--shadow', '--shadow-lg', '--glow', '--blur', '--glass-bg', '--glass-text', '--glass-border', '--glass-shimmer']
  window.applyTheme = function (name) {
    var t = themes[name]; if (!t) return
    var r = document.documentElement
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
    localStorage.setItem('xolerc_theme', name)
    var btns = document.querySelectorAll('.theme-btn')
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.theme === name)
    /* Smooth transition class */
    r.classList.add('theme-transition')
    clearTimeout(r._themeTr)
    r._themeTr = setTimeout(function () { r.classList.remove('theme-transition') }, 600)
  }

  function initTheme() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.theme-btn') : null
      if (!btn) return
      window.applyTheme(btn.dataset.theme || 'midnight')
    })
    window.applyTheme(localStorage.getItem('xolerc_theme') || 'midnight')
  }

  var LANG = {
    uz: { 'nav.home': 'Ish maydoni', 'nav.chat': 'Chat', 'nav.video': 'Video', 'nav.playme': 'Pleer', 'nav.projects': 'Loyihalar', 'nav.settings': 'Sozlamalar', 'bn.home': 'Asosiy', 'bn.chat': 'Chat', 'bn.video': 'Video', 'bn.playme': 'Pleer', 'bn.projects': 'Loyihalar', 'bn.settings': 'Sozlamalar', 'hero.badge': 'DASTURCHI • DIZAYNER • MUHANDIS', 'hero.desc': 'Frontend arxitektori. Tizimlar quruvchi. Interfeyslar yaratuvchi.', 'hero.projects': 'Loyihalar', 'hero.chat': 'Chat', 'hero.contact': 'Aloqa', 'chat.title': 'Xabarlar', 'chat.online': 'online', 'chat.loading': 'Xabarlar yuklanmoqda...', 'playme.title': 'Pleer', 'playme.desc': 'Video darsliklar to\'plami', 'playme.list': 'Pleer ro\'yxati', 'projects.title': 'Loyihalar', 'projects.desc': 'GitHub\'dagi barcha ochiq manbali loyihalar', 'projects.search': 'Loyihalarni qidirish...', 'contact.title': 'Aloqa', 'contact.desc': 'Loyihalar va hamkorlik uchun', 'settings.title': 'Sozlamalar', 'settings.desc': 'Ilova sozlamalari va yuklamalar', 'settings.theme': 'Interfeys temasi', 'settings.theme.desc': 'Ilova ko\'rinishini o\'zingizga moslang', 'settings.notif': 'Bildirishnomalar', 'settings.notif_sound': 'Xabar ovozi', 'settings.dnd': 'Menga yozmaslik', 'settings.cache': 'Keshni tozalash', 'settings.cache.clear': 'Tozalash', 'settings.lang': 'Til', 'settings.export': "Ma'lumotlarni eksport qilish", 'loader.text': 'Tizim yuklanmoqda...', 'chat.empty': 'Xabarlar yo\'q', 'chat.input': 'Xabar yozing...', 'chat.main': 'Umumiy Chat', 'chat.main.sub': 'Barcha xabarlar' },
    en: { 'nav.home': 'Workspace', 'nav.chat': 'Chat', 'nav.video': 'Video', 'nav.playme': 'Player', 'nav.projects': 'Projects', 'nav.settings': 'Settings', 'bn.home': 'Home', 'bn.chat': 'Chat', 'bn.video': 'Video', 'bn.playme': 'Player', 'bn.projects': 'Projects', 'bn.settings': 'Settings', 'hero.badge': 'DEVELOPER • DESIGNER • ENGINEER', 'hero.desc': 'Frontend architect. System builder. Interface creator.', 'hero.projects': 'Projects', 'hero.chat': 'Chat', 'hero.contact': 'Contact', 'chat.title': 'Messages', 'chat.online': 'online', 'chat.loading': 'Loading messages...', 'playme.title': 'Player', 'playme.desc': 'Video tutorial collection', 'playme.list': 'Playlist', 'projects.title': 'Projects', 'projects.desc': 'All open-source projects on GitHub', 'projects.search': 'Search projects...', 'contact.title': 'Contact', 'contact.desc': 'For projects and collaboration', 'settings.title': 'Settings', 'settings.desc': 'App settings and downloads', 'settings.theme': 'Theme', 'settings.theme.desc': 'Customize the app appearance', 'settings.notif': 'Notifications', 'settings.notif_sound': 'Message sound', 'settings.dnd': 'Do not disturb', 'settings.cache': 'Clear cache', 'settings.cache.clear': 'Clear', 'settings.lang': 'Language', 'settings.export': 'Export data', 'loader.text': 'Loading system...', 'chat.empty': 'No messages', 'chat.input': 'Write a message...', 'chat.main': 'General Chat', 'chat.main.sub': 'All messages' },
    ru: { 'nav.home': 'Рабочее место', 'nav.chat': 'Чат', 'nav.video': 'Видео', 'nav.playme': 'Плеер', 'nav.projects': 'Проекты', 'nav.settings': 'Настройки', 'bn.home': 'Главная', 'bn.chat': 'Чат', 'bn.video': 'Видео', 'bn.playme': 'Плеер', 'bn.projects': 'Проекты', 'bn.settings': 'Настройки', 'hero.badge': 'РАЗРАБОТЧИК • ДИЗАЙНЕР • ИНЖЕНЕР', 'hero.desc': 'Фронтенд-архитектор. Строитель систем. Создатель интерфейсов.', 'hero.projects': 'Проекты', 'hero.chat': 'Чат', 'hero.contact': 'Контакты', 'chat.title': 'Сообщения', 'chat.online': 'онлайн', 'chat.loading': 'Загрузка сообщений...', 'playme.title': 'Плеер', 'playme.desc': 'Коллекция видеоуроков', 'playme.list': 'Плейлист', 'projects.title': 'Проекты', 'projects.desc': 'Все открытые проекты на GitHub', 'projects.search': 'Поиск проектов...', 'contact.title': 'Контакты', 'contact.desc': 'Для проектов и сотрудничества', 'settings.title': 'Настройки', 'settings.desc': 'Настройки приложения и загрузки', 'settings.theme': 'Тема', 'settings.theme.desc': 'Настройте внешний вид приложения', 'settings.notif': 'Уведомления', 'settings.notif_sound': 'Звук сообщения', 'settings.dnd': 'Не беспокоить', 'settings.cache': 'Очистить кеш', 'settings.cache.clear': 'Очистить', 'settings.lang': 'Язык', 'settings.export': 'Экспорт данных', 'loader.text': 'Загрузка системы...', 'chat.empty': 'Нет сообщений', 'chat.input': 'Напишите сообщение...', 'chat.main': 'Общий чат', 'chat.main.sub': 'Все сообщения' }
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
