(function () {
  'use strict'
  window.initMusic = function () {
    var audio = document.getElementById('bgMusic')
    var btn = document.getElementById('musicToggle')
    if (!audio || !btn) return
    var playing = false, wasPlaying = false
    btn.addEventListener('click', function () {
      if (playing) { audio.pause(); btn.classList.remove('playing') } else { audio.play().catch(function () { }); btn.classList.add('playing') }
      playing = !playing
    })
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && playing) { audio.pause(); wasPlaying = true }
      else if (!document.hidden && wasPlaying) { audio.play().catch(function () { }); wasPlaying = false }
    })
  }
})()
