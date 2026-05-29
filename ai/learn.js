(function () {
  'use strict'
  var LEARN_KEY = 'xolerc_ai_learned'
  var STATS_KEY = 'xolerc_ai_stats'
  var FREQ_KEY = 'xolerc_ai_freq'

  function load(k) { try { return JSON.parse(localStorage.getItem(k)) || (k === FREQ_KEY ? {} : []) } catch(e) { return k === FREQ_KEY ? {} : [] } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)) }

  var learn = {
    // Track which answers are used most
    recordUse: function (category) {
      var f = load(FREQ_KEY)
      f[category] = (f[category] || 0) + 1
      save(FREQ_KEY, f)
    },

    // Get most used categories
    getTopCategories: function (n) {
      var f = load(FREQ_KEY)
      var sorted = Object.keys(f).sort(function (a, b) { return f[b] - f[a] })
      return sorted.slice(0, n || 5)
    },

    // Prune rarely used learned data (older than 30 days, used < 3 times)
    prune: function () {
      var learned = load(LEARN_KEY)
      var now = Date.now()
      var thirtyDays = 30 * 24 * 60 * 60 * 1000
      var before = learned.length
      learned = learned.filter(function (item) {
        if (!item.ts) return true
        if (now - item.ts > thirtyDays && (item.freq || 0) < 3) return false
        return true
      })
      save(LEARN_KEY, learned)
      return before - learned.length
    },

    // Get learned count
    count: function () { return load(LEARN_KEY).length },

    // Get all learned data
    getAll: function () { return load(LEARN_KEY) },

    // Clear all learned data
    clear: function () { localStorage.removeItem(LEARN_KEY) },

    // Auto-prune on init (runs every 7 days)
    autoPrune: function () {
      var last = localStorage.getItem('xolerc_ai_prune_date')
      if (!last || Date.now() - parseInt(last || '0') > 7 * 24 * 60 * 60 * 1000) {
        var pruned = learn.prune()
        if (pruned > 0) console.log('AI: Pruned ' + pruned + ' old entries')
        localStorage.setItem('xolerc_ai_prune_date', String(Date.now()))
      }
    },

    // Simple reinforcement: if same question asked 5+ times, boost its priority
    boost: function () {
      var learned = load(LEARN_KEY)
      var stats = load(STATS_KEY)
      var boosted = 0
      for (var i = 0; i < learned.length; i++) {
        var q = learned[i].question
        var nq = q.toLowerCase().trim()
        if (stats[nq] && stats[nq] >= 5) {
          learned[i].priority = (learned[i].priority || 0) + 1
          stats[nq] = 0
          boosted++
        }
      }
      if (boosted) save(LEARN_KEY, learned)
      save(STATS_KEY, stats)
      return boosted
    }
  }

  // Auto-run
  learn.autoPrune()
  learn.boost()

  if (typeof window !== 'undefined') window.XOLERIC_LEARN = learn
})()
