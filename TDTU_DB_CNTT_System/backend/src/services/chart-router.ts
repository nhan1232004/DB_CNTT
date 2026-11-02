import { widgetRegistry } from './widget-registry.ts';
import type { StandardChartPayload } from '../models/reporting.contracts.ts';

export class ChartRouter {
  async dispatch(widgetId: string, options: Record<string, any> = {}): Promise<StandardChartPayload> {
    const plugin = widgetRegistry.get(widgetId);
    if (!plugin) {
      throw new Error(`Chart plugin [${widgetId}] chưa được đăng ký trong WidgetRegistry`);
    }

    return await plugin.execute(options);
  }
}

export const chartRouter = new ChartRouter();
