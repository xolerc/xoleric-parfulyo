(function () {
  'use strict'
  var allRepos = []

  function langClass(lang) {
    var m = { javascript: 'js', typescript: 'typescript', python: 'python', html: 'html', css: 'css', kotlin: 'kotlin' }
    return m[(lang || '').toLowerCase()] || ''
  }

  function renderRepos(repos) {
    var grid = document.getElementById('projectsGrid')
    if (!grid) return
    if (!repos.length) { grid.innerHTML = '<p style="color:var(--text-secondary);text-align:center;grid-column:1/-1;padding:40px;font-size:13px;">Hech narsa topilmadi.</p>'; return }
    grid.innerHTML = repos.map(function (r) {
      var lang = r.language || '', desc = r.description || 'Tavsif mavjud emas.'
      var stars = r.stargazers_count || 0, forks = r.forks_count || 0, hp = r.homepage || ''
      return '<div class="project-card">' +
        '<div class="project-name">' + window.escHtml(r.name) + '</div>' +
        '<div class="project-desc">' + window.escHtml(desc) + '</div>' +
        (lang ? '<div class="project-tags"><span class="project-tag ' + langClass(lang) + '">' + window.escHtml(lang) + '</span></div>' : '') +
        '<div class="project-meta"><span class="project-stars">' + stars + '</span><span class="project-forks">' + forks + '</span></div>' +
        '<div class="project-actions">' +
        '<a href="' + r.html_url + '" target="_blank" rel="noopener noreferrer" class="project-action github">GitHub</a>' +
        (hp ? '<a href="' + hp + '" target="_blank" rel="noopener noreferrer" class="project-action demo">Sayt</a>' : '') +
        '</div></div>'
    }).join('')
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
        grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;padding:40px;font-size:13px;">' + window.escHtml(err.message || 'Xatolik') + '</p>'
      }
    })()

    function buildFilters() {
      var langs = [...new Set(allRepos.map(function (r) { return r.language }).filter(Boolean))]
      var fc = document.getElementById('projectsFilters')
      if (!fc || !langs.length) return
      fc.innerHTML = '<button class="project-filter-btn active" data-lang="">Barchasi</button>' + langs.map(function (l) { return '<button class="project-filter-btn" data-lang="' + l + '">' + l + '</button>' }).join('')
      fc.querySelectorAll('.project-filter-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { fc.querySelectorAll('.project-filter-btn').forEach(function (b) { b.classList.remove('active') }); btn.classList.add('active'); filterAndRender() })
      })
    }

    document.addEventListener('input', function (e) { if (e.target.id === 'projectsSearch') filterAndRender() })
  }
})()
