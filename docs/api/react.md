# React API

This page documents the React adapter exports from `@beacon-hq/beam/react`.

## Exports

- `useFeatureFlag`
- `configureBeam` (re-export from Core)

See Core docs for common types and behavior: `Scope`, `FeatureFlag`, `BeamConfig`, requests/headers, and timeouts.

## `useFeatureFlag<T>(featureFlag, options?, scope?)`

Hook that reads a feature flag and keeps minimal state for UI.

Signature:

- `useFeatureFlag<T = unknown>(featureFlag: string, options?: UseFeatureFlagConfig<T>, scope?: Scope):
  FeatureFlag & { loading: boolean; refresh: () => Promise<void> }`

Where `UseFeatureFlagConfig<T>` extends `BeamConfig` with:

- `defaultValue?: T` — value returned when the flag is inactive or missing
- `deps?: ReadonlyArray<unknown>` — extra dependencies that trigger a refetch when changed

Behavior:

- Uses the Core singleton `beam()` under the hood.
- Performs an initial fetch on mount; refetches when featureFlag or any deps change.
- Returns FeatureFlag fields: `featureFlag`, `status`, `value?` plus `loading` and a `refresh()` helper.
- If the flag is inactive, value resolves to `options.defaultValue` (if provided).

Example — basic usage:

```tsx
import { useFeatureFlag } from '@beacon-hq/beam/react';

export function ExperimentBanner() {
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

Example — with scope and deps:

```tsx
import { useFeatureFlag } from '@beacon-hq/beam/react';

function Profile({ userId }: { userId: number }) {
  const scope = { userId };
  const feature = useFeatureFlag('beta-ui', { deps: [userId] }, scope);
  return feature.status ? <NewUI /> : <LegacyUI />;
}
```

Notes:

- scope is merged with any defaultScope configured via BeamConfig.
- The hook maintains its own loading state; errors in fetching are swallowed by Core and treated as inactive.

## configureBeam(options?)

Re-exported from Core. Configure (or reconfigure) the global singleton with BeamConfig.

```ts
import { configureBeam } from '@beacon-hq/beam/react';

configureBeam({ baseUrl: 'https://example.com', path: '/beam/feature-flag', timeout: 5000 });
```

For details about requests, headers, and timeouts, see the [Core API](./core) docs.
