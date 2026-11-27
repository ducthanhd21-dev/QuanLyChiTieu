import { Typography, Divider } from 'antd';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

/**
 * Shared light-themed layout wrapper for Login and Register pages.
 */
const AuthLayout = ({
  subtitle,
  maxWidth = 420,
  footerPrompt,
  footerLinkText,
  footerLinkTo,
  children,
}) => {
  return (
    <div className="auth-page">
      {/* Subtle pastel background blobs */}
      <div className="auth-blob auth-blob-1" aria-hidden="true" />
      <div className="auth-blob auth-blob-2" aria-hidden="true" />
      <div className="auth-blob auth-blob-3" aria-hidden="true" />

      <main className="auth-card" style={{ maxWidth }}>
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-logo-wrap">
            <img
              src="/icon-192.png"
              alt="Hóa đơn"
              className="auth-logo"
            />
          </div>
          <Title level={2} className="auth-title">
            Quản Lý Chi Tiêu
          </Title>
          <Text className="auth-subtitle">
            bởi <span className="auth-author">Đức Thành</span> · {subtitle}
          </Text>
        </div>

        {/* Form Content */}
        {children}

        {/* Divider & Navigation Footer */}
        <Divider className="auth-divider">
          <span className="auth-divider-text">Hoặc</span>
        </Divider>

        <div className="auth-footer">
          <span className="auth-footer-prompt">{footerPrompt} </span>
          <Link to={footerLinkTo} className="auth-link">
            <span>{footerLinkText}</span>
            <span className="auth-link-arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
