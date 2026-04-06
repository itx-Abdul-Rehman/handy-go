/**
 * Analytics Page — comprehensive platform metrics and insights.
 *
 * TODO: Wire up real data from bookingsApi.getBookingStats() and
 * paymentsApi.getTransactionStats() once the dashboard analytics
 * API is finalized. Currently renders a placeholder layout with
 * chart placeholders that demonstrate the intended structure.
 */
import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Skeleton,
  Alert,
  Paper,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>
          Analytics
        </Typography>
        <Chip label="Coming Soon" color="info" variant="outlined" />
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        The analytics dashboard is under active development. Real-time data integration will be
        available once the analytics-service is deployed.
      </Alert>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        {[
          { label: 'Total Revenue', icon: <TrendingUpIcon />, color: '#4caf50' },
          { label: 'Total Bookings', icon: <BarChartIcon />, color: '#2196f3' },
          { label: 'Active Workers', icon: <PieChartIcon />, color: '#ff9800' },
          { label: 'Avg. Rating', icon: <TimelineIcon />, color: '#9c27b0' },
        ].map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                  <Typography variant="body2" color="text.secondary">
                    {card.label}
                  </Typography>
                </Box>
                <Skeleton variant="text" width="60%" height={40} />
                <Skeleton variant="text" width="40%" height={20} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs for different analytics views */}
      <Paper sx={{ px: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Bookings" />
          <Tab label="Revenue" />
          <Tab label="Workers" />
          <Tab label="Customers" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <Typography variant="h6" gutterBottom>
            Booking Trends
          </Typography>
          {/* TODO: Recharts BarChart — daily bookings for last 30 days */}
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2, mb: 3 }} />

          <Typography variant="h6" gutterBottom>
            Category Distribution
          </Typography>
          {/* TODO: Recharts PieChart — bookings by service category */}
          <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Typography variant="h6" gutterBottom>
            Monthly Revenue
          </Typography>
          {/* TODO: Recharts LineChart — monthly revenue for last 12 months */}
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2, mb: 3 }} />

          <Typography variant="h6" gutterBottom>
            Revenue by Category
          </Typography>
          {/* TODO: Recharts BarChart — revenue breakdown by category */}
          <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <Typography variant="h6" gutterBottom>
            Worker Performance
          </Typography>
          {/* TODO: Top workers table, avg completion time, ratings distribution */}
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2, mb: 3 }} />

          <Typography variant="h6" gutterBottom>
            Worker Availability Heatmap
          </Typography>
          {/* TODO: Heatmap showing worker availability by day/hour */}
          <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
        </TabPanel>

        <TabPanel value={tab} index={3}>
          <Typography variant="h6" gutterBottom>
            Customer Growth
          </Typography>
          {/* TODO: Recharts AreaChart — customer signups over time */}
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2, mb: 3 }} />

          <Typography variant="h6" gutterBottom>
            Customer Retention
          </Typography>
          {/* TODO: Cohort analysis or retention funnel */}
          <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 2 }} />
        </TabPanel>
      </Paper>
    </Box>
  );
}
