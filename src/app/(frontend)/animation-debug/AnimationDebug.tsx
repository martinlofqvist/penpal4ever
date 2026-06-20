'use client'

import { useCallback, useEffect, useState } from 'react'
import GridAnimation from '@/components/GridAnimation'

// ─── Config shape ──────────────────────────────────────────────────────────────

interface Config {
  gridSpacing:     number
  noiseScale:      number
  noiseThreshold:  number
  noiseSeed:       number
  baseSize:        number
  borderRadius:    number
  pulseAmount:     number
  pulseSpeed:      number
  phaseSpread:     number
  mouseRadius:     number
  mouseMaxScale:   number
  mouseEase:       number
  mediaFiles:      string[]
  fallbackColor:   string
  fallbackOpacity: number
  backgroundColor: string
}

const DEFAULT_CONFIG: Config = {
  gridSpacing:     55,
  noiseScale:      0.10,
  noiseThreshold:  0.42,
  noiseSeed:       17,
  baseSize:        30,
  borderRadius:    3,
  pulseAmount:     0.50,
  pulseSpeed:      1.4,
  phaseSpread:     10.0,
  mouseRadius:     200,
  mouseMaxScale:   5.0,
  mouseEase:       8.0,
  mediaFiles:      [],
  fallbackColor:   '#888888',
  fallbackOpacity: 0.55,
  backgroundColor: '#111111',
}

const LS_KEY = 'pp4_anim_debug_config'

function loadConfig (): Config {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {}
  return { ...DEFAULT_CONFIG }
}

// ─── Slider row ────────────────────────────────────────────────────────────────

