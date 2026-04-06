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
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Grid,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  AccountBalanceWallet as WalletIcon,
  Receipt as ReceiptIcon,
  TrendingUp as RevenueIcon,
  ArrowDownward as WithdrawalIcon,
  Replay as RefundIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../services';

// ─── Types ──────────────────────────────────────────────────
interface Transaction {
  _id: string;
  userId: string;
  type: string;
  amount: number;
  status: string;
  bookingId: string | null;
  paymentMethod: string | null;
  description: string;
  gatewayReference: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Tab → type filter mapping ──────────────────────────────
const TAB_TYPES = ['', 'TOP_UP', 'BOOKING_DEBIT', 'EARNING', 'WITHDRAWAL', 'REFUND'] as const;
const TAB_LABELS = ['All', 'Top-ups', 'Payments', 'Earnings', 'Withdrawals', 'Refunds'] as const;

// ─── Helpers ────────────────────────────────────────────────
const typeLabel = (type: string) => {
  const map: Record<string, string> = {
    TOP_UP: 'Top Up',
    BOOKING_DEBIT: 'Payment',
    BOOKING_CASH: 'Cash Payment',
    EARNING: 'Earning',
    WITHDRAWAL: 'Withdrawal',
    PLATFORM_FEE: 'Platform Fee',
    REFUND: 'Refund',
  };
  return map[type] ?? type.replace(/_/g, ' ');
};

const typeColor = (type: string): 'success' | 'error' | 'info' | 'warning' | 'primary' | 'default' => {
  switch (type) {
    case 'TOP_UP':
    case 'EARNING':
      return 'success';
    case 'BOOKING_DEBIT':
    case 'PLATFORM_FEE':
      return 'primary';
    case 'WITHDRAWAL':
      return 'warning';
    case 'REFUND':
      return 'info';
    default:
      return 'default';
  }
};

const statusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'FAILED':
    case 'REVERSED':
      return 'error';
    case 'PENDING':
      return 'warning';
    default:
      return 'default';
  }
};

const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;

// ─── Component ──────────────────────────────────────────────
export default function PaymentsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ── Stats query ──
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['payment-stats'],
    queryFn: () => paymentsApi.getTransactionStats(),
  });

  // ── Transactions query ──
  const { data: txnData, isLoading: txnLoading } = useQuery({
    queryKey: ['transactions', tabValue, page, rowsPerPage, searchQuery, statusFilter],
    queryFn: () =>
      paymentsApi.getTransactions({
        page: page + 1,
        limit: rowsPerPage,
        type: TAB_TYPES[tabValue] || undefined,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      }),
    select: (res) => res,
  });

  const transactions: Transaction[] = txnData?.transactions ?? [];
  const totalCount = txnData?.total ?? 0;

  const handleRowClick = (txn: Transaction) => {
    setSelectedTxn(txn);
    setDetailOpen(true);
  };

  // ── Render ──
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Payments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor transactions, wallets, and platform revenue
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          disabled={transactions.length === 0}
          onClick={() => {
            /* TODO: CSV export for transactions */
          }}
        >
          Export
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Total Transactions',
            value: stats?.total ?? '—',
            icon: <ReceiptIcon />,
            color: 'primary.main',
          },
          {
            label: 'Top-ups',
            value: stats?.topUps ?? '—',
            icon: <WalletIcon />,
            color: 'success.main',
          },
          {
            label: 'Withdrawals',
            value: stats?.withdrawals ?? '—',
            icon: <WithdrawalIcon />,
            color: 'warning.main',
          },
          {
            label: 'Refunds',
            value: stats?.refunds ?? '—',
            icon: <RefundIcon />,
            color: 'info.main',
          },
          {
            label: 'Platform Revenue',
            value: stats ? formatCurrency(stats.totalRevenue) : '—',
            icon: <RevenueIcon />,
            color: 'secondary.main',
          },
        ].map((card) => (
          <Grid size={{ xs: 6, sm: 2.4 }} key={card.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                {statsLoading ? (
                  <Skeleton width={60} height={32} sx={{ mx: 'auto' }} />
                ) : (
                  <Typography variant="h5" fontWeight={600} color={card.color}>
                    {card.value}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {card.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Card */}
      <Card>
        <CardContent>
          {/* Tabs */}
          <Tabs
            value={tabValue}
            onChange={(_e, v) => {
              setTabValue(v);
              setPage(0);
            }}
            sx={{ mb: 2 }}
          >
            {TAB_LABELS.map((label) => (
              <Tab key={label} label={label} />
            ))}
          </Tabs>

          {/* Search & Filter */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              placeholder="Search by description..."
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
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="REVERSED">Reversed</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Booking</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {txnLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : transactions.map((txn) => (
                      <TableRow
                        key={txn._id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleRowClick(txn)}
                      >
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(txn.createdAt).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(txn.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={typeLabel(txn.type)}
                            size="small"
                            color={typeColor(txn.type)}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                            {txn.userId.slice(0, 8)}…
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {txn.description || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color={
                              ['TOP_UP', 'EARNING', 'REFUND'].includes(txn.type)
                                ? 'success.main'
                                : 'text.primary'
                            }
                          >
                            {['TOP_UP', 'EARNING', 'REFUND'].includes(txn.type) ? '+' : '-'}
                            {formatCurrency(txn.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {txn.paymentMethod?.replace(/_/g, ' ').toLowerCase() ?? '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={txn.status}
                            size="small"
                            color={statusColor(txn.status)}
                          />
                        </TableCell>
                        <TableCell>
                          {txn.bookingId ? (
                            <Typography
                              variant="caption"
                              sx={{ fontFamily: 'monospace' }}
                            >
                              {txn.bookingId.slice(0, 8)}…
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}

                {!txnLoading && transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No transactions found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalCount}
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

      {/* Transaction Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transaction Details</DialogTitle>
        <DialogContent>
          {selectedTxn && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Transaction ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {selectedTxn._id}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedTxn.createdAt).toLocaleString()}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Type
                  </Typography>
                  <Chip
                    label={typeLabel(selectedTxn.type)}
                    size="small"
                    color={typeColor(selectedTxn.type)}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedTxn.status}
                    size="small"
                    color={statusColor(selectedTxn.status)}
                  />
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Amount
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {formatCurrency(selectedTxn.amount)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Payment Method
                  </Typography>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {selectedTxn.paymentMethod?.replace(/_/g, ' ').toLowerCase() ?? 'N/A'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {selectedTxn.userId}
                  </Typography>
                </Grid>

                {selectedTxn.bookingId && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Booking ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {selectedTxn.bookingId}
                    </Typography>
                  </Grid>
                )}

                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {selectedTxn.description || 'No description'}
                  </Typography>
                </Grid>

                {selectedTxn.gatewayReference && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Gateway Reference
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {selectedTxn.gatewayReference}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
