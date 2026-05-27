let allRepos = [];

function getLangClass(lang) {
  const map = {
    'javascript': 'js',
    'typescript': 'typescript',
    'python': 'python',
    'html': 'html',
    'css': 'css',
    'kotlin': 'kotlin',
  };
  return map[(lang || '').toLowerCase()] || '';
}

function renderRepos(repos) {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  if (!repos.length) {
    grid.innerHTML = '<p style="color:var(--text-secondary);text-align:center;grid-column:1/-1;padding:40px;font-size:13px;">Hech narsa topilmadi.</p>';
    return;
  }
  grid.innerHTML = repos.map(r => {
    const lang = r.language || '';
    const desc = r.description || 'Tavsif mavjud emas. Ushbu loyiha haqida batafsil ma\'lumot olish uchun GitHub\'ga o\'ting.';
    const stars = r.stargazers_count || 0;
    const forks = r.forks_count || 0;
    const homepage = r.homepage || '';
    const langCls = getLangClass(lang);

    return '<div class="project-card">' +
      '<div class="project-name">' + esc(r.name) + '</div>' +
      '<div class="project-desc">' + esc(desc) + '</div>' +
      (lang ? '<div class="project-tags"><span class="project-tag ' + langCls + '">' + esc(lang) + '</span></div>' : '') +
      '<div class="project-meta">' +
      '<span class="project-stars">' + stars + '</span>' +
      '<span class="project-forks">' + forks + '</span>' +
      '</div>' +
      '<div class="project-actions">' +
      '<a href="' + r.html_url + '" target="_blank" class="project-action github">GitHub</a>' +
      (homepage ? '<a href="' + homepage + '" target="_blank" class="project-action demo">Sayt</a>' : '') +
      '</div></div>';
  }).join('');
}

function filterAndRender() {
  const query = (document.getElementById('projectsSearch').value || '').toLowerCase().trim();
  const activeFilter = document.querySelector('.project-filter-btn.active');
  const langFilter = activeFilter ? activeFilter.dataset.lang : '';

  let filtered = allRepos;
  if (query) {
    filtered = filtered.filter(r =>
      (r.name || '').toLowerCase().includes(query) ||
      (r.description || '').toLowerCase().includes(query) ||
      (r.language || '').toLowerCase().includes(query)
    );
  }
  if (langFilter) {
    filtered = filtered.filter(r => (r.language || '').toLowerCase() === langFilter.toLowerCase());
  }
  renderRepos(filtered);
}

(async function loadRepos() {
  const grid = document.getElementById('projectsGrid');
  const loading = document.getElementById('projectsLoading');
  if (!grid) return;

  try {
    const res = await fetch('https://api.github.com/users/xolerc/repos?sort=updated&per_page=100');
    if (!res.ok) throw new Error('GitHub API error');
    allRepos = await res.json();

    loading.style.display = 'none';

    if (!allRepos.length) {
      grid.innerHTML = '<p style="color:var(--text-secondary);text-align:center;grid-column:1/-1;padding:40px;font-size:13px;">Hozircha loyihalar mavjud emas.</p>';
      return;
    }

    // Build language filters
    const langs = [...new Set(allRepos.map(r => r.language).filter(Boolean))];
    const filterContainer = document.getElementById('projectsFilters');
    if (filterContainer && langs.length) {
      filterContainer.innerHTML = '<button class="project-filter-btn active" data-lang="">Barchasi</button>' +
        langs.map(l => '<button class="project-filter-btn" data-lang="' + l + '">' + l + '</button>').join('');
      filterContainer.querySelectorAll('.project-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          filterContainer.querySelectorAll('.project-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          filterAndRender();
        });
      });
    }

    filterAndRender();
  } catch (err) {
    if (loading) loading.innerHTML = '<span style="color:var(--text-muted)">Yuklashda xatolik. Qayta urinib ko\'ring.</span>';
  }
})();

document.addEventListener('input', e => {
  if (e.target.id === 'projectsSearch') filterAndRender();
});
