import { useState } from 'react';
import { Layout, Menu, Button, Avatar, Typography, Drawer, Modal, Tooltip } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  CrownOutlined,
  RiseOutlined,
  ShoppingOutlined,
  MenuOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PWAInstallPrompt from './PWAInstallPrompt';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

// Page title map
const PAGE_TITLES = {
  '/dashboard': 'Trang chủ',
  '/bills': 'Khoản thanh toán',
  '/income': 'Thu nhập',
  '/expenses': 'Chi tiêu hàng ngày',
  '/statistics': 'Thống kê',
  '/settings': 'Cài đặt',
  '/admin': 'Quản trị',
};

// Bottom nav items (max 5 for mobile)
const BOTTOM_NAV_ITEMS = [
  { key: '/dashboard', icon: '🏠', label: 'Trang chủ' },
  { key: '/bills', icon: '📋', label: 'Hóa đơn' },
  { key: '/expenses', icon: '🛒', label: 'Chi tiêu' },
  { key: '/income', icon: '📈', label: 'Thu nhập' },
  { key: '/statistics', icon: '📊', label: 'Thống kê' },
];

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const baseMenuItems = [
    { key: '/dashboard', icon: <HomeOutlined />, label: 'Trang chủ' },
    { key: '/bills', icon: <FileTextOutlined />, label: 'Khoản thanh toán' },
    { key: '/income', icon: <RiseOutlined style={{ color: '#52c41a' }} />, label: 'Thu nhập' },
    { key: '/expenses', icon: <ShoppingOutlined style={{ color: '#fa8c16' }} />, label: 'Chi tiêu hàng ngày' },
    { key: '/statistics', icon: <BarChartOutlined />, label: 'Thống kê' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Cài đặt' },
  ];

  const menuItems = user?.role === 'admin'
    ? [
        ...baseMenuItems,
        {
          key: '/admin',
          icon: <CrownOutlined style={{ color: '#faad14' }} />,
          label: (
            <span>
              Quản trị <span className="badge-admin" style={{ marginLeft: 4 }}>Admin</span>
            </span>
          ),
        },
      ]
    : baseMenuItems;

  const handleMenuClick = ({ key }) => {
    navigate(key);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    Modal.confirm({
      title: 'Xác nhận đăng xuất',
      content: 'Bạn có chắc muốn đăng xuất khỏi tài khoản không?',
      okText: 'Đăng xuất',
      cancelText: 'Hủy',
      okType: 'danger',
      centered: true,
      onOk: () => {
        logout();
        navigate('/login');
      },
    });
  };

  const currentPageTitle = PAGE_TITLES[location.pathname] || 'Quản Lý Chi Tiêu';

  const SideMenu = () => (
    <>
      {/* Logo */}
      <div style={{
        padding: '18px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        marginBottom: 6,
        background: 'rgba(255,255,255,0.03)',
      }}>
        <img
          src="/icon-192.png"
          alt="Hóa đơn"
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            objectFit: 'cover',
            boxShadow: '0 4px 14px rgba(24, 144, 255, 0.4)',
            flexShrink: 0,
          }}
        />
        {!collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
            <span style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '0.3px',
              whiteSpace: 'nowrap',
            }}>
              Quản Lý Chi Tiêu
            </span>
            <span style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 11,
              marginTop: 2,
            }}>
              bởi <span style={{ color: '#69c0ff', fontWeight: 600 }}>Đức Thành</span>
            </span>
          </div>
        )}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          border: 'none',
          flex: 1,
          background: 'transparent',
          padding: '4px 8px',
        }}
      />

      {/* PWA Install Button */}
      {!collapsed && <PWAInstallPrompt type="sidebar-button" />}

      {/* User info + Logout */}
      <div style={{
        padding: '14px 12px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'rgba(0,0,0,0.15)',
      }}>
        <Avatar
          style={{
            background: user?.role === 'admin'
              ? 'linear-gradient(135deg, #722ed1, #531dab)'
              : 'linear-gradient(135deg, #1890ff, #096dd9)',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            fontWeight: 700,
          }}
        >
          {user?.name?.charAt(0)?.toUpperCase()}
        </Avatar>
        {!collapsed && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Text strong style={{ color: '#fff', fontSize: 13 }} ellipsis>
                {user?.name}
              </Text>
              {user?.role === 'admin' && (
                <span className="badge-admin">Admin</span>
              )}
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }} ellipsis>
              {user?.email}
            </Text>
          </div>
        )}
        <Tooltip title="Đăng xuất" placement="right">
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{
              color: 'rgba(255,255,255,0.5)',
              borderRadius: 8,
              transition: 'all 0.2s',
            }}
          />
        </Tooltip>
      </div>
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop Sider */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        collapsedWidth={72}
        width={220}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '2px 0 16px rgba(0,0,0,0.15)',
        }}
        className="desktop-sider"
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <SideMenu />
        </div>
      </Sider>

      {/* Mobile Drawer (for more options) */}
      <Drawer
        placement="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        bodyStyle={{
          padding: 0,
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          display: 'flex',
          flexDirection: 'column',
        }}
        width={260}
        closable={false}
      >
        <SideMenu />
      </Drawer>

      {/* Main layout */}
      <Layout
        style={{ marginLeft: collapsed ? 72 : 220, transition: 'margin-left 0.2s ease' }}
        className="main-layout"
      >
        {/* Desktop Header */}
        <Header
          className="desktop-header"
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            height: 56,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1a1f36' }}>
              {currentPageTitle}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar
                size={34}
                style={{
                  background: user?.role === 'admin'
                    ? 'linear-gradient(135deg, #722ed1, #531dab)'
                    : 'linear-gradient(135deg, #1890ff, #096dd9)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <Text strong style={{ fontSize: 13, color: '#1a1f36' }}>{user?.name}</Text>
                {user?.role === 'admin' && (
                  <span className="badge-admin">Admin</span>
                )}
              </div>
            </div>
            <Tooltip title="Đăng xuất">
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{ color: '#8c8c8c' }}
              />
            </Tooltip>
          </div>
        </Header>

        {/* Mobile App Bar */}
        <div className="mobile-app-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/icon-192.png" alt="app" className="bar-logo" />
            <span className="bar-title">{currentPageTitle}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user?.role === 'admin' && (
              <Button
                size="small"
                icon={<CrownOutlined style={{ color: location.pathname === '/admin' ? '#ffd666' : '#faad14' }} />}
                onClick={() => navigate('/admin')}
                style={{
                  background: location.pathname === '/admin'
                    ? 'linear-gradient(135deg, #722ed1, #531dab)'
                    : '#f9f0ff',
                  color: location.pathname === '/admin' ? '#fff' : '#722ed1',
                  borderColor: '#d3adf7',
                  borderRadius: 20,
                  fontWeight: 600,
                  fontSize: 12,
                  padding: '0 10px',
                  height: 30,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                Admin
              </Button>
            )}
            <Avatar
              size={32}
              style={{
                background: user?.role === 'admin'
                  ? 'linear-gradient(135deg, #722ed1, #531dab)'
                  : 'linear-gradient(135deg, #1890ff, #096dd9)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              onClick={handleLogout}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
          </div>
        </div>

        <Content
          className="app-content"
          style={{
            padding: '20px 20px 24px',
            background: '#f0f4f8',
            minHeight: 'calc(100vh - 56px)',
          }}
        >
          {children}
        </Content>
      </Layout>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`bottom-nav-item${location.pathname === item.key ? ' active' : ''}`}
            onClick={() => navigate(item.key)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
        {/* More / Settings */}
        <button
          className={`bottom-nav-item${['/settings', '/admin'].includes(location.pathname) ? ' active' : ''}`}
          onClick={() => navigate('/settings')}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Cài đặt</span>
        </button>
      </nav>
    </Layout>
  );
};

export default AppLayout;
