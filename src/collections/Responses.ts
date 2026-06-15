import type { CollectionConfig } from 'payload'

export const Responses: CollectionConfig = {
  slug: 'responses',
  admin: {
    useAsTitle: 'submittedAt',
    defaultColumns: ['correspondence', 'themeIndex', 'side', 'submittedAt'],
  },
  access: {
    create: () => true,
    read:   () => true,
    update: () => true,
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
        description: 'Index into the themes array (0-based)',
      },
    },
    {
      name: 'side',
      type: 'select',
      required: true,
      options: [
        { label: 'Left',  value: 'left'  },
        { label: 'Right', value: 'right' },
      ],
      admin: {
        description: 'Which person uploaded this (left = you, right = penpal)',
      },
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
