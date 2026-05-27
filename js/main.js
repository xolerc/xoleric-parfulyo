const MOTIVATION = [
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

(function scheduleNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') sendQuote();
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => { if (p === 'granted') sendQuote(); });
  }
  function sendQuote() {
    if (Notification.permission !== 'granted') return;
    const q = MOTIVATION[Math.floor(Math.random() * MOTIVATION.length)];
    try { new Notification('XOLERIC ∞', { body: q, icon: 'icon.png', vibrate: [200,100,200] }); } catch {}
  }
  setInterval(sendQuote, 5 * 60 * 60 * 1000);
})();

const TABS = ['home','chat','playme','projects','contact','settings'];
let currentTab = 0;
let tabStack = [0];

function navigateTo(idx, record) {
  if (idx < 0 || idx >= TABS.length || idx === currentTab) return;
  currentTab = idx;
  const track = document.querySelector('.tabs-track');
  if (track) track.style.transform = 'translateX(-' + (idx * 100) + '%)';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === TABS[idx]));
  document.querySelectorAll('.bn-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === TABS[idx]));
  if (record) {
    tabStack.push(idx);
    history.pushState({ tab: idx }, '');
  }
}

function switchTab(name) {
  const idx = TABS.indexOf(name);
  if (idx >= 0) navigateTo(idx, true);
}

document.querySelectorAll('.nav-btn, .bn-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Touch swipe (desktop — tab-area only, not bottom nav)
(function() {
  const ws = document.querySelector('.workspace');
  if (!ws) return;
  let sx = 0, dx = 0, dragging = false;
  ws.addEventListener('touchstart', e => { sx = e.touches[0].clientX; dragging = true; }, { passive: true });
  ws.addEventListener('touchmove', e => { if (dragging) dx = e.touches[0].clientX - sx; }, { passive: true });
  ws.addEventListener('touchend', () => {
    if (!dragging) return;
    dragging = false;
    if (Math.abs(dx) > 50) {
      navigateTo(Math.max(0, Math.min(TABS.length - 1, currentTab + (dx < 0 ? 1 : -1))), true);
    }
    dx = 0;
  });
})();

// Back button
window.addEventListener('popstate', e => {
  if (e.state && e.state.tab !== undefined && e.state.tab !== currentTab) {
    navigateTo(e.state.tab, false);
    return;
  }
  if (tabStack.length > 1) {
    tabStack.pop();
    const prev = tabStack[tabStack.length - 1];
    history.replaceState({ tab: prev }, '');
    navigateTo(prev, false);
  }
});

window.addEventListener('load', () => {
  const hash = location.hash.replace('#', '');
  const start = (hash && TABS.includes(hash)) ? TABS.indexOf(hash) : 0;
  currentTab = start;
  tabStack = [start];
  history.replaceState({ tab: start }, '');
  const track = document.querySelector('.tabs-track');
  if (track) track.style.transform = 'translateX(-' + (start * 100) + '%)';
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === TABS[start]));
  document.querySelectorAll('.bn-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === TABS[start]));
});

// Chat toggle
document.addEventListener('click', e => {
  const toggle = e.target.closest('#chatToggle');
  if (!toggle) return;
  const wrap = document.getElementById('chatConvsWrap');
  if (wrap) wrap.classList.toggle('collapsed');
});

