/**
 * Beam
 *
 * This library provides a TypeScript library for Laravel Pennant feature flags
 */
export interface BeamConfig {
    baseUrl?: string;
    path?: string;
    defaultScope?: Scope;
    headers?: Record<string, string>;
    timeout?: number;
    global?: boolean | string;
}

export interface FeatureFlag {
    featureFlag: string;
    status: boolean;
    value?: unknown;
}

export type Scope = Record<string, unknown>;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function configureBeam(options?: BeamConfig): void {
    if (options == null) return;

    const hasConfigKeys =
        typeof options.baseUrl !== 'undefined' ||
        typeof options.path !== 'undefined' ||
        typeof options.headers !== 'undefined' ||
        typeof options.timeout !== 'undefined' ||
        typeof options.global !== 'undefined';

    let cfg: BeamConfig = {};
    if (hasConfigKeys) {
        cfg = {
            ...(typeof options.baseUrl === 'string' ? { baseUrl: options.baseUrl } : {}),
            ...(typeof options.path === 'string' ? { path: options.path } : {}),
            ...(typeof options.timeout === 'number' ? { timeout: options.timeout } : {}),
            ...(options.headers && typeof options.headers === 'object' ? { headers: options.headers } : {}),
            ...(typeof options.defaultScope !== 'undefined' ? { defaultScope: options.defaultScope } : {}),
            ...(typeof options.global !== 'undefined' ? { global: options.global } : {}),
        };
    }

    _beamSingleton = new Beam(cfg);
}

function stripTrailingSlash(s: string): string {
    return s.replace(/\/$/, '');
}

function normalizePath(p: string): string {
    if (!p.startsWith('/')) return '/' + p.replace(/\/+$/, '');
    return p.replace(/\/+$/, '');
}

function getFetch(): FetchLike {
    if (typeof fetch !== 'undefined') {
        return fetch as any as FetchLike;
    }
    throw new Error('No fetch available. Please provide a global fetch implementation.');
}

export class Beam {
    private readonly config: BeamConfig;
    private cache: Map<string, FeatureFlag> = new Map();

    constructor(config: BeamConfig = {}) {
        const defaultBase = this.getBaseUrl();

        const baseUrl = stripTrailingSlash(config.baseUrl ?? defaultBase);
        const path = normalizePath(config.path ?? '/beam/feature-flag');

        this.config = {
            ...config,
            baseUrl,
            path,
            timeout: typeof config.timeout === 'number' ? config.timeout : 5000,
        };
    }

    async active(flag: string, scope?: Scope): Promise<boolean> {
        const result = await this.get(flag, scope);
        return result.status;
    }

    async inactive(flag: string, scope?: Scope): Promise<boolean> {
        const result = await this.get(flag, scope);
        return !result.status;
    }

    async value<T = unknown>(flag: string, defaultValue?: T, scope?: Scope): Promise<T> {
        const result = await this.get(flag, scope);
        return result.status ? ((result.value as T | undefined) ?? (defaultValue as T)) : (defaultValue as T);
    }

    async get(featureFlag: string, scope?: Scope): Promise<FeatureFlag> {
        const effectiveScope = scope ?? this.config.defaultScope;
        const cacheKey = this.getCacheKey(featureFlag, effectiveScope);

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        try {
            const result = await this.fetchFlag(featureFlag, effectiveScope);
            this.cache.set(cacheKey, result);
            return result;
        } catch (error) {
            // Avoid throwing in application flow; surface diagnostic and return inactive
            if (typeof console !== 'undefined' && console.warn) {
                console.warn(`Failed to fetch flag ${featureFlag}:`, error);
            }
            return { featureFlag, status: false };
        }
    }

    clearCache(): void {
        this.cache.clear();
    }

    private fetchFlag(flag: string, scope?: Scope): Promise<FeatureFlag> {
        const url = `${this.config.baseUrl}${this.config.path}`;
        const payload: Record<string, unknown> = { flag };
        if (scope && Object.keys(scope).length > 0) payload['scope'] = scope;
        const body = JSON.stringify(payload);

        return getFetch()(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...this.getAuthHeaders(),
                ...this.config.headers,
            },
            body,
            signal: this.getAbortSignal(),
        } as RequestInit).then(async (response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const raw = (await response.json()) as any;
            // Normalize to FeatureFlag shape
            const status = typeof raw.status === 'boolean' ? raw.status : !!raw.active;
            const value = raw.value;
            const out: FeatureFlag = { featureFlag: flag, status };
            if (status && typeof value !== 'undefined') out.value = value;
            return out;
        });
    }

    private getBaseUrl(): string {
        if (typeof window !== 'undefined') {
            return `${window.location.protocol}//${window.location.host}`;
        }

        if (typeof process !== 'undefined' && (process as any)?.env?.SERVER_URL) {
            return (process as any).env.SERVER_URL;
        }

        return 'http://localhost';
    }

    private getAuthHeaders(): Record<string, string> {
        const headers: Record<string, string> = {};

        // CSRF token (Sanctum SPA)
        if (typeof document !== 'undefined') {
            const meta = document.querySelector('meta[name="csrf-token"]');
            const token = meta?.getAttribute('content') ?? undefined;
            if (token) {
                headers['X-CSRF-TOKEN'] = token;
            }
        }

        // Bearer token (Sanctum API tokens)
        let apiToken: string | null = null;
        try {
            if (typeof localStorage !== 'undefined') {
                apiToken = localStorage.getItem('auth_token');
            }
            if (!apiToken && typeof sessionStorage !== 'undefined') {
                apiToken = sessionStorage.getItem('auth_token');
            }
        } catch {
            // Accessing storage may throw in some environments; ignore
        }

        if (apiToken) {
            headers['Authorization'] = `Bearer ${apiToken}`;
        }

        return headers;
    }

    private getCacheKey(flag: string, scope?: Scope): string {
        return scope ? `${flag}:${JSON.stringify(scope)}` : flag;
    }

    private getAbortSignal(): AbortSignal | undefined {
        const timeout = this.config.timeout ?? 0;
        if (!timeout) return undefined;

        // Prefer AbortSignal.timeout when available
        try {
            const AnyAbortSignal: any = AbortSignal as any;
            if (typeof AnyAbortSignal?.timeout === 'function') {
                return AnyAbortSignal.timeout(timeout) as AbortSignal;
            }
        } catch {
            // fall through
        }

        // Fallback for environments without AbortSignal.timeout
        try {
            const controller = new AbortController();
            setTimeout(() => {
                try {
                    controller.abort();
                } catch {}
            }, timeout);
            return controller.signal;
        } catch {
            return undefined;
        }
    }
}

let _beamSingleton: Beam | null = null;
export function beam(config?: BeamConfig): Beam {
    const create = (cfg?: BeamConfig) => {
        const instance = new Beam(cfg ?? {});
        const globalOpt = cfg?.global;
        if (globalOpt) {
            const name = typeof globalOpt === 'string' ? globalOpt : 'Beam';
            try {
                // Attach to globalThis without throwing on read-only envs
                (globalThis as any)[name] = instance;
            } catch {
                // ignore
            }
        }
        return instance;
    };

    if (!_beamSingleton) {
        _beamSingleton = create(config);
        return _beamSingleton;
    }
    if (config) {
        _beamSingleton = create(config);
    }
    return _beamSingleton;
}

export default Beam;
