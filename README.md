<div align="center">
  <h1>⬡ METER</h1>
  <p><strong>Privacy-first, open-source analytics for AI coding assistants.</strong></p>
  <p>Track your usage of Claude Code, Codex, Cursor — and more. All data stays on your device.</p>

  <p>
    <a href="#quick-start">Quick Start</a> ·
    <a href="#architecture">Architecture</a> ·
    <a href="CONTRIBUTING.md">Contributing</a> ·
    <a href="#roadmap">Roadmap</a>
  </p>

  <p>
    <img alt="CI" src="https://github.com/your-org/meter/actions/workflows/ci.yml/badge.svg" />
    <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" />
  </p>
</div>

---

## What is METER?

METER is the analytics platform AI-assisted developers open **every day**. It answers the questions you actually care about:

- How many tokens did I burn this week?
- What's my estimated cost per provider?
- What percentage of completions do I actually accept?
- When am I most productive with AI?

**Everything runs locally.** No accounts. No telemetry. No cloud. Your data never leaves your machine.

---

## Supported Providers

| Provider | Status |
|----------|--------|
| Claude Code | 🚧 In progress |
| Codex | 🗓 Planned |
| Cursor | 🗓 Planned |
| Gemini CLI | 🗓 Planned |
| GitHub Copilot | 🗓 Planned |
| Cline | 🗓 Planned |
| Roo Code | 🗓 Planned |
| Continue.dev | 🗓 Planned |
| Aider | 🗓 Planned |

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9

```bash
# Install pnpm if you haven't already
npm install -g pnpm
```

### Installation

```bash
git clone https://github.com/your-org/meter.git
cd meter
pnpm install
```

### Development

```bash
# Run all apps in dev mode
pnpm dev

# Run only the dashboard
pnpm --filter @meter/dashboard dev
```

### Build

```bash
pnpm build
```

---

## Architecture

METER is a Turborepo monorepo with a strict layered architecture:

```
Analytics Engine  (@meter/analytics)
      ↓
Provider Adapter  (@meter/providers)
      ↓
Storage Layer     (@meter/storage)
      ↓
Dashboard         (apps/dashboard)
Extension         (apps/extension)
```

**Key principle:** The dashboard never directly imports from providers. All data flows through the storage layer.

### Monorepo Structure

```
meter/
├── apps/
│   ├── dashboard/     # Next.js 14 App Router (static export)
│   ├── extension/     # Chrome Manifest V3 side panel
│   └── website/       # Marketing site + docs
└── packages/
    ├── analytics/     # Pure aggregation functions — no side effects
    ├── providers/     # Provider plugin system + adapters
    ├── shared/        # Types, constants, utilities
    ├── storage/       # IndexedDB abstraction layer
    └── ui/            # shadcn/ui components + design system
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.7 (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| Charts | Recharts |
| Storage | IndexedDB (via `idb`) |
| Extension | Chrome Manifest V3 |
| Testing | Vitest |
| Deployment | Vercel (static export) |

---

## Design Principles

- **Privacy first** — Zero network requests. No tracking. No analytics about your analytics.
- **Local first** — All data lives in IndexedDB on your machine.
- **Open source** — MIT licensed. Fork it, extend it, ship your own provider.
- **Extensible** — Adding a provider requires implementing one interface (`ProviderPlugin`).
- **Fast** — Sub-100ms interactions. No loading spinners for data already on device.

---

## Roadmap

See the [implementation plan](docs/IMPLEMENTATION_PLAN.md) for the detailed milestone breakdown.

- [x] **M1** — Monorepo scaffold
- [ ] **M2** — Storage layer (IndexedDB schema)
- [ ] **M3** — Provider interface + Claude Code adapter
- [ ] **M4** — Analytics engine
- [ ] **M5** — Dashboard MVP
- [ ] **M6** — Chrome extension
- [ ] **M7** — Codex + Cursor adapters
- [ ] **M8** — Website
- [ ] **M9** — Polish + v0.1.0 release

---

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

The short version:
1. Fork and clone
2. `pnpm install`
3. Create a branch: `git checkout -b feat/your-feature`
4. Make your changes (tests required)
5. `pnpm typecheck && pnpm lint && pnpm test`
6. Open a PR

---

## License

MIT © METER Contributors
