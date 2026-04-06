import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  CheckCircle as ResolveIcon,
  ArrowUpward as EscalateIcon,
  Warning as WarningIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sosApi } from '../services';

interface SOS {
  _id: string;
  booking?: {
    bookingNumber: string;
    serviceCategory: string;
  };
  initiatedBy: {
    userType: 'CUSTOMER' | 'WORKER';
    userId: string;
    name: string;
    phone: string;
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  description: string;
  location: {
    coordinates: [number, number];
    address?: string;
  };
  status: 'ACTIVE' | 'RESOLVED' | 'ESCALATED' | 'FALSE_ALARM';
  createdAt: string;
}

export default function SOSPage() {
  const queryClient = useQueryClient();
  const [selectedSOS, setSelectedSOS] = useState<SOS | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolution, setResolution] = useState({ action: '', notes: '' });

  const { data: sosData, isLoading } = useQuery({
    queryKey: ['sos-alerts'],
    queryFn: () => sosApi.getActiveSOS(),
    select: (res) => res,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const resolveMutation = useMutation({
    mutationFn: ({ sosId, data }: { sosId: string; data: { action: string; notes: string } }) =>
      sosApi.resolveSOS(sosId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sos-alerts'] });
      setResolveDialogOpen(false);
      setSelectedSOS(null);
      setResolution({ action: '', notes: '' });
    },
  });

  const sosAlerts = sosData?.alerts || [];
  const activeAlerts = sosAlerts.filter((s) => s.status === 'ACTIVE' || s.status === 'ESCALATED');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'error';
      case 'ESCALATED':
        return 'warning';
      case 'RESOLVED':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleView = (sos: SOS) => {
    setSelectedSOS(sos);
    setViewDialogOpen(true);
  };

  const handleResolve = (sos: SOS) => {
    setSelectedSOS(sos);
    setResolveDialogOpen(true);
  };

  const handleSubmitResolution = () => {
    if (selectedSOS) {
      resolveMutation.mutate({
        sosId: selectedSOS._id,
        data: resolution,
      });
    }
  };

  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    return `${Math.floor(seconds)}s ago`;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            SOS Alerts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and respond to emergency alerts
          </Typography>
        </Box>
        <Badge badgeContent={activeAlerts.length} color="error">
          <Chip
            icon={<WarningIcon />}
            label="Active Alerts"
            color={activeAlerts.length > 0 ? 'error' : 'default'}
            variant={activeAlerts.length > 0 ? 'filled' : 'outlined'}
          />
        </Badge>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ bgcolor: 'error.light' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight={600} color="error.dark">
                {sosAlerts.filter(s => s.status === 'ACTIVE').length}
              </Typography>
              <Typography variant="body2" color="error.dark">
                Active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ bgcolor: 'warning.light' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight={600} color="warning.dark">
                {sosAlerts.filter(s => s.status === 'ESCALATED').length}
              </Typography>
              <Typography variant="body2" color="warning.dark">
                Escalated
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight={600} color="error.main">
                {sosAlerts.filter(s => s.priority === 'CRITICAL').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Critical Priority
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight={600} color="success.main">
                {sosAlerts.filter(s => s.status === 'RESOLVED').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Resolved Today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Alerts - Priority Cards */}
      {activeAlerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            🚨 Active Alerts
          </Typography>
          <Grid container spacing={2}>
            {activeAlerts.map((sos) => (
              <Grid size={{ xs: 12, md: 6 }} key={sos._id}>
                <Card
                  sx={{
                    border: 2,
                    borderColor:
                      sos.priority === 'CRITICAL'
                        ? 'error.main'
                        : sos.priority === 'HIGH'
                        ? 'warning.main'
                        : 'info.main',
                    animation: sos.priority === 'CRITICAL' ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0.4)' },
                      '70%': { boxShadow: '0 0 0 10px rgba(211, 47, 47, 0)' },
                      '100%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0)' },
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: sos.initiatedBy.userType === 'CUSTOMER' ? 'primary.main' : 'secondary.main' }}>
                          {sos.initiatedBy.name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {sos.initiatedBy.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sos.initiatedBy.userType}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={sos.priority}
                          size="small"
                          color={getPriorityColor(sos.priority) as 'error' | 'warning' | 'info' | 'default'}
                        />
                        <Chip
                          label={sos.status}
                          size="small"
                          color={getStatusColor(sos.status) as 'error' | 'warning' | 'success' | 'default'}
                        />
                      </Box>
                    </Box>

                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                      {sos.reason}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {sos.description}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption">{sos.initiatedBy.phone}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" noWrap sx={{ maxWidth: 200 }}>
                          {sos.location.address || 'Location available'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption">{timeSince(sos.createdAt)}</Typography>
                      </Box>
                    </Box>

                    {sos.booking && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        Related Booking: {sos.booking.bookingNumber} ({sos.booking.serviceCategory})
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<ResolveIcon />}
                        onClick={() => handleResolve(sos)}
                      >
                        Resolve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        startIcon={<EscalateIcon />}
                      >
                        Escalate
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        onClick={() => handleView(sos)}
                      >
                        Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* All Alerts Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            All Alerts History
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Booking</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sosAlerts.map((sos) => (
                  <TableRow key={sos._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {sos.initiatedBy.name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{sos.initiatedBy.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sos.initiatedBy.userType}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{sos.reason}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sos.priority}
                        size="small"
                        color={getPriorityColor(sos.priority) as 'error' | 'warning' | 'info' | 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {sos.booking ? (
                        <Typography variant="body2">{sos.booking.bookingNumber}</Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{timeSince(sos.createdAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sos.status}
                        size="small"
                        color={getStatusColor(sos.status) as 'error' | 'warning' | 'success' | 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleView(sos)}>
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>SOS Alert Details</DialogTitle>
        <DialogContent>
          {selectedSOS && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip label={selectedSOS.priority} color={getPriorityColor(selectedSOS.priority) as 'error' | 'warning' | 'info' | 'default'} />
                    <Chip label={selectedSOS.status} color={getStatusColor(selectedSOS.status) as 'error' | 'warning' | 'success' | 'default'} />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary">Reporter</Typography>
                  <Typography variant="body2">{selectedSOS.initiatedBy.name} ({selectedSOS.initiatedBy.userType})</Typography>
                  <Typography variant="caption">{selectedSOS.initiatedBy.phone}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary">Reason</Typography>
                  <Typography variant="body2">{selectedSOS.reason}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography variant="body2">{selectedSOS.description}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                  <Typography variant="body2">{selectedSOS.location.address || 'Coordinates available'}</Typography>
                </Grid>
                {selectedSOS.booking && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="text.secondary">Related Booking</Typography>
                    <Typography variant="body2">{selectedSOS.booking.bookingNumber}</Typography>
                  </Grid>
                )}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary">Reported At</Typography>
                  <Typography variant="body2">{new Date(selectedSOS.createdAt).toLocaleString()}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedSOS?.status === 'ACTIVE' && (
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                setViewDialogOpen(false);
                handleResolve(selectedSOS);
              }}
            >
              Resolve
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve SOS Alert</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Resolution Action"
              value={resolution.action}
              onChange={(e) => setResolution({ ...resolution, action: e.target.value })}
              sx={{ mb: 2 }}
              placeholder="e.g., Contacted both parties, issue resolved"
            />
            <TextField
              fullWidth
              label="Notes"
              value={resolution.notes}
              onChange={(e) => setResolution({ ...resolution, notes: e.target.value })}
              multiline
              rows={3}
              placeholder="Additional notes about the resolution..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmitResolution}
            disabled={!resolution.action}
          >
            Resolve Alert
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
