import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — PenPal4ever',
}

export default function AboutPage() {
  return (
    <div className="about-page">
      <h1 className="about-heading">ABOUT</h1>
      <div className="about-body">
        <p>You and a friend each get the same theme. You respond with an image. So do they. No words, no scores, no explanations — just two interpretations of the same idea.</p>
        <p>When both of you have responded, a new theme unlocks. You can set a limit before you start, or let the correspondence run indefinitely.</p>
        <p>To begin, one person creates the correspondence and shares the link. Both of you keep it — that link is how you come back.</p>
      </div>
      <Link className="about-back" href="/">← BACK</Link>
    </div>
  )
}
