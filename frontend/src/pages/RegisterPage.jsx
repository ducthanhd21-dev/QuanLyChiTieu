import { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    try {
      const res = await authService.register(values);
      const { user, token } = res.data.data;
      login(user, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      subtitle="Tạo tài khoản mới"
      maxWidth={440}
      footerPrompt="Đã có tài khoản?"
      footerLinkText="Đăng nhập ngay"
      footerLinkTo="/login"
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
          name="name"
          label={<span className="auth-form-label">Họ tên</span>}
          rules={[
            { required: true, message: 'Vui lòng nhập họ tên' },
            { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Nguyễn Văn A"
            className="auth-input"
          />
        </Form.Item>

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
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu' },
            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Nhập mật khẩu"
            className="auth-input"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label={<span className="auth-form-label">Xác nhận mật khẩu</span>}
          dependencies={['password']}
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Nhập lại mật khẩu"
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
            Tạo tài khoản
          </Button>
        </Form.Item>
      </Form>
    </AuthLayout>
  );
};

export default RegisterPage;
