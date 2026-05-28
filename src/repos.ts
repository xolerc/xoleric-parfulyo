import { escHtml } from './firebase';

interface Repo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  homepage: string | null;
}

let allRepos: Repo[] = [];

function getLangClass(lang: string): string {
  const map: Record<string, string> = {
    'javascript': 'js',
    'typescript': 'typescript',
    'python': 'python',
    'html': 'html',
    'css': 'css',
    'kotlin': 'kotlin',
  };
  return map[(lang || '').toLowerCase()] || '';
}

function renderRepos(repos: Repo[]) {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  if (!repos.length) {
    grid.innerHTML = '<p style="color:var(--text-secondary);text-align:center;grid-column:1/-1;padding:40px;font-size:13px;">Hech narsa topilmadi.</p>';
    return;
  }
  grid.innerHTML = repos.map(r => {
    const lang = r.language || '';
    const desc = r.description || 'Tavsif mavjud emas.';
    const stars = r.stargazers_count || 0;
    const forks = r.forks_count || 0;
    const homepage = r.homepage || '';
    const langCls = getLangClass(lang);

    return '<div class="project-card">' +
      '<div class="project-name">' + escHtml(r.name) + '</div>' +
      '<div class="project-desc">' + escHtml(desc) + '</div>' +
      (lang ? '<div class="project-tags"><span class="project-tag ' + langCls + '">' + escHtml(lang) + '</span></div>' : '') +
      '<div class="project-meta">' +
      '<span class="project-stars">' + stars + '</span>' +
      '<span class="project-forks">' + forks + '</span>' +
      '</div>' +
      '<div class="project-actions">' +
      '<a href="' + r.html_url + '" target="_blank" rel="noopener noreferrer" class="project-action github">GitHub</a>' +
      (homepage ? '<a href="' + homepage + '" target="_blank" rel="noopener noreferrer" class="project-action demo">Sayt</a>' : '') +
      '</div></div>';
  }).join('');
}

function filterAndRender() {
  const searchInput = document.getElementById('projectsSearch') as HTMLInputElement;
  const query = (searchInput?.value || '').toLowerCase().trim();
  const activeFilter = document.querySelector('.project-filter-btn.active');
  const langFilter = activeFilter ? (activeFilter as HTMLElement).dataset.lang : '';

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

export function initRepos() {
  const grid = document.getElementById('projectsGrid');
  const loading = document.getElementById('projectsLoading');
  if (!grid || !loading) return;

  const CACHE_KEY = 'xolerc_repos';
  const CACHE_TTL = 5 * 60 * 1000;

  function loadCached(): Repo[] | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      if (Date.now() - cached.time > CACHE_TTL) return null;
      return cached.data;
    } catch { return null; }
  }

  function saveCache(data: Repo[]) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, time: Date.now() }));
    } catch { /* */ }
  }

  const cached = loadCached();
  if (cached) {
    allRepos = cached;
    loading.style.display = 'none';
    buildFilters();
    filterAndRender();
    return;
  }

  (async () => {
    try {
      const res = await fetch('https://api.github.com/users/xolerc/repos?sort=updated&per_page=100');
      if (!res.ok) {
        if (res.status === 403) throw new Error('GitHub API limiti tugagan. Keyinroq qayta urinib ko\'ring.');
        throw new Error('GitHub API error: ' + res.status);
      }
      allRepos = await res.json();
      saveCache(allRepos);

      loading.style.display = 'none';

      if (!allRepos.length) {
        grid.innerHTML = '<p style="color:var(--text-secondary);text-align:center;grid-column:1/-1;padding:40px;font-size:13px;">Hozircha loyihalar mavjud emas.</p>';
        return;
      }

      buildFilters();
      filterAndRender();
    } catch (err: any) {
      loading.innerHTML = '<span style="color:var(--text-muted)">Yuklashda xatolik. Qayta urinib ko\'ring.</span>';
      grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1;padding:40px;font-size:13px;">' +
        escHtml(err.message || 'Xatolik yuz berdi') + '</p>';
    }
  })();

  function buildFilters() {
    const langs = [...new Set(allRepos.map(r => r.language).filter(Boolean))] as string[];
    const filterContainer = document.getElementById('projectsFilters');
    if (!filterContainer || !langs.length) return;
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

  document.addEventListener('input', (e: Event) => {
    if ((e.target as HTMLElement).id === 'projectsSearch') filterAndRender();
  });
}
