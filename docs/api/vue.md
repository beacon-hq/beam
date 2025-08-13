# Vue API

This page documents the Vue adapter exports from `@beacon-hq/beam/vue`.

## Exports

- `useFeatureFlag`
- `configureBeam` (re-export from Core)

See Core docs for common types and behavior: `Scope`, `FeatureFlag`, `BeamConfig`, requests/headers, and timeouts.

## `useFeatureFlag<T>(featureFlag, options?, scope?)`

Composable that reads a feature flag and exposes a small reactive state for UI.

Signature:

- `useFeatureFlag<T = unknown>(featureFlag: string, options?: UseFeatureFlagConfig<T>, scope?: Scope):
  FeatureFlag & { loading: boolean; refresh: () => Promise<void> }`

Where `UseFeatureFlagConfig<T>` extends `BeamConfig` with:

- `defaultValue?: T` — value returned when the flag is inactive or missing
- `deps?: ReadonlyArray<WatchSource | unknown>` — extra watch sources that trigger a refetch when changed

Behavior:

- Uses the Core singleton `beam()` under the hood.
- Performs an initial fetch `onMounted`; refetches when any provided deps change.
- Returns a reactive object that exposes FeatureFlag fields: `featureFlag`, `status`, `value?` plus `loading` and a `refresh()` helper.
- If the flag is inactive, value resolves to `options.defaultValue` (if provided).

Example — basic usage:

```vue
<script setup lang="ts">
import { useFeatureFlag } from '@beacon-hq/beam/vue';

const state = useFeatureFlag<string>('experiment', { defaultValue: 'control' });
</script>

<template>
  <span v-if="state.loading">Loading…</span>
  <div v-else>
    <template v-if="state.status">Variant: {{ state.value }}</template>
    <template v-else>Feature Off</template>
    <button @click="state.refresh()">Refresh</button>
  </div>
</template>
```

Example — with scope and deps:

```vue
<script setup lang="ts">
import { useFeatureFlag } from '@beacon-hq/beam/vue';
import { computed } from 'vue';

const props = defineProps<{ userId: number }>();
const scope = computed(() => ({ userId: props.userId }));
const feature = useFeatureFlag('beta-ui', { deps: [() => props.userId] }, scope.value);
</script>

<template>
  <NewUI v-if="feature.status" />
  <LegacyUI v-else />
</template>
```

Notes:

- scope is merged with any defaultScope configured via BeamConfig.
- The composable maintains its own loading state; errors in fetching are swallowed by Core and treated as inactive.

## configureBeam(options?)

Re-exported from Core. Configure (or reconfigure) the global singleton with BeamConfig.

```ts
import { configureBeam } from '@beacon-hq/beam/vue';

configureBeam({ baseUrl: 'https://example.com', path: '/beam/feature-flag', timeout: 5000 });
```

For details about requests, headers, and timeouts, see the [Core API](./core) docs.
