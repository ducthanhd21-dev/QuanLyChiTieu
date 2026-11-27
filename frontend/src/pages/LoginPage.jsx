import { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';

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
    <AuthLayout
      subtitle="Đăng nhập để tiếp tục"
      maxWidth={416}
      footerPrompt="Chưa có tài khoản?"
      footerLinkText="Đăng ký ngay"
      footerLinkTo="/register"
    >
      {error && (
        <Alert message={error} type="error" showIcon className="auth-alert" />
      )}

      <Form
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        size="large"
        className="auth-form"
        requiredMark={false}
      >
        <Form.Item
          name="email"
          label={<span className="auth-form-label">Gmail</span>}
          rules={[
            { required: true, message: 'Vui lòng nhập Gmail' },
            { type: 'email', message: 'Gmail không hợp lệ' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Gmail của bạn"
            className="auth-input"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span className="auth-form-label">Mật khẩu</span>}
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Nhập mật khẩu"
            className="auth-input"
          />
        </Form.Item>

        <Form.Item className="auth-submit-item">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            className="auth-submit-btn"
          >
            Đăng nhập
          </Button>
        </Form.Item>
      </Form>
    </AuthLayout>
  );
};

export default LoginPage;
