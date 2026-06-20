import * as migration_20260616_154711 from './20260616_154711';
import * as migration_20260616_163006 from './20260616_163006';
import * as migration_20260620_212827 from './20260620_212827';
import * as migration_20260620_add_theme_fields from './20260620_add_theme_fields';
import * as migration_20260620_add_tokens from './20260620_add_tokens';

export const migrations = [
  {
    up: migration_20260616_154711.up,
    down: migration_20260616_154711.down,
    name: '20260616_154711',
  },
  {
    up: migration_20260616_163006.up,
    down: migration_20260616_163006.down,
    name: '20260616_163006',
  },
  {
    up: migration_20260620_212827.up,
    down: migration_20260620_212827.down,
    name: '20260620_212827',
  },
  {
    up: migration_20260620_add_theme_fields.up,
    down: migration_20260620_add_theme_fields.down,
    name: '20260620_add_theme_fields',
  },
  {
    up: migration_20260620_add_tokens.up,
    down: migration_20260620_add_tokens.down,
    name: '20260620_add_tokens'
  },
];
