# Provider Capabilities & Path Specifications

This document outlines where targeted AI coding assistants store local log data and their integration profiles.

---

## 1. Local Path & Storage Configurations

### Claude Code
- **Path (macOS/Linux)**: `~/.claude/projects/`
- **Format**: JSONL (transcripts of conversations, errors, and tool outcomes).
- **Project Link**: Filename contains url-encoded workspace directory path (e.g. `<hash>_project_path.jsonl`).

### Codex CLI
- **Path (macOS/Linux)**: `~/.codex/sessions/`
- **Format**: JSONL.
- **Key Details**: Core configurations are stored in `~/.codex/config.toml` and auth tokens in `auth.json`.

### Cursor
- **Path (macOS)**: `~/Library/Application Support/Cursor/User/workspaceStorage/`
- **Format**: SQLite databases (`state.vscdb` per workspace hash).
- **Key Details**: Contains chat logs under keys like `cursorDiskKV` or `ItemTable`. File is locked during active editor runs.

### Gemini CLI
- **Path**: `~/.gemini/tmp/`
- **Format**: JSON files (raw chat history) and project-specific `shell_history` logs.

### GitHub Copilot
- **Path (CLI)**: `~/.copilot/logs/` & `~/.copilot/session-store.db` (SQLite).
- **Path (IDE)**: `.../workspaceStorage/.../state.vscdb` (SQLite). Contains chat memento caches.

### Continue.dev
- **Path**: `~/.continue/`
- **Format**: JSON (`sessions.json` containing active chat threads) and SQLite (`index/index.sqlite` for codebase vector metadata).

### Cline
- **Path**: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\tasks` (OS-specific).
- **Format**: Separate JSON files per task ID.

### Roo Code (Retired)
- **Path**: `%APPDATA%\Code\User\globalStorage\rooveterinaryinc.roo-cline\tasks` (OS-specific).
- **Format**: Separate JSON files per task ID.

### Aider
- **Path**: Project repository root path (`.aider.chat.history.md`).
- **Format**: Markdown files (transcripts of prompts and responses).

---

## 2. Provider Capability Matrix

| Provider | Log Format | Primary Storage | Token Metrics | Cost Tracking | Platform | Status |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **Claude Code** | JSONL | Flat Files | Yes | Calculated | CLI | Core (M3) |
| **Codex CLI** | JSONL | Flat Files | Yes | Calculated | CLI | Stubbed (M7) |
| **Cursor** | Binary/KV | SQLite DB | Limited | Calculated | IDE Fork | Stubbed (M7) |
| **Gemini CLI** | JSON | Flat Files | No | Calculated | CLI | Planned |
| **GitHub Copilot** | SQL / Log | SQLite / Log | Limited | N/A | IDE Ext | Planned |
| **Continue.dev** | JSON / SQL | JSON / SQLite | Yes | Calculated | IDE Ext | Planned |
| **Cline** | JSON | Flat Files | Yes | Calculated | IDE Ext | Planned |
| **Roo Code** | JSON | Flat Files | Yes | Calculated | IDE Ext | Retired |
| **Aider** | Markdown | Flat Files | No | N/A | Repository | Planned |
