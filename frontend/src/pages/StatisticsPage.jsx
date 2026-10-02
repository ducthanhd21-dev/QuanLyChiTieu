import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Typography, DatePicker, Spin, notification, Grid } from 'antd';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title as ChartTitle,
  Tooltip, Legend, ArcElement, PointElement, LineElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import dayjs from 'dayjs';
import { statsService } from '../services';
import { formatCurrency } from '../utils/helpers';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ChartTitle,
  Tooltip, Legend, ArcElement, PointElement, LineElement
);

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const COLORS = [
  '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
  '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb',
  '#fadb14',
];

const StatisticsPage = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [monthlyRes, categoryRes] = await Promise.all([
        statsService.getMonthly(),
        statsService.getByCategory(selectedMonth.format('YYYY-MM')),
      ]);
      setMonthlyData(monthlyRes.data.data.reverse());
      setCategoryData(categoryRes.data.data);
    } catch {
      notification.error({ message: 'Không thể tải dữ liệu thống kê.' });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Bar chart: monthly totals with rounded corners
  const barChartData = {
    labels: monthlyData.map((d) => {
      const [year, month] = d.month.split('-');
      return `${month}/${year}`;
    }),
    datasets: [
      {
        label: 'Tổng số tiền',
        data: monthlyData.map((d) => parseFloat(d.total_amount)),
        backgroundColor: 'rgba(24, 144, 255, 0.75)',
        borderColor: '#1890ff',
        borderWidth: 1.5,
        borderRadius: 12,
        borderSkipped: false,
        barPercentage: 0.65,
        categoryPercentage: 0.75,
      },
      {
        label: 'Đã thanh toán',
        data: monthlyData.map((d) => parseFloat(d.paid_amount)),
        backgroundColor: 'rgba(82, 196, 26, 0.75)',
        borderColor: '#52c41a',
        borderWidth: 1.5,
        borderRadius: 12,
        borderSkipped: false,
        barPercentage: 0.65,
        categoryPercentage: 0.75,
      },
    ],
  };

  // Doughnut: category breakdown with rounded corners and spacing
  const doughnutData = {
    labels: categoryData.map((d) => d.category),
    datasets: [
      {
        data: categoryData.map((d) => parseFloat(d.total_amount)),
        backgroundColor: COLORS.slice(0, categoryData.length),
        borderWidth: 3,
        borderColor: '#fff',
        borderRadius: 10,
        spacing: 5,
        cutout: '70%',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: !isMobile,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 16,
          font: { family: 'Inter', size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y || ctx.parsed)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 } },
      },
      y: {
        grid: { color: '#f0f0f0' },
        ticks: {
          font: { family: 'Inter', size: 11 },
          callback: (val) => {
            if (val >= 1000000) return `${(val / 1000000).toFixed(1)}tr`;
            if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
            return val;
          },
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: !isMobile,
    plugins: {
      legend: {
        position: isMobile ? 'bottom' : 'right',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 12,
          font: { family: 'Inter', size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.parsed)}`,
        },
      },
    },
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
        <Title level={3} style={{ margin: 0 }}>Thống kê</Title>
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={(val) => val && setSelectedMonth(val)}
          format="MM/YYYY"
          placeholder="Chọn tháng"
          allowClear={false}
          style={{ width: isMobile ? '100%' : 'auto' }}
        />
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {/* Bar chart: monthly */}
          <Col xs={24} lg={14}>
            <Card
              title={<span style={{ fontWeight: 600 }}>Tổng tiền theo tháng</span>}
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}
              bodyStyle={{ padding: isMobile ? 12 : 24 }}
            >
              {monthlyData.length > 0 ? (
                <div style={{ minHeight: isMobile ? 260 : 320 }}>
                  <Bar data={barChartData} options={chartOptions} />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 48 }}>
                  <Text type="secondary">Chưa có dữ liệu</Text>
                </div>
              )}
            </Card>
          </Col>

          {/* Doughnut: category */}
          <Col xs={24} lg={10}>
            <Card
              title={<span style={{ fontWeight: 600 }}>Theo danh mục — {selectedMonth.format('MM/YYYY')}</span>}
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}
              bodyStyle={{ padding: isMobile ? 12 : 24 }}
            >
              {categoryData.length > 0 ? (
                <div style={{ minHeight: isMobile ? 240 : 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 48 }}>
                  <Text type="secondary">Chưa có dữ liệu trong tháng này</Text>
                </div>
              )}
            </Card>
          </Col>

          {/* Category breakdown table */}
          <Col xs={24}>
            <Card
              title={<span style={{ fontWeight: 600 }}>Chi tiết danh mục — {selectedMonth.format('MM/YYYY')}</span>}
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}
              bodyStyle={{ padding: isMobile ? '12px 14px' : '20px 24px' }}
            >
              {categoryData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <Text type="secondary">Chưa có dữ liệu</Text>
                </div>
              ) : (
                <div>
                  {categoryData.map((cat, idx) => {
                    const totalSum = categoryData.reduce((sum, c) => sum + parseFloat(c.total_amount), 0);
                    const pct = totalSum > 0 ? (parseFloat(cat.total_amount) / totalSum) * 100 : 0;
                    return (
                      <div
                        key={cat.category}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '12px 0',
                          borderBottom: idx < categoryData.length - 1 ? '1px solid #f0f0f0' : 'none',
                        }}
                      >
                        <div style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: COLORS[idx % COLORS.length],
                          flexShrink: 0,
                        }} />
                        <Text style={{ flex: 1, fontWeight: 500 }} ellipsis>{cat.category}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{cat.total_bills} khoản</Text>
                        <Text type="secondary" style={{ width: 45, textAlign: 'right', fontSize: 12 }}>
                          {pct.toFixed(1)}%
                        </Text>
                        <Text strong style={{ color: '#1890ff', width: isMobile ? 90 : 120, textAlign: 'right', fontSize: isMobile ? 13 : 14 }}>
                          {formatCurrency(cat.total_amount)}
                        </Text>
                      </div>
                    );
                  })}
                  <div style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: '2px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 12,
                  }}>
                    <Text strong>Tổng cộng:</Text>
                    <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                      {formatCurrency(categoryData.reduce((sum, c) => sum + parseFloat(c.total_amount), 0))}
                    </Text>
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default StatisticsPage;
