import type { CollectionConfig } from 'payload'
import { THEME_CATEGORIES } from '../lib/themeCategories'

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
      options: THEME_CATEGORIES,
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
