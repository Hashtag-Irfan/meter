# Project Context: METER

METER is a privacy-first, open-source local analytics platform for AI coding assistants.

---

## 1. Vision & Purpose

AI-assisted coding is mainstream, but developers have zero visibility into their usage footprint:
- How many tokens did I consume today?
- How much did it cost?
- What is my actual acceptance rate of AI code modifications?
- When am I most productive?

METER answers these questions locally and privately. It is the analytics tool developers open **every day** as an automated work and focus journal.

---

## 2. Core Principles

1. **Privacy First**: Zero telemetry. Zero external network requests. All data stays local.
2. **Local First**: Built on IndexedDB and transient in-memory SQLite WASM running inside the client container.
3. **Open & Extensible**: Supported assistants are integrated via a modular plug-and-play Provider SDK. Adding a new provider does not alter the analytics calculations.

---

## 3. Targeted AI Coding Assistants

METER targets 9 main assistants across IDE extensions, CLI agents, and custom git tools:
- **Claude Code**: Terminal-based CLI agent.
- **Codex CLI**: Terminal-based CLI companion.
- **Cursor**: Custom VS Code-based IDE fork.
- **Gemini CLI**: Terminal developer shell companion.
- **GitHub Copilot**: IDE-integrated autocomplete and chat.
- **Continue.dev**: Open-source sidebar assistant.
- **Cline**: Active task-based coding agent.
- **Roo Code**: Discontinued task-based agent.
- **Aider**: Python-based CLI pair-programming tool.
