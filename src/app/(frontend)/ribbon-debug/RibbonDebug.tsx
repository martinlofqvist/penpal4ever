'use client'

import { useCallback, useEffect, useState } from 'react'
import RibbonAnimation from '@/components/RibbonAnimation'

interface Config {
  columns:           number
  baseSize:          number
  imageMargin:       number
  columnGap:         number
  xOffset:           number
  scrollSpeed:       number
  sineAmplitude:     number
  sineSpeed:         number
  columnPhaseOffset: number
  itemPhaseOffset:   number
  flipSpeed:         number
  flipPhaseSpread:   number
  perspective:       number
  borderRadius:      number
  backgroundColor:   string
  mediaFiles:        string[]
  fallbackColor:     string
  fallbackOpacity:   number
}

const DEFAULT_CONFIG: Config = {
  columns:           2,
  baseSize:          90,
  imageMargin:       14,
  columnGap:         30,
  xOffset:           0,
  scrollSpeed:       55,
  sineAmplitude:     28,
  sineSpeed:         0.45,
  columnPhaseOffset: 2.094,
  itemPhaseOffset:   0.65,
  flipSpeed:         0.55,
  flipPhaseSpread:   6.28,
  perspective:       500,
  borderRadius:      4,
  backgroundColor:   '#111111',
  mediaFiles:        [],
  fallbackColor:     '#888888',
  fallbackOpacity:   0.55,
}

const LS_KEY = 'pp4_ribbon_config'

function loadConfig (): Config {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {}
  return { ...DEFAULT_CONFIG }
}

function Slider ({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'monospace' }}>
        <span>{label}</span><span style={{ color: '#aaa' }}>{value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#fff' }} />
    </label>
  )
}

function Section ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 9, color: '#444', letterSpacing: 1.5 }}>{label}</div>
      {children}
    </div>
  )
}

