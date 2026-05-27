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

const video = document.getElementById('playmeVideo');
const list = document.getElementById('playmeList');
const titleEl = document.getElementById('playmeVideoTitle');
const playBtn = document.getElementById('playmePlayBtn');
const prevBtn = document.getElementById('playmePrevBtn');
const nextBtn = document.getElementById('playmeNextBtn');
const fullBtn = document.getElementById('playmeFullBtn');
const currentEl = document.getElementById('playmeCurrent');
const durEl = document.getElementById('playmeDuration');
const progressFill = document.getElementById('playmeProgressFill');
const progressThumb = document.getElementById('playmeProgressThumb');
const progressWrap = document.getElementById('playmeProgress');
const volumeEl = document.getElementById('playmeVolume');
const volumeIcon = document.getElementById('playmeVolumeIcon');
const loader = document.getElementById('playmeLoader');
const controls = document.getElementById('playmeControls');

let currentIndex = 0;
let progressDragging = false;
let controlsTimer = null;

function fmt(s) {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

function showControls() {
  controls.classList.add('visible');
  clearTimeout(controlsTimer);
  controlsTimer = setTimeout(() => { if (!video.paused) controls.classList.remove('visible'); }, 3000);
}

video.addEventListener('mousemove', showControls);
video.addEventListener('touchstart', showControls);
controls.addEventListener('mouseenter', () => { clearTimeout(controlsTimer); controls.classList.add('visible'); });
controls.addEventListener('mouseleave', showControls);

function playVideo(index) {
  if (index < 0 || index >= VIDEOS.length) return;
  currentIndex = index;
  const v = VIDEOS[index];
  video.src = v.file;
  loader.classList.remove('hidden');
  video.play().catch(() => {});
  titleEl.textContent = v.title;
  renderList();
}

function renderList() {
  list.innerHTML = VIDEOS.map((v, i) => '<div class="playme-item' + (i === currentIndex ? ' active' : '') + '" data-index="' + i + '">' +
    '<span class="playme-item-num">' + String(i + 1).padStart(2, '0') + '</span>' +
    '<div class="playme-item-body"><span class="playme-item-title">' + v.title + '</span></div></div>'
  ).join('');
  list.querySelectorAll('.playme-item').forEach(item => {
    item.addEventListener('click', () => playVideo(parseInt(item.dataset.index)));
  });
  const active = list.querySelector('.playme-item.active');
  if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

playBtn.addEventListener('click', () => {
  if (video.paused) video.play().catch(() => {});
  else video.pause();
});

prevBtn.addEventListener('click', () => {
  if (video.currentTime > 3) { video.currentTime = 0; return; }
  playVideo(currentIndex - 1 >= 0 ? currentIndex - 1 : VIDEOS.length - 1);
});

nextBtn.addEventListener('click', () => {
  playVideo((currentIndex + 1) % VIDEOS.length);
});

fullBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else video.requestFullscreen();
});

video.addEventListener('play', () => { playBtn.classList.add('playing'); showControls(); });
video.addEventListener('pause', () => { playBtn.classList.remove('playing'); controls.classList.add('visible'); });
video.addEventListener('ended', () => { playVideo((currentIndex + 1) % VIDEOS.length); });

video.addEventListener('timeupdate', () => {
  currentEl.textContent = fmt(video.currentTime);
  durEl.textContent = fmt(video.duration);
  const pct = video.duration ? (video.currentTime / video.duration * 100) : 0;
  progressFill.style.width = pct + '%';
  if (progressThumb) progressThumb.style.left = pct + '%';
});

video.addEventListener('loadedmetadata', () => {
  durEl.textContent = fmt(video.duration);
  loader.classList.add('hidden');
});

video.addEventListener('canplay', () => {
  loader.classList.add('hidden');
});

video.addEventListener('error', () => {
  loader.classList.add('hidden');
  const err = video.error;
  if (err?.code === 3 || err?.code === 4) {
    controls.classList.add('visible');
    titleEl.textContent = 'Bu videoni qurilmangiz qo\'llab-quvvatlamaydi';
  }
});

// Progress seek
progressWrap.addEventListener('mousedown', e => { progressDragging = true; seek(e); });
document.addEventListener('mousemove', e => { if (progressDragging) seek(e); });
document.addEventListener('mouseup', () => { progressDragging = false; });
progressWrap.addEventListener('touchstart', e => { progressDragging = true; seek(e.touches[0]); });
document.addEventListener('touchmove', e => { if (progressDragging) seek(e.touches[0]); });
document.addEventListener('touchend', () => { progressDragging = false; });

function seek(e) {
  const rect = progressWrap.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  if (video.duration) video.currentTime = pct * video.duration;
}

// Volume
volumeEl.addEventListener('input', () => {
  video.volume = parseFloat(volumeEl.value);
  volumeIcon.classList.toggle('muted', video.volume === 0);
});

volumeIcon.addEventListener('click', () => {
  if (video.volume > 0) {
    video.dataset.prevVolume = video.volume;
    video.volume = 0;
    volumeEl.value = 0;
  } else {
    const prev = parseFloat(video.dataset.prevVolume) || 0.8;
    video.volume = prev;
    volumeEl.value = prev;
  }
  volumeIcon.classList.toggle('muted', video.volume === 0);
});

renderList();
playVideo(0);
