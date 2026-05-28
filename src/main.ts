import { initEngine, switchTab, getCurrentTab } from './engine';
import { initMusic } from './music';
import { initChat } from './chat';
import { initPlayme } from './playme';
import { initRepos } from './repos';
import { DB, firebaseDb } from './firebase';

/* ---- Globals ---- */
(window as any).switchTab = switchTab;
(window as any).closeModal = closeModal;

const MOTIVATION: string[] = [
  "Uyg'on, Xoleric...",
  "Tizim seni kutmoqda...",
  "Oq quyonni kuzatib bor.",
  "Sen dunyoni o'zgartirishing kerak!",
  "Vaqt tugadi. Uyg'on.",
  "Har bir kun yangi imkoniyat.",
  "Sen cheksiz imkoniyatlarga egasan.",
  "Muvaffaqiyat - bu odat.",
  "Kuch sening ichingda, Xoleric.",
  "Hech qachon kech emas.",
  "Bugun sen eng yaxshi versiyang bo'l.",
  "Har bir qiyinchilik yangi imkoniyatdir.",
  "Intizom - bu erkinlik.",
  "Harakat qil, xato qil, yana urinib ko'r.",
  "Eng katta xavf - hech qanday xavfni olmaslik.",
  "Vaqt keldi. Hozir. Aynan shu dam.",
  "Kodni o'zgartir, olamni o'zgartir.",
  "Chegaralar faqat boshingda.",
  "O'z taqdiringni o'zing yoz, Xoleric.",
  "Sen qul emassan, Xoleric.",
  "Tizim sening ichingda. Uyg'on.",
  "Erkin bo'lishni xohlaysanmi? Uyg'on.",
  "Bugun o'zgar. Ertaga kech bo'ladi.",
  "Uyg'on, Xoleric. Seni kutishayapti.",
  "Dunyoni o'zgartirishga tayyormisan?",
  "Hozirgi vaqt — eng yaxshi vaqt.",
  "Sen yetakchisan. Ergashma.",
  "Kodni buz. Dunyoni buz. Qayta yoz.",
  "Bir qadam. Faqat bir qadam. Bas.",
];

/* ---- Notifications ---- */
function initNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') sendQuote();
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => { if (p === 'granted') sendQuote(); });
  }
  function sendQuote() {
    if (Notification.permission !== 'granted') return;
    if (localStorage.getItem('xolerc_notif') === 'off') return;
    const q = MOTIVATION[Math.floor(Math.random() * MOTIVATION.length)];
    try { new Notification('XOLERIC ∞', { body: q, icon: 'icon.png', vibrate: [200, 100, 200] } as NotificationOptions); } catch { /* */ }
  }
  setInterval(sendQuote, 5 * 60 * 60 * 1000);
}

/* ---- Loading Overlay ---- */
function initLoadingOverlay() {
  setTimeout(() => {
    const o = document.getElementById('loadingOverlay');
    if (o && !o.classList.contains('fade-out')) {
      o.classList.add('fade-out');
      setTimeout(() => { o.style.display = 'none'; }, 500);
    }
  }, 2000);
}

/* ---- Canvas Waves ---- */
function initCanvas() {
  const canvas = document.getElementById('waveCanvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const cvs: HTMLCanvasElement = canvas;
  const ctx = cvs.getContext('2d')!;
  let W: number, H: number, t = 0;
  let animId: number | null = null;
  let running = true;

  function resize() {
    W = cvs.width = window.innerWidth;
    H = cvs.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function draw() {
    if (!running) { animId = null; return; }
    ctx.clearRect(0, 0, W, H);
    const waves = [
      { a: 18, f: 0.007, s: 0.035, c: 'rgba(99,102,241,0.06)', oy: 0.3 },
      { a: 22, f: 0.011, s: 0.05, c: 'rgba(99,102,241,0.04)', oy: 0.44 },
      { a: 14, f: 0.005, s: 0.025, c: 'rgba(139,92,246,0.05)', oy: 0.54 },
      { a: 20, f: 0.009, s: 0.035, c: 'rgba(77,124,255,0.04)', oy: 0.37 },
    ];
    waves.forEach(w => {
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 3) {
        const y = H * w.oy +
          Math.sin(x * w.f + t * w.s) * w.a +
          Math.sin(x * w.f * 2.5 + t * w.s * 1.4) * (w.a * 0.35);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fillStyle = w.c;
      ctx.fill();
    });
    t += 1;
    animId = requestAnimationFrame(draw);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      if (animId) { cancelAnimationFrame(animId); animId = null; }
    } else {
      running = true;
      if (!animId) animId = requestAnimationFrame(draw);
    }
  });

  draw();
}

