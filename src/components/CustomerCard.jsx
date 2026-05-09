export default function CustomerCard({ customer, onClick }) {
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
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{customer.full_name}</h3>
            <p className="text-lg text-gray-600 dark:text-gray-300" dir="ltr">{customer.phone}</p>
            <p className="text-base text-gray-500 dark:text-gray-400 mt-1">{customer.village}</p>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </div>
    </div>
  );
}
