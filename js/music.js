(function () {
  'use strict'
  window.initMusic = function () {
    var audio = document.getElementById('bgMusic')
    var btn = document.getElementById('musicToggle')
    if (!audio || !btn) return
    var playing = false, wasPlaying = false
    btn.addEventListener('click', function () {
      if (playing) { audio.pause(); btn.classList.remove('playing'); playing = false }
      else {
        var p = audio.play()
        if (p && p.catch) p.catch(function () {
          btn.classList.remove('playing'); playing = false
        })
        if (!audio.paused) { btn.classList.add('playing'); playing = true }
      }
    })
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && playing) { audio.pause(); wasPlaying = true }
      else if (!document.hidden && wasPlaying) {
        var p = audio.play()
        if (p && p.catch) p.catch(function () {})
        wasPlaying = false
      }
    })
  }
})()
