import type { CollectionConfig } from 'payload'

export const Themes: CollectionConfig = {
  slug: 'themes',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['id', 'title', 'category', 'language'],
  },
  access: {
    read:   () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'poetic',
      options: [
        { label: 'Poetic',   value: 'poetic'   },
        { label: 'Nature',   value: 'nature'   },
        { label: 'Abstract', value: 'abstract' },
        { label: 'Urban',    value: 'urban'    },
        { label: 'Seasonal', value: 'seasonal' },
      ],
    },
    {
      name: 'language',
      type: 'select',
      required: true,
      defaultValue: 'en',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Swedish', value: 'sv' },
        { label: 'French',  value: 'fr' },
        { label: 'Spanish', value: 'es' },
        { label: 'German',  value: 'de' },
      ],
    },
  ],
}