function Slider ({
  label, value, min, max, step, onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'monospace' }}>
        <span>{label}</span>
        <span style={{ color: '#aaa' }}>{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#fff' }}
      />
    </label>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function AnimationDebug () {
  const [cfg, setCfg]           = useState<Config>(DEFAULT_CONFIG)
  const [mediaInput, setMedia]  = useState('')
  const [panelOpen, setPanel]   = useState(true)
  const [saveStatus, setSave]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadConfig()
    setCfg(saved)
    setMedia(saved.mediaFiles.join('\n'))
  }, [])

  // Persist to localStorage on every change
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)) } catch {}
  }, [cfg])

  const set = useCallback(<K extends keyof Config>(key: K, value: Config[K]) => {
    setCfg(prev => ({ ...prev, [key]: value }))
  }, [])

  function applyMedia () {
    const files = mediaInput
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
    set('mediaFiles', files)
  }

  async function saveToFile () {
    setSave('saving')
    try {
      const res = await fetch('/api/animation-config', {
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

  const panelW = 260

  return (
    <div style={{
      display: 'flex', width: '100vw', height: '100vh',
      background: cfg.backgroundColor, color: '#fff', fontFamily: 'monospace',
    }}>

      {/* ── Animation canvas ── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <GridAnimation config={cfg} />
        <div style={{
          position: 'absolute', top: 12, left: 12,
          fontSize: 10, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
        }}>
          /animation-debug
        </div>
      </div>

      {/* ── Toggle button ── */}
      <button
        onClick={() => setPanel(p => !p)}
        style={{
          position: 'fixed', top: 12, right: panelOpen ? panelW + 12 : 12,
          zIndex: 100, background: '#222', border: '1px solid #444',
          color: '#fff', padding: '4px 10px', cursor: 'pointer', fontSize: 11,
          borderRadius: 4, transition: 'right 0.2s',
        }}
      >
        {panelOpen ? '▶ hide' : '◀ show'}
      </button>

      {/* ── Control panel ── */}
      {panelOpen && (
        <div style={{
          width: panelW, flexShrink: 0, background: '#111',
          borderLeft: '1px solid #2a2a2a', overflowY: 'auto',
          padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: 1 }}>ANIMATION DEBUG</div>

          {/* Grid */}
          <Section label="GRID">
            <Slider label="gridSpacing"    value={cfg.gridSpacing}    min={20}   max={200}  step={1}     onChange={v => set('gridSpacing', v)} />
            <Slider label="noiseScale"     value={cfg.noiseScale}     min={0.08} max={0.2}  step={0.002} onChange={v => set('noiseScale', v)} />
            <Slider label="noiseThreshold" value={cfg.noiseThreshold} min={0}    max={1}    step={0.01}  onChange={v => set('noiseThreshold', v)} />
            <Slider label="noiseSeed"      value={cfg.noiseSeed}      min={0}    max={999}  step={1}     onChange={v => set('noiseSeed', v)} />
          </Section>

          {/* Item */}
          <Section label="ITEM">
            <Slider label="baseSize"     value={cfg.baseSize}     min={4}  max={120} step={1} onChange={v => set('baseSize', v)} />
            <Slider label="borderRadius" value={cfg.borderRadius} min={0}  max={60}  step={1} onChange={v => set('borderRadius', v)} />
          </Section>

          {/* Pulse */}
          <Section label="PULSE">
            <Slider label="pulseAmount"  value={cfg.pulseAmount}  min={0}   max={1}   step={0.01} onChange={v => set('pulseAmount', v)} />
            <Slider label="pulseSpeed"   value={cfg.pulseSpeed}   min={0.1} max={6}   step={0.05} onChange={v => set('pulseSpeed', v)} />
            <Slider label="phaseSpread"  value={cfg.phaseSpread}  min={0}   max={30}  step={0.5}  onChange={v => set('phaseSpread', v)} />
          </Section>

          {/* Mouse */}
          <Section label="MOUSE">
            <Slider label="mouseRadius"   value={cfg.mouseRadius}   min={20}  max={600} step={5}   onChange={v => set('mouseRadius', v)} />
            <Slider label="mouseMaxScale" value={cfg.mouseMaxScale} min={1}   max={12}  step={0.1} onChange={v => set('mouseMaxScale', v)} />
            <Slider label="mouseEase"     value={cfg.mouseEase}     min={0.5} max={30}  step={0.5} onChange={v => set('mouseEase', v)} />
          </Section>

          {/* Background */}
          <Section label="BACKGROUND">
            <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11 }}>backgroundColor</span>
              <input
                type="color"
                value={cfg.backgroundColor}
                onChange={e => set('backgroundColor', e.target.value)}
                style={{ width: '100%', height: 28, cursor: 'pointer', background: 'none', border: '1px solid #333', borderRadius: 4 }}
              />
            </label>
          </Section>

          {/* Fallback */}
          <Section label="FALLBACK (no media)">
            <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11 }}>fallbackColor</span>
              <input
                type="color"
                value={cfg.fallbackColor}
                onChange={e => set('fallbackColor', e.target.value)}
                style={{ width: '100%', height: 28, cursor: 'pointer', background: 'none', border: '1px solid #333', borderRadius: 4 }}
              />
            </label>
            <Slider label="fallbackOpacity" value={cfg.fallbackOpacity} min={0} max={1} step={0.01} onChange={v => set('fallbackOpacity', v)} />
          </Section>

          {/* Media */}
          <Section label="MEDIA FILES">
            <p style={{ fontSize: 10, color: '#555', lineHeight: 1.5 }}>
              One path per line.<br />
              Drop files into <code style={{ color: '#888' }}>public/animation/media/</code><br />
              and reference as <code style={{ color: '#888' }}>/animation/media/foo.jpg</code>
            </p>
            <textarea
              value={mediaInput}
              onChange={e => setMedia(e.target.value)}
              placeholder={'/animation/media/photo.jpg\n/animation/media/clip.mp4'}
              rows={5}
              style={{
                width: '100%', background: '#1a1a1a', color: '#ccc', border: '1px solid #333',
                borderRadius: 4, padding: '6px 8px', fontSize: 11, fontFamily: 'monospace',
                resize: 'vertical',
              }}
            />
            <button
              onClick={applyMedia}
              style={{
                background: '#2a2a2a', border: '1px solid #444', color: '#fff',
                padding: '5px 10px', cursor: 'pointer', borderRadius: 4, fontSize: 11,
              }}
            >
              Apply media
            </button>
          </Section>

          {/* Save */}
          <button
            onClick={saveToFile}
            disabled={saveStatus === 'saving'}
            style={{
              background: saveStatus === 'saved' ? '#003300' : saveStatus === 'error' ? '#1a0000' : '#1a2a1a',
              border: `1px solid ${saveStatus === 'saved' ? '#006600' : saveStatus === 'error' ? '#440000' : '#2a4a2a'}`,
              color: saveStatus === 'error' ? '#f66' : '#6f6',
              padding: '6px 10px', cursor: 'pointer', borderRadius: 4, fontSize: 11, fontWeight: 'bold',
            }}
          >
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved to config.json' : saveStatus === 'error' ? '✗ Save failed' : 'Save to public/animation/config.json'}
          </button>

          {/* Reset */}
          <button
            onClick={resetAll}
            style={{
              background: '#1a0000', border: '1px solid #440000',
              color: '#f66', padding: '5px 10px', cursor: 'pointer', borderRadius: 4, fontSize: 11,
            }}
          >
            Reset all to defaults
          </button>

          <div style={{ fontSize: 10, color: '#333', lineHeight: 1.6 }}>
            Config auto-saves to localStorage.<br />
            Use the button above to persist to file.
          </div>
        </div>
      )}
    </div>
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
