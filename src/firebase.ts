import { initializeApp } from 'firebase/app';
import {
  getDatabase, ref, onValue, off, push, set, remove, update,
  query, orderByChild, limitToLast, get, DataSnapshot, Unsubscribe,
} from 'firebase/database';
import type { User, Message, ChatRoom } from './types';

const config = (window as any).__XOLERIC_CONFIG__ || {};
const FIREBASE_URL: string = config.FIREBASE_URL ||
  localStorage.getItem('xolerc_fb_url') ||
  'https://xoleric-9ad1b-default-rtdb.firebaseio.com';

let app: any;
let db: any;
try {
  app = initializeApp({ databaseURL: FIREBASE_URL });
  db = getDatabase(app);
} catch (e) {
  console.error('Firebase init error:', e);
}

export function escHtml(t: string): string {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

function randomAura(): string {
  const auras = ['#FFDE02', '#7c3aed', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];
  return auras[Math.floor(Math.random() * auras.length)];
}

export const firebaseDb = db;

export const DB = {
  async createUser(user: Partial<User>): Promise<User> {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    const data: User = {
      id,
      username: user.username!.trim().slice(0, 30),
      bio: (user.bio || '').slice(0, 80),
      avatar: user.avatar || '',
      aura: randomAura(),
      energy: 50,
      created: Date.now(),
      online: true,
    };
    await set(ref(db, `users/${id}`), data);
    return data;
  },

  async getUser(id: string): Promise<User | null> {
    const snap = await get(ref(db, `users/${id}`));
    return snap.val();
  },

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    await update(ref(db, `users/${id}`), data);
  },

  getAllUsers(onUsers: (users: User[]) => void): Unsubscribe {
    const usersRef = ref(db, 'users');
    const cb = (snap: DataSnapshot) => {
      const d = snap.val();
      if (!d) { onUsers([]); return; }
      onUsers(Object.values(d));
    };
    onValue(usersRef, cb);
    return () => off(usersRef, 'value', cb);
  },

  async usernameExists(username: string): Promise<boolean> {
    const snap = await get(ref(db, 'users'));
    const d = snap.val();
    if (!d) return false;
    return Object.values(d).some((u: any) =>
      u.username?.toLowerCase() === username.toLowerCase().trim()
    );
  },

  subscribeMessages(roomId: string, callback: (msgs: Message[]) => void): Unsubscribe {
    const msgsRef = query(
      ref(db, `chat/${roomId}/messages`),
      orderByChild('time'),
      limitToLast(200),
    );
    const cb = (snap: DataSnapshot) => {
      const d = snap.val();
      if (!d) { callback([]); return; }
      const msgs: Message[] = Object.entries(d)
        .map(([id, v]: [string, any]) => ({ id, ...v }))
        .sort((a, b) => (a.time || 0) - (b.time || 0));
      callback(msgs);
    };
    onValue(msgsRef, cb);
    return () => off(msgsRef, 'value', cb);
  },

  async sendMessage(roomId: string, msg: Partial<Message>): Promise<void> {
    const MAX_SIZE = 9000000;
    const data: any = {
      fromId: (msg.fromId || '').slice(0, 50),
      fromName: (msg.fromName || 'Anon').slice(0, 30),
      fromAvatar: msg.fromAvatar || '',
      text: (msg.text || '').slice(0, 2000),
      media: (msg.media || '').slice(0, MAX_SIZE),
      time: Date.now(),
      reaction: '',
      replyTo: (msg.replyTo || '').slice(0, 50),
      replyToName: (msg.replyToName || '').slice(0, 30),
      type: msg.type || 'text',
      fileUrl: (msg.fileUrl || '').slice(0, 500),
    };
    if (data.media && data.media.length > MAX_SIZE) {
      data.media = data.media.slice(0, MAX_SIZE);
      data.type = 'truncated';
    }
    const newRef = push(ref(db, `chat/${roomId}/messages`));
    await set(newRef, data);
    await update(ref(db, `chat/${roomId}/info`), {
      lastActivity: Date.now(),
      lastMessage: data.text?.slice(0, 50) || '(media)',
    });
  },

  async deleteMessage(roomId: string, msgId: string): Promise<void> {
    await remove(ref(db, `chat/${roomId}/messages/${msgId}`));
  },

  async addReaction(roomId: string, msgId: string, reaction: string): Promise<void> {
    await set(ref(db, `chat/${roomId}/messages/${msgId}/reaction`), reaction);
  },

  async editMessage(roomId: string, msgId: string, text: string): Promise<void> {
    await set(ref(db, `chat/${roomId}/messages/${msgId}/text`), text);
    await set(ref(db, `chat/${roomId}/messages/${msgId}/edited`), Date.now());
  },

  /* ---- Rooms ---- */
  subscribeRooms(callback: (rooms: ChatRoom[]) => void): Unsubscribe {
    const roomsRef = ref(db, 'chat/rooms');
    const cb = (snap: DataSnapshot) => {
      const d = snap.val();
      if (!d) { callback([]); return; }
      const rooms: ChatRoom[] = Object.entries(d)
        .map(([id, v]: [string, any]) => ({ id, ...v }))
        .filter(r => r.name)
        .sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
      callback(rooms);
    };
    onValue(roomsRef, cb);
    return () => off(roomsRef, 'value', cb);
  },

  async createRoom(name: string, userId: string, userName: string): Promise<string | null> {
    const id = 'room_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const data: ChatRoom = {
      id,
      name: name.trim().slice(0, 50),
      creator: userId,
      creatorName: userName.slice(0, 30),
      createdAt: Date.now(),
      lastActivity: Date.now(),
      lastMessage: '',
      participantCount: 1,
    };
    try {
      await set(ref(db, `chat/rooms/${id}`), data);
      return id;
    } catch {
      return null;
    }
  },

  async deleteRoom(roomId: string): Promise<void> {
    await remove(ref(db, `chat/rooms/${roomId}`));
  },

  /* ---- Stats ---- */
  async incrementVisits(): Promise<void> {
    if (sessionStorage.getItem('xv')) return;
    sessionStorage.setItem('xv', '1');
    try {
      const snap = await get(ref(db, 'stats/visits'));
      const n = snap.val() || 0;
      await set(ref(db, 'stats/visits'), (n as number) + 1);
    } catch { /* silent */ }
  },

  async getStats(): Promise<{ visits: number; comments: number }> {
    try {
      const snap = await get(ref(db, 'stats'));
      const d = snap.val();
      return { visits: d?.visits || 0, comments: d?.comments || 0 };
    } catch {
      return { visits: 0, comments: 0 };
    }
  },
};
