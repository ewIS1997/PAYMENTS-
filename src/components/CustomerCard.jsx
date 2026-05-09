const STATUS_CONFIG = {
  late: { color: 'bg-red-500', ring: 'ring-red-200 dark:ring-red-800', label: 'متأخر' },
  pending: { color: 'bg-amber-400', ring: 'ring-amber-200 dark:ring-amber-800', label: 'قيد الانتظار' },
  clear: { color: 'bg-green-500', ring: 'ring-green-200 dark:ring-green-800', label: 'مُنتظم' },
};

export default function CustomerCard({ customer, status, onClick }) {
  const statusConfig = STATUS_CONFIG[status];

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      role="button"
      tabIndex={0}
      className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="relative">
            {customer.photo ? (
              <img 
                src={customer.photo} 
                alt={customer.full_name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-bold text-gray-500 dark:text-gray-400">
                {customer.full_name?.charAt(0) || '?'}
              </div>
            )}
            {statusConfig && (
              <span 
                className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${statusConfig.color} ring-2 ${statusConfig.ring}`}
                title={statusConfig.label}
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{customer.full_name}</h3>
              {statusConfig && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.color} text-white font-medium`}>
                  {statusConfig.label}
                </span>
              )}
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300" dir="ltr">{customer.phone}</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0 mt-1">
              <p className="text-base text-gray-500 dark:text-gray-400">{customer.village}</p>
              {customer.national_id && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <p className="text-base text-blue-600 dark:text-blue-400" dir="ltr">بطاقة: {customer.national_id}</p>
                </>
              )}
            </div>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </div>
    </div>
  );
}
