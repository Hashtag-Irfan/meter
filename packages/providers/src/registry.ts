import type { ParsedEvent, ProviderId, ProviderPlugin } from "@meter/shared";

// ─── Provider Registry ────────────────────────────────────────────────────────

/**
 * Central registry for all ProviderPlugin implementations.
 *
 * Plugins are registered once at app startup. The registry is the only
 * place that knows about concrete providers — nothing else should import
 * adapters directly.
 *
 * Usage:
 * ```ts
 * const registry = new ProviderRegistry();
 * registry.register(new ClaudeCodeProvider());
 * const plugin = registry.get("claude-code");
 * ```
 */
export class ProviderRegistry {
  private readonly plugins = new Map<ProviderId, ProviderPlugin>();

  /**
   * Register a provider plugin. Throws if the ID is already registered.
   */
  register(plugin: ProviderPlugin): this {
    if (this.plugins.has(plugin.id)) {
      throw new Error(
        `[ProviderRegistry] Provider "${plugin.id}" is already registered. ` +
          `Each provider ID must be unique.`,
      );
    }
    this.plugins.set(plugin.id, plugin);
    return this;
  }

  /**
   * Retrieve a plugin by its ID.
   * Returns undefined if the provider is not registered.
   */
  get(id: ProviderId): ProviderPlugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * List all registered provider IDs.
   */
  list(): ProviderId[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Run `detect()` on all providers concurrently.
   * Returns a map of { providerId → isInstalled }.
   */
  async detectAll(): Promise<Map<ProviderId, boolean>> {
    const results = new Map<ProviderId, boolean>();
    await Promise.all(
      Array.from(this.plugins.entries()).map(async ([id, plugin]) => {
        try {
          results.set(id, await plugin.detect());
        } catch {
          results.set(id, false);
        }
      }),
    );
    return results;
  }

  /**
   * Parse raw log content using the appropriate plugin.
   * Returns an empty array if the provider is not registered.
   */
  async parse(
    providerId: ProviderId,
    raw: string,
    filePath: string,
  ): Promise<ParsedEvent[]> {
    const plugin = this.plugins.get(providerId);
    if (!plugin) return [];
    return plugin.parse(raw, filePath);
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
