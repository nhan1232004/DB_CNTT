import { createServer, type Server } from 'node:http';
import type { ChartPlugin, ChartResponse } from './contracts.ts';
import { ChartNotFoundError, UpstreamError, UpstreamTimeoutError } from './contracts.ts';
import { ChartRouter } from './chart-router.ts';
import { CompanyAdapter } from './company-adapter.ts';
import { CompanyBarChart, CompanyPieChart } from './chart-plugins.ts';
import { demoPage } from './demo-page.ts';
import { SharedHttpClient } from './shared-http-client.ts';
import { DispatchingWidgetRegistry, WidgetRegistry } from './widget-registry.ts';

export type Variant = 'no-router' | 'with-router';

function sendJson(res: import('node:http').ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

export function createReportingServer(variant: Variant, companyBaseUrl: string): Server {
  // Manual DI: CompanyAdapter implements CompanyDataProvider, được inject vào hai Chart Plugins.
  const http = new SharedHttpClient(200);
  const provider = new CompanyAdapter(http, companyBaseUrl);
  const plugins: ChartPlugin[] = [new CompanyPieChart(provider), new CompanyBarChart(provider)];

  const registry = variant === 'no-router' ? new DispatchingWidgetRegistry() : new WidgetRegistry();
  for (const plugin of plugins) registry.register(plugin); // Registration lúc startup.

  // Lựa chọn CHỈ KHÁC BIỆT ở dispatch, không thay đổi Plugin / Provider / Adapter.
  const dispatch: (id: string, options: { schema?: string; simulate?: string }) => Promise<ChartResponse> =
    variant === 'no-router'
      ? (id, options) => (registry as DispatchingWidgetRegistry).execute(id, options)
      : (id, options) => new ChartRouter(registry).dispatch(id, options);

  // Reporting API Controller tối giản; Node HTTP Router match URL trước.
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method Not Allowed' });
    if (url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(demoPage(variant));
      return;
    }
    if (url.pathname === '/dashboard/widgets') return sendJson(res, 200, registry.listWidgets());
    const match = /^\/dashboard\/charts\/([a-z0-9-]+)$/.exec(url.pathname);
    if (!match) return sendJson(res, 404, { error: 'Endpoint không tồn tại' });
    const id = match[1];
    try {
      const data = await dispatch(id, {
        schema: url.searchParams.get('schema') ?? undefined,
        simulate: url.searchParams.get('simulate') ?? undefined
      });
      sendJson(res, 200, data);
    } catch (error) {
      const status = error instanceof ChartNotFoundError ? 404
        : error instanceof UpstreamTimeoutError ? 504
        : error instanceof UpstreamError ? 502 : 500;
      sendJson(res, status, { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
}
