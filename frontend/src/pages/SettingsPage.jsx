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
      notification.success({ message: 'Cập nhật họ tên thành công !' });
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
      notification.success({ message: 'Đổi mật khẩu thành công ! Vui lòng ghi nhớ mật khẩu mới.' });
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
    <div className="page-enter">
      {/* Header banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1f36 0%, #0f172a 50%, #1e3a5f 100%)',
        borderRadius: 18,
        padding: '20px 28px',
        marginBottom: 20,
        boxShadow: '0 6px 24px rgba(15,23,42,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <Avatar
          size={56}
          style={{
            background: user?.role === 'admin'
              ? 'linear-gradient(135deg, #722ed1, #531dab)'
              : 'linear-gradient(135deg, #1890ff, #096dd9)',
            fontSize: 24, fontWeight: 800, flexShrink: 0,
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          }}
        >
          {user?.name?.charAt(0)?.toUpperCase()}
        </Avatar>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{user?.name}</span>
            {user?.role === 'admin' && (
              <span className="badge-admin">👑 Admin</span>
            )}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 2 }}>{user?.email}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>
            ⚙️ Quản lý tài khoản & bảo mật
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680 }}>
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
