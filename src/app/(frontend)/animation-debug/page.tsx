import type { Metadata } from 'next'
import AnimationDebug from './AnimationDebug'

export const metadata: Metadata = { title: 'Animation Debug · PenPal4ever' }

export default function AnimationDebugRoute() {
  return <AnimationDebug />
}
