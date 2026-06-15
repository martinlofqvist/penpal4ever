import type { CollectionConfig } from 'payload'

export const Correspondences: CollectionConfig = {
  slug: 'correspondences',
  admin: {
    useAsTitle: 'slug',
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Permanent URL identifier for this correspondence',
      },
    },
    {
      name: 'penpalA',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'penpalB',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Ended', value: 'ended' },
      ],
    },
    {
      name: 'endedAt',
      type: 'date',
      admin: {
        condition: (data) => data.status === 'ended',
      },
    },
  ],
}
