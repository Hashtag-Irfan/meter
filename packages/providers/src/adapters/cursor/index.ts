import type { ParsedEvent, ProviderPlugin } from "@meter/shared";

/**
 * Cursor provider stub.
 * Full implementation in Milestone 7.
 */
export class CursorProvider implements ProviderPlugin {
  readonly id = "cursor" as const;
  readonly name = "Cursor";
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
