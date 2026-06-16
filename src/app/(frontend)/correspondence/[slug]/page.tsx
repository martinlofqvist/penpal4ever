import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import ThemeView from '@/components/ThemeView'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { title: `Correspondence · ${slug} · PenPal4ever` }
}

export default async function CorrespondencePage({ params }: Props) {
  const { slug } = await params

  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'correspondences',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  if (!docs.length) notFound()

  const c = docs[0]

  const themeOrder = Array.isArray(c.themeOrder) ? (c.themeOrder as number[]) : undefined

  return (
    <div className="theme-page">
      <ThemeView
        correspondenceSlug={slug}
        yourName={c.yourFirstName.toUpperCase()}
        penpalName={c.penpalFirstName.toUpperCase()}
        themeOrder={themeOrder}
      />
    </div>
  )
}
