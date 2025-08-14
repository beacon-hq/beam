import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// Vite library build configuration with dual outputs (ESM + CJS)
export default defineConfig(({ mode }) => {
    const isTypesBuild = mode === 'types';

    return {
        build: isTypesBuild
            ? {
                  // Skip JS bundling when generating only types via plugin
                  emptyOutDir: false,
                  lib: {
                      entry: 'src/index.ts',
                      name: 'Beam',
                      formats: ['es'],
                  },
                  rollupOptions: {
                      // No output emitted in types-only mode other than d.ts via plugin
                      input: {
                          index: 'src/index.ts',
                          react: 'src/react.ts',
                          vue: 'src/vue.ts',
                      },
                      output: {
                          // ESM-only filenames
                          entryFileNames: '[name].js',
                      },
                  },
                  sourcemap: true,
              }
            : {
                  lib: {
                      entry: 'src/index.ts',
                      name: 'Beam',
                      formats: ['es'],
                      fileName: () => 'index.js',
                  },
                  sourcemap: true,
                  rollupOptions: {
                      input: {
                          index: 'src/index.ts',
                          react: 'src/react.ts',
                          vue: 'src/vue.ts',
                      },
                      external: [
                          // Keep peer deps external to keep bundle small and avoid bundling React/Vue
                          'react',
                          'vue',
                      ],
                      output: {
                          entryFileNames: '[name].js',
                      },
                  },
              },
        plugins: [
            dts({
                entryRoot: 'src',
                outDir: 'dist',
                insertTypesEntry: true,
                copyDtsFiles: false,
                // Emit only d.ts in types mode, and skip diagnostics in regular build for speed
                // but we still run tsc in typecheck script for full validation
                skipDiagnostics: false,
            }),
        ],
        test: {
            environment: 'node',
            include: ['test/**/*.test.ts'],
            coverage: {
                reporter: ['text', 'html'],
                reportsDirectory: 'coverage',
            },
        },
    };
});
