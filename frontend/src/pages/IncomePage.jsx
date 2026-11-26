import { useState, useEffect, useCallback } from 'react';
import {
  Card, Typography, DatePicker, Button, InputNumber, Input,
  Spin, Empty, Popconfirm, notification, Space, Tag, Row, Col,
  Modal, Form, Grid, Statistic,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  RiseOutlined, CalendarOutlined, DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { incomeService } from '../services';
import { formatCurrency } from '../utils/helpers';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const IncomePage = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const month = selectedMonth.format('YYYY-MM');
      const res = await incomeService.getByMonth(month);
      setEntries(res.data.data.entries);
      setTotal(res.data.data.total);
    } catch (err) {
      // Nếu API chưa sẵn sàng (404/500) thì chỉ hiển thị trống, không báo lỗi
      const status = err?.response?.status;
      if (status !== 404 && status !== 500) {
        notification.error({ message: 'Không thể tải dữ liệu thu nhập.' });
      }
      setEntries([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAdd = () => {
    setEditingEntry(null);
    form.resetFields();
    form.setFieldsValue({ date: dayjs() });
    setModalOpen(true);
  };

  const openEdit = (entry) => {
    setEditingEntry(entry);
    form.setFieldsValue({
      date: dayjs(entry.date),
      amount: parseFloat(entry.amount),
      note: entry.note || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        date: values.date.format('YYYY-MM-DD'),
        amount: values.amount,
        note: values.note || '',
      };
      if (editingEntry) {
        await incomeService.update(editingEntry.id, payload);
        notification.success({ message: 'Đã cập nhật khoản thu nhập!' });
      } else {
        await incomeService.create(payload);
        notification.success({ message: 'Đã thêm khoản thu nhập!' });
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      if (err?.errorFields) return;
      notification.error({ message: 'Lưu thất bại. Vui lòng thử lại.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await incomeService.remove(id);
      notification.success({ message: 'Đã xóa khoản thu nhập!' });
      fetchData();
    } catch {
      notification.error({ message: 'Xóa thất bại.' });
    }
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1f36 0%, #52c41a 70%, #389e0d 100%)',
        borderRadius: 18,
        padding: isMobile ? '16px 18px' : '20px 28px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 6px 24px rgba(82,196,26,0.25)',
        position: 'relative',
        overflow: 'hidden',
        gap: 12,
      }}>
        <div style={{ position: 'absolute', top: -30, right: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div className="page-enter">
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 3 }}>📈 Quản lý</div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: isMobile ? 18 : 22 }}>Thu nhập</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 4 }}>
            Theo dõi thu nhập từng ngày trong tháng
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <DatePicker
            picker="month"
            value={selectedMonth}
            onChange={(val) => val && setSelectedMonth(val)}
            format="MM/YYYY"
            allowClear={false}
            style={{
              borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              width: isMobile ? 100 : 120,
            }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAdd}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 10,
              color: '#fff',
              fontWeight: 600,
            }}
          >
            {isMobile ? 'Thêm' : 'Thêm thu nhập'}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={8}>
          <div style={{
            background: 'linear-gradient(135deg, #f6ffed, #d9f7be)',
            borderRadius: 14,
            padding: isMobile ? '14px 12px' : '18px 20px',
            boxShadow: '0 2px 8px rgba(82,196,26,0.1)',
            height: '100%',
          }}>
            <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>📈 Tổng thu nhập</Text>
            <div style={{ fontWeight: 800, fontSize: isMobile ? 16 : 20, color: '#52c41a', marginTop: 4 }}>
              {formatCurrency(total)}
            </div>
          </div>
        </Col>
        <Col xs={12} sm={8}>
          <div style={{
            background: 'linear-gradient(135deg, #e6f4ff, #bae7ff)',
            borderRadius: 14,
            padding: isMobile ? '14px 12px' : '18px 20px',
            boxShadow: '0 2px 8px rgba(24,144,255,0.08)',
            height: '100%',
          }}>
            <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>📅 Số ngày có thu nhập</Text>
            <div style={{ fontWeight: 800, fontSize: isMobile ? 16 : 20, color: '#1890ff', marginTop: 4 }}>
              {entries.length} ngày
            </div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div style={{
            background: 'linear-gradient(135deg, #fff7e6, #ffe7ba)',
            borderRadius: 14,
            padding: isMobile ? '14px 12px' : '18px 20px',
            boxShadow: '0 2px 8px rgba(250,140,22,0.08)',
            height: '100%',
          }}>
            <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>💡 Trung bình/ngày</Text>
            <div style={{ fontWeight: 800, fontSize: isMobile ? 16 : 20, color: '#fa8c16', marginTop: 4 }}>
              {entries.length > 0 ? formatCurrency(total / entries.length) : '—'}
            </div>
          </div>
        </Col>
      </Row>

      {/* Entries list */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <Text strong style={{ fontSize: isMobile ? 14 : 15 }}>
              Danh sách thu nhập {isMobile ? selectedMonth.format('MM/YYYY') : `tháng ${selectedMonth.format('MM/YYYY')}`}
            </Text>
            {entries.length > 0 && (
              <Tag color="green" style={{ margin: 0, borderRadius: 10, flexShrink: 0 }}>{entries.length} khoản</Tag>
            )}
          </div>
        }
        style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
        bodyStyle={{ padding: isMobile ? '10px 8px' : 0 }}
      >
        <Spin spinning={loading}>
          {entries.length === 0 && !loading ? (
            <Empty description="Chưa có khoản thu nhập nào trong tháng này" style={{ padding: '40px 16px' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                Thêm khoản đầu tiên
              </Button>
            </Empty>
          ) : (
            entries.map((entry, idx) => (
              <div
                key={entry.id}
                style={{
                  padding: isMobile ? '12px 14px' : '14px 20px',
                  borderBottom: idx < entries.length - 1 ? '1px solid #f0f0f0' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#fff',
                }}
              >
                {/* Date badge */}
                <div style={{
                  width: isMobile ? 44 : 50,
                  height: isMobile ? 44 : 50,
                  borderRadius: 12,
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#52c41a', lineHeight: 1 }}>
                    {dayjs(entry.date).format('DD')}
                  </span>
                  <span style={{ fontSize: 10, color: '#8c8c8c' }}>
                    {dayjs(entry.date).format('MM/YY')}
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: isMobile ? 15 : 16, color: '#52c41a' }}>
                    +{formatCurrency(entry.amount)}
                  </div>
                  {entry.note && (
                    <Text type="secondary" style={{ fontSize: 12 }} ellipsis>{entry.note}</Text>
                  )}
                  <div style={{ fontSize: 11, color: '#bfbfbf' }}>
                    {dayjs(entry.date).format('dddd, DD/MM/YYYY')}
                  </div>
                </div>

                {/* Actions */}
                <Space size={4}>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(entry)}
                    style={{ color: '#1890ff' }}
                    size="small"
                  />
                  <Popconfirm
                    title="Xóa khoản thu nhập?"
                    onConfirm={() => handleDelete(entry.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                    placement="topRight"
                  >
                    <Button type="text" icon={<DeleteOutlined />} danger size="small" />
                  </Popconfirm>
                </Space>
              </div>
            ))
          )}
        </Spin>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingEntry ? 'Chỉnh sửa khoản thu nhập' : 'Thêm khoản thu nhập'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        okText={editingEntry ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
        okButtonProps={{ style: { background: '#52c41a', borderColor: '#52c41a' } }}
        centered
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Ngày"
            name="date"
            rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
              disabledDate={(d) => d && d.isAfter(dayjs(), 'day')}
            />
          </Form.Item>
          <Form.Item
            label="Số tiền thu nhập (VNĐ)"
            name="amount"
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền' },
              { type: 'number', min: 1, message: 'Số tiền phải lớn hơn 0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(val) => val.replace(/,/g, '')}
              min={1}
              step={50000}
              placeholder="VD: 300,000"
              addonAfter="VNĐ"
            />
          </Form.Item>
          <Form.Item label="Ghi chú (tùy chọn)" name="note">
            <Input.TextArea
              rows={2}
              placeholder="VD: Lương part-time, freelance, bán hàng..."
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IncomePage;
