# Configuration

Beam aims for a minimal, predictable configuration surface. You can use a dedicated instance or the provided singleton.

## BeamConfig

`Beam()`, `beam()`, and `configureBeam()` accept a `BeamConfig` configuration object with the following options:

- `tokenPath?: string` (default: `/beam/token`) — GET endpoint that sets a JWT cookie used for auth
- `tokenCookie?: string` (default: `BEAM-TOKEN`) — cookie name where the JWT is stored
- `clockSkewSeconds?: number` (default: `30`) — allowed skew when validating JWT `exp`

### baseUrl

- Defaults to `window.location.origin` or `process.env.SERVER_URL`
- Endpoints used by the SDK:
    - GET `${baseUrl}${tokenPath}` to establish a JWT cookie
    - POST `${baseUrl}${path}` for feature flag evaluation

### path

- Base path for Feature Flag requests
- Defaults to `/beam/feature-flag`

### defaultScope

- Default scope to use for all feature flag requests
- Can be overriden per request

### headers

- Merged into the request headers for all SDK requests.
- Beam also auto-populates when available:
    - `X-Requested-With: XMLHttpRequest`
    - Bearer: `Authorization: Bearer <token>` where the token is a JWT read from a cookie (default: `BEAM-TOKEN`) after a `GET` to `${baseUrl}${tokenPath}` (default: `/beam/token`). Tokens are validated for expiration and refreshed automatically.
- You can override by passing your own headers.

### timeout

- Defaults to 5000ms.
- Set to `0` or `undefined` to disable client-side timeout.

### global

- Defaults to `false`.
- Register the Beam instance globally at `globalThis.Beam` for easy access.

> [!NOTE]
>
> > React/Vue packages re-export `configureBeam` and related types for convenience:

```ts
// React
import { configureBeam } from '@beacon-hq/beam/react';
// Vue
import { configureBeam } from '@beacon-hq/beam/vue';
```

## Singleton helper

```ts
import { beam } from '@beacon-hq/beam';

// First call creates the singleton
const Beam = beam();

// Subsequent calls return the same instance
const again = beam();

// Passing a config later re-creates the singleton
const replaced = beam({ path: '/flags' });
```

## Caching

- Each Beam instance maintains an in-memory cache keyed by flag + serialized context.
- Use `clearCache()` to invalidate the entire instance cache.

```ts
await beam().active('a'); // fetched and cached
beam().clearCache(); // next call will refetch
```
