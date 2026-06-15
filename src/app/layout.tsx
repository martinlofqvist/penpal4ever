import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PenPal4ever',
  description: 'A place for creatives to correspond visually by interpreting a shared theme.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
