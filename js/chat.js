const REACTIONS = ['👍', '❤️', '😊', '😂', '😮', '😢', '🙏', '🔥', '🎉', '💯'];
const CACHE_KEY = 'xolerc_user';

let currentUser = null;
let unsubscribers = {};
let currentConvId = null;
let onlineUsers = {};
let initResolved = false;

async function dbPing() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    await fetch(DB_URL + '/.json?shallow=true', { signal: ctrl.signal, cache: 'no-store' });
    clearTimeout(t);
    return true;
  } catch { return false; }
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.add('fade-out');
    setTimeout(() => { overlay.style.display = 'none'; }, 500);
  }
}

function hideChatLoader() {
  const loader = document.getElementById('chatLoader');
  if (loader) loader.classList.add('hidden');
}

function showChatLoader() {
  const loader = document.getElementById('chatLoader');
  if (loader) loader.classList.remove('hidden');
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
    document.getElementById('setupModal').style.display = 'none';
    updateSidebarUser(cachedUser);
    document.getElementById('sidebarChats').innerHTML = '<div class="conv-empty">Yuklanmoqda...</div>';
    hideLoading();
    hideChatLoader();
    DB.updateUser(cachedUser.id, { online: true }).catch(() => {});
    DB.migrateOldMessages().catch(() => {});
    loadConversations().catch(() => {});
    initResolved = true;
    return;
  }

  showChatLoader();
  const safetyTimer = setTimeout(() => {
    const m = document.getElementById('setupModal');
    if (m) { m.style.display = 'flex'; hideLoading(); hideChatLoader(); }
  }, 6000);

  (async () => {
    try {
      await dbPing();
      const user = await ensureUser();
      clearTimeout(safetyTimer);

      if (user) {
        document.getElementById('setupModal').style.display = 'none';
        updateSidebarUser(user);
        await loadConversations();
        const items = document.querySelectorAll('.chat-list-item');
        if (items.length > 0) items[0].click();
      } else {
        document.getElementById('setupModal').style.display = 'flex';
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

document.getElementById('setupSave').addEventListener('click', async () => {
  const name = document.getElementById('setupName').value.trim();
  if (!name) return alert('Username kiriting');
  const avatar = document.getElementById('setupAvatar').textContent === '?' ? '' : document.getElementById('setupAvatar').textContent;
  const bio = document.getElementById('setupBio').value.trim();
  if (currentUser) {
    await DB.updateUser(currentUser.id, { username: name, bio, avatar });
    currentUser = { ...currentUser, username: name, bio, avatar };
    localStorage.setItem(CACHE_KEY, JSON.stringify(currentUser));
    document.getElementById('setupModal').style.display = 'none';
    updateSidebarUser(currentUser);
    return;
  }
  const exists = await DB.usernameExists(name);
  if (exists) return alert('Bu username band. Boshqasini tanlang.');
  const user = await DB.createUser({ username: name, bio, avatar });
  currentUser = user;
  localStorage.setItem('xolerc_uid', user.id);
  localStorage.setItem(CACHE_KEY, JSON.stringify(user));
  document.getElementById('setupModal').style.display = 'none';
  updateSidebarUser(user);
  await DB.migrateOldMessages();
  await loadConversations();
});

document.getElementById('editProfileBtn').addEventListener('click', () => {
  const m = document.getElementById('setupModal');
  m.style.display = 'flex';
  document.getElementById('setupSave').textContent = 'Saqlash';
  if (currentUser) {
    document.getElementById('setupName').value = currentUser.username || '';
    document.getElementById('setupBio').value = currentUser.bio || '';
    document.getElementById('setupAvatar').textContent = currentUser.avatar || '?';
  }
});

const setupAvatarInput = document.getElementById('setupAvatarInput');
const setupAvatar = document.getElementById('setupAvatar');
setupAvatarInput.addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { setupAvatar.textContent = ''; setupAvatar.style.backgroundImage = `url(${r.result})`; setupAvatar.style.backgroundSize = 'cover'; };
  r.readAsDataURL(f);
});

// Close modals on overlay click
document.getElementById('createModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) e.target.style.display = 'none';
});
document.getElementById('setupModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) e.target.style.display = 'none';
});

