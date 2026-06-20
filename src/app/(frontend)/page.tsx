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
        <p>A visual conversation between two friends. Built around a shared theme — nothing more, nothing less.</p>
        <p>When you&apos;ve both replied, a new one arrives. You respond with an image. So do they. There are no explanations required, no scores to compare. No feed pulling you somewhere else.</p>
        <p>Only a small, considered reason to remain creative with someone whose taste you trust.</p>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <Link href="/about">ABOUT</Link>
      </footer>

    </div>
  )
}
