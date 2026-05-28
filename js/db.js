(function () {
  'use strict'
  var URL = window.__XOLERIC_CONFIG__?.FIREBASE_URL || 'https://xoleric-9ad1b-default-rtdb.firebaseio.com'
  var app, db
  try {
    app = firebase.initializeApp({ databaseURL: URL })
    db = firebase.database()
  } catch (e) { console.error('Firebase init error:', e) }

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
      var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
      var data = {
        id: id,
        username: (user.username || '').trim().slice(0, 30),
        bio: (user.bio || '').slice(0, 80),
        avatar: user.avatar || '',
        aura: randomAura(),
        energy: 50,
        created: Date.now(),
        online: true
      }
      await db.ref('users/' + id).set(data)
      return data
    },
    async getUser(id) {
      var snap = await db.ref('users/' + id).once('value')
      return snap.val()
    },
    async updateUser(id, data) {
      await db.ref('users/' + id).update(data)
    },
    getAllUsers(onUsers) {
      var r = db.ref('users')
      var cb = function (s) {
        var d = s.val()
        if (!d) { onUsers([]); return }
        onUsers(Object.values(d))
      }
      r.on('value', cb)
      return function () { r.off('value', cb) }
    },
    async usernameExists(username) {
      var snap = await db.ref('users').once('value')
      var d = snap.val()
      if (!d) return false
      return Object.values(d).some(function (u) {
        return u.username && u.username.toLowerCase() === username.toLowerCase().trim()
      })
    },
    subscribeMessages(roomId, cb) {
      var r = db.ref('chat/' + roomId + '/messages').orderByChild('time').limitToLast(200)
      var fn = function (s) {
        var d = s.val()
        if (!d) { cb([]); return }
        var msgs = Object.entries(d).map(function (e) { e[1].id = e[0]; return e[1] }).sort(function (a, b) { return (a.time || 0) - (b.time || 0) })
        cb(msgs)
      }
      r.on('value', fn)
      return function () { r.off('value', fn) }
    },
    async sendMessage(roomId, msg) {
      var data = {
        fromId: (msg.fromId || '').slice(0, 50),
        fromName: (msg.fromName || 'Anon').slice(0, 30),
        fromAvatar: msg.fromAvatar || '',
        text: (msg.text || '').slice(0, 2000),
        media: (msg.media || '').slice(0, 9000000),
        time: Date.now(),
        reaction: '',
        replyTo: (msg.replyTo || '').slice(0, 50),
        replyToName: (msg.replyToName || '').slice(0, 30),
        type: msg.type || 'text',
        fileUrl: (msg.fileUrl || '').slice(0, 500)
      }
      var nr = db.ref('chat/' + roomId + '/messages').push()
      await nr.set(data)
      await db.ref('chat/' + roomId + '/info').update({ lastActivity: Date.now(), lastMessage: (data.text || '(media)').slice(0, 50) })
    },
    async deleteMessage(roomId, msgId) {
      await db.ref('chat/' + roomId + '/messages/' + msgId).remove()
    },
    async addReaction(roomId, msgId, reaction) {
      await db.ref('chat/' + roomId + '/messages/' + msgId + '/reaction').set(reaction)
    },
    async editMessage(roomId, msgId, text) {
      await db.ref('chat/' + roomId + '/messages/' + msgId + '/text').set(text)
      await db.ref('chat/' + roomId + '/messages/' + msgId + '/edited').set(Date.now())
    },
    subscribeRooms(cb) {
      var r = db.ref('chat/rooms')
      var fn = function (s) {
        var d = s.val()
        if (!d) { cb([]); return }
        var rooms = Object.entries(d).map(function (e) { e[1].id = e[0]; return e[1] }).filter(function (r) { return r.name }).sort(function (a, b) { return (b.lastActivity || 0) - (a.lastActivity || 0) })
        cb(rooms)
      }
      r.on('value', fn)
      return function () { r.off('value', fn) }
    },
    async createRoom(name, userId, userName) {
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
    async deleteRoom(roomId) { await db.ref('chat/rooms/' + roomId).remove() },
    async incrementVisits() {
      if (sessionStorage.getItem('xv')) return
      sessionStorage.setItem('xv', '1')
      try {
        var snap = await db.ref('stats/visits').once('value')
        await db.ref('stats/visits').set((snap.val() || 0) + 1)
      } catch (e) { }
    },
    async getStats() {
      try {
        var snap = await db.ref('stats').once('value')
        var d = snap.val()
        return { visits: d?.visits || 0, comments: d?.comments || 0 }
      } catch (e) { return { visits: 0, comments: 0 } }
    }
  }
})()