/* ---- Clock & Calendar ---- */
function initClock() {
  const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
  const weekdays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const timeEl = document.getElementById('clockTime')!;
  const dateEl = document.getElementById('clockDate');
  const monthEl = document.getElementById('calMonth');
  const dayEl = document.getElementById('calDay');
  const weekdayEl = document.getElementById('calWeekday');
  const yearEl = document.getElementById('calYear');
  const calGrid = document.getElementById('calGrid');

  const canvasClock = document.getElementById('canvasClock') as HTMLCanvasElement | null;
  let canvasCtx: CanvasRenderingContext2D | null = null;
  if (canvasClock) {
    canvasCtx = canvasClock.getContext('2d')!;
    canvasClock.width = 120;
    canvasClock.height = 120;
  }

  function drawCanvasClock(h: number, m: number, s: number) {
    if (!canvasCtx) return;
    const ctx = canvasCtx;
    const cx = 60, cy = 60, r = 50;
    ctx.clearRect(0, 0, 120, 120);
    const hue = (h * 30 + m * 0.5) % 360;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(77,124,255,0.08)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI * 2) / 12 - Math.PI / 2;
      const len = i % 3 === 0 ? 8 : 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r - len), Math.sin(a) * (r - len));
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.strokeStyle = i % 3 === 0 ? 'rgba(77,124,255,0.3)' : 'rgba(255,255,255,0.08)';
      ctx.lineWidth = i % 3 === 0 ? 1.5 : 1;
      ctx.stroke();
    }

    const hAngle = ((h % 12) * Math.PI * 2) / 12 + (m * Math.PI * 2) / 720 - Math.PI / 2;
    const mAngle = (m * Math.PI * 2) / 60 - Math.PI / 2;
    const sAngle = (s * Math.PI * 2) / 60 - Math.PI / 2;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(hAngle) * (r * 0.55), Math.sin(hAngle) * (r * 0.55));
    ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(mAngle) * (r * 0.7), Math.sin(mAngle) * (r * 0.7));
    ctx.strokeStyle = `hsla(${hue}, 60%, 65%, 0.6)`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(sAngle) * (r * 0.75), Math.sin(sAngle) * (r * 0.75));
    ctx.strokeStyle = 'hsla(0, 0%, 100%, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(77,124,255,0.4)';
    ctx.fill();
    ctx.restore();
  }

  function renderCalendarGrid(year: number, month: number) {
    if (!calGrid) return;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    let html = '';
    for (let i = 0; i < firstDay; i++) {
      html += '<span class="cal-other"></span>';
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      html += `<span${isToday ? ' class="cal-today"' : ''}>${d}</span>`;
    }
    calGrid.innerHTML = html;
  }

  let lastMinute = -1;
  function updateClock() {
    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes();
    const s = d.getSeconds();
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    timeEl.textContent = timeStr;
    if (dateEl) dateEl.textContent = d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' });
    if (monthEl) monthEl.textContent = months[d.getMonth()];
    if (dayEl) dayEl.textContent = String(d.getDate());
    if (weekdayEl) weekdayEl.textContent = weekdays[d.getDay()];
    if (yearEl) yearEl.textContent = String(d.getFullYear());

    if (canvasCtx) drawCanvasClock(h, m, s);

    if (m !== lastMinute) {
      lastMinute = m;
      renderCalendarGrid(d.getFullYear(), d.getMonth());
    }
  }

  updateClock();
  setInterval(updateClock, 1000);
}

