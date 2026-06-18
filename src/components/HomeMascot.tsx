'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function HomeMascot() {
  const [style, setStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    // Tiny random offsets — regenerated on every mount (page refresh)
    const dx = (Math.random() - 0.5) * 2.4  // ±1.2vw
    const dy = (Math.random() - 0.5) * 2.4  // ±1.2vh
    const scale = 1 + (Math.random() - 0.5) * 0.08  // 0.96–1.04

    setStyle({
      transform: `translateX(calc(-50% + ${dx}vw)) translateY(${dy}vh) scale(${scale})`,
    })
  }, [])

  return (
    <div
      className="home-mascot"
      style={style}
      aria-hidden="true"
    >
      <Image
        src="/pp-sign-illu.png"
        alt=""
        width={320}
        height={320}
        priority
        style={{ width: '19.8vw', height: 'auto', maxWidth: '286px', minWidth: '132px' }}
      />
    </div>
  )
}
