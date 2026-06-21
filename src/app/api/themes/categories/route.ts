import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

function toLabel(value: string): string {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// GET /api/themes/categories
// Returns all distinct categories that have at least one theme in the DB.
export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Fetch all themes (just the category field) and extract distinct values
    const { docs } = await payload.find({
      collection: 'themes',
      limit: 10000,
      select: { category: true } as any,
    })

    const seen = new Set<string>()
    const categories: { value: string; label: string }[] = []

    for (const doc of docs) {
      const val = (doc as any).category as string | undefined
      if (val && !seen.has(val)) {
        seen.add(val)
        categories.push({ value: val, label: toLabel(val) })
      }
    }

    // Sort alphabetically by label
    categories.sort((a, b) => a.label.localeCompare(b.label))

    return NextResponse.json({ categories })
  } catch (err) {
    console.error('GET /api/themes/categories:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
