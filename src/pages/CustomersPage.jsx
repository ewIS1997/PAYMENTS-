import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import CustomerCard from '../components/CustomerCard';
import AddCustomerModal from '../components/AddCustomerModal';
import EmptyState from '../components/EmptyState';
import { IconSearch, IconX, IconPlus } from '../components/Icons';
import { useCustomers } from '../hooks/useCustomers';

export default function CustomersPage() {
  const navigate = useNavigate();
  const { customers, villages, loading, error, refresh } = useCustomers();
  const [search, setSearch] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const existingPhones = useMemo(() => {
    const map = {};
    customers.forEach(c => {
      if (c.phone) map[c.phone] = c.full_name;
    });
    return map;
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return customers.filter(customer => {
      const matchesVillage = !selectedVillage || customer.village === selectedVillage;
      if (!term) return matchesVillage;

      const fields = [
        customer.full_name,
        customer.phone,
        customer.village,
        customer.address,
        customer.national_id,
        customer.id,
      ];

      const matchesSearch = fields.some(field =>
        field && String(field).toLowerCase().includes(term)
      );

      return matchesSearch && matchesVillage;
    });
  }, [customers, search, selectedVillage]);

  const activeFiltersCount = (selectedVillage ? 1 : 0) + (search.trim() ? 1 : 0);

  const clearAll = () => {
    setSearch('');
    setSelectedVillage('');
  };

  const handleCustomerCreated = useCallback((customer) => {
    refresh().then(() => navigate(`/customers/${customer.id}`));
  }, [refresh, navigate]);

  if (loading) {
    return (
      <AppShell>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">العملاء</h1>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-24 animate-pulse">
              <div className="bg-gray-200 rounded h-6 w-3/4 mb-2"></div>
              <div className="bg-gray-200 rounded h-5 w-1/2"></div>
            </div>
          ))}
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">العملاء</h1>
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-lg mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={refresh} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-base font-semibold min-h-[44px]">
            إعادة المحاولة
          </button>
        </div>
      </AppShell>
    );
  }

  if (customers.length === 0) {
    return (
      <AppShell>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">العملاء</h1>
        <EmptyState
          icon="👥"
          message="لا يوجد عملاء بعد"
          actionLabel="أضف أول عميل"
          onAction={() => setShowAddModal(true)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">العملاء</h1>

      <div className="space-y-4 mb-6">
        <div className="relative">
          <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="ابحث بالاسم، الهاتف، القرية، العنوان، الرقم القومي..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 pr-10 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <IconX className="w-4 h-4" />
            </button>
          )}
        </div>

        {villages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedVillage('')}
              className={`px-4 py-2 rounded-full text-base whitespace-nowrap transition-colors min-h-[40px] ${
                !selectedVillage
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              الكل
            </button>
            {villages.map(village => (
              <button
                key={village}
                onClick={() => setSelectedVillage(village)}
                className={`px-4 py-2 rounded-full text-base whitespace-nowrap transition-colors min-h-[40px] ${
                  selectedVillage === village
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {village}
              </button>
            ))}
          </div>
        )}

        {activeFiltersCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-base text-gray-500">
              {filteredCustomers.length} نتيجة {filteredCustomers.length !== customers.length && `من ${customers.length}`}
            </span>
            <button
              onClick={clearAll}
              className="text-base text-blue-600 hover:underline"
            >
              مسح الفلاتر
            </button>
          </div>
        )}
      </div>

      {filteredCustomers.length === 0 ? (
        <EmptyState
          icon="🔍"
          message="لا توجد نتائج مطابقة للبحث"
        />
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map(customer => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onClick={() => navigate(`/customers/${customer.id}`)}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-28 left-4 md:left-auto md:left-8 md:bottom-8 bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors z-40"
        aria-label="إضافة عميل"
      >
        <IconPlus className="w-7 h-7" />
      </button>

      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        villages={villages}
        existingPhones={existingPhones}
        onCreated={handleCustomerCreated}
      />
    </AppShell>
  );
}
