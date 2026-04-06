import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People as PeopleIcon,
  Engineering as EngineeringIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '../services';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

function StatCard({ title, value, change, icon, color, loading }: StatCardProps) {
  const isPositive = change >= 0;

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={40} />
          <Skeleton variant="text" width="50%" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
          {value}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isPositive ? (
            <TrendingUp sx={{ fontSize: 18, color: 'success.main' }} />
          ) : (
            <TrendingDown sx={{ fontSize: 18, color: 'error.main' }} />
          )}
          <Typography
            variant="body2"
            color={isPositive ? 'success.main' : 'error.main'}
          >
            {isPositive ? '+' : ''}{change}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            vs last period
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// Status display helpers
const statusDisplayMap: Record<string, { label: string; bgColor: string; textColor: string }> = {
  COMPLETED: { label: 'Completed', bgColor: 'success.light', textColor: 'success.dark' },
  IN_PROGRESS: { label: 'In Progress', bgColor: 'info.light', textColor: 'info.dark' },
  PENDING: { label: 'Pending', bgColor: 'warning.light', textColor: 'warning.dark' },
  ACCEPTED: { label: 'Accepted', bgColor: 'info.light', textColor: 'info.dark' },
  CANCELLED: { label: 'Cancelled', bgColor: 'error.light', textColor: 'error.dark' },
};

export default function DashboardPage() {
  const [period, setPeriod] = useState('week');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', period],
    queryFn: () => bookingsApi.getBookingStats(period as 'day' | 'week' | 'month'),
    select: (res) => res,
  });

  const s = (stats as any)?.stats;

  const statsCards = [
    {
      title: 'Total Bookings',
      value: s?.totalBookings ?? 0,
      change: s?.completedBookings ? Math.round((s.completedBookings / (s.totalBookings || 1)) * 100) : 0,
      icon: <AssignmentIcon />,
      color: '#2196F3',
    },
    {
      title: 'Active Workers',
      value: s?.activeWorkers ?? 0,
      change: 0,
      icon: <EngineeringIcon />,
      color: '#4CAF50',
    },
    {
      title: 'Total Customers',
      value: s?.totalCustomers ?? 0,
      change: 0,
      icon: <PeopleIcon />,
      color: '#9C27B0',
    },
    {
      title: 'Revenue',
      value: `Rs. ${(s?.totalRevenue ?? 0).toLocaleString()}`,
      change: s?.averageRating ? s.averageRating : 0,
      icon: <MoneyIcon />,
      color: '#FF9800',
    },
  ];

  const dailyBookings: Array<{ dayName: string; bookings: number }> = s?.dailyBookings ?? [];
  const monthlyRevenue: Array<{ month: string; revenue: number }> = s?.monthlyRevenue ?? [];
  const categoryData: Array<{ name: string; value: number; color: string }> = s?.categoryDistribution ?? [];
  const recentBookings: Array<{ id: string; customer: string; service: string; status: string; amount: number }> =
    s?.recentBookings ?? [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back! Here's what's happening with your platform.
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={(e) => setPeriod(e.target.value)}
          >
            <MenuItem value="day">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statsCards.map((card, index) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
            <StatCard {...card} loading={isLoading} />
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Bookings Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Bookings Overview
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyBookings}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="dayName" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="bookings"
                      stroke="#2196F3"
                      strokeWidth={3}
                      dot={{ fill: '#2196F3', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Distribution */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Service Categories
              </Typography>
              <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2 }}>
                {categoryData.map((item) => (
                  <Box
                    key={item.name}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: item.color }} />
                      <Typography variant="body2">{item.name}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600}>{item.value}%</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Second Row */}
      <Grid container spacing={3}>
        {/* Revenue Chart */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Revenue Trend
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `Rs. ${(value as number).toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Bookings */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Bookings
                </Typography>
                <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                  View All
                </Typography>
              </Box>
              {recentBookings.length === 0 && !isLoading && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No bookings yet
                </Typography>
              )}
              {recentBookings.map((booking) => {
                const statusInfo = statusDisplayMap[booking.status] ?? statusDisplayMap.PENDING;
                return (
                <Box
                  key={booking.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {booking.customer}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {booking.id} • {booking.service}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight={600}>
                      Rs. {booking.amount.toLocaleString()}
                    </Typography>
                    <Chip
                      size="small"
                      label={statusInfo.label}
                      sx={{
                        backgroundColor: statusInfo.bgColor,
                        color: statusInfo.textColor,
                        fontWeight: 500,
                        height: 22,
                      }}
                    />
                  </Box>
                </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
