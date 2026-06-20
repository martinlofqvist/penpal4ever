import type { Metadata } from 'next'
import Link from 'next/link'
import RibbonAnimation from '@/components/RibbonAnimation'
import ContinuePenpalModal from '@/components/ContinuePenpalModal'

export const metadata: Metadata = {
  title: 'PenPal4ever',
  description: 'A place for creatives to correspond visually by interpreting a shared theme.',
}

export default function HomePage() {
  return (
    <div className="home">

      {/* Animation area */}
      <div className="anim-area">
        <RibbonAnimation />
        <div className="home-buttons">
          <Link href="/start" className="btn btn--primary">NEW PENPAL</Link>
          <ContinuePenpalModal />
        </div>
      </div>

      {/* Headline */}
      <div className="home-headline">
        <p className="home-eyebrow">YOU ARE MY</p>
        <h1 className="home-title">PENPAL4EVER</h1>
      </div>

      {/* Copy */}
      <main className="home-copy">
        <p>A visual conversation between two friends, built around a shared theme.</p>
        <p>A new theme arrives when both of you have responded to the last one. You respond with an image. So do they. No explanations, no scores, no feed to scroll past it.</p>
        <p>Just a structure for staying creative with someone you care about, one image at a time.</p>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <Link href="/about">ABOUT</Link>
      </footer>

    </div>
  )
}
