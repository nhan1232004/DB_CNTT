export interface ParsedEmailJd {
  title: string;
  companyName: string;
  position: string;
  salary: string;
  location: string;
  slots: number;
  content: string;
  sourceEmail: string;
}

export function parseInboundEmailForward(rawEmail: string): ParsedEmailJd {
  const text = rawEmail || '';

  // Extract from address (handles multi-level forward headers: "From: ...", "---------- Forwarded message ---------")
  let sourceEmail = 'doanhnghiep@partner.com';
  const fromMatches = [...text.matchAll(/From:\s*([^<\r\n]+<)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(>)?/gi)];
  if (fromMatches.length > 0) {
    // If multiple From: headers exist (due to forward nesting), prefer the original sender
    sourceEmail = fromMatches[fromMatches.length - 1][2];
  }

  // Extract subject
  let subject = 'Cơ hội Thực tập CNTT Doanh nghiệp';
  const subjectMatch = text.match(/Subject:\s*([^\r\n]+)/i);
  if (subjectMatch) {
    subject = subjectMatch[1].replace(/^(Fwd:|Fw:)\s*/i, '').trim();
  }

  // Extract Company Name
  let companyName = 'Doanh nghiệp Đối tác CNTT';
  const compMatch = text.match(/(Công ty|Cty|Company|Tập đoàn)\s*([A-Za-z0-9\s.,-]+?)(?=(\n|,|\.|\r|tuyển|thông báo))/i);
  if (compMatch) {
    companyName = `${compMatch[1]} ${compMatch[2]}`.trim();
  }

  // Extract Position
  let position = 'Thực tập sinh Công nghệ Thông tin';
  const posMatch = text.match(/(Tuyển dụng|Vị trí|Cần tuyển|Intern)\s*[:\-]?\s*([^\r\n,.]+)/i);
  if (posMatch) {
    position = posMatch[2].trim();
  }

  // Extract Salary / Allowance
  let salary = 'Thỏa thuận theo năng lực';
  const salaryMatch = text.match(/(Phụ cấp|Lương|Mức lương|Hỗ trợ)\s*[:\-]?\s*([0-9.,]+(\s*(tr|triệu|k|VNĐ|USD))?(\s*-\s*[0-9.,]+(\s*(tr|triệu|k|VNĐ|USD))?)?)/i);
  if (salaryMatch) {
    salary = salaryMatch[0].trim();
  }

  // Extract Slots
  let slots = 5;
  const slotsMatch = text.match(/([0-9]+)\s*(chỉ tiêu|bạn|sinh viên|thực tập sinh|slots|người)/i);
  if (slotsMatch) {
    slots = parseInt(slotsMatch[1], 10) || 5;
  }

  // Extract Location
  let location = 'TP. Hồ Chí Minh';
  const locMatch = text.match(/(Địa điểm|Nơi làm việc|Địa chỉ|Làm việc tại)\s*[:\-]?\s*([^\r\n]+)/i);
  if (locMatch) {
    location = locMatch[2].trim();
  }

  return {
    title: subject,
    companyName,
    position,
    salary,
    location,
    slots,
    content: text.trim(),
    sourceEmail
  };
}
