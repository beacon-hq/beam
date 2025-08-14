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
    tokenPath?: string; // Path to retrieve JWT via cookie (GET)
    tokenCookie?: string; // Cookie name that carries the JWT
    clockSkewSeconds?: number; // Allowed clock skew when validating JWT exp
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
    private jwtToken: string | null = null;
    private jwtExp: number | null = null; // seconds since epoch

    constructor(config: BeamConfig = {}) {
        const defaultBase = this.getBaseUrl();

        const baseUrl = stripTrailingSlash(config.baseUrl ?? defaultBase);
        const path = normalizePath(config.path ?? '/beam/feature-flag');

        this.config = {
            ...config,
            baseUrl,
            path,
            timeout: typeof config.timeout === 'number' ? config.timeout : 5000,
            tokenPath: normalizePath(config.tokenPath ?? '/beam/token'),
            tokenCookie: config.tokenCookie ?? 'BEAM-TOKEN',
            clockSkewSeconds: typeof config.clockSkewSeconds === 'number' ? config.clockSkewSeconds : 30,
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

    private async fetchFlag(featureFlag: string, scope?: Scope): Promise<FeatureFlag> {
        const url = `${this.config.baseUrl}${this.config.path}/${encodeURIComponent(featureFlag)}`;
        if (scope === undefined || Object.keys(scope).length === 0) {
            scope = {};
        }
        const body = JSON.stringify(scope);

        await this.ensureToken();

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
            credentials: 'same-origin',
        } as RequestInit).then(async (response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const raw = (await response.json()) as any;
            const status = typeof raw.status === 'boolean' ? raw.status : !!raw.active;
            const value = raw.value;
            const out: FeatureFlag = { featureFlag, status };

            if (status && typeof value !== 'undefined') {
                out.value = value;
            }

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

        // Authorization via JWT obtained from /beam/token cookie
        if (this.jwtToken) {
            headers['Authorization'] = `Bearer ${this.jwtToken}`;
        }

        return headers;
    }

    private isJwtValid(): boolean {
        if (!this.jwtToken || !this.jwtExp) return false;
        const skew = this.config.clockSkewSeconds ?? 30;
        const now = Math.floor(Date.now() / 1000);
        return now + skew < this.jwtExp;
    }

    private decodeJwtExp(token: string): number | null {
        try {
            const parts = token.split('.');
            if (parts.length < 2) return null;
            const payload = parts[1]!;
            const json = JSON.parse(this.base64UrlDecode(payload));
            const exp = typeof json.exp === 'number' ? json.exp : null;
            return exp ?? null;
        } catch {
            return null;
        }
    }

    private base64UrlDecode(input: string): string {
        try {
            const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
            if (typeof atob !== 'undefined') {
                return decodeURIComponent(
                    Array.prototype.map
                        .call(atob(padded), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                        .join(''),
                );
            }
            // Node.js fallback when Buffer is available
            const B: any = (globalThis as any).Buffer;
            if (B && typeof B.from === 'function') {
                const buf = B.from(padded, 'base64');
                return buf.toString('utf-8');
            }
            return '';
        } catch {
            return '';
        }
    }

    private readCookie(name: string): string | null {
        if (typeof document === 'undefined') return null;
        const cookies = document.cookie ? document.cookie.split('; ') : [];
        for (const c of cookies) {
            if (!c) continue;
            const idx = c.indexOf('=');
            const k = idx === -1 ? c : c.slice(0, idx);
            if (k === name) {
                const v = idx === -1 ? '' : c.slice(idx + 1);
                try {
                    return decodeURIComponent(v);
                } catch {
                    return v;
                }
            }
        }
        return null;
    }

    private async ensureToken(): Promise<void> {
        // If running outside browser, skip
        if (typeof window === 'undefined') return;

        if (this.isJwtValid()) return;

        try {
            const tokenUrl = `${this.config.baseUrl}${this.config.tokenPath}`;
            await getFetch()(tokenUrl, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
                signal: this.getAbortSignal(),
            } as RequestInit);
        } catch {
            // ignore network errors here; we'll attempt to use whatever cookie may exist
        }

        const cookieName = this.config.tokenCookie ?? 'BEAM-TOKEN';
        const token = this.readCookie(cookieName);

        if (token) {
            this.jwtToken = token;
            this.jwtExp = this.decodeJwtExp(token);
            if (!this.jwtExp) {
                // If no exp, clear to force refresh next time
                this.jwtToken = null;
            }
        } else {
            this.jwtToken = null;
            this.jwtExp = null;
        }
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
