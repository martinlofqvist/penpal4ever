import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import ThemeView from '@/components/ThemeView'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { title: `Correspondence · ${slug} · PenPal4ever` }
}

export default async function CorrespondencePage({ params, searchParams }: Props) {
  const { slug } = await params
  const { token } = await searchParams

  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'correspondences',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  if (!docs.length) notFound()

  const c = docs[0]

  const themeOrder = Array.isArray(c.themeOrder) ? (c.themeOrder as number[]) : undefined
  const needsPenpal = !c.penpalFirstName

  // Derive side server-side from the token in the URL
  let initialSide: 'left' | 'right' | null = null
  if (token) {
    if (token === c.leftToken)       initialSide = 'left'
    else if (token === c.rightToken) initialSide = 'right'
  }

  // Build share URLs server-side so tokens are never directly exposed as props
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const leftShareUrl  = `${origin}/correspondence/${slug}?token=${c.leftToken ?? ''}`
  const rightShareUrl = `${origin}/correspondence/${slug}?token=${c.rightToken ?? ''}`

  return (
    <div className="theme-page">
      <ThemeView
        correspondenceSlug={slug}
        yourName={c.yourFirstName.toUpperCase()}
        penpalName={c.penpalFirstName ? c.penpalFirstName.toUpperCase() : '…'}
        themeOrder={themeOrder}
        needsPenpal={needsPenpal}
        initialSide={initialSide}
        token={token ?? null}
        leftShareUrl={leftShareUrl}
        rightShareUrl={rightShareUrl}
        limitThemes={!!c.limitThemes}
        maxThemes={c.maxThemes ?? null}
      />
    </div>
  )
}
