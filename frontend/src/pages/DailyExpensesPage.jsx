import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card, Typography, DatePicker, Button, InputNumber, Input,
  Spin, Empty, Popconfirm, notification, Space, Tag,
  Modal, Form, Grid,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  ShoppingOutlined, CalendarOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { expenseService } from '../services';
import { formatCurrency } from '../utils/helpers';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const EXPENSE_CATEGORIES = [
  { key: 'Ăn uống', label: 'Ăn uống', emoji: '🍜', color: '#fa8c16', bg: '#fff7e6', border: '#ffd591' },
  { key: 'Cà phê', label: 'Cà phê', emoji: '☕', color: '#8c5a2b', bg: '#fdf6ec', border: '#e8cfa8' },
  { key: 'Đi lại', label: 'Đi lại', emoji: '⛽', color: '#1890ff', bg: '#e6f4ff', border: '#91caff' },
  { key: 'Mua sắm', label: 'Mua sắm', emoji: '🛒', color: '#eb2f96', bg: '#fff0f6', border: '#ffadd2' },
  { key: 'Giải trí', label: 'Giải trí', emoji: '🎮', color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
  { key: 'Khác', label: 'Khác', emoji: '📦', color: '#595959', bg: '#fafafa', border: '#d9d9d9' },
];

const QUICK_AMOUNTS = [25000, 35000, 50000, 100000, 200000];

const getCatConfig = (catKey) =>
  EXPENSE_CATEGORIES.find((c) => c.key === catKey) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];

const formatDayHeading = (dateStr) => {
  const d = dayjs(dateStr).startOf('day');
  const today = dayjs().startOf('day');
  if (d.isSame(today)) return `Hôm nay, ${d.format('DD/MM/YYYY')}`;
  if (d.isSame(today.subtract(1, 'day'))) return `Hôm qua, ${d.format('DD/MM/YYYY')}`;
  return d.format('dddd, DD/MM/YYYY');
};

