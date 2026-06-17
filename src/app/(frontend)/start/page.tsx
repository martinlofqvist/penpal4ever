import type { Metadata } from 'next'
import StartPage from '@/components/StartPage'

export const metadata: Metadata = {
  title: 'Start a Correspondence · PenPal4ever',
}

export default function StartRoute() {
  return <StartPage />
}
