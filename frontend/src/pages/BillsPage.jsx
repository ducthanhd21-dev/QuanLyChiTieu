import { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Input, Select, DatePicker, Space,
  Tag, Checkbox, Popconfirm, notification, Typography,
  Empty, Tooltip, Grid, Table, Modal, Image,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, CalendarOutlined, TagOutlined,
  FileExcelOutlined, PaperClipOutlined, SyncOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { billService } from '../services';
import { formatCurrency, formatDate, getBillStatus, STATUS_CONFIG, CATEGORIES } from '../utils/helpers';
import { exportBillsToExcel } from '../utils/exportExcel';
import BillModal from '../components/BillModal';

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const BillsPage = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedMonth) params.month = selectedMonth.format('YYYY-MM');
      const res = await billService.getAll(params);
      setBills(res.data.data);
    } catch {
      notification.error({ message: 'Không thể tải danh sách khoản thanh toán.' });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const handleTogglePaid = async (bill) => {
    try {
      await billService.togglePaid(bill.id);
      notification.success({
        message: !bill.is_paid ? 'Đã đánh dấu đã thanh toán!' : 'Đã bỏ đánh dấu thanh toán!',
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
      notification.success({ message: 'Đã xóa khoản thanh toán!' });
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

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredBills.length === 0) {
      notification.warning({ message: 'Không có dữ liệu hóa đơn để xuất file.' });
      return;
    }
    const monthStr = selectedMonth ? selectedMonth.format('MM/YYYY') : 'Tất cả';
    exportBillsToExcel(filteredBills, monthStr);
    notification.success({ message: 'Đã xuất file Excel thành công!' });
  };

  // Filter
  const filteredBills = bills.filter((bill) => {
    const matchSearch = !search || bill.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || bill.category === filterCategory;
    const matchStatus = !filterStatus || getBillStatus(bill) === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  // ── MOBILE: Card layout ────────────────────────────────────────────────────
  const MobileBillCard = ({ bill }) => {
    const status = getBillStatus(bill);
    const cfg = STATUS_CONFIG[status];
    return (
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 10,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        borderLeft: `4px solid ${status === 'paid' ? '#52c41a' : status === 'overdue' ? '#ff4d4f' : '#faad14'}`,
        opacity: bill.is_paid ? 0.8 : 1,
      }}>
        {/* Row 1: checkbox + title + recurring + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
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
                  color: bill.is_paid ? '#aaa' : '#262626',
                  fontSize: 15,
                  lineHeight: 1.4,
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
          <Tag color={cfg.color} style={{ margin: 0, flexShrink: 0 }}>{cfg.label}</Tag>
        </div>

        {/* Row 2: category + date + receipt */}
        <div style={{ display: 'flex', gap: 12, marginLeft: 28, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
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

        {/* Row 3: amount + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginLeft: 28 }}>
          <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
            {formatCurrency(bill.amount)}
          </Text>
          <Space size={4}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(bill)}
              style={{ color: '#1890ff', padding: '4px 8px' }}
              size="small"
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
                icon={<DeleteOutlined />}
                danger
                size="small"
                style={{ padding: '4px 8px' }}
              />
            </Popconfirm>
          </Space>
        </div>
      </div>
    );
  };

  // ── DESKTOP: Table layout ─────────────────────────────────────────────────
  const columns = [
    {
      title: '',
      key: 'checkbox',
      width: 40,
      render: (_, bill) => (
        <Checkbox checked={!!bill.is_paid} onChange={() => handleTogglePaid(bill)} />
      ),
    },
    {
      title: 'Tên khoản',
      key: 'title',
      render: (_, bill) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ textDecoration: bill.is_paid ? 'line-through' : 'none', color: bill.is_paid ? '#bfbfbf' : '#262626' }}>
            {bill.title}
          </span>
          {bill.is_recurring && (
            <Tag color="cyan" style={{ fontSize: 10, margin: 0 }}>
              <SyncOutlined /> Định kỳ
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => <Tag color="blue">{cat || 'Hóa đơn'}</Tag>,
    },
    {
      title: 'Ngày đến hạn',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (d) => formatDate(d),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amt) => <span style={{ fontWeight: 600, color: '#1890ff' }}>{formatCurrency(amt)}</span>,
    },
    {
      title: 'Biên lai',
      key: 'receipt',
      render: (_, bill) => bill.receipt_url ? (
        <Button
          type="link"
          size="small"
          icon={<PaperClipOutlined />}
          onClick={() => setPreviewImage(bill.receipt_url)}
          style={{ color: '#52c41a', padding: 0 }}
        >
          Xem ảnh
        </Button>
      ) : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, bill) => {
        const status = getBillStatus(bill);
        const cfg = STATUS_CONFIG[status];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, bill) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(bill)} style={{ color: '#1890ff' }} />
          </Tooltip>
          <Popconfirm
            title="Xóa khoản thanh toán?"
            description="Bạn có chắc muốn xóa khoản này không?"
            onConfirm={() => handleDelete(bill.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <Title level={3} style={{ margin: 0 }}>Khoản thanh toán</Title>
        <Space wrap>
          <Button
            icon={<FileExcelOutlined style={{ color: '#52c41a' }} />}
            onClick={handleExportExcel}
          >
            {isMobile ? 'Excel' : 'Xuất Excel'}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setBillModalOpen(true)}>
            {isMobile ? 'Thêm' : 'Thêm khoản thanh toán'}
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 12, borderRadius: 12 }} bodyStyle={{ padding: '12px 16px' }}>
        {isMobile ? (
          // Mobile: stacked filters
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
                value={filterStatus || undefined}
                onChange={(val) => setFilterStatus(val || '')}
                style={{ flex: 1 }}
                allowClear
              >
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
            >
              {CATEGORIES.map((cat) => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </div>
        ) : (
          // Desktop: horizontal filters
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
              style={{ width: 140 }}
              allowClear
            >
              {CATEGORIES.map((cat) => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
            <Select
              placeholder="Trạng thái"
              value={filterStatus || undefined}
              onChange={(val) => setFilterStatus(val || '')}
              style={{ width: 160 }}
              allowClear
            >
              <Option value="paid">Đã thanh toán</Option>
              <Option value="unpaid">Chưa thanh toán</Option>
              <Option value="overdue">Quá hạn</Option>
            </Select>
          </Space>
        )}
      </Card>

      {/* Summary count */}
      {filteredBills.length > 0 && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
          {filteredBills.length} khoản · {filteredBills.filter(b => b.is_paid).length} đã đóng · {filteredBills.filter(b => b.is_recurring).length} định kỳ
        </Text>
      )}

      {/* Content */}
      {isMobile ? (
        // Mobile: Card list
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#8c8c8c' }}>Đang tải...</div>
          ) : filteredBills.length === 0 ? (
            <Empty
              description="Chưa có khoản thanh toán nào"
              style={{ padding: '48px 24px', background: '#fff', borderRadius: 12 }}
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setBillModalOpen(true)}>
                Thêm khoản đầu tiên
              </Button>
            </Empty>
          ) : (
            filteredBills.map((bill) => <MobileBillCard key={bill.id} bill={bill} />)
          )}
        </div>
      ) : (
        // Desktop: Table
        <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <Table
            dataSource={filteredBills}
            columns={columns}
            rowKey="id"
            loading={loading}
            locale={{ emptyText: <Empty description="Chưa có khoản thanh toán nào" /> }}
            pagination={{ pageSize: 20, showTotal: (total) => `Tổng ${total} khoản` }}
          />
        </Card>
      )}

      <BillModal
        open={billModalOpen}
        bill={editingBill}
        onClose={() => { setBillModalOpen(false); setEditingBill(null); }}
        onSuccess={handleModalSuccess}
      />

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

export default BillsPage;
