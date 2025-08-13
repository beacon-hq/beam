import { describe, it, expect, afterEach } from 'vitest';
import DefaultExport, { Beam as NamedBeam, beam } from '../src/index';

// Ensure we clean up any globals we set during tests
afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g: any = globalThis as any;
    delete g.Beam;
});

describe('exports correctly', () => {
    it('default export is the Beam class', () => {
        expect(DefaultExport).toBe(NamedBeam);
        // Sanity: default export should be constructible
        const instance = new DefaultExport();
        expect(instance).toBeInstanceOf(NamedBeam);
    });

    it('beam({ global: true }) registers singleton on globalThis.Beam', () => {
        const instance = beam({ global: true });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g: any = globalThis as any;
        expect(g.Beam).toBe(instance);
    });

    it('beam({ global: "Beam" }) registers singleton on globalThis.Beam', () => {
        const instance = beam({ global: 'Beam' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g: any = globalThis as any;
        expect(g.Beam).toBe(instance);
    });
});
