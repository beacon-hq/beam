// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { beam, configureBeam } from '../src/index';

// Helpers to build a simple JWT-like token with an exp claim
function base64url(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function makeJwt(expSecondsFromNow: number): string {
  const header = base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + expSecondsFromNow;
  const payload = base64url(JSON.stringify({ exp }));
  return `${header}.${payload}.sig`;
}

describe('Authorization token is added to feature-flag requests', () => {
  beforeEach(() => {
    // Reset any cached flags and reconfigure base URL
    beam().clearCache();
    // Provide a stable baseUrl so our mock can match URLs precisely
    configureBeam({ baseUrl: 'http://example.test' });
    // Clear cookies between tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).document.cookie = '';
  });

  it('retrieves JWT via /beam/token and sends Authorization: Bearer <token> on POST', async () => {
    const token = makeJwt(60); // valid for 60 seconds
    const calls: Array<{ url: string; method: string; headers: Record<string, string> }> = [];

    // Mock fetch: first GET to /beam/token will set cookie, then POST to /beam/feature-flag will respond with a flag
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = async (input: string, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || 'GET').toUpperCase();
      const hdrs: Record<string, string> = {};
      // Normalize headers to a simple object for assertions
      if (init?.headers) {
        const h = init.headers as Record<string, string>;
        for (const [k, v] of Object.entries(h)) hdrs[k] = v as unknown as string;
      }
      calls.push({ url, method, headers: hdrs });

      if (url === 'http://example.test/beam/token' && method === 'GET') {
        // Simulate server setting the cookie that Beam will read
        document.cookie = `BEAM-TOKEN=${encodeURIComponent(token)}; Path=/`;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({}),
        } as Response as any;
      }

      if (url.startsWith('http://example.test/beam/feature-flag/') && method === 'POST') {
        // Respond with an active flag so the call proceeds
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({ active: true }),
        } as Response as any;
      }

      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      } as Response as any;
    };

    const result = await beam().active('some-flag');

    // Ensure the flag call succeeded
    expect(result).toBe(true);

    // We expect two calls: GET /beam/token then POST /beam/feature-flag
    expect(calls.length).toBe(2);
    expect(calls[0].url).toBe('http://example.test/beam/token');
    expect(calls[0].method).toBe('GET');

    expect(calls[1].url).toBe('http://example.test/beam/feature-flag/some-flag');
    expect(calls[1].method).toBe('POST');

    // Assert Authorization header is present with the token we set
    expect(calls[1].headers['Authorization']).toBe(`Bearer ${token}`);
  });
});
