'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import themesData from '@/data/themes.json'
import PenpalOnboardingModal from '@/components/PenpalOnboardingModal'
import CorrespondenceSettings from '@/components/CorrespondenceSettings'

// ─── Types ────────────────────────────────────────────────

interface ThemeContributor {
  name?: string
  image?: string
  caption?: string
}

interface Theme {
  id: number
  title: string
  left?: ThemeContributor
  right?: ThemeContributor
}

// ─── Timing (ms) — halved for snappier transitions ────────

const INTRO_HOLD_MS = 2000
const INTRO_FLY_MS  = 190    // was 380
const BARN_OPEN_MS  = 650    // was 1300
const BARN_CLOSE_MS = 650    // was 1300
const FLASH_FADE_MS = 200

// ─── Helpers ─────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const ORDINALS = [
  'FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH',
  'SIXTH', 'SEVENTH', 'EIGHTH', 'NINTH', 'TENTH',
  'ELEVENTH', 'TWELFTH', 'THIRTEENTH', 'FOURTEENTH', 'FIFTEENTH',
  'SIXTEENTH', 'SEVENTEENTH', 'EIGHTEENTH', 'NINETEENTH', 'TWENTIETH',
]
const ordinalLabel = (n: number) => ORDINALS[n] ?? `${n + 1}TH`

// ─── Upload Zone ─────────────────────────────────────────

interface UploadZoneProps {
  side: 'left' | 'right'
  themeIndex: number
  correspondenceSlug?: string
  token?: string | null
  onUploaded?: (imageUrl: string | null) => void
}

