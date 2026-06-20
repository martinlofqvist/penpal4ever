/**
 * ribbon.js
 * Images stacked in vertical columns, scrolling upward.
 * Each card flips on its Y-axis to reveal a different image on the back.
 * Columns oscillate slowly in X via a sine wave.
 *
 * Usage:
 *   const anim = new RibbonAnimation(containerEl, config)
 *   anim.updateConfig({ scrollSpeed: 80 })
 *   anim.destroy()
 */

;(function (global) {
  'use strict'

  // ─── Default config ──────────────────────────────────────────────
  const DEFAULTS = {
    // Layout
    columns:           2,       // number of vertical streams
    baseSize:          90,      // px — card width & height
    imageMargin:       14,      // px — vertical gap between cards
    columnGap:         30,      // px — gap between columns
    xOffset:           0,       // px — shift entire animation left (negative) or right (positive)

    // Scroll
    scrollSpeed:       55,      // px / s upward

    // Sine oscillation in X
    sineAmplitude:     28,      // px
    sineSpeed:         0.45,    // rad / s
    columnPhaseOffset: 2.094,   // phase offset between columns (2π/3 ≈ even spread)
    itemPhaseOffset:   0.65,    // phase offset between consecutive items in a column

    // Card flip
    flipSpeed:         0.55,    // rad / s rotation around Y
    flipPhaseSpread:   6.28,    // random initial rotation spread (6.28 = fully random)
    perspective:       500,     // px — 3D depth

    // Appearance
    borderRadius:      4,       // px
    backgroundColor:   '#111111',
    mediaFiles:        [],
    fallbackColor:     '#888888',
    fallbackOpacity:   0.55,
  }

  // ─── RibbonAnimation class ───────────────────────────────────────
  function RibbonAnimation (container, config) {
    this.cfg       = Object.assign({}, DEFAULTS, config || {})
    this.container = container
    this.cols      = []   // array of columns, each an array of card objects
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
        if (self.cols.length === 0) self._build()
      })
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────

  RibbonAnimation.prototype._pickMedia = function (exclude) {
    const files = this.cfg.mediaFiles
    if (!files || files.length === 0) return null
    if (files.length === 1) return files[0]
    let src, tries = 0
    do {
      src = files[Math.floor(Math.random() * files.length)]
      tries++
    } while (src === exclude && tries < 10)
    return src
  }

  RibbonAnimation.prototype._makeMediaEl = function (src) {
    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(src)
    let el
    if (isVideo) {
      el = document.createElement('video')
      el.src         = src
      el.autoplay    = true
      el.loop        = true
      el.muted       = true
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

  RibbonAnimation.prototype._makeFace = function (src, flipped, radius) {
    const face = document.createElement('div')
    face.style.cssText = [
      'position:absolute',
      'inset:0',
      'overflow:hidden',
      'border-radius:' + radius + 'px',
      'backface-visibility:hidden',
      '-webkit-backface-visibility:hidden',
      flipped ? 'transform:rotateY(180deg)' : '',
    ].filter(Boolean).join(';')

    if (src) {
      face.appendChild(this._makeMediaEl(src))
    } else {
      face.style.background = this.cfg.fallbackColor
      face.style.opacity    = String(this.cfg.fallbackOpacity)
    }
    return face
  }

  // ── Build / rebuild ──────────────────────────────────────────────

  RibbonAnimation.prototype._build = function () {
    const cfg  = this.cfg
    this.W = this.container.offsetWidth
    this.H = this.container.offsetHeight

    // Tear down existing cards
    for (let c = 0; c < this.cols.length; c++) {
      for (let i = 0; i < this.cols[c].length; i++) {
        this.cols[c][i].el.remove()
      }
    }
    this.cols = []

    const size  = cfg.baseSize
    const step  = size + cfg.imageMargin
    const nCols = cfg.columns

    // Centre the columns horizontally, then apply xOffset
    const totalW = nCols * size + (nCols - 1) * cfg.columnGap
    const startX = (this.W - totalW) / 2 + cfg.xOffset

    // Enough cards to fill height + one card's worth of buffer top & bottom
    const nCards = Math.ceil((this.H + size * 2) / step) + 2

    for (let c = 0; c < nCols; c++) {
      const colCx = startX + c * (size + cfg.columnGap) + size / 2
      const column = []

      for (let i = 0; i < nCards; i++) {
        // Start just above the container so stream begins immediately
        const y = i * step - size

        const frontSrc = this._pickMedia(null)
        const backSrc  = this._pickMedia(frontSrc)

        const card = document.createElement('div')
        card.style.cssText = [
          'position:absolute',
          'width:'           + size + 'px',
          'height:'          + size + 'px',
          'left:'            + (colCx - size / 2) + 'px',
          'top:'             + y + 'px',
          'transform-style:preserve-3d',
          'transform-origin:center center',
          'pointer-events:none',
          'will-change:transform',
        ].join(';')

        const frontFace = this._makeFace(frontSrc, false, cfg.borderRadius)
        const backFace  = this._makeFace(backSrc,  true,  cfg.borderRadius)
        card.appendChild(frontFace)
        card.appendChild(backFace)
        this.container.appendChild(card)

        column.push({
          el:        card,
          frontFace: frontFace,
          backFace:  backFace,
          colCx:     colCx,
          y:         y,
          rotY:      Math.random() * cfg.flipPhaseSpread,
          sinePhase: c * cfg.columnPhaseOffset + i * cfg.itemPhaseOffset,
        })
      }

      this.cols.push(column)
    }
  }

  // ── Events ───────────────────────────────────────────────────────

  RibbonAnimation.prototype._bindEvents = function () {
    const self = this
    this._prevW = 0
    this._prevH = 0
    this._ro = new ResizeObserver(function (entries) {
      const e = entries[0]
      const W = Math.round(e.contentRect.width)
      const H = Math.round(e.contentRect.height)
      if (W > 0 && H > 0) {
        const isInit = self._prevW === 0 && self._prevH === 0
        self._prevW = W
        self._prevH = H
        // First observation: full build. Subsequent resizes: reposition only (no media reload).
        if (isInit) self._build()
        else self._reposition()
      }
    })
    this._ro.observe(this.container)
  }

  // ── RAF loop ─────────────────────────────────────────────────────

  RibbonAnimation.prototype._start = function () {
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

  RibbonAnimation.prototype._update = function (dt, t) {
    const cfg  = this.cfg
    const size = cfg.baseSize
    const step = size + cfg.imageMargin

    for (let c = 0; c < this.cols.length; c++) {
      const column = this.cols[c]

      // Find the lowest card (largest y) before moving — used for wrap target
      let maxY = -Infinity
      for (let i = 0; i < column.length; i++) {
        if (column[i].y > maxY) maxY = column[i].y
      }

      for (let i = 0; i < column.length; i++) {
        const card = column[i]

        // ── Scroll upward ──────────────────────────────────────────
        card.y -= cfg.scrollSpeed * dt

        // ── Wrap: off the top → jump to below the last card ───────
        if (card.y + size < 0) {
          card.y = maxY + step
          maxY   = card.y  // update in case multiple cards wrap this frame

          // Re-shuffle images for variety
          if (cfg.mediaFiles.length > 1) {
            const fSrc = this._pickMedia(null)
            const bSrc = this._pickMedia(fSrc)
            this._setFaceMedia(card.frontFace, fSrc)
            this._setFaceMedia(card.backFace,  bSrc)
          }
        }

        // ── Flip rotation ──────────────────────────────────────────
        card.rotY += cfg.flipSpeed * dt

        // ── Sine X oscillation + manual X offset ──────────────────
        const xOffset = cfg.sineAmplitude * Math.sin(t * cfg.sineSpeed + card.sinePhase)

        // ── Apply styles ───────────────────────────────────────────
        card.el.style.left      = (card.colCx - size / 2 + xOffset + cfg.xOffset) + 'px'
        card.el.style.top       = card.y + 'px'
        card.el.style.transform =
          'perspective(' + cfg.perspective + 'px) rotateY(' + card.rotY.toFixed(4) + 'rad)'
      }
    }
  }

  // ── Replace media inside a face ──────────────────────────────────

  RibbonAnimation.prototype._setFaceMedia = function (face, src) {
    // Remove existing media child (keep the face div intact)
    while (face.firstChild) face.removeChild(face.firstChild)
    if (src) {
      face.appendChild(this._makeMediaEl(src))
    } else {
      face.style.background = this.cfg.fallbackColor
      face.style.opacity    = String(this.cfg.fallbackOpacity)
    }
  }

  // ── Reposition columns after resize (no media reload) ───────────

  RibbonAnimation.prototype._reposition = function () {
    this.W = this.container.offsetWidth
    this.H = this.container.offsetHeight

    const cfg    = this.cfg
    const size   = cfg.baseSize
    const nCols  = cfg.columns
    const totalW = nCols * size + (nCols - 1) * cfg.columnGap
    const startX = (this.W - totalW) / 2

    for (let c = 0; c < this.cols.length; c++) {
      const colCx = startX + c * (size + cfg.columnGap) + size / 2
      for (let i = 0; i < this.cols[c].length; i++) {
        this.cols[c][i].colCx = colCx
      }
    }
  }

  // ── Public API ───────────────────────────────────────────────────

  RibbonAnimation.prototype.updateConfig = function (newCfg) {
    const needsRebuild = [
      'columns', 'baseSize', 'imageMargin', 'columnGap',
      'borderRadius', 'mediaFiles', 'fallbackColor', 'fallbackOpacity',
      'flipPhaseSpread', 'columnPhaseOffset', 'itemPhaseOffset',
    ].some(function (k) { return k in newCfg && newCfg[k] !== this.cfg[k] }, this)

    Object.assign(this.cfg, newCfg)

    if ('backgroundColor' in newCfg) {
      this.container.style.backgroundColor = this.cfg.backgroundColor
    }
    if (needsRebuild) this._build()
  }

  RibbonAnimation.prototype.destroy = function () {
    if (this.raf) cancelAnimationFrame(this.raf)
    if (this._ro)  this._ro.disconnect()
    for (let c = 0; c < this.cols.length; c++) {
      for (let i = 0; i < this.cols[c].length; i++) {
        this.cols[c][i].el.remove()
      }
    }
    this.cols     = []
    this.raf      = null
    this.lastTime = null
  }

  // ─── Exports ─────────────────────────────────────────────────────
  global.RibbonAnimation         = RibbonAnimation
  global.RIBBON_ANIMATION_DEFAULTS = DEFAULTS

})(typeof window !== 'undefined' ? window : globalThis)
