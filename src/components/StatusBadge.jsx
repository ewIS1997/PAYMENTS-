export default function StatusBadge({ status, paidAmount, originalAmount }) {
  const config = {
    pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    paid: { label: 'مدفوع', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    late: { label: 'متأخر', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    partial: { label: 'مدفوع جزئي', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    active: { label: 'نشط', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    completed: { label: 'مكتمل', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
    issued: { label: 'صادر', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  };

  const { label, className } = config[status] || { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${className}`}>
      {status === 'partial' && paidAmount !== undefined && originalAmount !== undefined
        ? `${label} (${paidAmount}/${originalAmount})`
        : label}
    </span>
  );
}
