export default function StatusBadge({ status }) {
  const config = {
    pending: { label: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-800' },
    paid: { label: 'مدفوع', className: 'bg-green-100 text-green-800' },
    late: { label: 'متأخر', className: 'bg-red-100 text-red-800' },
    active: { label: 'نشط', className: 'bg-green-100 text-green-800' },
    completed: { label: 'مكتمل', className: 'bg-gray-100 text-gray-600' },
    issued: { label: 'صادر', className: 'bg-blue-100 text-blue-800' },
  };

  const { label, className } = config[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${className}`}>
      {label}
    </span>
  );
}
