import { useState, useEffect, useCallback } from 'react';
import {
  Row, Col, Card, Typography, DatePicker, Button, Progress,
  Tag, Checkbox, Space, Spin, Empty, Popconfirm,
  notification, Tooltip, Grid, Alert, Modal, InputNumber, Image,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, FireOutlined,
  CalendarOutlined, TagOutlined, FileExcelOutlined, CopyOutlined,
  WarningOutlined, PaperClipOutlined, SyncOutlined, AimOutlined, RiseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { dashboardService, billService, budgetService, incomeService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate, getBillStatus, STATUS_CONFIG } from '../utils/helpers';
import { exportBillsToExcel } from '../utils/exportExcel';
import BillModal from '../components/BillModal';
import PWAInstallPrompt from '../components/PWAInstallPrompt';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const DashboardPage = () => {
  const { user } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);

  // Alerts
  const [alerts, setAlerts] = useState([]);

  // Budget
  const [budget, setBudget] = useState(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState(0);
  const [budgetLoading, setBudgetLoading] = useState(false);

  // Income
  const [incomeTotal, setIncomeTotal] = useState(0);

  // Receipt preview modal
  const [previewImage, setPreviewImage] = useState(null);

  // Copying state
  const [copying, setCopying] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [prevMonthBills, setPrevMonthBills] = useState([]);
  const [prevBillsLoading, setPrevBillsLoading] = useState(false);
  const [selectedCopyIds, setSelectedCopyIds] = useState([]);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const month = selectedMonth.format('YYYY-MM');
      const [sumRes, budgetRes, alertRes] = await Promise.all([
        dashboardService.getSummary(month),
        budgetService.getBudget(month),
        billService.getAlerts(),
      ]);
      setSummary(sumRes.data.data);
      setBudget(budgetRes.data.data);
      setAlerts(alertRes.data.data);
      // Income is fetched separately so dashboard still loads if it fails
      try {
        const incomeRes = await incomeService.getByMonth(month);
        setIncomeTotal(incomeRes.data.data.total || 0);
      } catch {
        setIncomeTotal(0);
      }
    } catch {
      notification.error({ message: 'Không thể tải dữ liệu trang chủ.' });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleTogglePaid = async (bill) => {
    try {
      await billService.togglePaid(bill.id);
      const msg = !bill.is_paid ? 'Đã đánh dấu đã thanh toán!' : 'Đã bỏ đánh dấu thanh toán!';
      notification.success({ message: msg, duration: 2 });
      fetchSummary();
    } catch {
      notification.error({ message: 'Cập nhật thất bại.' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await billService.remove(id);
      notification.success({ message: 'Đã xóa khoản thanh toán!' });
      fetchSummary();
    } catch {
      notification.error({ message: 'Xóa thất bại.' });
    }
  };

  const handleEdit = (bill) => {
    setEditingBill(bill);
    setBillModalOpen(true);
  };

  const handleModalClose = () => {
    setBillModalOpen(false);
    setEditingBill(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchSummary();
  };

  // Open modal to select bills from previous month
  const handleOpenCopyModal = async () => {
    setCopyModalOpen(true);
    setPrevBillsLoading(true);
    setPrevMonthBills([]);
    setSelectedCopyIds([]);
    try {
      const prevMonth = selectedMonth.subtract(1, 'month').format('YYYY-MM');
      const res = await billService.getAll({ month: prevMonth });
      const bills = res.data.data || [];
      setPrevMonthBills(bills);

      // Auto-select bills that do not already exist (by title) in the current month
      const existingTitles = new Set(
        (summary?.bills || []).map((b) => b.title.trim().toLowerCase())
      );
      const defaultSelected = bills
        .filter((b) => !existingTitles.has(b.title.trim().toLowerCase()))
        .map((b) => b.id);
      setSelectedCopyIds(defaultSelected);
    } catch {
      notification.error({ message: 'Không thể tải danh sách hóa đơn tháng trước.' });
      setCopyModalOpen(false);
    } finally {
      setPrevBillsLoading(false);
    }
  };

  // Copy selected bills to current month
  const handleCopySelectedBills = async () => {
    if (selectedCopyIds.length === 0) {
      notification.warning({ message: 'Vui lòng chọn ít nhất 1 hóa đơn để sao chép.' });
      return;
    }
    setCopying(true);
    try {
      const selectedBills = prevMonthBills.filter((b) => selectedCopyIds.includes(b.id));
      const maxDays = selectedMonth.daysInMonth();

      await Promise.all(
        selectedBills.map((bill) => {
          const day = Math.min(dayjs(bill.due_date).date(), maxDays);
          const newDueDate = selectedMonth.date(day).format('YYYY-MM-DD');
          return billService.create({
            title: bill.title,
            amount: parseFloat(bill.amount),
            due_date: newDueDate,
            category: bill.category || 'Hóa đơn',
            note: bill.note || '',
            is_recurring: false,
            duration_months: 1,
          });
        })
      );

      notification.success({
        message: `Đã sao chép thành công ${selectedBills.length} khoản từ tháng ${selectedMonth.subtract(1, 'month').format('MM/YYYY')}!`,
      });
      setCopyModalOpen(false);
      fetchSummary();
    } catch {
      notification.error({ message: 'Sao chép thất bại. Vui lòng thử lại.' });
    } finally {
      setCopying(false);
    }
  };

  const toggleSelectCopyId = (id) => {
    setSelectedCopyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllCopy = (checked) => {
    if (checked) {
      setSelectedCopyIds(prevMonthBills.map((b) => b.id));
    } else {
      setSelectedCopyIds([]);
    }
  };

  // Save budget
  const handleSaveBudget = async () => {
    setBudgetLoading(true);
    try {
      const month = selectedMonth.format('YYYY-MM');
      await budgetService.setBudget({ month, amount: budgetInput });
      notification.success({ message: 'Đã lưu hạn mức ngân sách!' });
      setBudgetModalOpen(false);
      fetchSummary();
    } catch {
      notification.error({ message: 'Lưu ngân sách thất bại.' });
    } finally {
      setBudgetLoading(false);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    if (!summary || !summary.bills || summary.bills.length === 0) {
      notification.warning({ message: 'Không có dữ liệu hóa đơn trong tháng này để xuất file.' });
      return;
    }
    exportBillsToExcel(summary.bills, selectedMonth.format('MM/YYYY'));
    notification.success({ message: 'Đã xuất file Excel thành công!' });
  };

  // Greeting based on time of day
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return { text: 'Chào buổi sáng', emoji: '🌅' };
    if (h < 18) return { text: 'Chào buổi chiều', emoji: '☀️' };
    return { text: 'Chào buổi tối', emoji: '🌙' };
  };
  const greeting = getGreeting();

  const statsCards = summary ? [
    {
      title: 'Tổng chi tiêu',
      value: summary.totalAmount,
      icon: <DollarOutlined />,
      color: '#1890ff',
      gradient: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
      bgGradient: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
      format: 'currency',
      emoji: '💰',
    },
    {
      title: 'Đã thanh toán',
      value: summary.paidAmount,
      icon: <CheckCircleOutlined />,
      color: '#52c41a',
      gradient: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
      bgGradient: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
      format: 'currency',
      emoji: '✅',
    },
    {
      title: 'Chưa thanh toán',
      value: summary.unpaidAmount,
      icon: <ClockCircleOutlined />,
      color: '#faad14',
      gradient: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
      bgGradient: 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)',
      format: 'currency',
      emoji: '⏳',
    },
    {
      title: 'Số hóa đơn',
      value: summary.totalBills,
      suffix: `${summary.paidCount} đã đóng`,
      icon: <FireOutlined />,
      color: '#722ed1',
      gradient: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
      bgGradient: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)',
      format: 'number',
      emoji: '📋',
    },
  ] : [];

  // Overdue and upcoming counts
  const overdueAlerts = alerts.filter(a => parseInt(a.days_remaining) < 0);
  const upcomingAlerts = alerts.filter(a => parseInt(a.days_remaining) >= 0);
  const overdueTotal = overdueAlerts.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
  const upcomingTotal = upcomingAlerts.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);

  // Budget calculations
  const budgetAmount = budget ? parseFloat(budget.amount) : 0;
  const totalSpent = summary ? summary.totalAmount : 0;
  const budgetProgress = budgetAmount > 0 ? Math.round((totalSpent / budgetAmount) * 100) : 0;
  const budgetRemaining = budgetAmount - totalSpent;

  // Income vs spending
  const incomeVsSpending = incomeTotal - (summary ? summary.totalAmount : 0);
  const incomeProgress = incomeTotal > 0 ? Math.round(((summary ? summary.totalAmount : 0) / incomeTotal) * 100) : 0;

  return (
    <div className="page-enter">
      {/* PWA Mobile Install Banner */}
      {isMobile && <PWAInstallPrompt type="banner" />}

      {/* Welcome Greeting Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1f36 0%, #1890ff 60%, #096dd9 100%)',
        borderRadius: 18,
        padding: isMobile ? '16px 18px' : '20px 28px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 6px 24px rgba(24,144,255,0.25)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decoration */}
        <div style={{
          position: 'absolute', top: -30, right: 60,
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -20, right: -20,
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
        }} />
        <div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: isMobile ? 12 : 13, marginBottom: 3 }}>
            {greeting.emoji} {greeting.text}
          </div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: isMobile ? 18 : 22, lineHeight: 1.2 }}>
            {user?.name?.split(' ').pop()} 👋
          </div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: isMobile ? 12 : 13, marginTop: 4 }}>
            Tháng {selectedMonth.format('MM/YYYY')}
            {summary && ` · ${summary.totalBills} khoản · ${summary.progress}% hoàn thành`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <DatePicker
            picker="month"
            value={selectedMonth}
            onChange={(val) => val && setSelectedMonth(val)}
            format="MM/YYYY"
            placeholder="Chọn tháng"
            allowClear={false}
            style={{
              borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              width: isMobile ? 100 : 120,
            }}
          />
        </div>
      </div>

      {/* Action Bar */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <Button
          icon={<FileExcelOutlined style={{ color: '#52c41a' }} />}
          onClick={handleExportExcel}
          style={{ borderRadius: 10 }}
        >
          {isMobile ? 'Excel' : 'Xuất Excel'}
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setBillModalOpen(true)}
          style={{ marginLeft: 'auto', borderRadius: 10 }}
        >
          {isMobile ? 'Thêm' : 'Thêm khoản thanh toán'}
        </Button>
      </div>

      {/* Due Date Alerts Banner */}
      {(overdueAlerts.length > 0 || upcomingAlerts.length > 0) && (
        <div style={{ marginBottom: 16 }}>
          {overdueAlerts.length > 0 && (
            <div style={{
              background: '#fff2f0',
              border: '1px solid #ffccc7',
              borderRadius: 14,
              padding: '12px 14px',
              marginBottom: 10,
              boxShadow: '0 2px 8px rgba(255, 77, 79, 0.06)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 6,
                marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>🚨</span>
                  <span style={{ fontWeight: 700, color: '#cf1322', fontSize: isMobile ? 13 : 14 }}>
                    Quá hạn: {overdueAlerts.length} khoản chưa đóng
                  </span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#ff4d4f' }}>
                  Tổng: {formatCurrency(overdueTotal)}
                </span>
              </div>

              <div style={{
                display: 'flex',
                gap: 6,
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                paddingBottom: 2,
                scrollbarWidth: 'none',
              }}>
                {overdueAlerts.map((a) => (
                  <span
                    key={a.id}
                    style={{
                      background: '#fff',
                      border: '1px solid #ffa39e',
                      color: '#cf1322',
                      fontSize: 11,
                      padding: '3px 10px',
                      borderRadius: 16,
                      fontWeight: 500,
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    <span>{a.title}</span>
                    <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{formatCurrency(a.amount)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {upcomingAlerts.length > 0 && (
            <div style={{
              background: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: 14,
              padding: '12px 14px',
              marginBottom: 8,
              boxShadow: '0 2px 8px rgba(250, 173, 20, 0.06)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 6,
                marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>⏰</span>
                  <span style={{ fontWeight: 700, color: '#d46b08', fontSize: isMobile ? 13 : 14 }}>
                    Sắp đến hạn: {upcomingAlerts.length} khoản (trong 3 ngày)
                  </span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fa8c16' }}>
                  Tổng: {formatCurrency(upcomingTotal)}
                </span>
              </div>

              <div style={{
                display: 'flex',
                gap: 6,
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                paddingBottom: 2,
                scrollbarWidth: 'none',
              }}>
                {upcomingAlerts.map((a) => (
                  <span
                    key={a.id}
                    style={{
                      background: '#fff',
                      border: '1px solid #ffd591',
                      color: '#d46b08',
                      fontSize: 11,
                      padding: '3px 10px',
                      borderRadius: 16,
                      fontWeight: 500,
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    <span>{a.title}</span>
                    <span style={{ color: '#fa8c16', fontWeight: 600 }}>{formatCurrency(a.amount)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Spin spinning={loading}>
        {/* Stat Cards */}
        <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
          {statsCards.map((card) => (
            <Col xs={12} sm={12} md={6} key={card.title}>
              <Card
                className="stat-card"
                style={{
                  borderRadius: 16,
                  border: 'none',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                  height: '100%',
                  overflow: 'hidden',
                }}
                bodyStyle={{ padding: isMobile ? '14px 12px' : '18px 16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10, marginBottom: 8 }}>
                  <div style={{
                    width: isMobile ? 40 : 48,
                    height: isMobile ? 40 : 48,
                    borderRadius: 14,
                    background: card.bgGradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? 20 : 22,
                    flexShrink: 0,
                  }}>
                    {card.emoji}
                  </div>
                  <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12 }} ellipsis>
                    {card.title}
                  </Text>
                </div>
                <div style={{
                  fontWeight: 800,
                  fontSize: isMobile ? 14 : 17,
                  color: card.color,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {card.format === 'currency' ? formatCurrency(card.value) : card.value}
                </div>
                {card.suffix && (
                  <Text type="secondary" style={{ fontSize: 11 }}>{card.suffix}</Text>
                )}
              </Card>
            </Col>
          ))}
        </Row>

        {/* Progress & Monthly Budget in 2 columns */}
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          {/* Payment Progress */}
          <Col xs={24} md={12}>
            {summary && (
              <Card style={{
                borderRadius: 14,
                border: 'none',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                height: '100%',
              }}
                bodyStyle={{ padding: isMobile ? '14px 12px' : '18px 20px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text strong style={{ fontSize: isMobile ? 14 : 15 }}>
                    Tiến độ thanh toán tháng {selectedMonth.format('MM/YYYY')}
                  </Text>
                  <Text strong style={{ color: '#1890ff', fontSize: isMobile ? 16 : 18 }}>
                    {summary.progress}%
                  </Text>
                </div>
                <Progress
                  percent={summary.progress}
                  strokeColor={{ '0%': '#108ee9', '100%': '#52c41a' }}
                  trailColor="#f0f0f0"
                  strokeWidth={10}
                  style={{ marginBottom: 8 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, fontSize: 12 }}>
                  <Text type="secondary">{summary.paidCount}/{summary.totalBills} khoản đã đóng</Text>
                  <Text type="secondary">
                    Còn lại: <Text strong style={{ color: '#faad14' }}>{formatCurrency(summary.unpaidAmount)}</Text>
                  </Text>
                </div>
              </Card>
            )}
          </Col>

          {/* Monthly Budget Card */}
          <Col xs={24} md={12}>
            <Card style={{
              borderRadius: 14,
              border: 'none',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              height: '100%',
            }}
              bodyStyle={{ padding: isMobile ? '14px 12px' : '18px 20px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AimOutlined style={{ color: '#722ed1', fontSize: 18 }} />
                  <Text strong style={{ fontSize: isMobile ? 14 : 15 }}>
                    Hạn mức chi tiêu tháng {selectedMonth.format('MM/YYYY')}
                  </Text>
                </div>
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    setBudgetInput(budgetAmount);
                    setBudgetModalOpen(true);
                  }}
                  style={{ padding: 0 }}
                >
                  {budget ? 'Đổi hạn mức' : 'Thiết lập'}
                </Button>
              </div>

              {budget ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Hạn mức: <b>{formatCurrency(budgetAmount)}</b>
                    </Text>
                    <Text strong style={{
                      color: budgetProgress > 100 ? '#ff4d4f' : budgetProgress > 80 ? '#faad14' : '#52c41a',
                      fontSize: 14,
                    }}>
                      {budgetProgress}%
                    </Text>
                  </div>
                  <Progress
                    percent={Math.min(budgetProgress, 100)}
                    status={budgetProgress > 100 ? 'exception' : undefined}
                    strokeColor={budgetProgress > 100 ? '#ff4d4f' : budgetProgress > 80 ? '#faad14' : '#52c41a'}
                    trailColor="#f0f0f0"
                    strokeWidth={10}
                    style={{ marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <Text type="secondary">Đã lên kế hoạch: {formatCurrency(totalSpent)}</Text>
                    <Text style={{ color: budgetRemaining < 0 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>
                      {budgetRemaining < 0
                        ? `Vượt ${formatCurrency(Math.abs(budgetRemaining))}`
                        : `Còn lại ${formatCurrency(budgetRemaining)}`}
                    </Text>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
                    Chưa đặt hạn mức ngân sách cho tháng này.
                  </Text>
                  <Button
                    size="small"
                    type="dashed"
                    onClick={() => {
                      setBudgetInput(10000000);
                      setBudgetModalOpen(true);
                    }}
                  >
                    + Đặt hạn mức chi tiêu
                  </Button>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* Income vs Spending Card */}
        <Card
          style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 20 }}
          bodyStyle={{ padding: isMobile ? '14px 12px' : '18px 24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RiseOutlined style={{ color: '#52c41a', fontSize: 18 }} />
              <Text strong style={{ fontSize: isMobile ? 14 : 15 }}>
                Thu nhập vs Chi tiêu tháng {selectedMonth.format('MM/YYYY')}
              </Text>
            </div>
            <Button
              type="link"
              size="small"
              onClick={() => window.location.href = '/income'}
              style={{ padding: 0 }}
            >
              + Cập nhật thu nhập
            </Button>
          </div>
          <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
            <Col xs={8}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Thu nhập</Text>
                <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 17, color: '#52c41a' }}>
                  {formatCurrency(incomeTotal)}
                </div>
              </div>
            </Col>
            <Col xs={8}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Chi tiêu</Text>
                <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 17, color: '#1890ff' }}>
                  {formatCurrency(summary ? summary.totalAmount : 0)}
                </div>
              </div>
            </Col>
            <Col xs={8}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                  {incomeVsSpending >= 0 ? 'Tiết kiệm' : 'Vượt chi'}
                </Text>
                <div style={{
                  fontWeight: 700,
                  fontSize: isMobile ? 14 : 17,
                  color: incomeVsSpending >= 0 ? '#52c41a' : '#ff4d4f',
                }}>
                  {incomeVsSpending >= 0 ? '+' : ''}{formatCurrency(incomeVsSpending)}
                </div>
              </div>
            </Col>
          </Row>
          {incomeTotal > 0 ? (
            <>
              <Progress
                percent={Math.min(incomeProgress, 100)}
                status={incomeProgress > 100 ? 'exception' : undefined}
                strokeColor={incomeProgress > 100 ? '#ff4d4f' : incomeProgress > 80 ? '#faad14' : '#52c41a'}
                trailColor="#f0f0f0"
                strokeWidth={10}
                style={{ marginBottom: 4 }}
              />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {incomeProgress <= 100
                  ? `Chi tiêu chiếm ${incomeProgress}% thu nhập — còn tiết kiệm được ${formatCurrency(incomeVsSpending)}`
                  : `⚠️ Chi tiêu vượt thu nhập ${formatCurrency(Math.abs(incomeVsSpending))}`
                }
              </Text>
            </>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Chưa có dữ liệu thu nhập.{' '}
                <a href="/income" style={{ color: '#52c41a' }}>Thêm thu nhập ngay →</a>
              </Text>
            </div>
          )}
        </Card>

        {/* Copy from previous month banner if 0 bills */}
        {summary && summary.bills.length === 0 && (
          <Card
            style={{
              marginBottom: 20,
              borderRadius: 14,
              border: '1px dashed #1890ff',
              background: '#f0f5ff',
            }}
            bodyStyle={{ padding: '16px 20px', textAlign: 'center' }}
          >
            <SyncOutlined style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }} />
            <Title level={5} style={{ margin: '4px 0' }}>
              Tháng {selectedMonth.format('MM/YYYY')} chưa có khoản thanh toán nào
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 14 }}>
              Bạn có thể chọn các khoản từ tháng {selectedMonth.subtract(1, 'month').format('MM/YYYY')} để sao chép sang tháng này!
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={handleOpenCopyModal}
              >
                Sao chép từ tháng trước ({selectedMonth.subtract(1, 'month').format('MM/YYYY')})
              </Button>
              <Button
                icon={<PlusOutlined />}
                onClick={() => setBillModalOpen(true)}
              >
                Thêm khoản mới
              </Button>
            </div>
          </Card>
        )}

        {/* Bills List */}
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
                <Text strong style={{ fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Danh sách khoản thanh toán</Text>
                {summary?.bills?.length > 0 && (
                  <Tag color="blue" style={{ margin: 0, borderRadius: 10, flexShrink: 0 }}>
                    {summary.bills.length} khoản
                  </Tag>
                )}
              </div>

              {summary?.bills?.length > 0 && (
                <Button
                  size="small"
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={handleOpenCopyModal}
                  style={{ color: '#1890ff', flexShrink: 0, marginLeft: 8 }}
                >
                  {isMobile ? 'Sao chép' : 'Sao chép thêm từ tháng trước'}
                </Button>
              )}
            </div>
          }
          style={{
            borderRadius: 14,
            border: 'none',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          }}
          bodyStyle={{ padding: isMobile ? '10px 8px' : 0 }}
        >
          {!summary || summary.bills.length === 0 ? (
            <Empty
              description="Chưa có khoản thanh toán nào trong tháng này"
              style={{ padding: '40px 16px' }}
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setBillModalOpen(true)}>
                Thêm khoản đầu tiên
              </Button>
            </Empty>
          ) : isMobile ? (
            /* Mobile: Card items */
            <div>
              {summary.bills.map((bill) => {
                const status = getBillStatus(bill);
                const cfg = STATUS_CONFIG[status];
                return (
                  <div
                    key={bill.id}
                    className="bill-item"
                    style={{
                      background: bill.is_paid ? '#f8fffe' : '#fff',
                      borderRadius: 14,
                      padding: '12px 14px',
                      marginBottom: 10,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      border: '1px solid #f0f0f0',
                      borderLeft: `4px solid ${status === 'paid' ? '#52c41a' : status === 'overdue' ? '#ff4d4f' : '#faad14'}`,
                      opacity: bill.is_paid ? 0.8 : 1,
                    }}
                  >
                    {/* Row 1: Checkbox + Title + Status */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                      <Checkbox
                        checked={!!bill.is_paid}
                        onChange={() => handleTogglePaid(bill)}
                        style={{ marginTop: 2, flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text
                            strong
                            style={{
                              textDecoration: bill.is_paid ? 'line-through' : 'none',
                              color: bill.is_paid ? '#8c8c8c' : '#262626',
                              fontSize: 15,
                              lineHeight: 1.3,
                            }}
                          >
                            {bill.title}
                          </Text>
                          {bill.is_recurring && (
                            <Tag color="cyan" style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>
                              <SyncOutlined /> Định kỳ
                            </Tag>
                          )}
                        </div>
                      </div>
                      <Tag color={cfg.color} style={{ margin: 0, flexShrink: 0, fontSize: 11 }}>
                        {cfg.label}
                      </Tag>
                    </div>

                    {/* Row 2: Category + Date + Receipt */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 26, marginBottom: 8, flexWrap: 'wrap' }}>
                      {bill.category && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8c8c8c', fontSize: 12 }}>
                          <TagOutlined style={{ fontSize: 11 }} />
                          {bill.category}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8c8c8c', fontSize: 12 }}>
                        <CalendarOutlined style={{ fontSize: 11 }} />
                        {formatDate(bill.due_date)}
                      </span>
                      {bill.receipt_url && (
                        <Button
                          type="link"
                          size="small"
                          icon={<PaperClipOutlined />}
                          onClick={() => setPreviewImage(bill.receipt_url)}
                          style={{ padding: 0, height: 'auto', fontSize: 12, color: '#52c41a' }}
                        >
                          Biên lai
                        </Button>
                      )}
                    </div>

                    {/* Row 3: Amount + Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: 26 }}>
                      <Text strong style={{ color: '#1890ff', fontSize: 15 }}>
                        {formatCurrency(bill.amount)}
                      </Text>
                      <Space size={6}>
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleEdit(bill)}
                          style={{ color: '#1890ff', padding: '4px 6px' }}
                          size="small"
                        />
                        <Popconfirm
                          title="Xóa khoản thanh toán?"
                          onConfirm={() => handleDelete(bill.id)}
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                          placement="topRight"
                        >
                          <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            danger
                            size="small"
                            style={{ padding: '4px 6px' }}
                          />
                        </Popconfirm>
                      </Space>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Desktop: Table list */
            <div>
              {summary.bills.map((bill, idx) => {
                const status = getBillStatus(bill);
                const cfg = STATUS_CONFIG[status];
                return (
                  <div
                    key={bill.id}
                    className="bill-item"
                    style={{
                      padding: '14px 20px',
                      borderBottom: idx < summary.bills.length - 1 ? '1px solid #f5f5f5' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: bill.is_paid ? '#fafcff' : '#fff',
                      transition: 'background 0.15s',
                      borderLeft: `3px solid ${status === 'paid' ? '#52c41a' : status === 'overdue' ? '#ff4d4f' : '#faad14'}`,
                    }}
                  >
                    <Checkbox
                      checked={!!bill.is_paid}
                      onChange={() => handleTogglePaid(bill)}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text
                          strong
                          style={{
                            textDecoration: bill.is_paid ? 'line-through' : 'none',
                            color: bill.is_paid ? '#bfbfbf' : '#262626',
                          }}
                        >
                          {bill.title}
                        </Text>
                        <Tag color={cfg.color} style={{ margin: 0 }}>{cfg.label}</Tag>
                        {bill.category && (
                          <Tag color="blue" style={{ margin: 0 }}>{bill.category}</Tag>
                        )}
                        {bill.is_recurring && (
                          <Tag color="cyan" style={{ margin: 0 }}>
                            <SyncOutlined /> Định kỳ
                          </Tag>
                        )}
                        {bill.receipt_url && (
                          <Button
                            type="link"
                            size="small"
                            icon={<PaperClipOutlined />}
                            onClick={() => setPreviewImage(bill.receipt_url)}
                            style={{ padding: 0, height: 'auto', color: '#52c41a' }}
                          >
                            Xem biên lai
                          </Button>
                        )}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Đến hạn: {formatDate(bill.due_date)}
                        {bill.note && ` · ${bill.note}`}
                      </Text>
                    </div>
                    <Text strong style={{ color: '#1890ff', flexShrink: 0, fontSize: 15 }}>
                      {formatCurrency(bill.amount)}
                    </Text>
                    <Space>
                      <Tooltip title="Chỉnh sửa">
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleEdit(bill)}
                          style={{ color: '#1890ff' }}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="Xóa khoản thanh toán?"
                        description="Bạn có chắc muốn xóa khoản này không?"
                        onConfirm={() => handleDelete(bill.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Tooltip title="Xóa">
                          <Button type="text" icon={<DeleteOutlined />} danger />
                        </Tooltip>
                      </Popconfirm>
                    </Space>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </Spin>

      {/* Bill Modal */}
      <BillModal
        open={billModalOpen}
        bill={editingBill}
        defaultMonth={selectedMonth}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      {/* Budget Modal */}
      <Modal
        title={`Thiết lập hạn mức ngân sách tháng ${selectedMonth.format('MM/YYYY')}`}
        open={budgetModalOpen}
        onCancel={() => setBudgetModalOpen(false)}
        onOk={handleSaveBudget}
        confirmLoading={budgetLoading}
        okText="Lưu hạn mức"
        cancelText="Hủy"
      >
        <div style={{ padding: '16px 0' }}>
          <Text style={{ display: 'block', marginBottom: 8 }}>
            Nhập số tiền tối đa bạn dự định chi trả cho các hóa đơn trong tháng này:
          </Text>
          <InputNumber
            style={{ width: '100%' }}
            size="large"
            value={budgetInput}
            onChange={(val) => setBudgetInput(val || 0)}
            formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(val) => val.replace(/,/g, '')}
            min={0}
            step={500000}
            placeholder="VD: 10,000,000"
            addonAfter="VNĐ"
          />
        </div>
      </Modal>

      {/* Copy from Previous Month Selection Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CopyOutlined style={{ color: '#1890ff' }} />
            <span>
              Chọn hóa đơn từ tháng {selectedMonth.subtract(1, 'month').format('MM/YYYY')}
            </span>
          </div>
        }
        open={copyModalOpen}
        onCancel={() => !copying && setCopyModalOpen(false)}
        width={560}
        centered
        footer={[
          <Button key="cancel" onClick={() => setCopyModalOpen(false)} disabled={copying}>
            Hủy
          </Button>,
          <Button
            key="copy"
            type="primary"
            icon={<CopyOutlined />}
            loading={copying}
            disabled={prevBillsLoading || selectedCopyIds.length === 0}
            onClick={handleCopySelectedBills}
          >
            Sao chép {selectedCopyIds.length > 0 ? `(${selectedCopyIds.length} khoản)` : ''}
          </Button>,
        ]}
      >
        <Spin spinning={prevBillsLoading}>
          {!prevBillsLoading && prevMonthBills.length === 0 ? (
            <Empty
              description={`Tháng ${selectedMonth.subtract(1, 'month').format('MM/YYYY')} không có hóa đơn nào để sao chép.`}
              style={{ padding: '24px 0' }}
            />
          ) : (
            <div>
              {/* Select all header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: '#f5f8ff',
                borderRadius: 10,
                marginBottom: 12,
                border: '1px solid #e6f0ff',
              }}>
                <Checkbox
                  checked={prevMonthBills.length > 0 && selectedCopyIds.length === prevMonthBills.length}
                  indeterminate={selectedCopyIds.length > 0 && selectedCopyIds.length < prevMonthBills.length}
                  onChange={(e) => handleToggleSelectAllCopy(e.target.checked)}
                >
                  <Text strong style={{ fontSize: 13 }}>
                    Chọn tất cả ({selectedCopyIds.length}/{prevMonthBills.length})
                  </Text>
                </Checkbox>
                <Text strong style={{ color: '#1890ff', fontSize: 13 }}>
                  {formatCurrency(
                    prevMonthBills
                      .filter((b) => selectedCopyIds.includes(b.id))
                      .reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0)
                  )}
                </Text>
              </div>

              {/* Scrollable bill list */}
              <div style={{ maxHeight: '52vh', overflowY: 'auto', paddingRight: 4 }}>
                {prevMonthBills.map((bill) => {
                  const isSelected = selectedCopyIds.includes(bill.id);
                  const alreadyExists = (summary?.bills || []).some(
                    (b) => b.title.trim().toLowerCase() === bill.title.trim().toLowerCase()
                  );
                  return (
                    <div
                      key={bill.id}
                      onClick={() => toggleSelectCopyId(bill.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        marginBottom: 8,
                        borderRadius: 12,
                        cursor: 'pointer',
                        border: `1.5px solid ${isSelected ? '#1890ff' : '#f0f0f0'}`,
                        background: isSelected ? '#f0f7ff' : '#fff',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleSelectCopyId(bill.id)}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text strong style={{ fontSize: 14 }} ellipsis>
                            {bill.title}
                          </Text>
                          {bill.category && (
                            <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
                              {bill.category}
                            </Tag>
                          )}
                          {alreadyExists && (
                            <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>
                              Đã có tháng này
                            </Tag>
                          )}
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Ngày {dayjs(bill.due_date).format('DD/MM')}
                          {bill.note ? ` · ${bill.note}` : ''}
                        </Text>
                      </div>
                      <Text strong style={{ color: '#1890ff', fontSize: 14, whiteSpace: 'nowrap' }}>
                        {formatCurrency(bill.amount)}
                      </Text>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Spin>
      </Modal>

      {/* Full-size Receipt Image Preview */}
      <Modal
        open={!!previewImage}
        footer={null}
        onCancel={() => setPreviewImage(null)}
        title="Biên lai thanh toán"
        width={600}
        centered
      >
        {previewImage && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <Image
              src={previewImage}
              alt="Biên lai"
              style={{ maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DashboardPage;
