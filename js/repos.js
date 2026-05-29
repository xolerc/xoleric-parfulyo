(function () {
  'use strict'
  var allRepos = []

  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

  var LANG_COLORS = {
    javascript: '#f7df1e', typescript: '#3178c6', python: '#3572a5', html: '#e34c26',
    css: '#563d7c', kotlin: '#a97bff', java: '#b07219', go: '#00add8', rust: '#dea584',
    php: '#4f5d95', ruby: '#701516', c: '#555555', 'c++': '#f34b7d', 'c#': '#178600',
    swift: '#ffac45', dart: '#00b4ab', scala: '#c22d40', shell: '#89e051'
  }

  function langColor(lang) { return LANG_COLORS[(lang || '').toLowerCase()] || '#8b8b8b' }

  function renderRepos(repos) {
    var grid = document.getElementById('projectsGrid')
    if (!grid) return
    if (!repos.length) { grid.innerHTML = '<p style="color:var(--text-secondary);text-align:center;grid-column:1/-1;padding:40px;font-size:13px;">Hech narsa topilmadi.</p>'; return }
    grid.innerHTML = repos.map(function (r) {
      var lang = r.language || '', desc = r.description || 'Tavsif mavjud emas.'
      return '<div class="project-card" tabindex="0" role="button" data-url="' + esc(r.html_url) + '">' +
        '<div class="project-card-top">' +
        '<div class="project-card-title">' + esc(r.name) + '</div>' +
        '<span class="project-card-gh" title="GitHub"></span>' +
        '</div>' +
        '<div class="project-card-desc">' + esc(desc) + '</div>' +
        (lang ? '<div class="project-card-lang"><span class="project-lang-dot" style="background:' + langColor(lang) + '"></span>' + esc(lang) + '</div>' : '') +
        '</div>'
    }).join('')
    grid.querySelectorAll('.project-card').forEach(function (c) {
      c.addEventListener('click', function () { var u = c.dataset.url; if (u) window.open(u, '_blank') })
    })
  }

  function filterAndRender() {
    var input = document.getElementById('projectsSearch')
    var q = (input ? input.value : '').toLowerCase().trim()
    var act = document.querySelector('.project-filter-btn.active')
    var langFilter = act ? act.dataset.lang : ''
    var filtered = allRepos
    if (q) filtered = filtered.filter(function (r) { return (r.name || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q) || (r.language || '').toLowerCase().includes(q) })
    if (langFilter) filtered = filtered.filter(function (r) { return (r.language || '').toLowerCase() === langFilter.toLowerCase() })
    renderRepos(filtered)
  }

  window.initRepos = function () {
    var grid = document.getElementById('projectsGrid')
    var loading = document.getElementById('projectsLoading')
    if (!grid || !loading) return
    var CACHE_KEY = 'xolerc_repos', CACHE_TTL = 5 * 60 * 1000

    function loadCached() {
      try {
        var raw = localStorage.getItem(CACHE_KEY)
        if (!raw) return null
        var c = JSON.parse(raw)
        if (Date.now() - c.time > CACHE_TTL) return null
        return c.data
      } catch (e) { return null }
    }
    function saveCache(data) { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data: data, time: Date.now() })) } catch (e) { } }

    var cached = loadCached()
    if (cached) { allRepos = cached; loading.style.display = 'none'; buildFilters(); filterAndRender(); return }

    ;(async function () {
      try {
        var res = await fetch('https://api.github.com/users/xolerc/repos?sort=updated&per_page=100')
        if (!res.ok) { throw new Error(res.status === 403 ? 'GitHub API limiti tugagan.' : 'GitHub API error: ' + res.status) }
        allRepos = await res.json()
        saveCache(allRepos)
        loading.style.display = 'none'
        if (!allRepos.length) { grid.innerHTML = '<p style="color:var(--text-secondary);text-align:center;grid-column:1/-1;padding:40px;font-size:13px;">Hozircha loyihalar mavjud emas.</p>'; return }
        buildFilters()
        filterAndRender()
      } catch (err) {
        loading.innerHTML = '<span style="color:var(--text-muted)">Yuklashda xatolik. Qayta urinib ko\'ring.</span>'
        grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;padding:40px;font-size:13px;">' + esc(err.message || 'Xatolik') + '</p>'
      }
    })()

    function buildFilters() {
      var langs = [...new Set(allRepos.map(function (r) { return r.language }).filter(Boolean))]
      var fc = document.getElementById('projectsFilters')
      if (!fc || !langs.length) return
      fc.innerHTML = '<button class="project-filter-btn active" data-lang="">Barchasi</button>' + langs.map(function (l) { return '<button class="project-filter-btn" data-lang="' + l + '"><span class="filter-glow"></span>' + esc(l) + '</button>' }).join('')
      fc.querySelector('.project-filter-btn.active') && fc.querySelector('.project-filter-btn.active').classList.add('glow')
      fc.querySelectorAll('.project-filter-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          fc.querySelectorAll('.project-filter-btn').forEach(function (b) { b.classList.remove('active', 'glow') })
          btn.classList.add('active', 'glow')
          filterAndRender()
        })
      })
    }

    document.addEventListener('input', function (e) { if (e.target.id === 'projectsSearch') filterAndRender() })
  }
})()
