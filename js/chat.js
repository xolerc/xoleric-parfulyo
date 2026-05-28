/* ============================================================
   XOLERIC ∞ — Chat Module (xoleric-chat compatible)
   Single global chat using /messages/main/
   ============================================================ */
const REACTIONS = ['👍', '❤️', '😊', '😂', '😮', '😢', '🙏', '🔥', '🎉', '💯'];
const CACHE_KEY = 'xolerc_user';
const MAIN_CHAT = 'main';

let currentUser = null;
let unsub = null;
let onlineUsers = {};
let initResolved = false;
let dbOnline = false;

/* ===== DOM refs ===== */
const $ = id => document.getElementById(id);
const chatListView = $('chatListView');
const chatRoomView = $('chatRoomView');
const chatMessages = $('chatMessages');
const chatInput = $('chatInput');
const chatSendBtn = $('chatSendBtn');
const chatMediaBtn = $('chatMediaBtn');
const chatVoiceBtn = $('chatVoiceBtn');
const chatMediaInput = $('chatMediaInput');
const sidebarChats = $('sidebarChats');
const chatBackBtn = $('chatBackBtn');
const chatRoomName = $('chatRoomName');
const chatRoomStatus = $('chatRoomStatus');
const chatRoomAvatar = $('chatRoomAvatar');
const chatInputArea = $('chatInputArea');
const chatJoinArea = $('chatJoinArea');

/* ===== Navigation ===== */
function showRoomView() {
  chatListView.style.display = 'none';
  chatRoomView.style.display = 'flex';
}

function showListView() {
  chatRoomView.style.display = 'none';
  chatListView.style.display = 'flex';
  if (unsub) { unsub(); unsub = null; }
  renderSidebar();
}

chatBackBtn.addEventListener('click', showListView);

/* ===== DB helpers ===== */
async function dbPing() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    await fetch(DB_URL + '/.json?shallow=true', { signal: ctrl.signal, cache: 'no-store' });
    clearTimeout(t);
    dbOnline = true;
    return true;
  } catch {
    dbOnline = false;
    return false;
  }
}

function showServerOffline() {
  chatMessages.innerHTML = '<div class="chat-empty" style="padding:60px 20px">' +
    '<div style="font-size:32px;margin-bottom:12px;opacity:0.2">!</div>' +
    '<div style="font-size:14px;font-weight:600;margin-bottom:6px">Server hozircha mavjud emas</div>' +
    '<div style="font-size:11px;color:var(--text-muted);margin-bottom:16px">Keyinroq qayta urinib ko\'ring</div>' +
    '<button class="glass-btn" onclick="location.reload()">Qayta ulanish</button></div>';
  chatInputArea.style.display = 'none';
  chatJoinArea.style.display = 'none';
}

function hideLoading() {
  const o = $('loadingOverlay');
  if (o) { o.classList.add('fade-out'); setTimeout(() => { o.style.display = 'none'; }, 500); }
}

function hideChatLoader() {
  const l = $('chatLoader');
  if (l) l.classList.add('hidden');
}

function showChatLoader() {
  const l = $('chatLoader');
  if (l) l.classList.remove('hidden');
}

async function ensureUser() {
  const uid = localStorage.getItem('xolerc_uid');
  if (uid) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const user = await DB.getUser(uid, ctrl.signal);
      clearTimeout(t);
      if (user && user.id) { currentUser = user; localStorage.setItem(CACHE_KEY, JSON.stringify(user)); return user; }
    } catch {}
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try { const p = JSON.parse(cached); if (p && p.id === uid) { currentUser = p; return p; } } catch {}
    }
  }
  return null;
}

(function init() {
  const cachedRaw = localStorage.getItem(CACHE_KEY);
  const uid = localStorage.getItem('xolerc_uid');
  let cachedUser = null;
  if (cachedRaw && uid) {
    try { const p = JSON.parse(cachedRaw); if (p && p.id === uid) cachedUser = p; } catch {}
  }
  if (cachedUser) {
    currentUser = cachedUser;
    $('setupModal').style.display = 'none';
    updateSidebarUser(cachedUser);
    renderSidebar();
    hideLoading();
    hideChatLoader();
    DB.updateUser(cachedUser.id, { online: true }).catch(() => {});
    initResolved = true;
    return;
  }

  showChatLoader();
  const safetyTimer = setTimeout(() => {
    const m = $('setupModal');
    if (m) { m.style.display = 'flex'; hideLoading(); hideChatLoader(); }
  }, 6000);

  (async () => {
    try {
      await dbPing();
      const user = await ensureUser();
      clearTimeout(safetyTimer);
      if (user) {
        $('setupModal').style.display = 'none';
        updateSidebarUser(user);
        renderSidebar();
      } else {
        $('setupModal').style.display = 'flex';
      }
    } catch (e) {
      if (e && e.name !== 'AbortError') console.error('Init error:', e);
    } finally {
      hideLoading();
      hideChatLoader();
      initResolved = true;
    }
  })();
})();

