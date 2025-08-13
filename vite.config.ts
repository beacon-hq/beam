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
                      formats: ['es', 'cjs'],
                  },
                  rollupOptions: {
                      // No output emitted in types-only mode other than d.ts via plugin
                      input: {
                          index: 'src/index.ts',
                          react: 'src/react.ts',
                          vue: 'src/vue.ts',
                      },
                      output: {
                          // Keep filenames consistent with package.json
                          entryFileNames: ({ format }) => (format === 'cjs' ? '[name].cjs' : '[name].js'),
                          // Ensure CJS output treats mixed default+named exports as named to avoid warnings
                          exports: 'named',
                      },
                  },
                  sourcemap: true,
              }
            : {
                  lib: {
                      entry: 'src/index.ts',
                      name: 'Beam',
                      formats: ['es', 'cjs'],
                      fileName: (format) => (format === 'cjs' ? 'index.cjs' : 'index.js'),
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
                          entryFileNames: ({ format }) => (format === 'cjs' ? '[name].cjs' : '[name].js'),
                          exports: 'named',
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
