export function initMusic() {
  const audio = document.getElementById('bgMusic') as HTMLAudioElement | null;
  const btn = document.getElementById('musicToggle') as HTMLElement | null;
  if (!audio || !btn) return;

  let playing = false;
  let wasPlayingBeforeHide = false;

  btn.addEventListener('click', () => {
    if (playing) {
      audio.pause();
      btn.classList.remove('playing');
    } else {
      audio.play().catch(() => {});
      btn.classList.add('playing');
    }
    playing = !playing;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) {
      audio.pause();
      wasPlayingBeforeHide = true;
    } else if (!document.hidden && wasPlayingBeforeHide) {
      audio.play().catch(() => {});
      wasPlayingBeforeHide = false;
    }
  });
}
