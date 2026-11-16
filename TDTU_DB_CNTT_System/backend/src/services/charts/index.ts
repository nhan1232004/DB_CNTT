import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { widgetRegistry } from '../widget-registry.ts';

// Nạp sẵn các plugin cốt lõi để đảm bảo đồng bộ tức thì ngay khi khởi tạo router
import './top-companies.plugin.ts';
import './status-pie.plugin.ts';
import './major-distribution.plugin.ts';
import './salary-trend.plugin.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Tự động quét thư mục services/charts/ và nạp mọi file *.plugin.ts mới được thêm vào
 * Đạt chuẩn nguyên lý Open-Closed Principle (OCP) 100%: thêm 1 file plugin là tự chạy.
 */
export async function discoverChartPlugins(): Promise<string[]> {
  const discovered: string[] = [];
  try {
    const files = fs.readdirSync(__dirname);
    for (const file of files) {
      if (file.endsWith('.plugin.ts') || file.endsWith('.plugin.js')) {
        discovered.push(file);
        const fullPath = path.join(__dirname, file);
        await import(pathToFileURL(fullPath).href);
      }
    }
  } catch (err) {
    console.warn('[ChartPluginDiscovery]: Cảnh báo khi tự động quét plugin biểu đồ:', err);
  }
  return discovered;
}

export function getRegisteredWidgetIds(): string[] {
  return widgetRegistry.listAllWidgets().map(w => w.id);
}
