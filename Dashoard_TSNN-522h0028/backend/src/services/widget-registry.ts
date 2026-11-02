import type { IChartPlugin, WidgetMetadata } from '../models/reporting.contracts.ts';

export class WidgetRegistry {
  private static instance: WidgetRegistry;
  private plugins: Map<string, IChartPlugin> = new Map();

  private constructor() {}

  public static getInstance(): WidgetRegistry {
    if (!WidgetRegistry.instance) {
      WidgetRegistry.instance = new WidgetRegistry();
    }
    return WidgetRegistry.instance;
  }

  register(plugin: IChartPlugin): void {
    const meta = plugin.getMetadata();
    this.plugins.set(meta.id, plugin);
  }

  unregister(widgetId: string): boolean {
    return this.plugins.delete(widgetId);
  }

  get(widgetId: string): IChartPlugin | undefined {
    return this.plugins.get(widgetId);
  }

  listWidgets(): WidgetMetadata[] {
    return Array.from(this.plugins.values()).map(p => p.getMetadata());
  }

  has(widgetId: string): boolean {
    return this.plugins.has(widgetId);
  }
}

export const widgetRegistry = WidgetRegistry.getInstance();
