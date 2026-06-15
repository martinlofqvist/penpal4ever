'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface FormState {
  yourFirstName: string
  yourLastName: string
  yourEmail: string
  penpalFirstName: string
  penpalLastName: string
  penpalEmail: string
  limitThemes: boolean
  maxThemes: string
}

const EMPTY: FormState = {
  yourFirstName: '', yourLastName: '', yourEmail: '',
  penpalFirstName: '', penpalLastName: '', penpalEmail: '',
  limitThemes: false, maxThemes: '10',
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
      setForm(prev => ({
        ...prev,
        [field]: field === 'limitThemes' ? (e.target as HTMLInputElement).checked : e.target.value,
      }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const { yourFirstName, yourLastName, yourEmail,
            penpalFirstName, penpalLastName, penpalEmail,
            limitThemes, maxThemes } = form

    if (!yourFirstName || !yourLastName || !yourEmail ||
        !penpalFirstName || !penpalLastName || !penpalEmail) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/correspondences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yourFirstName, yourLastName, yourEmail,
          penpalFirstName, penpalLastName, penpalEmail,
          limitThemes, maxThemes: limitThemes ? maxThemes : null,
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

  return (
    <>
      <a href="#" className="btn btn--primary" onClick={openModal}>
        NEW PENPAL
      </a>

      <div
        className={`modal-overlay${isOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
      >
        <div className="modal">
          <button className="modal__close" onClick={closeModal} aria-label="Close">✕</button>

          {/* Icon badge */}
          <div className="modal__icon-area">
            <div className="modal__icon-badge">✉</div>
          </div>

          <div className="modal__intro">
            <h2 className="modal__title" id="modal-title">NEW PENPAL</h2>
            <p className="modal__subtitle">Start a visual correspondence</p>
          </div>

          <form className="modal__body" onSubmit={handleSubmit} noValidate>

            {/* Section 1 — You */}
            <div className="modal__section">
              <div className="modal__section-head">
                <span className="modal__step-badge">01</span>
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
                  <label className="form-label" htmlFor="inp-your-last">Last name</label>
                  <input className="form-input" id="inp-your-last" type="text"
                    placeholder="Löfqvist" autoComplete="family-name" required
                    value={form.yourLastName} onChange={set('yourLastName')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="inp-your-email">Email</label>
                <input className="form-input" id="inp-your-email" type="email"
                  placeholder="you@example.com" autoComplete="email" required
                  value={form.yourEmail} onChange={set('yourEmail')} />
              </div>
            </div>

            <hr className="modal__rule" />

            {/* Section 2 — Penpal */}
            <div className="modal__section">
              <div className="modal__section-head">
                <span className="modal__step-badge">02</span>
                <span className="modal__section-label">YOUR PENPAL</span>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="inp-pal-first">First name</label>
                  <input className="form-input" id="inp-pal-first" type="text"
                    placeholder="Daniel" autoComplete="off" required
                    value={form.penpalFirstName} onChange={set('penpalFirstName')} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="inp-pal-last">Last name</label>
                  <input className="form-input" id="inp-pal-last" type="text"
                    placeholder="Smith" autoComplete="off" required
                    value={form.penpalLastName} onChange={set('penpalLastName')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="inp-pal-email">Email</label>
                <input className="form-input" id="inp-pal-email" type="email"
                  placeholder="penpal@example.com" autoComplete="off" required
                  value={form.penpalEmail} onChange={set('penpalEmail')} />
              </div>
            </div>

            {/* Limit themes checkbox */}
            <label className="form-check">
              <input type="checkbox" checked={form.limitThemes} onChange={set('limitThemes')} />
              <span className="form-check-label">Limit this correspondence to a set number of themes</span>
            </label>

            {form.limitThemes && (
              <div className="form-conditional">
                <div className="form-group">
                  <label className="form-label" htmlFor="inp-max-themes">Max themes</label>
                  <input className="form-input" id="inp-max-themes" type="number"
                    min="1" max="99" placeholder="10"
                    value={form.maxThemes} onChange={set('maxThemes')} />
                </div>
              </div>
            )}

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
    </>
  )
}
