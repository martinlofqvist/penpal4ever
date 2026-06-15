import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  admin: {
    group: 'Configuration',
  },
  fields: [
    {
      name: 'themes',
      type: 'array',
      required: true,
      admin: {
        description: 'Ordered list of theme titles. Index position determines sequence.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
