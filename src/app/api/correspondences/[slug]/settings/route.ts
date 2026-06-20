import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// PATCH /api/correspondences/[slug]/settings
// Body: { token: string, maxThemes: number | null }
// Only the creator (leftToken) can update settings.
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const payload = await getPayload({ config })
    const body = await req.json()

    const { token, maxThemes } = body

    const { docs } = await payload.find({
      collection: 'correspondences',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    if (!docs.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const doc = docs[0]

    if (!token || token !== doc.leftToken) {
      return NextResponse.json({ error: 'Only the creator can change settings' }, { status: 403 })
    }

    const isInfinite = maxThemes === null || maxThemes === 0
    const updated = await payload.update({
      collection: 'correspondences',
      id: doc.id,
      data: {
        limitThemes: !isInfinite,
        maxThemes:   isInfinite ? null : (parseInt(String(maxThemes), 10) || null),
      },
    })

    return NextResponse.json({
      ok: true,
      limitThemes: updated.limitThemes,
      maxThemes:   updated.maxThemes,
    })
  } catch (err) {
    console.error('PATCH /api/correspondences/[slug]/settings:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
