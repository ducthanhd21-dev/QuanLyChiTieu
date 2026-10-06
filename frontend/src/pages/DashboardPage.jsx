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
  WarningOutlined, PaperClipOutlined, SyncOutlined, AimOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { dashboardService, billService, budgetService } from '../services';
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

  // Receipt preview modal
  const [previewImage, setPreviewImage] = useState(null);

  // Copying state
  const [copying, setCopying] = useState(false);

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
    } catch {
      notification.error({ message: 'Không thể tải dữ liệu dashboard.' });
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

  // Copy bills from previous month
  const handleCopyFromPreviousMonth = async () => {
    setCopying(true);
    try {
      const prevMonth = selectedMonth.subtract(1, 'month').format('YYYY-MM');
      const targetMonth = selectedMonth.format('YYYY-MM');
      const res = await billService.copyFromMonth(prevMonth, targetMonth);
      const count = res.data.data.copiedCount;
      if (count > 0) {
        notification.success({
          message: `Đã sao chép thành công ${count} khoản từ tháng ${selectedMonth.subtract(1, 'month').format('MM/YYYY')}!`,
        });
        fetchSummary();
      } else {
        notification.info({
          message: `Tháng ${selectedMonth.subtract(1, 'month').format('MM/YYYY')} không có hóa đơn nào để sao chép.`,
        });
      }
    } catch {
      notification.error({ message: 'Sao chép thất bại. Vui lòng thử lại.' });
    } finally {
      setCopying(false);
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

  const statsCards = summary ? [
    {
      title: 'Tổng số tiền',
      value: summary.totalAmount,
      icon: <DollarOutlined />,
      color: '#1890ff',
      bgColor: '#e6f7ff',
      format: 'currency',
    },
    {
      title: 'Đã thanh toán',
      value: summary.paidAmount,
      icon: <CheckCircleOutlined />,
      color: '#52c41a',
      bgColor: '#f6ffed',
      format: 'currency',
    },
    {
      title: 'Chưa thanh toán',
      value: summary.unpaidAmount,
      icon: <ClockCircleOutlined />,
      color: '#faad14',
      bgColor: '#fffbe6',
      format: 'currency',
    },
    {
      title: 'Số hóa đơn',
      value: summary.totalBills,
      suffix: `(${summary.paidCount} đã đóng)`,
      icon: <FireOutlined />,
      color: '#722ed1',
      bgColor: '#f9f0ff',
      format: 'number',
    },
  ] : [];

  // Overdue and upcoming counts
  const overdueAlerts = alerts.filter(a => parseInt(a.days_remaining) < 0);
  const upcomingAlerts = alerts.filter(a => parseInt(a.days_remaining) >= 0);

  // Budget calculations
  const budgetAmount = budget ? parseFloat(budget.amount) : 0;
  const totalSpent = summary ? summary.totalAmount : 0;
  const budgetProgress = budgetAmount > 0 ? Math.round((totalSpent / budgetAmount) * 100) : 0;
  const budgetRemaining = budgetAmount - totalSpent;

  return (
    <div>
      {/* PWA Mobile Install Banner */}
      {isMobile && <PWAInstallPrompt type="banner" />}

      {/* Due Date Alerts Banner */}
      {(overdueAlerts.length > 0 || upcomingAlerts.length > 0) && (
        <div style={{ marginBottom: 16 }}>
          {overdueAlerts.length > 0 && (
            <Alert
              message={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <span>
                    <b>🚨 Cảnh báo quá hạn:</b> Bạn có <b>{overdueAlerts.length}</b> khoản thanh toán đã quá hạn chưa đóng!
                  </span>
                  <Tag color="error">{overdueAlerts.map(a => a.title).join(', ')}</Tag>
                </div>
              }
              type="error"
              showIcon
              style={{ marginBottom: 8, borderRadius: 10 }}
            />
          )}
          {upcomingAlerts.length > 0 && (
            <Alert
              message={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <span>
                    <b>⏰ Sắp đến hạn:</b> Bạn có <b>{upcomingAlerts.length}</b> khoản cần thanh toán trong 3 ngày tới!
                  </span>
                  <Tag color="warning">{upcomingAlerts.map(a => a.title).join(', ')}</Tag>
                </div>
              }
              type="warning"
              showIcon
              style={{ borderRadius: 10 }}
            />
          )}
        </div>
      )}

      {/* Header */}
      <div style={{
        marginBottom: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Xin chào, {user?.name?.split(' ').pop()} 👋
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Quản lý các khoản thanh toán của bạn</Text>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
          <DatePicker
            picker="month"
            value={selectedMonth}
            onChange={(val) => val && setSelectedMonth(val)}
            format="MM/YYYY"
            placeholder="Chọn tháng"
            allowClear={false}
            style={{ flex: isMobile ? 1 : 'none' }}
          />
          <Button
            icon={<FileExcelOutlined style={{ color: '#52c41a' }} />}
            onClick={handleExportExcel}
          >
            {isMobile ? 'Excel' : 'Xuất Excel'}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setBillModalOpen(true)}
          >
            {isMobile ? 'Thêm' : 'Thêm khoản thanh toán'}
          </Button>
        </div>
      </div>

      <Spin spinning={loading}>
        {/* Stat Cards */}
        <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
          {statsCards.map((card) => (
            <Col xs={12} sm={12} md={6} key={card.title}>
              <Card
                style={{
                  borderRadius: 14,
                  border: 'none',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  height: '100%',
                }}
                bodyStyle={{ padding: isMobile ? '12px 10px' : '18px 16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
                  <div style={{
                    width: isMobile ? 38 : 46,
                    height: isMobile ? 38 : 46,
                    borderRadius: 12,
                    background: card.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? 18 : 22,
                    color: card.color,
                    flexShrink: 0,
                  }}>
                    {card.icon}
                  </div>
                  <div style={{ overflow: 'hidden', minWidth: 0 }}>
                    <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12, display: 'block' }} ellipsis>
                      {card.title}
                    </Text>
                    <div style={{
                      fontWeight: 700,
                      fontSize: isMobile ? 14 : 16,
                      color: card.color,
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {card.format === 'currency'
                        ? formatCurrency(card.value)
                        : card.value
                      }
                    </div>
                    {card.suffix && (
                      <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>{card.suffix}</Text>
                    )}
                  </div>
                </div>
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
              Bạn có thể sao chép nhanh toàn bộ các khoản từ tháng {selectedMonth.subtract(1, 'month').format('MM/YYYY')} sang tháng này chỉ với 1 click!
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              <Button
                type="primary"
                icon={<CopyOutlined />}
                loading={copying}
                onClick={handleCopyFromPreviousMonth}
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
                  onClick={handleCopyFromPreviousMonth}
                  loading={copying}
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
                    style={{
                      background: bill.is_paid ? '#fcfcfc' : '#fff',
                      borderRadius: 12,
                      padding: '12px 14px',
                      marginBottom: 10,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      border: '1px solid #f0f0f0',
                      borderLeft: `4px solid ${status === 'paid' ? '#52c41a' : status === 'overdue' ? '#ff4d4f' : '#faad14'}`,
                      opacity: bill.is_paid ? 0.75 : 1,
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
                    style={{
                      padding: '14px 20px',
                      borderBottom: idx < summary.bills.length - 1 ? '1px solid #f0f0f0' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: bill.is_paid ? '#fafafa' : '#fff',
                      transition: 'background 0.2s',
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
