'use client'

import { useEffect, useRef } from 'react'

export default function HomeAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      if (!canvas || !ctx) return
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      draw()
    }

    function draw() {
      if (!canvas || !ctx) return
      // Placeholder: solid grey — replace with animation logic
      ctx.fillStyle = '#c8c8c8'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    window.addEventListener('resize', resize)
    resize()

    return () => window.removeEventListener('resize', resize)
  }, [])

  return <canvas ref={canvasRef} id="animation-canvas" />
}
