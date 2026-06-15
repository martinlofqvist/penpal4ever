'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { shuffle } from '@/lib/utils'
import themesData from '@/data/themes.json'

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

// ─── Timing (ms) ─────────────────────────────────────────

const INTRO_HOLD_MS = 2000
const INTRO_FLY_MS  = 380
const BARN_OPEN_MS  = 1300
const BARN_CLOSE_MS = 1300
const FLASH_FADE_MS = 200

// ─── Helpers ─────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const ORDINALS = [
  'FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH',
  'SIXTH', 'SEVENTH', 'EIGHTH', 'NINTH', 'TENTH',
]
const ordinalLabel = (n: number) => ORDINALS[n] ?? `#${n + 1}`

// ─── Component ───────────────────────────────────────────

export default function ThemeView() {
  const [themes]     = useState<Theme[]>(() => shuffle(themesData.themes as Theme[]))
  const [index, setIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Intro phase: 'holding' | 'flying' | 'gone' | 'done'
  const [introPhase, setIntroPhase] = useState<'holding' | 'flying' | 'gone' | 'done'>('holding')
  const [ctVisible, setCtVisible]   = useState(false)
  const [flyOffset, setFlyOffset]   = useState('translateY(-42vh)')

  // Header text opacity — fades between themes
  const [headerOpacity, setHeaderOpacity] = useState(1)

  // Refs for direct DOM animation (mirrors the original JS approach)
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

    // Force transform without animation, then reflow
    left.style.animation  = 'none'
    right.style.animation = 'none'
    left.style.transform  = 'rotateY(-90deg)'
    right.style.transform = 'rotateY(90deg)'
    void left.offsetWidth // trigger reflow
    left.style.animation  = ''
    right.style.animation = ''
    left.style.transform  = ''
    right.style.transform = ''
  }, [])

  // ─── Intro sequence ───────────────────────────────────

  useEffect(() => {
    const run = async () => {
      await sleep(INTRO_HOLD_MS)

      // FLIP: measure delta from intro block centre to ct-header position
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

    // 1. Close doors + fade header
    setHeaderOpacity(0)
    closeDoors()
    await sleep(BARN_CLOSE_MS)

    // 2. Update content while doors are shut
    setIndex(newIndex)
    resetDoorsToClose()

    // 3. Open doors + fade header in
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

  // ─── Render ───────────────────────────────────────────

  const theme   = themes[index]
  const ordinal = ordinalLabel(index)
  const canPrev = index > 0 && !isAnimating
  const canNext = index < themes.length - 1 && !isAnimating

  const headerStyle = {
    opacity:    headerOpacity,
    transition: `opacity ${FLASH_FADE_MS}ms ease`,
  }

  return (
    <>
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
              <span>THE</span>
              <span className="label-ordinal">{ordinal}</span>
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
              <h3 className="contributor__name">{theme.left?.name ?? 'DANIEL'}</h3>
              <div className="contributor__frame">
                {theme.left?.image ? (
                  <img
                    className="contributor__image"
                    src={theme.left.image}
                    alt={theme.left.caption ?? ''}
                  />
                ) : (
                  <UnseenState />
                )}
              </div>
              <p className="contributor__caption">{theme.left?.caption ?? ''}</p>
            </div>
          </div>

          <div ref={doorRightRef} className="barn-door barn-door--right">
            <div className="contributor">
              <h3 className="contributor__name">{theme.right?.name ?? 'MARTIN'}</h3>
              <div className="contributor__frame">
                {theme.right?.image ? (
                  <img
                    className="contributor__image"
                    src={theme.right.image}
                    alt={theme.right.caption ?? ''}
                  />
                ) : (
                  <UnseenState />
                )}
              </div>
              <p className="contributor__caption">{theme.right?.caption ?? ''}</p>
            </div>
          </div>

        </div>

        {/* Header overlay */}
        <header ref={ctHeaderRef} className="ct-header">
          <p className="theme-label">
            <span>THE</span>
            <span className="label-ordinal" style={headerStyle}>{ordinal}</span>
            <span>THEME</span>
            <span>IS</span>
          </p>
          <h1 className="theme-title" style={headerStyle}>
            &ldquo;{theme.title}&rdquo;
          </h1>

          <div className="ct-header__nav">
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

// ─── Unseen state icon ────────────────────────────────────

function UnseenState() {
  return (
    <div className="unseen-state">
      <svg className="unseen-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2L46 46" stroke="#9a9a9a" strokeWidth="2" strokeLinecap="round" />
        <path d="M8.5 13.5C5.2 16.3 3 19.5 2 22c3.8 9.4 12.4 16 22 16 3.5 0 6.8-.8 9.7-2.3" stroke="#9a9a9a" strokeWidth="2" strokeLinecap="round" />
        <path d="M39.5 34.5C42.8 31.7 45 28.5 46 26c-3.8-9.4-12.4-16-22-16-3.5 0-6.8.8-9.7 2.3" stroke="#9a9a9a" strokeWidth="2" strokeLinecap="round" />
        <path d="M17.5 17.5A9 9 0 0 0 15 24a9 9 0 0 0 9 9 9 9 0 0 0 6.5-2.5" stroke="#9a9a9a" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <p className="unseen-label">HAS NOT YET SEEN THIS THEME</p>
    </div>
  )
}
