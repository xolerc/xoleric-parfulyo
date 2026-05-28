import { DB, escHtml, firebaseDb } from './firebase';
import { Unsubscribe } from 'firebase/database';
import { ref, onValue, off, set, get } from 'firebase/database';
import type { User, Message, ChatRoom } from './types';

const REACTIONS = ['👍', '❤️', '😊', '😂', '😮', '😢', '🙏', '🔥', '🎉', '💯'];
const CACHE_KEY = 'xolerc_user';

let currentUser: User | null = null;
let msgUnsub: Unsubscribe | null = null;
let roomsUnsub: Unsubscribe | null = null;
let usersUnsub: Unsubscribe | null = null;
let currentRoomId: string = 'main';

const $ = (id: string) => document.getElementById(id);

interface Room {
  id: string;
  name: string;
  creator: string;
  creatorName: string;
  createdAt: number;
  lastActivity: number;
  lastMessage?: string;
  participantCount: number;
}

let allRooms: Room[] = [];

function showRoomView() {
  const lv = $('chatListView');
  const rv = $('chatRoomView');
  if (lv) lv.style.display = 'none';
  if (rv) rv.style.display = 'flex';
}

function showListView() {
  const rv = $('chatRoomView');
  const lv = $('chatListView');
  if (rv) rv.style.display = 'none';
  if (lv) lv.style.display = 'flex';
  cleanupMessages();
  renderSidebar();
}

/* ---- Modal ---- */
function openModal() {
  const m = $('setupModal');
  if (m) {
    m.style.display = 'flex';
    requestAnimationFrame(() => m.classList.add('open'));
  }
}

function closeModalEl() {
  const m = $('setupModal');
  if (m) {
    m.classList.remove('open');
    setTimeout(() => { m.style.display = 'none'; }, 250);
  }
}

/* ---- Toast ---- */
function toast(msg: string) {
  const t = document.getElementById('chatToast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
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

/* ---- User ---- */
async function ensureUser(): Promise<User | null> {
  const uid = localStorage.getItem('xolerc_uid');
  if (uid) {
    try {
      const user = await DB.getUser(uid);
      if (user && user.id) {
        currentUser = user;
        localStorage.setItem(CACHE_KEY, JSON.stringify(user));
        return user;
      }
    } catch { /* */ }
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const p: User = JSON.parse(cached);
        if (p && p.id === uid) { currentUser = p; return p; }
      } catch { /* */ }
    }
  }
  return null;
}

/* ---- Setup Save ---- */
function setupSaveHandler() {
  const saveBtn = $('setupSave');
  if (!saveBtn) return;
  saveBtn.addEventListener('click', async () => {
    const nameInput = $('setupName') as HTMLInputElement | null;
    const avatarEl = $('setupAvatar');
    const bioInput = $('setupBio') as HTMLInputElement | null;
    if (!nameInput) return;
    const name = nameInput.value.trim();
    if (!name) return toast('Username kiriting');
    const avatar = avatarEl?.textContent === '?' ? '' : avatarEl?.textContent || '';
    const bio = bioInput?.value.trim() || '';

    if (currentUser) {
      try {
        await DB.updateUser(currentUser.id, { username: name, bio, avatar });
      } catch { /* */ }
      currentUser = { ...currentUser, username: name, bio, avatar };
      localStorage.setItem(CACHE_KEY, JSON.stringify(currentUser));
      closeModalEl();
      updateSidebarUser(currentUser);
      return;
    }

    try {
      const exists = await DB.usernameExists(name);
      if (exists) return toast('Bu username band. Boshqasini tanlang.');
      const user = await DB.createUser({ username: name, bio, avatar });
      currentUser = user;
      localStorage.setItem('xolerc_uid', user.id);
      localStorage.setItem(CACHE_KEY, JSON.stringify(user));
      closeModalEl();
      updateSidebarUser(user);
      renderSidebar();
    } catch {
      toast('Serverga ulanishda xatolik.');
    }
  });
}

