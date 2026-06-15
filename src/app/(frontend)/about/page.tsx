import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — PenPal4ever',
}

export default function AboutPage() {
  return (
    <div className="about-page">
      <h1 className="about-heading">ABOUT</h1>
      <p className="about-body">
        PENPAL4EVER IS A VISUAL
        CORRESPONDENCE BETWEEN
        TWO CREATIVES. ONE THEME.
        TWO INTERPRETATIONS.
      </p>
      <Link className="about-back" href="/">← BACK</Link>
    </div>
  )
}
