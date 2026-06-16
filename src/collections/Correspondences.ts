import type { CollectionConfig } from 'payload'

export const Correspondences: CollectionConfig = {
  slug: 'correspondences',
  admin: {
    useAsTitle: 'slug',
    defaultColumns: ['slug', 'yourFirstName', 'penpalFirstName', 'createdAt'],
  },
  access: {
    create: () => true,
    read:   () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Unique URL identifier for this correspondence' },
    },
    // ─── Your details ───────────────────────────────────
    { name: 'yourFirstName', type: 'text',  required: true },
    { name: 'yourLastName',  type: 'text',  required: true },
    { name: 'yourEmail',     type: 'email', required: true },
    // ─── Penpal details ──────────────────────────────────
    { name: 'penpalFirstName', type: 'text',  required: true },
    { name: 'penpalLastName',  type: 'text',  required: true },
    { name: 'penpalEmail',     type: 'email', required: true },
    // ─── Settings ────────────────────────────────────────
    { name: 'limitThemes',       type: 'checkbox', defaultValue: false },
    { name: 'maxThemes',         type: 'number' },
    { name: 'currentThemeIndex', type: 'number', defaultValue: 0 },
    // ─── Theme ───────────────────────────────────────────
    {
      name: 'theme',
      type: 'relationship',
      relationTo: 'themes',
      required: false,
      admin: { description: 'The active theme for this correspondence' },
    },
  ],
}
