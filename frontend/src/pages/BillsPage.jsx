import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card, Button, Input, Select, DatePicker, Space,
  Tag, Checkbox, Popconfirm, notification, Typography,
  Empty, Tooltip, Grid, Modal, Image, Progress, Badge,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, CalendarOutlined, TagOutlined,
  FileExcelOutlined, PaperClipOutlined,
  RightOutlined, DownOutlined, CheckCircleOutlined,
  ClockCircleOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { billService } from '../services';
import { formatCurrency, formatDate, getBillStatus, STATUS_CONFIG, CATEGORIES } from '../utils/helpers';
import { exportBillsToExcel } from '../utils/exportExcel';
import BillModal from '../components/BillModal';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

// ── Helper: get most frequent day of month (1-31) in a group of bills ───────
const getMostFrequentDay = (bills) => {
  if (!bills || bills.length === 0) return 32;
  const counts = {};
  bills.forEach((b) => {
    const day = dayjs(b.due_date).date();
    counts[day] = (counts[day] || 0) + 1;
  });
  let bestDay = 32;
  let maxCount = -1;
  Object.entries(counts).forEach(([dayStr, count]) => {
    const day = Number(dayStr);
    if (count > maxCount || (count === maxCount && day < bestDay)) {
      maxCount = count;
      bestDay = day;
    }
  });
  return bestDay;
};

// ── Helper: group bills by title ────────────────────────────────────────────
const groupBillsByTitle = (bills) => {
  const map = {};
  bills.forEach((bill) => {
    const key = bill.title.trim().toLowerCase();
    if (!map[key]) {
      map[key] = {
        title: bill.title,
        category: bill.category,
        bills: [],
      };
    }
    map[key].bills.push(bill);
  });
  // Sort each group's bills chronologically by due_date
  Object.values(map).forEach((g) => {
    g.bills.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  });
  return Object.values(map).sort((a, b) => {
    const aAllPaid = a.bills.every((bill) => !!bill.is_paid);
    const bAllPaid = b.bills.every((bill) => !!bill.is_paid);
    if (aAllPaid !== bAllPaid) {
      return aAllPaid ? 1 : -1;
    }

    const aDay = getMostFrequentDay(a.bills);
    const bDay = getMostFrequentDay(b.bills);
    if (aDay !== bDay) {
      return aDay - bDay;
    }

    return a.title.localeCompare(b.title, 'vi');
  });
};

// ── Status icon helper ───────────────────────────────────────────────────────
const StatusIcon = ({ status }) => {
  if (status === 'paid') return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
  if (status === 'overdue') return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
  return <ClockCircleOutlined style={{ color: '#faad14' }} />;
};