/* ---- Init Flow ---- */
function initUserFlow() {
  const cachedRaw = localStorage.getItem(CACHE_KEY);
  const uid = localStorage.getItem('xolerc_uid');
  let cachedUser: User | null = null;
  if (cachedRaw && uid) {
    try {
      const p = JSON.parse(cachedRaw);
      if (p && p.id === uid) cachedUser = p;
    } catch { /* */ }
  }

  if (cachedUser) {
    currentUser = cachedUser;
    closeModalEl();
    updateSidebarUser(cachedUser);
    renderSidebar();
    hideLoading();
    hideChatLoader();
    DB.updateUser(cachedUser.id, { online: true }).catch(() => {});
    return;
  }

  showChatLoader();
  const safetyTimer = setTimeout(() => {
    openModal();
    hideLoading();
    hideChatLoader();
  }, 6000);

  (async () => {
    try {
      const user = await ensureUser();
      clearTimeout(safetyTimer);
      if (user) {
        closeModalEl();
        updateSidebarUser(user);
        renderSidebar();
      } else {
        openModal();
      }
    } catch (e) {
      console.error('Init error:', e);
    } finally {
      hideLoading();
      hideChatLoader();
    }
  })();
}

/* ---- Update Sidebar User ---- */
function updateSidebarUser(user: User) {
  const nameEl = $('sidebarName');
  const statusEl = $('sidebarStatus');
  const avatarEl = $('sidebarAvatar');
  if (nameEl) nameEl.textContent = user.username || 'User';
  if (statusEl) statusEl.textContent = 'online';
  if (avatarEl) {
    if (user.avatar) {
      avatarEl.textContent = '';
      (avatarEl as HTMLElement).style.backgroundImage = `url(${user.avatar})`;
      (avatarEl as HTMLElement).style.backgroundSize = 'cover';
    } else {
      avatarEl.textContent = (user.username || '?')[0].toUpperCase();
      (avatarEl as HTMLElement).style.backgroundImage = '';
    }
  }
}

/* ---- Sidebar: Rooms List ---- */
function renderSidebar() {
  const sidebar = $('sidebarChats');
  if (!sidebar) return;

  let html = '';
  /* Main chat entry */
  html +=
    '<div class="chat-list-item" data-room="main" style="cursor:pointer">' +
      '<div class="cli-avatar">∞</div>' +
      '<div class="cli-info">' +
        `<span class="cli-name" data-i18n="chat.main">Umumiy Chat</span>` +
        `<span class="cli-msg" data-i18n="chat.main.sub">Barcha xabarlar</span>` +
      '</div>' +
    '</div>';

  /* Private rooms */
  allRooms.forEach(r => {
    html +=
      `<div class="chat-list-item" data-room="${r.id}" style="cursor:pointer">` +
        '<div class="cli-avatar room-avatar">#' + escHtml(r.name[0]?.toUpperCase() || 'R') + '</div>' +
        '<div class="cli-info">' +
          `<span class="cli-name">${escHtml(r.name)}</span>` +
          `<span class="cli-msg">${r.lastMessage ? escHtml(r.lastMessage.slice(0, 30)) : '...'}</span>` +
        '</div>' +
      '</div>';
  });

  /* Create room button */
  html +=
    '<div class="chat-list-item" id="createRoomBtn" style="cursor:pointer">' +
      '<div class="cli-avatar" style="border:1px dashed var(--accent);color:var(--accent)">+</div>' +
      '<div class="cli-info">' +
        '<span class="cli-name" style="color:var(--accent)">Yangi xona</span>' +
        '<span class="cli-msg" style="color:var(--text-muted)">Shaxsiy chat yaratish</span>' +
      '</div>' +
    '</div>';

  sidebar.innerHTML = html;

  /* Event listeners */
  sidebar.querySelectorAll('.chat-list-item[data-room]').forEach(el => {
    el.addEventListener('click', () => {
      const room = (el as HTMLElement).dataset.room || 'main';
      openRoom(room);
    });
  });

  const createBtn = document.getElementById('createRoomBtn');
  if (createBtn) createBtn.addEventListener('click', showCreateRoomModal);

  /* Apply i18n to new elements */
  const savedLang = localStorage.getItem('xolerc_lang') || 'uz';
  const LANG: Record<string, Record<string, string>> = {
    uz: { 'chat.main': 'Umumiy Chat', 'chat.main.sub': 'Barcha xabarlar' },
    en: { 'chat.main': 'General Chat', 'chat.main.sub': 'All messages' },
    ru: { 'chat.main': 'Общий чат', 'chat.main.sub': 'Все сообщения' },
  };
  const t = LANG[savedLang] || LANG.uz;
  sidebar.querySelectorAll('[data-i18n]').forEach(el => {
    const key = (el as HTMLElement).dataset.i18n!;
    if (t[key]) el.textContent = t[key];
  });
}

