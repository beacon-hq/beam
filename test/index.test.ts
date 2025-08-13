import { describe, it, expect } from 'vitest';
import DefaultExport, { Beam, beam } from '../src/index';

describe('core exports', () => {
    it('exports Beam class and beam singleton accessor', () => {
        const instance = beam();
        expect(instance).toBeInstanceOf(Beam);
        const direct = new DefaultExport();
        expect(direct).toBeInstanceOf(Beam);
    });
});
