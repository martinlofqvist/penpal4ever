import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// POST /api/correspondences/[slug]/upload
// Body: multipart/form-data with fields: file (File), side ('left'|'right')
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const payload = await getPayload({ config })

    // Find correspondence
    const { docs } = await payload.find({
      collection: 'correspondences',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    if (!docs.length) {
      return NextResponse.json({ error: 'Correspondence not found' }, { status: 404 })
    }
    const correspondence = docs[0]

    // Parse multipart form
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const side = formData.get('side') as string | null // 'left' or 'right'
    const themeIndex = parseInt(formData.get('themeIndex') as string || '0', 10)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (side !== 'left' && side !== 'right') {
      return NextResponse.json({ error: 'side must be "left" or "right"' }, { status: 400 })
    }

    // Convert File to Buffer for Payload upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Media collection
    const media = await payload.create({
      collection: 'media',
      data: {
        alt: `${correspondence.yourFirstName} - Theme ${themeIndex + 1} (${side})`,
      },
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
    })

    // Create Response record
    const response = await payload.create({
      collection: 'responses',
      data: {
        correspondence: correspondence.id,
        themeIndex,
        side,
        image: media.id,
        submittedAt: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      responseId: response.id,
      mediaId: media.id,
      imageUrl: (media as any).url,
    })
  } catch (err) {
    console.error('POST /api/correspondences/[slug]/upload:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
