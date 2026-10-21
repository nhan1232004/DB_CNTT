import type { ChartPlugin, ChartResponse } from './contracts.ts';
import { ChartNotFoundError } from './contracts.ts';

// REGISTRY CƠ BẢN: chỉ lưu metadata, đăng ký và tra cứu.
export class WidgetRegistry {
  private readonly plugins = new Map<string, ChartPlugin>();

  register(plugin: ChartPlugin): void {
    if (this.plugins.has(plugin.id)) throw new Error(`Trùng chartId: ${plugin.id}`);
    this.plugins.set(plugin.id, plugin);
  }

  lookup(id: string): ChartPlugin {
    const plugin = this.plugins.get(id);
    if (!plugin) throw new ChartNotFoundError(`Không tìm thấy chart: ${id}`);
    return plugin;
  }

  listWidgets(): { id: string; title: string; type: ChartPlugin['type']; endpoint: string }[] {
    return [...this.plugins.values()].map((plugin) => ({
      id: plugin.id, title: plugin.title, type: plugin.type,
      endpoint: `/dashboard/charts/${plugin.id}`
    }));
  }
}

// HÌNH 1 - KHÔNG ROUTER: Registry kiêm lookup + dispatch.
export class DispatchingWidgetRegistry extends WidgetRegistry {
  async execute(id: string, options: { schema?: string; simulate?: string } = {}): Promise<ChartResponse> {
    console.log(`[No Router] Registry.lookup(${id}) → execute()`);
    return this.lookup(id).execute(options);
  }
}