export default function RibbonDebug () {
  const [cfg, setCfg]          = useState<Config>(DEFAULT_CONFIG)
  const [mediaInput, setMedia] = useState('')
  const [panelOpen, setPanel]  = useState(true)
  const [saveStatus, setSave]  = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    const saved = loadConfig()
    if (saved.mediaFiles.length > 0) {
      setCfg(saved)
      setMedia(saved.mediaFiles.join('\n'))
    } else {
      fetch('/animation/config.json')
        .then(r => r.ok ? r.json() : {})
        .catch(() => ({}))
        .then((gridCfg: { mediaFiles?: string[] }) => {
          const files  = gridCfg.mediaFiles ?? []
          const merged = { ...saved, mediaFiles: files }
          setCfg(merged)
          setMedia(files.join('\n'))
        })
    }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)) } catch {}
  }, [cfg])

  const set = useCallback(<K extends keyof Config>(key: K, value: Config[K]) => {
    setCfg(prev => ({ ...prev, [key]: value }))
  }, [])

  function applyMedia () {
    const files = mediaInput.split('\n').map(s => s.trim()).filter(Boolean)
    set('mediaFiles', files)
  }

  async function saveToFile () {
    setSave('saving')
    try {
      const res  = await fetch('/api/ribbon-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      })
      const data = await res.json()
      setSave(data.ok ? 'saved' : 'error')
    } catch {
      setSave('error')
    }
    setTimeout(() => setSave('idle'), 2500)
  }

  function resetAll () {
    setCfg({ ...DEFAULT_CONFIG })
    setMedia('')
    try { localStorage.removeItem(LS_KEY) } catch {}
  }

  const panelW = 270

  return (
    <div style={{
      display: 'flex', width: '100vw', height: '100vh',
      background: cfg.backgroundColor, color: '#fff', fontFamily: 'monospace',
    }}>

      <div style={{ flex: 1, position: 'relative' }}>
        <RibbonAnimation config={cfg} />
        <div style={{
          position: 'absolute', top: 12, left: 12,
          fontSize: 10, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
        }}>
          /ribbon-debug
        </div>
      </div>

      <button onClick={() => setPanel(p => !p)} style={{
        position: 'fixed', top: 12, right: panelOpen ? panelW + 12 : 12,
        zIndex: 100, background: '#222', border: '1px solid #444',
        color: '#fff', padding: '4px 10px', cursor: 'pointer', fontSize: 11,
        borderRadius: 4, transition: 'right 0.2s',
      }}>
        {panelOpen ? '▶ hide' : '◀ show'}
      </button>

      {panelOpen && (
        <div style={{
          width: panelW, flexShrink: 0, background: '#111',
          borderLeft: '1px solid #2a2a2a', overflowY: 'auto',
          padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: 1 }}>RIBBON DEBUG</div>

          <Section label="LAYOUT">
            <Slider label="columns"     value={cfg.columns}     min={1}  max={8}   step={1}  onChange={v => set('columns', v)} />
            <Slider label="baseSize"    value={cfg.baseSize}    min={20} max={300} step={1}  onChange={v => set('baseSize', v)} />
            <Slider label="imageMargin" value={cfg.imageMargin} min={0}  max={100} step={1}  onChange={v => set('imageMargin', v)} />
            <Slider label="columnGap"   value={cfg.columnGap}   min={0}  max={200} step={1}  onChange={v => set('columnGap', v)} />
            <Slider label="borderRadius" value={cfg.borderRadius} min={0} max={150} step={1} onChange={v => set('borderRadius', v)} />
            <Slider label="xOffset"      value={cfg.xOffset}      min={-500} max={500} step={1} onChange={v => set('xOffset', v)} />
          </Section>

          <Section label="SCROLL">
            <Slider label="scrollSpeed" value={cfg.scrollSpeed} min={0} max={400} step={1} onChange={v => set('scrollSpeed', v)} />
          </Section>

          <Section label="SINE (X oscillation)">
            <Slider label="sineAmplitude"     value={cfg.sineAmplitude}     min={0}   max={200}  step={1}    onChange={v => set('sineAmplitude', v)} />
            <Slider label="sineSpeed"         value={cfg.sineSpeed}         min={0}   max={3}    step={0.01} onChange={v => set('sineSpeed', v)} />
            <Slider label="columnPhaseOffset" value={cfg.columnPhaseOffset} min={0}   max={6.28} step={0.01} onChange={v => set('columnPhaseOffset', v)} />
            <Slider label="itemPhaseOffset"   value={cfg.itemPhaseOffset}   min={0}   max={6.28} step={0.01} onChange={v => set('itemPhaseOffset', v)} />
          </Section>

          <Section label="CARD FLIP">
            <Slider label="flipSpeed"       value={cfg.flipSpeed}       min={0}   max={5}    step={0.01} onChange={v => set('flipSpeed', v)} />
            <Slider label="flipPhaseSpread" value={cfg.flipPhaseSpread} min={0}   max={6.28} step={0.01} onChange={v => set('flipPhaseSpread', v)} />
            <Slider label="perspective"     value={cfg.perspective}     min={100} max={2000} step={10}   onChange={v => set('perspective', v)} />
          </Section>

          <Section label="BACKGROUND">
            <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11 }}>backgroundColor</span>
              <input type="color" value={cfg.backgroundColor}
                onChange={e => set('backgroundColor', e.target.value)}
                style={{ width: '100%', height: 28, cursor: 'pointer', background: 'none', border: '1px solid #333', borderRadius: 4 }} />
            </label>
          </Section>

          <Section label="FALLBACK (no media)">
            <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11 }}>fallbackColor</span>
              <input type="color" value={cfg.fallbackColor}
                onChange={e => set('fallbackColor', e.target.value)}
                style={{ width: '100%', height: 28, cursor: 'pointer', background: 'none', border: '1px solid #333', borderRadius: 4 }} />
            </label>
            <Slider label="fallbackOpacity" value={cfg.fallbackOpacity} min={0} max={1} step={0.01} onChange={v => set('fallbackOpacity', v)} />
          </Section>

          <Section label="MEDIA FILES">
            <p style={{ fontSize: 10, color: '#555', lineHeight: 1.5 }}>
              One path per line.<br />
              e.g. <code style={{ color: '#888' }}>/animation/media/01.png</code>
            </p>
            <textarea value={mediaInput} onChange={e => setMedia(e.target.value)}
              placeholder={'/animation/media/01.png\n/animation/media/02.png'}
              rows={6}
              style={{
                width: '100%', background: '#1a1a1a', color: '#ccc', border: '1px solid #333',
                borderRadius: 4, padding: '6px 8px', fontSize: 11, fontFamily: 'monospace', resize: 'vertical',
              }} />
            <button onClick={applyMedia} style={{
              background: '#2a2a2a', border: '1px solid #444', color: '#fff',
              padding: '5px 10px', cursor: 'pointer', borderRadius: 4, fontSize: 11,
            }}>Apply media</button>
          </Section>

          <button onClick={saveToFile} disabled={saveStatus === 'saving'} style={{
            background: saveStatus === 'saved' ? '#003300' : saveStatus === 'error' ? '#1a0000' : '#1a2a1a',
            border: `1px solid ${saveStatus === 'saved' ? '#006600' : saveStatus === 'error' ? '#440000' : '#2a4a2a'}`,
            color: saveStatus === 'error' ? '#f66' : '#6f6',
            padding: '6px 10px', cursor: 'pointer', borderRadius: 4, fontSize: 11, fontWeight: 'bold',
          }}>
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved to ribbon-config.json' : saveStatus === 'error' ? '✗ Failed' : 'Save to ribbon-config.json'}
          </button>

          <button onClick={resetAll} style={{
            background: '#1a0000', border: '1px solid #440000',
            color: '#f66', padding: '5px 10px', cursor: 'pointer', borderRadius: 4, fontSize: 11,
          }}>Reset all to defaults</button>

          <div style={{ fontSize: 10, color: '#333', lineHeight: 1.6 }}>
            Settings auto-save to localStorage.<br />
            Use Save to persist to file.
          </div>
        </div>
      )}
    </div>
  )
}
