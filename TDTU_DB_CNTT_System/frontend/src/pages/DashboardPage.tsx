// Dashboard Page Component - TDTU Enterprise Design System
// Đã tích hợp:
// - Item 1: 2 trường hợp Banner Điều kiện & Đơn vị Thực tập (TH1: Chưa đủ ĐK -> 1 khung; TH2: Đủ ĐK -> 1 khung đủ ĐK hoặc 1 khung Đã có nơi TT)
// - Item 12: Loại bỏ 100% dữ liệu ảo (1.248, 892, 298, 58...), đồng bộ hoàn toàn từ danh sách sinh viên thực tế (GPA, Xếp loại, Chuyên ngành, Doanh nghiệp, Chứng chỉ)
// - Item 13: Chức năng "Quản lý biểu đồ" (Bật/tắt hiển thị, đổi kiểu biểu đồ Donut/Bar/Progress, sắp xếp thứ tự, lọc theo ngành/môn học)
// - Hiển thị trực tiếp bảng Quản lý Sinh viên (CRUD + Import) trên trang Tổng quan của Giảng viên/Admin

const MUTED_CHART_PALETTE = [
  '#003087', // TDTU Navy
  '#2563eb', // Soft Primary Blue
  '#0d9488', // Muted Teal
  '#d97706', // Warm Amber
  '#dc2626', // Alert Red
  '#60a5fa', // Pastel Blue
  '#64748b'  // Muted Slate
];

const DEFAULT_CHART_CONFIG = [
  { id: 'progress', title: 'Tiến độ thực tập toàn khóa', tab: 'overview', visible: true, chartType: 'donut', order: 1 },
  { id: 'course_source', title: 'Cơ cấu đăng ký học phần (KTCN & TSNN)', tab: 'overview', visible: true, chartType: 'progress', order: 2 },
  { id: 'company_structure', title: 'Cơ cấu Doanh nghiệp Tiếp nhận', tab: 'overview', visible: true, chartType: 'donut', order: 3 },
  { id: 'major_distribution', title: 'Phân bố Sinh viên theo Chuyên ngành', tab: 'overview', visible: true, chartType: 'donut', order: 4 },
  { id: 'gpa_distribution', title: 'Phân bố Điểm GPA & Học lực theo Ngành', tab: 'academic', visible: true, chartType: 'bar', order: 5 },
  { id: 'english_certs', title: 'Chuẩn Chứng chỉ Ngoại ngữ', tab: 'academic', visible: true, chartType: 'donut', order: 6 }
];

