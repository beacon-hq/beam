---
layout: home
hero:
    name: Beam
    text: Feature flags for the frontend powered by Laravel Pennant
    tagline: Tiny, typed, framework-friendly (React & Vue)
    actions:
        - theme: brand
          text: Get Started
          link: /guide/getting-started
        - theme: alt
          text: API Reference
          link: /api/core
    image:
        src: /images/icon.svg
features:
    - title: Simple API
      details: Fetch flags via a small, promise-based SDK with great TypeScript types.
    - title: Framework Friendly
      details: First-class React hooks and Vue composables.
    - title: Caching & Timeouts
      details: Built-in request timeout and in-memory caching per instance.
---

## Quick Start

Install the package, then choose the style you prefer. You can instantiate Beam directly or use the singleton via beam().

::: code-group

```ts [Core]
import { Beam, beam } from '@beacon-hq/beam';

window.Beam = new Beam();
const active = await window.Beam.active('new-ui');

// OR: use the singleton
const val = await beam().value<string>('experiment', 'control');
```

```tsx [React]
import { useFeatureFlag } from '@beacon-hq/beam/react';

function Component() {
    const { status, value, loading } = useFeatureFlag<string>('experiment', { defaultValue: 'control' });
    if (loading) return <span>Loading…</span>;
    return <div>{status ? `Variant: ${value}` : 'Feature Off'}</div>;
}
```

```vue [Vue]
<script setup lang="ts">
import { useFeatureFlag } from '@beacon-hq/beam/vue';
const { status, value, loading } = useFeatureFlag<string>('experiment', { defaultValue: 'control' });
</script>

<template>
    <span v-if="loading">Loading…</span>
    <div v-else>
        <template v-if="status">Variant: {{ value }}</template>
        <template v-else>Feature Off</template>
    </div>
</template>
```

:::

## Installation

In the root of your Laravel project, run one of the following commands to install the JavaScript package and the Laravel integration:

::: code-group

```bash [composer]
composer require beacon-hq/pennant-beam

artisan beam:install # use your JS package manager to install @beacon-hq/beam
```

```bash [npm]
npm install @beacon-hq/beam && composer require beacon-hq/pennant-beam
```

```bash [pnpm]
pnpm add @beacon-hq/beam && composer require beacon-hq/pennant-beam
```

```bash [yarn]
yarn add @beacon-hq/beam && composer require beacon-hq/pennant-beam
```

:::

## What is Beam?

Beam is a small TypeScript library for fetching and using Laravel Pennant feature flags in your frontend. It exposes a minimal core SDK and thin adapters for React and Vue.

- Core: query flags from your backend with methods active, inactive, value, and get; includes in-memory caching and request timeouts.
- React: useFeatureFlag hook returning { featureFlag, status, value, loading, refresh }.
- Vue: useFeatureFlag composable returning the same shape as React.
