# Vue

Beam provides idiomatic Vue composables. Install the core package (Vue is a peer dependency):

```bash
npm install @beacon-hq/beam
```

## useFeatureFlag

Fetch a single flag.

```vue
<script setup lang="ts">
import { useFeatureFlag } from '@beacon-hq/beam/vue';

const { status, value, loading, refresh } = useFeatureFlag('new-ui');
</script>

<template>
    <span v-if="loading">Loading…</span>
    <div v-else>
        {{ status ? 'Feature On' : 'Feature Off' }}
        <button @click="refresh()">Refresh</button>
    </div>
</template>
```

Options extend `BeaconConfig` and add:

- `defaultValue?: T` — value to use when inactive.
- `deps?: ReadonlyArray<WatchSource | unknown>` — additional watch deps to control refetching.


## Configuring Beam

Vue package re-exports `configureBeam` for convenience.

```ts
import { configureBeam } from '@beacon-hq/beam/vue';

configureBeam({defaultScope: this.user});
```
