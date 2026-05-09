import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import EmptyState from '../components/EmptyState';
import ReceiptBlock from '../components/ReceiptBlock';
import { IconSearch, IconX } from '../components/Icons';
import { getSettings } from '../services/settingsService';
import { formatCurrency } from '../utils/currencyUtils';
import { formatArabicMonth } from '../utils/dateUtils';
import { isFirebaseConfigured } from '../firebase/demoMode';
import demoData from '../firebase/demoStore';

function buildSearchIndex() {
  if (!isFirebaseConfigured) {
    return demoData.receipts.map(r => {
      const customer = demoData.customers.find(c => c.id === r.customer_id);
      const contract = demoData.contracts.find(c => c.id === r.contract_id);
      return {
        receipt: r,
        customer: customer ? { id: customer.id, ...customer } : null,
        contract: contract ? { id: contract.id, ...contract } : null,
        searchText: [
          r.receipt_number,
          r.customer_name,
          customer?.full_name,
          customer?.phone,
          customer?.village,
          contract?.product_name,
        ].filter(Boolean).join(' ').toLowerCase(),
      };
    });
  }
  return [];
}

export default function ReceiptsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [allReceipts, setAllReceipts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [previewId, setPreviewId] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const s = await getSettings();
      setSettings(s);
      const indexed = buildSearchIndex();
      setAllReceipts(indexed);
      setFiltered(indexed);
      setLoading(false);
    }
    init();
  }, []);

  const handleSearch = useCallback((term) => {
    const lower = term.trim().toLowerCase();
    if (!lower) {
      setFiltered(allReceipts);
      return;
    }
    setFiltered(allReceipts.filter(item => item.searchText.includes(lower)));
  }, [allReceipts]);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchTerm), 150);
    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch]);

  const handleReprint = (item) => {
    const receiptWithCustomer = {
      ...item.receipt,
      customer: item.customer,
      contract: item.contract,
    };
    navigate('/print', { state: { receipts: [receiptWithCustomer] } });
  };

  const togglePreview = (id) => {
    setPreviewId(prev => prev === id ? null : id);
  };

  if (loading) {
    return (
      <AppShell>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">الإيصالات</h1>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-24 animate-pulse">
              <div className="bg-gray-200 rounded h-6 w-1/3 mb-2"></div>
              <div className="bg-gray-200 rounded h-5 w-1/2"></div>
            </div>
          ))}
        </div>
      </AppShell>
    );
  }

  const totalCount = filtered.length;

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">الإيصالات</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 sticky top-0 z-10">
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث برقم الإيصال، اسم العميل، الهاتف، القرية، المنتج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pr-12 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            dir="rtl"
          />
          <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <IconX className="w-4 h-4" />
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-base text-gray-500 mt-2">
            {totalCount} نتيجة {totalCount !== allReceipts.length && `من ${allReceipts.length}`}
          </p>
        )}
      </div>

      {allReceipts.length === 0 && (
        <EmptyState
          icon="📄"
          message="لم يتم إنشاء إيصالات بعد"
          actionLabel="الذهاب للتحصيل"
          onAction={() => navigate('/collection')}
        />
      )}

      {allReceipts.length > 0 && totalCount === 0 && searchTerm && (
        <EmptyState
          icon="🔍"
          message="لم يتم العثور على إيصالات مطابقة"
        />
      )}

      <div className="space-y-3">
        {filtered.map((item) => {
          const isPreview = previewId === item.receipt.id;
          return (
            <div key={item.receipt.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all">
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => togglePreview(item.receipt.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg" dir="ltr">
                        {item.receipt.receipt_number}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      <span className="text-lg font-semibold text-gray-800">{item.customer?.full_name || '-'}</span>
                      {item.customer?.village && (
                        <span className="text-base text-gray-500">{item.customer.village}</span>
                      )}
                      {item.contract?.product_name && (
                        <span className="text-base text-gray-500">{item.contract.product_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-left flex flex-col items-end gap-1">
                    <p className="text-xl font-bold text-green-600">{formatCurrency(item.receipt.amount)}</p>
                    <p className="text-base text-gray-500">{formatArabicMonth(item.receipt.month, item.receipt.year)}</p>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isPreview ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {isPreview && (
                <div className="border-t border-gray-200">
                  <div className="p-4 bg-gray-50">
                    <div className="max-w-md mx-auto border border-gray-300 rounded-lg bg-white shadow-sm">
                      <ReceiptBlock
                        receipt={item.receipt}
                        customer={item.customer}
                        contract={item.contract}
                        shopName={settings?.shop_name || ''}
                        showLogo={settings?.show_logo ?? true}
                        logoUrl={settings?.logo_url || ''}
                      />
                    </div>
                  </div>
                  <div className="px-4 pb-4 flex gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReprint(item); }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-3 rounded-lg transition-colors min-h-[44px]"
                    >
                      إعادة الطباعة
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewId(null); }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 text-lg rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
