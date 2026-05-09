export default function CustomerCard({ customer, onClick }) {
  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      role="button"
      tabIndex={0}
      className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">{customer.full_name}</h3>
          <p className="text-lg text-gray-600" dir="ltr">{customer.phone}</p>
          <p className="text-base text-gray-500 mt-1">{customer.village}</p>
        </div>
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </div>
    </div>
  );
}
