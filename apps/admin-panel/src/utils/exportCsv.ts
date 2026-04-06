/**
 * CSV Export Utility
 * Generates CSV from data array and triggers browser download.
 * No external dependencies required.
 */

interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number | boolean | null | undefined;
}

/**
 * Export an array of objects to a CSV file and trigger download.
 *
 * @param filename - Name of the downloaded file (without .csv extension)
 * @param columns - Column definitions with header label and accessor function
 * @param data - Array of data rows
 */
export function exportToCsv<T>(
  filename: string,
  columns: ExportColumn<T>[],
  data: T[]
): void {
  if (data.length === 0) {
    alert('No data to export.');
    return;
  }

  const headers = columns.map((col) => escapeCsvField(col.header));
  const rows = data.map((row) =>
    columns.map((col) => escapeCsvField(String(col.accessor(row) ?? ''))).join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${formatDate(new Date())}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

// ─── Pre-built column configs for common entities ───────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const bookingColumns: ExportColumn<any>[] = [
  { header: 'Booking ID', accessor: (b) => b.$id || b.bookingNumber || '' },
  { header: 'Status', accessor: (b) => b.status || '' },
  { header: 'Service', accessor: (b) => b.serviceCategory || '' },
  { header: 'Customer', accessor: (b) => b.customerName || b.customer || '' },
  { header: 'Worker', accessor: (b) => b.workerName || b.worker || '' },
  { header: 'Scheduled Date', accessor: (b) => b.scheduledDateTime || '' },
  { header: 'Estimated Price', accessor: (b) => b.estimatedPrice ?? b.pricing?.estimatedPrice ?? '' },
  { header: 'Final Price', accessor: (b) => b.finalPrice ?? b.pricing?.finalPrice ?? '' },
  { header: 'Payment Method', accessor: (b) => b.paymentMethod ?? b.payment?.method ?? '' },
  { header: 'Payment Status', accessor: (b) => b.paymentStatus ?? b.payment?.status ?? '' },
  { header: 'City', accessor: (b) => b.city ?? b.address?.city ?? '' },
  { header: 'Created At', accessor: (b) => b.$createdAt || b.createdAt || '' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const workerColumns: ExportColumn<any>[] = [
  { header: 'Worker ID', accessor: (w) => w.$id || '' },
  { header: 'Name', accessor: (w) => `${w.firstName || ''} ${w.lastName || ''}`.trim() },
  { header: 'Email', accessor: (w) => w.email || '' },
  { header: 'Phone', accessor: (w) => w.phone || '' },
  { header: 'CNIC', accessor: (w) => w.cnic || '' },
  { header: 'Status', accessor: (w) => w.status || '' },
  { header: 'Rating', accessor: (w) => w.rating?.average ?? w.averageRating ?? '' },
  { header: 'Trust Score', accessor: (w) => w.trustScore ?? '' },
  { header: 'Jobs Completed', accessor: (w) => w.totalJobsCompleted ?? '' },
  { header: 'Skills', accessor: (w) => Array.isArray(w.skills) ? w.skills.map((s: { category?: string }) => s.category).join('; ') : '' },
  { header: 'Verified', accessor: (w) => w.cnicVerified ? 'Yes' : 'No' },
  { header: 'Created At', accessor: (w) => w.$createdAt || w.createdAt || '' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const customerColumns: ExportColumn<any>[] = [
  { header: 'Customer ID', accessor: (c) => c.$id || '' },
  { header: 'Name', accessor: (c) => `${c.firstName || ''} ${c.lastName || ''}`.trim() },
  { header: 'Email', accessor: (c) => c.email || '' },
  { header: 'Phone', accessor: (c) => c.phone || '' },
  { header: 'Total Bookings', accessor: (c) => c.totalBookings ?? '' },
  { header: 'Language', accessor: (c) => c.preferredLanguage || '' },
  { header: 'Active', accessor: (c) => c.isActive ? 'Yes' : 'No' },
  { header: 'Created At', accessor: (c) => c.$createdAt || c.createdAt || '' },
];