/* ---- Create Room Modal ---- */
function showCreateRoomModal() {
  let existing = document.getElementById('createRoomOverlay');
  if (existing) { existing.remove(); }

  const overlay = document.createElement('div');
  overlay.id = 'createRoomOverlay';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'display:flex;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:1000';

  overlay.innerHTML =
    '<div class="glass-card" style="padding:24px;width:320px;max-width:90vw;border-radius:16px">' +
      '<h3 style="margin:0 0 16px;font-size:16px" data-i18n="chat.create">Yangi xona yaratish</h3>' +
      '<input id="roomNameInput" style="width:100%;padding:10px 14px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--text);font-size:14px;box-sizing:border-box" placeholder="Xona nomi..." maxlength="50" />' +
      '<div style="display:flex;gap:8px;margin-top:16px">' +
        '<button id="roomCancelBtn" class="glass-btn glass-outline" style="flex:1" data-i18n="chat.cancel">Bekor qilish</button>' +
        '<button id="roomCreateBtn" class="glass-btn" style="flex:1" data-i18n="chat.create.btn">Yaratish</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  const input = document.getElementById('roomNameInput') as HTMLInputElement;
  document.getElementById('roomCancelBtn')!.addEventListener('click', () => overlay.remove());
  document.getElementById('roomCreateBtn')!.addEventListener('click', async () => {
    const name = input?.value.trim();
    if (!name) { toast('Xona nomini kiriting'); return; }
    if (!currentUser) { toast('Avval profilingizni yarating'); return; }
    const id = await DB.createRoom(name, currentUser.id, currentUser.username);
    if (id) {
      overlay.remove();
      toast('Xona yaratildi!');
      renderSidebar();
    } else {
      toast('Xatolik yuz berdi');
    }
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('roomCreateBtn')?.click();
  });
  input?.focus();

  /* Apply i18n */
  const savedLang = localStorage.getItem('xolerc_lang') || 'uz';
  const LANG: Record<string, Record<string, string>> = {
    uz: { 'chat.create': 'Yangi xona yaratish', 'chat.cancel': 'Bekor qilish', 'chat.create.btn': 'Yaratish' },
    en: { 'chat.create': 'Create new room', 'chat.cancel': 'Cancel', 'chat.create.btn': 'Create' },
    ru: { 'chat.create': 'Создать новую комнату', 'chat.cancel': 'Отмена', 'chat.create.btn': 'Создать' },
  };
  const t = LANG[savedLang] || LANG.uz;
  overlay.querySelectorAll('[data-i18n]').forEach(el => {
    const key = (el as HTMLElement).dataset.i18n!;
    if (t[key]) el.textContent = t[key];
  });
}

/* ---- Open Room ---- */
function openRoom(roomId: string) {
  cleanupMessages();
  currentRoomId = roomId;

  const nameEl = $('chatRoomName');
  const statusEl = $('chatRoomStatus');
  const avatarEl = $('chatRoomAvatar');
  const joinArea = $('chatJoinArea');
  const inputArea = $('chatInputArea');
  const messagesEl = $('chatMessages');
  const backBtn = $('chatBackBtn');

  if (roomId === 'main') {
    if (nameEl) nameEl.textContent = 'Umumiy Chat';
    if (statusEl) statusEl.textContent = 'online';
    if (avatarEl) avatarEl.textContent = '∞';
  } else {
    const room = allRooms.find(r => r.id === roomId);
    if (nameEl) nameEl.textContent = room?.name || roomId;
    if (statusEl) statusEl.textContent = room?.creatorName ? `by ${room.creatorName}` : '';
    if (avatarEl) avatarEl.textContent = room?.name?.[0]?.toUpperCase() || '#';
  }

  if (joinArea) joinArea.style.display = 'none';
  if (inputArea) inputArea.style.display = 'flex';
  if (backBtn) backBtn.style.display = '';

  showRoomView();

  if (messagesEl) messagesEl.innerHTML = '<div class="chat-loading" data-i18n="chat.loading">Xabarlar yuklanmoqda...</div>';

  msgUnsub = DB.subscribeMessages(roomId, (msgs: Message[]) => {
    renderMessages(msgs);
  });
}

