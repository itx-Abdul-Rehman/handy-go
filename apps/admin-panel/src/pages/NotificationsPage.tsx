/**
 * Notifications Management Page — admin broadcast and notification history.
 *
 * TODO: Wire up real data from the notification-service once the
 * admin notification endpoints are finalized. Currently renders a
 * placeholder layout demonstrating the intended UI structure.
 */
import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Skeleton,
  Alert,
  Button,
  Paper,
  Chip,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  Send as SendIcon,
  History as HistoryIcon,
  Campaign as CampaignIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function NotificationsPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>
          Notifications
        </Typography>
        <Chip label="Coming Soon" color="info" variant="outlined" />
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        The notification management system is under active development. Push notification
        broadcasting and history will be available once the notification-service admin endpoints
        are deployed.
      </Alert>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        {[
          { label: 'Total Sent', value: '—', icon: <SendIcon />, color: '#2196f3' },
          { label: 'Pending', value: '—', icon: <NotificationsActiveIcon />, color: '#ff9800' },
          { label: 'Campaigns', value: '—', icon: <CampaignIcon />, color: '#4caf50' },
          { label: 'Delivery Rate', value: '—', icon: <HistoryIcon />, color: '#9c27b0' },
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
                <Typography variant="h5" fontWeight={700}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ px: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Send Notification" />
          <Tab label="History" />
          <Tab label="Templates" />
        </Tabs>

        {/* ── Send Notification Tab ───────────────────────────────── */}
        <TabPanel value={tab} index={0}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Broadcast Notification
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Send a push notification to all users or a targeted group.
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Target Audience"
                    select
                    defaultValue="all"
                    disabled
                  >
                    <MenuItem value="all">All Users</MenuItem>
                    <MenuItem value="customers">Customers Only</MenuItem>
                    <MenuItem value="workers">Workers Only</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Notification Type"
                    select
                    defaultValue="SYSTEM"
                    disabled
                  >
                    <MenuItem value="SYSTEM">System</MenuItem>
                    <MenuItem value="PROMOTION">Promotion</MenuItem>
                    <MenuItem value="SOS">SOS</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Title" placeholder="Notification title" disabled />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Message Body"
                    placeholder="Notification message..."
                    multiline
                    rows={4}
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  {/* TODO: Connect to notification-service POST /api/notifications/broadcast */}
                  <Button variant="contained" startIcon={<SendIcon />} disabled>
                    Send Notification
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        {/* ── History Tab ─────────────────────────────────────────── */}
        <TabPanel value={tab} index={1}>
          <Typography variant="h6" gutterBottom>
            Notification History
          </Typography>
          {/* TODO: Fetch from GET /api/notifications/admin/history with pagination */}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Recipients</TableCell>
                <TableCell>Sent At</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <TableCell key={j}>
                      <Skeleton variant="text" width={80 + Math.random() * 60} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabPanel>

        {/* ── Templates Tab ───────────────────────────────────────── */}
        <TabPanel value={tab} index={2}>
          <Typography variant="h6" gutterBottom>
            Notification Templates
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Manage reusable notification templates for common scenarios.
          </Typography>
          {/* TODO: CRUD for notification templates stored in Appwrite */}
          {[
            { name: 'Booking Confirmed', type: 'BOOKING', active: true },
            { name: 'Worker Assigned', type: 'BOOKING', active: true },
            { name: 'SOS Alert', type: 'SOS', active: true },
            { name: 'Payment Received', type: 'PAYMENT', active: true },
            { name: 'Weekly Promotion', type: 'PROMOTION', active: false },
          ].map((tpl) => (
            <Card key={tpl.name} sx={{ mb: 1 }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box>
                  <Typography fontWeight={600}>{tpl.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Type: {tpl.type}
                  </Typography>
                </Box>
                <Chip
                  label={tpl.active ? 'Active' : 'Disabled'}
                  color={tpl.active ? 'success' : 'default'}
                  size="small"
                />
              </CardContent>
            </Card>
          ))}
        </TabPanel>
      </Paper>
    </Box>
  );
}
