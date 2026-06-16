import * as migration_20260616_154711 from './20260616_154711';
import * as migration_20260616_163006 from './20260616_163006';

export const migrations = [
  {
    up: migration_20260616_154711.up,
    down: migration_20260616_154711.down,
    name: '20260616_154711',
  },
  {
    up: migration_20260616_163006.up,
    down: migration_20260616_163006.down,
    name: '20260616_163006'
  },
];
