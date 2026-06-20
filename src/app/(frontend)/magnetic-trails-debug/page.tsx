import type { Metadata } from 'next'
import MagneticTrailsDebug from './MagneticTrailsDebug'

export const metadata: Metadata = { title: 'Magnetic Trails Debug · PenPal4ever' }

export default function MagneticTrailsDebugRoute() {
  return <MagneticTrailsDebug />
}