// ===== WAVE CANVAS =====
(function() {
  const canvas = document.getElementById('waveCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize);
  resize();
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const waves = [
      { a:18, f:0.007, s:0.035, c:'rgba(99,102,241,0.06)', oy:0.3 },
      { a:22, f:0.011, s:0.05, c:'rgba(99,102,241,0.04)', oy:0.44 },
      { a:14, f:0.005, s:0.025, c:'rgba(139,92,246,0.05)', oy:0.54 },
      { a:20, f:0.009, s:0.035, c:'rgba(77,124,255,0.04)', oy:0.37 },
    ];
    waves.forEach(w => {
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 2) {
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
    requestAnimationFrame(draw);
  }
  draw();
})();

// ===== MUSIC TOGGLE =====
(function() {
  const audio = document.getElementById('bgMusic');
  const btn = document.getElementById('musicToggle');
  if (!audio || !btn) return;
  let playing = false;
  btn.addEventListener('click', () => {
    if (playing) { audio.pause(); btn.classList.remove('playing'); }
    else { audio.play().catch(() => {}); btn.classList.add('playing'); }
    playing = !playing;
  });
})();

// ===== MOTIVATION QUOTES ROTATION =====
(function() {
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
})();

// ===== THEMES =====
const themes = {
  dark: { bg:'#05080f', bg2:'#0a0e17', card:'rgba(255,255,255,0.02)', border:'rgba(255,255,255,0.04)', text:'rgba(255,255,255,0.88)', text2:'rgba(255,255,255,0.35)', accent:'#4d7cff' },
  light: { bg:'#f5f5f5', bg2:'#fff', card:'#fff', border:'rgba(0,0,0,0.06)', text:'#1a1a1a', text2:'#888', accent:'#6366f1' },
  matrix: { bg:'#000', bg2:'#0a0a0a', card:'#0d0d0d', border:'rgba(0,255,65,0.06)', text:'#00ff41', text2:'#00aa2a', accent:'#00ff41' },
  cyber: { bg:'#0a0014', bg2:'#150020', card:'#1a0028', border:'rgba(255,0,255,0.06)', text:'#f0e6ff', text2:'#b088ff', accent:'#ff00ff' },
  neon: { bg:'#0d0d1a', bg2:'#1a1a2e', card:'#222244', border:'rgba(0,255,255,0.06)', text:'#e0ffff', text2:'#00cccc', accent:'#00ffff' },
  minimal: { bg:'#000', bg2:'#0a0a0a', card:'#111', border:'rgba(255,255,255,0.03)', text:'#fff', text2:'#555', accent:'#fff' },
};

function applyTheme(name) {
  const t = themes[name] || themes.dark;
  const r = document.documentElement;
  r.style.setProperty('--bg', t.bg);
  r.style.setProperty('--bg2', t.bg2);
  r.style.setProperty('--surface-glass', t.card);
  r.style.setProperty('--line', t.border);
  r.style.setProperty('--text', t.text);
  r.style.setProperty('--text-secondary', t.text2);
  r.style.setProperty('--accent', t.accent);
  document.body.style.background = t.bg;
  localStorage.setItem('xolerc_theme', name);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === name));
}

document.addEventListener('click', e => {
  const btn = e.target.closest('.theme-btn');
  if (!btn) return;
  applyTheme(btn.dataset.theme);
});

const savedTheme = localStorage.getItem('xolerc_theme') || 'dark';
applyTheme(savedTheme);

// ===== ONLINE BADGE =====
window.updateOnlineBadge = function(count) {
  const el = document.getElementById('onlineCount');
  if (el) el.textContent = (count || '0') + ' online';
};

// ===== MODAL HELPERS =====
window.closeModal = function(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = 'none';
};

// ===== SETTINGS CONTROLS =====
(function() {
  const notifToggle = document.getElementById('notifToggle');
  if (notifToggle) {
    const saved = localStorage.getItem('xolerc_notif');
    if (saved === 'off') notifToggle.querySelector('input').checked = false;
    notifToggle.addEventListener('change', function() {
      const on = this.querySelector('input').checked;
      localStorage.setItem('xolerc_notif', on ? 'on' : 'off');
    });
  }

  const clearBtn = document.getElementById('clearCacheBtn');
  if (clearBtn) {
    function updateCacheSize() {
      let total = 0;
      for (const key in localStorage) {
        const k = localStorage.getItem(key);
        if (k) total += k.length * 2;
      }
      const size = total > 1048576 ? (total / 1048576).toFixed(1) + ' MB' : total > 1024 ? Math.round(total / 1024) + ' KB' : total + ' B';
      document.getElementById('cacheSize').textContent = size;
    }
    updateCacheSize();
    clearBtn.addEventListener('click', () => {
      const keys = Object.keys(localStorage).filter(k => !k.startsWith('xolerc_'));
      keys.forEach(k => localStorage.removeItem(k));
      updateCacheSize();
    });
  }

  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    const saved = localStorage.getItem('xolerc_lang') || 'uz';
    langSelect.value = saved;
    langSelect.addEventListener('change', function() {
      localStorage.setItem('xolerc_lang', this.value);
    });
  }
})();
