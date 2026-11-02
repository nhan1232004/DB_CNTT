import type { Server } from 'node:http';
import { createMockCompanyServer } from './mock-company-service.ts';
import { createReportingServer } from './reporting-server.ts';

export function listen(server: Server, port: number, host = '127.0.0.1'): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      const address = server.address();
      if (!address || typeof address === 'string') return reject(new Error('Không lấy được port'));
      resolve(address.port);
    });
  });
}

export async function startDemo(ports = { company: 3200, noRouter: 3101, withRouter: 3102 }) {
  const company = createMockCompanyServer();
  const actualCompanyPort = await listen(company, ports.company);
  const source = `http://127.0.0.1:${actualCompanyPort}`;
  const noRouter = createReportingServer('no-router', source);
  const withRouter = createReportingServer('with-router', source);
  try {
    const actualNoRouter = await listen(noRouter, ports.noRouter);
    const actualWithRouter = await listen(withRouter, ports.withRouter);
    return {
      urls: {
        company: source,
        noRouter: `http://127.0.0.1:${actualNoRouter}`,
        withRouter: `http://127.0.0.1:${actualWithRouter}`
      },
      async close() {
        await Promise.all([company, noRouter, withRouter].map((s) => new Promise<void>((resolve, reject) => {
          s.close((error) => error ? reject(error) : resolve());
          s.closeAllConnections();
        })));
      }
    };
  } catch (error) {
    for (const s of [company, noRouter, withRouter]) {
      if (s.listening) { s.closeAllConnections(); s.close(); }
    }
    throw error;
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  startDemo().then((demo) => {
    console.log('\n=== DEMO 2 KIẾN TRÚC - DÙNG CHUNG 1 ADAPTER ===');
    console.log(`KHÔNG ROUTER : ${demo.urls.noRouter}`);
    console.log(`CÓ ROUTER   : ${demo.urls.withRouter}`);
    console.log(`Company mock: ${demo.urls.company}`);
    console.log('Ctrl+C để dừng. Mở hai đường dẫn trên bằng trình duyệt.\n');
    const shutdown = () => { demo.close().then(() => process.exit(0)).catch(() => process.exit(1)); };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  }).catch((error) => { console.error(error); process.exitCode = 1; });
}
