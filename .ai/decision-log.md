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

---

## 5. Pure Stateless Logic for Analytics Engine (`@meter/analytics`)
- **Status**: Approved.
- **Context**: Deciding how to aggregate developer metrics and qualitative insights for chart rendering.
- **Rationale**: To maximize performance and decoupling, `@meter/analytics` is implemented as a 100% pure, stateless, zero-side-effect library. It has no references to storage APIs or external states, operating purely on arrays of `Event` and `Session` objects. Time-series bucket calculation aligns to strict UTC boundaries, dynamically filling empty gaps with 0 values so that charting components (`Recharts`) can render continuous lines without formatting gaps or visual errors. Qualitative insights use local rule-based heuristics rather than AI/LLM layers to preserve privacy and speed.

---

## 6. Ingestion Sanitization and Sandbox Controls
- **Status**: Approved.
- **Context**: AI log files contain sensitive proprietary source code and raw prompts. Storing these raw contents locally exposes developers to data leakage if databases are extracted.
- **Rationale**: We enforce a strict **Sanitization Guard** in the ingestion loop. Raw prompts, code snippets, and diff payloads are permanently stripped out *before* writing to IndexedDB. Furthermore, we decouple file-watching from parsing, ensuring provider plugins are environment-agnostic. Hot-swapping third-party plugins in the browser is restricted to **Declarative JSON Parsers** or executed inside sandboxed Web Workers to prevent malicious code execution, path traversal, or access to cookies and local storage.

---

## 7. Scaling to 1 Million Events (SQLite WASM, OPFS, LTTB, and Virtualization)
- **Status**: Approved.
- **Context**: Processing and displaying analytics charts for 1,000,000+ logged developer events causes severe main-thread lag and browser crashes.
- **Rationale**: We adopt a multi-layered scaling architecture:
  1. **SQLite OPFS (Origin Private File System)**: Stream IndexedDB records into SQLite WASM running inside a Web Worker, utilizing watermark tracking to load only new items. SQLite OPFS provides persistent relational indexing, bypassing slow JS map-reduce loops.
  2. **LTTB Downsampling**: Downsample large time-series datasets to exactly 1,000 display points before sending messages to the main thread.
  3. **Canvas Charts & UI Virtualization**: Render charts using canvas rendering to reduce DOM nodes, and virtualize event log lists to keep the DOM element count independent of database scale ($O(1)$ complexity).
