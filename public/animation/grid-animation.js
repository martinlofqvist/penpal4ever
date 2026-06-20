/**
 * grid-animation.js
 * Noise-based media grid with pulse + mouse-proximity scaling.
 *
 * Usage:
 *   const anim = new GridAnimation(containerEl, config)
 *   anim.updateConfig({ gridSpacing: 80 })   // hot-reload values
 *   anim.destroy()
 *
 * window.GRID_ANIMATION_DEFAULTS — read the full config shape
 */

;(function (global) {
  'use strict'

  // ─── Default config ──────────────────────────────────────────────
  const DEFAULTS = {
    // Grid
    gridSpacing:    55,      // px between cell centres
    noiseScale:     0.10,    // spatial frequency (smaller = larger blobs)
    noiseThreshold: 0.42,    // 0–1; cells above this get an item
    noiseSeed:      17,

    // Item appearance
    baseSize:       30,      // px (width = height)
    borderRadius:   3,       // px

    // Pulse
    pulseAmount:    0.50,    // ±50% of baseSize
    pulseSpeed:     1.4,     // rad / s
    phaseSpread:    10.0,    // max random phase offset per item

    // Mouse interaction
    mouseRadius:    200,     // px — radius of influence
    mouseMaxScale:  5.0,     // 5× = 500 %
    mouseEase:      8.0,     // exponential-smoothing speed (higher = snappier)

    // Media — paths relative to /public, e.g. '/animation/media/cat.jpg'
    mediaFiles:      [],
    fallbackColor:   '#888888',  // used when mediaFiles is empty
    fallbackOpacity: 0.55,
    backgroundColor: '#111111',  // container background colour
  }

  // ─── 2D value noise ──────────────────────────────────────────────
  function _hash (x, y, seed) {
    let h = (x * 1619 + y * 31337 + seed * 1000003) | 0
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
    return ((h ^ (h >>> 16)) >>> 0) / 0xFFFFFFFF
  }

  function noise2d (x, y, seed) {
    const ix = Math.floor(x), iy = Math.floor(y)
    const fx = x - ix,        fy = y - iy
    const u  = fx * fx * (3 - 2 * fx)
    const v  = fy * fy * (3 - 2 * fy)
    const a  = _hash(ix,   iy,   seed)
    const b  = _hash(ix+1, iy,   seed)
    const c  = _hash(ix,   iy+1, seed)
    const d  = _hash(ix+1, iy+1, seed)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
  }

  // ─── GridAnimation class ─────────────────────────────────────────
  function GridAnimation (container, config) {
    this.cfg       = Object.assign({}, DEFAULTS, config || {})
    this.container = container
    this.items     = []
    this.mouse     = { x: -9999, y: -9999 }
    this.raf       = null
    this.lastTime  = null

    // Only set position if the element has no explicit positioning (don't
    // override 'absolute' or 'fixed' set via CSS, which would break sizing).
    const pos = window.getComputedStyle(container).position
    if (pos === 'static') container.style.position = 'relative'
    container.style.overflow        = 'hidden'
    container.style.backgroundColor = this.cfg.backgroundColor

    this._bindEvents()
    this._start()

    // Build immediately if the container already has dimensions, otherwise
    // defer one frame to let the browser complete layout first.
    if (container.offsetWidth > 0 && container.offsetHeight > 0) {
      this._build()
    } else {
      const self = this
      requestAnimationFrame(function () {
        if (self.items.length === 0) self._build()
      })
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────

  GridAnimation.prototype._createMediaEl = function (src) {
    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(src)
    let el
    if (isVideo) {
      el = document.createElement('video')
      el.src       = src
      el.autoplay  = true
      el.loop      = true
      el.muted     = true
      el.playsInline = true
      el.setAttribute('playsinline', '')
      el.play().catch(function () {})
    } else {
      el = document.createElement('img')
      el.src       = src
      el.alt       = ''
      el.draggable = false
    }
    el.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;'
    return el
  }

  GridAnimation.prototype._build = function () {
    const cfg = this.cfg
    const W   = this.container.offsetWidth
    const H   = this.container.offsetHeight

    // Remove existing items
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].el.remove()
    }
    this.items = []

    const half   = cfg.baseSize / 2
    const cols   = Math.ceil(W / cfg.gridSpacing) + 2
    const rows   = Math.ceil(H / cfg.gridSpacing) + 2
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const n = noise2d(
          col * cfg.noiseScale,
          row * cfg.noiseScale,
          cfg.noiseSeed
        )
        if (n < cfg.noiseThreshold) continue

        // Centre of item in container space
        const cx = col * cfg.gridSpacing
        const cy = row * cfg.gridSpacing

        const wrapper = document.createElement('div')
        wrapper.style.cssText = [
          'position:absolute',
          'left:'   + (cx - half) + 'px',
          'top:'    + (cy - half) + 'px',
          'width:'  + cfg.baseSize + 'px',
          'height:' + cfg.baseSize + 'px',
          'border-radius:' + cfg.borderRadius + 'px',
          'transform-origin:center center',
          'pointer-events:none',
          'overflow:hidden',
          'will-change:transform',
        ].join(';')

        if (cfg.mediaFiles.length > 0) {
          const src = cfg.mediaFiles[Math.floor(Math.random() * cfg.mediaFiles.length)]
          wrapper.appendChild(this._createMediaEl(src))
        } else {
          wrapper.style.background = cfg.fallbackColor
          wrapper.style.opacity    = String(cfg.fallbackOpacity)
        }

        this.container.appendChild(wrapper)
        this.items.push({
          el:    wrapper,
          cx:    cx,
          cy:    cy,
          phase: Math.random() * cfg.phaseSpread,
          scale: 1,
        })
      }
    }
  }

  GridAnimation.prototype._bindEvents = function () {
    const self = this

    this._onMouseMove = function (e) {
      const r     = self.container.getBoundingClientRect()
      self.mouse.x = e.clientX - r.left
      self.mouse.y = e.clientY - r.top
    }

    this._onMouseLeave = function () {
      self.mouse.x = -9999
      self.mouse.y = -9999
    }

    // ResizeObserver fires on first layout AND on resize —
    // replaces window 'resize' and solves the zero-size-on-init problem.
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

  GridAnimation.prototype._start = function () {
    const self = this
    function tick (now) {
      if (!self.lastTime) self.lastTime = now
      const dt = Math.min((now - self.lastTime) / 1000, 0.1) // cap at 100ms
      self.lastTime = now
      self._update(dt, now / 1000)
      self.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  GridAnimation.prototype._update = function (dt, t) {
    const cfg  = this.cfg
    const mx   = this.mouse.x
    const my   = this.mouse.y
    const r2   = cfg.mouseRadius * cfg.mouseRadius
    const ease = 1 - Math.exp(-cfg.mouseEase * dt)

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i]

      // Pulse: oscillates between (1 - pulseAmount) and (1 + pulseAmount)
      const pulse = 1 + cfg.pulseAmount * Math.sin(t * cfg.pulseSpeed + item.phase)

      // Mouse proximity
      const dx   = mx - item.cx
      const dy   = my - item.cy
      const dist2 = dx * dx + dy * dy
      let targetScale

      if (dist2 < r2) {
        const t_factor  = 1 - Math.sqrt(dist2) / cfg.mouseRadius
        const mouseScale = 1 + (cfg.mouseMaxScale - 1) * t_factor * t_factor
        targetScale = Math.max(pulse, mouseScale)
      } else {
        targetScale = pulse
      }

      // Exponential smoothing (frame-rate independent)
      item.scale += (targetScale - item.scale) * ease
      item.el.style.transform = 'scale(' + item.scale.toFixed(4) + ')'
      // Items closest to the mouse (largest scale) float above the rest
      item.el.style.zIndex = Math.round(item.scale * 10)
    }
  }

  // ── Public API ───────────────────────────────────────────────────

  GridAnimation.prototype.updateConfig = function (newCfg) {
    const needsRebuild = [
      'gridSpacing', 'noiseScale', 'noiseThreshold', 'noiseSeed',
      'baseSize', 'borderRadius', 'mediaFiles', 'fallbackColor', 'fallbackOpacity',
    ].some(function (k) { return k in newCfg && newCfg[k] !== this.cfg[k] }, this)

    Object.assign(this.cfg, newCfg)

    if ('backgroundColor' in newCfg) {
      this.container.style.backgroundColor = this.cfg.backgroundColor
    }
    if (needsRebuild) this._build()
  }

  GridAnimation.prototype.destroy = function () {
    if (this.raf) cancelAnimationFrame(this.raf)
    if (this._ro) this._ro.disconnect()
    this.container.removeEventListener('mousemove',  this._onMouseMove)
    this.container.removeEventListener('mouseleave', this._onMouseLeave)
    for (let i = 0; i < this.items.length; i++) this.items[i].el.remove()
    this.items    = []
    this.raf      = null
    this.lastTime = null
  }

  // ─── Exports ─────────────────────────────────────────────────────
  global.GridAnimation         = GridAnimation
  global.GRID_ANIMATION_DEFAULTS = DEFAULTS

})(typeof window !== 'undefined' ? window : globalThis)
