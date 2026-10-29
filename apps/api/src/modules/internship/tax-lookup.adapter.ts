// ============================================================================
// COMPANY TAX ADAPTER (xinvoice / Tổng Cục Thuế API Adapter)
// Nhập MST -> Thu thập dữ liệu pháp lý -> Hiển thị cho Sinh viên đọc & xác nhận
// ============================================================================

import type { CompanyTaxInfo } from '../../../../../packages/shared-types/src/index.ts';

export class CompanyTaxAdapter {
  private readonly taxRegistry: Record<string, CompanyTaxInfo> = {
    '0303882213': {
      taxCode: '0303882213',
      companyName: 'CÔNG TY CỔ PHẦN PHẦN MỀM FPT (FPT SOFTWARE)',
      shortName: 'FPT Software',
      industry: 'Lập trình máy vi tính, Xuất khẩu phần mềm & Chuyển đổi số',
      address: 'Tòa nhà F-Town 3, Đường D2, Khu Công nghệ cao, P. Long Thạnh Mỹ, TP. Thủ Đức, TP. Hồ Chí Minh',
      representative: 'Phạm Minh Tuấn',
      taxStatus: 'Đang hoạt động (Đã cấp GCN ĐKT)',
      isPartner: true,
      suggestedPosition: 'Thực tập sinh Phát triển Phần mềm (React / Node.js / Cloud)',
    },
    '0100109106': {
      taxCode: '0100109106',
      companyName: 'TẬP ĐOÀN CÔNG NGHIỆP - VIỄN THÔNG QUÂN ĐỘI (VIETTEL)',
      shortName: 'Viettel Cyber Security',
      industry: 'An ninh mạng, Viễn thông, Trí tuệ nhân tạo & Hạ tầng số',
      address: 'Số 285 Cách Mạng Tháng Tám, Phường 12, Quận 10, TP. Hồ Chí Minh (Chi nhánh phía Nam)',
      representative: 'Tào Đức Thắng',
      taxStatus: 'Đang hoạt động (Đã cấp GCN ĐKT)',
      isPartner: true,
      suggestedPosition: 'Thực tập sinh An toàn thông tin (SOC / Pentest)',
    },
    '0312345678': {
      taxCode: '0312345678',
      companyName: 'CÔNG TY CỔ PHẦN VNG (VNG CORPORATION)',
      shortName: 'VNG Corporation',
      industry: 'Nền tảng số, Trò chơi trực tuyến, Fintech (ZaloPay) & AI Cloud',
      address: 'Z06 Đường số 13, Khu chế xuất Tân Thuận, Phường Tân Thuận Đông, Quận 7, TP. Hồ Chí Minh',
      representative: 'Lê Hồng Minh',
      taxStatus: 'Đang hoạt động (Đã cấp GCN ĐKT)',
      isPartner: true,
      suggestedPosition: 'Software Engineer Intern (Backend / Distributed Systems)',
    },
    '0309876543': {
      taxCode: '0309876543',
      companyName: 'CÔNG TY TNHH KMS TECHNOLOGY VIỆT NAM',
      shortName: 'KMS Technology',
      industry: 'Phát triển sản phẩm phần mềm, Kiểm thử tự động (Automation QA) & Data',
      address: 'Số 2 Tản Viên, Phường 2, Quận Tân Bình, TP. Hồ Chí Minh',
      representative: 'Trần Trọng Đại',
      taxStatus: 'Đang hoạt động (Đã cấp GCN ĐKT)',
      isPartner: true,
      suggestedPosition: 'Software Engineering / Automation QA Intern',
    },
    '0304567891': {
      taxCode: '0304567891',
      companyName: 'CÔNG TY TNHH DXC TECHNOLOGY VIỆT NAM',
      shortName: 'DXC Technology',
      industry: 'Tư vấn giải pháp CNTT doanh nghiệp & Hệ thống thông tin toàn cầu',
      address: 'Tòa nhà eTown 5, 364 Cộng Hòa, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh',
      representative: 'Nguyễn Hữu Minh',
      taxStatus: 'Đang hoạt động (Đã cấp GCN ĐKT)',
      isPartner: true,
      suggestedPosition: 'Full-Stack Enterprise Developer Intern',
    },
    '0101243150': {
      taxCode: '0101243150',
      companyName: 'CÔNG TY CỔ PHẦN MISA (MISA JSC)',
      shortName: 'MISA JSC',
      industry: 'Phần mềm Quản trị Doanh nghiệp, Kế toán số & AI ERP',
      address: 'Tòa nhà MISA, Công viên Phần mềm Quang Trung, Quận 12, TP. Hồ Chí Minh',
      representative: 'Lữ Thành Long',
      taxStatus: 'Đang hoạt động (Đã cấp GCN ĐKT)',
      isPartner: true,
      suggestedPosition: 'Thực tập sinh Phát triển Sản phẩm Web/Mobile',
    },
    '0302030405': {
      taxCode: '0302030405',
      companyName: 'CÔNG TY TNHH NASHTECH VIỆT NAM',
      shortName: 'NashTech',
      industry: 'Gia công quy trình phần mềm quốc tế & Giải pháp Cloud/AI',
      address: 'Tòa nhà eTown 2, 364 Cộng Hòa, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh',
      representative: 'Nguyễn Hùng Cường',
      taxStatus: 'Đang hoạt động (Đã cấp GCN ĐKT)',
      isPartner: true,
      suggestedPosition: 'Cloud DevOps & Full-Stack .NET/React Intern',
    },
    '0100681042': {
      taxCode: '0100681042',
      companyName: 'CÔNG TY CỔ PHẦN NETNAM (NETNAM CORP)',
      shortName: 'NetNam Corp',
      industry: 'Dịch vụ Hạ tầng Mạng, An toàn thông tin & Managed ISP',
      address: 'Số 242 Cống Quỳnh, Phường Phạm Ngũ Lão, Quận 1, TP. Hồ Chí Minh',
      representative: 'Vũ Thế Bình',
      taxStatus: 'Đang hoạt động (Đã cấp GCN ĐKT)',
      isPartner: true,
      suggestedPosition: 'Thực tập sinh Kỹ sư Mạng & Hạ tầng An ninh',
    },
  };

