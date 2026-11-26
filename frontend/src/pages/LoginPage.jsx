import { useState } from 'react';
import { Form, Input, Button, Typography, Alert, Divider } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    try {
      const res = await authService.login(values);
      const { user, token } = res.data.data;
      login(user, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1f36 0%, #0f172a 50%, #1e293b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{
        position: 'absolute', top: -80, right: -80,
        width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(24,144,255,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -100, left: -60,
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(114,46,209,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 24,
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        padding: '36px 32px 28px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img
            src="/icon-192.png"
            alt="Hóa đơn"
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              objectFit: 'cover',
              boxShadow: '0 8px 24px rgba(24,144,255,0.35)',
              marginBottom: 12,
            }}
          />
          <Title level={2} style={{ margin: '0 0 4px', fontSize: 22 }}>Quản Lý Chi Tiêu</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            bởi <span style={{ color: '#1890ff', fontWeight: 600 }}>Đức Thành</span> · Đăng nhập để tiếp tục
          </Text>
        </div>

        {error && (
          <Alert message={error} type="error" showIcon style={{ marginBottom: 16, borderRadius: 10 }} />
        )}

        <Form layout="vertical" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="email"
            label={<span style={{ fontWeight: 600, fontSize: 13 }}>Gmail</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập Gmail' },
              { type: 'email', message: 'Gmail không hợp lệ' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="example@gmail.com"
              style={{ borderRadius: 10, height: 46 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ fontWeight: 600, fontSize: 13 }}>Mật khẩu</span>}
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Nhập mật khẩu"
              style={{ borderRadius: 10, height: 46 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12, marginTop: 4 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 48,
                fontSize: 15,
                fontWeight: 700,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                border: 'none',
                boxShadow: '0 6px 20px rgba(24,144,255,0.35)',
                letterSpacing: '0.3px',
              }}
            >
              🔑 Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '16px 0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>hoặc</Text>
        </Divider>
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">Chưa có tài khoản? </Text>
          <Link to="/register" style={{ fontWeight: 600 }}>Đăng ký ngay →</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
