/* ============================================================
   XOLERIC ∞ — Core Engine (Singleton VideoController + PiP + Tabs)
   ============================================================ */

const XEngine = (() => {
  const TABS = ['home', 'chat', 'playme', 'projects', 'contact', 'settings'];
  let currentTab = 0;
  let tabStack = [0];

  function navigateTo(idx, record) {
    if (idx < 0 || idx >= TABS.length || idx === currentTab) return;
    const prev = currentTab;
    currentTab = idx;
    document.querySelectorAll('.tab-content').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
      el.setAttribute('aria-hidden', i !== idx);
    });
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

  function initTabs() {
    document.querySelectorAll('.nav-btn, .bn-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    const ws = document.querySelector('.workspace');
    if (ws) {
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
    }
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
    const hash = location.hash.replace('#', '');
    const start = (hash && TABS.includes(hash)) ? TABS.indexOf(hash) : 0;
    currentTab = start;
    tabStack = [start];
    history.replaceState({ tab: start }, '');
    document.querySelectorAll('.tab-content').forEach((el, i) => {
      el.classList.toggle('active', i === start);
      el.setAttribute('aria-hidden', i !== start);
    });
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === TABS[start]));
    document.querySelectorAll('.bn-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === TABS[start]));
  }

  /* ---------- Singleton VideoController ---------- */
  class VideoController {
    constructor() {
      if (VideoController._instance) return VideoController._instance;
      this.players = new Map();
      this.activeId = null;
      this._pipSupported = document.pictureInPictureEnabled;
      VideoController._instance = this;
    }

    register(id, videoEl) {
      this.players.set(id, videoEl);
    }

    unregister(id) {
      this.players.delete(id);
      if (this.activeId === id) this.activeId = null;
    }

    play(id) {
      this.stopAllExcept(id);
      const player = this.players.get(id);
      if (player) {
        this.activeId = id;
        player.play().catch(() => {});
      }
    }

    pause(id) {
      const player = this.players.get(id);
      if (player) player.pause();
      if (this.activeId === id) this.activeId = null;
    }

    stopAll() {
      this.players.forEach((p, pid) => {
        p.pause();
        p.currentTime = 0;
      });
      this.activeId = null;
    }

    stopAllExcept(id) {
      this.players.forEach((p, pid) => {
        if (pid !== id) {
          p.pause();
          p.currentTime = 0;
        }
      });
    }

    getActive() {
      return this.activeId ? this.players.get(this.activeId) : null;
    }

    /* ---------- PiP ---------- */
    async enterPip(id) {
      if (!this._pipSupported) return false;
      const player = this.players.get(id || this.activeId);
      if (!player) return false;
      try {
        await player.requestPictureInPicture();
        return true;
      } catch {
        return false;
      }
    }

    exitPip() {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
      }
    }

    isPipActive() {
      return !!document.pictureInPictureElement;
    }
  }

  const controller = new VideoController();

  /* ---------- PiP + Page Visibility ---------- */
  let pipOnPause = false;

  function setupPipAuto() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const active = controller.getActive();
        if (active && !active.paused && !controller.isPipActive()) {
          pipOnPause = true;
          controller.enterPip();
        }
      }
    });
    document.addEventListener('picture-in-picture-leave', () => {
      pipOnPause = false;
    });
  }

  /* ---------- Init ---------- */
  function init() {
    initTabs();
    setupPipAuto();
  }

  return {
    init,
    navigateTo,
    switchTab,
    get currentTab() { return currentTab; },
    get TABS() { return TABS; },
    VideoController,
    controller,
  };
})();