function updateSidebarUser(user) {
  document.getElementById('sidebarName').textContent = user.username || 'User';
  document.getElementById('sidebarStatus').textContent = 'online';
  const sa = document.getElementById('sidebarAvatar');
  if (user.avatar) {
    sa.textContent = '';
    sa.style.backgroundImage = `url(${user.avatar})`;
    sa.style.backgroundSize = 'cover';
  } else {
    sa.textContent = (user.username || '?')[0].toUpperCase();
    sa.style.backgroundImage = '';
  }
}

// ===== CONVERSATIONS =====
async function loadConversations() {
  const convs = await DB.getConversations();
  renderConversationList(convs);
}

function renderConversationList(convs) {
  const container = document.getElementById('sidebarChats');
  const uid = currentUser?.id;
  const channels = convs.filter(c => c.type === 'channel');
  const groups = convs.filter(c => c.type === 'group');
  const privates = convs.filter(c => c.type === 'private' && c.members && uid && c.members[uid]);

  let html = '';

  if (channels.length) {
    html += '<div class="conv-group-label">KANALLAR</div>';
    html += channels.map(c => convItem(c)).join('');
  }

  if (groups.length) {
    html += '<div class="conv-group-label">GURUHLAR</div>';
    html += groups.map(c => convItem(c)).join('');
  }

  if (privates.length) {
    html += '<div class="conv-group-label">SHAXSIY</div>';
    html += privates.map(c => convItem(c)).join('');
  }

  if (!html) {
    html = '<div class="conv-empty">Hali hech qanday chat mavjud emas.<br>Yangi kanal yoki guruh yarating.</div>';
  }

  container.innerHTML = html;

  container.querySelectorAll('.chat-list-item').forEach(el => {
    el.addEventListener('click', () => openConversation(el.dataset.convId));
  });
}

function convItem(c) {
  const name = c.name || 'Isimsiz';
  return '<div class="chat-list-item' + (currentConvId === c.id ? ' active' : '') + '" data-conv-id="' + c.id + '">' +
    '<div class="cli-avatar">' + (c.type === 'channel' ? '#' : c.type === 'group' ? '&' : '@') + '</div>' +
    '<div class="cli-info">' +
      '<span class="cli-name">' + esc(name) + '</span>' +
      '<span class="cli-msg">' + (c.desc ? esc(c.desc.slice(0, 30)) : (c.type === 'channel' ? 'Kanal' : c.type === 'group' ? 'Guruh' : 'Shaxsiy')) + '</span>' +
    '</div>' +
    '<button class="cli-del-btn" onclick="deleteConversation(event, \'' + c.id + '\')" title="O\'chirish"></button></div>';
}

window.deleteConversation = async function(e, convId) {
  e.stopPropagation();
  if (!confirm("Konversiyani o'chirishni xohlaysizmi?")) return;
  await DB.deleteConversation(convId);
  if (currentConvId === convId) {
    currentConvId = null;
    document.getElementById('chatMessages').innerHTML = '<div class="chat-empty">Konversiyani tanlang</div>';
    document.getElementById('chatInputArea').style.display = 'none';
    document.getElementById('chatJoinArea').style.display = 'none';
    document.getElementById('chatHeaderName').textContent = 'Xoleric Chat';
    document.getElementById('chatHeaderMeta').textContent = 'super chat';
  }
  await loadConversations();
};

