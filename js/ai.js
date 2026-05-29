(function () {
  'use strict'
  var CONVS_KEY = 'xolerc_ai_convs'
  var convs = [], activeId = null, loading = false

  function $(s) { return document.getElementById(s) }
  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }

  function loadConvs() {
    try { convs = JSON.parse(localStorage.getItem(CONVS_KEY) || '[]') } catch (e) { convs = [] }
    if (!convs.length) { convs.push({ id: 'conv_' + Date.now(), title: 'Suhbat 1', messages: [], createdAt: Date.now() }) }
    if (!activeId || !convs.some(function (c) { return c.id === activeId })) activeId = convs[0].id
  }
  function saveConvs() { localStorage.setItem(CONVS_KEY, JSON.stringify(convs)) }

  function renderSidebar() {
    var el = $('aiSidebarList'); if (!el) return
    el.innerHTML = convs.map(function (c) {
      return '<div class="ai-conv-item' + (c.id === activeId ? ' active' : '') + '" data-id="' + c.id + '">' +
        '<span class="ai-conv-icon">\ud83d\udcac</span>' +
        '<span class="ai-conv-title">' + esc(c.title || 'Suhbat') + '</span>' +
        '<button class="ai-conv-del" data-id="' + c.id + '">\u2715</button></div>'
    }).join('')
    el.querySelectorAll('.ai-conv-item').forEach(function (item) {
      item.addEventListener('click', function (e) {
        if (e.target.closest('.ai-conv-del')) return
        switchConv(item.dataset.id)
      })
    })
    el.querySelectorAll('.ai-conv-del').forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.stopPropagation(); deleteConv(btn.dataset.id) })
    })
  }

  function deleteConv(id) {
    if (convs.length <= 1) { clearConv(id); return }
    convs = convs.filter(function (c) { return c.id !== id })
    if (activeId === id) { activeId = convs[0].id }
    saveConvs(); renderSidebar(); renderMessages()
  }
  function clearConv(id) {
    for (var i = 0; i < convs.length; i++) { if (convs[i].id === id) { convs[i].messages = []; break } }
    saveConvs(); renderMessages()
  }
  function switchConv(id) {
    if (id === activeId) return
    activeId = id; saveConvs(); renderSidebar(); renderMessages()
  }
  function newConv() {
    var id = 'conv_' + Date.now()
    convs.unshift({ id: id, title: 'Suhbat ' + (convs.length + 1), messages: [], createdAt: Date.now() })
    activeId = id; saveConvs(); renderSidebar(); renderMessages(); scrollToBottom()
    $('aiInput').focus()
  }
  function scrollToBottom() {
    var msgs = $('aiMessages')
    if (msgs) setTimeout(function () { msgs.scrollTop = msgs.scrollHeight }, 50)
  }

  function renderMessages() {
    var el = $('aiMessages'); if (!el) return
    var conv = null
    for (var i = 0; i < convs.length; i++) { if (convs[i].id === activeId) { conv = convs[i]; break } }
    if (!conv) { el.innerHTML = ''; return }
    if (!conv.messages.length) {
      el.innerHTML = '<div class="ai-empty"><div class="ai-empty-icon">\ud83e\udd16</div><div class="ai-empty-title">XOLERIC AI</div><div class="ai-empty-desc">Savolingizni yozing yoki buyruq bering</div></div>'
      return
    }
    el.innerHTML = conv.messages.map(function (m, idx) {
      var isUser = m.role === 'user'
      var content = isUser ? esc(m.content) : renderMD(m.content)
      return '<div class="ai-msg ai-msg-' + (isUser ? 'user' : 'ai') + '" data-idx="' + idx + '">' +
        '<div class="ai-msg-avatar">' + (isUser ? '\ud83d\udc64' : '\ud83e\udd16') + '</div>' +
        '<div class="ai-msg-bubble' + (isUser ? '' : ' ai-msg-md') + '">' + content + '</div></div>'
    }).join('')
    if (loading) el.insertAdjacentHTML('beforeend', '<div class="ai-msg ai-msg-ai" id="aiStreamMsg"><div class="ai-msg-avatar">\ud83e\udd16</div><div class="ai-msg-bubble ai-msg-md"><span class="ai-typing"><span></span><span></span><span></span></span></div></div>')
    scrollToBottom()
  }

  function renderMD(text) {
    text = esc(text)
    text = text.replace(/### (.+)/g, '<h3>$1</h3>')
    text = text.replace(/## (.+)/g, '<h2>$1</h2>')
    text = text.replace(/# (.+)/g, '<h1>$1</h1>')
    text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, function (_, lang, code) {
      return '<pre><code class="ai-code' + (lang ? ' lang-' + esc(lang) : '') + '">' + esc(code.trim()) + '</code></pre>'
    })
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>')
    text = text.replace(/\*\*(\S(?:[^*]*\S)?)\*\*/g, '<strong>$1</strong>')
    text = text.replace(/\*(\S(?:[^*]*\S)?)\*/g, '<em>$1</em>')
    text = text.replace(/^- (.+)/gm, '<li>$1</li>')
    text = text.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    text = text.replace(/\n/g, '<br>')
    text = text.replace(/<br>\n?<\/li>/g, '</li>')
    text = text.replace(/<\/ul>\s*<br>/g, '</ul>')
    text = text.replace(/<br>\s*<ul>/g, '<ul>')
    text = text.replace(/<br>\s*<\/h[1-3]>/g, '</h$1>')
    return text
  }

  function processAI(text) {
    if (!window.XOLERIC_AI) {
      handleError('AI tizimi yuklanmagan. Sahifani qayta yuklang.')
      return
    }
    loading = true
    renderMessages()
    var stopBtn = $('aiStopBtn')
    if (stopBtn) stopBtn.style.display = 'flex'

    // Show typing for a realistic feel
    setTimeout(function () {
      window.XOLERIC_AI.process(text, function (response) {
        loading = false
        if (stopBtn) stopBtn.style.display = 'none'
        var conv = getActiveConv()
        if (!conv) return
        if (response) {
          conv.messages.push({ role: 'assistant', content: response })
          saveConvs(); renderMessages(); scrollToBottom()
          // Track learning
          if (window.XOLERIC_LEARN) window.XOLERIC_LEARN.recordUse('response')
        }
      })
    }, 300 + Math.random() * 400)
  }

  function handleError(msg) {
    var conv = getActiveConv()
    if (conv) conv.messages.push({ role: 'assistant', content: '\u26a0\ufe0f ' + msg })
    saveConvs(); renderMessages(); scrollToBottom()
  }

  function getActiveConv() {
    for (var i = 0; i < convs.length; i++) { if (convs[i].id === activeId) return convs[i] }
    return null
  }

  function sendMessage(text) {
    text = text.trim()
    if (!text || loading) return
    var conv = getActiveConv()
    if (!conv) return
    conv.messages.push({ role: 'user', content: text })
    if (conv.messages.length === 1) { conv.title = text.slice(0, 40) + (text.length > 40 ? '...' : '') }
    saveConvs(); renderSidebar(); renderMessages()
    $('aiInput').value = ''
    $('aiInput').style.height = ''
    processAI(text)
  }

  function setupInput() {
    var input = $('aiInput'), send = $('aiSendBtn')
    if (!input) return
    send.addEventListener('click', function () { sendMessage(input.value) })
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input.value) }
    })
    input.addEventListener('input', function () {
      input.style.height = ''
      input.style.height = Math.min(input.scrollHeight, 160) + 'px'
    })
  }

  function setupNewBtn() {
    var btn = $('aiNewBtn')
    if (btn) btn.addEventListener('click', newConv)
  }

  function setupSidebarToggle() {
    var menuBtn = $('aiMenuBtn')
    var sidebar = $('aiSidebar')
    var overlay = $('aiSidebarOverlay')
    var closeBtn = $('aiSidebarClose')
    function toggle() {
      sidebar.classList.toggle('open')
      if (overlay) overlay.classList.toggle('open')
    }
    if (menuBtn) menuBtn.addEventListener('click', toggle)
    if (closeBtn) closeBtn.addEventListener('click', toggle)
    if (overlay) overlay.addEventListener('click', toggle)
    if (menuBtn && window.innerWidth < 769) menuBtn.style.display = ''
    window.addEventListener('resize', function () {
      if (menuBtn) menuBtn.style.display = window.innerWidth < 769 ? '' : 'none'
      if (window.innerWidth >= 769 && sidebar) sidebar.classList.remove('open')
      if (overlay) overlay.classList.remove('open')
    })
    window.addEventListener('tabChange', function (e) {
      if (e.detail && e.detail.tab !== 'ai' && sidebar) sidebar.classList.remove('open')
      if (overlay) overlay.classList.remove('open')
    })
  }

  function setupSettingsBtn() {
    var btn = $('aiSettingsBtn')
    if (btn) btn.addEventListener('click', function () {
      var learned = window.XOLERIC_LEARN ? window.XOLERIC_LEARN.count() : 0
      var dbInfo = window.XOLERIC_DB ? 'Ha (' + (window.XOLERIC_DB.about.length + window.XOLERIC_DB.music.songs.length + window.XOLERIC_DB.programming.length + window.XOLERIC_DB.culture.length + window.XOLERIC_DB.greetings.length + window.XOLERIC_DB.commands.length + window.XOLERIC_DB.fun.length) + ' kategoriya)' : 'Yo\'q'
      var msg = '\ud83e\udd16 **XOLERIC AI — Ma\'lumot**\n\n' +
        '\ud83d\udcc2 **Ma\'lumotlar bazasi**: ' + dbInfo + '\n' +
        '\ud83c\udfb5 **Musiqa**: ' + (window.XOLERIC_DB ? window.XOLERIC_DB.music.songs.length + ' qo\'shiq' : '?') + '\n' +
        '\ud83e\udde0 **O\'rganilgan**: ' + learned + ' ta\n' +
        '\ud83d\udcca **Statistika**: ' + (window.XOLERIC_AI && window.XOLERIC_AI.stats ? Object.keys(window.XOLERIC_AI.stats()).length : 0) + ' xil savol\n\n' +
        'Bu AI hech qanday tashqi API dan foydalanmaydi. To\'liq mahalliy (local) tizim.'
      if (learned > 0) msg += '\n\nO\'rganilgan ma\'lumotlarni tozalash uchun "Tozalash" tugmasini bosing.'
      var result = confirm(msg + '\n\nMa\'lumotlar bazasini tozalaysizmi?')
      if (result) {
        if (window.XOLERIC_LEARN) window.XOLERIC_LEARN.clear()
        if (window.XOLERIC_AI) window.XOLERIC_AI.clearLearned && window.XOLERIC_AI.clearLearned()
        alert('O\'rganilgan ma\'lumotlar tozalandi!')
      }
    })
  }

  window.initAI = function () {
    loadConvs()
    renderSidebar()
    renderMessages()
    setupInput()
    setupNewBtn()
    setupSettingsBtn()
    setupSidebarToggle()
    // Check if engine loaded
    if (!window.XOLERIC_AI) {
      console.warn('AI: XOLERIC_AI engine not loaded')
      var conv = getActiveConv()
      if (conv && !conv.messages.length) {
        setTimeout(function () {
          conv.messages.push({ role: 'assistant', content: '\ud83e\udd16 **XOLERIC AI**\n\nMen tayyorman! \ud83d\ude80\n\nMenga istalgan savol berishingiz yoki buyruq berishingiz mumkin.\n\nMasalan:\n- "Salom"\n- "Xoleric kim?"\n- "Hamdam qo\'shig\'ini qo\'y"\n- "Chatga o\'t"\n- "Yordam" yoki "help"' })
          saveConvs(); renderMessages(); scrollToBottom()
        }, 500)
      }
    }
  }

  document.addEventListener('tabChange', function (e) {
    if (e.detail && e.detail.tab === 'ai' && $('aiMessages')) {
      var msgs = $('aiMessages')
      if (!msgs.children.length || msgs.querySelector('.ai-empty')) renderMessages()
      scrollToBottom()
    }
  })
})()
