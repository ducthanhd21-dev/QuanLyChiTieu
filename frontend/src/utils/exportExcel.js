import * as XLSX from 'xlsx';
import { formatDate, getBillStatus, STATUS_CONFIG } from './helpers';

// Export user bills to Excel file
export const exportBillsToExcel = (bills, monthStr) => {
  const data = bills.map((b, idx) => {
    const status = getBillStatus(b);
    const statusText = STATUS_CONFIG[status]?.label || (b.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán');
    return {
      'STT': idx + 1,
      'Tên khoản thanh toán': b.title,
      'Danh mục': b.category || 'Hóa đơn',
      'Ngày đến hạn': formatDate(b.due_date),
      'Số tiền (VNĐ)': parseFloat(b.amount) || 0,
      'Trạng thái': statusText,
      'Lặp lại định kỳ': b.is_recurring ? 'Có' : 'Không',
      'Đính kèm biên lai': b.receipt_url ? 'Đã có ảnh' : 'Chưa có',
      'Ghi chú': b.note || '',
    };
  });

  // Calculate totals
  const totalAmount = bills.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
  const paidAmount = bills.filter(b => b.is_paid).reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
  const unpaidAmount = totalAmount - paidAmount;

  // Add summary rows
  data.push({});
  data.push({
    'Tên khoản thanh toán': 'TỔNG CỘNG',
    'Số tiền (VNĐ)': totalAmount,
    'Ghi chú': `Đã thanh toán: ${paidAmount.toLocaleString('vi-VN')} đ | Còn nợ: ${unpaidAmount.toLocaleString('vi-VN')} đ`,
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 28 }, // Tên khoản
    { wch: 16 }, // Danh mục
    { wch: 14 }, // Ngày đến hạn
    { wch: 18 }, // Số tiền
    { wch: 16 }, // Trạng thái
    { wch: 16 }, // Định kỳ
    { wch: 18 }, // Biên lai
    { wch: 30 }, // Ghi chú
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Hóa đơn ${monthStr || ''}`);

  const filename = `BillTrack_HoaDon_${(monthStr || 'tat_ca').replace('/', '_')}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

// Export Admin users report to Excel file
export const exportAdminUsersToExcel = (users, monthStr) => {
  const data = users.map((u, idx) => ({
    'STT': idx + 1,
    'Họ tên': u.name,
    'Email': u.email,
    'Vai trò': u.role === 'admin' ? 'Quản trị viên (Admin)' : 'Người dùng (User)',
    'Ngày đăng ký': formatDate(u.createdAt),
    'Số hóa đơn trong tháng': u.monthlySummary.totalBills,
    'Tổng tiền (VNĐ)': u.monthlySummary.totalAmount,
    'Đã thanh toán (VNĐ)': u.monthlySummary.paidAmount,
    'Còn nợ (VNĐ)': u.monthlySummary.unpaidAmount,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 28 },
    { wch: 22 },
    { wch: 14 },
    { wch: 22 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách người dùng');

  const filename = `BillTrack_BaoCao_QuanTri_${(monthStr || '').replace('/', '_')}.xlsx`;
  XLSX.writeFile(workbook, filename);
};