const SvgDonutChart = ({ slices = [], size = 180, strokeWidth = 24, centerText = '', centerSub = '' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;
  const validSlices = slices.filter(s => (Number(s.percentage) || 0) > 0);

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {validSlices.map((slice, idx) => {
          const pct = Math.min(100, Math.max(0, Number(slice.percentage) || 0));
          const strokeDasharray = `${(pct / 100) * circumference} ${circumference}`;
          const strokeDashoffset = -accumulatedOffset;
          accumulatedOffset += (pct / 100) * circumference;
          const sliceColor = slice.color || MUTED_CHART_PALETTE[idx % MUTED_CHART_PALETTE.length];
          return (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={sliceColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="butt"
              className="transition-all duration-300 ease-out hover:opacity-85 cursor-pointer"
            >
              <title>{`${slice.label}: ${pct}% (${slice.count ?? ''} SV)`}</title>
            </circle>
          );
        })}
      </svg>
      {centerText !== undefined && centerText !== null && (
        <div className="absolute text-center pointer-events-none px-2">
          <div className="text-xl font-bold text-[#1f2937] leading-tight font-mono">{centerText}</div>
          {centerSub && <div className="text-[11px] text-[#4b5563] font-semibold mt-0.5">{centerSub}</div>}
        </div>
      )}
    </div>
  );
};

const FlexibleChartRenderer = ({ chartType = 'donut', slices = [], centerText = '', centerSub = '', unitLabel = 'SV' }) => {
  if (chartType === 'bar') {
    const maxCount = Math.max(1, ...slices.map(s => Number(s.count) || 0));
    return (
      <div className="space-y-4 my-3">
        <div className="flex items-end justify-between gap-3 h-44 pt-6 pb-2 px-2 border-b border-[#e5e7eb]">
          {slices.map((s, idx) => {
            const count = Number(s.count) || 0;
            const heightPct = maxCount > 0 ? Math.max(count > 0 ? 10 : 3, Math.round((count / maxCount) * 100)) : 3;
            const barColor = s.color || MUTED_CHART_PALETTE[idx % MUTED_CHART_PALETTE.length];
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end min-w-0">
                <span className="text-[12px] font-bold text-[#1f2937] font-mono">{count} {unitLabel}</span>
                <div
                  className="w-full max-w-[54px] rounded-t-lg transition-all duration-500"
                  style={{ height: `${heightPct}%`, backgroundColor: barColor }}
                  title={`${s.label}: ${count} ${unitLabel} (${s.percentage}%)`}
                ></div>
                <span className="text-[11.5px] font-semibold text-[#1f2937] text-center truncate w-full" title={s.label}>
                  {s.shortLabel || s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (chartType === 'progress') {
    return (
      <div className="space-y-3.5 my-4">
        {slices.map((s, idx) => {
          const pct = Math.min(100, Math.max(0, Number(s.percentage) || 0));
          const barColor = s.color || MUTED_CHART_PALETTE[idx % MUTED_CHART_PALETTE.length];
          return (
            <div key={idx}>
              <div className="flex items-center justify-between text-[13.5px] mb-1 font-semibold text-[#1f2937]">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: barColor }}></span>
                  <span>{s.label}</span>
                </span>
                <span className="font-bold text-[#1f2937] font-mono">{s.count ?? 0} {unitLabel} ({pct}%)</span>
              </div>
              <div className="w-full bg-[#f1f5f9] rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-4">
      <SvgDonutChart
        slices={slices}
        size={180}
        strokeWidth={25}
        centerText={centerText}
        centerSub={centerSub}
      />
      <div className="space-y-2.5 w-full sm:w-auto text-[13.5px]">
        {slices.map((s, idx) => {
          const color = s.color || MUTED_CHART_PALETTE[idx % MUTED_CHART_PALETTE.length];
          return (
            <div key={idx} className="flex items-center justify-between sm:justify-start gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
              <span className="font-semibold text-[#1f2937]">{s.label}:</span>
              <span className="font-bold text-[#1f2937] font-mono">{s.percentage}% ({s.count ?? 0} {unitLabel})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DashboardPage = ({ activeSemester = 'hk1_2026_2027', onSemesterChange, currentUser, onNavigateTab }) => {
  const [liveStudents, setLiveStudents] = React.useState([]);
  const [allCerts, setAllCerts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTabSection, setActiveTabSection] = React.useState('all'); // 'all' | 'overview' | 'academic'
  const [declaration, setDeclaration] = React.useState(null);

  // Bộ lọc dữ liệu biểu đồ & Quản lý biểu đồ (Item 13)
  const [chartMajorFilter, setChartMajorFilter] = React.useState('ALL');
  const [chartCourseFilter, setChartCourseFilter] = React.useState('ALL');
  const [showChartManager, setShowChartManager] = React.useState(false);
  const [chartConfig, setChartConfig] = React.useState(() => {
    try {
      const saved = localStorage.getItem('tdtu_dashboard_chart_config_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_CHART_CONFIG.length) return parsed;
      }
    } catch {}
    return DEFAULT_CHART_CONFIG;
  });

  const isStudent = currentUser?.role === 'student';
  const studentId = (currentUser?.studentId || currentUser?.mssv || '522H0045').toUpperCase();

  const isEnrolledStudent = React.useMemo(() => {
    if (!isStudent) return false;
    if (currentUser?.isEnrolledThisSemester === false) return false;
    const cleanSid = String(currentUser?.studentId || currentUser?.mssv || '').toUpperCase();
    if (cleanSid === '52100999' || cleanSid === '523H0077') return false;
    if (window.PrimeRbac?.getUserRoleKey && window.PrimeRbac.getUserRoleKey(currentUser) === 'sv_ngoai_ky') return false;
    if (Array.isArray(liveStudents) && liveStudents.length > 0) {
      return liveStudents.some(s => String(s.mssv || s.studentId || '').toUpperCase() === cleanSid);
    }
    return true;
  }, [isStudent, currentUser, liveStudents]);

  const saveChartConfig = (nextConfig) => {
    setChartConfig(nextConfig);
    try {
      localStorage.setItem('tdtu_dashboard_chart_config_v2', JSON.stringify(nextConfig));
    } catch {}
  };

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      if (window.ApiClient?.getLiveStudents) {
        const list = await window.ApiClient.getLiveStudents(activeSemester);
        setLiveStudents(Array.isArray(list) ? list : []);
      }
      if (window.ApiClient?.fetchAllCertificates) {
        const certs = await window.ApiClient.fetchAllCertificates();
        setAllCerts(Array.isArray(certs) ? certs : []);
      }

      if (isStudent && window.ApiClient) {
        const cached = window.ApiClient.getStudentDeclaration ? window.ApiClient.getStudentDeclaration(studentId) : null;
        if (cached) setDeclaration(cached);
        if (window.ApiClient.getDeclaration) {
          window.ApiClient.getDeclaration(studentId).then(fresh => {
            const d = fresh?.data || fresh;
            if (d && (d.internshipStatus || d.companyName)) {
              setDeclaration(d);
            } else if (!cached) {
              setDeclaration(null);
            }
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('[Dashboard Load Error]:', err);
    } finally {
      setLoading(false);
    }
  }, [activeSemester, isStudent, studentId]);

  React.useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('tdtu_data_updated', handleUpdate);
    window.addEventListener('tdtu_declarations_updated', handleUpdate);
    window.addEventListener('tdtu_certs_updated', handleUpdate);
    window.addEventListener('tdtu_semester_changed', handleUpdate);
    return () => {
      window.removeEventListener('tdtu_data_updated', handleUpdate);
      window.removeEventListener('tdtu_declarations_updated', handleUpdate);
      window.removeEventListener('tdtu_certs_updated', handleUpdate);
      window.removeEventListener('tdtu_semester_changed', handleUpdate);
    };
  }, [loadData]);

  // Tìm bản ghi sinh viên hiện tại trong danh sách
  const myStudentRecord = React.useMemo(() => {
    if (!isStudent) return null;
    return liveStudents.find(s => String(s.mssv || s.studentId).toUpperCase() === studentId) || null;
  }, [isStudent, liveStudents, studentId]);

  // Áp dụng bộ lọc ngành / môn học cho các biểu đồ
  const filteredStudentsForCharts = React.useMemo(() => {
    return liveStudents.filter(s => {
      if (chartMajorFilter !== 'ALL') {
        const m = (s.major || '').toLowerCase();
        const c = (s.class || '').toLowerCase();
        if (chartMajorFilter === 'KHMT' && !(m.includes('khoa học') || c.includes('501'))) return false;
        if (chartMajorFilter === 'KTPM' && !(m.includes('phần mềm') || c.includes('502'))) return false;
        if (chartMajorFilter === 'MMT' && !(m.includes('mạng') || c.includes('503'))) return false;
        if (chartMajorFilter === 'HTTT' && !(m.includes('hệ thống') || c.includes('504'))) return false;
      }
      if (chartCourseFilter !== 'ALL') {
        const courses = Array.isArray(s.courses) ? s.courses : [s.courseCode || 'KTCN'];
        const isDual = Boolean(s.isDualCourse || courses.length > 1);
        if (chartCourseFilter === 'DUAL' && !isDual) return false;
        if (chartCourseFilter === 'KTCN' && !courses.includes('KTCN')) return false;
        if (chartCourseFilter === 'TSNN' && !courses.includes('TSNN')) return false;
      }
      return true;
    });
  }, [liveStudents, chartMajorFilter, chartCourseFilter]);

  // Tính toán 100% số liệu thực tế từ filteredStudentsForCharts (Tuyệt đối không dùng số ảo 1248/892/298)
  const totalStudents = filteredStudentsForCharts.length;
  const hasCompanyCount = filteredStudentsForCharts.filter(s =>
    s.status === 'Có doanh nghiệp' || s.status === 'has_company'
  ).length;
  const needSupportCount = filteredStudentsForCharts.filter(s =>
    s.status === 'Cần Khoa hỗ trợ' || s.status === 'Cần hỗ trợ' || s.status === 'need_support' || s.noCompanyOption === 'faculty'
  ).length;
  const inProgressCount = Math.max(0, totalStudents - hasCompanyCount - needSupportCount);
  const dualCourseCount = filteredStudentsForCharts.filter(s =>
    Boolean(s.isDualCourse) || (Array.isArray(s.courses) && s.courses.length > 1)
  ).length;
  const ktcnOnlyCount = filteredStudentsForCharts.filter(s => {
    const c = Array.isArray(s.courses) ? s.courses : [s.courseCode || 'KTCN'];
    return c.length === 1 && c[0] === 'KTCN';
  }).length;
  const tsnnOnlyCount = filteredStudentsForCharts.filter(s => {
    const c = Array.isArray(s.courses) ? s.courses : [s.courseCode || 'KTCN'];
    return c.length === 1 && c[0] === 'TSNN';
  }).length;

  const pct = (val, tot = totalStudents) => (tot > 0 ? Math.round((val / tot) * 100) : 0);
  const hasCompanyPercent = `${pct(hasCompanyCount)}%`;
  const inProgressPercent = `${pct(inProgressCount)}%`;
  const needSupportPercent = `${pct(needSupportCount)}%`;

  // Chart 1: Tiến độ thực tập
  const progressSlices = [
    { label: 'Đã có nơi thực tập', shortLabel: 'Đã có nơi', percentage: pct(hasCompanyCount), count: hasCompanyCount, color: '#003087' },
    { label: 'Chưa có / Chờ PV', shortLabel: 'Chưa có / Chờ', percentage: pct(inProgressCount), count: inProgressCount, color: '#2563eb' },
    { label: 'Cần Khoa hỗ trợ', shortLabel: 'Cần hỗ trợ', percentage: pct(needSupportCount), count: needSupportCount, color: '#dc2626' }
  ];

  // Chart 2: Cơ cấu đăng ký học phần KTCN & TSNN
  const courseSlices = [
    { label: 'Chỉ đăng ký Kiến tập CN (KTCN)', shortLabel: 'Chỉ KTCN', percentage: pct(ktcnOnlyCount), count: ktcnOnlyCount, color: '#003087' },
    { label: 'Chỉ đăng ký Tập sự NN (TSNN)', shortLabel: 'Chỉ TSNN', percentage: pct(tsnnOnlyCount), count: tsnnOnlyCount, color: '#2563eb' },
    { label: 'Học song song 2 môn (KTCN + TSNN)', shortLabel: 'Song song 2 môn', percentage: pct(dualCourseCount), count: dualCourseCount, color: '#0d9488' }
  ];

  // Chart 3: Cơ cấu doanh nghiệp tiếp nhận (từ dữ liệu khai báo thực tế)
  const companyAggregation = React.useMemo(() => {
    const map = new Map();
    filteredStudentsForCharts.forEach(s => {
      if (s.status === 'Có doanh nghiệp' || s.status === 'has_company') {
        const comp = String(s.company || s.companyName || 'Doanh nghiệp đã khai báo').trim();
        if (comp && comp !== 'Chưa có' && comp !== '—') {
          map.set(comp, (map.get(comp) || 0) + 1);
        }
      }
    });
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const uniqueCompanies = entries.length;
    if (uniqueCompanies === 0) {
      return {
        uniqueCompanies: 0,
        slices: [
          { label: 'Chưa có doanh nghiệp tiếp nhận', shortLabel: 'Chưa có DN', percentage: totalStudents > 0 ? 100 : 0, count: totalStudents, color: '#64748b' }
        ]
      };
    }
    const top4 = entries.slice(0, 4);
    const othersCount = entries.slice(4).reduce((sum, [, c]) => sum + c, 0);
    const slices = top4.map(([name, count], idx) => ({
      label: name,
      shortLabel: name.length > 14 ? name.slice(0, 14) + '…' : name,
      count,
      percentage: pct(count, hasCompanyCount),
      color: MUTED_CHART_PALETTE[idx % MUTED_CHART_PALETTE.length]
    }));
    if (othersCount > 0) {
      slices.push({
        label: `Doanh nghiệp khác (${entries.length - 4} DN)`,
        shortLabel: 'DN khác',
        count: othersCount,
        percentage: pct(othersCount, hasCompanyCount),
        color: '#64748b'
      });
    }
    return { uniqueCompanies, slices };
  }, [filteredStudentsForCharts, totalStudents, hasCompanyCount]);

  // Chart 4 & 5: Phân bố theo Chuyên ngành & Kết quả Học tập (GPA / Xếp loại) theo Ngành
  const majorNames = [
    { name: 'Khoa học máy tính', short: 'KHMT', color: '#003087' },
    { name: 'Kỹ thuật phần mềm', short: 'KTPM', color: '#2563eb' },
    { name: 'Mạng máy tính và truyền thông dữ liệu', short: 'MMT&TTDL', color: '#0d9488' },
    { name: 'Hệ thống thông tin', short: 'HTTT', color: '#d97706' }
  ];

  const majorsStats = React.useMemo(() => {
    return majorNames.map(mObj => {
      const mStuds = filteredStudentsForCharts.filter(s => {
        const sMaj = (s.major || '').toLowerCase();
        const sClass = (s.class || '').toLowerCase();
        if (mObj.short === 'KHMT') return sMaj.includes('khoa học') || sClass.includes('501');
        if (mObj.short === 'KTPM') return sMaj.includes('phần mềm') || sClass.includes('502');
        if (mObj.short === 'MMT&TTDL') return sMaj.includes('mạng') || sClass.includes('503');
        if (mObj.short === 'HTTT') return sMaj.includes('hệ thống') || sClass.includes('504');
        return false;
      });
      const getGpa4 = (s) => typeof s.gpa4 === 'number' ? s.gpa4 : (parseFloat(s.gpa4) || parseFloat(s.gpa) || 0);
      const xs = mStuds.filter(s => s.academicRank === 'Xuất sắc' || getGpa4(s) >= 3.6).length;
      const gioi = mStuds.filter(s => s.academicRank === 'Giỏi' || (getGpa4(s) >= 3.2 && getGpa4(s) < 3.6 && !s.academicRank)).length;
      const kha = mStuds.filter(s => s.academicRank === 'Khá' || (getGpa4(s) >= 2.5 && getGpa4(s) < 3.2 && !s.academicRank)).length;
      const tb = Math.max(0, mStuds.length - xs - gioi - kha);

      return {
        ...mObj,
        total: mStuds.length,
        percentage: pct(mStuds.length),
        segments: [
          { label: 'Xuất sắc', count: xs, color: '#003087' },
          { label: 'Giỏi', count: gioi, color: '#2563eb' },
          { label: 'Khá', count: kha, color: '#d97706' },
          { label: 'Trung bình', count: tb, color: '#dc2626' }
        ]
      };
    });
  }, [filteredStudentsForCharts, totalStudents]);

  const majorSlices = majorsStats.map(m => ({
    label: m.name,
    shortLabel: m.short,
    count: m.total,
    percentage: m.percentage,
    color: m.color
  }));

  // Thống kê phổ điểm GPA (Hệ 4) thực tế
  const gpaStats = React.useMemo(() => {
    const getG4 = (s) => typeof s.gpa4 === 'number' ? s.gpa4 : (parseFloat(s.gpa4) || parseFloat(s.gpa) || 0);
    const getG10 = (s) => typeof s.gpa10 === 'number' ? s.gpa10 : (parseFloat(s.gpa10) || Number((getG4(s) * 2.5).toFixed(2)));
    const b1 = filteredStudentsForCharts.filter(s => getG4(s) > 0 && getG4(s) < 2.0).length;
    const b2 = filteredStudentsForCharts.filter(s => getG4(s) >= 2.0 && getG4(s) < 2.5).length;
    const b3 = filteredStudentsForCharts.filter(s => getG4(s) >= 2.5 && getG4(s) < 3.2).length;
    const b4 = filteredStudentsForCharts.filter(s => getG4(s) >= 3.2 && getG4(s) < 3.6).length;
    const b5 = filteredStudentsForCharts.filter(s => getG4(s) >= 3.6).length;

    const sumG4 = filteredStudentsForCharts.reduce((acc, s) => acc + getG4(s), 0);
    const sumG10 = filteredStudentsForCharts.reduce((acc, s) => acc + getG10(s), 0);
    const avgGpa4 = totalStudents > 0 ? (sumG4 / totalStudents).toFixed(2) : '0.00';
    const avgGpa10 = totalStudents > 0 ? (sumG10 / totalStudents).toFixed(2) : '0.00';
    const khaGioiPct = totalStudents > 0 ? Math.round(((b3 + b4 + b5) / totalStudents) * 1000) / 10 : 0;

    const slices = [
      { label: 'Dưới 2.0 (Yếu)', shortLabel: '< 2.0', count: b1, percentage: pct(b1), color: '#dc2626' },
      { label: '2.0 – 2.49 (Trung bình)', shortLabel: '2.0–2.49', count: b2, percentage: pct(b2), color: '#d97706' },
      { label: '2.5 – 3.19 (Khá)', shortLabel: '2.5–3.19', count: b3, percentage: pct(b3), color: '#2563eb' },
      { label: '3.2 – 3.59 (Giỏi)', shortLabel: '3.2–3.59', count: b4, percentage: pct(b4), color: '#003087' },
      { label: '≥ 3.60 (Xuất sắc)', shortLabel: '≥ 3.60', count: b5, percentage: pct(b5), color: '#0d9488' }
    ];
    return { slices, avgGpa4, avgGpa10, khaGioiPct };
  }, [filteredStudentsForCharts, totalStudents]);

  // Chart 6: Chuẩn chứng chỉ ngoại ngữ thực tế
  const englishSlices = React.useMemo(() => {
    const certStudentIds = new Set(allCerts.map(c => String(c.studentId || '').toUpperCase()));
    const hasCert = filteredStudentsForCharts.filter(s =>
      Boolean(s.cert) || certStudentIds.has(String(s.mssv || s.studentId).toUpperCase())
    ).length;
    const noCert = Math.max(0, totalStudents - hasCert);
    return [
      { label: 'Đã nộp chứng chỉ ngoại ngữ', shortLabel: 'Đã có CC', count: hasCert, percentage: pct(hasCert), color: '#003087' },
      { label: 'Chưa nộp / Đang bổ sung', shortLabel: 'Chưa nộp', count: noCert, percentage: pct(noCert), color: '#60a5fa' }
    ];
  }, [filteredStudentsForCharts, allCerts, totalStudents]);

  const handleExportExcel = () => {
    if (window.ApiClient?.exportStudentsExcel) {
      window.ApiClient.exportStudentsExcel(filteredStudentsForCharts, activeSemester.toUpperCase());
    }
  };

  // Thao tác Quản lý Biểu đồ (Item 13)
  const toggleChartVisible = (id) => {
    const next = chartConfig.map(c => c.id === id ? { ...c, visible: !c.visible } : c);
    saveChartConfig(next);
  };

  const changeChartType = (id, chartType) => {
    const next = chartConfig.map(c => c.id === id ? { ...c, chartType } : c);
    saveChartConfig(next);
  };

  const moveChartOrder = (idx, dir) => {
    const sorted = [...chartConfig].sort((a, b) => a.order - b.order);
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const temp = sorted[idx].order;
    sorted[idx].order = sorted[targetIdx].order;
    sorted[targetIdx].order = temp;
    saveChartConfig([...sorted].sort((a, b) => a.order - b.order));
  };

  const resetChartConfig = () => {
    saveChartConfig(DEFAULT_CHART_CONFIG);
    setChartMajorFilter('ALL');
    setChartCourseFilter('ALL');
  };

  const visibleCharts = React.useMemo(() => {
    return [...chartConfig]
      .sort((a, b) => a.order - b.order)
      .filter(c => c.visible && (activeTabSection === 'all' || c.tab === activeTabSection));
  }, [chartConfig, activeTabSection]);

  const renderChartCard = (cfg) => {
    switch (cfg.id) {
      case 'progress':
        return (
          <div key={cfg.id} className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-bold text-[#1f2937] text-[17.5px] text-left">{cfg.title}</h3>
                <span className="text-[12px] font-bold text-[#003087] bg-[#ebf3ff] px-2.5 py-1 rounded-lg border border-[#bfdbfe]">
                  {totalStudents} SV
                </span>
              </div>
              <FlexibleChartRenderer
                chartType={cfg.chartType}
                slices={progressSlices}
                centerText={hasCompanyPercent}
                centerSub="đã có nơi"
              />
            </div>
            <div className="pt-3 border-t border-[#e5e7eb] text-[13px] text-[#4b5563] flex items-center justify-between">
              <span>Đã xác nhận doanh nghiệp: <strong className="text-[#003087]">{hasCompanyCount}/{totalStudents} SV</strong></span>
              <span className="font-bold text-[#dc2626]">Cần hỗ trợ: {needSupportCount} SV</span>
            </div>
          </div>
        );

      case 'course_source':
        return (
          <div key={cfg.id} className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-bold text-[#1f2937] text-[17.5px] text-left">{cfg.title}</h3>
                <span className="text-[12px] font-bold text-[#0d9488] bg-[#f0fdfa] px-2.5 py-1 rounded-lg border border-[#99f6e4]">
                  {dualCourseCount} SV học 2 môn
                </span>
              </div>
              <FlexibleChartRenderer
                chartType={cfg.chartType}
                slices={courseSlices}
                centerText={`${totalStudents}`}
                centerSub="Sinh viên"
              />
            </div>
            <div className="pt-3 border-t border-[#e5e7eb] text-[13px] text-[#4b5563] flex items-center justify-between">
              <span>Tổng lượt đăng ký môn: <strong className="text-[#003087]">{ktcnOnlyCount + tsnnOnlyCount + dualCourseCount * 2} lượt</strong></span>
              <span>Song song KTCN+TSNN: <strong className="text-[#0d9488]">{pct(dualCourseCount)}%</strong></span>
            </div>
          </div>
        );

      case 'company_structure':
        return (
          <div key={cfg.id} className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-bold text-[#1f2937] text-[17.5px] text-left">{cfg.title}</h3>
                <span className="text-[12px] font-bold text-[#003087] bg-[#ebf3ff] px-2.5 py-1 rounded-lg border border-[#bfdbfe]">
                  {companyAggregation.uniqueCompanies} Doanh nghiệp
                </span>
              </div>
              <FlexibleChartRenderer
                chartType={cfg.chartType}
                slices={companyAggregation.slices}
                centerText={`${companyAggregation.uniqueCompanies}`}
                centerSub="Doanh nghiệp"
              />
            </div>
            <div className="pt-3 border-t border-[#e5e7eb] text-[13px] text-[#4b5563] flex items-center justify-between">
              <span>{hasCompanyPercent} sinh viên có doanh nghiệp</span>
              <span>{hasCompanyCount}/{totalStudents} SV đã tiếp nhận</span>
            </div>
          </div>
        );

      case 'major_distribution':
        return (
          <div key={cfg.id} className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-bold text-[#1f2937] text-[17.5px] text-left">{cfg.title}</h3>
                <span className="text-[12px] font-bold text-[#1f2937] bg-[#f8fafc] px-2.5 py-1 rounded-lg border border-[#e5e7eb]">
                  4 Chuyên ngành
                </span>
              </div>
              <FlexibleChartRenderer
                chartType={cfg.chartType}
                slices={majorSlices}
                centerText={`${totalStudents}`}
                centerSub="Sinh viên"
              />
            </div>
            <div className="pt-3 border-t border-[#e5e7eb] text-[13px] text-[#4b5563] flex items-center justify-between">
              <span>Đồng bộ trực tiếp từ danh sách SV</span>
              <span className="font-bold text-[#003087]">Tổng: {totalStudents} SV</span>
            </div>
          </div>
        );

      case 'gpa_distribution':
        return (
          <div key={cfg.id} className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-bold text-[#1f2937] text-[17.5px] text-left">{cfg.title}</h3>
                <div className="flex items-center gap-3 text-[12px] font-bold">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-[#003087] inline-block"></span>Xuất sắc</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-[#2563eb] inline-block"></span>Giỏi</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-[#d97706] inline-block"></span>Khá</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-[#dc2626] inline-block"></span>TB</span>
                </div>
              </div>

              {cfg.chartType === 'donut' || cfg.chartType === 'progress' ? (
                <FlexibleChartRenderer
                  chartType={cfg.chartType}
                  slices={gpaStats.slices}
                  centerText={gpaStats.avgGpa10}
                  centerSub="GPA TB / 10"
                />
              ) : (
                <div className="space-y-4 my-2">
                  {/* Biểu đồ thanh chồng Kết quả học tập theo ngành giống mẫu thiết kế */}
                  <div className="space-y-3">
                    {majorsStats.map((m, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="font-semibold text-[#1f2937]">{m.name}</span>
                          <span className="font-bold text-[#1f2937] font-mono">{m.total} SV</span>
                        </div>
                        <div className="w-full h-6 bg-[#f1f5f9] rounded-lg overflow-hidden flex">
                          {m.total > 0 ? m.segments.map((seg, sIdx) => {
                            if (seg.count <= 0) return null;
                            const w = Math.max(8, Math.round((seg.count / m.total) * 100));
                            return (
                              <div
                                key={sIdx}
                                style={{ width: `${w}%`, backgroundColor: seg.color }}
                                className="h-full flex items-center justify-center text-[11px] font-bold text-white transition-all duration-500"
                                title={`${m.name} - ${seg.label}: ${seg.count} SV`}
                              >
                                {seg.count}
                              </div>
                            );
                          }) : (
                            <div className="w-full h-full flex items-center justify-center text-[11px] text-[#64748b]">0 SV</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 mt-2 border-t border-[#e5e7eb] text-[13px] text-[#1f2937] flex flex-wrap items-center justify-between gap-2">
              <span>GPA trung bình (Hệ 10): <strong className="text-[#003087] font-mono">{gpaStats.avgGpa10} / 10.0</strong></span>
              <span className="font-bold text-[#15803d]">{gpaStats.khaGioiPct}% Đạt Khá – Giỏi – Xuất sắc</span>
            </div>
          </div>
        );

      case 'english_certs':
        return (
          <div key={cfg.id} className="bg-white p-6 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-bold text-[#1f2937] text-[17.5px] text-left">{cfg.title}</h3>
                <span className="text-[12px] font-bold text-[#003087] bg-[#ebf3ff] px-2.5 py-1 rounded-lg border border-[#bfdbfe]">
                  Chuẩn Đảm bảo chất lượng (B1)
                </span>
              </div>
              <FlexibleChartRenderer
                chartType={cfg.chartType}
                slices={englishSlices}
                centerText={`${englishSlices[0]?.percentage || 0}%`}
                centerSub="Đã nộp chứng chỉ"
              />
            </div>
            <div className="pt-3 border-t border-[#e5e7eb] text-[13px] text-[#4b5563] flex items-center justify-between">
              <span>Đã nộp minh chứng: <strong className="text-[#003087]">{englishSlices[0]?.count || 0} SV</strong></span>
              <span>Chưa nộp: <strong className="text-[#1f2937]">{englishSlices[1]?.count || 0} SV</strong></span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#e5e7eb]">
        <div>
          <h1 className="text-[26px] sm:text-[28px] font-bold text-[#1f2937] text-left tracking-tight">
            {isStudent ? 'Tổng quan Tiến độ Thực tập' : 'Bảng điều khiển'}
          </h1>
          <p className="text-[13.5px] text-[#4b5563] mt-0.5">
            Dữ liệu đồng bộ thời gian thực từ danh sách sinh viên ({totalStudents} sinh viên)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Nút Quản lý biểu đồ - Chỉ hiển thị cho Giảng viên / Ban Quản trị, ẩn đối với Sinh viên */}
          {!isStudent && (
            <button
              type="button"
              onClick={() => setShowChartManager(true)}
              className="px-5 py-2.5 min-w-[150px] bg-white hover:bg-[#f8fafc] text-[#003087] border border-[#003087] font-bold text-[12.5px] rounded-lg transition flex items-center justify-center gap-2 shadow-xs cursor-pointer whitespace-nowrap"
            >
              <svg className="w-4 h-4 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              <span>Quản lý biểu đồ</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. DÀNH CHO SINH VIÊN TRONG KỲ: BANNER ĐIỀU KIỆN & TÌNH TRẠNG THỰC TẬP */}
      {isStudent && isEnrolledStudent && window.StudentEligibilityBanner && (
        <window.StudentEligibilityBanner
          currentUser={currentUser}
          declaration={declaration}
          studentRecord={myStudentRecord}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* 3. TOP 5 EXECUTIVE KPI METRIC CARDS (100% DỮ LIỆU THỰC TẾ) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-[#4b5563] uppercase tracking-wider">Tổng sinh viên</span>
            <div className="p-2 bg-[#ebf3ff] text-[#003087] rounded-lg border border-[#bfdbfe]">
              <svg className="w-5 h-5 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-bold text-[#1f2937] font-mono leading-none">{totalStudents}</span>
            <span className="text-[13.5px] font-bold text-[#003087]">(100%)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-[#4b5563] uppercase tracking-wider">Đã có nơi TT</span>
            <div className="p-2 bg-[#ebf3ff] text-[#003087] rounded-lg border border-[#bfdbfe]">
              <svg className="w-5 h-5 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-bold text-[#1f2937] font-mono leading-none">{hasCompanyCount}</span>
            <span className="text-[13.5px] font-bold text-[#003087]">({hasCompanyPercent})</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-[#4b5563] uppercase tracking-wider">Chưa có / Chờ PV</span>
            <div className="p-2 bg-[#f8fafc] text-[#1f2937] rounded-lg border border-[#e5e7eb]">
              <svg className="w-5 h-5 text-[#1f2937]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-bold text-[#1f2937] font-mono leading-none">{inProgressCount}</span>
            <span className="text-[13.5px] font-bold text-[#1f2937]">({inProgressPercent})</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#fecaca] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-[#dc2626] uppercase tracking-wider">Cần Khoa hỗ trợ</span>
            <div className="p-2 bg-[#fef2f2] text-[#dc2626] rounded-lg border border-[#fecaca]">
              <svg className="w-5 h-5 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-bold text-[#dc2626] font-mono leading-none">{needSupportCount}</span>
            <span className="text-[13.5px] font-bold text-[#dc2626]">({needSupportPercent})</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e5e7eb] shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-[#4b5563] uppercase tracking-wider">Học song song 2 môn</span>
            <div className="p-2 bg-[#ebf3ff] text-[#003087] rounded-lg border border-[#bfdbfe]">
              <svg className="w-5 h-5 text-[#003087]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-bold text-[#1f2937] font-mono leading-none">{dualCourseCount}</span>
            <span className="text-[13.5px] font-bold text-[#003087]">({pct(dualCourseCount)}%)</span>
          </div>
        </div>
      </div>

      {/* 4. THANH ĐIỀU KHIỂN & LỌC BIỂU ĐỒ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#e5e7eb] pt-2 pb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTabSection('all')}
            className={`px-3.5 py-2 rounded-xl text-[13.5px] font-bold transition-all cursor-pointer ${
              activeTabSection === 'all'
                ? 'bg-[#003087] text-white shadow-xs'
                : 'bg-[#f8fafc] text-[#4b5563] hover:text-[#003087] border border-[#e5e7eb]'
            }`}
          >
            Tất cả biểu đồ ({chartConfig.filter(c => c.visible).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTabSection('overview')}
            className={`px-3.5 py-2 rounded-xl text-[13.5px] font-bold transition-all cursor-pointer ${
              activeTabSection === 'overview'
                ? 'bg-[#003087] text-white shadow-xs'
                : 'bg-[#f8fafc] text-[#4b5563] hover:text-[#003087] border border-[#e5e7eb]'
            }`}
          >
            Tiến độ & Cơ cấu Doanh nghiệp
          </button>
          <button
            type="button"
            onClick={() => setActiveTabSection('academic')}
            className={`px-3.5 py-2 rounded-xl text-[13.5px] font-bold transition-all cursor-pointer ${
              activeTabSection === 'academic'
                ? 'bg-[#003087] text-white shadow-xs'
                : 'bg-[#f8fafc] text-[#4b5563] hover:text-[#003087] border border-[#e5e7eb]'
            }`}
          >
            Kết quả Học tập (GPA) & Chứng chỉ
          </button>
        </div>

        {/* Bộ lọc biểu đồ trực tiếp */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={chartMajorFilter}
            onChange={e => setChartMajorFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#d1d5db] rounded-xl text-[13px] font-semibold text-[#1f2937] focus:outline-none focus:border-[#003087]"
          >
            <option value="ALL">Tất cả chuyên ngành</option>
            <option value="KHMT">Khoa học máy tính</option>
            <option value="KTPM">Kỹ thuật phần mềm</option>
            <option value="MMT">Mạng máy tính & TTDL</option>
            <option value="HTTT">Hệ thống thông tin</option>
          </select>

          <select
            value={chartCourseFilter}
            onChange={e => setChartCourseFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#d1d5db] rounded-xl text-[13px] font-semibold text-[#1f2937] focus:outline-none focus:border-[#003087]"
          >
            <option value="ALL">Tất cả học phần</option>
            <option value="KTCN">Kiến tập Công nghiệp (KTCN)</option>
            <option value="TSNN">Tập sự Nghề nghiệp (TSNN)</option>
            <option value="DUAL">Học song song 2 môn</option>
          </select>
        </div>
      </div>

      {/* 5. LƯỚI BIỂU ĐỒ ĐỘNG */}
      {visibleCharts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visibleCharts.map(cfg => renderChartCard(cfg))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl border border-[#e5e7eb] text-center space-y-3">
          <p className="text-[15px] font-bold text-[#1f2937]">Tất cả biểu đồ trong nhóm này đang được ẩn.</p>
          <button
            type="button"
            onClick={resetChartConfig}
            className="px-4 py-2 bg-[#003087] text-white rounded-xl text-[13.5px] font-bold cursor-pointer"
          >
            Khôi phục cấu hình biểu đồ mặc định
          </button>
        </div>
      )}



      {/* 7. MODAL QUẢN LÝ BIỂU ĐỒ (ITEM 13 - ENLARGED & PROFESSIONAL DESIGN) */}
      {showChartManager && !isStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[88vh]">
            <div className="p-5 border-b border-[#e5e7eb] flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-[18px] font-bold text-[#1f2937]">Quản Lý & Tùy Chỉnh Biểu Đồ Tổng Quan</h3>
                <p className="text-[12px] text-[#1f2937] mt-0.5">
                  Bật/tắt hiển thị, chuyển đổi kiểu biểu đồ (Tròn Donut / Cột Bar / Thanh ngang Progress) và điều chỉnh thứ tự
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowChartManager(false)}
                className="p-2 rounded-lg text-[#1f2937] hover:text-[#dc2626] font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto flex-1 text-[12.5px]">
              {[...chartConfig].sort((a, b) => a.order - b.order).map((cfg, idx, arr) => (
                <div
                  key={cfg.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    cfg.visible ? 'bg-white border-[#bfdbfe]' : 'bg-[#f8fafc] border-[#e5e7eb] opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={cfg.visible}
                      onChange={() => toggleChartVisible(cfg.id)}
                      className="w-4 h-4 accent-[#003087] cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-[13.5px] text-[#1f2937]">{cfg.title}</div>
                      <div className="text-[11.5px] text-[#1f2937]">
                        Phân nhóm: {cfg.tab === 'overview' ? 'Tiến độ thực tập & Doanh nghiệp' : 'Học vụ, Điểm GPA & Chứng chỉ'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={cfg.chartType}
                      onChange={e => changeChartType(cfg.id, e.target.value)}
                      className="px-3 py-1.5 bg-[#f8fafc] border border-[#d1d5db] rounded-lg text-[12px] font-semibold text-[#1f2937] outline-none"
                    >
                      <option value="donut">Biểu đồ Tròn (Donut)</option>
                      <option value="bar">Biểu đồ Cột (Bar)</option>
                      <option value="progress">Thanh tiến độ (Progress)</option>
                    </select>

                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveChartOrder(idx, -1)}
                      className="px-3 py-1.5 bg-[#f8fafc] hover:bg-[#ebf3ff] disabled:opacity-40 border border-[#d1d5db] rounded-lg text-[12px] font-bold text-[#1f2937] cursor-pointer"
                      title="Di chuyển lên"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={idx === arr.length - 1}
                      onClick={() => moveChartOrder(idx, 1)}
                      className="px-3 py-1.5 bg-[#f8fafc] hover:bg-[#ebf3ff] disabled:opacity-40 border border-[#d1d5db] rounded-lg text-[12px] font-bold text-[#1f2937] cursor-pointer"
                      title="Di chuyển xuống"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#f8fafc] border-t border-[#e5e7eb] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={resetChartConfig}
                className="px-5 py-2.5 min-w-[140px] bg-white hover:bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] rounded-lg text-[12.5px] font-bold cursor-pointer whitespace-nowrap"
              >
                Khôi phục mặc định
              </button>
              <button
                type="button"
                onClick={() => setShowChartManager(false)}
                className="px-6 py-2.5 min-w-[140px] bg-[#003087] hover:bg-[#002266] text-white rounded-lg text-[12.5px] font-bold cursor-pointer whitespace-nowrap shadow-xs"
              >
                Lưu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

window.DashboardPage = DashboardPage;
