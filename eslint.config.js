// ESLint flat config for ESLint v9+
// Minimal configuration to lint TypeScript in src/ with Prettier compatibility
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-config-prettier';

export default [
  // Ignore common build and generated folders
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '.vitepress/**',
      'docs/.vitepress/**'
    ]
  },

  // TypeScript source files
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
        // No project configuration to avoid requiring type-aware linting
      }
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      // Prefer TS-aware variants and avoid false positives
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      'no-undef': 'off',
      '@typescript-eslint/consistent-type-imports': 'off'
    }
  },

  // Disable rules that conflict with Prettier formatting
  prettier
];