const BillsPage = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch ALL bills (no month filter) for the grouped view
      const res = await billService.getAll({});
      setBills(res.data.data);
    } catch {
      notification.error({ message: 'Không thể tải danh sách khoản thanh toán.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const handleTogglePaid = async (bill) => {
    try {
      await billService.togglePaid(bill.id);
      notification.success({
        message: !bill.is_paid ? 'Đã đánh dấu đã thanh toán !' : 'Đã bỏ đánh dấu thanh toán !',
        duration: 2,
      });
      fetchBills();
    } catch {
      notification.error({ message: 'Cập nhật thất bại.' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await billService.remove(id);
      notification.success({ message: 'Đã xóa khoản thanh toán !' });
      fetchBills();
    } catch {
      notification.error({ message: 'Xóa thất bại.' });
    }
  };

  const handleEdit = (bill) => {
    setEditingBill(bill);
    setBillModalOpen(true);
  };

  const handleModalSuccess = () => {
    setBillModalOpen(false);
    setEditingBill(null);
    fetchBills();
  };

  const handleExportExcel = () => {
    if (bills.length === 0) {
      notification.warning({ message: 'Không có dữ liệu hóa đơn để xuất file.' });
      return;
    }
    exportBillsToExcel(bills, 'Tất cả');
    notification.success({ message: 'Đã xuất file Excel thành công !' });
  };

  const toggleGroup = (key) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter & group
  const groupedBills = useMemo(() => {
    const filtered = bills.filter((bill) => {
      const matchSearch = !search || bill.title.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !filterCategory || filterCategory === 'all' || bill.category === filterCategory;
      const matchStatus = !filterStatus || filterStatus === 'all' || getBillStatus(bill) === filterStatus;
      const matchMonth = !selectedMonth || dayjs(bill.due_date).format('YYYY-MM') === selectedMonth.format('YYYY-MM');
      return matchSearch && matchCategory && matchStatus && matchMonth;
    });
    return groupBillsByTitle(filtered);
  }, [bills, search, filterCategory, filterStatus, selectedMonth]);

  // ── Group Card Component ──────────────────────────────────────────────────
  const BillGroupCard = ({ group }) => {
    const key = group.title.trim().toLowerCase();
    const isExpanded = !!expandedGroups[key];
    const totalAmount = group.bills.reduce((s, b) => s + parseFloat(b.amount), 0);
    const paidCount = group.bills.filter((b) => b.is_paid).length;
    const overdueCount = group.bills.filter((b) => getBillStatus(b) === 'overdue').length;
    const totalCount = group.bills.length;
    const paidPercent = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
    const unpaidAmount = group.bills
      .filter((b) => !b.is_paid)
      .reduce((s, b) => s + parseFloat(b.amount), 0);

    // Determine group status color
    let borderColor = '#52c41a';
    if (overdueCount > 0) borderColor = '#ff4d4f';
    else if (paidCount < totalCount) borderColor = '#faad14';

    return (
      <div style={{
        background: '#fff',
        borderRadius: 16,
        marginBottom: 12,
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        overflow: 'hidden',
        border: '1px solid #f0f0f0',
      }}>
        {/* Group Header — always visible */}
        <div
          onClick={() => toggleGroup(key)}
          style={{
            padding: isMobile ? '14px 16px' : '16px 20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            borderLeft: `5px solid ${borderColor}`,
            userSelect: 'none',
          }}
        >
          {/* Title + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text strong style={{ fontSize: isMobile ? 15 : 16, color: '#1a1a1a' }}>
                {group.title}
              </Text>
              {group.category && (
                <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{group.category}</Tag>
              )}
            </div>
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 12, color: '#8c8c8c' }}>
                {totalCount} tháng · {paidCount} đã đóng
              </Text>
              {overdueCount > 0 && (
                <Tag color="red" style={{ margin: 0, fontSize: 11 }}>
                  <ExclamationCircleOutlined /> {overdueCount} quá hạn
                </Tag>
              )}
            </div>
            {/* Progress bar */}
            <Progress
              percent={paidPercent}
              size="small"
              strokeColor={borderColor}
              trailColor="#f0f0f0"
              showInfo={false}
              style={{ marginTop: 6, marginBottom: 0 }}
            />
          </div>

          {/* Amount + chevron */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 700, fontSize: isMobile ? 15 : 16, color: '#1890ff' }}>
              {formatCurrency(totalAmount)}
            </div>
            {unpaidAmount > 0 && (
              <div style={{ fontSize: 11, color: '#ff4d4f', marginTop: 2 }}>
                Còn: {formatCurrency(unpaidAmount)}
              </div>
            )}
            <div style={{ marginTop: 6, color: '#bfbfbf' }}>
              {isExpanded ? <DownOutlined /> : <RightOutlined />}
            </div>
          </div>
        </div>

        {/* Detail list — expanded */}
        {isExpanded && (
          <div style={{ background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
            {group.bills.map((bill, idx) => {
              const status = getBillStatus(bill);
              const monthLabel = dayjs(bill.due_date).format('MM/YYYY');
              const badgeColor = status === 'paid' ? '#52c41a' : status === 'overdue' ? '#ff4d4f' : '#faad14';
              const badgeBg = status === 'paid' ? '#f6ffed' : status === 'overdue' ? '#fff2f0' : '#fffbe6';
              const badgeBorder = status === 'paid' ? '#b7eb8f' : status === 'overdue' ? '#ffccc7' : '#ffe58f';

              if (isMobile) {
                return (
                  <div
                    key={bill.id}
                    style={{
                      padding: '12px 14px',
                      borderBottom: idx < group.bills.length - 1 ? '1px solid #f0f0f0' : 'none',
                      background: bill.is_paid ? '#f6ffed' : '#fff',
                      transition: 'background 0.2s',
                    }}
                  >
                    {/* Top row: checkbox + month pill + amount */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Checkbox
                        checked={!!bill.is_paid}
                        onChange={() => handleTogglePaid(bill)}
                        style={{ flexShrink: 0 }}
                      />
                      <div style={{
                        background: badgeBg,
                        border: `1px solid ${badgeBorder}`,
                        borderRadius: 8,
                        padding: '3px 10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 11, color: '#8c8c8c' }}>Tháng</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: badgeColor }}>
                          {monthLabel}
                        </span>
                      </div>
                      <Text strong style={{
                        marginLeft: 'auto',
                        color: bill.is_paid ? '#52c41a' : '#1890ff',
                        fontSize: 15,
                        whiteSpace: 'nowrap',
                        textDecoration: bill.is_paid ? 'line-through' : 'none',
                      }}>
                        {formatCurrency(bill.amount)}
                      </Text>
                    </div>

                    {/* Bottom row: due date + actions */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 8,
                      paddingLeft: 26,
                      gap: 8,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <StatusIcon status={status} />
                        <Text style={{ fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>
                          Hạn: {formatDate(bill.due_date)}
                        </Text>
                      </div>
                      <Space size={4} style={{ flexShrink: 0 }}>
                        {bill.receipt_url && (
                          <Button
                            type="text"
                            size="small"
                            icon={<PaperClipOutlined />}
                            onClick={() => setPreviewImage(bill.receipt_url)}
                            style={{ color: '#52c41a', padding: '2px 6px' }}
                          />
                        )}
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleEdit(bill)}
                          style={{ color: '#1890ff', padding: '2px 6px' }}
                        />
                        <Popconfirm
                          title="Xóa khoản này?"
                          onConfirm={() => handleDelete(bill.id)}
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                          placement="topRight"
                        >
                          <Button
                            type="text"
                            size="small"
                            icon={<DeleteOutlined />}
                            danger
                            style={{ padding: '2px 6px' }}
                          />
                        </Popconfirm>
                      </Space>
                    </div>

                    {bill.note && (
                      <div style={{ paddingLeft: 26, marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>{bill.note}</Text>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={bill.id}
                  style={{
                    padding: '12px 20px 12px 28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    borderBottom: idx < group.bills.length - 1 ? '1px solid #f0f0f0' : 'none',
                    background: bill.is_paid ? '#f6ffed' : '#fff',
                    transition: 'background 0.2s',
                  }}
                >
                  <Checkbox
                    checked={!!bill.is_paid}
                    onChange={() => handleTogglePaid(bill)}
                    style={{ flexShrink: 0 }}
                  />
                  <div style={{
                    background: badgeBg,
                    border: `1px solid ${badgeBorder}`,
                    borderRadius: 8,
                    padding: '4px 10px',
                    textAlign: 'center',
                    flexShrink: 0,
                    minWidth: 64,
                  }}>
                    <div style={{ fontSize: 11, color: '#8c8c8c', lineHeight: 1 }}>Tháng</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: badgeColor, lineHeight: 1.4 }}>
                      {monthLabel}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <StatusIcon status={status} />
                      <Text style={{ fontSize: 13, color: '#8c8c8c', whiteSpace: 'nowrap' }}>
                        Hạn: {formatDate(bill.due_date)}
                      </Text>
                    </div>
                    {bill.note && (
                      <Text type="secondary" style={{ fontSize: 11 }}>{bill.note}</Text>
                    )}
                  </div>
                  <Text strong style={{
                    color: bill.is_paid ? '#52c41a' : '#1890ff',
                    fontSize: 15,
                    flexShrink: 0,
                    textDecoration: bill.is_paid ? 'line-through' : 'none',
                  }}>
                    {formatCurrency(bill.amount)}
                  </Text>
                  <Space size={2} style={{ flexShrink: 0 }}>
                    {bill.receipt_url && (
                      <Tooltip title="Xem biên lai">
                        <Button
                          type="text"
                          size="small"
                          icon={<PaperClipOutlined />}
                          onClick={() => setPreviewImage(bill.receipt_url)}
                          style={{ color: '#52c41a' }}
                        />
                      </Tooltip>
                    )}
                    <Tooltip title="Chỉnh sửa">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(bill)}
                        style={{ color: '#1890ff' }}
                      />
                    </Tooltip>
                    <Popconfirm
                      title="Xóa khoản này?"
                      onConfirm={() => handleDelete(bill.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                      placement="topRight"
                    >
                      <Button type="text" size="small" icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                  </Space>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ── Summary stats ─────────────────────────────────────────────────────────
  const totalAll = bills.reduce((s, b) => s + parseFloat(b.amount), 0);
  const paidAll = bills.filter((b) => b.is_paid).reduce((s, b) => s + parseFloat(b.amount), 0);
  const unpaidAll = totalAll - paidAll;

  return (
    <div className="page-enter">
      {/* Header banner */}
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
        gap: 12,
      }}>
        <div style={{ position: 'absolute', top: -30, right: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 3 }}>📋 Quản lý</div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: isMobile ? 18 : 22 }}>Khoản thanh toán</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 4 }}>
            {bills.length > 0 ? `${bills.length} khoản · Nhóm theo tên hóa đơn` : 'Chưa có khoản nào'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 10,
              color: '#fff',
            }}
          >
            {isMobile ? '' : 'Excel'}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setBillModalOpen(true)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 10,
              color: '#fff',
              fontWeight: 600,
            }}
          >
            {isMobile ? 'Thêm' : 'Thêm khoản'}
          </Button>
        </div>
      </div>

      {/* Overview stats */}
      {bills.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
          gap: 10,
          marginBottom: 14,
        }}>
          {[
            { label: '💰 Tổng cộng', value: totalAll, color: '#1890ff', bg: 'linear-gradient(135deg, #e6f4ff, #bae7ff)', fullOnMobile: true },
            { label: '✅ Đã thanh toán', value: paidAll, color: '#52c41a', bg: 'linear-gradient(135deg, #f6ffed, #d9f7be)', fullOnMobile: false },
            { label: '⏳ Còn lại', value: unpaidAll, color: '#ff4d4f', bg: 'linear-gradient(135deg, #fff2f0, #ffd6d6)', fullOnMobile: false },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: stat.bg,
              borderRadius: 14,
              padding: '14px 16px',
              gridColumn: isMobile && stat.fullOnMobile ? '1 / -1' : 'auto',
              display: isMobile && stat.fullOnMobile ? 'flex' : 'block',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <Text style={{ fontSize: 12, color: '#6b7280', display: 'block', fontWeight: 500 }}>{stat.label}</Text>
              <Text strong style={{ fontSize: isMobile ? (stat.fullOnMobile ? 17 : 15) : 16, color: stat.color }}>
                {formatCurrency(stat.value)}
              </Text>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 14, borderRadius: 12 }} bodyStyle={{ padding: '12px 16px' }}>
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Input
              placeholder="Tìm kiếm tên khoản..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <DatePicker
                picker="month"
                value={selectedMonth}
                onChange={setSelectedMonth}
                format="MM/YYYY"
                placeholder="Tháng"
                style={{ flex: 1 }}
                allowClear
              />
              <Select
                placeholder="Trạng thái"
                value={filterStatus}
                onChange={(val) => setFilterStatus(val || 'all')}
                style={{ flex: 1 }}
                dropdownMatchSelectWidth={false}
                listHeight={400}
              >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="paid">Đã đóng</Option>
                <Option value="unpaid">Chưa đóng</Option>
                <Option value="overdue">Quá hạn</Option>
              </Select>
            </div>
            <Select
              placeholder="Danh mục"
              value={filterCategory || undefined}
              onChange={(val) => setFilterCategory(val || '')}
              allowClear
              dropdownMatchSelectWidth={false}
              listHeight={400}
            >
              <Option value="all">Tất cả danh mục</Option>
              {CATEGORIES.map((cat) => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </div>
        ) : (
          <Space wrap>
            <Input
              placeholder="Tìm kiếm tên khoản..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 220 }}
              allowClear
            />
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={setSelectedMonth}
              format="MM/YYYY"
              placeholder="Lọc theo tháng"
              allowClear
            />
            <Select
              placeholder="Danh mục"
              value={filterCategory || undefined}
              onChange={(val) => setFilterCategory(val || '')}
              style={{ width: 150 }}
              allowClear
              listHeight={400}
            >
              <Option value="all">Tất cả danh mục</Option>
              {CATEGORIES.map((cat) => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
            <Select
              placeholder="Trạng thái"
              value={filterStatus}
              onChange={(val) => setFilterStatus(val || 'all')}
              style={{ width: 160 }}
              listHeight={400}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="paid">Đã thanh toán</Option>
              <Option value="unpaid">Chưa thanh toán</Option>
              <Option value="overdue">Quá hạn</Option>
            </Select>
          </Space>
        )}
      </Card>

      {/* Summary */}
      {groupedBills.length > 0 && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 10, fontSize: 12 }}>
          {groupedBills.length} loại khoản · {bills.filter(b => b.is_paid).length}/{bills.length} đã đóng
        </Text>
      )}

      {/* Grouped bill cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#8c8c8c' }}>Đang tải...</div>
      ) : groupedBills.length === 0 ? (
        <Empty
          description="Chưa có khoản thanh toán nào"
          style={{ padding: '64px 24px', background: '#fff', borderRadius: 16 }}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setBillModalOpen(true)}>
            Thêm khoản đầu tiên
          </Button>
        </Empty>
      ) : (
        groupedBills.map((group) => (
          <BillGroupCard key={group.title.trim().toLowerCase()} group={group} />
        ))
      )}

      <BillModal
        open={billModalOpen}
        bill={editingBill}
        defaultMonth={selectedMonth}
        onClose={() => { setBillModalOpen(false); setEditingBill(null); }}
        onSuccess={handleModalSuccess}
      />

      {/* Receipt Image Preview */}
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

export default BillsPage;
