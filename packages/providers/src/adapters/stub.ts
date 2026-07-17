import type { ParsedEvent, ProviderId, ProviderParser } from "@meter/shared";

/**
 * A no-op parser used as a placeholder for providers whose full
 * implementation is scheduled for a later milestone (e.g. Codex, Cursor).
 * It declares its identity but produces no events.
 */
export class StubProviderParser implements ProviderParser {
  readonly id: ProviderId;
  readonly name: string;
  readonly version = "0.0.0";
  readonly icon = "";

  constructor(id: ProviderId, name: string) {
    this.id = id;
    this.name = name;
  }

  async parse(_raw: string, _filePath: string): Promise<ParsedEvent[]> {
    return [];
  }
}
