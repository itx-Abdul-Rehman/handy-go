import { useState } from 'react';
import { exportToCsv, bookingColumns } from '../utils/exportCsv';
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
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Grid,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '../services';

interface Booking {
  _id: string;
  bookingNumber: string;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  worker?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  serviceCategory: string;
  problemDescription: string;
  address: {
    full: string;
    city: string;
  };
  scheduledDateTime: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  pricing: {
    estimatedPrice: number;
    finalPrice?: number;
  };
  timeline: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
  createdAt: string;
}

const statusSteps = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];

export default function BookingsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { data: bookingsData, isLoading, refetch } = useQuery({
    queryKey: ['bookings', tabValue, page, rowsPerPage, searchQuery, categoryFilter],
    queryFn: () => bookingsApi.getBookings({
      page: page + 1,
      limit: rowsPerPage,
      status: tabValue > 0 ? getStatusFromTab(tabValue) : undefined,
      serviceCategory: categoryFilter || undefined,
    }),
    select: (res) => res,
  });

  const { data: statusCounts } = useQuery({
    queryKey: ['booking-status-counts'],
    queryFn: () => bookingsApi.getBookingStatusCounts(),
  });

  const bookings = bookingsData?.bookings || [];
  const totalBookings = bookingsData?.total || 0;

  const getStatusFromTab = (tab: number) => {
    const statuses = ['', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    return statuses[tab];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ACCEPTED':
        return 'info';
      case 'IN_PROGRESS':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getActiveStep = (status: string) => {
    if (status === 'CANCELLED') return -1;
    return statusSteps.indexOf(status);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, booking: Booking) => {
    setAnchorEl(event.currentTarget);
    setSelectedBooking(booking);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewBooking = () => {
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer.lastName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      tabValue === 0 ||
      booking.status === getStatusFromTab(tabValue);

    const matchesCategory =
      !categoryFilter || booking.serviceCategory === categoryFilter;

    return matchesSearch && matchesTab && matchesCategory;
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Bookings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and track all service bookings
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportToCsv('bookings', bookingColumns, filteredBookings)}>
          Export
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight={600} color="primary">
                {statusCounts?.total ?? totalBookings}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight={600} color="warning.main">
                {statusCounts?.pending ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight={600} color="info.main">
                {statusCounts?.inProgress ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight={600} color="success.main">
                {statusCounts?.completed ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight={600} color="error.main">
                {statusCounts?.cancelled ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cancelled
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Card */}
      <Card>
        <CardContent>
          {/* Tabs */}
          <Tabs value={tabValue} onChange={(_e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
            <Tab label="All" />
            <Tab label="Pending" />
            <Tab label="Accepted" />
            <Tab label="In Progress" />
            <Tab label="Completed" />
            <Tab label="Cancelled" />
          </Tabs>

          {/* Search & Filter */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              placeholder="Search by booking # or customer..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="PLUMBING">Plumbing</MenuItem>
                <MenuItem value="ELECTRICAL">Electrical</MenuItem>
                <MenuItem value="CLEANING">Cleaning</MenuItem>
                <MenuItem value="AC_REPAIR">AC Repair</MenuItem>
                <MenuItem value="CARPENTER">Carpenter</MenuItem>
                <MenuItem value="PAINTING">Painting</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" startIcon={<FilterIcon />}>
              More Filters
            </Button>
          </Box>

          {/* Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Booking #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Service</TableCell>
                  <TableCell>Worker</TableCell>
                  <TableCell>Scheduled</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {booking.bookingNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {booking.customer.firstName} {booking.customer.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {booking.customer.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={booking.serviceCategory.replace('_', ' ')}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {booking.worker ? (
                        <>
                          <Typography variant="body2">
                            {booking.worker.firstName} {booking.worker.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {booking.worker.phone}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Not assigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(booking.scheduledDateTime).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(booking.scheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        Rs. {(booking.pricing.finalPrice || booking.pricing.estimatedPrice).toLocaleString()}
                      </Typography>
                      {booking.pricing.finalPrice && booking.pricing.finalPrice !== booking.pricing.estimatedPrice && (
                        <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                          Rs. {booking.pricing.estimatedPrice.toLocaleString()}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={booking.status.replace('_', ' ')}
                        size="small"
                        color={getStatusColor(booking.status) as 'warning' | 'info' | 'primary' | 'success' | 'error' | 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={(e) => handleMenuOpen(e, booking)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalBookings}
            page={page}
            onPageChange={(_e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </CardContent>
      </Card>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleViewBooking}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        {selectedBooking?.status !== 'COMPLETED' && selectedBooking?.status !== 'CANCELLED' && (
          <MenuItem onClick={handleMenuClose}>
            <CancelIcon sx={{ mr: 1 }} fontSize="small" color="error" />
            Cancel Booking
          </MenuItem>
        )}
      </Menu>

      {/* View Booking Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Booking Details - {selectedBooking?.bookingNumber}
        </DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Box sx={{ mt: 2 }}>
              {/* Status Stepper */}
              {selectedBooking.status !== 'CANCELLED' ? (
                <Stepper activeStep={getActiveStep(selectedBooking.status)} sx={{ mb: 4 }}>
                  {statusSteps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label.replace('_', ' ')}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              ) : (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                  <Typography color="error.dark" fontWeight={600}>
                    This booking was cancelled
                  </Typography>
                </Box>
              )}

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Service Details
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Category: {selectedBooking.serviceCategory.replace('_', ' ')}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Problem: {selectedBooking.problemDescription}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Location: {selectedBooking.address.full}, {selectedBooking.address.city}
                  </Typography>
                  <Typography variant="body2">
                    Scheduled: {new Date(selectedBooking.scheduledDateTime).toLocaleString()}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Pricing
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Estimated: Rs. {selectedBooking.pricing.estimatedPrice.toLocaleString()}
                  </Typography>
                  {selectedBooking.pricing.finalPrice && (
                    <Typography variant="body2" fontWeight={600}>
                      Final: Rs. {selectedBooking.pricing.finalPrice.toLocaleString()}
                    </Typography>
                  )}
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Customer
                  </Typography>
                  <Typography variant="body2">
                    {selectedBooking.customer.firstName} {selectedBooking.customer.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedBooking.customer.phone}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Worker
                  </Typography>
                  {selectedBooking.worker ? (
                    <>
                      <Typography variant="body2">
                        {selectedBooking.worker.firstName} {selectedBooking.worker.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedBooking.worker.phone}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Not assigned yet
                    </Typography>
                  )}
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Timeline
                  </Typography>
                  {selectedBooking.timeline.map((event, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        gap: 2,
                        mb: 1,
                        p: 1,
                        bgcolor: 'grey.50',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="caption" sx={{ minWidth: 100 }}>
                        {new Date(event.timestamp).toLocaleString()}
                      </Typography>
                      <Chip
                        label={event.status.replace('_', ' ')}
                        size="small"
                        color={getStatusColor(event.status) as 'warning' | 'info' | 'primary' | 'success' | 'error' | 'default'}
                      />
                      {event.note && (
                        <Typography variant="caption" color="text.secondary">
                          {event.note}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
