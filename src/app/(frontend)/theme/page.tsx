import type { Metadata } from 'next'
import ThemeView from '@/components/ThemeView'

export const metadata: Metadata = {
  title: 'PenPal4ever',
}

export default function ThemePage() {
  return <ThemeView />
}