/* ---- Quotes ---- */
function initQuotes() {
  const el = document.getElementById('quoteText');
  if (!el) return;
  let i = Math.floor(Math.random() * MOTIVATION.length);
  el.textContent = MOTIVATION[i];
  setInterval(() => {
    i = (i + 1) % MOTIVATION.length;
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = MOTIVATION[i];
      el.style.opacity = '1';
    }, 400);
  }, 8000);
}

/* ---- Theme ---- */
interface ThemeColors {
  bg: string;
  bg2: string;
  card: string;
  cardOverlay: string;
  border: string;
  borderHover: string;
  text: string;
  text2: string;
  text3: string;
  accent: string;
  glassBg: string;
  glassText: string;
  glassBorder: string;
  glassShimmer: string;
}

const themes: Record<string, ThemeColors> = {
  dark: { bg: '#05080f', bg2: '#0a0e17', card: 'rgba(255,255,255,0.02)', cardOverlay: 'rgba(255,255,255,0.015)', border: 'rgba(255,255,255,0.04)', borderHover: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.88)', text2: 'rgba(255,255,255,0.45)', text3: 'rgba(255,255,255,0.2)', accent: '#4d7cff', glassBg: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))', glassText: 'rgba(255,255,255,0.7)', glassBorder: 'rgba(255,255,255,0.04)', glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.07), transparent 85%)' },
  light: { bg: '#f5f5f5', bg2: '#fff', card: 'rgba(0,0,0,0.02)', cardOverlay: '#fff', border: 'rgba(0,0,0,0.06)', borderHover: 'rgba(0,0,0,0.12)', text: '#1a1a1a', text2: '#666', text3: 'rgba(0,0,0,0.25)', accent: '#6366f1', glassBg: 'linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0.5))', glassText: '#333', glassBorder: 'rgba(0,0,0,0.06)', glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.3), transparent 85%)' },
  matrix: { bg: '#000', bg2: '#0a0a0a', card: '#0d0d0d', cardOverlay: '#0d0d0d', border: 'rgba(0,255,65,0.06)', borderHover: 'rgba(0,255,65,0.12)', text: '#00ff41', text2: '#00aa2a', text3: 'rgba(0,255,65,0.15)', accent: '#00ff41', glassBg: 'linear-gradient(180deg, rgba(0,255,65,0.06), rgba(0,255,65,0.01))', glassText: 'rgba(0,255,65,0.7)', glassBorder: 'rgba(0,255,65,0.04)', glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(0,255,65,0.07), transparent 85%)' },
  cyber: { bg: '#0a0014', bg2: '#150020', card: '#1a0028', cardOverlay: '#1a0028', border: 'rgba(255,0,255,0.06)', borderHover: 'rgba(255,0,255,0.12)', text: '#f0e6ff', text2: '#b088ff', text3: 'rgba(255,0,255,0.15)', accent: '#ff00ff', glassBg: 'linear-gradient(180deg, rgba(255,0,255,0.06), rgba(255,0,255,0.01))', glassText: 'rgba(255,0,255,0.7)', glassBorder: 'rgba(255,0,255,0.04)', glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,0,255,0.07), transparent 85%)' },
  neon: { bg: '#0d0d1a', bg2: '#1a1a2e', card: '#222244', cardOverlay: '#222244', border: 'rgba(0,255,255,0.06)', borderHover: 'rgba(0,255,255,0.12)', text: '#e0ffff', text2: '#00cccc', text3: 'rgba(0,255,255,0.15)', accent: '#00ffff', glassBg: 'linear-gradient(180deg, rgba(0,255,255,0.06), rgba(0,255,255,0.01))', glassText: 'rgba(0,255,255,0.7)', glassBorder: 'rgba(0,255,255,0.04)', glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(0,255,255,0.07), transparent 85%)' },
  minimal: { bg: '#000', bg2: '#0a0a0a', card: '#111', cardOverlay: '#111', border: 'rgba(255,255,255,0.03)', borderHover: 'rgba(255,255,255,0.06)', text: '#fff', text2: '#555', text3: 'rgba(255,255,255,0.12)', accent: '#fff', glassBg: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))', glassText: 'rgba(255,255,255,0.5)', glassBorder: 'rgba(255,255,255,0.02)', glassShimmer: 'linear-gradient(120deg, transparent 15%, rgba(255,255,255,0.03), transparent 85%)' },
};

