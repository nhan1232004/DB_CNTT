const fs = require('fs');

const lecturersDefinition = `const TDTU_LECTURERS = [
  { name: 'ThS. Đặng Huỳnh Trung', title: 'Điều phối TSNN & Quan hệ Doanh nghiệp', email: 'danghuynhtrung@tdtu.edu.vn' },
  { name: 'TS. Trần Thị B', title: 'Phó Trưởng Khoa CNTT (Cố vấn học tập)', email: 'tranthib@tdtu.edu.vn' },
  { name: 'TS. Phạm Văn C', title: 'Trưởng Khoa CNTT (Phụ trách Đào tạo)', email: 'phamvanc@tdtu.edu.vn' },
  { name: 'ThS. Lê Hoàng D', title: 'Bộ môn Mạng máy tính & Viễn thông', email: 'lehoangd@tdtu.edu.vn' },
  { name: 'ThS. Nguyễn Văn A', title: 'Bộ môn Kỹ thuật Phần mềm', email: 'nguyenvana@tdtu.edu.vn' },
  { name: 'TS. Vũ Đình Bảy', title: 'Trưởng Bộ môn Khoa học Máy tính', email: 'vudinhbay@tdtu.edu.vn' },
  { name: 'ThS. Bùi Thị Thanh Tuyền', title: 'Bộ môn Mạng & ATTT', email: 'buithithanhtuyen@tdtu.edu.vn' },
  { name: 'Khoa CNTT phân công', title: 'Ban Chủ nhiệm Khoa điều phối', email: 'khoacntt@tdtu.edu.vn' }
];
`;

console.log('Script template ready.');