$('setupSave').addEventListener('click', async () => {
  const name = $('setupName').value.trim();
  if (!name) return alert('Username kiriting');
  const avatar = $('setupAvatar').textContent === '?' ? '' : $('setupAvatar').textContent;
  const bio = $('setupBio').value.trim();
  if (currentUser) {
    try { await DB.updateUser(currentUser.id, { username: name, bio, avatar }); } catch {}
    currentUser = { ...currentUser, username: name, bio, avatar };
    localStorage.setItem(CACHE_KEY, JSON.stringify(currentUser));
    $('setupModal').style.display = 'none';
    updateSidebarUser(currentUser);
    return;
  }
  try {
    const exists = await DB.usernameExists(name);
    if (exists) return alert('Bu username band. Boshqasini tanlang.');
    const user = await DB.createUser({ username: name, bio, avatar });
    currentUser = user;
    localStorage.setItem('xolerc_uid', user.id);
    localStorage.setItem(CACHE_KEY, JSON.stringify(user));
    $('setupModal').style.display = 'none';
    updateSidebarUser(user);
    renderSidebar();
  } catch {
    alert('Serverga ulanishda xatolik. Keyinroq qayta urinib ko\'ring.');
  }
});

$('editProfileBtn').addEventListener('click', () => {
  const m = $('setupModal');
  m.style.display = 'flex';
  $('setupSave').textContent = 'Saqlash';
  if (currentUser) {
    $('setupName').value = currentUser.username || '';
    $('setupBio').value = currentUser.bio || '';
    $('setupAvatar').textContent = currentUser.avatar || '?';
  }
});

$('setupAvatarInput').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { $('setupAvatar').textContent = ''; $('setupAvatar').style.backgroundImage = `url(${r.result})`; $('setupAvatar').style.backgroundSize = 'cover'; };
  r.readAsDataURL(f);
});

$('setupModal').addEventListener('click', e => { if (e.target === e.currentTarget) e.target.style.display = 'none'; });

function updateSidebarUser(user) {
  $('sidebarName').textContent = user.username || 'User';
  $('sidebarStatus').textContent = 'online';
  const sa = $('sidebarAvatar');
  if (user.avatar) {
    sa.textContent = '';
    sa.style.backgroundImage = `url(${user.avatar})`;
    sa.style.backgroundSize = 'cover';
  } else {
    sa.textContent = (user.username || '?')[0].toUpperCase();
    sa.style.backgroundImage = '';
  }
}

/* ===== Sidebar — Single global chat entry ===== */
function renderSidebar() {
  sidebarChats.innerHTML =
    '<div class="chat-list-item" id="mainChatEntry" style="cursor:pointer">' +
      '<div class="cli-avatar">∞</div>' +
      '<div class="cli-info">' +
        '<span class="cli-name">Umumiy Chat</span>' +
        '<span class="cli-msg">Barcha xabarlar</span>' +
      '</div>' +
    '</div>';
  const entry = $('mainChatEntry');
  if (entry) entry.addEventListener('click', openMainChat);
}

/* ===== Open Main Chat ===== */
async function openMainChat() {
  if (unsub) { unsub(); unsub = null; }

  chatRoomName.textContent = 'Umumiy Chat';
  chatRoomStatus.textContent = 'online';
  chatRoomAvatar.textContent = '∞';
  chatJoinArea.style.display = 'none';
  chatInputArea.style.display = 'flex';
  showRoomView();

  chatMessages.innerHTML = '<div class="chat-loading"><div class="mini-loader"></div> Xabarlar yuklanmoqda...</div>';
  try {
    const msgs = await DB.getMessages();
    renderMessages(msgs);
    unsub = DB.subscribe(renderMessages);
  } catch {
    chatMessages.innerHTML = '<div class="chat-empty">Xabarlarni yuklashda xatolik</div>';
  }
}

