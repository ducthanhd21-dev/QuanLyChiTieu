import { useState, useEffect } from 'react';
import {
  Card, Typography, Form, Input, Button, Avatar,
  notification, Tabs, Tag,
} from 'antd';
import {
  UserOutlined, MailOutlined, LockOutlined, CrownOutlined,
  SaveOutlined, KeyOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services';
import PWAInstallPrompt from '../components/PWAInstallPrompt';

const { Title, Text } = Typography;

const SettingsPage = () => {
  const { user, updateUser } = useAuth();

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        name: user.name,
        email: user.email,
      });
    }
  }, [user, profileForm]);

  // Handle Update Profile (Name)
  const handleUpdateProfile = async (values) => {
    setProfileLoading(true);
    try {
      await authService.updateProfile({ name: values.name.trim() });
      updateUser({ name: values.name.trim() });
      notification.success({ message: 'Cập nhật họ tên thành công!' });
    } catch (err) {
      notification.error({
        message: err.response?.data?.message || 'Cập nhật thông tin thất bại.',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (values) => {
    setPasswordLoading(true);
    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      notification.success({ message: 'Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới.' });
      passwordForm.resetFields();
    } catch (err) {
      notification.error({
        message: err.response?.data?.message || 'Đổi mật khẩu thất bại.',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined /> Hồ sơ cá nhân
        </span>
      ),
      children: (
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleUpdateProfile}
          style={{ marginTop: 12 }}
        >
          <Form.Item
            label="Họ và tên hiển thị"
            name="name"
            rules={[
              { required: true, message: 'Vui lòng nhập họ tên' },
              { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nhập họ tên của bạn" />
          </Form.Item>

          <Form.Item label="Địa chỉ Email" name="email">
            <Input prefix={<MailOutlined />} disabled />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: -14, marginBottom: 18 }}>
            Email là định danh tài khoản cố định và không thể thay đổi.
          </Text>

          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={profileLoading}
          >
            Lưu thay đổi họ tên
          </Button>
        </Form>
      ),
    },
    {
      key: 'password',
      label: (
        <span>
          <KeyOutlined /> Đổi mật khẩu
        </span>
      ),
      children: (
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          style={{ marginTop: 12 }}
        >
          <Form.Item
            label="Mật khẩu hiện tại"
            name="currentPassword"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu hiện tại của bạn" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Tối thiểu 6 ký tự" />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            icon={<KeyOutlined />}
            loading={passwordLoading}
          >
            Cập nhật mật khẩu mới
          </Button>
        </Form>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 20 }}>Cài đặt tài khoản</Title>

      <div style={{ maxWidth: 680 }}>
        {/* User Card Header */}
        <Card
          style={{
            borderRadius: 16,
            marginBottom: 20,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          }}
          bodyStyle={{ padding: '20px 24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar
              size={64}
              style={{
                backgroundColor: user?.role === 'admin' ? '#722ed1' : '#1890ff',
                fontSize: 26,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Title level={4} style={{ margin: 0 }} ellipsis>{user?.name}</Title>
                {user?.role === 'admin' && (
                  <Tag color="purple" icon={<CrownOutlined />} style={{ margin: 0, fontSize: 11 }}>
                    Quản trị viên
                  </Tag>
                )}
              </div>
              <Text type="secondary" style={{ display: 'block', fontSize: 13 }} ellipsis>{user?.email}</Text>
              <Text type="secondary" style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4, display: 'block' }}>
                Thành viên từ: {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'Mới'}
              </Text>
            </div>
          </div>
        </Card>

        {/* Tabs for Profile and Password */}
        <Card
          style={{
            borderRadius: 16,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          }}
          bodyStyle={{ padding: '16px 24px 28px' }}
        >
          <Tabs defaultActiveKey="profile" items={tabItems} />
        </Card>

        {/* PWA App Install helper */}
        <div style={{ marginTop: 20 }}>
          <PWAInstallPrompt type="banner" />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
