import { controller } from './engine';

const VIDEOS_PATH = 'https://xolerc.github.io/me/videos';
const VIDEOS = [
  { file: VIDEOS_PATH + '/2_5211184992486459614.mp4', title: 'Video 1' },
  { file: VIDEOS_PATH + '/2_5235775282278869717.mp4', title: 'Video 2' },
  { file: VIDEOS_PATH + '/2_5237973231792597901.mp4', title: 'Video 3' },
  { file: VIDEOS_PATH + '/2_5282749129141818157.mp4', title: 'Video 4' },
  { file: VIDEOS_PATH + '/2_5287781263149656497.mp4', title: 'Video 5' },
  { file: VIDEOS_PATH + '/2_5373350012551988338.mp4', title: 'Video 6' },
  { file: VIDEOS_PATH + '/2_5447322629427989855.mp4', title: 'Video 7' },
  { file: VIDEOS_PATH + '/2_5452074624193953955.mp4', title: 'Video 8' },
  { file: VIDEOS_PATH + '/2_5458622658318987050.mp4', title: 'Video 9' },
  { file: VIDEOS_PATH + '/2_5458751034891467046.mp4', title: 'Video 10' },
  { file: VIDEOS_PATH + '/2_5458751034891467056.mp4', title: 'Video 11' },
  { file: VIDEOS_PATH + '/2_5462948497839910298.mp4', title: 'Video 12' },
];

const VIDEO_ID = 'playme-main';

