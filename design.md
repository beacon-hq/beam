### Beam

#### Core SDK (No API Keys)

```typescript
// types/index.ts
export interface BeamConfig {
    baseUrl?: string;
    timeout?: number;
    headers?: Record<string, string>;
}

export interface FeatureFlagValue {
    active: boolean;
    value?: any;
    variant?: string;
}

export interface Context {
    [key: string]: any;
}

// beacon.ts
class Beam {
    private config: BeamConfig;
    private cache: Map<string, FeatureFlagValue> = new Map();

    constructor(config: BeamConfig = {}) {
        this.config = {
            baseUrl: '/beacon', // Default to Laravel proxy routes
            timeout: 5000,
            ...config,
        };
    }

    async active(flag: string, context?: Context): Promise<boolean> {
        const result = await this.get(flag, context);
        return result.active;
    }

    async value<T = any>(flag: string, defaultValue?: T, context?: Context): Promise<T> {
        const result = await this.get(flag, context);
        return result.active ? (result.value ?? defaultValue) : defaultValue;
    }

    async get(flag: string, context?: Context): Promise<FeatureFlagValue> {
        const cacheKey = this.getCacheKey(flag, context);

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        try {
            const result = await this.fetchFlag(flag, context);
            this.cache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.warn(`Failed to fetch flag ${flag}:`, error);
            return { active: false };
        }
    }

    async all(flags: string[], context?: Context): Promise<Record<string, FeatureFlagValue>> {
        try {
            const response = await fetch(`${this.config.baseUrl}/flags`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...this.getAuthHeaders(),
                    ...this.config.headers,
                },
                body: JSON.stringify({
                    flags,
                    context,
                }),
                signal: AbortSignal.timeout(this.config.timeout!),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.warn('Failed to fetch flags:', error);
            return flags.reduce(
                (acc, flag) => {
                    acc[flag] = { active: false };
                    return acc;
                },
                {} as Record<string, FeatureFlagValue>,
            );
        }
    }

    for(context: Context): BeaconContext {
        return new BeaconContext(this, context);
    }

    clearCache(): void {
        this.cache.clear();
    }

    private async fetchFlag(flag: string, context?: Context): Promise<FeatureFlagValue> {
        const url = `${this.config.baseUrl}/flags/${flag}`;
        const method = context ? 'POST' : 'GET';
        const body = context ? JSON.stringify({ context }) : undefined;

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...this.getAuthHeaders(),
                ...this.config.headers,
            },
            body,
            signal: AbortSignal.timeout(this.config.timeout!),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    private getAuthHeaders(): Record<string, string> {
        const headers: Record<string, string> = {};

        // For Sanctum SPA authentication
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) {
            headers['X-CSRF-TOKEN'] = token;
        }

        // For Sanctum API tokens (if stored in localStorage/sessionStorage)
        const apiToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (apiToken) {
            headers['Authorization'] = `Bearer ${apiToken}`;
        }

        return headers;
    }

    private getCacheKey(flag: string, context?: Context): string {
        return context ? `${flag}:${JSON.stringify(context)}` : flag;
    }
}

class BeaconContext {
    constructor(
        private beacon: Beacon,
        private context: Context,
    ) {}

    active(flag: string): Promise<boolean> {
        return this.beacon.active(flag, this.context);
    }

    value<T = any>(flag: string, defaultValue?: T): Promise<T> {
        return this.beacon.value(flag, defaultValue, this.context);
    }

    get(flag: string): Promise<FeatureFlagValue> {
        return this.beacon.get(flag, this.context);
    }

    all(flags: string[]): Promise<Record<string, FeatureFlagValue>> {
        return this.beacon.all(flags, this.context);
    }
}
```

### Echo-Style Authentication Setup

#### For Session-Based Auth (Inertia.js)

```typescript
// app.ts (Inertia setup)
import { createInertiaApp } from '@inertiajs/react';
import { beacon } from './beacon';

createInertiaApp({
    // ... other config
    setup({ el, App, props }) {
        // Configure Beacon with session auth
        beacon({
            baseUrl: '/beacon',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
        });

        // ... render app
    },
});
```

#### For Sanctum SPA Auth

```typescript
// auth.ts
import axios from 'axios';
import { beacon } from './beacon';

// Initialize Sanctum
await axios.get('/sanctum/csrf-cookie');

// Login and get token
const response = await axios.post('/login', credentials);
const token = response.data.token;

// Store token
localStorage.setItem('auth_token', token);

// Configure Beacon
beacon({
    baseUrl: '/api/beacon', // Use API routes
    headers: {
        Authorization: `Bearer ${token}`,
    },
});
```

### Usage Examples

#### Frontend Usage (Same API, Secure Backend)

```typescript
// Initialize (no API key needed!)
const beacon = new Beacon({
    baseUrl: '/beacon', // Uses Laravel proxy
});

// Usage remains the same
if (await beacon.active('new-dashboard')) {
    // Show new dashboard
}

const theme = await beacon.value('ui-theme', 'default');

// With user context (automatically includes auth user)
const userFlags = await beacon
    .for({
        experiment_group: 'beta',
    })
    .all(['feature-a', 'feature-b']);
```

#### React Hook with Auth Context

```typescript
export function useFeatureFlag(flag: string, context?: Context) {
    const { user } = usePage().props; // Inertia.js
    const [isActive, setIsActive] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // User context is automatically included by the proxy
        beacon()
            .active(flag, context)
            .then(setIsActive)
            .finally(() => setLoading(false));
    }, [flag, context, user?.id]); // Re-fetch when user changes

    return { isActive, loading };
}
```

### Key Security Benefits

#### ✅ **No Frontend API Keys**

- API keys stay server-side only
- Frontend uses standard Laravel authentication

#### ✅ **Familiar Laravel Patterns**

- Uses existing auth middleware
- Works with Sanctum, session auth, or any Laravel auth guard
- Follows Echo's authentication approach

#### ✅ **Seamless Integration**

- Works with existing Pennant setup
- No changes needed to existing Feature::active() calls
- Proxy routes can use Pennant directly for better performance

#### ✅ **Flexible Architecture**

- Can proxy through Pennant (recommended) or directly to Beacon API
- Supports both session-based and token-based authentication
- Easy to customize context building logic

This approach provides the security of server-side API key management while maintaining the convenience and performance of client-side feature flag checks, following established Laravel patterns that developers are already familiar with.
