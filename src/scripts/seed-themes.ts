/**
 * Seed the themes table from src/data/themes.json
 *
 * Run with:
 *   npx tsx --env-file=.env src/scripts/seed-themes.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import themesData from '../data/themes.json'

async function main() {
  const payload = await getPayload({ config })

  console.log(`Seeding ${themesData.themes.length} themes…`)

  for (const theme of themesData.themes) {
    // Check if already exists (idempotent)
    const existing = await payload.find({
      collection: 'themes',
      where: { title: { equals: theme.title } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`  ✓ already exists: ${theme.title}`)
      continue
    }

    await payload.create({
      collection: 'themes',
      data: {
        title: theme.title,
        ...('category' in theme && { category: theme.category }),
        ...('language' in theme && { language: theme.language }),
      },
    })

    console.log(`  + created: ${theme.title}`)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
