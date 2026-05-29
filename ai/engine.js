(function () {
  'use strict'
  var DB = window.XOLERIC_DB
  if (!DB) { console.error('AI: XOLERIC_DB not found'); return }

  var LEARN_KEY = 'xolerc_ai_learned'
  var STATS_KEY = 'xolerc_ai_stats'

  function loadLearned() {
    try { return JSON.parse(localStorage.getItem(LEARN_KEY)) || [] } catch(e) { return [] }
  }
  function saveLearned(d) { localStorage.setItem(LEARN_KEY, JSON.stringify(d)) }
  function loadStats() {
    try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {} } catch(e) { return {} }
  }
  function saveStats(s) { localStorage.setItem(STATS_KEY, JSON.stringify(s)) }

  function normalize(s) { return String(s || '').toLowerCase().replace(/[»«""'`]/g, '').replace(/\s+/g, ' ').trim() }

  function keywordMatch(text, keywords) {
    for (var i = 0; i < keywords.length; i++) { if (text.indexOf(normalize(keywords[i])) !== -1) return true }
    return false
  }

  function extractEntity(text, patterns) {
    var t = normalize(text)
    for (var key in patterns) {
      var vals = patterns[key]
      if (typeof vals === 'string') vals = [vals]
      for (var i = 0; i < vals.length; i++) { if (t.indexOf(normalize(vals[i])) !== -1) return key }
    }
    return null
  }

  function extractAfter(text, triggerWords) {
    var t = normalize(text)
    for (var i = 0; i < triggerWords.length; i++) {
      var idx = t.indexOf(normalize(triggerWords[i]))
      if (idx !== -1) {
        var after = t.substring(idx + normalize(triggerWords[i]).length).trim()
        if (after) return after
      }
    }
    return null
  }

  function extractBetween(text, fromWords, toMarker) {
    var t = normalize(text)
    for (var i = 0; i < fromWords.length; i++) {
      var f = normalize(fromWords[i])
      var fidx = t.indexOf(f)
      if (fidx === -1) continue
      var after = t.substring(fidx + f.length).trim()
      var toIdx = toMarker ? after.indexOf(normalize(toMarker)) : -1
      return toIdx !== -1 ? after.substring(0, toIdx).trim() : after
    }
    return null
  }

  function matchPattern(text, patternList) {
    var t = normalize(text)
    for (var i = 0; i < patternList.length; i++) {
      var p = patternList[i]
      for (var j = 0; j < p.patterns.length; j++) {
        if (t.indexOf(normalize(p.patterns[j])) !== -1) return p
      }
    }
    return null
  }

  // ====== ACTIONS ======
  var actions = {
    switchTab: function (tab) {
      if (!tab) { tab = extractEntity(actions._lastText, DB.commands[0].params || {}) }
      if (tab && window.switchTab) { window.switchTab(tab); return tab + ' tab\'iga o\'tildi \ud83d\udc4d' }
      return 'Qaysi bo\'limga o\'tishni aniqlay olmadim.'
    },
    openLink: function (url) {
      if (url) { window.open(url, '_blank'); return 'Havola ochildi \ud83d\udd17' }
      return 'Havola topilmadi.'
    },
    searchVideo: function (query) {
      if (!query) query = actions._lastText.replace(/videoda qidir|video qidir|youtubeda qidir|top video/gi, '').trim()
      if (query) {
        if (window.switchTab) window.switchTab('video')
        setTimeout(function() {
          var searchInput = document.getElementById('vpSearch')
          if (searchInput) { searchInput.value = query; searchInput.dispatchEvent(new Event('input')) }
          if (window.searchYoutube) window.searchYoutube(query)
        }, 300)
        return '"' + query + '" bo\'yicha video qidirilmoqda... \ud83d\udd0d'
      }
      return 'Nimani qidirishni ayting. Masalan: "Videoda qidir JavaScript darslari"'
    },
    playSong: function (songName) {
      if (songName) {
        if (window.switchTab) window.switchTab('video')
        setTimeout(function() {
          var searchInput = document.getElementById('vpSearch')
          if (searchInput) { searchInput.value = songName + " musiqa"; searchInput.dispatchEvent(new Event('input')) }
          if (window.searchYoutube) window.searchYoutube(songName + " musiqa")
        }, 300)
        return '"' + songName + '" qidirilmoqda... \ud83c\udfb5'
      }
      return 'Qaysi qo\'shiqni ijro etishni ayting.'
    },
    changeTheme: function (theme) {
      if (!theme) theme = extractEntity(actions._lastText, { 'github': 'github', 'google': 'google', 'apple': 'apple', 'twitter': 'twitter', 'instagram': 'instagram', 'chatgpt': 'chatgpt' })
      if (theme && window.applyTheme) { window.applyTheme(theme); return 'Tema ' + theme + ' ga o\'zgartirildi \ud83c\udfa8' }
      var t = extractEntity(actions._lastText, { 'github': 'github', 'google': 'google', 'apple': 'apple', 'twitter': 'twitter', 'instagram': 'instagram', 'chatgpt': 'chatgpt' })
      if (t && window.applyTheme) { window.applyTheme(t); return 'Tema ' + t + ' ga o\'zgartirildi \ud83c\udfa8' }
      return 'Qaysi temaga o\'tishni ayting: GitHub, Google, Apple, Twitter, Instagram, ChatGPT'
    },
    setMode: function (mode) {
      if (window.toggleMode) {
        var current = document.documentElement.getAttribute('data-mode')
        if (current !== mode) window.toggleMode()
        return mode === 'dark' ? 'Tungi rejimga o\'tildi \ud83c\udf19' : 'Kunduzgi rejimga o\'tildi \u2600\ufe0f'
      }
      return 'Rejim o\'zgartirilmadi.'
    },
    toggleMusic: function (val) {
      if (val === 'on' && window.startMusic) { window.startMusic(); return 'Musiqa yoqildi \ud83c\udfb5' }
      if (val === 'off' && window.stopMusic) { window.stopMusic(); return 'Musiqa o\'chirildi \ud83d\udd07' }
      if (window.toggleBgMusic) { window.toggleBgMusic(); return 'Musiqa almashtirildi' }
      return 'Musiqa boshqaruvi mavjud emas.'
    },
    analyze: function (subject) {
      if (!subject) { subject = actions._lastText.replace(/tahlil qil|analiz qil|ma'lumot ber|info ber/gi, '').trim() }
      var analysis = DB.analysis
      if (subject && analysis.actions[normalize(subject)]) return analysis.actions[normalize(subject)]()
      if (analysis.actions[subject]) return analysis.actions[subject]()
      return analysis.default ? analysis.default(subject || '') : 'Tahlil qilish uchun mavzu ayting.'
    }
  }

  // ====== MAIN ENGINE ======
  var engine = {
    process: function (text, callback) {
      var t = normalize(text)
      if (!t) { callback(null); return }
      actions._lastText = text

      // 1. Check learning instruction — "men senga o'rgataman: ... -> ..."
      var learnPatterns = DB.learnInstruction[0].patterns
      for (var i = 0; i < learnPatterns.length; i++) {
        if (t.indexOf(normalize(learnPatterns[i])) !== -1) {
          var arrowIdx = t.indexOf('->')
          if (arrowIdx !== -1) {
            var q = text.substring(t.indexOf(normalize(learnPatterns[i])) + learnPatterns[i].length, arrowIdx).trim()
            var a = text.substring(arrowIdx + 2).trim()
            if (q && a) {
              var learned = loadLearned()
              learned.push({ question: q, answer: a, ts: Date.now(), freq: 0 })
              saveLearned(learned)
              callback('Saqlab oldim! \ud83e\udde0\n\nSavol: **' + q + '**\nJavob: **' + a + '**')
              return
            }
          }
          callback('Iltimos, format: "Men senga o\'rgataman: savol -> javob"')
          return
        }
      }

      // 2. Check greetings
      var g = matchPattern(t, DB.greetings)
      if (g) { callback(typeof g.answer === 'function' ? g.answer() : g.answer); return }

      // 3. Check music patterns — play song
      var musicPattern = matchPattern(t, DB.music.patterns)
      if (musicPattern) {
        var songName = text
        // Remove pattern words to extract song name
        for (var k = 0; k < musicPattern.patterns.length; k++) {
          var pat = musicPattern.patterns[k]
          var idx = Math.max(t.indexOf(normalize(pat)), text.toLowerCase().indexOf(normalize(pat)))
          if (idx !== -1) { songName = text.substring(0, idx).trim(); break }
        }
        // Try to match from DB
        var matchedSong = null
        for (var si = 0; si < DB.music.songs.length; si++) {
          if (t.indexOf(normalize(DB.music.songs[si].title)) !== -1 || t.indexOf(normalize(DB.music.songs[si].artist)) !== -1) {
            matchedSong = DB.music.songs[si]
            break
          }
        }
        if (matchedSong) {
          var result = '\ud83c\udfb5 **' + matchedSong.title + '** — ' + matchedSong.artist + '\n\n'
          if (matchedSong.info) result += matchedSong.info + '\n\n'
          result += '\ud83d\udd0d YouTube\'da qidirilmoqda...'
          var actionResult = actions.playSong(matchedSong.query || matchedSong.title + ' ' + matchedSong.artist)
          callback(result + '\n\n' + actionResult)
        } else {
          var actionResult2 = actions.playSong(songName)
          callback('\ud83c\udfb5 Qo\'shiq qidirilmoqda...\n\n' + actionResult2)
        }
        return
      }

      // 4. Check commands (open links, tabs, etc)
      var cmd = matchPattern(t, DB.commands)
      if (cmd) {
        var actionFn = actions[cmd.action]
        if (actionFn) {
          if (cmd.value) {
            callback(actionFn(cmd.value))
          } else {
            callback(actionFn())
          }
          return
        }
      }

      // 5. Check app control
      var appCtrl = matchPattern(t, DB.appControl)
      if (appCtrl) {
        var cf = actions[appCtrl.action]
        if (cf) {
          if (appCtrl.params) {
            var theme = extractEntity(t, { 'github': 'github', 'google': 'google', 'apple': 'apple', 'twitter': 'twitter', 'instagram': 'instagram', 'chatgpt': 'chatgpt' })
            callback(cf(theme || appCtrl.value))
          } else {
            callback(cf(appCtrl.value))
          }
        }
        return
      }

      // 6. Check help
      if (keywordMatch(t, DB.help.keywords)) { callback(DB.help.answer); return }

      // 7. Check analysis
      if (keywordMatch(t, DB.analysis.keywords)) {
        var subject2 = text.replace(/tahlil qil|analiz qil|tekshir|o'rgan|ma'lumot ber|info ber/gi, '').trim()
        callback(actions.analyze(subject2))
        return
      }

      // 8. Check fun
      for (var fi = 0; fi < DB.fun.length; fi++) {
        if (keywordMatch(t, DB.fun[fi].keywords)) {
          callback(typeof DB.fun[fi].answer === 'function' ? DB.fun[fi].answer() : DB.fun[fi].answer)
          return
        }
      }

      // 9. Check programming
      for (var pi = 0; pi < DB.programming.length; pi++) {
        if (keywordMatch(t, DB.programming[pi].keywords)) {
          callback(DB.programming[pi].answer)
          return
        }
      }

      // 10. Check culture
      for (var ci = 0; ci < DB.culture.length; ci++) {
        if (keywordMatch(t, DB.culture[ci].keywords)) {
          callback(DB.culture[ci].answer)
          return
        }
      }

      // 11. Check about
      for (var ai = 0; ai < DB.about.length; ai++) {
        if (keywordMatch(t, DB.about[ai].keywords)) {
          callback(typeof DB.about[ai].answer === 'function' ? DB.about[ai].answer() : DB.about[ai].answer)
          return
        }
      }

      // 12. Check learned database
      var learned = loadLearned()
      for (var li = 0; li < learned.length; li++) {
        if (t.indexOf(normalize(learned[li].question)) !== -1) {
          learned[li].freq = (learned[li].freq || 0) + 1
          saveLearned(learned)
          callback(learned[li].answer)
          return
        }
      }

      // 13. Check QA dataset (1000+ questions)
      if (window.XOLERIC_QA_FIND) {
        var qaAnswer = window.XOLERIC_QA_FIND(text)
        if (qaAnswer) { callback(qaAnswer); return }
      }

      // 14. Fallback — try to learn
      var fb = DB.fallback[Math.floor(Math.random() * DB.fallback.length)]
      callback(fb)

      // Update stats
      var stats = loadStats()
      stats[t] = (stats[t] || 0) + 1
      saveStats(stats)
    }
  }

  // Learn function exports
  engine.learnedCount = function () { return loadLearned().length }
  engine.stats = function () { return loadStats() }
  engine.clearLearned = function () { localStorage.removeItem(LEARN_KEY) }

  if (typeof window !== 'undefined') { window.XOLERIC_AI = engine; window.XOLERIC_AI_ACTIONS = actions }
})()
