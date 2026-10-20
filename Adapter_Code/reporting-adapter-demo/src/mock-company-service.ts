import { createServer, type Server } from 'node:http';

// Company Microservice GIẢ LẬP, cấu trúc V1 và V2 khác nhau nhưng cùng ý nghĩa.
export function createMockCompanyServer(): Server {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (url.pathname !== '/internal/company-industry-stats') {
      res.writeHead(404).end(JSON.stringify({ error: 'Not Found' }));
      return;
    }
    const simulate = url.searchParams.get('simulate');
    if (simulate === 'error') {
      res.writeHead(503).end(JSON.stringify({ error: 'Simulated outage' }));
      return;
    }
    if (simulate === 'slow') await new Promise((resolve) => setTimeout(resolve, 600));
    if (simulate === 'invalid') {
      res.writeHead(200).end(JSON.stringify({ summary: [{ industryName: 'AI', companies: 'NOT_A_NUMBER' }] }));
      return;
    }

    const data = [
      { label: 'Phần mềm', count: 40 },
      { label: 'AI & dữ liệu', count: 30 },
      { label: 'An ninh mạng', count: 20 }
    ];
    if (url.searchParams.get('schema') === 'v2') {
      res.writeHead(200).end(JSON.stringify({ summary: data.map((x) => ({ industryName: x.label, companies: x.count })) }));
    } else {
      res.writeHead(200).end(JSON.stringify(data.map((x) => ({ sector_name: x.label, total: x.count }))));
    }
  });
}
