import dayjs from 'dayjs';

// Format currency in VND
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount || 0);
};

// Format date as DD/MM/YYYY
export const formatDate = (date) => {
  if (!date) return '';
  return dayjs(date).format('DD/MM/YYYY');
};

// Get bill status
export const getBillStatus = (bill) => {
  if (bill.is_paid) return 'paid';
  const today = dayjs().startOf('day');
  const dueDate = dayjs(bill.due_date).startOf('day');
  if (dueDate.isBefore(today)) return 'overdue';
  return 'unpaid';
};

export const STATUS_CONFIG = {
  paid: { label: 'Đã thanh toán', color: 'success' },
  unpaid: { label: 'Chưa thanh toán', color: 'warning' },
  overdue: { label: 'Quá hạn', color: 'error' },
};

// Month format: YYYY-MM
export const currentMonth = () => dayjs().format('YYYY-MM');

export const CATEGORIES = [
  'Hóa đơn',
  'Điện nước',
  'Tiền nhà',
  'Internet',
  'Điện thoại',
  'Bảo hiểm',
  'Học phí',
  'Ăn uống',
  'Giao thông',
  'Giải trí',
  'Y tế',
  'Khác',
];
