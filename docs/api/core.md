# Core API

This page documents the core exports of `@beacon-hq/beam`.

## Types

- `Scope`
  - `type Scope = Record<string, unknown>`
- `FeatureFlag`
  - `featureFlag: string`
  - `status: boolean`
  - `value?: unknown`
- `BeamConfig`
  - `baseUrl?: string` (default: current origin, e.g. `window.location.protocol + '//' + window.location.host`)
  - `path?: string` (default: `/beam/feature-flag`)
  - `defaultScope?: Scope` (default scope applied when no scope is provided per call)
  - `headers?: Record<string, string>` (merged into request headers)
  - `timeout?: number` (default: 5000 ms; 0/undefined disables timeout)
  - `global?: boolean | string` (optional globalThis registration name)
  - `tokenPath?: string` (default: `/beam/token`) — GET endpoint that sets a JWT cookie used for auth
  - `tokenCookie?: string` (default: `BEAM-TOKEN`) — cookie name where the JWT is stored
  - `clockSkewSeconds?: number` (default: `30`) — allowed skew when validating JWT `exp`

## beam(config?)

A convenience singleton accessor. First call creates the instance; subsequent calls return the same instance. Passing a config on later calls re-creates it. If `config.global` is provided, the created instance is attached to `globalThis` under the name `"Beam"` or the provided string.

```ts
import { beam } from '@beacon-hq/beam';

beam().active('new-ui');
beam().active('new-ui'); // same instance
beam({ baseUrl: 'https://api.example.com', global: true }); // re-created and assigned to globalThis.Beam
```

## configureBeam(options?)

Configure (or reconfigure) the singleton instance using `BeamConfig`. This will replace the current singleton with a new `Beam` configured with the provided options.

```ts
import { configureBeam } from '@beacon-hq/beam';

configureBeam({ baseUrl: 'https://example.com', timeout: 3000 });
```

## class Beam

Construct an instance with optional config.

```ts
import { Beam } from '@beacon-hq/beam';

window.Beam = new Beam({ baseUrl: 'https://example.com', path: '/beam/feature-flag', timeout: 5000 });
```

### Methods

- `active(flag: string, scope?: Scope): Promise<boolean>`

```ts
const on = await sdk.active('new-ui');
```

- `inactive(flag: string, scope?: Scope): Promise<boolean>`

```ts
const off = await sdk.inactive('legacy-ui');
```

- `value<T>(flag: string, defaultValue?: T, scope?: Scope): Promise<T>`

```ts
const variant = await sdk.value<string>('experiment', 'control');
```

- `get(featureFlag: string, scope?: Scope): Promise<FeatureFlag>`
- `clearCache(): void`

### Requests and headers

Requests are POSTed to `${baseUrl}${path}` with JSON body `{ flag, scope? }` and automatically include:

- `Content-Type: application/json`
- `X-Requested-With: XMLHttpRequest`
- `Authorization: Bearer <token>` using a JWT obtained via `GET ${baseUrl}${tokenPath}` and read from the `${tokenCookie}` cookie (default: `BEAM-TOKEN`). Tokens are validated for expiration and refreshed when needed.

### Timeouts

Timeout uses `AbortSignal.timeout` when available, falling back to an `AbortController` implementation. Set `timeout` to `0` or `undefined` to disable.

## Default export

The default export is the `Beam` class:

```ts
import Beam from '@beacon-hq/beam';
window.Beam = new Beam();
```
