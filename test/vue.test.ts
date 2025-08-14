// @vitest-environment jsdom
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { beam, configureBeam } from '../src';

let vueAvailable = true;
try {
    await import('vue');
    await import('@vue/test-utils');
} catch {
    vueAvailable = false;
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

function createMockFetch(map: Record<string, { active: boolean; value?: any }>) {
    return async (input: string, init?: RequestInit) => {
        const url = String(input);

        // Extract feature flag from URL path
        // The URL format is expected to be: baseUrl/path/featureFlag
        const urlParts = url.split('/');
        const featureFlag = urlParts.length > 0 ? decodeURIComponent(urlParts[urlParts.length - 1]) : null;

        if (featureFlag && map[featureFlag]) {
            return jsonResponse(map[featureFlag]);
        }

        // Fallback to old behavior for other requests
        try {
            const body = JSON.parse(init.body as string) as { flags?: string[] };
            if (Array.isArray(body.flags)) {
                const out = Object.fromEntries((body.flags || []).map((f) => [f, map[f] ?? { active: false }]));
                return jsonResponse(out);
            }
        } catch {
            return jsonResponse({}, { ok: false, status: 400, statusText: 'Bad Request' });
        }
        return jsonResponse({}, { ok: false, status: 404, statusText: 'Not Found' });
    };
}

beforeEach(() => {
    beam().clearCache();
});

if (vueAvailable) {
    describe('vue composables', () => {
        let mount: any;
        let defineComponent: any;
        let nextTick: any;
        let useFeatureFlag: any;
        let useFlagValue: any;

        let dom: any;
        beforeAll(async () => {
            const vue = await import('vue');
            defineComponent = (vue as any).defineComponent;
            nextTick = (vue as any).nextTick;
            mount = (await import('@vue/test-utils')).mount;
            ({ useFeatureFlag } = await import('../src/vue'));
        });

        it('useFeatureFlag returns reactive { featureFlag, status, value }', async () => {
            // set global fetch for this test
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (globalThis as any).fetch = createMockFetch({
                enabledFlag: { active: true },
            });
            configureBeam();

            const Comp = defineComponent({
                name: 'ProbeFlag',
                setup() {
                    const res = useFeatureFlag('enabledFlag');
                    return { res };
                },
                template: '<div />',
            });

            const wrapper = mount(Comp);
            await nextTick();
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
            await new Promise((r) => setTimeout(r, 0));

            // Wait a bit more for async fetch/json chain to settle
            for (let i = 0; i < 5 && !(wrapper.vm as any).res.status; i++) {
                await Promise.resolve();
            }
            const res = (wrapper.vm as any).res;
            expect(res.featureFlag).toBe('enabledFlag');
            expect(res.status).toBe(true);
            expect(res.value).toBeUndefined();
        });

        it('useFeatureFlag applies default when inactive and value when active', async () => {
            // set global fetch for this test
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (globalThis as any).fetch = createMockFetch({
                activeFlag: { active: true, value: 'A' },
                inactiveFlag: { active: false },
            });
            configureBeam();

            const Comp = defineComponent({
                name: 'ProbeValue',
                setup() {
                    const a = useFeatureFlag<string>('activeFlag', { defaultValue: 'def' });
                    const b = useFeatureFlag<string>('inactiveFlag', { defaultValue: 'def' });
                    return { a, b };
                },
                template: '<div />',
            });

            const wrapper = mount(Comp);
            await nextTick();
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
            await new Promise((r) => setTimeout(r, 0));

            // Wait until loading flags settle
            for (let i = 0; i < 5 && ((wrapper.vm as any).a.loading || (wrapper.vm as any).b.loading); i++) {
                await Promise.resolve();
            }

            const vm = wrapper.vm as any;
            expect(vm.a.loading).toBe(false);
            expect(vm.a.status).toBe(true);
            expect(vm.a.value).toBe('A');

            expect(vm.b.loading).toBe(false);
            expect(vm.b.status).toBe(false);
            expect(vm.b.value).toBe('def');
        });

        it('useFeatureFlag accepts scope and returns reactive object', async () => {
            // set global fetch for this test
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (globalThis as any).fetch = createMockFetch({
                scoped: { active: true, value: 100 },
            });
            configureBeam();

            const Comp = defineComponent({
                name: 'ProbeFeature',
                setup() {
                    const res = useFeatureFlag('scoped', {}, { userId: 1 });
                    return { res };
                },
                template: '<div />',
            });

            const wrapper = mount(Comp);
            await nextTick();
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
            await new Promise((r) => setTimeout(r, 0));

            for (let i = 0; i < 5 && !(wrapper.vm as any).res.status; i++) {
                await Promise.resolve();
            }

            const vm = wrapper.vm as any;
            expect(vm.res.featureFlag).toBe('scoped');
            expect(vm.res.status).toBe(true);
            expect(vm.res.value).toBe(100);
        });
    });
} else {
    describe.skip('vue composables (vue/jsdom not installed)', () => {
        it('skipped due to missing peer dependency', () => {
            expect(true).toBe(true);
        });
    });
}
