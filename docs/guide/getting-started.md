# Getting Started

Beam is a tiny, framework-friendly frontend helper for Laravel Pennant feature flags. It provides a small core SDK plus React hooks and Vue composables.

## Installation

```bash
npm install @beacon-hq/beam
# or
pnpm add @beacon-hq/beam
# or
yarn add @beacon-hq/beam
```

## Quickstart

You can create your own Beam instance or use the singleton via `beam()`.

::: code-group

```ts [Core]
import { Beam, beam } from '@beacon-hq/beam';

window.Beam = new Beam();
window.Beam.active('new-ui');
window.Beam.value<string>('experiment', 'control');

// Or use the singleton
const result = await beam().get('some-flag');
```

```tsx [React]
import { useFeatureFlag, useFlagValue } from '@beacon-hq/beam/react';

export function Example() {
    const { isActive, loading, refresh } = useFeatureFlag('new-ui');
    const { value } = useFlagValue<string>('experiment', { defaultValue: 'control' });
    if (loading) return <span>Loading…</span>;
    return (
        <div>
            <p>Active: {String(isActive)}</p>
            <p>Variant: {value}</p>
            <button onClick={() => refresh()}>Refresh</button>
        </div>
    );
}
```

```vue [Vue]
<script setup lang="ts">
import { useFeatureFlag, useFlagValue } from '@beacon-hq/beam/vue';
const { isActive, loading, refresh } = useFeatureFlag('new-ui');
const { value } = useFlagValue<string>('experiment', { defaultValue: 'control' });
</script>

<template>
    <div>
        <p v-if="loading">Loading…</p>
        <template v-else>
            <p>Active: {{ String(isActive) }}</p>
            <p>Variant: {{ value }}</p>
            <button @click="refresh()">Refresh</button>
        </template>
    </div>
</template>
```

:::

## Backend endpoint

By default Beam talks to `/beam` on your origin. The core SDK will:

- POST `/beam/:flag` with `{ context }`

You can change the base URL and path via `new Beam({ baseUrl, path })` or `beam({ baseUrl, path })`.

## Next steps

- Read about configuration options → [Configuration](/guide/configuration)
- React usage → [React](/frameworks/react)
- Vue usage → [Vue](/frameworks/vue)