function cleanupMessages() {
  if (msgUnsub) { msgUnsub(); msgUnsub = null; }
}

/* ---- Render Messages ---- */
function renderMessages(msgs: Message[]) {
  const container = $('chatMessages');
  if (!container) return;

  if (!msgs.length) {
    container.innerHTML = '<div class="chat-empty" style="padding:60px 20px;text-align:center;color:var(--text-muted);font-size:13px">📭 Xabarlar yo\'q. Birinchi bo\'lib yozing!</div>';
    return;
  }

  container.innerHTML = msgs.map((m, i) => {
    const showDate = i === 0 || new Date(msgs[i - 1]?.time).toDateString() !== new Date(m.time).toDateString();
    return (showDate ? '<div class="date-sep"><span>' + getDateLabel(m.time) + '</span></div>' : '') + renderMessage(m);
  }).join('');

  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight;
  });
}

function getDateLabel(ts: number): string {
  if (!ts) return '';
  const d = new Date(ts), today = new Date(), yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Bugun';
  if (d.toDateString() === yesterday.toDateString()) return 'Kecha';
  return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

function renderMessage(m: Message): string {
  const isOwn = m.fromId === currentUser?.id;
  const cls = isOwn ? 'msg own' : 'msg other';
  const avatar = m.fromAvatar && m.fromAvatar !== '?' ? escHtml(m.fromAvatar) : null;
  const time = m.time ? new Date(m.time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '';
  const fromId = m.fromId || '';
  const canClick = !isOwn && fromId;

  let bodyHtml = '';
  if (m.text) {
    bodyHtml += '<div class="msg-text">' + linkify(escHtml(m.text)) + '</div>';
  }
  if (m.media && m.media.startsWith('data:audio')) {
    bodyHtml += `<div class="msg-audio"><button class="audio-play-btn" onclick="window.playAudio('${m.id}', '${currentRoomId}', this)">▶</button><span class="audio-duration">Ovozli xabar</span></div>`;
  } else if (m.media && (m.media.startsWith('data:image') || m.media.startsWith('blob:'))) {
    bodyHtml += `<div class="msg-media"><img src="${m.media}" loading="lazy" onclick="window.open('${m.media}','_blank')" /></div>`;
  } else if (m.media && m.media.startsWith('http')) {
    bodyHtml += `<div class="msg-media"><img src="${m.media}" loading="lazy" onclick="window.open('${m.media}','_blank')" /></div>`;
  }
  if (m.replyTo) {
    bodyHtml = '<div class="msg-reply-bar">↪ ' + escHtml(m.replyToName || 'Xabar') + '</div>' + bodyHtml;
  }
  if (m.edited) {
    bodyHtml += '<span class="edited-badge">tahrirlangan</span>';
  }

  return '<div class="' + cls + ' msg-wrapper" data-id="' + (m.id || '') + '">' +
    '<div class="msg-avatar' + (canClick ? ' clickable' : '') + '" style="' + (avatar ? 'background-image:url(' + avatar + ');background-size:cover' : '') + '">' + (avatar ? '' : (m.fromName ? escHtml(m.fromName[0].toUpperCase()) : '?')) + '</div>' +
    '<div class="msg-body">' +
    (isOwn ? '' : '<span class="msg-author">' + escHtml(m.fromName || 'Anon') + '</span>') +
    '<div class="' + (isOwn ? 'msg-bubble own' : 'msg-bubble') + '">' + bodyHtml +
    (m.reaction ? '<div class="msg-reaction-bubble">' + escHtml(m.reaction) + '</div>' : '') +
    '</div>' +
    '<div class="msg-info">' +
      '<span class="msg-time">' + time + '</span>' +
      '<div class="msg-actions">' +
        '<button class="msg-action-btn" onclick="window.toggleReactions(\'' + m.id + '\')">😊</button>' +
        (isOwn ? '<button class="msg-action-btn" onclick="window.deleteMsg(\'' + m.id + '\',\'' + currentRoomId + '\')">🗑</button>' : '') +
      '</div>' +
    '</div>' +
    '<div class="msg-reactions" id="reactions-' + m.id + '">' +
    REACTIONS.map(r => '<button class="react-emoji" onclick="window.addReact(\'' + m.id + '\',\'' + currentRoomId + '\',\'' + r + '\')">' + r + '</button>').join('') +
    '</div>' +
    '</div></div>';
}

function linkify(text: string): string {
  return text.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:underline">$1</a>'
  );
}

/* ---- Globals for inline onclick ---- */
(window as any).playAudio = async function (msgId: string, roomId: string, btn: HTMLElement) {
  btn.textContent = '⏳';
  try {
    const msg = await new Promise<Message | null>((resolve) => {
      const unsub = DB.subscribeMessages(roomId, (msgs) => {
        unsub();
        resolve(msgs.find(x => x.id === msgId) || null);
      });
    });
    if (!msg || !msg.media) { btn.textContent = '▶'; return; }

    if (msg.media.startsWith('blob:') || msg.media.startsWith('data:audio')) {
      const audio = new Audio(msg.media);
      audio.play().catch(() => {});
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

const reactionsOpen: Record<string, boolean> = {};
(window as any).toggleReactions = function (id: string) {
  const el = document.getElementById('reactions-' + id);
  if (!el) return;
  reactionsOpen[id] = !reactionsOpen[id];
  el.style.display = reactionsOpen[id] ? 'flex' : 'none';
};

(window as any).addReact = async function (msgId: string, roomId: string, emoji: string) {
  await DB.addReaction(roomId, msgId, emoji);
  const el = document.getElementById('reactions-' + msgId);
  if (el) el.style.display = 'none';
  reactionsOpen[msgId] = false;
};

(window as any).deleteMsg = async function (id: string, roomId: string) {
  if (!id || !confirm("O'chirilsinmi?")) return;
  await DB.deleteMessage(roomId, id);
};

/* ---- Input ---- */
function setupInput() {
  const sendBtn = $('chatSendBtn');
  const input = $('chatInput') as HTMLTextAreaElement | null;
  const mediaBtn = $('chatMediaBtn');
  const mediaInput = $('chatMediaInput') as HTMLInputElement | null;
  const voiceBtn = $('chatVoiceBtn');

  async function send() {
    const user = currentUser;
    if (!user) return toast('Avval profilingizni yarating');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    try {
      await DB.sendMessage(currentRoomId, {
        fromId: user.id,
        fromName: user.username,
        fromAvatar: user.avatar || '',
        text,
      });
      input.value = '';
      input.style.height = 'auto';
    } catch {
      toast('Xabar yuborilmadi.');
    }
  }

  if (sendBtn) sendBtn.addEventListener('click', send);
  if (input) {
    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    });
  }

  if (mediaBtn && mediaInput) {
    mediaBtn.addEventListener('click', () => mediaInput.click());
    mediaInput.addEventListener('change', async (e: Event) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      if (!currentUser) return toast('Avval profilingizni yarating');
      const MAX_IMG = 2 * 1024 * 1024;
      if (f.size > MAX_IMG) return toast('Rasm hajmi 2 MB dan kichik bo\'lishi kerak');
      try {
        const dataUrl = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = rej;
          r.readAsDataURL(f);
        });
        await DB.sendMessage(currentRoomId, {
          fromId: currentUser.id,
          fromName: currentUser.username,
          fromAvatar: currentUser.avatar || '',
          text: '',
          media: dataUrl,
        });
      } catch {
        toast('Rasm yuborilmadi.');
      }
      mediaInput.value = '';
    });
  }

  /* Voice */
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let recording = false;
  let voiceStream: MediaStream | null = null;

  if (voiceBtn) {
    voiceBtn.addEventListener('click', async () => {
      if (recording) {
        mediaRecorder?.stop();
        recording = false;
        voiceBtn.classList.remove('recording');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        return toast('Ovoz yozish qo\'llab-quvvatlanmaydi');
      }
      try {
        voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(voiceStream, { mimeType: 'audio/webm' });
        audioChunks = [];
        mediaRecorder.ondataavailable = (e: BlobEvent) => {
          if (e.data.size > 0) audioChunks.push(e.data);
        };
      const userSnapshot = currentUser;
      mediaRecorder.onstop = async () => {
        if (voiceStream) { voiceStream.getTracks().forEach(t => t.stop()); voiceStream = null; }
        if (!userSnapshot || !audioChunks.length) return;
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          if (base64 && base64.length > 9000000) return toast('Ovoz xabari juda katta');
          try {
            await DB.sendMessage(currentRoomId, {
              fromId: userSnapshot.id,
              fromName: userSnapshot.username,
              fromAvatar: userSnapshot.avatar || '',
              text: '',
              media: base64,
            });
          } catch {
            toast('Ovoz yuborilmadi.');
          }
        };
        reader.readAsDataURL(blob);
      };
        mediaRecorder.start();
        recording = true;
        voiceBtn.classList.add('recording');
      } catch {
        toast('Mikrofon ruxsati yo\'q');
      }
    });
  }
}

