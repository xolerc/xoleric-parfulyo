export const TABS = ['home', 'chat', 'playme', 'projects', 'contact', 'settings'];

let currentTab = 0;
const tabStack: number[] = [0];

function navigateTo(idx: number, record: boolean) {
  if (idx < 0 || idx >= TABS.length || idx === currentTab) return;
  currentTab = idx;
  document.querySelectorAll('.tab-content').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
    el.setAttribute('aria-hidden', i !== idx ? 'true' : 'false');
  });
  document.querySelectorAll('.nav-btn, .bn-btn').forEach(b => {
    const isActive = (b as HTMLElement).dataset.tab === TABS[idx];
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', String(isActive));
  });
  if (record) {
    tabStack.push(idx);
    history.pushState({ tab: idx }, '');
  }
}

export function switchTab(name: string) {
  const idx = TABS.indexOf(name);
  if (idx >= 0) navigateTo(idx, true);
}

export function getCurrentTab(): number {
  return currentTab;
}

/* ---------- Singleton VideoController ---------- */
class VideoController {
  private static _instance: VideoController;
  private players = new Map<string, HTMLVideoElement>();
  private activeId: string | null = null;
  private _pipSupported = document.pictureInPictureEnabled;

  constructor() {
    if (VideoController._instance) return VideoController._instance;
    VideoController._instance = this;
  }

  register(id: string, videoEl: HTMLVideoElement) {
    this.players.set(id, videoEl);
  }

  unregister(id: string) {
    this.players.delete(id);
    if (this.activeId === id) this.activeId = null;
  }

  play(id: string) {
    this.stopAllExcept(id);
    const player = this.players.get(id);
    if (player) {
      this.activeId = id;
      player.play().catch(() => {});
    }
  }

  pause(id: string) {
    const player = this.players.get(id);
    if (player) player.pause();
    if (this.activeId === id) this.activeId = null;
  }

  stopAll() {
    this.players.forEach((p) => {
      p.pause();
      p.currentTime = 0;
    });
    this.activeId = null;
  }

  stopAllExcept(id: string) {
    this.players.forEach((p, pid) => {
      if (pid !== id) {
        p.pause();
        p.currentTime = 0;
      }
    });
  }

  getActive(): HTMLVideoElement | null {
    return this.activeId ? this.players.get(this.activeId) || null : null;
  }

  async enterPip(id?: string): Promise<boolean> {
    if (!this._pipSupported) return false;
    const player = this.players.get(id || this.activeId || '');
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

  isPipActive(): boolean {
    return !!document.pictureInPictureElement;
  }
}

export const controller = new VideoController();

function setupPipAuto() {
  let pipOnPause = false;
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

export function initEngine() {
  /* Init tabs */
  document.querySelectorAll('.nav-btn, .bn-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab((btn as HTMLElement).dataset.tab || ''));
  });

  const ws = document.querySelector('.workspace');
  if (ws) {
    let sx = 0, dx = 0, dragging = false;
    ws.addEventListener('touchstart', (e: Event) => {
      sx = (e as TouchEvent).touches[0].clientX;
      dragging = true;
    }, { passive: true });
    ws.addEventListener('touchmove', (e: Event) => {
      if (dragging) dx = (e as TouchEvent).touches[0].clientX - sx;
    }, { passive: true });
    ws.addEventListener('touchend', () => {
      if (!dragging) return;
      dragging = false;
      if (Math.abs(dx) > 50) {
        navigateTo(
          Math.max(0, Math.min(TABS.length - 1, currentTab + (dx < 0 ? 1 : -1))),
          true,
        );
      }
      dx = 0;
    });
  }

  window.addEventListener('popstate', (e: PopStateEvent) => {
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
  tabStack.length = 0;
  tabStack.push(start);
  history.replaceState({ tab: start }, '');

  document.querySelectorAll('.tab-content').forEach((el, i) => {
    el.classList.toggle('active', i === start);
    el.setAttribute('aria-hidden', i !== start ? 'true' : 'false');
  });
  document.querySelectorAll('.nav-btn, .bn-btn').forEach(b => {
    const isActive = (b as HTMLElement).dataset.tab === TABS[start];
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', String(isActive));
  });

  setupPipAuto();
}
