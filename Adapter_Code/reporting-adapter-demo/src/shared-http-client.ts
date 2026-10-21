import { UpstreamError, UpstreamTimeoutError } from './contracts.ts';

// SHARED DATA ACCESS: Chỉ lo HTTP / timeout / HTTP error, không biết schema nghiệp vụ.
export class SharedHttpClient {
  private readonly timeoutMs: number;
  constructor(timeoutMs = 200) { this.timeoutMs = timeoutMs; }

  async getJson(url: string): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(this.timeoutMs) });
    } catch (cause) {
      if (cause instanceof Error && (cause.name === 'TimeoutError' || cause.name === 'AbortError')) {
        throw new UpstreamTimeoutError(`Company Service timeout (${this.timeoutMs}ms)`);
      }
      throw new UpstreamError(`Không kết nối được Company Service: ${String(cause)}`);
    }
    if (!response.ok) throw new UpstreamError(`Company Service trả HTTP ${response.status}`);
    try {
      return await response.json() as unknown;
    } catch {
      throw new UpstreamError('Company Service trả JSON không hợp lệ');
    }
  }
}
