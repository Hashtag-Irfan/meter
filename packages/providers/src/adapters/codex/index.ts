import type { ParsedEvent, ProviderPlugin } from "@meter/shared";

/**
 * Codex provider stub.
 * Full implementation in Milestone 7.
 */
export class CodexProvider implements ProviderPlugin {
  readonly id = "codex" as const;
  readonly name = "Codex";
  readonly version = "0.0.0";
  readonly icon = "";

  async detect(): Promise<boolean> {
    return false;
  }

  async getLogPaths(): Promise<string[]> {
    return [];
  }

  async parse(_raw: string, _filePath: string): Promise<ParsedEvent[]> {
    return [];
  }

  watch(_paths: string[], _onChange: (events: ParsedEvent[]) => void): () => void {
    return () => {};
  }
}
