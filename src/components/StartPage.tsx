'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'

type Phase = 'form' | 'loading' | 'share'

export default function StartPage() {
  const [phase,       setPhase]       = useState<Phase>('form')
  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [maxThemes,   setMaxThemes]   = useState(6)
  const [error,       setError]       = useState('')
  const [shareUrl,    setShareUrl]    = useState('')
  const [slug,        setSlug]        = useState('')
  const [copied,      setCopied]      = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSent,  setInviteSent]  = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  const isInfinite  = maxThemes === 11
  const themesLabel = isInfinite ? '∞' : String(maxThemes)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Please enter your name.'); return }

    setPhase('loading')
    try {
      const res = await fetch('/api/correspondences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yourFirstName: name.trim(),
          yourEmail:     email.trim().toLowerCase(),
          limitThemes:   !isInfinite,
          maxThemes:     isInfinite ? null : String(maxThemes),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setShareUrl(`${window.location.origin}/correspondence/${data.slug}`)
      setSlug(data.slug)
      setPhase('share')
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
      setPhase('form')
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function handleInvite() {
    if (!inviteEmail.trim()) return
    navigator.clipboard.writeText(shareUrl).catch(() => {})
    setInviteSent(true)
    setTimeout(() => { setInviteSent(false); setInviteEmail('') }, 2500)
  }

  const isShare = phase === 'share'

  return (
    <div className="start-page">

      {/* ── LEFT PANEL ── */}
      <div className="start-left">
        <div className={`start-left__content${isShare ? ' is-share' : ''}`}>

          {/* FORM STATE */}
          <div className="start-panel start-panel--form">
            <h1 className="start-heading">START A NEW<br />CONVERSATION</h1>
            <p className="start-sub">A visual dialogue between you and someone else.</p>
            <p className="start-sub">First we need to know a little bit about you:</p>

            <form className="start-form" onSubmit={handleSubmit} noValidate>
              <div className="start-field">
                <label className="start-label" htmlFor="s-name">Name*</label>
                <input ref={nameRef} className="start-input" id="s-name" type="text"
                  placeholder="Enter your name" required autoComplete="name"
                  value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="start-field">
                <label className="start-label" htmlFor="s-email">Email*</label>
                <input className="start-input" id="s-email" type="email"
                  placeholder="Enter your email" autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="start-themes-group">
                <div className="start-themes-head">
                  <span className="start-label">THEMES</span>
                  <span className="start-themes-value">{themesLabel}</span>
                </div>
                <input className="form-slider" type="range" min={1} max={11} step={1}
                  value={maxThemes}
                  onChange={(e) => setMaxThemes(Number(e.target.value))} />
                <p className="start-themes-hint">
                  {isInfinite
                    ? 'No limit — the correspondence goes on indefinitely'
                    : `Ends after ${maxThemes} theme${maxThemes === 1 ? '' : 's'}`}
                </p>
              </div>

              {error && <p className="start-error">{error}</p>}

              <button type="submit" className="start-submit" disabled={phase === 'loading'}>
                {phase === 'loading' ? 'CREATING…' : 'START'}
              </button>
            </form>

            <Link href="/" className="start-back">← BACK</Link>
          </div>

          {/* SHARE STATE */}
          <div className="start-panel start-panel--share">
            <h1 className="start-heading">YOUR CORRESPON-<br />DENCE IS READY</h1>
            <p className="start-sub">Share the link with your penpal to begin.</p>
            <Link href={`/correspondence/${slug}`} className="start-open-btn">
              OPEN CORRESPONDENCE →
            </Link>
            <Link href="/" className="start-back">← HOME</Link>
          </div>

        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="start-right">

        {/* Placeholder image */}
        <div className={`start-right__bg${isShare ? ' is-faded' : ''}`} />

        {/* Share panel */}
        <div className={`start-right__share${isShare ? ' is-visible' : ''}`}>
          <p className="share-back__title">YOUR LINK</p>
          <p className="start-right__url" aria-live="polite">{shareUrl}</p>

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
            <p className="share-back__invite-hint">
              Link copied — paste it into your message to {inviteEmail}.
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