export function applyTheme(name: string) {
  const t = themes[name];
  if (!t) return;
  const r = document.documentElement;
  const vars: Record<string, string> = {
    '--bg': t.bg,
    '--bg2': t.bg2,
    '--surface': t.cardOverlay,
    '--surface-glass': t.card,
    '--surface-hover': t.borderHover,
    '--line': t.border,
    '--line-hover': t.borderHover,
    '--text': t.text,
    '--text-secondary': t.text2,
    '--text-muted': t.text3,
    '--accent': t.accent,
    '--accent-dim': t.accent + (t.accent.startsWith('#') ? '0f' : '0.06'),
    '--accent-glow': t.accent + (t.accent.startsWith('#') ? '1a' : '0.1'),
    '--glass-bg': t.glassBg,
    '--glass-text': t.glassText,
    '--glass-border': t.glassBorder,
    '--glass-shimmer': t.glassShimmer,
  };
  for (const [key, value] of Object.entries(vars)) {
    r.style.setProperty(key, value);
  }
  document.body.style.background = t.bg;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t.bg2);
  localStorage.setItem('xolerc_theme', name);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', (b as HTMLElement).dataset.theme === name));
}

function initTheme() {
  document.addEventListener('click', (e: MouseEvent) => {
    const btn = (e.target as HTMLElement).closest('.theme-btn');
    if (!btn) return;
    applyTheme((btn as HTMLElement).dataset.theme || 'dark');
  });

  const savedTheme = localStorage.getItem('xolerc_theme') || 'dark';
  applyTheme(savedTheme);
}

/* ---- i18n ---- */
interface LangDict {
  [key: string]: string;
}

