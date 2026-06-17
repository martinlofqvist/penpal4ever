import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// PATCH /api/correspondences/[slug] — set penpal details (first-time visit)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const payload = await getPayload({ config })
    const body = await req.json()

    const { penpalFirstName, penpalLastName, penpalEmail } = body

    if (!penpalFirstName?.trim()) {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 })
    }

    const { docs } = await payload.find({
      collection: 'correspondences',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    if (!docs.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const doc = docs[0]

    // Only allow setting penpal details if they haven't been set yet
    if (doc.penpalFirstName) {
      return NextResponse.json({ error: 'Penpal already registered' }, { status: 409 })
    }

    const updated = await payload.update({
      collection: 'correspondences',
      id: doc.id,
      data: {
        penpalFirstName: penpalFirstName.trim(),
        penpalLastName:  (penpalLastName ?? '').trim(),
        penpalEmail:     (penpalEmail ?? '').trim().toLowerCase(),
      },
    })

    return NextResponse.json({ ok: true, penpalFirstName: updated.penpalFirstName })
  } catch (err) {
    console.error('PATCH /api/correspondences/[slug]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
