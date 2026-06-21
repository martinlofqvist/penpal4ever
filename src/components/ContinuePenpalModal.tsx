'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'

export default function ContinuePenpalModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = query.trim()
    if (!val) return
    setError('')
    setLoading(true)

    try {
      router.push(`/conversations?email=${encodeURIComponent(val)}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

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

          <div className="modal__icon-area">
            <div className="modal__icon-badge">↩</div>
          </div>

          <div className="modal__intro">
            <h2 className="modal__title" id="continue-modal-title">CONTINUE PENPAL</h2>
            <p className="modal__subtitle">Enter the email you used to start your conversation</p>
          </div>

          <form className="modal__body" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="inp-continue-query">Your email</label>
              <input
                ref={inputRef}
                className="form-input"
                id="inp-continue-query"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
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
        </div>
      </div>
      , document.body)}
    </>
  )
}
