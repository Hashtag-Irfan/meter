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

---

## 8. Integrated Testing and Quality Assurance Framework
- **Status**: Approved.
- **Context**: Resolving how to validate IndexedDB stores, dynamic parser inputs, visual styling layouts, and Extension sandbox constraints without regressions.
- **Rationale**: We set up a tiered verification pipeline:
  1. **Vitest + fake-indexeddb**: Run in-memory repository tests on every push.
  2. **Playwright Extension Test Container**: Simulates folder select/directory handles and browser side panel contexts in a mock Chromium runtime.
  3. **Axe-core and Visual Regression Diffs**: Automated checks for WCAG 2.1 AA and light/dark theme layout shifts in Playwright.
  4. **Release Gate Enforcement**: CI pipelines require 90%+ code coverage, 0 accessibility alerts, and < 0.05% visual diff threshold to compile a production bundle.

---

## 9. Design System Tokens & Unified CSS Property Architecture
- **Status**: Approved.
- **Context**: Designing the dashboard visually to look modern, vibrant, and cohesive while preventing style drift.
- **Rationale**: We establish a unified CSS custom property architecture centered around a dark-mode-first HSL palette. Core layouts rely on glassmorphism visual styling (blur filters, fine border cards, backdrop washes) to look clean and premium. All interactive components must implement WCAG 2.1 AA contrast standards, keyboard focus rings, and screen-reader `aria-` attributes, with styling adjustments respecting users' reduced-motion preferences.

---

## 10. Internal Package APIs & Event-Driven Synchronization
- **Status**: Approved.
- **Context**: Standardizing communication patterns and method signatures across storage, analytics, provider registry, and extensions to prevent structural drift.
- **Rationale**: We define strict TypeScript interfaces for storage repositories (`SessionsRepository`, `EventsRepository`) and stateless analytics engines (`calculateMetrics`, `generateTimeSeries`, `generateInsights`). Extension messaging uses declarative `ExtensionMessage` JSON envelopes, and local backup exports enforce a versioned JSON schema. The provider parser lifecycle tracks state transitions (`Unloaded` -> `Loaded` -> `Initialized` -> `Active` -> `Error`), guaranteeing sandbox isolation.

---

## 11. Open Source Branching, PR Workflows, and Commit Standards
- **Status**: Approved.
- **Context**: Managing contributions from developers without compromising git history cleanliness or codebase health.
- **Rationale**: METER enforces Conventional Commits with specific scopes (`shared`, `storage`, `providers`, `analytics`, `dashboard`, `extension`, `website`) and adopts Trunk-Based Development. Release verification pipelines run pre-commit Husky hooks and CI gates (lint, typecheck, unit test execution). Pull requests require at least one maintainer review approval and 100% green status checks before merging.

---

## 12. User Persona Metrics & Journey Maps
- **Status**: Approved.
- **Context**: Tailoring dashboard visualizations, daily bulletins, and alerts to address different developer archetypes.
- **Rationale**: Based on UX interviews, we align METER's analytics focus directly with user personas:
  1. **Senior Dev / Startup Founder**: Prioritize USD spend limits and infinite prompt loop warnings.
  2. **Freelancer / Agency**: Prioritize project-level workspace filters and exportable Markdown standup bulletins.
  3. **Junior Dev**: Focus on reject/accept ratio metrics to diagnose learning efficiency.
  This structures the database index designs and visualization priorities.

---

## 13. Consensus METER Core v1.0 Blueprint (Vercel, GitHub, Cloudflare, Linear, Raycast, OpenAI)
- **Status**: Approved.
- **Context**: Consolidating feedback from a panel of engineers to review monorepo structures, tooling duplication, runtime performance, and parsing accuracy.
- **Rationale**: We define the target v1.0 blueprint:
  1. **Core Package Consolidation**: Introduce `@meter/core` to hold schema types and BPE tokenizer models.
  2. **Vite Consolidation**: Unify dashboard and extension apps under a single Vite compiler.
  3. **Web Worker Offloading**: Run log parsing and SQLite WASM inside a background Web Worker to preserve main thread framerates.
  4. **Cross-Tab Sync**: Use the Broadcast Channel API to synchronize storage updates across active tabs in real-time.

---

## 14. Principal Security Controls (Strict CSP, WebCrypto AES-GCM, and Sandboxed Iframes)
- **Status**: Approved.
- **Context**: Design specifications for mitigating prompt/code leakage, dynamic plugin exploits, and data exfiltration.
- **Rationale**: We enforce three core security mitigations:
  1. **Network-Free CSP**: Declare `connect-src 'none'` inside Manifest V3 extension pages, blocking all data exfiltration pathways.
  2. **WebCrypto Database Encryption**: Allow users to encrypt local IndexedDB files using AES-GCM-256 with key derivation (PBKDF2) from a volatile user passphrase.
  3. **Sandboxed Iframes**: Dynamic Javascript parsers are executed inside a hidden, privilege-free iframe to prevent access to DOM or extension APIs.

---

## 15. Extreme Performance Scaling (Database Sharding & Incremental Snapshots)
- **Status**: Approved.
- **Context**: Scaling METER to handle 1,000,000 events across 100 providers spanning 10 years of history.
- **Rationale**: We implement chronological database sharding (splitting stores by year) to reduce index tree depths, and maintain a pre-aggregated `snapshots` table for daily/weekly/monthly metrics. This reduces dashboard query complexities from linear scans ($O(N)$) to instant lookups ($O(1)$) and avoids loading large datasets into RAM by utilizing streamed IndexedDB cursors.

---

## 16. QA Verification Framework & Provider Log Snapshot Testing
- **Status**: Approved.
- **Context**: Guarding against regressions inside provider parsing adapters when coding assistants update their log schemas.
- **Rationale**: We enforce strict schema snapshot testing in Vitest, matching parser output structures against verified log fixtures. Playwright automates extension testing by mocking `window.showDirectoryPicker` to return mock directory handles, and axe-core checks WCAG 2.1 AA compliance during E2E executions. Production builds require meeting strict release gates (branch coverage bounds, < 0.05% visual diff, and < 300ms query performance).
