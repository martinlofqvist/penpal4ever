import type { CollectionConfig } from 'payload'

export const Responses: CollectionConfig = {
  slug: 'responses',
  admin: {
    useAsTitle: 'submittedAt',
    defaultColumns: ['correspondence', 'user', 'themeIndex', 'submittedAt'],
  },
  fields: [
    {
      name: 'correspondence',
      type: 'relationship',
      relationTo: 'correspondences',
      required: true,
    },
    {
      name: 'themeIndex',
      type: 'number',
      required: true,
      admin: {
        description: 'Index into the Settings themes array (0-based)',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'submittedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
  ],
}
