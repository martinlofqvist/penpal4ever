import type { Metadata } from 'next'
import RibbonDebug from './RibbonDebug'

export const metadata: Metadata = { title: 'Ribbon Debug · PenPal4ever' }

export default function RibbonDebugRoute () {
  return <RibbonDebug />
}
