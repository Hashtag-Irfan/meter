# Contributing to METER

Thank you for your interest in contributing! METER is an open-source project and contributions of all kinds are welcome.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20.0.0
- **pnpm** ≥ 9.0.0

```bash
npm install -g pnpm
```

### Setup

```bash
git clone https://github.com/your-org/meter.git
cd meter
pnpm install
```

### Development

```bash
# Start all apps in watch mode
pnpm dev

# Start only a specific app
pnpm --filter @meter/dashboard dev

# Run tests across all packages
pnpm test

# Typecheck everything
pnpm typecheck

# Lint
pnpm lint
```

---

## Project Structure

```
meter/
├── apps/
│   ├── dashboard/     # Next.js dashboard (main user-facing app)
│   ├── extension/     # Chrome extension (Manifest V3)
│   └── website/       # Marketing website
└── packages/
    ├── analytics/     # Metric computation (pure functions only)
    ├── providers/     # Provider plugin system
    ├── shared/        # Shared types + constants + utilities
    ├── storage/       # IndexedDB wrapper
    └── ui/            # Shared React components
```

---

## Contribution Guidelines

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Cursor provider adapter
fix: correct token count off-by-one in Claude Code parser
chore: update dependencies
docs: add provider plugin guide
test: add unit tests for truncateToPeriod util
```

### Branch Naming

```
feat/cursor-provider
fix/claude-token-parsing
chore/update-deps
docs/plugin-guide
```

### Code Standards

- **TypeScript strict mode** — no `any`, no type assertions without justification
- **No `console.log`** — use `console.warn` / `console.error` for legitimate warnings
- **Test new code** — every new function in `packages/` should have a Vitest test
- **Pure analytics** — functions in `@meter/analytics` must be pure (no side effects)
- **No coupling** — `apps/dashboard` must not import from `packages/providers` directly

### Pull Requests

1. Reference the related issue (`Closes #123`)
2. Fill out the PR template completely
3. Ensure CI passes: `pnpm typecheck && pnpm lint && pnpm test`
4. Keep PRs focused — one feature or fix per PR

---

## Adding a New Provider

1. Create `packages/providers/src/adapters/<provider-id>/index.ts`
2. Implement the `ProviderPlugin` interface from `@meter/shared`
3. Register it in `packages/providers/src/registry.ts`
4. Add fixture log files to `packages/providers/src/adapters/<provider-id>/__fixtures__/`
5. Write tests that parse the fixtures and assert normalized output
6. Add the provider to the pricing table in `packages/shared/src/constants.ts` (if applicable)
7. Open a PR — include a sample log file (anonymized) in the description

---

## Architecture Constraints

> These are non-negotiable for the health of the project.

| Rule | Reason |
|------|--------|
| No network requests from the dashboard | Privacy first |
| `@meter/analytics` must be pure functions | Testable, predictable |
| Dashboard never imports from `@meter/providers` | Decoupling |
| All provider data goes through `@meter/storage` | Single source of truth |
| No `any` in TypeScript | Reliability |

---

## Reporting Issues

Use the issue templates:
- **Bug report** — unexpected behavior
- **Feature request** — new functionality

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
