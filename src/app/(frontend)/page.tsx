import type { Metadata } from 'next'
import Link from 'next/link'
import HomeAnimation from '@/components/HomeAnimation'
import NewPenpalModal from '@/components/NewPenpalModal'

export const metadata: Metadata = {
  title: 'PenPal4ever',
  description: 'A place for creatives to correspond visually by interpreting a shared theme.',
}

export default function HomePage() {
  return (
    <div className="home">

      {/* Animation area */}
      <div className="anim-area">
        <HomeAnimation />
        <div className="home-buttons">
          <NewPenpalModal />
          <Link href="/theme" className="btn btn--secondary">CONTINUE PENPAL</Link>
        </div>
      </div>

      {/* Headline */}
      <div className="home-headline">
        <p className="home-eyebrow">YOU ARE MY</p>
        <h1 className="home-title">PENPAL4EVER</h1>
      </div>

      {/* Copy */}
      <main className="home-copy">
        <p><a href="#">A place for creatives to correspond.</a></p>
        <p><a href="#">One theme, two interpretations, an ongoing exchange.</a></p>
        <p><a href="#">Invite your penpal and start your correspondance today.</a></p>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <Link href="/about">ABOUT</Link>
      </footer>

    </div>
  )
}
