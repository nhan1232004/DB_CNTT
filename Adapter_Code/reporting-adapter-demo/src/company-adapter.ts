import type { CompanyDataProvider, IndustryStatistic } from './contracts.ts';
import { UpstreamError } from './contracts.ts';
import { SharedHttpClient } from './shared-http-client.ts';

// ADAPTER: Hiểu được schema V1/V2 khác nhau và trả về cùng một provider contract.
export class CompanyAdapter implements CompanyDataProvider {
  private readonly http: SharedHttpClient;
  private readonly sourceBaseUrl: string;
  constructor(http: SharedHttpClient, sourceBaseUrl: string) {
    this.http = http;
    this.sourceBaseUrl = sourceBaseUrl;
  }

  async getIndustryStatistics(options: { schema?: string; simulate?: string } = {}): Promise<IndustryStatistic[]> {
    const url = new URL('/internal/company-industry-stats', this.sourceBaseUrl);
    if (options.schema) url.searchParams.set('schema', options.schema);
    if (options.simulate) url.searchParams.set('simulate', options.simulate);

    const raw = await this.http.getJson(url.toString());
    let result: IndustryStatistic[];

    if (Array.isArray(raw) && raw.every(isV1Row)) {
      result = raw.map((x) => ({ industry: x.sector_name, count: x.total }));
      console.log('[Adapter] V1 sector_name,total → industry,count');
    } else if (isRecord(raw) && Array.isArray(raw.summary) && raw.summary.every(isV2Row)) {
      result = raw.summary.map((x: V2Row) => ({ industry: x.industryName, count: x.companies }));
      console.log('[Adapter] V2 summary.industryName,companies → industry,count');
    } else {
      throw new UpstreamError('Schema nguồn không hợp lệ hoặc chưa được Adapter hỗ trợ');
    }

    // Không trả dữ liệu thiếu, số âm hoặc NaN; giữ hợp đồng ổn định cho Chart Plugins.
    console.log('[Adapter] Normalized:', JSON.stringify(result));
    return result;
  }
}

type V1Row = { sector_name: string; total: number };
type V2Row = { industryName: string; companies: number };
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isValidCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
function isV1Row(value: unknown): value is V1Row {
  return isRecord(value) && typeof value.sector_name === 'string' && value.sector_name.length > 0 && isValidCount(value.total);
}
function isV2Row(value: unknown): value is V2Row {
  return isRecord(value) && typeof value.industryName === 'string' && value.industryName.length > 0 && isValidCount(value.companies);
}
