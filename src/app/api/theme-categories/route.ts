import { NextResponse } from 'next/server'
import { THEME_CATEGORIES } from '../../../../lib/themeCategories'

// GET /api/themes/categories
// Returns all defined theme categories from the shared config.
export async function GET() {
  return NextResponse.json({ categories: THEME_CATEGORIES })
}
