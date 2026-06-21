'use client'

import { useEffect, useRef } from 'react'

interface MagneticTrailsConfig {
  count?:           number
  baseSize?:        number
  flowAngle?:       number
  flowSpeed?:       number
  turbulence?:      number
  pulseAmount?:     number
  pulseSpeed?:      number
  phaseSpread?:     number
  mouseRadius?:     number
  mouseForce?:      number
  velocityReturn?:  number
  mouseMaxScale?:   number
  mouseEase?:       number
  backgroundColor?: string
  mediaFiles?:      string[]
  fallbackColor?:   string
  fallbackOpacity?: number
  borderRadius?:    number
}

interface Props {
  config?: MagneticTrailsConfig
  className?: string
}

declare global {
  interface Window {
    MagneticTrails: new (
      container: HTMLElement,
      config?: MagneticTrailsConfig
    ) => {
      updateConfig: (cfg: MagneticTrailsConfig) => void
      destroy: () => void
    }
  }
}

export default function MagneticTrails ({ config, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef  = useRef<InstanceType<Window['MagneticTrails']> | null>(null)
  const configRef    = useRef(config)
  useEffect(() => { configRef.current = config }, [config])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false

    function mount (fileConfig: MagneticTrailsConfig) {
      if (cancelled) return
      const merged = { ...fileConfig, ...configRef.current }
      configRef.current = merged

      function init () {
        if (!window.MagneticTrails || cancelled) return
        instanceRef.current = new window.MagneticTrails(container!, configRef.current)
      }

      if (window.MagneticTrails) {
        init()
      } else {
        const script    = document.createElement('script')
        script.src      = '/animation/magnetic-trails.js'
        script.onload   = init
        document.head.appendChild(script)
      }
    }

    fetch('/animation/magnetic-trails-config.json')
      .then(r => r.ok ? r.json() : {})
      .catch(() => ({}))
      .then(mount)

    return () => {
      cancelled = true
      instanceRef.current?.destroy()
      instanceRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (instanceRef.current && config) {
      instanceRef.current.updateConfig(config)
    }
  }, [config])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'absolute', inset: 0 }}
    />
  )
}
