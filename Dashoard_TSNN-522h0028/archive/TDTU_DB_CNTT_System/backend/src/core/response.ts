import type { CustomResponse, ApiResponse } from './types.ts';

export function sendSuccess<T>(res: CustomResponse, data: T, message?: string, statusCode = 200): void {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

export function sendError(res: CustomResponse, statusCode: number, message: string, code?: string): void {
  const payload: ApiResponse = {
    success: false,
    error: message,
    code: code || `ERR_${statusCode}`,
    timestamp: new Date().toISOString()
  };
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}
