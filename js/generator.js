(function () {
  'use strict'
  var canvases = {}, anims = {}

  // === NOISE ===
  var noise = {
    _p: [], _perm: [],
    init: function () {
      for (var i = 0; i < 256; i++) this._p[i] = i
      for (var i = 255; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = this._p[i]; this._p[i] = this._p[j]; this._p[j] = t }
      this._perm = this._p.concat(this._p)
    },
    noise2D: function (x, y) {
      var X = Math.floor(x) & 255, Y = Math.floor(y) & 255
      var xf = x - Math.floor(x), yf = y - Math.floor(y)
      var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
      var aa = this._perm[this._perm[X] + Y], ab = this._perm[this._perm[X] + Y + 1]
      var ba = this._perm[this._perm[X + 1] + Y], bb = this._perm[this._perm[X + 1] + Y + 1]
      function grad(h, x, y) { var h2 = h & 3; var u2 = h2 < 2 ? x : y; var v2 = h2 < 2 ? y : x; return ((h2 & 1) === 0 ? u2 : -u2) + ((h2 & 2) === 0 ? v2 : -v2) }
      var x1 = this._lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u)
      var x2 = this._lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u)
      return (this._lerp(x1, x2, v) + 1) / 2
    },
    _lerp: function (a, b, t) { return a + t * (b - a) },
    fbm: function (x, y, octaves) {
      var val = 0, amp = 0.5, freq = 1
      for (var i = 0; i < (octaves || 6); i++) { val += amp * this.noise2D(x * freq, y * freq); amp *= 0.5; freq *= 2 }
      return val
    }
  }
  noise.init()

  // === COLOR UTILITIES ===
  function hsl(h, s, l) { return 'hsl(' + h + ',' + s + '%,' + l + '%)' }
  function hsla(h, s, l, a) { return 'hsla(' + h + ',' + s + '%,' + l + '%,' + a + ')' }
  function rgb(r, g, b) { return 'rgb(' + Math.floor(r) + ',' + Math.floor(g) + ',' + Math.floor(b) + ')' }
  function rgba(r, g, b, a) { return 'rgba(' + Math.floor(r) + ',' + Math.floor(g) + ',' + Math.floor(b) + ',' + a + ')' }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }
  function lerp(a, b, t) { return a + (b - a) * t }
  function rand(min, max) { return min + Math.random() * (max - min) }

  // === GENERATORS ===
  var generators = {}

  // 1. GALAXY
  generators.galaxy = {
    name: 'Galaktika',
    icon: '\ud83c\udf0c',
    generate: function (ctx, w, h, params) {
      var cx = w / 2, cy = h / 2
      var arms = params.arms || 4, twist = params.twist || 3, spread = params.spread || 0.4
      var hue = params.hue || 220, hue2 = params.hue2 || 280
      var count = params.count || 4000, armWidth = params.armWidth || 0.3

      // Background
      var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.6)
      grad.addColorStop(0, 'rgba(10,5,30,1)')
      grad.addColorStop(1, 'rgba(0,0,0,1)')
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h)

      // Stars
      for (var i = 0; i < count; i++) {
        var dist = Math.pow(Math.random(), 1.5) * w * 0.45
        var angle = Math.random() * Math.PI * 2
        var armAngle = angle + (dist / (w * 0.1)) * twist
        var armOffset = (Math.random() - 0.5) * armWidth * (dist / (w * 0.05))
        var armIdx = Math.floor(Math.random() * arms)
        var finalAngle = armAngle + (armIdx * Math.PI * 2) / arms + armOffset

        var x = cx + Math.cos(finalAngle) * dist
        var y = cy + Math.sin(finalAngle) * dist
        var size = (1 - dist / (w * 0.45)) * rand(0.5, 2.5)
        var brightness = 0.3 + 0.7 * (1 - dist / (w * 0.45))
        var hVal = lerp(hue, hue2, dist / (w * 0.45) + Math.random() * 0.2)

        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fillStyle = hsla(hVal, 80, 60 * brightness, brightness * 0.8)
        ctx.fill()
      }

      // Core glow
      var cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.12)
      cg.addColorStop(0, hsla(hue, 90, 80, 0.8))
      cg.addColorStop(0.3, hsla(hue2, 80, 60, 0.3))
      cg.addColorStop(1, 'transparent')
      ctx.fillStyle = cg; ctx.fillRect(0, 0, w, h)
    },
    params: [
      { key: 'arms', label: 'Qo\'llar', min: 2, max: 8, step: 1, def: 4 },
      { key: 'twist', label: 'Burilish', min: 1, max: 8, step: 0.5, def: 3 },
      { key: 'hue', label: 'Rang', min: 0, max: 360, step: 10, def: 220 },
      { key: 'hue2', label: 'Ikkinchi rang', min: 0, max: 360, step: 10, def: 280 }
    ]
  }

  // 2. PLANET
  generators.planet = {
    name: 'Planeta',
    icon: '\ud83d\udfa1',
    generate: function (ctx, w, h, params) {
      var cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.32
      var hue = params.hue || 200, hue2 = params.hue2 || 50, atmos = params.atmosphere !== false

      // Star field
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h)
      for (var i = 0; i < 200; i++) {
        var x = rand(0, w), y = rand(0, h), s = rand(0.3, 1.8)
        ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2)
        ctx.fillStyle = rgba(255, 255, 255, rand(0.2, 0.9))
        ctx.fill()
      }

      // Planet body
      var pg = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r)
      pg.addColorStop(0, hsl(hue, 70, 55))
      pg.addColorStop(0.3, hsl(hue, 75, 40))
      pg.addColorStop(0.6, hsl(hue2, 60, 35))
      pg.addColorStop(1, hsl(hue2, 50, 20))

      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = pg; ctx.fill()

      // Surface detail (noise)
      var imgData = ctx.getImageData(cx - r, cy - r, r * 2, r * 2)
      for (var y = 0; y < r * 2; y++) {
        for (var x = 0; x < r * 2; x++) {
          var dx = x - r, dy = y - r
          if (dx * dx + dy * dy > r * r) continue
          var n = noise.fbm(dx * 0.02 + params.seed || 0, dy * 0.02, 4)
          var n2 = noise.fbm(dx * 0.04 + 100, dy * 0.04, 3)
          var idx = (y * r * 2 + x) * 4
          imgData.data[idx] = clamp(imgData.data[idx] * (0.7 + n * 0.6), 0, 255)
          imgData.data[idx + 1] = clamp(imgData.data[idx + 1] * (0.5 + n2 * 0.8), 0, 255)
          imgData.data[idx + 2] = clamp(imgData.data[idx + 2] * (0.6 + n * 0.5), 0, 255)
        }
      }
      ctx.putImageData(imgData, cx - r, cy - r)

      // Terminator (shadow edge)
      var tg = ctx.createRadialGradient(cx + r * 0.5, cy - r * 0.2, r * 0.3, cx, cy, r * 1.1)
      tg.addColorStop(0, 'transparent')
      tg.addColorStop(0.6, rgba(0, 0, 20, 0.1))
      tg.addColorStop(1, rgba(0, 0, 10, 0.7))
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.05, 0, Math.PI * 2)
      ctx.fillStyle = tg; ctx.fill()

      // Atmosphere glow
      if (atmos) {
        var ag = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r * 1.15)
        ag.addColorStop(0, 'transparent')
        ag.addColorStop(0.5, hsla(hue + 30, 80, 60, 0.08))
        ag.addColorStop(0.8, hsla(hue + 30, 70, 50, 0.04))
        ag.addColorStop(1, 'transparent')
        ctx.beginPath(); ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2)
        ctx.fillStyle = ag; ctx.fill()
      }
    },
    params: [
      { key: 'hue', label: 'Asosiy rang', min: 0, max: 360, step: 10, def: 200 },
      { key: 'hue2', label: 'Ikkinchi rang', min: 0, max: 360, step: 10, def: 50 },
      { key: 'atmosphere', label: 'Atmosfera', type: 'bool', def: true }
    ]
  }

  // 3. NEON CITY
  generators.neoncity = {
    name: 'Neon City',
    icon: '\ud83c\udf03',
    generate: function (ctx, w, h, params) {
      var hue = params.hue || 280, hue2 = params.hue2 || 180, density = params.density || 0.7

      // Sky
      var sg = ctx.createLinearGradient(0, 0, 0, h * 0.5)
      sg.addColorStop(0, 'rgba(5,0,20,1)')
      sg.addColorStop(0.5, 'rgba(10,5,30,0.9)')
      sg.addColorStop(1, 'rgba(20,10,40,0.8)')
      ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h * 0.55)

      // Stars
      for (var i = 0; i < 100; i++) {
        ctx.beginPath(); ctx.arc(rand(0, w), rand(0, h * 0.4), rand(0.3, 1.2), 0, Math.PI * 2)
        ctx.fillStyle = rgba(255, 255, 255, rand(0.3, 0.8))
        ctx.fill()
      }

      // Ground
      var gg = ctx.createLinearGradient(0, h * 0.55, 0, h)
      gg.addColorStop(0, 'rgba(10,5,20,0.9)')
      gg.addColorStop(1, 'rgba(5,2,15,1)')
      ctx.fillStyle = gg; ctx.fillRect(0, h * 0.55, w, h * 0.45)

      // Reflection on ground
      var blk = 0.2

      // Buildings
      var bCount = Math.floor(20 * density)
      var buildings = []
      for (var bi = 0; bi < bCount; bi++) {
        var bw = rand(15, 45)
        var bh = rand(30, h * 0.45)
        var bx = (w / bCount) * bi + rand(2, (w / bCount) - bw - 2)
        var by = h * 0.55 - bh
        var bhue = rand(0, 1) > 0.5 ? hue + rand(-20, 20) : hue2 + rand(-20, 20)
        buildings.push({ x: bx, y: by, w: bw, h: bh, hue: bhue, light: rand(0.3, 0.9) })

        // Building body
        ctx.fillStyle = rgb(10 + bh * 0.3, 5 + bh * 0.15, 25 + bh * 0.05)
        ctx.fillRect(bx, by, bw, bh)

        // Neon outline
        ctx.strokeStyle = hsla(bhue, 90, 55, 0.3)
        ctx.lineWidth = 1
        ctx.strokeRect(bx, by, bw, bh)

        // Windows
        var winCols = Math.floor(bw / 8)
        var winRows = Math.floor(bh / 10)
        for (var wy = 0; wy < winRows; wy++) {
          for (var wx = 0; wx < winCols; wx++) {
            if (Math.random() > 0.4) {
              var ww = 3, wh = 4
              ctx.fillStyle = hsla(bhue, 80, 60 * rand(0.3, 1), rand(0.2, 0.8))
              ctx.fillRect(bx + wx * (bw / winCols) + 1, by + wy * (bh / winRows) + 2, ww, wh)
            }
          }
        }
      }

      // Ground reflection (flipped buildings)
      for (var bj = 0; bj < buildings.length; bj++) {
        var b = buildings[bj]
        var reflectH = b.h * 0.3
        var reflectY = h * 0.55
        var grd = ctx.createLinearGradient(0, reflectY, 0, reflectY + reflectH)
        grd.addColorStop(0, hsla(b.hue, 70, 50, 0.15))
        grd.addColorStop(1, 'transparent')
        ctx.fillStyle = grd
        ctx.fillRect(b.x, reflectY, b.w, reflectH)
      }

      // Neon particles
      for (var pi = 0; pi < 50; pi++) {
        var px = rand(0, w), py = rand(h * 0.55, h * 0.65)
        ctx.beginPath(); ctx.arc(px, py, rand(0.5, 2), 0, Math.PI * 2)
        ctx.fillStyle = hsla(rand(0, 1) > 0.5 ? hue : hue2, 90, 60, rand(0.1, 0.5))
        ctx.fill()
      }
    },
    params: [
      { key: 'hue', label: 'Neon rangi', min: 200, max: 360, step: 10, def: 280 },
      { key: 'hue2', label: '2-neon rangi', min: 100, max: 280, step: 10, def: 180 },
      { key: 'density', label: 'Zichlik', min: 0.3, max: 1, step: 0.1, def: 0.7 }
    ]
  }

  // 4. CYBERPUNK TUNNEL
  generators.tunnel = {
    name: 'Tunnel',
    icon: '\ud83d\udd7a',
    generate: function (ctx, w, h, params) {
      var hue = params.hue || 300, speed = params.speed || 1, segments = params.segments || 30

      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h)
      var cx = w / 2, cy = h / 2

      for (var i = 0; i < segments; i++) {
        var t = i / segments
        var radius = (1 - t) * Math.max(w, h) * 0.6
        var dist = t * w * 0.3
        var pulse = Math.sin(Date.now() * 0.001 * speed + i * 0.5) * 0.1 + 0.9
        var hVal = hue + i * 3 + Math.sin(Date.now() * 0.0005 * speed) * 20
        var alpha = 1 - t
        var lineW = 1 + t * 8
        var points = Math.floor(6 + t * 20)

        ctx.beginPath()
        for (var j = 0; j <= points; j++) {
          var angle = (j / points) * Math.PI * 2
          var x = cx + Math.cos(angle) * radius * pulse
          var y = cy + Math.sin(angle) * radius * pulse
          if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.strokeStyle = hsla(hVal, 90, 55 + t * 20, alpha * 0.6)
        ctx.lineWidth = lineW
        ctx.stroke()

        // Grid lines
        if (i % 3 === 0) {
          var gridW = radius * 2
          ctx.strokeStyle = hsla(hVal + 60, 70, 50, alpha * 0.2)
          ctx.lineWidth = 0.5
          var glx1 = cx - gridW / 2, gly1 = cy - gridW / 2
          var glx2 = cx + gridW / 2, gly2 = cy + gridW / 2
          ctx.beginPath()
          ctx.moveTo(glx1, gly1); ctx.lineTo(glx2, gly2)
          ctx.moveTo(glx1, gly2); ctx.lineTo(glx2, gly1)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(cx - gridW / 2, cy); ctx.lineTo(cx + gridW / 2, cy)
          ctx.moveTo(cx, cy - gridW / 2); ctx.lineTo(cx, cy + gridW / 2)
          ctx.stroke()
        }
      }

      // Center glow
      var cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.05)
      cg.addColorStop(0, hsla(hue, 90, 80, 0.8))
      cg.addColorStop(1, 'transparent')
      ctx.fillStyle = cg; ctx.fillRect(0, 0, w, h)
    },
    animate: true,
    params: [
      { key: 'hue', label: 'Rang', min: 200, max: 360, step: 10, def: 300 },
      { key: 'speed', label: 'Tezlik', min: 0.2, max: 3, step: 0.2, def: 1 },
      { key: 'segments', label: 'Segmentlar', min: 10, max: 50, step: 5, def: 30 }
    ]
  }

  // 5. ENERGY PORTAL
  generators.portal = {
    name: 'Portal',
    icon: '\u26a1',
    generate: function (ctx, w, h, params) {
      var hue = params.hue || 200, hue2 = params.hue2 || 320, rings = params.rings || 8

      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h)
      var cx = w / 2, cy = h / 2, maxR = Math.min(w, h) * 0.4

      // Background particles
      for (var i = 0; i < 150; i++) {
        ctx.beginPath(); ctx.arc(rand(0, w), rand(0, h), rand(0.3, 1), 0, Math.PI * 2)
        ctx.fillStyle = rgba(255, 255, 255, rand(0.1, 0.4))
        ctx.fill()
      }

      // Portal rings
      for (var r = 0; r < rings; r++) {
        var t = r / rings
        var rad = maxR * (1 - t * 0.15)
        var hVal = lerp(hue, hue2, t)
        var alpha = 0.1 + 0.5 * (1 - t)
        var pulse = Math.sin(Date.now() * 0.002 + r * 1.2) * 0.05 + 0.95
        var thickness = 2 + t * 6

        ctx.beginPath()
        ctx.arc(cx, cy, rad * pulse, 0, Math.PI * 2)
        ctx.strokeStyle = hsla(hVal, 90, 60 + t * 20, alpha)
        ctx.lineWidth = thickness
        ctx.stroke()

        // Inner glow lines
        if (r % 2 === 0) {
          ctx.beginPath()
          for (var a = 0; a <= Math.PI * 2; a += 0.05) {
            var xx = cx + Math.cos(a) * rad * pulse * 0.95
            var yy = cy + Math.sin(a) * rad * pulse * 0.95
            if (a === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy)
          }
          ctx.strokeStyle = hsla(hVal + 30, 80, 70, alpha * 0.2)
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }

      // Electric arcs
      var arcCount = Math.floor(6 + Math.sin(Date.now() * 0.001) * 2)
      for (var a2 = 0; a2 < arcCount; a2++) {
        var angle = (a2 / arcCount) * Math.PI * 2 + Date.now() * 0.0005
        var r1 = maxR * 0.2, r2 = maxR * 0.85
        var px1 = cx + Math.cos(angle) * r1, py1 = cy + Math.sin(angle) * r1
        var px2 = cx + Math.cos(angle + 0.3) * r2, py2 = cy + Math.sin(angle + 0.3) * r2

        ctx.beginPath()
        ctx.moveTo(px1, py1)
        var midx = (px1 + px2) / 2 + rand(-20, 20)
        var midy = (py1 + py2) / 2 + rand(-20, 20)
        ctx.quadraticCurveTo(midx, midy, px2, py2)
        ctx.strokeStyle = hsla(hue + rand(-20, 20), 90, 70, 0.3)
        ctx.lineWidth = rand(1, 3)
        ctx.stroke()
      }

      // Center glow
      var cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.5)
      cg.addColorStop(0, hsla(hue, 90, 80, 0.6))
      cg.addColorStop(0.3, hsla(hue2, 80, 60, 0.2))
      cg.addColorStop(0.6, hsla(hue, 70, 40, 0.05))
      cg.addColorStop(1, 'transparent')
      ctx.fillStyle = cg; ctx.fillRect(0, 0, w, h)
    },
    animate: true,
    params: [
      { key: 'hue', label: 'Rang', min: 0, max: 360, step: 10, def: 200 },
      { key: 'hue2', label: '2-rang', min: 200, max: 360, step: 10, def: 320 },
      { key: 'rings', label: 'Halqalar', min: 3, max: 15, step: 1, def: 8 }
    ]
  }

  // 6. COSMOS (Nebula)
  generators.cosmos = {
    name: 'Kosmos',
    icon: '\ud83c\udf1f',
    generate: function (ctx, w, h, params) {
      var hue = params.hue || 240, hue2 = params.hue2 || 330, complexity = params.complexity || 0.7

      // Deep space
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h)

      // Nebula clouds
      for (var layer = 0; layer < 3; layer++) {
        var scale = 0.003 + layer * 0.002
        var nh = lerp(hue, hue2, layer / 2)
        var nxo = rand(-500, 500), nyo = rand(-500, 500)
        for (var y = 0; y < h; y += 2) {
          for (var x = 0; x < w; x += 2) {
            var n = noise.fbm(x * scale + nxo, y * scale + nyo, Math.floor(3 + complexity * 3))
            if (n > 0.45) {
              var alpha = (n - 0.45) * 0.7 * (1 - layer * 0.2)
              ctx.fillStyle = hsla(nh + n * 40, 70, 40 + n * 30, alpha)
              ctx.fillRect(x, y, 2, 2)
            }
          }
        }
      }

      // Bright core
      var cx = w * rand(0.3, 0.7), cy = h * rand(0.3, 0.7)
      for (var g = 0; g < 3; g++) {
        var gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * (0.05 + g * 0.08))
        gr.addColorStop(0, hsla(lerp(hue, hue2, g / 2), 80, 70 + g * 10, 0.4 - g * 0.1))
        gr.addColorStop(1, 'transparent')
        ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h)
      }

      // Stars
      for (var i = 0; i < 300; i++) {
        var sx = rand(0, w), sy = rand(0, h)
        var sr = rand(0.2, 2.5)
        var sb = rand(0.3, 1)
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2)
        ctx.fillStyle = rgba(255, 255, 255, sb)
        ctx.fill()
        // Star glow for big stars
        if (sr > 1.5) {
          ctx.beginPath(); ctx.arc(sx, sy, sr * 3, 0, Math.PI * 2)
          ctx.fillStyle = rgba(255, 255, 255, 0.05)
          ctx.fill()
        }
      }

      // Shooting stars
      for (var si = 0; si < 3; si++) {
        var sx2 = rand(0, w), sy2 = rand(0, h * 0.3)
        var slen = rand(30, 80), sang = rand(-0.5, 0.5)
        ctx.beginPath()
        ctx.moveTo(sx2, sy2)
        ctx.lineTo(sx2 - Math.cos(sang) * slen, sy2 + Math.sin(sang) * slen)
        ctx.strokeStyle = rgba(255, 255, 255, rand(0.1, 0.3))
        ctx.lineWidth = rand(0.5, 1.5)
        ctx.stroke()
      }
    },
    params: [
      { key: 'hue', label: 'Asosiy rang', min: 200, max: 300, step: 10, def: 240 },
      { key: 'hue2', label: 'Aksent rang', min: 280, max: 360, step: 10, def: 330 },
      { key: 'complexity', label: 'Murakkablik', min: 0.2, max: 1, step: 0.1, def: 0.7 }
    ]
  }

  // === IMAGE FILTERS ===
  var filters = {
    apply: function (ctx, w, h, filterName, intensity) {
      var imgData = ctx.getImageData(0, 0, w, h)
      var d = imgData.data
      intensity = intensity || 1
      switch (filterName) {
        case 'brightness': for (var i = 0; i < d.length; i += 4) { d[i]*=1+intensity; d[i+1]*=1+intensity; d[i+2]*=1+intensity }; break
        case 'contrast': var f=(259*(255+128*intensity))/(255*(259-128*intensity)); for(i=0;i<d.length;i+=4){d[i]=f*(d[i]-128)+128;d[i+1]=f*(d[i+1]-128)+128;d[i+2]=f*(d[i+2]-128)+128}; break
        case 'sepia': for(i=0;i<d.length;i+=4){var r=d[i],g=d[i+1],b=d[i+2];d[i]=r*0.393+g*0.769+b*0.189;d[i+1]=r*0.349+g*0.686+b*0.168;d[i+2]=r*0.272+g*0.534+b*0.131}; break
        case 'invert': for(i=0;i<d.length;i+=4){d[i]=255-d[i];d[i+1]=255-d[i+1];d[i+2]=255-d[i+2]}; break
        case 'grayscale': for(i=0;i<d.length;i+=4){var g=d[i]*0.3+d[i+1]*0.59+d[i+2]*0.11;d[i]=g;d[i+1]=g;d[i+2]=g}; break
        case 'saturation': for(i=0;i<d.length;i+=4){var g2=(d[i]+d[i+1]+d[i+2])/3;d[i]=g2+(d[i]-g2)*(1+intensity);d[i+1]=g2+(d[i+1]-g2)*(1+intensity);d[i+2]=g2+(d[i+2]-g2)*(1+intensity)}; break
        case 'blur': break // Simplified
      }
      ctx.putImageData(imgData, 0, 0)
    }
  }

  // === MAIN GENERATOR API ===
  var genapi = {
    list: function () {
      var names = []
      for (var k in generators) names.push(k)
      return names
    },
    getInfo: function (name) { return generators[name] },
    generate: function (name, canvas, params) {
      var g = generators[name]
      if (!g) return
      var ctx = canvas.getContext('2d')
      var w = canvas.width, h = canvas.height
      ctx.clearRect(0, 0, w, h)
      g.generate(ctx, w, h, params || {})
    },
    getDefaultParams: function (name) {
      var g = generators[name]
      if (!g) return {}
      var p = {}
      if (g.params) for (var i = 0; i < g.params.length; i++) p[g.params[i].key] = g.params[i].def
      p.seed = Math.random() * 1000
      return p
    },
    startAnimation: function (name, canvas, params, id) {
      var g = generators[name]
      if (!g || !g.animate) return
      var ctx = canvas.getContext('2d')
      var w = canvas.width, h = canvas.height
      if (anims[id]) cancelAnimationFrame(anims[id])

      function frame() {
        ctx.clearRect(0, 0, w, h)
        g.generate(ctx, w, h, params || {})
        anims[id] = requestAnimationFrame(frame)
      }
      frame()
    },
    stopAnimation: function (id) {
      if (anims[id]) { cancelAnimationFrame(anims[id]); delete anims[id] }
    },
    saveToGallery: function (canvas) {
      var dataUrl = canvas.toDataURL('image/png')
      var gallery = []
      try { gallery = JSON.parse(localStorage.getItem('xolerc_gallery') || '[]') } catch(e) {}
      gallery.unshift({ data: dataUrl, ts: Date.now() })
      if (gallery.length > 50) gallery = gallery.slice(0, 50)
      localStorage.setItem('xolerc_gallery', JSON.stringify(gallery))
    },
    getGallery: function () {
      try { return JSON.parse(localStorage.getItem('xolerc_gallery') || '[]') } catch(e) { return [] }
    },
    clearGallery: function () { localStorage.removeItem('xolerc_gallery') },
    exportPNG: function (canvas) {
      var link = document.createElement('a')
      link.download = 'xoleric-gen-' + Date.now() + '.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    },
    filters: filters
  }

  if (typeof window !== 'undefined') window.XOLERIC_GEN = genapi
})()
