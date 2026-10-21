import type { ChartResponse } from './contracts.ts';
import { WidgetRegistry } from './widget-registry.ts';

// HÌNH 2 - CÓ ROUTER: Router lấy tham chiếu từ Registry và gọi execute().
// Router KHÔNG giữ bảng chartId→plugin riêng.
export class ChartRouter {
  private readonly registry: WidgetRegistry;
  constructor(registry: WidgetRegistry) { this.registry = registry; }

  async dispatch(id: string, options: { schema?: string; simulate?: string } = {}): Promise<ChartResponse> {
    console.log(`[With Router] Router → Registry.lookup(${id}) → execute()`);
    const plugin = this.registry.lookup(id);
    return plugin.execute(options);
  }
}
