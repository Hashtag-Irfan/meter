
import { PROVIDERS } from "./definitions.js";
import { defaultDetect, expandLogPaths } from "./paths.js";

import type {
  HostEnv,
  ParsedEvent,
  ProviderDefinition,
  ProviderId,
} from "@meter/shared";

// ─── Provider Registry ────────────────────────────────────────────────────────
//
// The registry is built entirely from pure `ProviderDefinition` data (see
// `./definitions.js`). It holds NO behavior of its own beyond lookups and
// orchestration; all host-bound work (detection, file listing, parsing) is
// delegated to the injected `HostEnv` and the definitions' contained
// parsers. This keeps the registry 100% environment-agnostic.

export class ProviderRegistry {
  private readonly defs = new Map<ProviderId, ProviderDefinition>();

  /**
   * Construct a registry. Defaults to every provider declared in
   * `PROVIDERS`. Pass a custom list to scope or extend the registry.
   */
  constructor(definitions: ProviderDefinition[] = Object.values(PROVIDERS)) {
    for (const def of definitions) this.register(def);
  }

  /**
   * Register a provider definition. Throws if the ID is already registered.
   */
  register(def: ProviderDefinition): this {
    if (this.defs.has(def.id)) {
      throw new Error(
        `[ProviderRegistry] Provider "${def.id}" is already registered. ` +
          `Each provider ID must be unique.`,
      );
    }
    this.defs.set(def.id, def);
    return this;
  }

  /**
   * Retrieve a provider definition by its ID.
   * Returns undefined if the provider is not registered.
   */
  get(id: ProviderId): ProviderDefinition | undefined {
    return this.defs.get(id);
  }

  /**
   * List all registered provider IDs.
   */
  list(): ProviderId[] {
    return Array.from(this.defs.keys());
  }

  /**
   * Get the pure parser for a provider (if registered).
   */
  getParser(id: ProviderId) {
    return this.defs.get(id)?.parser;
  }

  /**
   * Run detection on all providers concurrently using the supplied host env.
   * Returns a map of { providerId → isInstalled }.
   */
  async detectAll(env: HostEnv): Promise<Map<ProviderId, boolean>> {
    const results = new Map<ProviderId, boolean>();
    await Promise.all(
      Array.from(this.defs.values()).map(async (def) => {
        try {
          results.set(
            def.id,
            def.detect ? await def.detect(env) : await defaultDetect(def, env),
          );
        } catch {
          results.set(def.id, false);
        }
      }),
    );
    return results;
  }

  /**
   * Resolve the concrete log file paths for a provider using the host env.
   * Returns an empty array if the provider is not registered.
   */
  async getLogPaths(id: ProviderId, env: HostEnv): Promise<string[]> {
    const def = this.defs.get(id);
    if (!def) return [];
    return expandLogPaths(def, env);
  }

  /**
   * Parse raw log content using the appropriate provider parser.
   * Returns an empty array if the provider is not registered.
   */
  async parse(
    providerId: ProviderId,
    raw: string,
    filePath: string,
  ): Promise<ParsedEvent[]> {
    const parser = this.defs.get(providerId)?.parser;
    if (!parser) return [];
    return parser.parse(raw, filePath);
  }
}

// ─── Singleton (for app-level use) ────────────────────────────────────────────

let _registry: ProviderRegistry | null = null;

/**
 * Get (or create) the global provider registry.
 * In tests, create a fresh `ProviderRegistry` directly instead.
 */
export function getRegistry(): ProviderRegistry {
  _registry ??= new ProviderRegistry();
  return _registry;
}
