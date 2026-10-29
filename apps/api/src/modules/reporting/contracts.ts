// ============================================================================
// REPORTING CONTRACTS: Chuẩn hóa hợp đồng dữ liệu cho Adapter & Chart Plugins
// ============================================================================

import type { ChartResponse, ChartWidgetMeta } from '../../../../../packages/shared-types/src/index.ts';

export interface IndustryStatistic {
  industry: string;
  count: number;
}

export interface CompanyDataProvider {
  getIndustryStatistics(options?: { schema?: string }): Promise<IndustryStatistic[]>;
  getPartnerRatio(): Promise<{ label: string; value: number; color: string }[]>;
}

export interface ChartPlugin {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly type: ChartResponse['type'];
  execute(options?: { schema?: string }): Promise<ChartResponse>;
}

export class ChartNotFoundError extends Error {
  constructor(id: string) {
    super(`Không tìm thấy Chart Plugin với ID: ${id}`);
  }
}

export type { ChartResponse, ChartWidgetMeta };
