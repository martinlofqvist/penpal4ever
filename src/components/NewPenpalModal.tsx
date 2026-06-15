'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewPenpalModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [yourName, setYourName] = useState('')
  const [penpalName, setPenpalName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  // Escape key closes modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function openModal(e: React.MouseEvent) {
    e.preventDefault()
    setIsOpen(true)
  }

  function closeModal() {
    setIsOpen(false)
    setYourName('')
    setPenpalName('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!yourName.trim() || !penpalName.trim()) return
    sessionStorage.setItem('pp_your_name', yourName.trim())
    sessionStorage.setItem('pp_penpal_name', penpalName.trim())
    router.push('/theme')
  }

  return (
    <>
      <a href="/theme" className="btn btn--primary" onClick={openModal}>
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
          <h2 className="modal__title" id="modal-title">NEW PENPAL</h2>
          <p className="modal__subtitle">START A VISUAL CORRESPONDENCE</p>
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal__field">
              <label className="modal__label" htmlFor="input-your-name">Your name</label>
              <input
                ref={inputRef}
                className="modal__input"
                id="input-your-name"
                type="text"
                placeholder="Martin"
                autoComplete="off"
                required
                value={yourName}
                onChange={(e) => setYourName(e.target.value)}
              />
            </div>
            <div className="modal__field">
              <label className="modal__label" htmlFor="input-penpal-name">Your penpal&rsquo;s name</label>
              <input
                className="modal__input"
                id="input-penpal-name"
                type="text"
                placeholder="Daniel"
                autoComplete="off"
                required
                value={penpalName}
                onChange={(e) => setPenpalName(e.target.value)}
              />
            </div>
            <button className="modal__submit" type="submit">START CORRESPONDENCE →</button>
          </form>
        </div>
      </div>
    </>
  )
}