// ===== OPEN CONVERSATION =====
async function openConversation(convId) {
  if (currentConvId === convId) return;
  currentConvId = convId;
  document.querySelectorAll('.chat-list-item').forEach(el => el.classList.toggle('active', el.dataset.convId === convId));

  Object.values(unsubscribers).forEach(fn => fn());
  unsubscribers = {};

  const conv = await DB.getConversation(convId);
  if (!conv) return;

  const isMember = conv.members && conv.members[currentUser?.id];
  const isOwner = conv.ownerId === currentUser?.id;
  const header = document.getElementById('chatHeaderName');
  const joinArea = document.getElementById('chatJoinArea');
  const inputArea = document.getElementById('chatInputArea');
  const messagesEl = document.getElementById('chatMessages');

  header.textContent = conv.name || 'Isimsiz';

  if (!isMember && conv.type !== 'private') {
    joinArea.style.display = 'flex';
    inputArea.style.display = 'none';
    joinArea.innerHTML = '<button class="glass-btn" onclick="joinConversation(\'' + convId + '\')">Qo\'shilish</button>';
    messagesEl.innerHTML = '<div class="chat-empty">Bu chatga a\'zo emassiz. Qo\'shilish uchun tugmani bosing.</div>';
    document.getElementById('chatHeaderMeta').textContent = conv.type === 'channel' ? 'Kanal' : 'Guruh';
    return;
  }

  joinArea.style.display = 'none';
  inputArea.style.display = 'flex';

  if (conv.type === 'channel' && !isOwner) {
    inputArea.style.display = 'none';
  }

  document.getElementById('chatHeaderMeta').textContent =
    conv.type === 'channel' ? 'Kanal' : conv.type === 'group' ? 'Guruh' : 'Shaxsiy';

  messagesEl.innerHTML = '<div class="chat-loading"><div class="mini-loader"></div> Xabarlar yuklanmoqda...</div>';
  const msgs = await DB.getMessages(convId);
  renderMessages(msgs);

  unsubscribers[convId] = DB.subscribe(convId, renderMessages);
}

window.joinConversation = async function(convId) {
  if (!currentUser) return alert('Avval profilingizni yarating');
  await DB.joinConversation(convId, currentUser.id);
  await openConversation(convId);
  await loadConversations();
};

function renderMessages(msgs) {
  const container = document.getElementById('chatMessages');
  container.innerHTML = msgs.map((m, i) => {
    const showDate = i === 0 || new Date(msgs[i - 1]?.time).toDateString() !== new Date(m.time).toDateString();
    return (showDate ? '<div class="date-sep"><span>' + getDateLabel(m.time) + '</span></div>' : '') + renderMessage(m);
  }).join('');
  container.scrollTop = container.scrollHeight;
}

