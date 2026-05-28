(function () {
  'use strict'
  var URL = (window.__XOLERIC_CONFIG__ && window.__XOLERIC_CONFIG__.FIREBASE_URL) || 'https://xoleric-9ad1b-default-rtdb.firebaseio.com'
  var app, db
  try {
    app = firebase.initializeApp({ databaseURL: URL })
    db = firebase.database()
  } catch (e) { console.error('Firebase init error:', e) }

  function noop() { return function () {} }
  function safe() { return db } // lazy ref

  window.escHtml = function (t) {
    if (!t) return ''
    var d = document.createElement('div')
    d.textContent = t
    return d.innerHTML
  }

  function randomAura() {
    var a = ['#FFDE02', '#7c3aed', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444']
    return a[Math.floor(Math.random() * a.length)]
  }

  window.DB = {
    async createUser(user) {
      if (!db) return null
      var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
      var data = {
        id: id, username: (user.username || '').trim().slice(0, 30),
        bio: (user.bio || '').slice(0, 80), avatar: user.avatar || '',
        aura: randomAura(), energy: 50, created: Date.now(), online: true
      }
      await db.ref('users/' + id).set(data)
      return data
    },
    async getUser(id) {
      if (!db) return null
      try { var snap = await db.ref('users/' + id).once('value'); return snap.val() } catch (e) { return null }
    },
    async updateUser(id, data) {
      if (!db) return
      try { await db.ref('users/' + id).update(data) } catch (e) {}
    },
    getAllUsers(onUsers) {
      if (!db) { onUsers([]); return noop }
      var r = db.ref('users')
      var cb = function (s) { var d = s.val(); if (!d) { onUsers([]); return }; onUsers(Object.values(d)) }
      r.on('value', cb)
      return function () { r.off('value', cb) }
    },
    async usernameExists(username) {
      if (!db) return false
      try {
        var snap = await db.ref('users').once('value')
        var d = snap.val()
        if (!d) return false
        var u = username.toLowerCase().trim()
        for (var k in d) { if (d[k].username && d[k].username.toLowerCase() === u) return true }
        return false
      } catch (e) { return false }
    },
    subscribeMessages(roomId, cb) {
      if (!db) { cb([]); return noop }
      var r = db.ref('chat/' + roomId + '/messages').orderByChild('time').limitToLast(200)
      var fn = function (s) {
        var d = s.val()
        if (!d) { cb([]); return }
        var keys = Object.keys(d), msgs = []
        for (var i = 0; i < keys.length; i++) { d[keys[i]].id = keys[i]; msgs.push(d[keys[i]]) }
        msgs.sort(function (a, b) { return (a.time || 0) - (b.time || 0) })
        cb(msgs)
      }
      r.on('value', fn)
      return function () { r.off('value', fn) }
    },
    subscribeMessagesBefore(roomId, beforeTime, limit, cb) {
      if (!db) { cb([]); return noop }
      var r = db.ref('chat/' + roomId + '/messages').orderByChild('time').endAt(beforeTime - 1).limitToLast(limit || 50)
      var fn = function (s) {
        var d = s.val()
        if (!d) { cb([]); return }
        var keys = Object.keys(d), msgs = []
        for (var i = 0; i < keys.length; i++) { d[keys[i]].id = keys[i]; msgs.push(d[keys[i]]) }
        msgs.sort(function (a, b) { return (a.time || 0) - (b.time || 0) })
        cb(msgs)
      }
      r.once('value', fn)
    },
    async pinMessage(roomId, msgId, pin) {
      if (!db) return
      try { await db.ref('chat/' + roomId + '/messages/' + msgId + '/pinned').set(pin ? Date.now() : null) } catch (e) {}
    },
    async sendMessage(roomId, msg) {
      if (!db) return
      var data = {
        fromId: (msg.fromId || '').slice(0, 50), fromName: (msg.fromName || 'Anon').slice(0, 30),
        fromAvatar: msg.fromAvatar || '', text: (msg.text || '').slice(0, 2000),
        media: (msg.media || '').slice(0, 9000000), time: Date.now(), reaction: '',
        replyTo: (msg.replyTo || '').slice(0, 50), replyToName: (msg.replyToName || '').slice(0, 30),
        replyText: (msg.replyText || '').slice(0, 200), type: msg.type || 'text',
        fileUrl: (msg.fileUrl || '').slice(0, 500)
      }
      var nr = db.ref('chat/' + roomId + '/messages').push()
      await nr.set(data)
      await db.ref('chat/' + roomId + '/info').update({ lastActivity: Date.now(), lastMessage: (data.text || '(media)').slice(0, 50) })
    },
    async deleteMessage(roomId, msgId, soft) {
      if (!db) return
      if (soft) { try { await db.ref('chat/' + roomId + '/messages/' + msgId).update({ text: '', media: '', deleted: true, fileUrl: '' }) } catch (e) {} }
      else { try { await db.ref('chat/' + roomId + '/messages/' + msgId).remove() } catch (e) {} }
    },
    async addReaction(roomId, msgId, reaction) { if (!db) return; try { await db.ref('chat/' + roomId + '/messages/' + msgId + '/reaction').set(reaction) } catch (e) {} },
    async editMessage(roomId, msgId, text) {
      if (!db) return
      try {
        await db.ref('chat/' + roomId + '/messages/' + msgId + '/text').set(text)
        await db.ref('chat/' + roomId + '/messages/' + msgId + '/edited').set(Date.now())
      } catch (e) {}
    },
    subscribeRooms(cb) {
      if (!db) { cb([]); return noop }
      var r = db.ref('chat/rooms')
      var fn = function (s) {
        var d = s.val()
        if (!d) { cb([]); return }
        var keys = Object.keys(d), rooms = []
        for (var i = 0; i < keys.length; i++) { d[keys[i]].id = keys[i]; if (d[keys[i]].name) rooms.push(d[keys[i]]) }
        rooms.sort(function (a, b) { return (b.lastActivity || 0) - (a.lastActivity || 0) })
        cb(rooms)
      }
      r.on('value', fn)
      return function () { r.off('value', fn) }
    },
    async createRoom(name, userId, userName) {
      if (!db) return null
      var id = 'room_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      try {
        await db.ref('chat/rooms/' + id).set({
          id: id, name: name.trim().slice(0, 50), creator: userId,
          creatorName: userName.slice(0, 30), createdAt: Date.now(),
          lastActivity: Date.now(), lastMessage: '', participantCount: 1
        })
        return id
      } catch (e) { return null }
    },
    async deleteRoom(roomId) { if (!db) return; await db.ref('chat/rooms/' + roomId).remove() },
    setTyping(roomId, userId, userName, isTyping) {
      if (!db) return
      if (isTyping) db.ref('chat/' + roomId + '/typing/' + userId).set({ name: userName, time: Date.now() })
      else db.ref('chat/' + roomId + '/typing/' + userId).remove()
    },
    subscribeTyping(roomId, cb) {
      if (!db) { cb({}); return noop }
      var r = db.ref('chat/' + roomId + '/typing')
      var fn = function (s) { var d = s.val(); cb(d || {}) }
      r.on('value', fn)
      return function () { r.off('value', fn) }
    },
    async incrementVisits() {
      if (!db) return
      if (sessionStorage.getItem('xv')) return
      sessionStorage.setItem('xv', '1')
      try { var snap = await db.ref('stats/visits').once('value'); await db.ref('stats/visits').set((snap.val() || 0) + 1) } catch (e) {}
    },
    async getStats() {
      if (!db) return { visits: 0, comments: 0 }
      try { var snap = await db.ref('stats').once('value'); var d = snap.val(); return { visits: (d && d.visits) || 0, comments: (d && d.comments) || 0 } } catch (e) { return { visits: 0, comments: 0 } }
    }
  }
})()
