import { useState } from 'react';
import { Layout, Menu, Button, Avatar, Typography, Drawer, Modal } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuOutlined,
  CrownOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PWAInstallPrompt from './PWAInstallPrompt';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const baseMenuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/bills', icon: <FileTextOutlined />, label: 'Khoản thanh toán' },
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
              Quản trị <span style={{ fontSize: 10, background: '#722ed1', color: '#fff', padding: '1px 5px', borderRadius: 4, marginLeft: 4 }}>Admin</span>
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

  const SideMenu = () => (
    <>
      {/* Logo */}
      <div style={{
        padding: '16px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 8,
      }}>
        {/* Modern glowing badge icon */}
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)',
          flexShrink: 0,
        }}>
          <ThunderboltFilled style={{ fontSize: 18, color: '#fff' }} />
        </div>

        {!collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{
              color: '#fff',
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: '0.4px',
            }}>
              BillTrack
            </span>
            <span style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: 11,
              marginTop: 3,
            }}>
              by <span style={{ color: '#69c0ff', fontWeight: 500 }}>DucThanh</span>
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
        style={{ border: 'none', flex: 1 }}
      />

      {/* PWA Install Button */}
      {!collapsed && <PWAInstallPrompt type="sidebar-button" />}

      {/* User info + Logout */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <Avatar style={{ backgroundColor: user?.role === 'admin' ? '#722ed1' : '#1890ff', flexShrink: 0 }}>
          {user?.name?.charAt(0)?.toUpperCase()}
        </Avatar>
        {!collapsed && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Text strong style={{ color: '#fff', fontSize: 13 }} ellipsis>
                {user?.name}
              </Text>
              {user?.role === 'admin' && (
                <span style={{ fontSize: 10, background: '#722ed1', color: '#fff', padding: '0 4px', borderRadius: 3 }}>
                  Admin
                </span>
              )}
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }} ellipsis>
              {user?.email}
            </Text>
          </div>
        )}
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{ color: 'rgba(255,255,255,0.65)' }}
          title="Đăng xuất"
        />
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
        collapsedWidth={80}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          background: '#001529',
          display: 'flex',
          flexDirection: 'column',
        }}
        className="desktop-sider"
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <SideMenu />
        </div>
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        bodyStyle={{ padding: 0, background: '#001529', display: 'flex', flexDirection: 'column' }}
        width={250}
        closable={false}
      >
        <SideMenu />
      </Drawer>

      {/* Main layout */}
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }} className="main-layout">
        <Header
          className="app-header"
          style={{
            background: '#fff',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              className="mobile-menu-btn"
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuOpen(true)}
              style={{ display: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar style={{ backgroundColor: user?.role === 'admin' ? '#722ed1' : '#1890ff' }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Text strong style={{ display: 'none' }} className="username-text">
                {user?.name}
              </Text>
            </div>
          </div>
        </Header>

        <Content
          className="app-content"
          style={{
            padding: '24px',
            background: '#f0f2f5',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
