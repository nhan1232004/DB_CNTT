import React, { useState } from 'react';
import type { TdtuLanguageStandard, StudentRecord } from '../../../../../packages/shared-types/src/index';
import { apiClient } from '../../services/api.client';

interface TdtuLanguageStandardsProps {
  standards: TdtuLanguageStandard[];
  currentStudent: StudentRecord;
  onCertUpdated: (updated: StudentRecord, message: string) => void;
}

export const TdtuLanguageStandards: React.FC<TdtuLanguageStandardsProps> = ({
  standards,
  currentStudent,
  onCertUpdated,
}) => {
  const [certCode, setCertCode] = useState<string>('TOEIC');
  const [scoreOrLevel, setScoreOrLevel] = useState<string>('650 (B2)');
  const [certNumber, setCertNumber] = useState<string>('IIG-2026-88912');
  const [examDate, setExamDate] = useState<string>('2026-08-15');
  const [commitmentDeadline, setCommitmentDeadline] = useState<string>('2027-01-15');

  const selectedStd = standards.find((s) => s.code === certCode) || standards[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiClient.submitCertificate({
      mssv: currentStudent.mssv,
      certCode,
      certName: selectedStd?.name || certCode,
      scoreOrLevel,
      certNumber,
      examDate,
      commitmentDeadline: certCode === 'COMMITMENT' ? commitmentDeadline : undefined,
    });
    if (res.success && res.updatedStudent) {
      onCertUpdated(res.updatedStudent, res.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Quy chế Đào tạo ĐH Tôn Đức Thắng
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Danh Mục Chứng Chỉ Ngoại Ngữ Công Nhận Xét Tốt Nghiệp TDTU
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {standards.map((std) => (
            <div
              key={std.code}
              onClick={() => setCertCode(std.code)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                certCode === std.code
                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-slate-900">{std.name}</div>
              <div className="text-[11px] text-blue-700 font-semibold mt-1">
                Chuẩn: {std.minStandard}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{std.description}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Chứng chỉ lựa chọn</label>
            <select
              value={certCode}
              onChange={(e) => setCertCode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
            >
              {standards.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Điểm số / Bậc đạt được</label>
            <input
              type="text"
              value={scoreOrLevel}
              onChange={(e) => setScoreOrLevel(e.target.value)}
              placeholder="VD: 650, IELTS 6.0, VSTEP B2..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Số hiệu văn bằng / Ngày thi</label>
            <input
              type="text"
              value={certNumber}
              onChange={(e) => setCertNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
            >
              Lưu & Gửi Minh Chứng Ngoại Ngữ Chuẩn TDTU
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
