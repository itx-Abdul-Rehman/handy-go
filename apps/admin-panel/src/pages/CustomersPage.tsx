import { useState } from 'react';
import { exportToCsv, customerColumns } from '../utils/exportCsv';
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
  Avatar,
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
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../services';

interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  phone: string;
  email?: string;
  addresses: Array<{
    label: string;
    address: string;
    city: string;
    isDefault: boolean;
  }>;
  totalBookings: number;
  isActive: boolean;
  createdAt: string;
}

export default function CustomersPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { data: customersData, isLoading, refetch } = useQuery({
    queryKey: ['customers', page, rowsPerPage, searchQuery],
    queryFn: () => usersApi.getCustomers({
      page: page + 1,
      limit: rowsPerPage,
      search: searchQuery,
    }),
    select: (res) => res,
  });

  const { data: customerStats } = useQuery({
    queryKey: ['customer-stats'],
    queryFn: () => usersApi.getCustomerStats(),
  });

  const customers = customersData?.customers || [];
  const totalCustomers = customersData?.total || 0;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, customer: Customer) => {
    setAnchorEl(event.currentTarget);
    setSelectedCustomer(customer);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewCustomer = () => {
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleToggleStatus = async () => {
    if (selectedCustomer) {
      try {
        await usersApi.updateUserStatus(selectedCustomer._id, {
          isActive: !selectedCustomer.isActive,
          reason: selectedCustomer.isActive ? 'Deactivated by admin' : 'Activated by admin',
        });
        refetch();
      } catch (error) {
        console.error('Failed to update customer status:', error);
      }
    }
    handleMenuClose();
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Customers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage customer accounts
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportToCsv('customers', customerColumns, filteredCustomers)}>
          Export
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight={600} color="primary">
                {customerStats?.total ?? totalCustomers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Customers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight={600} color="success.main">
                {customerStats?.active ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight={600} color="info.main">
                {customerStats?.totalBookings ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Bookings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" fontWeight={600} color="warning.main">
                {customerStats?.newThisMonth ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                New This Month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Card */}
      <Card>
        <CardContent>
          {/* Search & Filter */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              placeholder="Search customers..."
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
            <Button variant="outlined" startIcon={<FilterIcon />}>
              Filters
            </Button>
          </Box>

          {/* Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Bookings</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={customer.profileImage}>
                          {customer.firstName[0]}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>
                          {customer.firstName} {customer.lastName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{customer.phone}</Typography>
                      {customer.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {customer.email}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.addresses.length > 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {customer.addresses.find((a: { isDefault: boolean; city: string }) => a.isDefault)?.city || customer.addresses[0].city}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No address
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {customer.totalBookings}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={customer.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={customer.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={(e) => handleMenuOpen(e, customer)}>
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
            count={totalCustomers}
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
        <MenuItem onClick={handleViewCustomer}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={handleToggleStatus}>
          {selectedCustomer?.isActive ? (
            <>
              <BlockIcon sx={{ mr: 1 }} fontSize="small" color="error" />
              Deactivate
            </>
          ) : (
            <>
              <ActivateIcon sx={{ mr: 1 }} fontSize="small" color="success" />
              Activate
            </>
          )}
        </MenuItem>
      </Menu>

      {/* View Customer Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Customer Details</DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    src={selectedCustomer.profileImage}
                    sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                  >
                    {selectedCustomer.firstName[0]}
                  </Avatar>
                  <Typography variant="h6">
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </Typography>
                  <Chip
                    label={selectedCustomer.isActive ? 'Active' : 'Inactive'}
                    color={selectedCustomer.isActive ? 'success' : 'default'}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Contact Information
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Phone: {selectedCustomer.phone}
                </Typography>
                {selectedCustomer.email && (
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Email: {selectedCustomer.email}
                  </Typography>
                )}

                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 3 }}>
                  Saved Addresses
                </Typography>
                {selectedCustomer.addresses.length > 0 ? (
                  selectedCustomer.addresses.map((addr, idx) => (
                    <Box key={idx} sx={{ mb: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {addr.label} {addr.isDefault && '(Default)'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {addr.address}, {addr.city}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No addresses saved
                  </Typography>
                )}

                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 3 }}>
                  Activity
                </Typography>
                <Typography variant="body2">
                  Total Bookings: {selectedCustomer.totalBookings}
                </Typography>
                <Typography variant="body2">
                  Member Since: {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
