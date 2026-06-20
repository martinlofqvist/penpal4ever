'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface FormState {
  yourFirstName: string
  yourLastName:  string
  yourEmail:     string
  maxThemes:     number
}

const EMPTY: FormState = {
  yourFirstName: '',
  yourLastName:  '',
  yourEmail:     '',
  maxThemes:     6,
}

export default function NewPenpalModal() {
  const [isOpen,   setIsOpen]   = useState(false)
  const [flipped,  setFlipped]  = useState(false)
  const [form,     setForm]     = useState<FormState>(EMPTY)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [shareUrl,   setShareUrl]   = useState('')
  const [leftToken,  setLeftToken]  = useState('')
  const [copied,   setCopied]   = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSent,  setInviteSent]  = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && !flipped) firstInputRef.current?.focus()
  }, [isOpen, flipped])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function openModal(e: React.MouseEvent) {
    e.preventDefault()
    setIsOpen(true)
    setFlipped(false)
  }

  function closeModal() {
    setIsOpen(false)
    setFlipped(false)
    setForm(EMPTY)
    setError('')
    setShareUrl('')
    setCopied(false)
    setInviteEmail('')
    setInviteSent(false)
  }

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.yourFirstName.trim()) {
      setError('Please enter your first name.')
      return
    }

    const isInfinite = form.maxThemes === 11

    setLoading(true)
    try {
      const res = await fetch('/api/correspondences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yourFirstName: form.yourFirstName,
          yourLastName:  form.yourLastName,
          yourEmail:     form.yourEmail,
          limitThemes:   !isInfinite,
          maxThemes:     isInfinite ? null : String(form.maxThemes),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create correspondence')

      // Share URL uses rightToken so the penpal lands on the right side
      setShareUrl(`${window.location.origin}/correspondence/${data.slug}?token=${data.rightToken}`)
      setLeftToken(data.leftToken)
      setFlipped(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback
    }
  }

  function handleInvite() {
    if (!inviteEmail.trim()) return
    // Copy link on behalf of invite (no email infra yet)
    navigator.clipboard.writeText(shareUrl).catch(() => {})
    setInviteSent(true)
    setTimeout(() => {
      setInviteSent(false)
      setInviteEmail('')
    }, 2500)
  }

  const themesLabel = form.maxThemes === 11 ? '∞' : String(form.maxThemes)

  return (
    <>
      <a href="#" className="btn btn--primary" onClick={openModal}>
        START
      </a>

      {typeof document !== 'undefined' && createPortal(
        <div
          className={`modal-overlay${isOpen ? ' is-open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="modal-flip">
            <div className={`modal-flip__inner${flipped ? ' is-flipped' : ''}`}>

              {/* ── FRONT FACE ── */}
              <div className="modal-flip__face modal-flip__face--front">
                <button className="modal__close" onClick={closeModal} aria-label="Close">✕</button>

                <div className="modal__intro">
                  <h2 className="modal__title" id="modal-title">START A VISUAL CORRESPONDENCE</h2>
                </div>

                <form className="modal__body" onSubmit={handleSubmit} noValidate>

                  {/* YOUR DETAILS */}
                  <div className="modal__section">
                    <div className="modal__section-head">
                      <span className="modal__section-label">YOUR DETAILS</span>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="inp-your-first">First name</label>
                        <input ref={firstInputRef} className="form-input" id="inp-your-first" type="text"
                          placeholder="Martin" autoComplete="given-name" required
                          value={form.yourFirstName} onChange={set('yourFirstName')} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="inp-your-last">Last name <span className="form-optional">(optional)</span></label>
                        <input className="form-input" id="inp-your-last" type="text"
                          placeholder="Löfqvist" autoComplete="family-name"
                          value={form.yourLastName} onChange={set('yourLastName')} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="inp-your-email">Email <span className="form-optional">(optional)</span></label>
                      <input className="form-input" id="inp-your-email" type="email"
                        placeholder="you@example.com" autoComplete="email"
                        value={form.yourEmail} onChange={set('yourEmail')} />
                    </div>
                  </div>

                  {/* THEMES slider */}
                  <div className="form-group themes-slider-group">
                    <div className="themes-slider-head">
                      <label className="form-label" htmlFor="inp-themes-slider">THEMES</label>
                      <span className="themes-slider-value">{themesLabel}</span>
                    </div>
                    <input
                      className="form-slider"
                      id="inp-themes-slider"
                      type="range"
                      min={1} max={11} step={1}
                      value={form.maxThemes}
                      onChange={(e) => setForm(prev => ({ ...prev, maxThemes: Number(e.target.value) }))}
                    />
                    <p className="themes-slider-hint">
                      {form.maxThemes === 11
                        ? 'No limit — the correspondence goes on indefinitely'
                        : `Ends after ${form.maxThemes} theme${form.maxThemes === 1 ? '' : 's'}`}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="modal__footer">
                    {error && <p className="modal__message modal__message--error">{error}</p>}
                    <div className="modal__actions">
                      <button type="button" className="btn btn--modal-cancel" onClick={closeModal}>
                        CANCEL
                      </button>
                      <button type="submit" className="btn btn--modal-confirm" disabled={loading}>
                        {loading ? 'CREATING…' : 'START CORRESPONDENCE →'}
                      </button>
                    </div>
                  </div>

                </form>
              </div>

              {/* ── BACK FACE (share) ── */}
              <div className="modal-flip__face modal-flip__face--back" aria-hidden={!flipped}>
                <button className="modal__close" onClick={closeModal} aria-label="Close" style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}>✕</button>

                <p className="share-back__title">CORRESPONDENCE CREATED</p>

                <p className="share-back__url">{shareUrl}</p>

                <button
                  className={`share-back__copy-btn${copied ? ' is-copied' : ''}`}
                  onClick={copyLink}
                  type="button"
                >
                  {copied ? '✓ COPIED' : 'COPY LINK'}
                </button>

                <div className="share-back__divider" />

                <p className="share-back__invite-label">INVITE YOUR PENPAL</p>
                <div className="share-back__invite-row">
                  <input
                    className="share-back__invite-input"
                    type="email"
                    placeholder="penpal@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleInvite() }}
                  />
                  <button
                    className={`share-back__invite-btn${inviteSent ? ' is-sent' : ''}`}
                    type="button"
                    onClick={handleInvite}
                    disabled={!inviteEmail.trim() || inviteSent}
                  >
                    {inviteSent ? '✓ SENT' : 'INVITE'}
                  </button>
                </div>
                {inviteSent && (
                  <p className="share-back__invite-hint">Link copied — paste it into your message to {inviteEmail}.</p>
                )}

                <button
                  className="share-back__done-btn"
                  type="button"
                  onClick={() => {
                    closeModal()
                    // Navigate creator to their token URL
                    if (leftToken && shareUrl) {
                      const penpalUrl = new URL(shareUrl)
                      const slug = penpalUrl.pathname.split('/').pop()
                      window.location.href = `/correspondence/${slug}?token=${leftToken}`
                    }
                  }}
                >
                  DONE
                </button>
              </div>

            </div>
          </div>
        </div>
      , document.body)}
    </>
  )
}
