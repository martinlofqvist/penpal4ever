import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

function generateSlug(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 10)
}

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

// POST /api/correspondences — create a new correspondence
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await req.json()

    const {
      yourFirstName, yourLastName, yourEmail,
      penpalFirstName, penpalLastName, penpalEmail,
      limitThemes, maxThemes, themeCategory,
    } = body

    if (!yourFirstName) {
      return NextResponse.json({ error: 'Your first name is required' }, { status: 400 })
    }

    // Fetch themes, optionally filtered by category
    const categoryFilter =
      themeCategory && themeCategory !== 'all'
        ? { where: { category: { equals: themeCategory } } }
        : {}

    const { docs: allThemes } = await payload.find({
      collection: 'themes',
      limit: 10000,
      sort: 'id',
      ...categoryFilter,
    })
    const ids = allThemes.map((t) => Number(t.id))
    // Fisher-Yates shuffle
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[ids[i], ids[j]] = [ids[j], ids[i]]
    }
    const themeOrder = ids

    const slug       = generateSlug()
    const leftToken  = generateToken()
    const rightToken = generateToken()

    const doc = await payload.create({
      collection: 'correspondences',
      data: {
        slug,
        leftToken,
        rightToken,
        yourFirstName:   yourFirstName.trim(),
        yourLastName:    (yourLastName ?? '').trim(),
        yourEmail:       (yourEmail ?? '').trim().toLowerCase(),
        penpalFirstName: '',
        penpalLastName:  '',
        penpalEmail:     '',
        limitThemes:     !!limitThemes,
        maxThemes:       limitThemes ? (parseInt(maxThemes, 10) || null) : null,
        currentThemeIndex: 0,
        themeOrder,
      },
    })

    return NextResponse.json({ slug, id: doc.id, url: `/correspondence/${slug}`, leftToken, rightToken })
  } catch (err) {
    console.error('POST /api/correspondences:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/correspondences?email=… or ?slug=…
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')?.trim().toLowerCase()
    const slug  = searchParams.get('slug')?.trim()

    if (email) {
      const { docs } = await payload.find({
        collection: 'correspondences',
        where: {
          or: [
            { yourEmail:   { equals: email } },
            { penpalEmail: { equals: email } },
          ],
        },
        limit: 100,
        sort: '-createdAt',
      })
      if (!docs.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(docs)
    }

    if (slug) {
      const { docs } = await payload.find({
        collection: 'correspondences',
        where: { slug: { equals: slug } },
        limit: 1,
      })
      if (!docs.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(docs[0])
    }

    return NextResponse.json({ error: 'Provide ?email= or ?slug=' }, { status: 400 })
  } catch (err) {
    console.error('GET /api/correspondences:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
