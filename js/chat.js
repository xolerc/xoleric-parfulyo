(function () {
  'use strict'
  var REACTIONS = ['👍', '❤️', '😊', '😂', '😮', '😢', '🙏', '🔥', '🎉', '💯']
  var CACHE_KEY = 'xolerc_user'
  var currentUser = null, msgUnsub = null, roomsUnsub = null, usersUnsub = null, typingUnsub = null, currentRoomId = 'main', allRooms = [], allUsers = [], typingTimer = null
  var unreadCount = 0, lastKnownCount = 0, notifSoundEnabled = localStorage.getItem('xolerc_notif_sound') !== 'off', dndMode = localStorage.getItem('xolerc_dnd') === 'on', notifSoundCtx = null
  var replyTo = null, oldestTime = null, loadingMore = false, pinnedMsgs = [], allMsgsCache = []

  window.setNotifSound = function (on) { notifSoundEnabled = on }

  function playNotifSound() {
    if (!notifSoundEnabled) return
    try {
      if (!notifSoundCtx) notifSoundCtx = new (window.AudioContext || window.webkitAudioContext)()
      if (notifSoundCtx.state === 'suspended') notifSoundCtx.resume()
      var osc = notifSoundCtx.createOscillator(), gain = notifSoundCtx.createGain()
      osc.connect(gain); gain.connect(notifSoundCtx.destination)
      osc.frequency.value = 880; osc.type = 'sine'
      gain.gain.setValueAtTime(0.08, notifSoundCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, notifSoundCtx.currentTime + 0.25)
      osc.start(); osc.stop(notifSoundCtx.currentTime + 0.25)
    } catch (e) {}
  }

  function updateTitleBadge() { document.title = unreadCount > 0 ? '(' + unreadCount + ') XOLERIC' : 'XOLERIC \u221E' }
  function clearUnread() { if (unreadCount > 0) { unreadCount = 0; updateTitleBadge() } }
  function $(id) { return document.getElementById(id) }

  var toastTimer = null
  function toast(msg) {
    var t = $('chatToast'); if (!t) return
    if (toastTimer) clearTimeout(toastTimer)
    t.textContent = msg; t.classList.add('show')
    toastTimer = setTimeout(function () { t.classList.remove('show'); toastTimer = null }, 3000)
  }
  function hideLoading() { var o = $('loadingOverlay'); if (o) { o.classList.add('fade-out'); setTimeout(function () { o.style.display = 'none' }, 500) } }
  function hideChatLoader() { var l = $('chatLoader'); if (l) l.classList.add('hidden') }
  function showChatLoader() { var l = $('chatLoader'); if (l) l.classList.remove('hidden') }
  function showRoomView() { var lv = $('chatListView'), rv = $('chatRoomView'); if (lv) lv.style.display = 'none'; if (rv) rv.style.display = 'flex' }
  function showListView() { var rv = $('chatRoomView'), lv = $('chatListView'); if (rv) rv.style.display = 'none'; if (lv) lv.style.display = 'flex'; cleanupMessages(); renderSidebar(); var si = $('chatSearch'); if (si) si.value = ''; document.querySelectorAll('.msg-wrapper').forEach(function (el) { el.style.display = '' }) }
  function openModal() { var m = $('setupModal'); if (m) { m.style.display = 'flex'; requestAnimationFrame(function () { m.classList.add('open') }) } }
  function closeModalEl() { var m = $('setupModal'); if (m) { m.classList.remove('open'); setTimeout(function () { m.style.display = 'none' }, 250) } }

  function escId(s) { return (s || '').replace(/'/g, "\\'").replace(/"/g, '&quot;') }
  function cssUrl(s) { return 'url("' + (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '")' }

  async function ensureUser() {
    var uid = localStorage.getItem('xolerc_uid')
    if (uid) {
      try { var user = await DB.getUser(uid); if (user && user.id) { currentUser = user; localStorage.setItem(CACHE_KEY, JSON.stringify(user)); return user } } catch (e) {}
      var cached = localStorage.getItem(CACHE_KEY)
      if (cached) { try { var p = JSON.parse(cached); if (p && p.id === uid) { currentUser = p; return p } } catch (e) {} }
    }
    return null
  }

  function updateSidebarUser(user) {
    var ne = $('sidebarName'), se = $('sidebarStatus'), ae = $('sidebarAvatar')
    if (ne) ne.textContent = user.username || 'User'
    if (se) se.textContent = 'online'
    if (ae) {
      if (user.avatar) { ae.textContent = ''; ae.style.backgroundImage = cssUrl(user.avatar); ae.style.backgroundSize = 'cover' }
      else { ae.textContent = (user.username || '?')[0].toUpperCase(); ae.style.backgroundImage = '' }
    }
  }

  function renderSidebar() {
    var sidebar = $('sidebarChats')
    if (!sidebar) return
    var html = '<div class="chat-list-item" data-room="main" style="cursor:pointer"><div class="cli-avatar">∞</div><div class="cli-info"><span class="cli-name" data-i18n="chat.main">Umumiy Chat</span><span class="cli-msg" data-i18n="chat.main.sub">Barcha xabarlar</span></div></div>'
    for (var i = 0; i < allRooms.length; i++) {
      var r = allRooms[i]; var fn = r.name ? r.name[0].toUpperCase() : 'R'
      html += '<div class="chat-list-item" data-room="' + r.id + '" style="cursor:pointer"><div class="cli-avatar room-avatar">#' + window.escHtml(fn) + '</div><div class="cli-info"><span class="cli-name">' + window.escHtml(r.name) + '</span><span class="cli-msg">' + (r.lastMessage ? window.escHtml(r.lastMessage.slice(0, 30)) : '...') + '</span></div></div>'
    }
    html += '<div class="chat-list-item" id="createRoomBtn" style="cursor:pointer"><div class="cli-avatar" style="border:1px dashed var(--accent);color:var(--accent)">+</div><div class="cli-info"><span class="cli-name" style="color:var(--accent)">Yangi xona</span><span class="cli-msg" style="color:var(--text-muted)">Shaxsiy chat yaratish</span></div></div>'
    sidebar.innerHTML = html
    sidebar.querySelectorAll('.chat-list-item[data-room]').forEach(function (el) { el.addEventListener('click', function () { openRoom(el.dataset.room || 'main') }) })
    var cb = document.getElementById('createRoomBtn')
    if (cb) cb.addEventListener('click', showCreateRoomModal)
    var lang = localStorage.getItem('xolerc_lang') || 'uz'
    var L = { uz: { 'chat.main': 'Umumiy Chat', 'chat.main.sub': 'Barcha xabarlar' }, en: { 'chat.main': 'General Chat', 'chat.main.sub': 'All messages' }, ru: { 'chat.main': 'Общий чат', 'chat.main.sub': 'Все сообщения' } }[lang] || {}
    sidebar.querySelectorAll('[data-i18n]').forEach(function (el) { var k = el.dataset.i18n; if (L[k]) el.textContent = L[k] })
  }

  function showCreateRoomModal() {
    var existing = document.getElementById('createRoomOverlay')
    if (existing) existing.remove()
    var ov = document.createElement('div')
    ov.id = 'createRoomOverlay'
    ov.className = 'modal-overlay'
    ov.style.cssText = 'display:flex;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:1000'
    ov.innerHTML = '<div class="glass-card" style="padding:24px;width:320px;max-width:90vw;border-radius:16px"><h3 style="margin:0 0 16px;font-size:16px" data-i18n="chat.create">Yangi xona yaratish</h3><input id="roomNameInput" style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--text);font-size:14px;box-sizing:border-box" placeholder="Xona nomi..." maxlength="50" /><div style="display:flex;gap:8px;margin-top:16px"><button id="roomCancelBtn" class="glass-btn glass-outline" style="flex:1" data-i18n="chat.cancel">Bekor qilish</button><button id="roomCreateBtn" class="glass-btn" style="flex:1" data-i18n="chat.create.btn">Yaratish</button></div></div>'
    document.body.appendChild(ov)
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove() })
    var input = document.getElementById('roomNameInput')
    document.getElementById('roomCancelBtn').addEventListener('click', function () { ov.remove() })
    document.getElementById('roomCreateBtn').addEventListener('click', async function () {
      var name = input ? input.value.trim() : ''
      if (!name) { toast('Xona nomini kiriting'); return }
      if (!currentUser) { toast('Avval profilingizni yarating'); return }
      var id = await DB.createRoom(name, currentUser.id, currentUser.username)
      if (id) { ov.remove(); toast('Xona yaratildi!'); renderSidebar() } else toast('Xatolik yuz berdi')
    })
    if (input) { input.addEventListener('keydown', function (e) { if (e.key === 'Enter') document.getElementById('roomCreateBtn').click() }); input.focus() }
    var lang = localStorage.getItem('xolerc_lang') || 'uz'
    var L = { uz: { 'chat.create': 'Yangi xona yaratish', 'chat.cancel': 'Bekor qilish', 'chat.create.btn': 'Yaratish' }, en: { 'chat.create': 'Create new room', 'chat.cancel': 'Cancel', 'chat.create.btn': 'Create' }, ru: { 'chat.create': 'Создать новую комнату', 'chat.cancel': 'Отмена', 'chat.create.btn': 'Создать' } }[lang]
    ov.querySelectorAll('[data-i18n]').forEach(function (el) { var k = el.dataset.i18n; if (L && L[k]) el.textContent = L[k] })
  }

  document.addEventListener('tabChange', function (e) {
    if (e.detail && e.detail.tab === 'chat') clearUnread()
  })
  window.addEventListener('focus', function () {
    var curTab = window.getCurrentTab ? window.getCurrentTab() : 0
    if (curTab === 1) clearUnread()
  })

  function getRoomOtherUser() {
    if (currentRoomId === 'main') return null
    for (var i = 0; i < allRooms.length; i++) {
      if (allRooms[i].id === currentRoomId) {
        if (allRooms[i].otherUserId && allUsers.length) {
          for (var j = 0; j < allUsers.length; j++) { if (allUsers[j].id === allRooms[i].otherUserId) return allUsers[j] }
        }
        return null
      }
    }
    return null
  }

  function openRoom(roomId) {
    cleanupMessages(); lastKnownCount = 0; currentRoomId = roomId; replyTo = null; oldestTime = null; allMsgsCache = []; pinnedMsgs = []
    var ne = $('chatRoomName'), se = $('chatRoomStatus'), ae = $('chatRoomAvatar'), ja = $('chatJoinArea'), ia = $('chatInputArea'), me = $('chatMessages'), bb = $('chatBackBtn'), sw = $('chatSearchWrap')
    if (roomId === 'main') { if (ne) ne.textContent = 'Umumiy Chat'; if (se) se.textContent = 'online \u00B7 ' + allUsers.length + ' foydalanuvchi'; if (ae) ae.textContent = '\u221E' }
    else {
      var room = null; for (var i = 0; i < allRooms.length; i++) { if (allRooms[i].id === roomId) { room = allRooms[i]; break } }
      if (ne) ne.textContent = (room && room.name) || roomId
      var other = null
      if (room && room.otherUserId && allUsers.length) { for (var j = 0; j < allUsers.length; j++) { if (allUsers[j].id === room.otherUserId) { other = allUsers[j]; break } } }
      if (se) se.textContent = other ? (other.online ? 'online' : 'offline') : (room ? 'by ' + room.creatorName : '')
      if (ae) ae.textContent = room ? (room.name[0] || '#').toUpperCase() : '#'
    }
    if (ja) ja.style.display = 'none'; if (ia) ia.style.display = 'flex'; if (bb) bb.style.display = ''; if (sw) sw.style.display = 'block'
    showRoomView()
    if (me) me.innerHTML = '<div class="chat-loading" data-i18n="chat.loading">Xabarlar yuklanmoqda...</div>'
    msgUnsub = DB.subscribeMessages(roomId, function (msgs) { renderMessages(msgs) })
    setupTypingSubscription(roomId)
    if (typingTimer) { clearTimeout(typingTimer); typingTimer = null }
    cancelReply()
  }

  function cleanupMessages() { if (msgUnsub) { msgUnsub(); msgUnsub = null }; if (typingUnsub) { typingUnsub(); typingUnsub = null }; var sw = $('chatSearchWrap'); if (sw) sw.style.display = 'none' }

  function loadMoreMessages() {
    if (loadingMore || !oldestTime) return
    loadingMore = true
    var btn = document.getElementById('chatLoadMoreBtn')
    if (btn) { btn.textContent = 'Yuklanmoqda...'; btn.disabled = true }
    DB.subscribeMessagesBefore(currentRoomId, oldestTime, 50, function (msgs) {
      loadingMore = false
      if (btn) { btn.style.display = msgs.length ? 'block' : 'none'; btn.textContent = "Ko'proq yuklash"; btn.disabled = false }
      if (!msgs.length) return
      oldestTime = msgs[0].time
      allMsgsCache = msgs.concat(allMsgsCache)
      var container = $('chatMessages')
      if (!container) return
      var scrollH = container.scrollHeight
      var prependHtml = ''
      for (var i = 0; i < msgs.length; i++) {
        var prev = i > 0 ? msgs[i - 1] : null
        var showDate = !prev || !prev.time || !msgs[i].time || new Date(prev.time).toDateString() !== new Date(msgs[i].time).toDateString()
        if (showDate) prependHtml += '<div class="date-sep"><span>' + getDateLabel(msgs[i].time) + '</span></div>'
        prependHtml += renderMessage(msgs[i])
      }
      container.insertAdjacentHTML('afterbegin', prependHtml)
      container.scrollTop = container.scrollHeight - scrollH
    })
  }

  function renderMessages(msgs) {
    var container = $('chatMessages')
    if (!container) return
    if (lastKnownCount > 0 && msgs.length > lastKnownCount && !dndMode) {
      var latest = msgs[msgs.length - 1]
      var isSelf = latest && currentUser && latest.fromId === currentUser.id
      if (latest && !isSelf) {
        var curTab = window.getCurrentTab ? window.getCurrentTab() : 0
        var isFocused = document.hasFocus()
        if (curTab !== 1 || !isFocused) {
          unreadCount++; updateTitleBadge(); playNotifSound()
          if (!isFocused && Notification.permission === 'granted' && localStorage.getItem('xolerc_notif') !== 'off') {
            try { new Notification('XOLERIC Chat', { body: (latest.fromName || 'Someone') + ': ' + (latest.text || '(media)'), icon: 'icon.png' }) } catch (e) {}
          }
        }
      }
    }
    lastKnownCount = msgs.length; allMsgsCache = msgs
    if (!msgs.length) { container.innerHTML = '<div class="chat-empty" style="padding:60px 20px;text-align:center;color:var(--text-muted);font-size:13px">📭 Xabarlar yo\'q. Birinchi bo\'lib yozing!</div>'; return }
    var html = ''
    html += '<div style="text-align:center;padding:8px 0"><button id="chatLoadMoreBtn" class="chat-load-more-btn">Ko\'proq yuklash</button></div>'
    pinnedMsgs = msgs.filter(function (m) { return m.pinned })
    for (var p = 0; p < pinnedMsgs.length; p++) {
      var pm = pinnedMsgs[p]
      html += '<div class="pinned-header">📌 Pin qilingan</div>' + renderMessage(pm)
    }
    if (pinnedMsgs.length) html += '<div style="height:4px"></div>'
    oldestTime = msgs[0] ? msgs[0].time : null
    var lastAuthor = null, lastTime = null
    for (var i = 0; i < msgs.length; i++) {
      var m = msgs[i]
      if (m.pinned) continue
      var prev = i > 0 ? msgs[i - 1] : null
      var showDate = i === 0 || !prev || !prev.time || !m.time || new Date(prev.time).toDateString() !== new Date(m.time).toDateString()
      if (showDate) html += '<div class="date-sep"><span>' + getDateLabel(m.time) + '</span></div>'
      var sameAuthor = lastAuthor && m.fromId === lastAuthor && lastTime && (m.time - lastTime) < 60000
      html += renderMessage(m, sameAuthor)
      lastAuthor = m.fromId; lastTime = m.time
    }
    container.innerHTML = html
    var btn = document.getElementById('chatLoadMoreBtn')
    if (btn) btn.addEventListener('click', loadMoreMessages)
    requestAnimationFrame(function () { container.scrollTop = container.scrollHeight })
  }

  function setupTypingSubscription(roomId) {
    if (typingUnsub) { typingUnsub(); typingUnsub = null }
    typingUnsub = DB.subscribeTyping(roomId, function (typers) {
      var el = $('chatTyping'), ne = $('chatTypingName')
      if (!el || !ne) return
      var names = []
      for (var k in typers) { if (k !== (currentUser ? currentUser.id : '')) { var n = typers[k].name || 'Someone'; if (n.length > 15) n = n.slice(0, 15) + '...'; names.push(n) } }
      if (names.length) { ne.textContent = names.join(', ') + ' '; el.classList.add('show') } else el.classList.remove('show')
    })
  }

  function getDateLabel(ts) {
    if (!ts) return ''
    var d = new Date(ts), today = new Date(), yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Bugun'
    if (d.toDateString() === yesterday.toDateString()) return 'Kecha'
    return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  function renderMessage(m, grouped) {
    if (m.deleted) {
      return '<div class="msg-wrapper msg-deleted" data-id="' + escId(m.id) + '"><div class="msg-body"><div class="msg-bubble msg-bubble-del"><span style="font-style:italic;font-size:12px;opacity:0.5">Xabar o\'chirildi</span></div></div></div>'
    }
    var isOwn = currentUser && m.fromId === currentUser.id
    var cls = isOwn ? 'msg own' : 'msg other'
    var avatar = m.fromAvatar && m.fromAvatar !== '?' ? m.fromAvatar : null
    var time = m.time ? new Date(m.time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : ''
    var fromId = m.fromId || ''
    var canClick = !isOwn && !!fromId
    var bodyHtml = ''
    if (m.replyTo) bodyHtml += '<div class="msg-reply-bar">↪ ' + window.escHtml(m.replyToName || 'Xabar') + ': ' + window.escHtml((m.replyText || '').slice(0, 50)) + '</div>'
    if (m.text) bodyHtml += '<div class="msg-text">' + linkify(window.escHtml(m.text)) + '</div>'
    if (m.media) {
      if (m.media.indexOf('data:audio') === 0) bodyHtml += '<div class="msg-audio"><button class="audio-play-btn" onclick="window.playAudio(\'' + escId(m.id) + '\',\'' + escId(currentRoomId) + '\',this)">▶</button><span class="audio-duration">Ovozli xabar</span></div>'
      else if (m.media.indexOf('data:image') === 0 || m.media.indexOf('blob:') === 0 || m.media.indexOf('http') === 0) bodyHtml += '<div class="msg-media"><img src="' + window.escHtml(m.media) + '" loading="lazy" onclick="window.openImageViewer(\'' + window.escHtml(m.media) + '\')" /></div>'
    }
    if (m.edited) bodyHtml += '<span class="edited-badge">tahrirlangan</span>'
    var reactHtml = ''
    for (var r = 0; r < REACTIONS.length; r++) reactHtml += '<button class="react-emoji" onclick="window.addReact(\'' + escId(m.id) + '\',\'' + escId(currentRoomId) + '\',\'' + REACTIONS[r] + '\')">' + REACTIONS[r] + '</button>'
    var hasPin = m.pinned
    return '<div class="' + cls + ' msg-wrapper' + (grouped ? ' grouped' : '') + '" data-id="' + escId(m.id) + '">' +
      (grouped ? '' : '<div class="msg-avatar' + (canClick ? ' clickable' : '') + '" style="' + (avatar ? 'background-image:' + cssUrl(avatar) + ';background-size:cover' : '') + '" onclick="' + (canClick ? 'window.showUserProfile(\'' + escId(fromId) + '\',event)' : '') + '">' + (avatar ? '' : (m.fromName ? window.escHtml(m.fromName[0].toUpperCase()) : '?')) + '</div>') +
      '<div class="msg-body">' + (isOwn || grouped ? '' : '<span class="msg-author' + (canClick ? ' clickable' : '') + '" onclick="' + (canClick ? 'window.showUserProfile(\'' + escId(fromId) + '\',event)' : '') + '">' + window.escHtml(m.fromName || 'Anon') + '</span>') +
      '<div class="' + (isOwn ? 'msg-bubble own' : 'msg-bubble') + (hasPin ? ' pinned' : '') + '">' + bodyHtml + (m.reaction ? '<div class="msg-reaction-bubble">' + window.escHtml(m.reaction) + '</div>' : '') + '</div>' +
      '<div class="msg-info"><span class="msg-time">' + time + '</span><div class="msg-actions">' +
      '<button class="msg-action-btn" onclick="window.startReply(\'' + escId(m.id) + '\',\'' + escId(currentRoomId) + '\')">↩️</button>' +
      '<button class="msg-action-btn" onclick="window.toggleReactions(\'' + escId(m.id) + '\')">👍</button>' +
      (isOwn ? '<button class="msg-action-btn" onclick="window.editMsg(\'' + escId(m.id) + '\',\'' + escId(currentRoomId) + '\')">✏️</button>' : '') +
      (isOwn ? '<button class="msg-action-btn" onclick="window.deleteMsg(\'' + escId(m.id) + '\',\'' + escId(currentRoomId) + '\')">🗑</button>' : '') +
      '<button class="msg-action-btn" onclick="window.showForwardModal(\'' + escId(m.id) + '\')">↗️</button>' +
      (isOwn ? '<button class="msg-action-btn" onclick="window.togglePin(\'' + escId(m.id) + '\',\'' + escId(currentRoomId) + '\',' + (!hasPin).toString() + ')">' + (hasPin ? '📌' : '📍') + '</button>' : '') +
      '</div></div><div class="msg-reactions" id="reactions-' + escId(m.id) + '">' + reactHtml + '</div></div></div>'
  }

  function linkify(text) { return text.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:underline">$1</a>') }

  window.playAudio = async function (msgId, roomId, btn) {
    btn.textContent = '⏳'
    try {
      var msg = await new Promise(function (resolve) {
        var unsub = DB.subscribeMessages(roomId, function (msgs) { unsub(); for (var i = 0; i < msgs.length; i++) { if (msgs[i].id === msgId) { resolve(msgs[i]); return } }; resolve(null) })
      })
      if (!msg || !msg.media) { btn.textContent = '▶'; return }
      if (msg.media.indexOf('data:audio') === 0 || msg.media.indexOf('blob:') === 0) {
        if (window._currentAudio && !window._currentAudio.paused) { window._currentAudio.pause(); window._currentAudio = null }
        var audio = new Audio(msg.media)
        window._currentAudio = audio
        try { await audio.play() } catch (e) { btn.textContent = '▶'; window._currentAudio = null; if (e.name !== 'AbortError') toast('Audio ijro etilmadi'); return }
        btn.textContent = '⏹'
        audio.onended = function () { btn.textContent = '▶'; window._currentAudio = null }
        audio.onerror = function () { btn.textContent = '▶'; window._currentAudio = null; toast('Audio xatolik') }
        return
      }
      btn.textContent = '▶'
    } catch (e) { btn.textContent = '▶'; window._currentAudio = null }
  }

  var reactionsOpen = {}
  window.toggleReactions = function (id) { var el = document.getElementById('reactions-' + id); if (!el) return; reactionsOpen[id] = !reactionsOpen[id]; el.style.display = reactionsOpen[id] ? 'flex' : 'none' }
  window.addReact = async function (msgId, roomId, emoji) { await DB.addReaction(roomId, msgId, emoji); var el = document.getElementById('reactions-' + msgId); if (el) el.style.display = 'none'; reactionsOpen[msgId] = false }
  window.deleteMsg = async function (id, roomId) { if (!id || !confirm("O'chirilsinmi?")) return; await DB.deleteMessage(roomId, id, true); toast("Xabar o'chirildi") }
  window.togglePin = async function (id, roomId, pin) { await DB.pinMessage(roomId, id, pin); toast(pin ? 'Pin qilindi' : 'Pin olib tashlandi') }

  window.startReply = function (id, roomId) {
    var m = null
    for (var i = 0; i < allMsgsCache.length; i++) { if (allMsgsCache[i].id === id) { m = allMsgsCache[i]; break } }
    if (!m) return
    replyTo = { id: id, name: m.fromName, text: (m.text || '(media)').slice(0, 100) }
    var bar = $('chatReplyBar')
    if (bar) {
      bar.style.display = 'flex'
      var rn = bar.querySelector('.chat-reply-name'); if (rn) rn.textContent = replyTo.name
      var rt = bar.querySelector('.chat-reply-text'); if (rt) rt.textContent = replyTo.text
    }
    var inp = $('chatInput'); if (inp) inp.focus()
  }

  function cancelReply() {
    replyTo = null
    var bar = $('chatReplyBar')
    if (bar) bar.style.display = 'none'
  }

  window.showForwardModal = function (id) {
    var m = null
    for (var i = 0; i < allMsgsCache.length; i++) { if (allMsgsCache[i].id === id) { m = allMsgsCache[i]; break } }
    if (!m) return
    var existing = document.getElementById('forwardModal')
    if (existing) existing.remove()
    var ov = document.createElement('div')
    ov.id = 'forwardModal'; ov.className = 'modal-overlay'
    ov.style.cssText = 'display:flex;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:1000'
    var html = '<div class="glass-card" style="padding:20px;width:300px;max-width:90vw;border-radius:16px"><h3 style="margin:0 0 12px;font-size:15px">Xabarni yo\'naltirish</h3><div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;padding:8px;background:var(--bg2);border-radius:8px">' + window.escHtml((m.text || '(media)').slice(0, 80)) + '</div><div class="forward-rooms" style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto">'
    html += '<button class="forward-room-btn" data-room="main"><span class="cli-avatar" style="width:28px;height:28px;font-size:12px;display:inline-flex">∞</span> Umumiy Chat</button>'
    for (var i = 0; i < allRooms.length; i++) {
      var r = allRooms[i]
      html += '<button class="forward-room-btn" data-room="' + r.id + '"><span class="cli-avatar" style="width:28px;height:28px;font-size:12px;display:inline-flex">#' + (r.name[0] || '#').toUpperCase() + '</span> ' + window.escHtml(r.name) + '</button>'
    }
    html += '</div><button id="forwardCancel" class="glass-btn glass-outline" style="width:100%;margin-top:12px">Bekor qilish</button></div>'
    ov.innerHTML = html
    document.body.appendChild(ov)
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove() })
    ov.querySelectorAll('.forward-room-btn').forEach(function (el) {
      el.addEventListener('click', async function () {
        var targetRoom = el.dataset.room
        if (!currentUser) return toast('Avval profilingizni yarating')
        try {
          await DB.sendMessage(targetRoom, { fromId: currentUser.id, fromName: currentUser.username, fromAvatar: currentUser.avatar || '', text: '↗️ ' + (m.text || ''), media: m.media || '', type: m.type || 'text', replyTo: '' })
          toast("Xabar yo'naltirildi")
        } catch (e) { toast('Xatolik') }
        ov.remove()
      })
    })
    document.getElementById('forwardCancel').addEventListener('click', function () { ov.remove() })
  }

  window.openImageViewer = function (src) {
    var ov = document.getElementById('imgViewer'), img = document.getElementById('imgViewerSrc')
    if (!ov || !img) return
    img.src = src; ov.style.display = 'flex'; requestAnimationFrame(function () { ov.classList.add('open') })
  }

  window.showUserProfile = function (userId, e) {
    if (!userId || !allUsers.length) return
    var user = null
    for (var i = 0; i < allUsers.length; i++) { if (allUsers[i].id === userId) { user = allUsers[i]; break } }
    if (!user) return
    var popup = document.getElementById('userProfilePopup')
    if (!popup) return
    var ae = document.getElementById('popupAvatar'), ne = document.getElementById('popupName')
    var be = document.getElementById('popupBio'), se = document.getElementById('popupStatus')
    if (ae) { if (user.avatar) { ae.textContent = ''; ae.style.backgroundImage = cssUrl(user.avatar); ae.style.backgroundSize = 'cover' } else { ae.textContent = (user.username || '?')[0].toUpperCase(); ae.style.backgroundImage = '' } }
    if (ne) ne.textContent = user.username || 'Unknown'
    if (be) be.textContent = user.bio || ''
    if (se) se.textContent = user.online ? 'online' : 'offline'
    var rect = (e && e.target) ? e.target.getBoundingClientRect() : null
    popup.style.display = 'block'; requestAnimationFrame(function () { popup.classList.add('open') })
    if (rect) {
      var left = rect.left + rect.width / 2 - 140; var top = rect.bottom + 8
      if (left < 10) left = 10
      if (top + 200 > window.innerHeight) top = rect.top - 220
      popup.style.left = left + 'px'; popup.style.top = top + 'px'
    } else { popup.style.left = '50%'; popup.style.top = '50%'; popup.style.transform = 'translate(-50%,-50%)' }
  }
  window.closeProfilePopup = function () {
    var popup = document.getElementById('userProfilePopup')
    if (popup) { popup.classList.remove('open'); popup.style.display = 'none' }
  }

  function openMediaGallery() {
    var existing = document.getElementById('mediaGalleryModal')
    if (existing) existing.remove()
    var images = []
    for (var i = 0; i < allMsgsCache.length; i++) { if (allMsgsCache[i].media && allMsgsCache[i].media.indexOf('data:image') === 0) images.push(allMsgsCache[i]) }
    if (!images.length) { toast('Rasmlar topilmadi'); return }
    var ov = document.createElement('div')
    ov.id = 'mediaGalleryModal'; ov.className = 'modal-overlay'
    ov.style.cssText = 'display:flex;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000'
    var html = '<div style="background:var(--bg1);border-radius:16px;padding:16px;width:90vw;max-width:600px;max-height:80vh;overflow-y:auto"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h3 style="margin:0;font-size:15px">📷 Rasmlar (' + images.length + ')</h3><button id="mediaGalleryClose" style="border:none;background:var(--bg2);color:var(--text);width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px">✕</button></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px">'
    for (var j = 0; j < images.length; j++) {
      html += '<img src="' + window.escHtml(images[j].media) + '" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;cursor:pointer" onclick="window.openImageViewer(\'' + window.escHtml(images[j].media) + '\')" />'
    }
    html += '</div></div>'
    ov.innerHTML = html
    document.body.appendChild(ov)
    document.getElementById('mediaGalleryClose').addEventListener('click', function () { ov.remove() })
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove() })
  }

  window.editMsg = function (id, roomId) {
    var el = document.querySelector('.msg-wrapper[data-id="' + escId(id) + '"] .msg-text')
    if (!el) return
    var oldText = el.textContent
    var input = document.createElement('input')
    input.type = 'text'; input.value = oldText; input.className = 'chat-edit-input'
    input.style.cssText = 'width:100%;padding:6px 10px;border-radius:8px;border:1px solid var(--accent);background:rgba(0,0,0,0.3);color:#fff;font-size:14px;font-family:inherit;outline:none'
    el.parentNode.replaceChild(input, el); input.focus(); input.select()
    function done() {
      var text = input.value.trim()
      if (text && text !== oldText) DB.editMessage(roomId, id, text).catch(function () {})
      var div = document.createElement('div'); div.className = 'msg-text'; div.textContent = oldText
      input.parentNode.replaceChild(div, input)
    }
    input.addEventListener('blur', done)
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); input.blur() }; if (e.key === 'Escape') { input.value = oldText; input.blur() } })
  }

  function setupInput() {
    var sendBtn = $('chatSendBtn'), input = $('chatInput'), mediaBtn = $('chatMediaBtn'), mediaInput = $('chatMediaInput'), voiceBtn = $('chatVoiceBtn')
    async function send() {
      var user = currentUser
      if (!user) return toast('Avval profilingizni yarating')
      if (!input) return
      var text = input.value.trim()
      if (!text && !replyTo) return
      var payload = { fromId: user.id, fromName: user.username, fromAvatar: user.avatar || '', text: text }
      if (replyTo) { payload.replyTo = replyTo.id; payload.replyToName = replyTo.name; payload.replyText = replyTo.text }
      try { await DB.sendMessage(currentRoomId, payload); input.value = ''; input.style.height = 'auto'; cancelReply(); stopTyping() } catch (e) { toast('Xabar yuborilmadi.') }
    }
    function startTyping() { if (!currentUser) return; DB.setTyping(currentRoomId, currentUser.id, currentUser.username, true); if (typingTimer) clearTimeout(typingTimer); typingTimer = setTimeout(stopTyping, 2000) }
    function stopTyping() { if (typingTimer) { clearTimeout(typingTimer); typingTimer = null }; if (currentUser) DB.setTyping(currentRoomId, currentUser.id, currentUser.username, false) }
    if (sendBtn) sendBtn.addEventListener('click', send)
    if (input) {
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } })
      input.addEventListener('input', function () { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 100) + 'px'; startTyping() })
    }
    if (mediaBtn && mediaInput) {
      mediaBtn.addEventListener('click', function () { mediaInput.click() })
      mediaInput.addEventListener('change', async function (e) {
        var f = e.target.files ? e.target.files[0] : null
        if (!f) return; if (!currentUser) return toast('Avval profilingizni yarating')
        if (f.size > 2097152) return toast("Rasm hajmi 2 MB dan kichik bo'lishi kerak")
        try {
          var dataUrl = await new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result) }; r.onerror = rej; r.readAsDataURL(f) })
          await DB.sendMessage(currentRoomId, { fromId: currentUser.id, fromName: currentUser.username, fromAvatar: currentUser.avatar || '', text: '', media: dataUrl })
        } catch (e) { toast('Rasm yuborilmadi.') }
        mediaInput.value = ''
      })
    }
    if (voiceBtn) {
      var mediaRecorder = null, audioChunks = [], recording = false, voiceStream = null
      voiceBtn.addEventListener('click', async function () {
        if (recording) { if (mediaRecorder) mediaRecorder.stop(); recording = false; voiceBtn.classList.remove('recording'); return }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return toast("Ovoz yozish qo'llab-quvvatlanmaydi")
        try {
          voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true })
          var mimeOpts = {}
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeOpts.mimeType = 'audio/webm;codecs=opus'
          else if (MediaRecorder.isTypeSupported('audio/webm')) mimeOpts.mimeType = 'audio/webm'
          else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeOpts.mimeType = 'audio/mp4'
          else if (MediaRecorder.isTypeSupported('audio/aac')) mimeOpts.mimeType = 'audio/aac'
          mediaRecorder = new MediaRecorder(voiceStream, mimeOpts); audioChunks = []
          mediaRecorder.ondataavailable = function (e) { if (e.data.size > 0) audioChunks.push(e.data) }
          var user = currentUser
          mediaRecorder.onstop = async function () {
            if (voiceStream) { voiceStream.getTracks().forEach(function (t) { t.stop() }); voiceStream = null }
            if (!user || !audioChunks.length) return
            var mimeType = mediaRecorder.mimeType || 'audio/webm'
            var blob = new Blob(audioChunks, { type: mimeType }); var reader = new FileReader()
            reader.onload = async function () { var b = reader.result; if (b && b.length > 9000000) { toast('Ovoz xabari juda katta'); return }; try { await DB.sendMessage(currentRoomId, { fromId: user.id, fromName: user.username, fromAvatar: user.avatar || '', text: '', media: b }) } catch (e) { toast('Ovoz yuborilmadi.') } }
            reader.readAsDataURL(blob)
          }
          mediaRecorder.start(); recording = true; voiceBtn.classList.add('recording')
        } catch (e) {
          if (e.name === 'NotAllowedError') toast("Mikrofon ruxsati yo'q")
          else if (e.message && e.message.indexOf('MIME') >= 0) toast("Ovoz formati qo'llab-quvvatlanmaydi")
          else toast('Ovoz yozilmadi: ' + (e.message || 'xatolik'))
        }
      })
    }
    var cancelBtn = $('chatReplyCancel')
    if (cancelBtn) cancelBtn.addEventListener('click', cancelReply)
  }

  function setupOnline() {
    usersUnsub = DB.getAllUsers(function (users) {
      allUsers = users
      var uid = currentUser ? currentUser.id : null, count = 0
      for (var i = 0; i < users.length; i++) { if (users[i].online && users[i].id !== uid) count++ }
      if (uid) count++
      var el = $('onlineCount')
      if (el) el.textContent = count + ' online'
      if (window.updateOnlineBadge) window.updateOnlineBadge(count)
      if (currentRoomId !== 'main') { var se = $('chatRoomStatus'); if (se) { var other = getRoomOtherUser(); if (other) se.textContent = other.online ? 'online' : 'offline' } }
    })
    window.addEventListener('beforeunload', function () { if (currentUser) DB.updateUser(currentUser.id, { online: false }).catch(function () {}) })
  }

  function setupRooms() { roomsUnsub = DB.subscribeRooms(function (rooms) { allRooms = rooms }) }

  function setupSaveHandler() {
    var saveBtn = $('setupSave')
    if (!saveBtn) return
    saveBtn.addEventListener('click', async function () {
      var nameInput = $('setupName'), avatarEl = $('setupAvatar'), bioInput = $('setupBio')
      if (!nameInput) return
      var name = nameInput.value.trim()
      if (!name) return toast('Username kiriting')
      var avatar = (!avatarEl || avatarEl.textContent === '?') ? '' : avatarEl.textContent
      var bio = bioInput ? bioInput.value.trim() : ''
      if (currentUser) {
        try { await DB.updateUser(currentUser.id, { username: name, bio: bio, avatar: avatar }) } catch (e) {}
        currentUser = { id: currentUser.id, username: name, bio: bio, avatar: avatar, aura: currentUser.aura, created: currentUser.created, online: true }
        localStorage.setItem(CACHE_KEY, JSON.stringify(currentUser)); closeModalEl(); updateSidebarUser(currentUser); return
      }
      try {
        var exists = await DB.usernameExists(name)
        if (exists) return toast('Bu username band. Boshqasini tanlang.')
        var user = await DB.createUser({ username: name, bio: bio, avatar: avatar })
        currentUser = user; localStorage.setItem('xolerc_uid', user.id); localStorage.setItem(CACHE_KEY, JSON.stringify(user))
        closeModalEl(); updateSidebarUser(user); renderSidebar()
      } catch (e) { toast('Serverga ulanishda xatolik.') }
    })
  }

  function initUserFlow() {
    var cachedRaw = localStorage.getItem(CACHE_KEY), uid = localStorage.getItem('xolerc_uid'), cachedUser = null
    if (cachedRaw && uid) { try { var p = JSON.parse(cachedRaw); if (p && p.id === uid) cachedUser = p } catch (e) {} }
    if (cachedUser) {
      currentUser = cachedUser; closeModalEl(); updateSidebarUser(cachedUser); renderSidebar(); hideLoading(); hideChatLoader()
      DB.updateUser(cachedUser.id, { online: true }).catch(function () {}); return
    }
    showChatLoader()
    var timer = setTimeout(function () { openModal(); hideLoading(); hideChatLoader() }, 6000)
    ;(async function () {
      try { var user = await ensureUser(); clearTimeout(timer); if (user) { closeModalEl(); updateSidebarUser(user); renderSidebar() } else openModal() } catch (e) { console.error('Init error:', e) } finally { hideLoading(); hideChatLoader() }
    })()
  }

  function setupEditProfile() {
    var editBtn = $('editProfileBtn')
    if (!editBtn) return
    editBtn.addEventListener('click', function () {
      openModal(); var saveBtn = $('setupSave'); if (saveBtn) saveBtn.textContent = 'Saqlash'
      var ni = $('setupName'), bi = $('setupBio'), ae = $('setupAvatar')
      if (currentUser) { if (ni) ni.value = currentUser.username || ''; if (bi) bi.value = currentUser.bio || ''; if (ae) ae.textContent = currentUser.avatar || '?' }
    })
  }

  function setupAvatarUpload() {
    var input = $('setupAvatarInput')
    if (!input) return
    input.addEventListener('change', function (e) {
      var f = e.target.files ? e.target.files[0] : null
      if (!f) return
      var r = new FileReader(); var ae = $('setupAvatar')
      r.onload = function () { if (ae) { ae.textContent = ''; ae.style.backgroundImage = cssUrl(r.result); ae.style.backgroundSize = 'cover' } }
      r.readAsDataURL(f)
    })
  }

  function setupBackButton() { var bb = $('chatBackBtn'); if (bb) bb.addEventListener('click', showListView) }
  function setupRoomInfoBtn() {
    var btn = $('chatRoomInfoBtn')
    if (!btn) return
    btn.addEventListener('click', function () {
      var sw = $('chatSearchWrap')
      if (sw) {
        if (sw.style.display === 'none' || !sw.style.display) { sw.style.display = 'block'; var inp = $('chatSearch'); if (inp) { inp.value = ''; inp.focus() } }
        else { sw.style.display = 'none'; var inp2 = $('chatSearch'); if (inp2) inp2.value = ''; document.querySelectorAll('.msg-wrapper').forEach(function (el) { el.style.display = '' }) }
      }
    })
  }
  function setupMediaGalleryBtn() {
    var btn = $('chatMediaGalleryBtn')
    if (btn) btn.addEventListener('click', openMediaGallery)
  }
  function setupModalClose() { var m = $('setupModal'); if (m) m.addEventListener('click', function (e) { if (e.target === e.currentTarget) closeModalEl() }); var cb = $('setupModalClose'); if (cb) cb.addEventListener('click', closeModalEl) }

  function setupSearch() {
    var input = $('chatSearch')
    if (!input) return
    var timer = null
    input.addEventListener('input', function () {
      if (timer) clearTimeout(timer)
      timer = setTimeout(function () {
        var q = input.value.trim().toLowerCase()
        if (!q) { document.querySelectorAll('.msg-wrapper').forEach(function (el) { el.style.display = '' }); return }
        document.querySelectorAll('.msg-wrapper').forEach(function (el) {
          var text = el.querySelector('.msg-text')
          if (text && text.textContent.toLowerCase().includes(q)) el.style.display = ''
          else el.style.display = 'none'
        })
      }, 300)
    })
  }

  document.addEventListener('click', function (e) {
    var popup = document.getElementById('userProfilePopup')
    if (popup && popup.classList.contains('open') && !popup.contains(e.target) && !e.target.closest('.msg-avatar') && !e.target.closest('.msg-author')) {
      popup.classList.remove('open'); popup.style.display = 'none'
    }
  })
  window.initChat = function () { setupBackButton(); setupRoomInfoBtn(); setupMediaGalleryBtn(); setupModalClose(); setupEditProfile(); setupAvatarUpload(); setupSaveHandler(); setupInput(); setupOnline(); setupRooms(); setupSearch(); initUserFlow() }
})()
