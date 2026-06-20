'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  correspondenceSlug: string
  yourName: string
  penpalName: string
  leftShareUrl: string
  rightShareUrl: string
  userSide: 'left' | 'right' | null
  token: string | null
  initialLimitThemes: boolean
  initialMaxThemes: number | null
  onClose: () => void
  onThemesUpdated: (limitThemes: boolean, maxThemes: number | null) => void
}

export default function CorrespondenceSettings({
  correspondenceSlug,
  yourName,
  penpalName,
  leftShareUrl,
  rightShareUrl,
  userSide,
  token,
  initialLimitThemes,
  initialMaxThemes,
  onClose,
  onThemesUpdated,
}: Props) {
  const isCreator = userSide === 'left'

  const [copiedLeft,  setCopiedLeft]  = useState(false)
  const [copiedRight, setCopiedRight] = useState(false)

  // Theme editing state (creator only)
  const [maxThemes,  setMaxThemes]  = useState<number>(initialMaxThemes ?? 6)
  const [isInfinite, setIsInfinite] = useState<boolean>(!initialLimitThemes)
  const [saving,     setSaving]     = useState(false)
  const [saveError,  setSaveError]  = useState('')

  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function copyLink(url: string, which: 'left' | 'right') {
    // Build absolute URL client-side if the server didn't have NEXT_PUBLIC_SITE_URL
    const absolute = url.startsWith('http') ? url : `${window.location.origin}${url}`
    navigator.clipboard.writeText(absolute).catch(() => {})
    if (which === 'left') {
      setCopiedLeft(true)
      setTimeout(() => setCopiedLeft(false), 2500)
    } else {
      setCopiedRight(true)
      setTimeout(() => setCopiedRight(false), 2500)
    }
  }

  async function handleSaveThemes() {
    if (!isCreator) return
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`/api/correspondences/${correspondenceSlug}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          maxThemes: isInfinite ? null : maxThemes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      onThemesUpdated(!isInfinite, isInfinite ? null : maxThemes)
    } catch (err: any) {
      setSaveError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  const themesLabel = isInfinite ? '∞' : String(maxThemes)

  const leftLabel  = yourName  || 'CREATOR'
  const rightLabel = penpalName || 'PENPAL'

  return createPortal(
    <div
      ref={overlayRef}
      className="modal-overlay is-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="modal modal--settings">
        <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>

        <div className="modal__intro">
          <h2 className="modal__title" id="settings-title">CORRESPONDENCE SETTINGS</h2>
        </div>

        <div className="modal__body">

          {/* ── Names ── */}
          <div className="modal__section">
            <div className="modal__section-head">
              <span className="modal__section-label">PARTICIPANTS</span>
            </div>
            <div className="settings-names">
              <div className="settings-name-row">
                <span className="settings-name-label">LEFT</span>
                <span className="settings-name-value">{leftLabel}</span>
              </div>
              <div className="settings-name-row">
                <span className="settings-name-label">RIGHT</span>
                <span className="settings-name-value">{rightLabel || '…'}</span>
              </div>
            </div>
          </div>

          {/* ── Share links ── */}
          <div className="modal__section">
            <div className="modal__section-head">
              <span className="modal__section-label">SHARE LINKS</span>
            </div>
            <div className="settings-links">
              <div className="settings-link-row">
                <div className="settings-link-info">
                  <span className="settings-link-who">{leftLabel}</span>
                  <span className="settings-link-url">{leftShareUrl || `…/correspondence/${correspondenceSlug}?token=…`}</span>
                </div>
                <button
                  className={`settings-copy-btn${copiedLeft ? ' is-copied' : ''}`}
                  type="button"
                  onClick={() => copyLink(leftShareUrl, 'left')}
                >
                  {copiedLeft ? '✓ COPIED' : 'COPY'}
                </button>
              </div>
              <div className="settings-link-row">
                <div className="settings-link-info">
                  <span className="settings-link-who">{rightLabel || 'PENPAL'}</span>
                  <span className="settings-link-url">{rightShareUrl || `…/correspondence/${correspondenceSlug}?token=…`}</span>
                </div>
                <button
                  className={`settings-copy-btn${copiedRight ? ' is-copied' : ''}`}
                  type="button"
                  onClick={() => copyLink(rightShareUrl, 'right')}
                >
                  {copiedRight ? '✓ COPIED' : 'COPY'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Themes ── */}
          <div className="modal__section">
            <div className="modal__section-head">
              <span className="modal__section-label">THEMES</span>
              {!isCreator && <span className="modal__section-note">MANAGED BY CREATOR</span>}
            </div>

            {isCreator ? (
              <div className="settings-themes">
                <label className="settings-infinite-row">
                  <input
                    type="checkbox"
                    className="settings-infinite-check"
                    checked={isInfinite}
                    onChange={(e) => setIsInfinite(e.target.checked)}
                  />
                  <span>No limit</span>
                </label>

                {!isInfinite && (
                  <div className="form-group">
                    <div className="themes-slider-head">
                      <label className="form-label" htmlFor="settings-themes-slider">LIMIT</label>
                      <span className="themes-slider-value">{themesLabel}</span>
                    </div>
                    <input
                      className="form-slider"
                      id="settings-themes-slider"
                      type="range"
                      min={1} max={20} step={1}
                      value={maxThemes}
                      onChange={(e) => setMaxThemes(Number(e.target.value))}
                    />
                    <p className="themes-slider-hint">
                      Ends after {maxThemes} theme{maxThemes === 1 ? '' : 's'}
                    </p>
                  </div>
                )}

                {saveError && <p className="modal__message modal__message--error">{saveError}</p>}

                <div className="modal__actions">
                  <button
                    type="button"
                    className="btn btn--modal-confirm"
                    onClick={handleSaveThemes}
                    disabled={saving}
                  >
                    {saving ? 'SAVING…' : 'SAVE THEMES'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="settings-themes-readonly">
                {initialLimitThemes
                  ? `Limited to ${initialMaxThemes} theme${initialMaxThemes === 1 ? '' : 's'}`
                  : 'No limit'}
              </p>
            )}
          </div>

        </div>
      </div>
    </div>,
    document.body
  )
}