/* ---- Online Users ---- */
function setupOnline() {
  usersUnsub = DB.getAllUsers((users: User[]) => {
    const uid = currentUser?.id;
    const online = users.filter(u => u.online && u.id !== uid);
    const count = online.length + (uid ? 1 : 0);
    const el = $('onlineCount');
    if (el) el.textContent = count + ' online';
    if ((window as any).updateOnlineBadge) (window as any).updateOnlineBadge(count);
  });

  window.addEventListener('beforeunload', () => {
    if (currentUser) DB.updateUser(currentUser.id, { online: false }).catch(() => {});
  });
}

/* ---- Rooms Subscription ---- */
function setupRooms() {
  roomsUnsub = DB.subscribeRooms((rooms: Room[]) => {
    allRooms = rooms;
  });
}

/* ---- Edit Profile ---- */
function setupEditProfile() {
  const editBtn = $('editProfileBtn');
  if (!editBtn) return;
  editBtn.addEventListener('click', () => {
    openModal();
    const saveBtn = $('setupSave');
    if (saveBtn) saveBtn.textContent = 'Saqlash';
    const nameInput = $('setupName') as HTMLInputElement | null;
    const bioInput = $('setupBio') as HTMLInputElement | null;
    const avatarEl = $('setupAvatar');
    if (currentUser) {
      if (nameInput) nameInput.value = currentUser.username || '';
      if (bioInput) bioInput.value = currentUser.bio || '';
      if (avatarEl) avatarEl.textContent = currentUser.avatar || '?';
    }
  });
}