function renderMessage(m) {
  const isOwn = m.fromId === currentUser?.id;
  const cls = isOwn ? 'msg own' : 'msg other';
  const avatar = m.fromAvatar && m.fromAvatar !== '?' ? m.fromAvatar : null;
  const time = m.time ? new Date(m.time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '';
  const media = m.media ? '<div class="msg-media"><img src="' + m.media + '" loading="lazy" onclick="window.open(\'' + m.media + '\',\'_blank\')" /></div>' : '';
  const fromId = m.fromId || '';
  const canClick = !isOwn && fromId;
  return '<div class="' + cls + ' msg-wrapper" data-id="' + (m.id || '') + '">' +
    '<div class="msg-avatar' + (canClick ? ' clickable' : '') + '" onclick="' + (canClick ? 'openPrivateChat(\'' + fromId + '\')' : '') + '" style="' + (avatar ? 'background-image:url(' + avatar + ');background-size:cover' : '') + '">' + (avatar ? '' : (m.fromName ? m.fromName[0].toUpperCase() : '?')) + '</div>' +
    '<div class="msg-body">' +
    (isOwn ? '' : '<span class="msg-author' + (canClick ? ' clickable' : '') + '" onclick="' + (canClick ? 'openPrivateChat(\'' + fromId + '\')' : '') + '">' + esc(m.fromName || 'Anon') + '</span>') +
    '<div class="' + (isOwn ? 'msg-bubble own' : 'msg-bubble') + '">' +
    (m.text ? '<div class="msg-text">' + esc(m.text) + '</div>' : '') +
    media +
    (m.reaction ? '<div class="msg-reaction-bubble">' + m.reaction + '</div>' : '') +
    '</div>' +
    '<div class="msg-info">' +
      '<span class="msg-time">' + time + '</span>' +
      '<div class="msg-actions">' +
        '<button class="msg-action-btn" onclick="toggleReactions(\'' + m.id + '\')">\u{1F60A}</button>' +
        (isOwn ? '<button class="msg-action-btn" onclick="deleteMsg(\'' + m.id + '\')">\u{1F5D1}</button>' : '') +
      '</div>' +
    '</div>' +
    '<div class="msg-reactions" id="reactions-' + m.id + '">' +
    REACTIONS.map(r => '<button class="react-emoji" onclick="addReact(\'' + m.id + '\',\'' + r + '\')">' + r + '</button>').join('') +
    '</div>' +
    '</div></div>';
}

window.openPrivateChat = async function(userId) {
  if (!currentUser || !userId || userId === currentUser.id) return;
  const convs = await DB.getConversations();
  let priv = convs.find(c =>
    c.type === 'private' && c.members && c.members[currentUser.id] && c.members[userId]
  );
  if (priv) {
    openConversation(priv.id);
    loadConversations();
    return;
  }
  const otherUser = await DB.getUser(userId);
  priv = await DB.createConversation({
    type: 'private',
    name: otherUser?.username || 'Foydalanuvchi',
    ownerId: currentUser.id,
    members: { [currentUser.id]: true, [userId]: true },
  });
  await loadConversations();
  openConversation(priv.id);
};

function getDateLabel(ts) {
  if (!ts) return '';
  const d = new Date(ts), today = new Date(), yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Bugun';
  if (d.toDateString() === yesterday.toDateString()) return 'Kecha';
  return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

function esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

window.deleteMsg = async function(id) {
  if (!id || !currentConvId || !confirm("O'chirilsinmi?")) return;
  await DB.deleteMessage(currentConvId, id);
};

const reactionsOpen = {};
window.toggleReactions = function(id) {
  const el = document.getElementById('reactions-' + id);
  if (!el) return;
  reactionsOpen[id] = !reactionsOpen[id];
  el.style.display = reactionsOpen[id] ? 'flex' : 'none';
};

window.addReact = async function(msgId, emoji) {
  if (!currentConvId) return;
  await DB.addReaction(currentConvId, msgId, emoji);
  const el = document.getElementById('reactions-' + msgId);
  if (el) el.style.display = 'none';
  reactionsOpen[msgId] = false;
};

// ===== SEND =====
(function setupInput() {
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');

  async function send() {
    if (!currentConvId || !currentUser) return;
    const text = input.value.trim();
    const preview = document.getElementById('chatPreview');
    const img = preview.querySelector('img');
    const media = preview.style.display !== 'none' && img ? img.src : '';
    if (!text && !media) return;
    await DB.sendMessage({
      convId: currentConvId, fromId: currentUser.id, fromName: currentUser.username,
      fromAvatar: currentUser.avatar || '', text, media,
    });
    input.value = ''; input.style.height = 'auto';
    preview.style.display = 'none';
    if (img) img.src = '';
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 100) + 'px'; });

  const mediaInput = document.getElementById('chatMediaInput');
  const mediaBtn = document.getElementById('chatMediaBtn');
  const preview = document.getElementById('chatPreview');
  const previewImg = document.getElementById('chatPreviewImg');

  mediaBtn.addEventListener('click', () => mediaInput.click());
  mediaInput.addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { previewImg.src = r.result; preview.style.display = 'block'; };
    r.readAsDataURL(f);
  });
  document.getElementById('chatPreviewRemove').addEventListener('click', () => {
    preview.style.display = 'none'; previewImg.src = ''; mediaInput.value = '';
  });
})();

