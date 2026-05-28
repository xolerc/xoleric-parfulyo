/* ============================================================
   XOLERIC ∞ — Firebase DB Layer (xoleric-chat compatible)
   ============================================================ */
const DB_URL = 'https://xoleric-9ad1b-default-rtdb.firebaseio.com';
const P = p => `${DB_URL}${p}`;

const DB = {

  /* ─── USERS ─── */
  async createUser(user) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const data = {
      id, username: user.username.trim(), bio: user.bio || '',
      avatar: user.avatar || '', aura: randomAura(), energy: 50,
      created: Date.now(), online: true,
    };
    await fetch(P(`/users/${id}.json`), { method: 'PUT', body: JSON.stringify(data) });
    return data;
  },

  async getUser(id, signal) {
    const r = await fetch(P(`/users/${id}.json`), { signal });
    return r.json();
  },

  async updateUser(id, data) {
    await fetch(P(`/users/${id}.json`), { method: 'PATCH', body: JSON.stringify(data) });
  },

  async getAllUsers() {
    const r = await fetch(P('/users.json'));
    const d = await r.json();
    if (!d) return [];
    return Object.values(d);
  },

  async usernameExists(username) {
    const users = await this.getAllUsers();
    return users.some(u => u.username?.toLowerCase() === username.toLowerCase().trim());
  },

  /* ─── MESSAGES (flat /messages/main/) ─── */
  async getMessages() {
    const r = await fetch(P('/messages/main.json'));
    const d = await r.json();
    if (!d) return [];
    return Object.entries(d)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => (a.time || 0) - (b.time || 0));
  },

  async sendMessage(msg) {
    const data = {
      fromId: msg.fromId || '', fromName: msg.fromName || 'Anon',
      fromAvatar: msg.fromAvatar || '', text: msg.text || '',
      media: msg.media || '', time: Date.now(), reaction: '',
      replyTo: msg.replyTo || '', replyToName: msg.replyToName || '',
      type: msg.type || 'text', fileUrl: msg.fileUrl || '',
    };
    await fetch(P('/messages/main.json'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async deleteMessage(msgId) {
    await fetch(P(`/messages/main/${msgId}.json`), { method: 'DELETE' });
  },

  async addReaction(msgId, reaction) {
    await fetch(P(`/messages/main/${msgId}/reaction.json`), {
      method: 'PUT', body: JSON.stringify(reaction),
    });
  },

  async editMessage(msgId, text) {
    await fetch(P(`/messages/main/${msgId}/text.json`), {
      method: 'PUT', body: JSON.stringify(text),
    });
    await fetch(P(`/messages/main/${msgId}/edited.json`), {
      method: 'PUT', body: JSON.stringify(Date.now()),
    });
  },

  subscribe(callback) {
    let last = '';
    const poll = async () => {
      try {
        const msgs = await this.getMessages();
        const key = JSON.stringify(msgs.map(m =>
          m.id + (m.text || '') + (m.media || '') + (m.reaction || '') +
          (m.replyTo || '') + (m.edited || '')
        ));
        if (key !== last) { last = key; callback(msgs); }
      } catch {}
    };
    poll();
    const int = setInterval(poll, 1500);
    return () => clearInterval(int);
  },

  /* ─── NOTIFICATIONS ─── */
  async addNotification(n) {
    const data = {
      userId: n.userId || '', type: n.type || 'message',
      text: n.text || '', time: Date.now(), read: false,
    };
    await fetch(P('/notifications.json'), {
      method: 'POST', body: JSON.stringify(data),
    });
  },

  async getNotifications() {
    const r = await fetch(P('/notifications.json'));
    const d = await r.json();
    if (!d) return [];
    return Object.entries(d)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.time - a.time);
  },

  async markNotifRead(id) {
    await fetch(P(`/notifications/${id}/read.json`), {
      method: 'PUT', body: JSON.stringify(true),
    });
  },

  /* ─── STATS ─── */
  async getStats() {
    const r = await fetch(P('/stats.json'));
    const d = await r.json();
    return { visits: d?.visits || 0, comments: d?.comments || 0 };
  },

  async incrementVisits() {
    if (sessionStorage.getItem('xv')) return;
    sessionStorage.setItem('xv', '1');
    const r = await fetch(P('/stats/visits.json'));
    const n = await r.json();
    await fetch(P('/stats/visits.json'), {
      method: 'PUT', body: JSON.stringify((n || 0) + 1),
    });
  },
};

function randomAura() {
  const auras = ['#FFDE02', '#7c3aed', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];
  return auras[Math.floor(Math.random() * auras.length)];
}
