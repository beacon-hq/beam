# React

Beam provides a simple React hook for using feature flags in your components.

## useFeatureFlag

Fetch a single flag.

```tsx
import { useFeatureFlag } from '@beacon-hq/beam/react';

export function FeatureGate() {
    const { status, loading, refresh } = useFeatureFlag('new-ui');

    if (loading) return <span>Loading…</span>;
    return (
        <div>
            {status ? 'Feature On' : 'Feature Off'}
            <button onClick={() => refresh()}>Refresh</button>
        </div>
    );
}
```

Return type: 

```typescript
{ 
    featureFlag: string; 
    status: boolean; 
    value?: any, 
    loading: boolean, 
    refresh: fn () => void 
}
```

Options extend `BeaconConfig` and add:

- `defaultValue?: T` — `value` to return when inactive.
- `deps?`: `ReadonlyArray<unknown>` — additional effect deps to control refetching.


## Configuring Beam

React package re-exports `configureBeam` for convenience.

```ts
import { configureBeam } from '@beacon-hq/beam/react';

configureBeam({defaultScope: props.user});
```