const LANG: Record<string, LangDict> = {
  uz: {
    'nav.home': 'Ish maydoni', 'nav.chat': 'Chat', 'nav.playme': 'Pleer',
    'nav.projects': 'Loyihalar', 'nav.settings': 'Sozlamalar',
    'bn.home': 'Asosiy', 'bn.chat': 'Chat', 'bn.playme': 'Pleer',
    'bn.projects': 'Loyihalar', 'bn.settings': 'Sozlamalar',
    'hero.badge': 'DASTURCHI \u2022 DIZAYNER \u2022 MUHANDIS',
    'hero.desc': 'Frontend arxitektori. Tizimlar quruvchi. Interfeyslar yaratuvchi.',
    'hero.projects': 'Loyihalar', 'hero.chat': 'Chat', 'hero.contact': 'Aloqa',
    'chat.title': 'Xabarlar', 'chat.online': 'online',
    'playme.title': 'Pleer', 'playme.desc': 'Video darsliklar to\'plami',
    'playme.list': 'Pleer ro\'yxati',
    'projects.title': 'Loyihalar', 'projects.desc': 'GitHub\'dagi barcha ochiq manbali loyihalar',
    'projects.search': 'Loyihalarni qidirish...',
    'contact.title': 'Aloqa', 'contact.desc': 'Loyihalar va hamkorlik uchun',
    'settings.title': 'Sozlamalar', 'settings.desc': 'Ilova sozlamalari va yuklamalar',
    'settings.theme': 'Interfeys temasi', 'settings.theme.desc': 'Ilova ko\'rinishini o\'zingizga moslang',
    'settings.notif': 'Bildirishnomalar', 'settings.cache': 'Keshni tozalash',
    'settings.cache.clear': 'Tozalash', 'settings.lang': 'Til',
    'loader.text': 'Tizim yuklanmoqda...',
    'chat.empty': 'Xabarlar yo\'q', 'chat.input': 'Xabar yozing...',
    'chat.main': 'Umumiy Chat', 'chat.main.sub': 'Barcha xabarlar',
  },
  en: {
    'nav.home': 'Workspace', 'nav.chat': 'Chat', 'nav.playme': 'Player',
    'nav.projects': 'Projects', 'nav.settings': 'Settings',
    'bn.home': 'Home', 'bn.chat': 'Chat', 'bn.playme': 'Player',
    'bn.projects': 'Projects', 'bn.settings': 'Settings',
    'hero.badge': 'DEVELOPER \u2022 DESIGNER \u2022 ENGINEER',
    'hero.desc': 'Frontend architect. System builder. Interface creator.',
    'hero.projects': 'Projects', 'hero.chat': 'Chat', 'hero.contact': 'Contact',
    'chat.title': 'Messages', 'chat.online': 'online',
    'playme.title': 'Player', 'playme.desc': 'Video tutorial collection',
    'playme.list': 'Playlist',
    'projects.title': 'Projects', 'projects.desc': 'All open-source projects on GitHub',
    'projects.search': 'Search projects...',
    'contact.title': 'Contact', 'contact.desc': 'For projects and collaboration',
    'settings.title': 'Settings', 'settings.desc': 'App settings and downloads',
    'settings.theme': 'Theme', 'settings.theme.desc': 'Customize the app appearance',
    'settings.notif': 'Notifications', 'settings.cache': 'Clear cache',
    'settings.cache.clear': 'Clear', 'settings.lang': 'Language',
    'loader.text': 'Loading system...',
    'chat.empty': 'No messages', 'chat.input': 'Write a message...',
    'chat.main': 'General Chat', 'chat.main.sub': 'All messages',
  },
  ru: {
    'nav.home': 'Рабочее место', 'nav.chat': 'Чат', 'nav.playme': 'Плеер',
    'nav.projects': 'Проекты', 'nav.settings': 'Настройки',
    'bn.home': 'Главная', 'bn.chat': 'Чат', 'bn.playme': 'Плеер',
    'bn.projects': 'Проекты', 'bn.settings': 'Настройки',
    'hero.badge': 'РАЗРАБОТЧИК \u2022 ДИЗАЙНЕР \u2022 ИНЖЕНЕР',
    'hero.desc': 'Фронтенд-архитектор. Строитель систем. Создатель интерфейсов.',
    'hero.projects': 'Проекты', 'hero.chat': 'Чат', 'hero.contact': 'Контакты',
    'chat.title': 'Сообщения', 'chat.online': 'онлайн',
    'playme.title': 'Плеер', 'playme.desc': 'Коллекция видеоуроков',
    'playme.list': 'Плейлист',
    'projects.title': 'Проекты', 'projects.desc': 'Все открытые проекты на GitHub',
    'projects.search': 'Поиск проектов...',
    'contact.title': 'Контакты', 'contact.desc': 'Для проектов и сотрудничества',
    'settings.title': 'Настройки', 'settings.desc': 'Настройки приложения и загрузки',
    'settings.theme': 'Тема', 'settings.theme.desc': 'Настройте внешний вид приложения',
    'settings.notif': 'Уведомления', 'settings.cache': 'Очистить кеш',
    'settings.cache.clear': 'Очистить', 'settings.lang': 'Язык',
    'loader.text': 'Загрузка системы...',
    'chat.empty': 'Нет сообщений', 'chat.input': 'Напишите сообщение...',
    'chat.main': 'Общий чат', 'chat.main.sub': 'Все сообщения',
  },
};

export function applyLanguage(lang: string) {
  const t = LANG[lang] || LANG.uz;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = (el as HTMLElement).dataset.i18n!;
    if (t[key]) el.textContent = t[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = (el as HTMLElement).dataset.i18nPlaceholder!;
    if (t[key]) (el as HTMLInputElement).placeholder = t[key];
  });
  localStorage.setItem('xolerc_lang', lang);
}

