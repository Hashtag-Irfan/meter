# Architectural Decision Log (ADR)

This document tracks all critical design decisions made during the METER project, detailing the context, options, and rationale.

---

## 1. Migrate apps from Next.js to Vite SPA
- **Status**: Approved.
- **Context**: The repository originally bootstrapped `apps/dashboard` and `apps/website` using Next.js 15.
- **Rationale**: METER is a local-first application. Next.js static exports (`output: "export"`) disable essential routing and server-side components. Furthermore, Next.js build outputs do not load natively inside Chrome MV3 Extension packages due to path prefix constraints and Content Security Policies. Using Vite provides a lightweight React SPA that compiles in milliseconds and is fully compatible with side panels.

---

## 2. Decouple Node.js Imports from Provider Plugins
- **Status**: Approved.
- **Context**: Initial designs of `packages/providers` used standard Node APIs (`node:fs`, `node:os`) to locate and watch files.
- **Rationale**: Web browsers and Chrome extensions do not support Node modules. Including them causes browser build failures. We split the architecture so that provider plugins are *pure parsers* (operating on input strings). The active running shell/host environment handles file reading and passes raw strings to the parser, making the plugins 100% web-safe.

---

## 3. Implement Hybrid Storage Model
- **Status**: Approved.
- **Context**: Aggregating millions of events using custom Javascript filters on IndexedDB tables can cause UI lag.
- **Rationale**: We will retain IndexedDB as the durable append-only write store because of extension service worker safety. However, the dashboard will spin up a transient in-memory SQLite WASM database on boot, loading raw IndexedDB events to run standard relational SQL aggregations (`GROUP BY`, `SUM`, `AVG`). This eliminates slow JS map-reduce iteration loops.

---

## 4. Disintegrate `@meter/shared` Package
- **Status**: Approved.
- **Context**: A global `shared` package coupled database configuration with theme variables.
- **Rationale**: Visual theme constants (e.g. sidebar width, chart colors) are moved to `@meter/ui`. Types and constants are moved to their respective package domains (e.g. `@meter/storage`) to prevent global Turborepo cache invalidations on minor UI modifications.