const DailyExpensesPage = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [byCategory, setByCategory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Quick add state
  const [quickCategory, setQuickCategory] = useState('Ăn uống');
  const [quickAmount, setQuickAmount] = useState(null);
  const [quickNote, setQuickNote] = useState('');
  const [quickDate, setQuickDate] = useState(dayjs());
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm] = Form.useForm();
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const month = selectedMonth.format('YYYY-MM');
      const res = await expenseService.getByMonth(month);
      setEntries(res.data.data.entries || []);
      setTotal(res.data.data.total || 0);
      setByCategory(res.data.data.byCategory || []);
    } catch (err) {
      const status = err?.response?.status;
      if (status !== 404 && status !== 500) {
        notification.error({ message: 'Không thể tải dữ liệu chi tiêu hàng ngày.' });
      }
      setEntries([]);
      setTotal(0);
      setByCategory([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Quick submit
  const handleQuickAdd = async () => {
    if (!quickAmount || quickAmount <= 0) {
      notification.warning({ message: 'Vui lòng nhập số tiền chi tiêu !' });
      return;
    }
    setQuickSubmitting(true);
    try {
      const payloadDate = quickDate || dayjs();
      await expenseService.create({
        date: payloadDate.format('YYYY-MM-DD'),
        amount: quickAmount,
        category: quickCategory,
        note: quickNote.trim(),
      });
      notification.success({
        message: `Đã ghi ${formatCurrency(quickAmount)} (${quickCategory})`,
        duration: 2,
      });
      setQuickAmount(null);
      setQuickNote('');
      // If user added to another month, switch view to that month so they see it immediately
      if (payloadDate.format('YYYY-MM') !== selectedMonth.format('YYYY-MM')) {
        setSelectedMonth(payloadDate);
      } else {
        fetchData();
      }
    } catch {
      notification.error({ message: 'Lưu thất bại. Vui lòng thử lại.' });
    } finally {
      setQuickSubmitting(false);
    }
  };

  const openEdit = (entry) => {
    setEditingEntry(entry);
    editForm.setFieldsValue({
      date: dayjs(entry.date),
      amount: parseFloat(entry.amount),
      category: entry.category || 'Ăn uống',
      note: entry.note || '',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      setEditSubmitting(true);
      await expenseService.update(editingEntry.id, {
        date: values.date.format('YYYY-MM-DD'),
        amount: values.amount,
        category: values.category,
        note: values.note?.trim() || '',
      });
      notification.success({ message: 'Đã cập nhật khoản chi !' });
      setEditModalOpen(false);
      fetchData();
    } catch (err) {
      if (err?.errorFields) return;
      notification.error({ message: 'Cập nhật thất bại.' });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await expenseService.remove(id);
      notification.success({ message: 'Đã xóa khoản chi !' });
      fetchData();
    } catch {
      notification.error({ message: 'Xóa thất bại.' });
    }
  };

  // Group entries by date (YYYY-MM-DD)
  const groupedByDate = useMemo(() => {
    const map = new Map();
    entries.forEach((e) => {
      const key = dayjs(e.date).format('YYYY-MM-DD');
      if (!map.has(key)) {
        map.set(key, { date: key, items: [], dayTotal: 0 });
      }
      const group = map.get(key);
      group.items.push(e);
      group.dayTotal += parseFloat(e.amount) || 0;
    });
    return Array.from(map.values());
  }, [entries]);

  const todayKey = dayjs().format('YYYY-MM-DD');
  const todayTotal = useMemo(() => {
    const g = groupedByDate.find((d) => d.date === todayKey);
    return g ? g.dayTotal : 0;
  }, [groupedByDate, todayKey]);

  const uniqueDays = groupedByDate.length;
  const avgPerDay = uniqueDays > 0 ? total / uniqueDays : 0;

  return (
    <div className="page-enter">
      {/* Header banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1f36 0%, #fa8c16 65%, #d46b08 100%)',
        borderRadius: 18,
        padding: isMobile ? '16px 18px' : '20px 28px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 6px 24px rgba(250,140,22,0.25)',
        position: 'relative',
        overflow: 'hidden',
        gap: 12,
      }}>
        <div style={{ position: 'absolute', top: -30, right: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 3 }}>🛒 Ghi nhanh</div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: isMobile ? 18 : 22 }}>Chi tiêu hàng ngày</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 4 }}>
            Ăn uống, cà phê, xăng xe... · {selectedMonth.format('MM/YYYY')}
          </div>
        </div>
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={(d) => d && setSelectedMonth(d)}
          format="MM/YYYY"
          allowClear={false}
          style={{
            borderRadius: 10,
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            width: isMobile ? 100 : 130,
            flexShrink: 0,
          }}
        />
      </div>

      {/* Quick-Add Card */}
      <Card
        style={{
          marginBottom: 16,
          borderRadius: 16,
          border: '1px solid #ffd591',
          background: 'linear-gradient(180deg, #fffaf0 0%, #ffffff 100%)',
          boxShadow: '0 2px 10px rgba(250, 140, 22, 0.08)',
        }}
        bodyStyle={{ padding: isMobile ? 14 : 18 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text strong style={{ fontSize: 14, color: '#d46b08', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ThunderboltOutlined /> Nhập nhanh 1 chạm
          </Text>
          <DatePicker
            value={quickDate}
            onChange={(d) => setQuickDate(d || dayjs())}
            format="DD/MM/YYYY"
            size="small"
            allowClear={false}
            style={{ width: 125 }}
          />
        </div>

        {/* Category pills */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
        }}>
          {EXPENSE_CATEGORIES.map((cat) => {
            const active = quickCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setQuickCategory(cat.key)}
                style={{
                  border: `1.5px solid ${active ? cat.color : '#e8e8e8'}`,
                  background: active ? cat.bg : '#fff',
                  color: active ? cat.color : '#595959',
                  borderRadius: 20,
                  padding: '5px 12px',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.15s',
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Amount + Note + Submit */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1.4fr auto',
          gap: 10,
          alignItems: 'center',
        }}>
          <InputNumber
            placeholder="Nhập số tiền (VD: 35,000)"
            value={quickAmount}
            onChange={setQuickAmount}
            onPressEnter={handleQuickAdd}
            min={1000}
            step={5000}
            size="large"
            style={{ width: '100%' }}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(v) => v.replace(/,/g, '')}
            addonAfter="đ"
          />
          <Input
            placeholder="Ghi chú nhanh (VD: Bún bò, Cà phê, Đổ xăng...)"
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            onPressEnter={handleQuickAdd}
            size="large"
            allowClear
          />
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            loading={quickSubmitting}
            onClick={handleQuickAdd}
            style={{
              background: '#fa8c16',
              borderColor: '#fa8c16',
              fontWeight: 600,
              width: isMobile ? '100%' : 'auto',
            }}
          >
            Ghi chi tiêu
          </Button>
        </div>

        {/* Quick preset amounts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>Chọn nhanh:</Text>
          {QUICK_AMOUNTS.map((amt) => (
            <Tag
              key={amt}
              onClick={() => setQuickAmount(amt)}
              style={{
                cursor: 'pointer',
                borderRadius: 12,
                margin: 0,
                background: quickAmount === amt ? '#fff7e6' : '#f5f5f5',
                borderColor: quickAmount === amt ? '#fa8c16' : '#d9d9d9',
                color: quickAmount === amt ? '#d46b08' : '#595959',
              }}
            >
              {amt / 1000}k
            </Tag>
          ))}
        </div>
      </Card>

      {/* Summary stats (balanced layout on mobile & desktop) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
        gap: 10,
        marginBottom: 14,
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #fff7e6, #ffe7ba)',
          borderRadius: 14,
          padding: '14px 16px',
          gridColumn: isMobile ? '1 / -1' : 'auto',
          display: isMobile ? 'flex' : 'block',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(250,140,22,0.1)',
        }}>
          <Text style={{ fontSize: 12, color: '#8c8c8c', display: 'block', fontWeight: 500 }}>
            🛒 Tổng chi tháng {selectedMonth.format('MM/YYYY')}
          </Text>
          <Text strong style={{ fontSize: isMobile ? 17 : 18, color: '#fa8c16' }}>
            {formatCurrency(total)}
          </Text>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #e6f4ff, #bae7ff)',
          borderRadius: 14,
          padding: '14px 16px',
          boxShadow: '0 2px 8px rgba(24,144,255,0.08)',
        }}>
          <Text style={{ fontSize: 12, color: '#8c8c8c', display: 'block', fontWeight: 500 }}>📅 Hôm nay</Text>
          <Text strong style={{ fontSize: isMobile ? 15 : 17, color: '#1890ff' }}>
            {formatCurrency(todayTotal)}
          </Text>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f9f0ff, #efdbff)',
          borderRadius: 14,
          padding: '14px 16px',
          boxShadow: '0 2px 8px rgba(114,46,209,0.08)',
        }}>
          <Text style={{ fontSize: 12, color: '#8c8c8c', display: 'block', fontWeight: 500 }}>📊 TB/ngày</Text>
          <Text strong style={{ fontSize: isMobile ? 15 : 17, color: '#722ed1' }}>
            {formatCurrency(Math.round(avgPerDay))}
          </Text>
        </div>
      </div>

      {/* Category breakdown chips */}
      {byCategory.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {byCategory.map((c) => {
            const cfg = getCatConfig(c.category);
            return (
              <div
                key={c.category}
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <span>{cfg.emoji}</span>
                <span style={{ color: '#595959' }}>{c.category}:</span>
                <strong style={{ color: cfg.color }}>{formatCurrency(c.total)}</strong>
              </div>
            );
          })}
        </div>
      )}

      {/* Daily grouped list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : groupedByDate.length === 0 ? (
        <Empty
          description={`Chưa có khoản chi tiêu nào trong tháng ${selectedMonth.format('MM/YYYY')}`}
          style={{ padding: '48px 24px', background: '#fff', borderRadius: 16 }}
        />
      ) : (
        groupedByDate.map((dayGroup) => (
          <Card
            key={dayGroup.date}
            style={{
              marginBottom: 12,
              borderRadius: 14,
              border: '1px solid #f0f0f0',
              boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
            }}
            bodyStyle={{ padding: 0 }}
          >
            {/* Day Header */}
            <div style={{
              padding: '10px 16px',
              background: 'linear-gradient(90deg, #fff7e6 0%, #fff 100%)',
              borderBottom: '1px solid #f0ebe0',
              borderTopLeftRadius: 14,
              borderTopRightRadius: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text strong style={{ fontSize: 13, color: '#8c5a2b', textTransform: 'capitalize' }}>
                <CalendarOutlined style={{ marginRight: 6, color: '#fa8c16' }} />
                {formatDayHeading(dayGroup.date)}
              </Text>
              <span style={{
                background: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: 10,
                padding: '2px 10px',
                fontSize: 13,
                fontWeight: 700,
                color: '#d46b08',
              }}>
                -{formatCurrency(dayGroup.dayTotal)}
              </span>
            </div>

            {/* Day Items */}
            {dayGroup.items.map((item, idx) => {
              const cfg = getCatConfig(item.category);
              return (
                <div
                  key={item.id}
                  className="bill-item"
                  style={{
                    padding: isMobile ? '11px 14px' : '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderBottom: idx < dayGroup.items.length - 1 ? '1px solid #f8f8f8' : 'none',
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 17,
                    flexShrink: 0,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  }}>
                    {cfg.emoji}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1f36' }}>
                      {item.note || item.category}
                    </div>
                    {item.note && (
                      <Text type="secondary" style={{ fontSize: 11 }}>{item.category}</Text>
                    )}
                  </div>

                  <Text strong style={{ color: '#fa8c16', fontSize: 14, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    -{formatCurrency(item.amount)}
                  </Text>

                  <Space size={2} style={{ flexShrink: 0 }}>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => openEdit(item)}
                      style={{ color: '#1890ff' }}
                    />
                    <Popconfirm
                      title="Xóa khoản chi này?"
                      onConfirm={() => handleDelete(item.id)}
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
          </Card>
        ))
      )}

      {/* Edit Modal */}
      <Modal
        title="Chỉnh sửa khoản chi tiêu"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleEditSubmit}
        confirmLoading={editSubmitting}
        okText="Lưu"
        cancelText="Hủy"
        centered
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="date" label="Ngày chi" rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}>
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="category" label="Danh mục" rules={[{ required: true }]}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <Form.Item noStyle shouldUpdate key={cat.key}>
                  {({ getFieldValue, setFieldValue }) => {
                    const active = getFieldValue('category') === cat.key;
                    return (
                      <button
                        type="button"
                        onClick={() => setFieldValue('category', cat.key)}
                        style={{
                          border: `1.5px solid ${active ? cat.color : '#e8e8e8'}`,
                          background: active ? cat.bg : '#fff',
                          color: active ? cat.color : '#595959',
                          borderRadius: 16,
                          padding: '4px 10px',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        {cat.emoji} {cat.label}
                      </button>
                    );
                  }}
                </Form.Item>
              ))}
            </div>
          </Form.Item>
          <Form.Item
            name="amount"
            label="Số tiền (VNĐ)"
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền' },
              { type: 'number', min: 1000, message: 'Số tiền phải >= 1,000đ' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1000}
              step={5000}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(v) => v.replace(/,/g, '')}
              addonAfter="đ"
            />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input placeholder="VD: Bún bò, Cà phê..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DailyExpensesPage;
