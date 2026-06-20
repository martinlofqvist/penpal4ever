/**
 * magnetic-trails.js
 * Images stream across the screen in a slow current.
 * The mouse deflects their path — they curve around it and return to flow.
 *
 * Usage:
 *   const anim = new MagneticTrails(containerEl, config)
 *   anim.updateConfig({ flowSpeed: 120 })
 *   anim.destroy()
 */

;(function (global) {
  'use strict'

  // ─── Default config ──────────────────────────────────────────────
  const DEFAULTS = {
    // Stream
    count:           60,       // number of images in the stream
    baseSize:        30,       // px (width = height)
    flowAngle:       12,       // degrees from horizontal (positive = slightly downward)
    flowSpeed:       70,       // px / s
    turbulence:      0.35,     // ±fraction of speed variation per particle

    // Pulse
    pulseAmount:     0.15,     // ±fraction of baseSize
    pulseSpeed:      1.0,      // rad / s
    phaseSpread:     10.0,

    // Mouse deflection
    mouseRadius:     220,      // px
    mouseForce:      380,      // px / s² acceleration away from cursor
    velocityReturn:  2.5,      // spring rate back to base flow (per second)
    mouseMaxScale:   4.5,
    mouseEase:       8.0,

    // Visuals
    backgroundColor: '#111111',
    mediaFiles:      [],
    fallbackColor:   '#888888',
    fallbackOpacity: 0.55,
    borderRadius:    3,
  }

  // ─── MagneticTrails class ────────────────────────────────────────
  function MagneticTrails (container, config) {
    this.cfg       = Object.assign({}, DEFAULTS, config || {})
    this.container = container
    this.particles = []
    this.mouse     = { x: -9999, y: -9999 }
    this.W         = 0
    this.H         = 0
    this.raf       = null
    this.lastTime  = null

    const pos = window.getComputedStyle(container).position
    if (pos === 'static') container.style.position = 'relative'
    container.style.overflow        = 'hidden'
    container.style.backgroundColor = this.cfg.backgroundColor

    this._bindEvents()
    this._start()

    if (container.offsetWidth > 0 && container.offsetHeight > 0) {
      this._build()
    } else {
      const self = this
      requestAnimationFrame(function () {
        if (self.particles.length === 0) self._build()
      })
    }
  }

  // ── Media element factory ────────────────────────────────────────
  MagneticTrails.prototype._createMediaEl = function (src) {
    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(src)
    let el
    if (isVideo) {
      el = document.createElement('video')
      el.src        = src
      el.autoplay   = true
      el.loop       = true
      el.muted      = true
      el.playsInline = true
      el.setAttribute('playsinline', '')
      el.play().catch(function () {})
    } else {
      el = document.createElement('img')
      el.src      = src
      el.alt      = ''
      el.draggable = false
    }
    el.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;'
    return el
  }

  // ── Build / rebuild all particles ────────────────────────────────
  MagneticTrails.prototype._build = function () {
    const cfg  = this.cfg
    this.W = this.container.offsetWidth
    this.H = this.container.offsetHeight

    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].el.remove()
    }
    this.particles = []

    const angleRad = cfg.flowAngle * Math.PI / 180
    const half     = cfg.baseSize / 2

    for (let i = 0; i < cfg.count; i++) {
      // Random start position across entire container
      const x = Math.random() * this.W
      const y = Math.random() * this.H

      // Per-particle speed variation
      const t      = 1 + (Math.random() * 2 - 1) * cfg.turbulence
      const baseVx = Math.cos(angleRad) * cfg.flowSpeed * t
      const baseVy = Math.sin(angleRad) * cfg.flowSpeed * t

      const wrapper = document.createElement('div')
      wrapper.style.cssText = [
        'position:absolute',
        'left:'          + (x - half) + 'px',
        'top:'           + (y - half) + 'px',
        'width:'         + cfg.baseSize + 'px',
        'height:'        + cfg.baseSize + 'px',
        'border-radius:' + cfg.borderRadius + 'px',
        'transform-origin:center center',
        'pointer-events:none',
        'overflow:hidden',
        'will-change:transform, left, top',
      ].join(';')

      if (cfg.mediaFiles.length > 0) {
        const src = cfg.mediaFiles[Math.floor(Math.random() * cfg.mediaFiles.length)]
        wrapper.appendChild(this._createMediaEl(src))
      } else {
        wrapper.style.background = cfg.fallbackColor
        wrapper.style.opacity    = String(cfg.fallbackOpacity)
      }

      this.container.appendChild(wrapper)

      this.particles.push({
        el:     wrapper,
        x:      x,
        y:      y,
        vx:     baseVx,
        vy:     baseVy,
        baseVx: baseVx,
        baseVy: baseVy,
        phase:  Math.random() * cfg.phaseSpread,
        scale:  1,
      })
    }
  }

  // ── Events ───────────────────────────────────────────────────────
  MagneticTrails.prototype._bindEvents = function () {
    const self = this

    this._onMouseMove = function (e) {
      const r      = self.container.getBoundingClientRect()
      self.mouse.x = e.clientX - r.left
      self.mouse.y = e.clientY - r.top
    }

    this._onMouseLeave = function () {
      self.mouse.x = -9999
      self.mouse.y = -9999
    }

    this._prevW = 0
    this._prevH = 0
    this._ro = new ResizeObserver(function (entries) {
      const e = entries[0]
      const W = Math.round(e.contentRect.width)
      const H = Math.round(e.contentRect.height)
      if ((W !== self._prevW || H !== self._prevH) && W > 0 && H > 0) {
        self._prevW = W
        self._prevH = H
        self._build()
      }
    })
    this._ro.observe(this.container)

    this.container.addEventListener('mousemove',  this._onMouseMove)
    this.container.addEventListener('mouseleave', this._onMouseLeave)
  }

  // ── RAF loop ─────────────────────────────────────────────────────
  MagneticTrails.prototype._start = function () {
    const self = this
    function tick (now) {
      if (!self.lastTime) self.lastTime = now
      const dt = Math.min((now - self.lastTime) / 1000, 0.1)
      self.lastTime = now
      self._update(dt, now / 1000)
      self.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  // ── Per-frame update ─────────────────────────────────────────────
  MagneticTrails.prototype._update = function (dt, t) {
    const cfg  = this.cfg
    const W    = this.W
    const H    = this.H
    const mx   = this.mouse.x
    const my   = this.mouse.y
    const half = cfg.baseSize / 2
    const r2   = cfg.mouseRadius * cfg.mouseRadius
    const ease = 1 - Math.exp(-cfg.mouseEase * dt)
    const vret = 1 - Math.exp(-cfg.velocityReturn * dt)

    // Wrap margin so particles disappear before reappearing on the other side
    const wrapMargin = cfg.baseSize * (cfg.mouseMaxScale + 1)

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]

      // ── Mouse deflection ─────────────────────────────────────────
      const dx    = p.x - mx
      const dy    = p.y - my
      const dist2 = dx * dx + dy * dy
      let targetScale

      if (dist2 < r2) {
        const dist = Math.sqrt(dist2)
        if (dist > 0.5) {
          const strength = (1 - dist / cfg.mouseRadius) * cfg.mouseForce
          // Acceleration away from cursor
          p.vx += (dx / dist) * strength * dt
          p.vy += (dy / dist) * strength * dt
        }
        const tf = 1 - Math.sqrt(dist2) / cfg.mouseRadius
        targetScale = 1 + (cfg.mouseMaxScale - 1) * tf * tf
      } else {
        // Gentle pulse when far from cursor
        targetScale = 1 + cfg.pulseAmount * Math.sin(t * cfg.pulseSpeed + p.phase)
      }

      // ── Spring velocity back to base flow ────────────────────────
      p.vx += (p.baseVx - p.vx) * vret
      p.vy += (p.baseVy - p.vy) * vret

      // ── Move ─────────────────────────────────────────────────────
      p.x += p.vx * dt
      p.y += p.vy * dt

      // ── Seamless wrap ────────────────────────────────────────────
      if (p.x >  W + wrapMargin) p.x -= W + wrapMargin * 2
      if (p.x < -wrapMargin)     p.x += W + wrapMargin * 2
      if (p.y >  H + wrapMargin) p.y -= H + wrapMargin * 2
      if (p.y < -wrapMargin)     p.y += H + wrapMargin * 2

      // ── Scale lerp ───────────────────────────────────────────────
      p.scale += (targetScale - p.scale) * ease

      // ── Apply styles ─────────────────────────────────────────────
      p.el.style.left      = (p.x - half) + 'px'
      p.el.style.top       = (p.y - half) + 'px'
      p.el.style.transform = 'scale(' + p.scale.toFixed(4) + ')'
      p.el.style.zIndex    = Math.round(p.scale * 10)
    }
  }

  // ── Public API ───────────────────────────────────────────────────
  MagneticTrails.prototype.updateConfig = function (newCfg) {
    const needsRebuild = [
      'count', 'baseSize', 'flowAngle', 'flowSpeed', 'turbulence',
      'borderRadius', 'mediaFiles', 'fallbackColor', 'fallbackOpacity',
    ].some(function (k) { return k in newCfg && newCfg[k] !== this.cfg[k] }, this)

    Object.assign(this.cfg, newCfg)

    if ('backgroundColor' in newCfg) {
      this.container.style.backgroundColor = this.cfg.backgroundColor
    }
    if (needsRebuild) this._build()
  }

  MagneticTrails.prototype.destroy = function () {
    if (this.raf) cancelAnimationFrame(this.raf)
    if (this._ro)  this._ro.disconnect()
    this.container.removeEventListener('mousemove',  this._onMouseMove)
    this.container.removeEventListener('mouseleave', this._onMouseLeave)
    for (let i = 0; i < this.particles.length; i++) this.particles[i].el.remove()
    this.particles = []
    this.raf       = null
    this.lastTime  = null
  }

  // ─── Exports ─────────────────────────────────────────────────────
  global.MagneticTrails          = MagneticTrails
  global.MAGNETIC_TRAILS_DEFAULTS = DEFAULTS

})(typeof window !== 'undefined' ? window : globalThis)
