# Coding Rules & Technical Guidelines

All code written for the METER repository must adhere to the following rules to ensure performance, type-safety, and test coverage.

---

## 1. TypeScript Strict Constraints

- **No `any`**: Explicitly type all variables, arguments, and return signatures.
- **Index Signatures**: Follow `noPropertyAccessFromIndexSignature`. Always use bracket notation when accessing index signatures (e.g. `payload["model"]` instead of `payload.model`).
- **Imports**: Use explicit `.js` extensions for local module imports in ESM packages (e.g. `import { db } from "./db.js"`).

---

## 2. Pure Calculations in Analytics

All files under `packages/analytics` must contain **pure functions**:
- Functions must have **no side effects**.
- They must not open database connections or read from local files directly.
- All dependencies (sessions, events) must be explicitly passed as function parameters to guarantee testability.

---

## 3. Provider Sandboxing

All provider parser calls in `@meter/providers` must be executed within a try-catch-timeout boundary inside the host manager:
- If a plugin throws an error or hangs, it must be deactivated without interrupting the host system.
- Plugins are prohibited from making direct network fetches or accessing system directories outside their declared log folders.

---

## 4. Testing & Quality Thresholds

- **Unit Tests**: Mandatory for all utility calculations, DB repositories, and parsers.
- **Coverage**: Target **80% line and branch coverage** on `@meter/storage` and `@meter/analytics`.
- **Pre-Commit Checks**: Commit hook enforces TypeScript type-checking (`tsc --noEmit`), linting (`eslint`), and formatting (`prettier`) before allowing commits.
