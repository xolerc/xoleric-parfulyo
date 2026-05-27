(async function loadRepos() {
  const grid = document.getElementById('projectsGrid');
  const loading = document.getElementById('projectsLoading');
  if (!grid) return;

  try {
    const res = await fetch('https://api.github.com/users/xolerc/repos?sort=updated&per_page=100');
    if (!res.ok) throw new Error('GitHub API error');
    let repos = await res.json();

    loading.style.display = 'none';

    if (!repos.length) {
      grid.innerHTML = '<p style="color:var(--text-secondary);text-align:center;grid-column:1/-1;padding:40px;font-size:13px;">Hozircha loyihalar mavjud emas.</p>';
      return;
    }

    grid.innerHTML = repos.map(r => {
      const lang = r.language || '';
      const desc = r.description || 'Tavsif mavjud emas';
      const stars = r.stargazers_count || 0;
      const homepage = r.homepage || '';

      return '<a href="' + r.html_url + '" target="_blank" class="project-card">' +
        '<div class="project-name">' + esc(r.name) + '</div>' +
        '<div class="project-desc">' + esc(desc) + '</div>' +
        (lang ? '<div class="project-lang">' + esc(lang) + '</div>' : '') +
        '<div class="project-stars">\u2605 ' + stars + '</div>' +
        '<div class="project-links">' +
          '<span class="project-link">GITHUB</span>' +
          (homepage ? '<span class="project-link">SAYT</span>' : '') +
        '</div></a>';
    }).join('');
  } catch (err) {
    loading.innerHTML = '<span style="color:var(--text-muted)">Yuklashda xatolik. Qayta urinib ko\'ring.</span>';
  }
})();
