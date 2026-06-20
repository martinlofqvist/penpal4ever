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
    const file       = formData.get('file')       as File | null
    const token      = formData.get('token')      as string | null
    const themeIndex = parseInt(formData.get('themeIndex') as string || '0', 10)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Derive side server-side from the token — never trust the client
    let side: 'left' | 'right'
    if (token && token === correspondence.leftToken) {
      side = 'left'
    } else if (token && token === correspondence.rightToken) {
      side = 'right'
    } else {
      return NextResponse.json({ error: 'Invalid or missing token' }, { status: 403 })
    }

    // Convert File to Buffer for Payload upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Media collection
    const createdMedia = await payload.create({
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

    // Re-fetch the media document so Vercel Blob URL is guaranteed to be populated
    const media = await payload.findByID({
      collection: 'media',
      id: createdMedia.id,
      depth: 0,
    })

    // Create Response record
    const response = await payload.create({
      collection: 'responses',
      data: {
        correspondence: correspondence.id,
        themeIndex,
        side,
        image: createdMedia.id,
        submittedAt: new Date().toISOString(),
      },
    })

    // Try every possible location for the URL, in priority order.
    // Vercel Blob stores the full URL in .url; createdMedia may have it immediately
    // on create; refetch is a safety net. Fall back to local file endpoint in dev.
    const imageUrl: string | null =
      (createdMedia as any).url ??
      (media as any).url ??
      ((createdMedia as any).filename ? `/api/media/file/${(createdMedia as any).filename}` : null) ??
      ((media as any).filename ? `/api/media/file/${(media as any).filename}` : null)

    console.log('[upload] mediaId:', createdMedia.id, '| createdMedia.url:', (createdMedia as any).url, '| media.url:', (media as any).url, '| filename:', (media as any).filename, '| resolved imageUrl:', imageUrl)

    return NextResponse.json({
      success: true,
      responseId: response.id,
      mediaId: createdMedia.id,
      imageUrl,
    })
  } catch (err) {
    console.error('POST /api/correspondences/[slug]/upload:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
