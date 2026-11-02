import React from 'react';
import type { ChartResponse } from '../../types/index';

interface DashboardOverviewProps {
  metrics: {
    totalStudents: number;
    totalEnrollments: number;
    bothCoursesCount: number;
    placedCount: number;
    interviewCount: number;
    selfFindingCount: number;
    needSupportCount: number;
  };
  charts: Record<string, ChartResponse>;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ metrics, charts }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Tổng Sinh Viên ĐK</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalStudents}</div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">
            {metrics.totalEnrollments} lượt môn đăng ký
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Sinh Viên Đi Cả 2 Môn</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">{metrics.bothCoursesCount}</div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1">
            47,3% thực tập 2 môn cùng DN
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Đã Có Doanh Nghiệp</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{metrics.placedCount}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Đã đối soát & xác nhận MST</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Đang Chờ Phỏng Vấn</div>
          <div className="text-2xl font-bold text-indigo-700 mt-1">{metrics.interviewCount}</div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">Đang chờ KQPV doanh nghiệp</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Cần Khoa Hỗ Trợ</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{metrics.needSupportCount}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">Cần điều phối về DN thân hữu</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.values(charts).map((chart) => (
          <div key={chart.chartId} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">{chart.title}</h3>
                <p className="text-xs text-slate-500">{chart.subtitle}</p>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                /api/dashboard/charts/{chart.chartId}
              </span>
            </div>
            <div className="space-y-2 pt-2">
              {chart.data.labels.map((lbl, idx) => (
                <div key={lbl} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">{lbl}</span>
                  <strong className="text-slate-900">{chart.data.values[idx]}</strong>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