window.openMainChat = openMainChat;

function renderMessages(msgs) {
  chatMessages.innerHTML = msgs.map((m, i) => {
    const showDate = i === 0 || new Date(msgs[i - 1]?.time).toDateString() !== new Date(m.time).toDateString();
    return (showDate ? '<div class="date-sep"><span>' + getDateLabel(m.time) + '</span></div>' : '') + renderMessage(m);
  }).join('');
  requestAnimationFrame(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

function getDateLabel(ts) {
  if (!ts) return '';
  const d = new Date(ts), today = new Date(), yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Bugun';
  if (d.toDateString() === yesterday.toDateString()) return 'Kecha';
  return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

function esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

/* ===== Message Bubble ===== */
function renderMessage(m) {
  const isOwn = m.fromId === currentUser?.id;
  const cls = isOwn ? 'msg own' : 'msg other';
  const avatar = m.fromAvatar && m.fromAvatar !== '?' ? m.fromAvatar : null;
  const time = m.time ? new Date(m.time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '';
  const fromId = m.fromId || '';
  const canClick = !isOwn && fromId;

  let bodyHtml = '';
  if (m.text) {
    bodyHtml += '<div class="msg-text">' + esc(m.text) + '</div>';
  }
  if (m.media && m.media.startsWith('data:audio')) {
    bodyHtml += '<div class="msg-audio"><button class="audio-play-btn" onclick="playAudio(\'' + m.id + '\', this)">▶</button><span class="audio-duration">Ovozli xabar</span></div>';
  } else if (m.media && (m.media.startsWith('data:image') || m.media.startsWith('data:video') || m.media.startsWith('blob:'))) {
    bodyHtml += '<div class="msg-media"><img src="' + m.media + '" loading="lazy" onclick="window.open(\'' + m.media + '\',\'_blank\')" /></div>';
  } else if (m.media && m.media.startsWith('http')) {
    bodyHtml += '<div class="msg-media"><img src="' + m.media + '" loading="lazy" onclick="window.open(\'' + m.media + '\',\'_blank\')" /></div>';
  }
  if (m.replyTo) {
    bodyHtml = '<div class="msg-reply-bar">↪ ' + esc(m.replyToName || 'Xabar') + '</div>' + bodyHtml;
  }
  if (m.edited) {
    bodyHtml += '<span class="edited-badge">tahrirlangan</span>';
  }

  return '<div class="' + cls + ' msg-wrapper" data-id="' + (m.id || '') + '">' +
    '<div class="msg-avatar' + (canClick ? ' clickable' : '') + '" style="' + (avatar ? 'background-image:url(' + avatar + ');background-size:cover' : '') + '">' + (avatar ? '' : (m.fromName ? m.fromName[0].toUpperCase() : '?')) + '</div>' +
    '<div class="msg-body">' +
    (isOwn ? '' : '<span class="msg-author">' + esc(m.fromName || 'Anon') + '</span>') +
    '<div class="' + (isOwn ? 'msg-bubble own' : 'msg-bubble') + '">' + bodyHtml +
    (m.reaction ? '<div class="msg-reaction-bubble">' + m.reaction + '</div>' : '') +
    '</div>' +
    '<div class="msg-info">' +
      '<span class="msg-time">' + time + '</span>' +
      '<div class="msg-actions">' +
        '<button class="msg-action-btn" onclick="toggleReactions(\'' + m.id + '\')">😊</button>' +
        (isOwn ? '<button class="msg-action-btn" onclick="deleteMsg(\'' + m.id + '\')">🗑</button>' : '') +
      '</div>' +
    '</div>' +
    '<div class="msg-reactions" id="reactions-' + m.id + '">' +
    REACTIONS.map(r => '<button class="react-emoji" onclick="addReact(\'' + m.id + '\',\'' + r + '\')">' + r + '</button>').join('') +
    '</div>' +
    '</div></div>';
}

/* Audio playback */
const audioCache = {};
window.playAudio = async function(msgId, btn) {
  if (audioCache[msgId]) {
    audioCache[msgId].currentTime = 0;
    audioCache[msgId].play();
    btn.textContent = '⏹';

    setTimeout(() => {
      audioCache[msgId].play();
    }, 100);
    return;
  }
  btn.textContent = '⏳';
  try {
    const msgs = await DB.getMessages();
    const msg = msgs.find(x => x.id === msgId);
    if (!msg || !msg.media) { btn.textContent = '▶'; return; }

    if (msg.media.startsWith('blob:') || msg.media.startsWith('data:audio')) {
      const audio = new Audio(msg.media);
      audioCache[msgId] = audio;
      audio.play();
      btn.textContent = '⏹';
      audio.onended = () => { btn.textContent = '▶'; };
      audio.onerror = () => { btn.textContent = '▶'; };
      return;
    }

    btn.textContent = '▶';
  } catch {
    btn.textContent = '▶';
  }
};

const reactionsOpen = {};
window.toggleReactions = function(id) {
  const el = $('reactions-' + id);
  if (!el) return;
  reactionsOpen[id] = !reactionsOpen[id];
  el.style.display = reactionsOpen[id] ? 'flex' : 'none';
};

window.addReact = async function(msgId, emoji) {
  await DB.addReaction(msgId, emoji);
  const el = $('reactions-' + msgId);
  if (el) el.style.display = 'none';
  reactionsOpen[msgId] = false;
};

window.deleteMsg = async function(id) {
  if (!id || !confirm("O'chirilsinmi?")) return;
  await DB.deleteMessage(id);
};

/* ===== Send Message ===== */
(function setupInput() {
  async function send() {
    if (!currentUser) return;
    if (!dbOnline && !currentUser) return alert('Server hozircha mavjud emas.');
    const text = chatInput.value.trim();
    if (!text) return;
    try {
      await DB.sendMessage({
        fromId: currentUser.id, fromName: currentUser.username,
        fromAvatar: currentUser.avatar || '', text,
      });
      chatInput.value = ''; chatInput.style.height = 'auto';
    } catch {
      alert('Xabar yuborilmadi.');
    }
  }

  chatSendBtn.addEventListener('click', send);
  chatInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  chatInput.addEventListener('input', () => { chatInput.style.height = 'auto'; chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px'; });

  /* Image picker */
  chatMediaBtn.addEventListener('click', () => chatMediaInput.click());
  chatMediaInput.addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    if (!currentUser) return alert('Avval profilingizni yarating');
    try {
      const dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
      await DB.sendMessage({
        fromId: currentUser.id, fromName: currentUser.username,
        fromAvatar: currentUser.avatar || '', text: '', media: dataUrl,
      });
    } catch {
      alert('Rasm yuborilmadi.');
    }
    chatMediaInput.value = '';
  });
})();

/* ===== Voice Recording ===== */
(function setupVoice() {
  let mediaRecorder = null;
  let audioChunks = [];
  let recording = false;

  chatVoiceBtn.addEventListener('click', async () => {
    if (recording) {
      mediaRecorder.stop();
      recording = false;
      chatVoiceBtn.classList.remove('recording');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      return alert('Ovoz yozish qo\'llab-quvvatlanmaydi');
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunks = [];
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (!currentUser || !audioChunks.length) return;
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result;
          try {
            await DB.sendMessage({
              fromId: currentUser.id, fromName: currentUser.username,
              fromAvatar: currentUser.avatar || '', text: '', media: base64,
            });
          } catch {
            alert('Ovoz yuborilmadi.');
          }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorder.start();
      recording = true;
      chatVoiceBtn.classList.add('recording');
    } catch {
      alert('Mikrofon ruxsati yo\'q');
    }
  });
})();

/* ===== Online Users ===== */
(function setupOnline() {
  async function refresh() {
    try {
      const users = await DB.getAllUsers();
      const online = users.filter(u => u.online && u.id !== currentUser?.id);
      onlineUsers = {};
      online.forEach(u => { onlineUsers[u.id] = u; });
      const count = online.length + (currentUser ? 1 : 0);
      $('onlineCount').textContent = count + ' online';
      if (window.updateOnlineBadge) window.updateOnlineBadge(count);
    } catch {}
  }
  refresh();
  setInterval(refresh, 10000);
  window.addEventListener('beforeunload', () => {
    if (currentUser) DB.updateUser(currentUser.id, { online: false });
  });
})();

/* ===== Cleanup old conversation UI buttons ===== */
/* createChannelBtn, createGroupBtn, createPrivateBtn still exist in HTML but are hidden/no-op */
