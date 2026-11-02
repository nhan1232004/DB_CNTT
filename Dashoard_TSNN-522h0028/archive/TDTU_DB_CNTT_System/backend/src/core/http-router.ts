import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { CustomRequest, CustomResponse, RouteHandler, Middleware } from './types.ts';
import { sendError } from './response.ts';

interface RouteEntry {
  method: string;
  pattern: string;
  paramKeys: string[];
  regex: RegExp;
  handlers: (RouteHandler | Middleware)[];
}

export class HttpRouter {
  private routes: RouteEntry[] = [];
  private middlewares: Middleware[] = [];
  private staticDir: string | null = null;
  private spaIndexFile: string | null = null;

  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  setStatic(staticDir: string, spaIndexFile?: string): this {
    this.staticDir = staticDir;
    if (spaIndexFile) {
      this.spaIndexFile = spaIndexFile;
    }
    return this;
  }

  private register(method: string, routePath: string, ...handlers: (RouteHandler | Middleware)[]): this {
    const paramKeys: string[] = [];
    const normalizedPath = routePath.startsWith('/') ? routePath : `/${routePath}`;
    const regexPattern = normalizedPath
      .replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
        paramKeys.push(key);
        return '([^/]+)';
      })
      .replace(/\//g, '\\/');

    this.routes.push({
      method: method.toUpperCase(),
      pattern: routePath,
      paramKeys,
      regex: new RegExp(`^${regexPattern}$`),
      handlers
    });
    return this;
  }

  get(path: string, ...handlers: (RouteHandler | Middleware)[]): this {
    return this.register('GET', path, ...handlers);
  }

  post(path: string, ...handlers: (RouteHandler | Middleware)[]): this {
    return this.register('POST', path, ...handlers);
  }

  put(path: string, ...handlers: (RouteHandler | Middleware)[]): this {
    return this.register('PUT', path, ...handlers);
  }

  delete(path: string, ...handlers: (RouteHandler | Middleware)[]): this {
    return this.register('DELETE', path, ...handlers);
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const customReq = req as CustomRequest;
    const customRes = res as CustomResponse;

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    customReq.path = url.pathname;
    customReq.query = Object.fromEntries(url.searchParams.entries());
    customReq.params = {};

    let midIndex = 0;
    const runMiddlewares = async (): Promise<void> => {
      if (midIndex < this.middlewares.length) {
        const mid = this.middlewares[midIndex++];
        await mid(customReq, customRes, runMiddlewares);
      } else {
        await this.dispatchRoute(customReq, customRes);
      }
    };

    try {
      await runMiddlewares();
    } catch (err: any) {
      console.error('[HttpRouter Error]:', err);
      if (!res.headersSent) {
        sendError(customRes, 500, err?.message || 'Lỗi xử lý nội bộ máy chủ', 'INTERNAL_SERVER_ERROR');
      }
    }
  }

  private async dispatchRoute(req: CustomRequest, res: CustomResponse): Promise<void> {
    const method = (req.method || 'GET').toUpperCase();

    // Check registered API routes
    for (const route of this.routes) {
      if (route.method !== method && route.method !== 'ALL') continue;
      const match = req.path.match(route.regex);
      if (match) {
        const params: Record<string, string> = {};
        for (let i = 0; i < route.paramKeys.length; i++) {
          params[route.paramKeys[i]] = decodeURIComponent(match[i + 1]);
        }
        req.params = params;

        // Run route handlers sequentially with next() chaining
        let hIdx = 0;
        const runHandlers = async (): Promise<void> => {
          if (hIdx < route.handlers.length && !res.writableEnded) {
            const currentHandler = route.handlers[hIdx++];
            if (currentHandler.length >= 3) {
              await (currentHandler as Middleware)(req, res, runHandlers);
            } else {
              await (currentHandler as RouteHandler)(req, res);
              await runHandlers();
            }
          }
        };

        await runHandlers();
        return;
      }
    }

    // Try serving static files if path starts with static or not an API route
    if (this.staticDir && method === 'GET' && !req.path.startsWith('/api')) {
      const served = this.serveStaticFile(req, res);
      if (served) return;

      if (this.spaIndexFile && fs.existsSync(this.spaIndexFile)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(this.spaIndexFile).pipe(res);
        return;
      }
    }

    sendError(res, 404, `Endpoint không tồn tại: [${method}] ${req.path}`, 'NOT_FOUND');
  }

  private serveStaticFile(req: CustomRequest, res: CustomResponse): boolean {
    if (!this.staticDir) return false;
    let safePath = req.path === '/' ? '/index.html' : req.path;
    const filePath = path.join(this.staticDir, safePath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.jsx': 'text/javascript; charset=utf-8',
        '.ts': 'text/javascript; charset=utf-8',
        '.tsx': 'text/javascript; charset=utf-8',
        '.mjs': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' });
      fs.createReadStream(filePath).pipe(res);
      return true;
    }
    return false;
  }
}
