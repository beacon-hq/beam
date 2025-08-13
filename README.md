# @beacon-hq/beam

Frontend helper for Laravel Pennant feature flags (with support for React and Vue).

This repository is set up as a high-quality TypeScript library with:

- Strict TypeScript config and generated types
- Vite library build (ESM + CJS) with source maps
- Vitest for fast unit tests
- ESLint + Prettier for consistency
- Exports map and sideEffects for tree-shaking

## Install

npm install @beacon-hq/beam

## Quickstart (Core)

```ts
import { Beam, beam } from '@beacon-hq/beam';

window.Beam = new Beam();
const active = await window.Beam.active('new-ui');

// OR: use the singleton
const val = await beam().value<string>('experiment', 'control');
```

### API (Core)

- active(flag: string, context?): Promise<boolean>
- inactive(flag: string, context?): Promise<boolean>
- value<T>(flag: string, defaultValue?: T, context?): Promise<T>
- get(flag: string, context?): Promise<{ featureFlag: string; status: boolean; value?: unknown }>
- clearCache(): void

Notes:

- baseUrl defaults to the current origin (window.location), path defaults to '/beam/feature-flag'.
- Requests are POSTed to `${baseUrl}${path}`.
- Built-in timeout uses AbortSignal when supported.

## React

```tsx
import { useFeatureFlag } from '@beacon-hq/beam/react';

function Component() {
    const { status, value, loading, refresh } = useFeatureFlag<string>('experiment', { defaultValue: 'control' });
    if (loading) return <span>Loading…</span>;
    return (
        <div>
            {status ? `Variant: ${value}` : 'Feature Off'}
            <button onClick={() => refresh()}>Refresh</button>
        </div>
    );
}
```

## Vue 3

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
    </div>
</template>
```

## Scripts

- build: Build ESM and CJS bundles and generate .d.ts
- test: Run unit tests
- typecheck: TypeScript type-checking only
- lint / lint:fix: ESLint checks
- format / format:check: Prettier formatting

## Development

- Node.js >= 18
- React and Vue are optional peerDependencies and are not bundled.

## License

See LICENSE.md.
