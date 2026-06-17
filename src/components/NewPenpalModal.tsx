'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'

interface FormState {
  yourFirstName: string
  yourLastName: string
  yourEmail: string
  penpalFirstName: string
  penpalLastName: string
  penpalEmail: string
  maxThemes: number
}

const EMPTY: FormState = {
  yourFirstName: '', yourLastName: '', yourEmail: '',
  penpalFirstName: '', penpalLastName: '', penpalEmail: '',
  maxThemes: 6,
}

export default function NewPenpalModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) firstInputRef.current?.focus()
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
    setForm(EMPTY)
    setError('')
  }

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const { yourFirstName, maxThemes } = form

    if (!yourFirstName) {
      setError('Please enter your first name.')
      return
    }

    const isInfinite = maxThemes === 11

    setLoading(true)
    try {
      const res = await fetch('/api/correspondences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yourFirstName: form.yourFirstName,
          yourLastName: form.yourLastName,
          yourEmail: form.yourEmail,
          penpalFirstName: form.penpalFirstName,
          penpalLastName: form.penpalLastName,
          penpalEmail: form.penpalEmail,
          limitThemes: !isInfinite,
          maxThemes: isInfinite ? null : String(maxThemes),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create correspondence')
      router.push(`/correspondence/${data.slug}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
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
        <div className="modal">
          <button className="modal__close" onClick={closeModal} aria-label="Close">✕</button>

          <div className="modal__intro">
            <h2 className="modal__title" id="modal-title">START A VISUAL CORRESPONDENCE</h2>
          </div>

          <form className="modal__body" onSubmit={handleSubmit} noValidate>

            {/* Section 1 — You */}
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

            {/* Section 2 — Penpal */}
            <div className="modal__section">
              <div className="modal__section-head">
                <span className="modal__section-label">YOUR PENPAL</span>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="inp-pal-first">First name</label>
                  <input className="form-input" id="inp-pal-first" type="text"
                    placeholder="Daniel" autoComplete="off"
                    value={form.penpalFirstName} onChange={set('penpalFirstName')} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inp-pal-last">Last name <span className="form-optional">(optional)</span></label>
                  <input className="form-input" id="inp-pal-last" type="text"
                    placeholder="Smith" autoComplete="off"
                    value={form.penpalLastName} onChange={set('penpalLastName')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="inp-pal-email">Email <span className="form-optional">(optional)</span></label>
                <input className="form-input" id="inp-pal-email" type="email"
                  placeholder="penpal@example.com" autoComplete="off"
                  value={form.penpalEmail} onChange={set('penpalEmail')} />
              </div>
            </div>

            {/* Themes slider */}
            <div className="form-group themes-slider-group">
              <div className="themes-slider-head">
                <label className="form-label" htmlFor="inp-themes-slider">THEMES</label>
                <span className="themes-slider-value">{themesLabel}</span>
              </div>
              <input
                className="form-slider"
                id="inp-themes-slider"
                type="range"
                min={1}
                max={11}
                step={1}
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
      </div>
      , document.body)}
    </>
  )
}
