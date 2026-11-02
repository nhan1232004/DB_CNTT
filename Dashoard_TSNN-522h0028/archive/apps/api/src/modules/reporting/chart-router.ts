// ============================================================================
// WIDGET REGISTRY & CHART ROUTER (Mô hình Kế thừa & Plug-and-Play 5 năm)
// ============================================================================

import type { ChartPlugin, ChartResponse, ChartWidgetMeta } from './contracts.ts';
import { ChartNotFoundError } from './contracts.ts';

export class WidgetRegistry {
  private readonly plugins = new Map<string, ChartPlugin>();

  register(plugin: ChartPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Trùng lặp chartId trong WidgetRegistry: ${plugin.id}`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  lookup(id: string): ChartPlugin {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new ChartNotFoundError(id);
    }
    return plugin;
  }

  listWidgets(): ChartWidgetMeta[] {
    return [...this.plugins.values()].map((plugin) => ({
      id: plugin.id,
      title: plugin.title,
      subtitle: plugin.subtitle,
      type: plugin.type,
      endpoint: `/api/dashboard/charts/${plugin.id}`,
    }));
  }
}

export class ChartRouter {
  private readonly registry: WidgetRegistry;

  constructor(registry: WidgetRegistry) {
    this.registry = registry;
  }

  async dispatch(id: string, options: { schema?: string } = {}): Promise<ChartResponse> {
    const plugin = this.registry.lookup(id);
    return plugin.execute(options);
  }
}