// ===== ONLINE USERS =====
(function setupOnline() {
  async function refresh() {
    try {
      const users = await DB.getAllUsers();
      const online = users.filter(u => u.online && u.id !== currentUser?.id);
      onlineUsers = {};
      online.forEach(u => { onlineUsers[u.id] = u; });
      const count = online.length + (currentUser ? 1 : 0);
      document.getElementById('onlineCount').textContent = count + ' online';
      if (window.updateOnlineBadge) window.updateOnlineBadge(count);
    } catch {}
  }
  refresh();
  setInterval(refresh, 10000);
  window.addEventListener('beforeunload', () => {
    if (currentUser) DB.updateUser(currentUser.id, { online: false });
  });
})();

// ===== CREATE CONVERSATION =====
document.getElementById('createChannelBtn').addEventListener('click', () => showCreateModal('channel'));
document.getElementById('createGroupBtn').addEventListener('click', () => showCreateModal('group'));
document.getElementById('createPrivateBtn').addEventListener('click', showPrivateModal);

function showCreateModal(type) {
  const m = document.getElementById('createModal');
  const title = document.getElementById('createModalTitle');
  const nameInput = document.getElementById('createConvName');
  const descInput = document.getElementById('createConvDesc');
  const userSelect = document.getElementById('createConvUsers');
  const userSelectWrap = document.getElementById('createUserSelectWrap');

  title.textContent = type === 'channel' ? 'Yangi kanal' : 'Yangi guruh';
  nameInput.value = ''; descInput.value = '';
  nameInput.placeholder = type === 'channel' ? 'Kanal nomi' : 'Guruh nomi';
  descInput.style.display = type === 'private' ? 'none' : 'block';
  userSelectWrap.style.display = 'none';

  m.style.display = 'flex';
  m.dataset.type = type;

  document.getElementById('createConvSave').onclick = async () => {
    const name = nameInput.value.trim();
    if (!name) return alert('Nom kiriting');
    if (!currentUser) return alert('Avval profilingizni yarating');
    const conv = await DB.createConversation({
      type, name, desc: descInput.value.trim(),
      ownerId: currentUser.id,
      members: { [currentUser.id]: true },
    });
    m.style.display = 'none';
    await loadConversations();
    openConversation(conv.id);
    document.querySelectorAll('.chat-list-item').forEach(el => el.classList.remove('active'));
  };
}

async function showPrivateModal() {
  const m = document.getElementById('createModal');
  document.getElementById('createModalTitle').textContent = 'Yangi shaxsiy chat';
  document.getElementById('createConvName').value = '';
  document.getElementById('createConvName').placeholder = 'Foydalanuvchi qidirish...';
  document.getElementById('createConvDesc').style.display = 'none';
  document.getElementById('createConvSave').textContent = 'Boshlash';

  const userSelectWrap = document.getElementById('createUserSelectWrap');
  userSelectWrap.style.display = 'block';
  const select = document.getElementById('createConvUsers');
  select.innerHTML = '<option value="">Foydalanuvchini tanlang...</option>';

  try {
    const users = await DB.getAllUsers();
    users.filter(u => u.id !== currentUser?.id).forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.id; opt.textContent = u.username || 'Anon';
      select.appendChild(opt);
    });
  } catch {}

  m.style.display = 'flex';
  m.dataset.type = 'private';

  document.getElementById('createConvSave').onclick = async () => {
    const userId = select.value;
    if (!userId) return alert('Foydalanuvchini tanlang');
    if (!currentUser) return alert('Avval profilingizni yarating');

    const convs = await DB.getConversations();
    const existing = convs.find(c =>
      c.type === 'private' && c.members && c.members[currentUser.id] && c.members[userId]
    );
    if (existing) {
      m.style.display = 'none';
      openConversation(existing.id);
      return;
    }

    const otherUser = await DB.getUser(userId);
    const conv = await DB.createConversation({
      type: 'private', name: otherUser?.username || 'Foydalanuvchi',
      ownerId: currentUser.id,
      members: { [currentUser.id]: true, [userId]: true },
    });
    m.style.display = 'none';
    await loadConversations();
    openConversation(conv.id);
  };
}
