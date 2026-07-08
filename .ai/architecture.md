# System Architecture: METER

METER is structured as a decoupled monorepo managed with Turborepo and `pnpm` workspaces.

---

## 1. Directory Structure & Packages

```
meter/
├── apps/
│   ├── dashboard/          # Vite-based React SPA (Local Analytics UI)
│   ├── extension/          # Chrome MV3 Side Panel Extension
│   └── website/            # Marketing Landing Page
└── packages/
    ├── analytics/          # Pure functions for calculations (stateless)
    ├── providers/          # Registry and decoupled parsing adapters
    ├── storage/            # IndexedDB Repositories & Storage Service
    └── ui/                 # Shared Tailwind styles and React components
```

---

## 2. Ingestion & Storage Architecture (Hybrid Model)

To guarantee high write performance and flexible query operations:

```
[Local Logs (OS)]
       ↓ (Ingested via File System Access API or local Daemon)
[decoupled Provider Parser]
       ↓ (ParsedEvent normalization)
[IndexedDB Raw Store] (Persistent, Lightweight, Extension-safe)
       ↓ (On Dashboard / UI boot)
[In-Memory SQLite WASM] (Fast, Relational Aggregations)
       ↓
[Charts & Dashboards]
```

### Ingestion Details
- **IndexedDB**: The primary durable database. Fast, lightweight, supported natively in extensions.
- **SQLite WASM**: Instantiated temporarily in-memory on dashboard launch. Raw IndexedDB data is loaded, and standard SQL queries are executed for charts and metrics (eliminating slow JavaScript map-reduce loops).

---

## 3. Provider Decoupling Principle

Provider plugins in `packages/providers` must be **completely environment-agnostic**:
- They must **never** import Node modules like `node:fs` or `node:os`.
- The parser only implements `parse(raw: string): Promise<ParsedEvent[]>`.
- The running host environment (CLI, Chrome Extension, or Desktop App) reads the files and passes the raw text strings to the plugin, ensuring compatibility across browser and server contexts.
