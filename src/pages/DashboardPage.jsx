import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { isSupabaseConfigured } from '../supabase/mode';
import { supabase } from '../supabase/client';
import demoData from '../demo/demoStore';
import { formatCurrency } from '../utils/currencyUtils';
import { formatLocalDateString } from '../utils/dateUtils';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    unpaidThisMonth: 0,
    collectedThisMonth: 0,
    lateCustomers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);

  useEffect(() => {
    async function fetchStats() {
      if (!isSupabaseConfigured) {
        setAllCustomers(demoData.customers.filter(c => !c.isdeleted));
        const now = new Date();
        const unpaid = demoData.installments.filter(i => {
          return (i.status === 'pending' || i.status === 'late') && i.due_date?.getMonth() === now.getMonth() && i.due_date?.getFullYear() === now.getFullYear();
        });
        const partial = demoData.installments.filter(i => {
          return i.status === 'partial' && i.due_date?.getMonth() === now.getMonth() && i.due_date?.getFullYear() === now.getFullYear();
        });
        const paid = demoData.installments.filter(i => i.status === 'paid');
        const activeCustomerIds = new Set(demoData.customers.filter(c => !c.isdeleted).map(c => c.id));
        const lateCustomerIds = new Set(
          demoData.installments
            .filter(i => i.status === 'late' && activeCustomerIds.has(i.customer_id))
            .map(i => i.customer_id)
        );
        const unpaidAmount = unpaid.reduce((s, i) => s + (i.amount || 0), 0);
        const partialRemaining = partial.reduce((s, i) => s + ((i.amount || 0) - (i.paid_amount || 0)), 0);
        const paidAmount = paid.reduce((s, i) => s + (i.amount || 0), 0);
        setStats({
          unpaidThisMonth: unpaidAmount + partialRemaining,
          collectedThisMonth: paidAmount + partial.reduce((s, i) => s + (i.paid_amount || 0), 0),
          lateCustomers: lateCustomerIds.size,
        });
        setLoading(false);
        return;
      }
      if (isSupabaseConfigured) {
        try {
          const now = new Date();
          const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
          const monthEnd = formatLocalDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));

          const [{ data: unpaid }, { data: paid }, { data: late }, { data: customers }] = await Promise.all([
            supabase.from('installments').select('amount').in('status', ['pending', 'late']).gte('due_date', monthStart).lte('due_date', monthEnd),
            supabase.from('installments').select('amount, payment_date').eq('status', 'paid').gte('payment_date', monthStart).lte('payment_date', monthEnd),
            supabase.from('installments').select('customer_id').eq('status', 'late'),
            supabase.from('customers').select('id, full_name, phone, village').eq('isdeleted', false),
          ]);

          const lateCustomerIds = new Set((late || []).map(i => i.customer_id));
          let collected = 0;
          (paid || []).forEach(i => { collected += i.amount || 0; });

          setAllCustomers(customers || []);
          setStats({
            unpaidThisMonth: (unpaid || []).reduce((s, i) => s + (i.amount || 0), 0),
            collectedThisMonth: collected,
            lateCustomers: lateCustomerIds.size,
          });
        } catch (err) {
          console.error('Error fetching dashboard stats:', err);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const term = searchTerm.trim().toLowerCase();
    const filtered = allCustomers.filter(c =>
      (c.full_name && c.full_name.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term))
    );
    setSearchResults(filtered);
  }, [searchTerm, allCustomers]);

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">الرئيسية</h1>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث عن عميل بالاسم أو رقم الهاتف"
          className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          dir="rtl"
        />
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map(c => (
              <button
                key={c.id}
                onClick={() => { setSearchTerm(''); navigate(`/customers/${c.id}`); }}
                className="w-full text-right px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg border border-gray-100 dark:border-gray-600 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">{c.full_name}</span>
                <span className="text-base text-gray-500 dark:text-gray-400 mr-3" dir="ltr">{c.phone}</span>
                <span className="text-base text-gray-500 dark:text-gray-400 mr-2">- {c.village}</span>
              </button>
            ))}
          </div>
        )}
        {searchTerm.trim() && searchResults.length === 0 && (
          <p className="text-lg text-gray-500 dark:text-gray-400 text-center py-3">لم يتم العثور على نتائج</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-6 text-center">
          <div className="text-5xl font-bold text-red-600 dark:text-red-400 mb-2">
            {loading ? '-' : formatCurrency(stats.unpaidThisMonth)}
          </div>
          <div className="text-xl text-red-700 dark:text-red-300">الأقساط غير المدفوعة هذا الشهر</div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-6 text-center">
          <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
            {loading ? '-' : formatCurrency(stats.collectedThisMonth)}
          </div>
          <div className="text-xl text-green-700 dark:text-green-300">إجمالي المحصّل هذا الشهر</div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-xl p-6 text-center">
          <div className="text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2">
            {loading ? '-' : stats.lateCustomers}
          </div>
          <div className="text-xl text-orange-700 dark:text-orange-300">عدد العملاء المتأخرين</div>
        </div>
      </div>

      <button
        onClick={() => navigate('/collection')}
        className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold py-4 rounded-lg transition-colors min-h-[44px]"
      >
        عرض تحصيل هذا الشهر
      </button>
    </AppShell>
  );
}
