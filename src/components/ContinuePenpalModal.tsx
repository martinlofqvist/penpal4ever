'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'

const LS_KEY = 'penpal4ever_conversations'

interface SavedConversation {
  slug: string
  token: string
  yourName: string
  penpalName: string
  visitedAt: string
}

export default function ContinuePenpalModal() {
  const router = useRouter()
  const [isOpen, setIsOpen]   = useState(false)
  const [saved,  setSaved]    = useState<SavedConversation[]>([])
  const [query,  setQuery]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,  setError]    = useState('')
  const [showInput, setShowInput] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      try {
        const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as SavedConversation[]
        setSaved(stored)
        // If nothing saved, jump straight to the manual input
        setShowInput(stored.length === 0)
      } catch {
        setSaved([])
        setShowInput(true)
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (showInput) inputRef.current?.focus()
  }, [showInput])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function openModal(e: React.MouseEvent) {
    e.preventDefault()
    setIsOpen(true)
  }

  function closeModal() {
    setIsOpen(false)
    setQuery('')
    setError('')
    setShowInput(false)
  }

  function openSaved(c: SavedConversation) {
    router.push(`/correspondence/${c.slug}?token=${c.token}`)
    closeModal()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = query.trim()
    if (!val) return
    setError('')
    setLoading(true)

    try {
      if (val.includes('@')) {
        // Email → show all their conversations
        router.push(`/conversations?email=${encodeURIComponent(val)}`)
        closeModal()
        return
      }

      // Slug — verify it exists first
      const res  = await fetch(`/api/correspondences?slug=${encodeURIComponent(val)}`)
      const data = await res.json()

      if (!res.ok || data.error) {
        setError('No conversation found. Check your email or conversation ID.')
        setLoading(false)
        return
      }

      router.push(`/correspondence/${data.slug}`)
      closeModal()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const hasSaved = saved.length > 0

  return (
    <>
      <a href="#" className="btn btn--secondary" onClick={openModal}>
        CONTINUE PENPAL
      </a>

      {typeof document !== 'undefined' && createPortal(
        <div
          className={`modal-overlay${isOpen ? ' is-open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="continue-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="modal">
            <button className="modal__close" onClick={closeModal} aria-label="Close">✕</button>

            <div className="modal__intro">
              <h2 className="modal__title" id="continue-modal-title">CONTINUE PENPAL</h2>
            </div>

            <div className="modal__body">

              {/* ── Saved conversations from this browser ── */}
              {hasSaved && (
                <div className="modal__section">
                  <p className="modal__section-label" style={{ color: '#777', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                    FROM THIS DEVICE
                  </p>
                  <ul className="continue-saved-list">
                    {saved.map((c) => (
                      <li key={c.slug}>
                        <button
                          className="continue-saved-row"
                          onClick={() => openSaved(c)}
                        >
                          <div className="continue-saved-avatars">
                            <div className="continue-avatar continue-avatar--you">
                              {c.yourName?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="continue-avatar continue-avatar--penpal">
                              {c.penpalName?.charAt(0).toUpperCase() || '?'}
                            </div>
                          </div>
                          <span className="continue-saved-name">
                            {c.yourName && c.penpalName
                              ? `${c.yourName.toUpperCase()} & ${c.penpalName.toUpperCase()}`
                              : c.yourName?.toUpperCase() || c.slug}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Toggle to show manual input ── */}
              {hasSaved && !showInput && (
                <button
                  className="continue-find-link"
                  onClick={() => setShowInput(true)}
                >
                  Find by email or conversation ID →
                </button>
              )}

              {/* ── Manual email / slug input ── */}
              {(!hasSaved || showInput) && (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="modal__section">
                    <p className="modal__section-label" style={{ color: '#777', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                      {hasSaved ? 'OR FIND BY EMAIL / ID' : 'FIND YOUR CONVERSATION'}
                    </p>
                    <div className="form-group">
                      <input
                        ref={inputRef}
                        className="form-input"
                        type="text"
                        placeholder="you@example.com or conversation ID"
                        autoComplete="email"
                        required
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="modal__footer">
                    {error && <p className="modal__message modal__message--error">{error}</p>}
                    <div className="modal__actions">
                      <button type="button" className="btn btn--modal-cancel" onClick={closeModal}>
                        CANCEL
                      </button>
                      <button type="submit" className="btn btn--modal-confirm" disabled={loading}>
                        {loading ? 'LOOKING UP…' : 'CONTINUE →'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ── Cancel when showing saved list without input ── */}
              {hasSaved && !showInput && (
                <div className="modal__footer">
                  <div className="modal__actions">
                    <button type="button" className="btn btn--modal-cancel" onClick={closeModal}>
                      CANCEL
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