/* ---- Avatar Upload ---- */
function setupAvatarUpload() {
  const avatarInput = $('setupAvatarInput') as HTMLInputElement | null;
  if (!avatarInput) return;
  avatarInput.addEventListener('change', (e: Event) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const r = new FileReader();
    const avatarEl = $('setupAvatar');
    r.onload = () => {
      if (avatarEl) {
        avatarEl.textContent = '';
        (avatarEl as HTMLElement).style.backgroundImage = `url(${r.result})`;
        (avatarEl as HTMLElement).style.backgroundSize = 'cover';
      }
    };
    r.readAsDataURL(f);
  });
}

/* ---- Back Button ---- */
function setupBackButton() {
  const backBtn = $('chatBackBtn');
  if (backBtn) backBtn.addEventListener('click', showListView);
}

/* ---- Modal click outside ---- */
function setupModalClose() {
  const modal = $('setupModal');
  if (modal) {
    modal.addEventListener('click', (e: MouseEvent) => {
      if (e.target === e.currentTarget) closeModalEl();
    });
  }
  const closeBtn = $('setupModalClose');
  if (closeBtn) closeBtn.addEventListener('click', closeModalEl);
}

/* ---- Init ---- */
export function initChat() {
  setupBackButton();
  setupModalClose();
  setupEditProfile();
  setupAvatarUpload();
  setupSaveHandler();
  setupInput();
  setupOnline();
  setupRooms();
  initUserFlow();
}
