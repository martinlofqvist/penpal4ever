'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  correspondenceSlug: string
  yourName: string
  onComplete: (penpalFirstName: string) => void
}

interface FormState {
  firstName: string
  lastName:  string
  email:     string
}

const EMPTY: FormState = { firstName: '', lastName: '', email: '' }

export default function PenpalOnboardingModal({ correspondenceSlug, yourName, onComplete }: Props) {
  const [form,    setForm]    = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstInputRef.current?.focus()
  }, [])

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.firstName.trim()) {
      setError('Please enter your first name.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/correspondences/${correspondenceSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          penpalFirstName: form.firstName,
          penpalLastName:  form.lastName,
          penpalEmail:     form.email,
        }),
      })
      const data = await res.json()
      if (!res.ok && res.status !== 409) throw new Error(data.error || 'Failed to save details')
      onComplete(form.firstName.trim())
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div
      className="modal-overlay is-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="penpal-modal-title"
    >
      <div className="modal">
        <div className="modal__intro">
          <h2 className="modal__title" id="penpal-modal-title">
            YOU HAVE BEEN INVITED TO A CORRESPONDENCE
          </h2>
        </div>

        <form className="modal__body" onSubmit={handleSubmit} noValidate>
          <div className="modal__section">
            <div className="modal__section-head">
              <span className="modal__section-label">YOUR DETAILS</span>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="po-first">First name</label>
                <input ref={firstInputRef} className="form-input" id="po-first" type="text"
                  placeholder="Your name" autoComplete="given-name" required
                  value={form.firstName} onChange={set('firstName')} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="po-last">Last name <span className="form-optional">(optional)</span></label>
                <input className="form-input" id="po-last" type="text"
                  placeholder="Smith" autoComplete="family-name"
                  value={form.lastName} onChange={set('lastName')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="po-email">Email <span className="form-optional">(optional)</span></label>
              <input className="form-input" id="po-email" type="email"
                placeholder="you@example.com" autoComplete="email"
                value={form.email} onChange={set('email')} />
            </div>
          </div>

          <div className="modal__footer">
            {error && <p className="modal__message modal__message--error">{error}</p>}
            <div className="modal__actions">
              <button type="submit" className="btn btn--modal-confirm" disabled={loading}>
                {loading ? 'JOINING…' : 'JOIN CORRESPONDENCE →'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
