import { useState, useEffect } from 'react';
import {
  Modal, Form, Input, InputNumber, DatePicker, Select, Button,
  Switch, Upload, message, notification, Image, Typography, Space,
} from 'antd';
import {
  UploadOutlined, SyncOutlined, DeleteOutlined, PaperClipOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { billService } from '../services';
import { CATEGORIES } from '../utils/helpers';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const BillModal = ({ open, bill, defaultMonth, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState(null);
  const isEditing = !!bill;

  useEffect(() => {
    if (open) {
      if (bill) {
        form.setFieldsValue({
          title: bill.title,
          amount: parseFloat(bill.amount),
          due_date: dayjs(bill.due_date),
          category: bill.category || 'Hóa đơn',
          note: bill.note || '',
          is_recurring: !!bill.is_recurring,
        });
        setReceiptUrl(bill.receipt_url || null);
      } else {
        form.resetFields();
        if (defaultMonth) {
          form.setFieldValue('due_date', defaultMonth.startOf('month'));
        }
        form.setFieldValue('category', 'Hóa đơn');
        form.setFieldValue('is_recurring', false);
        setReceiptUrl(null);
      }
    }
  }, [open, bill, defaultMonth, form]);

  const handleImageUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Vui lòng chỉ tải lên tệp hình ảnh!');
      return Upload.LIST_IGNORE;
    }
    const isLt3M = file.size / 1024 / 1024 < 3;
    if (!isLt3M) {
      message.error('Kích thước ảnh phải nhỏ hơn 3MB!');
      return Upload.LIST_IGNORE;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setReceiptUrl(e.target.result);
      message.success('Đã tải ảnh biên lai thành công!');
    };
    reader.readAsDataURL(file);
    return false; // prevent default upload
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        title: values.title.trim(),
        amount: values.amount,
        due_date: values.due_date.format('YYYY-MM-DD'),
        category: values.category || 'Hóa đơn',
        note: values.note?.trim() || '',
        is_recurring: !!values.is_recurring,
        receipt_url: receiptUrl,
      };

      if (isEditing) {
        await billService.update(bill.id, payload);
        notification.success({ message: 'Cập nhật thành công!' });
      } else {
        await billService.create(payload);
        notification.success({ message: 'Thêm khoản thanh toán thành công!' });
      }
      onSuccess();
    } catch (err) {
      notification.error({
        message: err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEditing ? 'Chỉnh sửa khoản thanh toán' : 'Thêm khoản thanh toán'}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="title"
          label="Tên khoản thanh toán"
          rules={[
            { required: true, message: 'Vui lòng nhập tên khoản thanh toán' },
            { max: 255, message: 'Tối đa 255 ký tự' },
          ]}
        >
          <Input placeholder="VD: Tiền điện, Tiền nhà, ShopeePay..." />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Số tiền (VNĐ)"
          rules={[
            { required: true, message: 'Vui lòng nhập số tiền' },
            { type: 'number', min: 0, message: 'Số tiền không được âm' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="VD: 500000"
            formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(val) => val.replace(/,/g, '')}
            min={0}
            step={1000}
          />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item
            name="due_date"
            label="Ngày đến hạn"
            rules={[{ required: true, message: 'Vui lòng chọn ngày đến hạn' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
            />
          </Form.Item>

          <Form.Item name="category" label="Danh mục">
            <Select placeholder="Chọn danh mục">
              {CATEGORIES.map((cat) => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        {/* Recurring switch */}
        <Form.Item
          name="is_recurring"
          valuePropName="checked"
          style={{ marginBottom: 12 }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#fafafa',
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #f0f0f0',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                <SyncOutlined style={{ color: '#1890ff' }} />
                <span>Khoản thanh toán định kỳ hàng tháng</span>
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Tự động đánh dấu để sao chép nhanh sang các tháng tiếp theo
              </Text>
            </div>
            <Switch />
          </div>
        </Form.Item>

        {/* Receipt Attachment */}
        <Form.Item label="Ảnh biên lai / Bill chuyển khoản (Tùy chọn)">
          {receiptUrl ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 10,
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 8,
            }}>
              <Image
                src={receiptUrl}
                alt="Biên lai"
                width={60}
                height={60}
                style={{ objectFit: 'cover', borderRadius: 6 }}
              />
              <div style={{ flex: 1 }}>
                <Text strong style={{ color: '#52c41a', display: 'block', fontSize: 13 }}>
                  Đã đính kèm ảnh biên lai
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>Nhấp vào ảnh để xem kích thước lớn</Text>
              </div>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => setReceiptUrl(null)}
              >
                Gỡ ảnh
              </Button>
            </div>
          ) : (
            <Upload
              beforeUpload={handleImageUpload}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Tải ảnh biên lai / ảnh chụp màn hình</Button>
            </Upload>
          )}
        </Form.Item>

        <Form.Item name="note" label="Ghi chú">
          <TextArea rows={2} placeholder="Ghi chú thêm (tùy chọn)" />
        </Form.Item>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEditing ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default BillModal;
