import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Typography, DatePicker, Spin, notification, Grid } from 'antd';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, Title as ChartTitle,
  Tooltip, Legend, ArcElement, PointElement, LineElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import dayjs from 'dayjs';
import { statsService, incomeService } from '../services';
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
  const [monthlyIncome, setMonthlyIncome] = useState([]);
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

      try {
        const incomeRes = await incomeService.getMonthly();
        setMonthlyIncome(incomeRes.data.data || []);
      } catch {
        setMonthlyIncome([]);
      }
    } catch {
      notification.error({ message: 'Không thể tải dữ liệu thống kê.' });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Build 7-month window centered on selectedMonth: 3 months before, selectedMonth, 3 months after
  const billByMonth = new Map();
  monthlyData.forEach((d) => {
    billByMonth.set(d.month, parseFloat(d.total_amount) || 0);
  });

  const incomeByMonth = new Map();
  monthlyIncome.forEach((d) => {
    incomeByMonth.set(d.month, parseFloat(d.total_income) || 0);
  });

  const chartMonths = [];
  for (let offset = -3; offset <= 3; offset++) {
    const m = selectedMonth.add(offset, 'month').format('YYYY-MM');
    chartMonths.push({
      month: m,
      totalAmount: billByMonth.get(m) || 0,
      totalIncome: incomeByMonth.get(m) || 0,
    });
  }

  // Bar chart: monthly bills vs income with rounded corners
  const barChartData = {
    labels: chartMonths.map((d) => {
      const [year, month] = d.month.split('-');
      return `${month}/${year}`;
    }),
    datasets: [
      {
        label: 'Tổng số tiền',
        data: chartMonths.map((d) => d.totalAmount),
        backgroundColor: 'rgba(24, 144, 255, 0.75)',
        borderColor: '#1890ff',
        borderWidth: 1.5,
        borderRadius: 12,
        borderSkipped: false,
        barPercentage: 0.65,
        categoryPercentage: 0.75,
      },
      {
        label: 'Tổng thu nhập',
        data: chartMonths.map((d) => d.totalIncome),
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
    <div className="page-enter">
      {/* Header banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1f36 0%, #722ed1 60%, #531dab 100%)',
        borderRadius: 18,
        padding: isMobile ? '16px 18px' : '20px 28px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 6px 24px rgba(114,46,209,0.25)',
        position: 'relative',
        overflow: 'hidden',
        gap: 12,
      }}>
        <div style={{ position: 'absolute', top: -30, right: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 3 }}>📊 Phân tích</div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: isMobile ? 18 : 22 }}>Thống kê chi tiêu</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 4 }}>
            Xem chi tiết 7 tháng xung quanh tháng được chọn
          </div>
        </div>
        <DatePicker
          picker="month"
          value={selectedMonth}
          onChange={(val) => val && setSelectedMonth(val)}
          format="MM/YYYY"
          placeholder="Chọn tháng"
          allowClear={false}
          style={{
            borderRadius: 10,
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            width: isMobile ? 100 : 120,
            flexShrink: 0,
          }}
        />
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {/* Bar chart: monthly */}
          <Col xs={24} lg={14}>
            <Card
              title={<span style={{ fontWeight: 600 }}>Chi tiêu & Thu nhập theo tháng</span>}
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}
              bodyStyle={{ padding: isMobile ? 12 : 24 }}
            >
              {chartMonths.length > 0 ? (
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
                    const color = COLORS[idx % COLORS.length];
                    return (
                      <div
                        key={cat.category}
                        style={{
                          padding: '12px 0',
                          borderBottom: idx < categoryData.length - 1 ? '1px solid #f5f5f5' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <div style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: color, flexShrink: 0,
                          }} />
                          <Text style={{ flex: 1, fontWeight: 600, fontSize: 13 }} ellipsis>{cat.category}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>{cat.total_bills} khoản</Text>
                          <Text type="secondary" style={{ fontSize: 12, width: 40, textAlign: 'right' }}>
                            {pct.toFixed(1)}%
                          </Text>
                          <Text strong style={{ color, width: isMobile ? 90 : 110, textAlign: 'right', fontSize: isMobile ? 13 : 14 }}>
                            {formatCurrency(cat.total_amount)}
                          </Text>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: 6, background: '#f0f0f0', borderRadius: 6, overflow: 'hidden', marginLeft: 20 }}>
                          <div style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: color,
                            borderRadius: 6,
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
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
