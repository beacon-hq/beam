# React

Beam provides idiomatic React hooks. Install the core package (React is a peer dependency):

```bash
npm install @beacon-hq/beam
```

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

Options:

- `instance?`: Beam — provide a custom instance (defaults to the singleton from `beam()`).
- `deps?: ReadonlyArray<unknown>` — additional effect deps to control refetching.

## useFlagValue

Fetch a flag’s value and active state with an optional default.

```tsx
import { useFlagValue } from '@beacon-hq/beam/react';

export function Variant() {
    const { value, active, loading } = useFlagValue<string>('experiment', { defaultValue: 'control' });
    if (loading) return <span>Loading…</span>;
    return <span>{active ? value : 'control'}</span>;
}
```

Return type: `{ featureFlag: string; status: boolean; value?: any, loading: boolean, refresh: fn () => void }`.

Options extend `BeaconConfig` and add:

- `defaultValue?: T` — value to use when inactive.
- `deps?`: `ReadonlyArray<unknown>` — additional effect deps to control refetching.


## Configuring Beam

React package re-exports `configureBeam` for convenience.

```ts
import { configureBeam } from '@beacon-hq/beam/react';

configureBeam({defaultScope: props.user});
```