function fmt(s: number): string {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

export function initPlayme() {
  const video = document.getElementById('playmeVideo') as HTMLVideoElement | null;
  const list = document.getElementById('playmeList')!;
  const titleEl = document.getElementById('playmeVideoTitle')!;
  const playBtn = document.getElementById('playmePlayBtn')!;
  const prevBtn = document.getElementById('playmePrevBtn')!;
  const nextBtn = document.getElementById('playmeNextBtn')!;
  const fullBtn = document.getElementById('playmeFullBtn')!;
  const pipBtn = document.getElementById('playmePipBtn');
  const currentEl = document.getElementById('playmeCurrent')!;
  const durEl = document.getElementById('playmeDuration')!;
  const progressFill = document.getElementById('playmeProgressFill')!;
  const progressThumb = document.getElementById('playmeProgressThumb')!;
  const progressWrap = document.getElementById('playmeProgress')!;
  const volumeEl = document.getElementById('playmeVolume') as HTMLInputElement;
  const volumeIcon = document.getElementById('playmeVolumeIcon')!;
  const loader = document.getElementById('playmeLoader')!;
  const controls = document.getElementById('playmeControls')!;
  const wrap = document.getElementById('playmeWrap')!;

  if (!video) return;
  const vid: HTMLVideoElement = video;

  controller.register(VIDEO_ID, vid);

  let currentIndex = 0;
  let progressDragging = false;
  let controlsTimer: ReturnType<typeof setTimeout> | null = null;
  const durations: Record<number, number> = {};
  let preloadAttempted = false;

  function showControls() {
    controls.classList.add('visible');
    if (controlsTimer) clearTimeout(controlsTimer);
    controlsTimer = setTimeout(() => {
      if (!vid.paused) controls.classList.remove('visible');
    }, 3000);
  }

  vid.addEventListener('mousemove', showControls);
  vid.addEventListener('touchstart', showControls);
  controls.addEventListener('mouseenter', () => {
    if (controlsTimer) clearTimeout(controlsTimer);
    controls.classList.add('visible');
  });
  controls.addEventListener('mouseleave', showControls);

  function preloadNext() {
    if (preloadAttempted) return;
    preloadAttempted = true;
    const nextIdx = (currentIndex + 1) % VIDEOS.length;
    if (nextIdx === currentIndex) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'video';
    link.href = VIDEOS[nextIdx].file;
    document.head.appendChild(link);
  }

  function playVideo(index: number) {
    if (index < 0 || index >= VIDEOS.length) return;
    currentIndex = index;
    const v = VIDEOS[index];
    if (vid.src !== v.file) {
      vid.src = v.file;
      loader.classList.remove('hidden');
    }
    controller.play(VIDEO_ID);
    titleEl.textContent = v.title;
    wrap.classList.remove('playing');
    renderList();
    preloadAttempted = false;
  }

  function renderList() {
    list.innerHTML = VIDEOS.map((v, i) => {
      const dur = durations[i] !== undefined ? fmt(durations[i]) : '';
      return '<div class="playme-item' + (i === currentIndex ? ' active' : '') + '" data-index="' + i + '">' +
        '<div class="playme-item-thumb">' +
        '<span class="playme-item-num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '</div>' +
        '<div class="playme-item-body">' +
        '<span class="playme-item-title">' + v.title + '</span>' +
        (dur ? '<div class="playme-item-duration">' + dur + '</div>' : '') +
        '</div></div>';
    }).join('');
    list.querySelectorAll('.playme-item').forEach(item => {
      item.addEventListener('click', () => playVideo(parseInt((item as HTMLElement).dataset.index!, 10)));
    });
    const active = list.querySelector('.playme-item.active');
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  playBtn.addEventListener('click', () => {
    if (vid.paused) controller.play(VIDEO_ID);
    else controller.pause(VIDEO_ID);
  });

  prevBtn.addEventListener('click', () => {
    if (vid.currentTime > 3) { vid.currentTime = 0; return; }
    playVideo(currentIndex - 1 >= 0 ? currentIndex - 1 : VIDEOS.length - 1);
  });

  nextBtn.addEventListener('click', () => {
    playVideo((currentIndex + 1) % VIDEOS.length);
  });

  fullBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else vid.requestFullscreen();
  });

  if (pipBtn) {
    pipBtn.addEventListener('click', () => {
      if (controller.isPipActive()) controller.exitPip();
      else controller.enterPip(VIDEO_ID);
    });
  }

  vid.addEventListener('play', () => {
    playBtn.classList.add('playing');
    wrap.classList.add('playing');
    showControls();
    preloadNext();
  });

  vid.addEventListener('pause', () => {
    playBtn.classList.remove('playing');
    wrap.classList.remove('playing');
    controls.classList.add('visible');
  });

  vid.addEventListener('ended', () => {
    wrap.classList.remove('playing');
    playVideo((currentIndex + 1) % VIDEOS.length);
  });

  vid.addEventListener('timeupdate', () => {
    currentEl.textContent = fmt(vid.currentTime);
    durEl.textContent = fmt(vid.duration);
    const pct = vid.duration ? (vid.currentTime / vid.duration * 100) : 0;
    progressFill.style.width = pct + '%';
    if (progressThumb) progressThumb.style.left = pct + '%';
  });

  vid.addEventListener('loadedmetadata', () => {
    durEl.textContent = fmt(vid.duration);
    loader.classList.add('hidden');
    if (durations[currentIndex] === undefined) {
      durations[currentIndex] = vid.duration;
      renderList();
    }
  });

  vid.addEventListener('canplay', () => {
    loader.classList.add('hidden');
  });

  vid.addEventListener('error', () => {
    loader.classList.add('hidden');
    const err = vid.error;
    if (err?.code === 3 || err?.code === 4) {
      controls.classList.add('visible');
      titleEl.textContent = 'Bu videoni qurilmangiz qo\'llab-quvvatlamaydi';
    }
  });

  progressWrap.addEventListener('mousedown', (e: MouseEvent) => { progressDragging = true; seek(e); });
  document.addEventListener('mousemove', (e: MouseEvent) => { if (progressDragging) seek(e); });
  document.addEventListener('mouseup', () => { progressDragging = false; });
  progressWrap.addEventListener('touchstart', (e: TouchEvent) => { progressDragging = true; seek(e.touches[0]); });
  document.addEventListener('touchmove', (e: TouchEvent) => { if (progressDragging) seek(e.touches[0]); });
  document.addEventListener('touchend', () => { progressDragging = false; });

  function seek(e: { clientX: number }) {
    const rect = progressWrap.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (vid.duration) vid.currentTime = pct * vid.duration;
  }

  volumeEl.addEventListener('input', () => {
    vid.volume = parseFloat(volumeEl.value);
    volumeIcon.classList.toggle('muted', vid.volume === 0);
  });

  volumeIcon.addEventListener('click', () => {
    if (vid.volume > 0) {
      vid.dataset.prevVolume = String(vid.volume);
      vid.volume = 0;
      volumeEl.value = '0';
    } else {
      const prev = parseFloat(vid.dataset.prevVolume || '0.8');
      vid.volume = prev;
      volumeEl.value = String(prev);
    }
    volumeIcon.classList.toggle('muted', vid.volume === 0);
  });

  /* Preload first video meta */
  (function preloadFirstVideoMeta() {
    const tmp = document.createElement('video');
    tmp.preload = 'metadata';
    tmp.src = VIDEOS[0].file;
    tmp.addEventListener('loadedmetadata', () => {
      durations[0] = tmp.duration;
      renderList();
      tmp.remove();
    });
    tmp.addEventListener('error', () => tmp.remove());
  })();

  renderList();
  playVideo(0);
}
