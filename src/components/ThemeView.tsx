'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import themesData from '@/data/themes.json'
import PenpalOnboardingModal from '@/components/PenpalOnboardingModal'

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
]
const ordinalLabel = (n: number) => ORDINALS[n] ?? `#${n + 1}`

// ─── Upload Zone ─────────────────────────────────────────

interface UploadZoneProps {
  side: 'left' | 'right'
  themeIndex: number
  correspondenceSlug?: string
  onUploaded?: (imageUrl: string) => void
}

function UploadZone({ side, themeIndex, correspondenceSlug, onUploaded }: UploadZoneProps) {
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
      fd.append('side', side)
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
}

export default function ThemeView({ correspondenceSlug, yourName, penpalName: penpalNameProp, themeOrder, needsPenpal = false }: ThemeViewProps = {}) {
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

  // ─── Init: localStorage role + onboarding + load responses ──

  useEffect(() => {
    if (!correspondenceSlug) return

    // 1. Determine user side from localStorage
    let side: 'left' | 'right' | null = null
    try {
      const stored = localStorage.getItem(`penpal4ever:role:${correspondenceSlug}`)
      if (stored === 'left' || stored === 'right') side = stored
    } catch {}
    setUserSide(side)

    // 2. Decide whether to show onboarding modal
    if (needsPenpal) {
      try {
        const created: string[] = JSON.parse(localStorage.getItem('penpal4ever:created') || '[]')
        // Only show if this browser did NOT create this correspondence
        if (!created.includes(correspondenceSlug)) {
          setShowOnboarding(true)
        }
      } catch {
        setShowOnboarding(true)
      }
    }

    // 3. Load existing uploaded images from the server
    fetch(`/api/correspondences/${correspondenceSlug}`)
      .then(r => r.json())
      .then(data => {
        if (data.images && typeof data.images === 'object') {
          setUploadedImages(prev => ({ ...prev, ...data.images }))
        }
      })
      .catch(() => {})
  }, [correspondenceSlug, needsPenpal])

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
      if (e.key === 'ArrowLeft')  navigateTo(index - 1)
      if (e.key === 'ArrowRight') navigateTo(index + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navigateTo, index])

  // ─── Uploaded image handler ───────────────────────────

  function handleUploaded(slot: string, url: string) {
    setUploadedImages(prev => ({ ...prev, [slot]: url }))
  }

  // ─── Render ───────────────────────────────────────────

  const theme   = themes[index]
  const ordinal = ordinalLabel(index)
  const canPrev = index > 0 && !isAnimating
  const canNext = index < themes.length - 1 && !isAnimating

  const headerStyle = {
    opacity:    headerOpacity,
    transition: `opacity ${FLASH_FADE_MS}ms ease`,
  }

  const leftName  = yourName  ?? theme.left?.name  ?? 'DANIEL'
  const rightName = penpalName || theme.right?.name || 'PENPAL'

  const leftUploadKey  = `${index}-left`
  const rightUploadKey = `${index}-right`

  return (
    <>
      {/* ─── Penpal onboarding ─── */}
      {showOnboarding && correspondenceSlug && (
        <PenpalOnboardingModal
          correspondenceSlug={correspondenceSlug}
          yourName={yourName ?? ''}
          onComplete={(name) => {
            setPenpalName(name.toUpperCase())
            setShowOnboarding(false)
            // Mark this browser as the penpal (right side)
            try {
              localStorage.setItem(`penpal4ever:role:${correspondenceSlug}`, 'right')
            } catch {}
            setUserSide('right')
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

          <div ref={doorLeftRef} className="barn-door barn-door--left">
            <div className="contributor">
              <h3 className="contributor__name">{leftName}</h3>
              <div className="contributor__frame">
                {theme.left?.image || uploadedImages[leftUploadKey] ? (
                  <img
                    className="contributor__image"
                    src={uploadedImages[leftUploadKey] ?? theme.left?.image}
                    alt={theme.left?.caption ?? ''}
                  />
                ) : userSide === 'left' ? (
                  <UploadZone
                    side="left"
                    themeIndex={index}
                    correspondenceSlug={correspondenceSlug}
                    onUploaded={(url) => handleUploaded(leftUploadKey, url)}
                  />
                ) : (
                  <div className="upload-zone upload-zone--empty" />
                )}
              </div>
              <p className="contributor__caption">{theme.left?.caption ?? ''}</p>
            </div>
          </div>

          <div ref={doorRightRef} className="barn-door barn-door--right">
            <div className="contributor">
              <h3 className="contributor__name">{rightName}</h3>
              <div className="contributor__frame">
                {theme.right?.image || uploadedImages[rightUploadKey] ? (
                  <img
                    className="contributor__image"
                    src={uploadedImages[rightUploadKey] ?? theme.right?.image}
                    alt={theme.right?.caption ?? ''}
                  />
                ) : userSide === 'right' ? (
                  <UploadZone
                    side="right"
                    themeIndex={index}
                    correspondenceSlug={correspondenceSlug}
                    onUploaded={(url) => handleUploaded(rightUploadKey, url)}
                  />
                ) : (
                  <div className="upload-zone upload-zone--empty" />
                )}
              </div>
              <p className="contributor__caption">{theme.right?.caption ?? ''}</p>
            </div>
          </div>

        </div>

        {/* Header overlay */}
        <header ref={ctHeaderRef} className="ct-header">
          <p className="theme-label">
            <span className="theme-label__the-num"><span>THE</span><span className="label-ordinal" style={headerStyle}>{ordinal}</span></span>
            <span>THEME</span>
            <span>IS</span>
          </p>
          <h1 className="theme-title" style={headerStyle}>
            &ldquo;{theme.title}&rdquo;
          </h1>

          <div className="ct-header__nav">
            {index > 0 && (
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
          </div>
        </header>

      </div>
    </>
  )
}
