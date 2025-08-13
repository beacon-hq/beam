import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { beam, configureBeam, FeatureFlag } from '../src/index';

let reactAvailable = true;

try {
    await import('react');
    await import('react-test-renderer');
} catch {
    reactAvailable = false;
}

// Minimal Response-like helper
function jsonResponse(data: any, init?: { ok?: boolean; status?: number; statusText?: string }) {
    return {
        ok: init?.ok ?? true,
        status: init?.status ?? 200,
        statusText: init?.statusText ?? 'OK',
        json: async () => data,
    } as Response as any;
}

// Mock client that serves flag values from an in-memory map
function createMockFetch(map: Record<string, { active: boolean; value?: any }>) {
    return async (input: string, init?: RequestInit) => {
        try {
            const body = JSON.parse(init.body as string) as { flag?: string; flags?: string[] };
            if (Array.isArray(body.flags)) {
                const out = Object.fromEntries((body.flags || []).map((f) => [f, map[f] ?? { active: false }]));
                return jsonResponse(out);
            }
            if (typeof body.flag === 'string') {
                const entry = map[body.flag] ?? { active: false };
                return jsonResponse(entry);
            }
        } catch {
            return jsonResponse({}, { ok: false, status: 400, statusText: 'Bad Request' });
        }
        return jsonResponse({}, { ok: false, status: 404, statusText: 'Not Found' });
    };
}

beforeEach(() => {
    // Reset the singleton cache so test requests actually hit our mock fetch
    beam().clearCache();
});

if (reactAvailable) {
    describe('react hooks', () => {
        let React: any;
        let TestRenderer: any;
        let act: any;
        let useFeatureFlag: any;

        beforeAll(async () => {
            React = (await import('react')).default;
            const RTR = await import('react-test-renderer');
            TestRenderer = RTR.default ?? RTR;
            act = RTR.act;
            ({ useFeatureFlag } = await import('../src/react'));
        });

        it('useFeatureFlag returns { featureFlag, status, value, loading, refresh }', async () => {
            // set global fetch for this test
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (globalThis as any).fetch = createMockFetch({
                enabledFlag: { active: true },
            });
            configureBeam();

            let last: (FeatureFlag & { loading: boolean; refresh: () => Promise<void> }) | null = null;

            function Probe() {
                const res = useFeatureFlag('enabledFlag');
                React.useEffect(() => {
                    last = res;
                }, [res.status, res.value, res.loading]);
                return null as any;
            }

            await act(async () => {
                TestRenderer.create(React.createElement(Probe));
                // allow effect + fetch microtask to resolve
                await Promise.resolve();
            });

            expect(last).toEqual(
                expect.objectContaining({ featureFlag: 'enabledFlag', status: true, value: undefined, loading: false }),
            );
            expect(typeof last!.refresh).toBe('function');
        });

        it('useFeatureFlag applies default when inactive and value when active', async () => {
            // set global fetch for this test
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (globalThis as any).fetch = createMockFetch({
                activeFlag: { active: true, value: 'A' },
                inactiveFlag: { active: false },
            });
            configureBeam();

            let activeState: ReturnType<typeof useFeatureFlag<string>> | null = null;
            let inactiveState: ReturnType<typeof useFeatureFlag<string>> | null = null;

            function Probe() {
                const a = useFeatureFlag<string>('activeFlag', { defaultValue: 'def' });
                const b = useFeatureFlag<string>('inactiveFlag', { defaultValue: 'def' });
                React.useEffect(() => {
                    activeState = a;
                    inactiveState = b;
                }, [a.value, a.loading, b.value, b.loading]);
                return null as any;
            }

            await act(async () => {
                TestRenderer.create(React.createElement(Probe));
                await Promise.resolve();
            });

            expect(activeState).toBeTruthy();
            expect(activeState!.loading).toBe(false);
            expect(activeState!.status).toBe(true);
            expect(activeState!.value).toBe('A');

            expect(inactiveState).toBeTruthy();
            expect(inactiveState!.loading).toBe(false);
            expect(inactiveState!.status).toBe(false);
            expect(inactiveState!.value).toBe('def');
        });

        it('useFeatureFlag accepts scope and returns { featureFlag, status, value }', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (globalThis as any).fetch = createMockFetch({
                scoped: { active: true, value: 42 },
            });
            configureBeam();

            let result: { featureFlag: string; status: boolean; value?: any } | null = null;

            function Probe() {
                const res = useFeatureFlag('scoped', {}, { userId: 1 });
                React.useEffect(() => {
                    result = res;
                }, [res.status, res.value]);
                return null as any;
            }

            await act(async () => {
                TestRenderer.create(React.createElement(Probe));
                await Promise.resolve();
            });

            expect(result).toEqual(expect.objectContaining({ featureFlag: 'scoped', status: true, value: 42 }));
        });
    });
} else {
    describe.skip('react hooks (react not installed)', () => {
        it('skipped due to missing peer dependency', () => {
            expect(true).toBe(true);
        });
    });
}