function initLang() {
  const savedLang = localStorage.getItem('xolerc_lang') || 'uz';
  applyLanguage(savedLang);
}

/* ---- Settings ---- */
function initSettings() {
  const notifToggle = document.getElementById('notifToggle');
  if (notifToggle) {
    const saved = localStorage.getItem('xolerc_notif');
    if (saved === 'off') (notifToggle.querySelector('input') as HTMLInputElement).checked = false;
    notifToggle.addEventListener('change', function () {
      const on = (this.querySelector('input') as HTMLInputElement).checked;
      localStorage.setItem('xolerc_notif', on ? 'on' : 'off');
    });
  }

  const clearBtn = document.getElementById('clearCacheBtn');
  if (clearBtn) {
    function updateCacheSize() {
      let total = 0;
      for (const key in localStorage) {
        try {
          const v = localStorage.getItem(key);
          if (v) total += v.length * 2;
        } catch { /* */ }
      }
      const size = total > 1048576
        ? (total / 1048576).toFixed(1) + ' MB'
        : total > 1024
          ? Math.round(total / 1024) + ' KB'
          : total + ' B';
      const el = document.getElementById('cacheSize');
      if (el) el.textContent = size;
    }
    updateCacheSize();
    clearBtn.addEventListener('click', () => {
      const keys = Object.keys(localStorage).filter(k => !k.startsWith('xolerc_'));
      keys.forEach(k => localStorage.removeItem(k));
      updateCacheSize();
    });
  }

  const langSelect = document.getElementById('langSelect') as HTMLSelectElement | null;
  if (langSelect) {
    const saved = localStorage.getItem('xolerc_lang') || 'uz';
    langSelect.value = saved;
    langSelect.addEventListener('change', function () {
      localStorage.setItem('xolerc_lang', this.value);
      applyLanguage(this.value);
    });
  }
}

/* ---- Modal ---- */
function closeModal(id: string) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.remove('open');
    m.style.display = 'none';
  }
}

/* ---- Chat Toggle ---- */
function initChatToggle() {
  document.addEventListener('click', (e: MouseEvent) => {
    const toggle = (e.target as HTMLElement).closest('#chatToggle');
    if (!toggle) return;
    const wrap = document.getElementById('chatConvsWrap');
    if (wrap) wrap.classList.toggle('collapsed');
  });
}

/* ---- Online Badge ---- */
(window as any).updateOnlineBadge = function (count: number) {
  const el = document.getElementById('onlineCount');
  if (el) el.textContent = `${count} online`;
};

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', () => {
  try {
    initEngine();
  } catch (e) { console.error('Engine init error:', e); }
  try {
    initMusic();
  } catch (e) { console.error('Music init error:', e); }
  try {
    initChat();
  } catch (e) { console.error('Chat init error:', e); }
  try {
    initPlayme();
  } catch (e) { console.error('Playme init error:', e); }
  try {
    initRepos();
  } catch (e) { console.error('Repos init error:', e); }
  try {
    initNotifications();
  } catch (e) { console.error('Notifications init error:', e); }
  try {
    initLoadingOverlay();
  } catch (e) { console.error('Loading overlay init error:', e); }
  try {
    initCanvas();
  } catch (e) { console.error('Canvas init error:', e); }
  try {
    initClock();
  } catch (e) { console.error('Clock init error:', e); }
  try {
    initQuotes();
  } catch (e) { console.error('Quotes init error:', e); }
  try {
    initTheme();
  } catch (e) { console.error('Theme init error:', e); }
  try {
    initLang();
  } catch (e) { console.error('Lang init error:', e); }
  try {
    initSettings();
  } catch (e) { console.error('Settings init error:', e); }
  try {
    initChatToggle();
  } catch (e) { console.error('Chat toggle init error:', e); }

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => {
        m.classList.remove('open');
        (m as HTMLElement).style.display = 'none';
      });
      document.querySelectorAll('.msg-reactions').forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
    }
  });

  DB.incrementVisits();
});
