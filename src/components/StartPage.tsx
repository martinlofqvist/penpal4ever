'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import GridAnimation from '@/components/GridAnimation'

function CopyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

type Phase = 'form' | 'loading' | 'share'

export default function StartPage() {
  const [phase,       setPhase]       = useState<Phase>('form')
  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [maxThemes,   setMaxThemes]   = useState(6)
  const [error,       setError]       = useState('')
  const [shareUrl,    setShareUrl]    = useState('')
  const [slug,        setSlug]        = useState('')
  const [leftToken,   setLeftToken]   = useState('')
  const [ownUrl,      setOwnUrl]      = useState('')
  const [copied,      setCopied]      = useState(false)
  const [copiedOwn,   setCopiedOwn]   = useState(false)
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
      setShareUrl(`${window.location.origin}/correspondence/${data.slug}?token=${data.rightToken}`)
      setOwnUrl(`${window.location.origin}/correspondence/${data.slug}?token=${data.leftToken}`)
      setSlug(data.slug)
      setLeftToken(data.leftToken)
      // Redirect the creator to their token URL so they're recognised as left side
      window.history.replaceState(null, '', `/correspondence/${data.slug}?token=${data.leftToken}`)
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

  async function copyOwnLink() {
    await navigator.clipboard.writeText(ownUrl).catch(() => {})
    setCopiedOwn(true)
    setTimeout(() => setCopiedOwn(false), 2500)
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

          </div>

          {/* SHARE STATE */}
          <div className="start-panel start-panel--share">
            <h1 className="start-heading share-heading">
              {name.trim().toUpperCase()}, YOUR CONVERSATION IS READY TO BE SHARED
            </h1>

            <div className="share-links">
              {/* Own link */}
              <div className="share-link-block">
                <p className="share-link-label">YOUR CONVERSATION LINK</p>
                <div className="share-link-row">
                  <div className="share-link-input">
                    <span className="share-link-url">{ownUrl}</span>
                  </div>
                  <button
                    className={`share-link-copy${copiedOwn ? ' is-copied' : ''}`}
                    onClick={copyOwnLink}
                    type="button"
                    title="Copy your link"
                  >
                    {copiedOwn ? <CheckIcon /> : <CopyIcon />}
                  </button>
                </div>
                <p className="share-link-hint">
                  This is <strong>your</strong> link, it takes you right back to your side of the conversation.
                </p>
              </div>

              {/* Penpal link */}
              <div className="share-link-block">
                <p className="share-link-label">YOUR PENPAL'S LINK – SHARE THIS</p>
                <div className="share-link-row">
                  <div className="share-link-input">
                    <span className="share-link-url">{shareUrl}</span>
                  </div>
                  <button
                    className={`share-link-copy${copied ? ' is-copied' : ''}`}
                    onClick={copyLink}
                    type="button"
                    title="Copy penpal link"
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                  </button>
                </div>
                <p className="share-link-hint">
                  This link is for your penpal. Anyone with it can join as your pen pal — no account needed. Once they open it, your correspondence begins.
                </p>
              </div>
            </div>

            <Link href={`/correspondence/${slug}?token=${leftToken}`} className="share-start-btn">
              START CONVERSATION
            </Link>
          </div>

        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className={`start-right${isShare ? ' is-faded' : ''}`}>
        <GridAnimation className="start-right__animation" />
      </div>
    </div>
  )
}