function UploadZone({ side, themeIndex, correspondenceSlug, token, onUploaded }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    if (!correspondenceSlug) return
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('token', token ?? '')
      fd.append('themeIndex', String(themeIndex))
      const res = await fetch(`/api/correspondences/${correspondenceSlug}/upload`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUploadedUrl(data.imageUrl)
      onUploaded?.(data.imageUrl)
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setIsUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  if (uploadedUrl) {
    return <img className="contributor__image" src={uploadedUrl} alt="Uploaded submission" />
  }

  return (
    <div
      className={[
        'upload-zone',
        isDragging  ? 'is-dragging'  : '',
        isUploading ? 'is-uploading' : '',
        !correspondenceSlug ? 'upload-zone--disabled' : '',
      ].filter(Boolean).join(' ')}
      onClick={() => !isUploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      aria-label="Upload your image"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {isUploading ? (
        <div className="upload-zone__spinner" aria-label="Uploading…" />
      ) : (
        <>
          <svg className="upload-zone__icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 44V20M32 20L22 30M32 20L42 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 48h32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <p className="upload-zone__label">
            {isDragging ? 'DROP TO UPLOAD' : 'UPLOAD YOUR WORK'}
          </p>
          <p className="upload-zone__sub">Click or drag &amp; drop</p>
        </>
      )}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────

interface ThemeViewProps {
  correspondenceSlug?: string
  yourName?: string
  penpalName?: string
  /** Fixed ordered list of theme IDs from the DB. Falls back to source order if not provided. */
  themeOrder?: number[]
  /** If true, show the penpal onboarding modal on first load */
  needsPenpal?: boolean
  /** Side derived server-side from the token in the URL ('left' | 'right' | null) */
  initialSide?: 'left' | 'right' | null
  /** The raw token from the URL — passed to the upload API for server-side validation */
  token?: string | null
  leftShareUrl?: string
  rightShareUrl?: string
  limitThemes?: boolean
  maxThemes?: number | null
}

export default function ThemeView({ correspondenceSlug, yourName, penpalName: penpalNameProp, themeOrder, needsPenpal = false, initialSide = null, token = null, leftShareUrl = '', rightShareUrl = '', limitThemes = false, maxThemes: maxThemesProp = null }: ThemeViewProps = {}) {
  const themeById = useMemo(() => {
    const map = new Map<number, Theme>()
    for (const t of themesData.themes as Theme[]) map.set(t.id, t)
    return map
  }, [])

  const themes = useMemo<Theme[]>(() => {
    if (themeOrder && themeOrder.length > 0) {
      return themeOrder.map((id) => themeById.get(id)).filter(Boolean) as Theme[]
    }
    return themesData.themes as Theme[]
  }, [themeOrder, themeById])

  const [penpalName, setPenpalName] = useState(penpalNameProp ?? '')
  // Start hidden; resolved after reading localStorage to avoid flash for creator
  const [showOnboarding, setShowOnboarding] = useState(false)
  // 'left' = creator, 'right' = penpal, null = unknown
  const [userSide, setUserSide] = useState<'left' | 'right' | null>(null)

  const [index, setIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Intro phase: 'holding' | 'flying' | 'gone' | 'done'
  const [introPhase, setIntroPhase] = useState<'holding' | 'flying' | 'gone' | 'done'>('holding')
  const [ctVisible, setCtVisible]   = useState(false)
  const [flyOffset, setFlyOffset]   = useState('translateY(-42vh)')

  // Per-slot uploaded images: keyed as `${themeIndex}-${side}`
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({})

  // Header text opacity — fades between themes
  const [headerOpacity, setHeaderOpacity] = useState(1)

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  // Debug mode — append ?debug=true to URL to always show nav buttons
  const [debugMode, setDebugMode] = useState(false)

  // Settings panel
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [currentLimitThemes, setCurrentLimitThemes] = useState(limitThemes)
  const [currentMaxThemes,   setCurrentMaxThemes]   = useState(maxThemesProp)

  // Refs for direct DOM animation
  const introBlockRef = useRef<HTMLDivElement>(null)
  const ctHeaderRef   = useRef<HTMLElement>(null)
  const doorLeftRef   = useRef<HTMLDivElement>(null)
  const doorRightRef  = useRef<HTMLDivElement>(null)

  // ─── Door helpers ─────────────────────────────────────

  const openDoors = useCallback(() => {
    doorLeftRef.current?.classList.add('is-open')
    doorRightRef.current?.classList.add('is-open')
  }, [])

  const closeDoors = useCallback(() => {
    doorLeftRef.current?.classList.remove('is-open')
    doorRightRef.current?.classList.remove('is-open')
    doorLeftRef.current?.classList.add('is-closing')
    doorRightRef.current?.classList.add('is-closing')
  }, [])

  const resetDoorsToClose = useCallback(() => {
    const left  = doorLeftRef.current
    const right = doorRightRef.current
    if (!left || !right) return

    left.classList.remove('is-closing', 'is-open')
    right.classList.remove('is-closing', 'is-open')

    left.style.animation  = 'none'
    right.style.animation = 'none'
    left.style.transform  = 'rotateY(-90deg)'
    right.style.transform = 'rotateY(90deg)'
    void left.offsetWidth
    left.style.animation  = ''
    right.style.animation = ''
    left.style.transform  = ''
    right.style.transform = ''
  }, [])

  // ─── Init: side from token + onboarding + load responses ────

  useEffect(() => {
    if (!correspondenceSlug) return

    // 1. Side is derived server-side from the token — use directly
    setUserSide(initialSide)

    // 2. Show onboarding if penpal hasn't registered yet and visitor has no token
    //    (token=null means no recognised side — they must be the penpal arriving for the first time)
    if (needsPenpal && initialSide === null) {
      setShowOnboarding(true)
    }

    // 3. Debug mode via ?debug=true
    setDebugMode(new URLSearchParams(window.location.search).get('debug') === 'true')

    // 4. Load existing uploaded images from the server
    fetch(`/api/correspondences/${correspondenceSlug}`)
      .then(r => r.json())
      .then(data => {
        if (data.images && typeof data.images === 'object') {
          setUploadedImages(prev => ({ ...prev, ...data.images }))
        }
      })
      .catch(() => {})
  }, [correspondenceSlug, needsPenpal, initialSide])

  // ─── Intro sequence ───────────────────────────────────

  useEffect(() => {
    const run = async () => {
      await sleep(INTRO_HOLD_MS)

      if (introBlockRef.current && ctHeaderRef.current) {
        const blockRect  = introBlockRef.current.getBoundingClientRect()
        const headerRect = ctHeaderRef.current.getBoundingClientRect()
        const delta      = headerRect.top - blockRect.top
        setFlyOffset(`translateY(${delta}px)`)
      }

      setIntroPhase('flying')
      await sleep(INTRO_FLY_MS)

      setIntroPhase('gone')
      setCtVisible(true)
      await sleep(FLASH_FADE_MS)

      setIntroPhase('done')
      openDoors()
    }

    run()
  }, [openDoors])

  // ─── Navigation ───────────────────────────────────────

  const navigateTo = useCallback(async (newIndex: number) => {
    if (newIndex < 0 || newIndex >= themes.length) return
    if (isAnimating) return

    setIsAnimating(true)

    setHeaderOpacity(0)
    closeDoors()
    await sleep(BARN_CLOSE_MS)

    setIndex(newIndex)
    resetDoorsToClose()

    setHeaderOpacity(1)
    openDoors()
    await sleep(BARN_OPEN_MS)

    setIsAnimating(false)
  }, [isAnimating, themes.length, closeDoors, resetDoorsToClose, openDoors])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     setLightboxUrl(null)
      if (e.key === 'ArrowLeft')  navigateTo(index - 1)
      if (e.key === 'ArrowRight') navigateTo(index + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navigateTo, index])

  // ─── Uploaded image handler ───────────────────────────
  // The upload API may return imageUrl=null even when the file is in Blob
  // (the Vercel Blob plugin resolves the URL asynchronously in the DB).
  // We immediately apply any URL we do get, then always re-fetch from the
  // GET route — which uses depth:1 and reliably returns the Blob URL.

  function handleUploaded(slot: string, url: string | null) {
    if (url) setUploadedImages(prev => ({ ...prev, [slot]: url }))
    if (!correspondenceSlug) return
    fetch(`/api/correspondences/${correspondenceSlug}`)
      .then(r => r.json())
      .then(data => {
        if (data.images && typeof data.images === 'object') {
          setUploadedImages(prev => ({ ...prev, ...data.images }))
        }
      })
      .catch(() => {})
  }

  // ─── Render ───────────────────────────────────────────

  const theme   = themes[index]
  const ordinal = ordinalLabel(index)

  const leftUploadKey  = `${index}-left`
  const rightUploadKey = `${index}-right`

  const leftImageSrc  = uploadedImages[leftUploadKey]  ?? theme.left?.image  ?? null
  const rightImageSrc = uploadedImages[rightUploadKey] ?? theme.right?.image ?? null

  const leftHasImage  = !!leftImageSrc
  const rightHasImage = !!rightImageSrc
  const bothUploaded  = leftHasImage && rightHasImage

  const hasPrev      = index > 0
  const hasNextTheme = index < themes.length - 1
  const canPrev      = hasPrev && !isAnimating
  const showNext     = hasNextTheme && (bothUploaded || debugMode)
  const canNext      = showNext && !isAnimating

  const headerStyle = {
    opacity:    headerOpacity,
    transition: `opacity ${FLASH_FADE_MS}ms ease`,
  }

  const leftName  = yourName  ?? theme.left?.name  ?? 'DANIEL'
  const rightName = penpalName || theme.right?.name || 'PENPAL'

  return (
    <>
      {/* ─── Penpal onboarding ─── */}
      {showOnboarding && correspondenceSlug && (
        <PenpalOnboardingModal
          correspondenceSlug={correspondenceSlug}
          yourName={yourName ?? ''}
          onComplete={(name, rightToken) => {
            setPenpalName(name.toUpperCase())
            setShowOnboarding(false)
            setUserSide('right')
            // Put the rightToken in the URL so reloads retain identity
            if (rightToken) {
              window.history.replaceState(null, '', `?token=${rightToken}`)
            }
          }}
        />
      )}

      {/* ─── Intro overlay ─── */}
      {introPhase !== 'done' && (
        <div className={[
          'intro',
          introPhase === 'gone' ? 'is-gone' : '',
        ].join(' ').trim()}>
          <div
            ref={introBlockRef}
            className={`intro__block${introPhase === 'flying' ? ' is-flying' : ''}`}
            style={{ '--intro-fly-offset': flyOffset } as React.CSSProperties}
          >
            <p className="theme-label">
              <span className="theme-label__the-num"><span>THE</span><span className="label-ordinal">{ordinal}</span></span>
              <span>THEME</span>
              <span>IS</span>
            </p>
            <h1 className="theme-title">&ldquo;{theme.title}&rdquo;</h1>
          </div>
        </div>
      )}

      {/* ─── Current theme layout ─── */}
      <div className={`ct-layout${ctVisible ? ' is-visible' : ''}`}>

        {/* Barn doors */}
        <div className="barn-wrap">

          {/* ── Left door ── */}
          <div
            ref={doorLeftRef}
            className={`barn-door barn-door--left${leftImageSrc ? ' barn-door--has-image' : ''}`}
            onClick={leftImageSrc ? () => setLightboxUrl(leftImageSrc) : undefined}
          >
            {leftImageSrc ? (
              <>
                <img
                  className="barn-door__bg-image"
                  src={leftImageSrc}
                  alt={theme.left?.caption ?? ''}
                />
                <div className="contributor contributor--overlay">
                  <h3 className="contributor__name">{leftName}</h3>
                  {theme.left?.caption && (
                    <p className="contributor__caption">{theme.left.caption}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="barn-door__panel">
                <div className="barn-door__upload-wrap">
                  {userSide === 'left' && (
                    <UploadZone
                      side="left"
                      themeIndex={index}
                      correspondenceSlug={correspondenceSlug}
                      token={token}
                      onUploaded={(url) => handleUploaded(leftUploadKey, url)}
                    />
                  )}
                </div>
                <div className="contributor">
                  <h3 className="contributor__name">{leftName}</h3>
                  {userSide !== 'left' && (
                    <p className="contributor__caption contributor__caption--muted">
                      HAS NOT SEEN THIS THEME, YET
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right door ── */}
          <div
            ref={doorRightRef}
            className={`barn-door barn-door--right${rightImageSrc ? ' barn-door--has-image' : ''}`}
            onClick={rightImageSrc ? () => setLightboxUrl(rightImageSrc) : undefined}
          >
            {rightImageSrc ? (
              <>
                <img
                  className="barn-door__bg-image"
                  src={rightImageSrc}
                  alt={theme.right?.caption ?? ''}
                />
                <div className="contributor contributor--overlay">
                  <h3 className="contributor__name">{rightName}</h3>
                  {theme.right?.caption && (
                    <p className="contributor__caption">{theme.right.caption}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="barn-door__panel">
                <div className="barn-door__upload-wrap">
                  {userSide === 'right' && (
                    <UploadZone
                      side="right"
                      themeIndex={index}
                      correspondenceSlug={correspondenceSlug}
                      token={token}
                      onUploaded={(url) => handleUploaded(rightUploadKey, url)}
                    />
                  )}
                </div>
                <div className="contributor">
                  <h3 className="contributor__name">{rightName}</h3>
                  {userSide !== 'right' && (
                    <p className="contributor__caption contributor__caption--muted">
                      HAS NOT SEEN THIS THEME, YET
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Header overlay */}
        <header ref={ctHeaderRef} className="ct-header">

          {/* Settings button — top right corner */}
          {correspondenceSlug && (
            <button
              className="settings-btn"
              onClick={() => setSettingsOpen(true)}
              aria-label="Open settings"
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 1.5V3M9 15v1.5M1.5 9H3M15 9h1.5M3.697 3.697l1.06 1.06M13.243 13.243l1.06 1.06M3.697 14.303l1.06-1.06M13.243 4.757l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}

          {/* Prev button — left side, vertically centred with text block */}
          <div className="ct-header__side ct-header__side--left">
            {hasPrev && (
              <button
                className="nav-btn nav-btn--prev"
                onClick={() => navigateTo(index - 1)}
                disabled={!canPrev}
                aria-label="Previous theme"
              >
                <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                  <path d="M6 1L1 6L6 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Centre: label + title */}
          <div className="ct-header__center">
            <p className="theme-label">
              <span className="theme-label__the-num"><span>THE</span><span className="label-ordinal" style={headerStyle}>{ordinal}</span></span>
              <span>THEME</span>
              <span>IS</span>
            </p>
            <h1 className="theme-title" style={headerStyle}>
              &ldquo;{theme.title}&rdquo;
            </h1>
          </div>

          {/* Next button — right side */}
          <div className="ct-header__side ct-header__side--right">
            {showNext && (
              <button
                className="nav-btn nav-btn--next"
                onClick={() => navigateTo(index + 1)}
                disabled={!canNext}
                aria-label="Next theme"
              >
                <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                  <path d="M1 1L6 6L1 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>

        </header>

      </div>

      {/* ─── Settings ─── */}
      {settingsOpen && correspondenceSlug && (
        <CorrespondenceSettings
          correspondenceSlug={correspondenceSlug}
          yourName={leftName}
          penpalName={rightName}
          leftShareUrl={leftShareUrl}
          rightShareUrl={rightShareUrl}
          userSide={userSide}
          token={token}
          initialLimitThemes={currentLimitThemes}
          initialMaxThemes={currentMaxThemes}
          onClose={() => setSettingsOpen(false)}
          onThemesUpdated={(limit, max) => {
            setCurrentLimitThemes(limit)
            setCurrentMaxThemes(max)
          }}
        />
      )}

      {/* ─── Lightbox ─── */}
      {lightboxUrl && (
        <div
          className="lightbox"
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            className="lightbox__close"
            onClick={() => setLightboxUrl(null)}
            aria-label="Close"
          >✕</button>
          <img
            className="lightbox__img"
            src={lightboxUrl}
            alt="Full size preview"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
