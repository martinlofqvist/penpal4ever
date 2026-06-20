'use client'

import { useEffect, useRef } from 'react'

interface RibbonConfig {
  columns?:           number
  baseSize?:          number
  imageMargin?:       number
  columnGap?:         number
  xOffset?:           number
  scrollSpeed?:       number
  sineAmplitude?:     number
  sineSpeed?:         number
  columnPhaseOffset?: number
  itemPhaseOffset?:   number
  flipSpeed?:         number
  flipPhaseSpread?:   number
  perspective?:       number
  borderRadius?:      number
  backgroundColor?:   string
  mediaFiles?:        string[]
  fallbackColor?:     string
  fallbackOpacity?:   number
}

interface Props {
  config?: RibbonConfig
  className?: string
}

declare global {
  interface Window {
    RibbonAnimation: new (
      container: HTMLElement,
      config?: RibbonConfig
    ) => {
      updateConfig: (cfg: RibbonConfig) => void
      destroy: () => void
    }
  }
}

export default function RibbonAnimation ({ config, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef  = useRef<ReturnType<Window['RibbonAnimation']> | null>(null)
  const configRef    = useRef(config)
  useEffect(() => { configRef.current = config }, [config])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false

    function mount (fileConfig: RibbonConfig) {
      if (cancelled) return
      const merged = { ...fileConfig, ...configRef.current }
      configRef.current = merged

      function init () {
        if (!window.RibbonAnimation || cancelled) return
        instanceRef.current = new window.RibbonAnimation(container!, configRef.current)
      }

      if (window.RibbonAnimation) {
        init()
      } else {
        const script    = document.createElement('script')
        script.src      = '/animation/ribbon.js'
        script.onload   = init
        document.head.appendChild(script)
      }
    }

    fetch('/animation/ribbon-config.json')
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
