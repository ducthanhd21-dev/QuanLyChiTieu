import { useState, useEffect, useCallback } from 'react';
import {
  Row, Col, Card, Typography, DatePicker, Table, Tag,
  Button, Modal, Spin, notification, Avatar, Space, Empty, Grid, Badge,
} from 'antd';
import {
  TeamOutlined, FileTextOutlined, DollarOutlined,
  EyeOutlined, CrownOutlined, UserOutlined, CheckCircleOutlined,
  ClockCircleOutlined, FileExcelOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate, getBillStatus, STATUS_CONFIG } from '../utils/helpers';
import { exportAdminUsersToExcel } from '../utils/exportExcel';
import { Navigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const AdminPage = () => {
  const { user } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedUserBills, setSelectedUserBills] = useState([]);
  const [selectedTargetUser, setSelectedTargetUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Guard: If not admin, redirect
  if (user && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const month = selectedMonth.format('YYYY-MM');
      const res = await adminService.getUsersWithBills(month);
      setData(res.data.data);
    } catch (err) {
      notification.error({
        message: err.response?.data?.message || 'Không thể tải dữ liệu quản trị.',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleViewUserBills = async (targetUser) => {
    setSelectedTargetUser(targetUser);
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const month = selectedMonth.format('YYYY-MM');
      const res = await adminService.getUserBills(targetUser.id, month);
      setSelectedUserBills(res.data.data.bills);
    } catch {
      notification.error({ message: 'Không thể tải danh sách hóa đơn của người dùng.' });
    } finally {
      setDetailLoading(false);
    }
  };

  const statCards = data ? [
    {
      title: 'Tài khoản đăng ký',
      value: data.totalUsers,
      suffix: 'người dùng',
      icon: <TeamOutlined />,
      color: '#1890ff',
      bgColor: '#e6f7ff',
    },
    {
      title: `Tổng hóa đơn (${selectedMonth.format('MM/YYYY')})`,
      value: data.totalSystemBills,
      suffix: 'hóa đơn',
      icon: <FileTextOutlined />,
      color: '#722ed1',
      bgColor: '#f9f0ff',
    },
    {
      title: `Tổng tiền (${selectedMonth.format('MM/YYYY')})`,
      value: formatCurrency(data.totalSystemAmount),
      icon: <DollarOutlined />,
      color: '#52c41a',
      bgColor: '#f6ffed',
    },
    {
      title: 'Chưa thanh toán',
      value: formatCurrency(data.totalSystemUnpaid),
      icon: <ClockCircleOutlined />,
      color: '#faad14',
      bgColor: '#fffbe6',
    },
  ] : [];

  const columns = [
    {
      title: 'Người dùng',
      key: 'user',
      render: (_, u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar style={{ backgroundColor: u.role === 'admin' ? '#722ed1' : '#1890ff' }}>
            {u.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Text strong>{u.name}</Text>
              {u.role === 'admin' && (
                <Tag color="purple" icon={<CrownOutlined />} style={{ margin: 0, fontSize: 11 }}>
                  Admin
                </Tag>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>{u.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => formatDate(d),
      responsive: ['lg'],
    },
    {
      title: `Số hóa đơn (${selectedMonth.format('MM/YY')})`,
      key: 'billsCount',
      render: (_, u) => (
        <Badge
          count={u.monthlySummary.totalBills}
          showZero
          style={{ backgroundColor: u.monthlySummary.totalBills > 0 ? '#1890ff' : '#d9d9d9' }}
        />
      ),
    },
    {
      title: 'Tổng tiền',
      key: 'totalAmount',
      render: (_, u) => (
        <Text strong style={{ color: '#1890ff' }}>
          {formatCurrency(u.monthlySummary.totalAmount)}
        </Text>
      ),
    },
    {
      title: 'Đã thanh toán',
      key: 'paidAmount',
      render: (_, u) => (
        <Text style={{ color: '#52c41a', fontWeight: 500 }}>
          {formatCurrency(u.monthlySummary.paidAmount)}
        </Text>
      ),
      responsive: ['md'],
    },
    {
      title: 'Còn nợ',
      key: 'unpaidAmount',
      render: (_, u) => (
        <Text style={{ color: u.monthlySummary.unpaidAmount > 0 ? '#faad14' : '#8c8c8c', fontWeight: 500 }}>
          {formatCurrency(u.monthlySummary.unpaidAmount)}
        </Text>
      ),
      responsive: ['md'],
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, u) => (
        <Button
          type="primary"
          ghost
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewUserBills(u)}
        >
          Xem hóa đơn
        </Button>
      ),
    },
  ];

  const handleExportAdminExcel = () => {
    if (!data || !data.users || data.users.length === 0) {
      notification.warning({ message: 'Không có dữ liệu người dùng để xuất file.' });
      return;
    }
    exportAdminUsersToExcel(data.users, selectedMonth.format('MM/YYYY'));
    notification.success({ message: 'Đã xuất file báo cáo Excel thành công!' });
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        marginBottom: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Title level={3} style={{ margin: 0 }}>Quản trị hệ thống (Admin)</Title>
            <Tag color="purple" icon={<CrownOutlined />} style={{ fontSize: 13, padding: '2px 8px' }}>
              Chỉ Admin
            </Tag>
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Theo dõi tất cả người dùng và tổng số tiền hóa đơn từng tháng
          </Text>
        </div>

        <Space wrap style={{ width: isMobile ? '100%' : 'auto' }}>
          <DatePicker
            picker="month"
            value={selectedMonth}
            onChange={(val) => val && setSelectedMonth(val)}
            format="MM/YYYY"
            placeholder="Chọn tháng"
            allowClear={false}
            style={{ width: isMobile ? '100%' : 160 }}
          />
          <Button
            icon={<FileExcelOutlined style={{ color: '#52c41a' }} />}
            onClick={handleExportAdminExcel}
          >
            {isMobile ? 'Xuất Excel' : 'Xuất báo cáo Excel'}
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        {/* Stat Cards */}
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          {statCards.map((c) => (
            <Col xs={12} sm={12} md={6} key={c.title}>
              <Card
                style={{
                  borderRadius: 14,
                  border: 'none',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  height: '100%',
                }}
                bodyStyle={{ padding: isMobile ? '12px 10px' : '18px 16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
                  <div style={{
                    width: isMobile ? 38 : 46,
                    height: isMobile ? 38 : 46,
                    borderRadius: 12,
                    background: c.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? 18 : 22,
                    color: c.color,
                    flexShrink: 0,
                  }}>
                    {c.icon}
                  </div>
                  <div style={{ overflow: 'hidden', minWidth: 0 }}>
                    <Text type="secondary" style={{ fontSize: isMobile ? 11 : 12, display: 'block' }} ellipsis>
                      {c.title}
                    </Text>
                    <div style={{
                      fontWeight: 700,
                      fontSize: isMobile ? 15 : 18,
                      color: c.color,
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {c.value}
                    </div>
                    {c.suffix && (
                      <Text type="secondary" style={{ fontSize: 10 }}>{c.suffix}</Text>
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Users List */}
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong style={{ fontSize: 15 }}>
                Danh sách người dùng & hóa đơn tháng {selectedMonth.format('MM/YYYY')}
              </Text>
              {data?.users && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Tổng cộng: {data.users.length} tài khoản
                </Text>
              )}
            </div>
          }
          style={{
            borderRadius: 14,
            border: 'none',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          }}
          bodyStyle={{ padding: isMobile ? '10px 8px' : 0 }}
        >
          {isMobile ? (
            /* Mobile User Cards */
            <div>
              {data?.users?.map((u) => (
                <div
                  key={u.id}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    padding: '14px',
                    marginBottom: 10,
                    border: '1px solid #f0f0f0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <Avatar style={{ backgroundColor: u.role === 'admin' ? '#722ed1' : '#1890ff' }}>
                      {u.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Text strong style={{ fontSize: 15 }}>{u.name}</Text>
                        {u.role === 'admin' && (
                          <Tag color="purple" style={{ margin: 0, fontSize: 10 }}>Admin</Tag>
                        )}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }} ellipsis>{u.email}</Text>
                    </div>
                  </div>

                  <div style={{
                    background: '#fafafa',
                    borderRadius: 8,
                    padding: '8px 12px',
                    marginBottom: 10,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    fontSize: 12,
                  }}>
                    <div>
                      <Text type="secondary">Hóa đơn tháng này:</Text>
                      <div style={{ fontWeight: 600 }}>{u.monthlySummary.totalBills} khoản</div>
                    </div>
                    <div>
                      <Text type="secondary">Tổng tiền:</Text>
                      <div style={{ fontWeight: 600, color: '#1890ff' }}>
                        {formatCurrency(u.monthlySummary.totalAmount)}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">Đã đóng:</Text>
                      <div style={{ fontWeight: 600, color: '#52c41a' }}>
                        {formatCurrency(u.monthlySummary.paidAmount)}
                      </div>
                    </div>
                    <div>
                      <Text type="secondary">Còn nợ:</Text>
                      <div style={{ fontWeight: 600, color: u.monthlySummary.unpaidAmount > 0 ? '#faad14' : '#8c8c8c' }}>
                        {formatCurrency(u.monthlySummary.unpaidAmount)}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="primary"
                    ghost
                    block
                    icon={<EyeOutlined />}
                    onClick={() => handleViewUserBills(u)}
                  >
                    Xem chi tiết hóa đơn
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop Table */
            <Table
              dataSource={data?.users || []}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 15 }}
            />
          )}
        </Card>
      </Spin>

      {/* Modal: View Target User's Bills */}
      <Modal
        title={
          <div>
            <span>Hóa đơn của </span>
            <Text strong style={{ color: '#1890ff' }}>{selectedTargetUser?.name}</Text>
            <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 8 }}>
              (Tháng {selectedMonth.format('MM/YYYY')})
            </span>
          </div>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailModalOpen(false)}>
            Đóng
          </Button>,
        ]}
        width={720}
      >
        <Spin spinning={detailLoading}>
          {selectedUserBills.length === 0 ? (
            <Empty
              description={`Người dùng này chưa có hóa đơn nào trong tháng ${selectedMonth.format('MM/YYYY')}`}
              style={{ padding: '32px 0' }}
            />
          ) : (
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{
                marginBottom: 14,
                padding: '10px 14px',
                background: '#e6f7ff',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                <Text>
                  Tổng: <b>{selectedUserBills.length} khoản</b>
                </Text>
                <Text>
                  Tổng tiền: <b style={{ color: '#1890ff' }}>
                    {formatCurrency(selectedUserBills.reduce((s, b) => s + parseFloat(b.amount), 0))}
                  </b>
                </Text>
              </div>

              {selectedUserBills.map((b) => {
                const status = getBillStatus(b);
                const cfg = STATUS_CONFIG[status];
                return (
                  <div
                    key={b.id}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: b.is_paid ? '#fafafa' : '#fff',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text strong style={{ textDecoration: b.is_paid ? 'line-through' : 'none' }}>
                          {b.title}
                        </Text>
                        <Tag color={cfg.color} style={{ margin: 0, fontSize: 11 }}>
                          {cfg.label}
                        </Tag>
                        {b.category && <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{b.category}</Tag>}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Đến hạn: {formatDate(b.due_date)} {b.note ? `· ${b.note}` : ''}
                      </Text>
                    </div>
                    <Text strong style={{ color: '#1890ff', fontSize: 15 }}>
                      {formatCurrency(b.amount)}
                    </Text>
                  </div>
                );
              })}
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  );
};

export default AdminPage;
