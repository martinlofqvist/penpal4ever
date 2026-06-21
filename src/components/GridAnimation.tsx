'use client'

import { useEffect, useRef } from 'react'

interface GridAnimationConfig {
  gridSpacing?:     number
  noiseScale?:      number
  noiseThreshold?:  number
  noiseSeed?:       number
  baseSize?:        number
  borderRadius?:    number
  pulseAmount?:     number
  pulseSpeed?:      number
  phaseSpread?:     number
  mouseRadius?:     number
  mouseMaxScale?:   number
  mouseEase?:       number
  mediaFiles?:       string[]
  fallbackColor?:    string
  fallbackOpacity?:  number
  backgroundColor?:  string
}

interface Props {
  config?: GridAnimationConfig
  className?: string
}

declare global {
  interface Window {
    GridAnimation: new (
      container: HTMLElement,
      config?: GridAnimationConfig
    ) => {
      updateConfig: (cfg: GridAnimationConfig) => void
      destroy: () => void
    }
  }
}

export default function GridAnimation({ config, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef  = useRef<InstanceType<Window['GridAnimation']> | null>(null)
  // Always hold the latest config so async script onload sees current values
  const configRef    = useRef(config)
  useEffect(() => { configRef.current = config }, [config])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false

    function mount (fileConfig: GridAnimationConfig) {
      if (cancelled) return
      // Merge: file config as base, prop config overrides
      const merged = { ...fileConfig, ...configRef.current }
      configRef.current = merged

      function init () {
        if (!window.GridAnimation || cancelled) return
        instanceRef.current = new window.GridAnimation(container!, configRef.current)
      }

      if (window.GridAnimation) {
        init()
      } else {
        const script = document.createElement('script')
        script.src    = '/animation/grid-animation.js'
        script.onload = init
        document.head.appendChild(script)
      }
    }

    // Fetch saved config, fall back to empty object if missing
    fetch('/animation/config.json')
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

  // Hot-reload config changes without rebuilding the DOM
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
