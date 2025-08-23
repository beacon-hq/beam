# Getting Started

Beam is a tiny, framework-friendly frontend helper for Laravel Pennant feature flags. It provides a small core SDK plus React hooks and Vue composables.

## Installation

In the root of your Laravel project, run one of the following commands to install the JavaScript package and the Laravel integration:

::: code-group

```bash [npm]
npm install @beacon-hq/beam
```

```bash [pnpm]
pnpm add @beacon-hq/beam
```

```bash [yarn]
yarn add @beacon-hq/beam
```

:::

You will also want to install the Laravel library:

```bash
composer require beacon-hq/pennant-beam
```

## Quickstart

You can create your own Beam instance or use the singleton via `beam()`.

::: code-group

```ts [Core]
import { Beam, beam } from '@beacon-hq/beam';

window.Beam = new Beam();
await window.Beam.active('new-ui');
await window.Beam.value<string>('experiment', 'control');

// Or use the singleton
const result = await beam().get('some-flag');
```

```tsx [React]
import { useFeatureFlag } from '@beacon-hq/beam/react';

export function Example() {
    const { status, value, loading, refresh } = useFeatureFlag('new-ui');
    if (loading) return <span>Loading…</span>;
    return (
        <div>
            <p>Active: {String(status)}</p>
            <p>Variant: {value}</p>
            <button onClick={() => refresh()}>Refresh</button>
        </div>
    );
}
```

```vue [Vue]
<script setup lang="ts">
import { useFeatureFlag } from '@beacon-hq/beam/vue';
const { status, value, loading, refresh } = useFeatureFlag('new-ui');
</script>

<template>
    <div>
        <p v-if="loading">Loading…</p>
        <template v-else>
            <p>Active: {{ String(status) }}</p>
            <p>Variant: {{ value }}</p>
            <button @click="refresh()">Refresh</button>
        </template>
    </div>
</template>
```

:::

## Backend endpoint

By default, Beam talks to `/beam` on your origin. The core SDK will:

- POST `/beam/:flag` with `{ context }`

You can change the base URL and path via `new Beam({ baseUrl, path })` or `beam({ baseUrl, path })`.

## Next steps

- Read about configuration options → [Configuration](/guide/configuration)
- React usage → [React](/frameworks/react)
- Vue usage → [Vue](/frameworks/vue)