  /**
   * Tra cứu thông tin pháp lý doanh nghiệp từ Mã Số Thuế (MST)
   * Chuẩn hóa dữ liệu qua Adapter Contract để trả về cho Frontend hiển thị bảng đối soát
   */
  async lookupByTaxCode(rawTaxCode: string): Promise<CompanyTaxInfo> {
    const cleanMst = (rawTaxCode || '').trim().replace(/\s+/g, '');
    if (!/^\d{8,13}(?:-\d{3})?$/.test(cleanMst)) {
      throw new Error('Mã số thuế không hợp lệ (Cần 8-13 chữ số, hoặc kèm mã chi nhánh -XXX).');
    }

    const baseMst = cleanMst.split('-')[0];
    const matched = this.taxRegistry[cleanMst] || this.taxRegistry[baseMst];
    if (matched) {
      return {
        ...matched,
        taxCode: cleanMst,
      };
    }

    // Fallback mô phỏng tra cứu xinvoice cho mọi MST hợp lệ khác
    return {
      taxCode: cleanMst,
      companyName: `CÔNG TY TNHH GIẢI PHÁP CÔNG NGHỆ SỐ (${cleanMst})`,
      shortName: `TechCorp ${baseMst.slice(-4)}`,
      industry: 'Phát triển phần mềm, Dịch vụ CNTT & Chuyển đổi số',
      address: 'Số 19 Nguyễn Hữu Thọ, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh',
      representative: 'Nguyễn Minh Quân (Giám đốc điều hành)',
      taxStatus: 'Đang hoạt động (Đã cấp GCN ĐKT)',
      isPartner: false,
      suggestedPosition: 'Thực tập sinh Phát triển Phần mềm & Hệ thống',
    };
  }
}
