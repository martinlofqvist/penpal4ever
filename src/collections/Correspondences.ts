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
    { name: 'yourLastName',  type: 'text',  required: false },
    { name: 'yourEmail',     type: 'email', required: false },
    // ─── Penpal details ──────────────────────────────────
    { name: 'penpalFirstName', type: 'text',  required: false },
    { name: 'penpalLastName',  type: 'text',  required: false },
    { name: 'penpalEmail',     type: 'email', required: false },
    // ─── Access tokens ───────────────────────────────────
    {
      name: 'leftToken',
      type: 'text',
      required: false,
      admin: { description: 'Secret token for the creator (left side)' },
    },
    {
      name: 'rightToken',
      type: 'text',
      required: false,
      admin: { description: 'Secret token for the penpal (right side)' },
    },
    // ─── Settings ────────────────────────────────────────
    { name: 'limitThemes',       type: 'checkbox', defaultValue: false },
    { name: 'maxThemes',         type: 'number' },
    { name: 'currentThemeIndex', type: 'number', defaultValue: 0 },
    // ─── Theme order ─────────────────────────────────────
    {
      name: 'themeOrder',
      type: 'json',
      required: false,
      admin: { description: 'Fixed ordered array of theme IDs for this correspondence (set on creation, never changes)' },
    },
  ],
}
