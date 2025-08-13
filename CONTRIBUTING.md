# Contributing

Thanks for your interest in contributing!

## Setup

1. Ensure Node.js >= 18 is installed.
2. Install dependencies:

    npm install

3. Validate the project:

    npm run typecheck
    npm run lint
    npm test

4. Build the library:

    npm run build

## Scripts

- npm run build — build ESM and CJS bundles and generate types
- npm run test — run unit tests
- npm run typecheck — TypeScript type-check only
- npm run lint — ESLint checks
- npm run format — format with Prettier

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org) format for all commit messages.

## Pull requests

- Include tests for new features/bug fixes
- Update documentation if needed
- Ensure CI checks pass
