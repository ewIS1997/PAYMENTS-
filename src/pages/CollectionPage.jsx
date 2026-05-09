import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import StatusBadge from '../components/StatusBadge';
import ConfirmationDialog from '../components/ConfirmationDialog';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { fetchInstallmentsForCollection, markInstallmentAsPaid, markInstallmentAsLate, bulkMarkInstallmentsAsPaid, undoMarkInstallmentAsPaid, recordPartialPayment, getAllVillages, getCustomerPaymentHistory } from '../services/collectionService';
import { generateReceipts } from '../services/receiptService';
import { getContract } from '../services/contractService';
import { getCustomer } from '../services/customerService';
import { formatCurrency } from '../utils/currencyUtils';
import { getArabicMonthName } from '../utils/dateUtils';

const FILTER_TABS = [
  { key: 'all', label: 'الكل' },
  { key: 'late', label: 'المتأخر فقط' },
  { key: 'pending', label: 'قيد الانتظار' },
];

const SORT_OPTIONS = [
  { key: 'amount', label: 'المبلغ' },
  { key: 'name', label: 'الاسم' },
  { key: 'late', label: 'عدد المتأخر' },
];

export default function CollectionPage() {
  const navigate = useNavigate();
  const today = new Date();
  const [villages, setVillages] = useState([]);
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [installments, setInstallments] = useState([]);
  const [customersMap, setCustomersMap] = useState({});
  const [contractsMap, setContractsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [generating, setGenerating] = useState(false);
  const [skippedCount, setSkippedCount] = useState(0);
  const [confirmPaid, setConfirmPaid] = useState(null);
  const [confirmBulkPaid, setConfirmBulkPaid] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [expandedCustomers, setExpandedCustomers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('amount');
  const [sortAsc, setSortAsc] = useState(false);
  const [filterTab, setFilterTab] = useState('all');
  const [justPaidIds, setJustPaidIds] = useState(new Set());
  const [partialPaymentModal, setPartialPaymentModal] = useState(null);
  const [partialAmount, setPartialAmount] = useState('');
  const [paymentHistoryModal, setPaymentHistoryModal] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);

  const toastTimerRef = useRef(null);
  const [toast, setToast] = useState(null);

  const clearToastTimer = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    async function loadVillages() {
      try {
        const v = await getAllVillages();
        setVillages(v);
      } catch (err) {
        console.error('Error loading villages:', err);
      }
    }
    loadVillages();
  }, []);

  useEffect(() => {
    if (selectedIds.size === 0 && justPaidIds.size === 0) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [selectedIds.size, justPaidIds.size]);

  const completePayment = useCallback((ids) => {
    setInstallments(prev => prev.filter(i => !ids.has(i.id)));
    setJustPaidIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
    setSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
    setToast(null);
  }, []);

  const showToast = useCallback((message, action) => {
    clearToastTimer();
    setToast({ message, action });
  }, [clearToastTimer]);

  const dismissToast = useCallback(() => {
    setToast(null);
    clearToastTimer();
  }, [clearToastTimer]);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    setSelectedIds(new Set());
    setSkippedCount(0);
    setSearchError(null);
    setExpandedCustomers(new Set());
    setJustPaidIds(new Set());
    setToast(null);
    clearToastTimer();
    try {
      const results = await fetchInstallmentsForCollection(selectedVillage, selectedMonth, selectedYear);
      setInstallments(results);

      const cMap = {};
      const ctMap = {};
      const uniqueCustomerIds = [...new Set(results.map(i => i.customer_id))];
      for (const cid of uniqueCustomerIds) {
        try {
          const cust = await getCustomer(cid);
          if (cust) cMap[cid] = cust;
        } catch (err) {
          console.error('Error fetching customer:', err);
        }
      }
      const uniqueContractIds = [...new Set(results.map(i => i.contract_id))];
      for (const contractId of uniqueContractIds) {
        try {
          const contract = await getContract(contractId);
          if (contract) ctMap[contractId] = contract;
        } catch (err) {
          console.error('Error fetching contract:', err);
        }
      }
      setCustomersMap(cMap);
      setContractsMap(ctMap);

      const allCustomerIds = [...new Set(results.map(i => i.customer_id))];
      setExpandedCustomers(new Set(allCustomerIds));
    } catch (err) {
      console.error('Error fetching installments:', err);
      setSearchError('حدث خطأ أثناء البحث');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (inst) => {
    setActionLoading(inst.id);
    try {
      await markInstallmentAsPaid(inst.id);
      setInstallments(prev => prev.map(i => i.id === inst.id ? { ...i, status: 'paid', payment_date: new Date(), carryover_from_partial: null } : i));
      setJustPaidIds(prev => new Set(prev).add(inst.id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(inst.id);
        return next;
      });

      showToast('تم دفع القسط بنجاح', {
        label: 'تراجع',
        onClick: () => handleUndoPaid(inst.id),
      });
    } catch (err) {
      console.error('Error marking as paid:', err);
    } finally {
      setActionLoading(null);
      setConfirmPaid(null);
    }
  };

  const handleUndoPaid = async (id) => {
    clearToastTimer();
    try {
      await undoMarkInstallmentAsPaid(id);
      setInstallments(prev => prev.map(i => i.id === id ? { ...i, status: 'pending', payment_date: null, paid_amount: null, carryover_from_partial: null } : i));
      setJustPaidIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setToast(null);
    } catch (err) {
      console.error('Error undoing payment:', err);
    }
  };

  const handlePartialPayment = async () => {
    if (!partialPaymentModal || !partialAmount) return;
    const amount = parseFloat(partialAmount);
    if (isNaN(amount) || amount <= 0 || amount > partialPaymentModal.amount) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    const isFullPayment = amount === partialPaymentModal.amount;
    setActionLoading('partial');
    try {
      if (isFullPayment) {
        await markInstallmentAsPaid(partialPaymentModal.id);
        setInstallments(prev => prev.map(i => i.id === partialPaymentModal.id ? { ...i, status: 'paid', paid_amount: amount, payment_date: new Date() } : i));
        setJustPaidIds(prev => new Set(prev).add(partialPaymentModal.id));
        showToast(`تم دفع ${formatCurrency(amount)}`, {
          label: 'تراجع',
          onClick: () => handleUndoPaid(partialPaymentModal.id),
        });
      } else {
        await recordPartialPayment(partialPaymentModal.id, amount);
        const remaining = partialPaymentModal.amount - amount;
        setInstallments(prev => {
          const updated = prev.map(i => i.id === partialPaymentModal.id ? { ...i, status: 'partial', paid_amount: amount, payment_date: new Date() } : i);
          if (remaining > 0) {
            const nextIdx = updated.findIndex(i => 
              i.contract_id === partialPaymentModal.contract_id && 
              i.id !== partialPaymentModal.id &&
              i.due_date &&
              i.due_date.getTime() > (partialPaymentModal.due_date?.getTime() || 0) &&
              (i.status === 'pending' || i.status === 'late')
            );
            if (nextIdx >= 0) {
              const existingCarryover = updated[nextIdx].carryover_from_partial || 0;
              updated[nextIdx] = { 
                ...updated[nextIdx], 
                amount: updated[nextIdx].amount + remaining,
                carryover_from_partial: existingCarryover + remaining,
              };
            }
          }
          return updated;
        });
        setJustPaidIds(prev => new Set(prev).add(partialPaymentModal.id));
        showToast(`تم دفع ${formatCurrency(amount)} — باقي ${formatCurrency(remaining)}`, {
          label: 'تراجع',
          onClick: () => handleUndoPaid(partialPaymentModal.id),
        });
      }
    } catch (err) {
      console.error('Error recording partial payment:', err);
    } finally {
      setActionLoading(null);
      setPartialPaymentModal(null);
      setPartialAmount('');
    }
  };

  const handleShowPaymentHistory = async (customerId, customerName) => {
    setPaymentHistoryLoading(true);
    setPaymentHistoryModal({ customerId, customerName });
    try {
      const history = await getCustomerPaymentHistory(customerId);
      setPaymentHistory(history);
    } catch (err) {
      console.error('Error fetching payment history:', err);
    } finally {
      setPaymentHistoryLoading(false);
    }
  };

  const handleBulkMarkPaid = async () => {
    setActionLoading('bulk');
    try {
      const ids = Array.from(selectedIds);
      const count = await bulkMarkInstallmentsAsPaid(ids);
      setInstallments(prev => prev.map(i => ids.includes(i.id) ? { ...i, status: 'paid', payment_date: new Date(), carryover_from_partial: null } : i));
      setJustPaidIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.add(id));
        return next;
      });

      showToast(`تم دفع ${count} أقساط بنجاح`, {
        label: 'تراجع الكل',
        onClick: () => handleBulkUndoPaid(ids),
      });
    } catch (err) {
      console.error('Error bulk marking as paid:', err);
    } finally {
      setActionLoading(null);
      setConfirmBulkPaid(false);
      setSelectedIds(new Set());
    }
  };

  const handleBulkUndoPaid = async (ids) => {
    clearToastTimer();
    try {
      for (const id of ids) {
        await undoMarkInstallmentAsPaid(id);
      }
      setInstallments(prev => prev.map(i => ids.includes(i.id) ? { ...i, status: 'pending', payment_date: null, paid_amount: null, carryover_from_partial: null } : i));
      setJustPaidIds(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });
      setToast(null);
    } catch (err) {
      console.error('Error bulk undoing payment:', err);
    }
  };

  const handleMarkLate = async (inst) => {
    setActionLoading(inst.id);
    try {
      await markInstallmentAsLate(inst.id);
      setInstallments(prev => prev.map(i => i.id === inst.id ? { ...i, status: 'late' } : i));
    } catch (err) {
      console.error('Error marking as late:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectCustomer = (customerId) => {
    const customerInstIds = installments
      .filter(i => i.customer_id === customerId)
      .map(i => i.id);

    const allSelected = customerInstIds.every(id => selectedIds.has(id));

    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        customerInstIds.forEach(id => next.delete(id));
      } else {
        customerInstIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleIds = visibleInstallments.map(i => i.id);
    const allSelected = visibleIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        visibleIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        visibleIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const toggleExpand = (customerId) => {
    setExpandedCustomers(prev => {
      const next = new Set(prev);
      if (next.has(customerId)) next.delete(customerId);
      else next.add(customerId);
      return next;
    });
  };

  const handleGenerateReceipts = async () => {
    const selected = installments.filter(i => selectedIds.has(i.id));
    if (selected.length === 0) return;

    setGenerating(true);
    try {
      const result = await generateReceipts(selected, customersMap, contractsMap);
      setSkippedCount(result.alreadyReceipted.length);

      if (result.generated.length > 0) {
        navigate('/print', { state: { receipts: result.generated } });
      } else if (result.alreadyReceipted.length > 0) {
        alert('جميع الأقساط المحددة لديها إيصال بالفعل');
      }
    } catch (err) {
      console.error('Error generating receipts:', err);
    } finally {
      setGenerating(false);
    }
  };

  const customerGroups = useMemo(() => {
    const groups = {};
    installments.forEach(inst => {
      if (!groups[inst.customer_id]) {
        groups[inst.customer_id] = [];
      }
      groups[inst.customer_id].push(inst);
    });

    return Object.entries(groups).map(([customerId, insts]) => {
      const customer = customersMap[customerId] || {};
      const totalAmount = insts.reduce((sum, i) => sum + (i.amount || 0), 0);
      const lateCount = insts.filter(i => i.status === 'late').length;
      const paidCount = insts.filter(i => i.status === 'paid').length;
      const pendingCount = insts.filter(i => i.status === 'pending').length;
      const contractId = insts[0]?.contract_id;
      const contract = contractsMap[contractId] || {};
      const months = insts.map(i => {
        const d = i.due_date?.toDate?.() || i.due_date;
        return d ? getArabicMonthName(d.getMonth()) : '';
      });
      const allSelected = insts.every(i => selectedIds.has(i.id));
      const someSelected = insts.some(i => selectedIds.has(i.id));

      return {
        customerId,
        customer,
        contract,
        installments: insts,
        totalAmount,
        lateCount,
        paidCount,
        pendingCount,
        months,
        allSelected,
        someSelected,
        count: insts.length,
      };
    });
  }, [installments, customersMap, contractsMap, selectedIds]);

  const sortedGroups = useMemo(() => {
    const sorted = [...customerGroups];
    const dir = sortAsc ? 1 : -1;
    switch (sortBy) {
      case 'amount':
        sorted.sort((a, b) => (a.totalAmount - b.totalAmount) * dir);
        break;
      case 'name':
        sorted.sort((a, b) => {
          const nameA = (a.customer.full_name || '').trim();
          const nameB = (b.customer.full_name || '').trim();
          return nameA.localeCompare(nameB, 'ar') * dir;
        });
        break;
      case 'late':
        sorted.sort((a, b) => (a.lateCount - b.lateCount) * dir);
        break;
    }
    return sorted;
  }, [customerGroups, sortBy, sortAsc]);

  const filteredGroups = useMemo(() => {
    let groups = sortedGroups;
    if (filterTab === 'late') {
      groups = groups.filter(g => g.lateCount > 0);
    } else if (filterTab === 'pending') {
      groups = groups.filter(g => g.pendingCount > 0 && g.lateCount === 0);
    }
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.trim().toLowerCase();
    return groups.filter(group => {
      const name = (group.customer.full_name || '').toLowerCase();
      const phone = (group.customer.phone || '').toLowerCase();
      const village = (group.customer.village || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || village.includes(q);
    });
  }, [sortedGroups, searchQuery, filterTab]);

  const visibleInstallments = useMemo(() => {
    const visibleIds = new Set(filteredGroups.flatMap(g => g.installments.map(i => i.id)));
    return installments.filter(i => visibleIds.has(i.id));
  }, [filteredGroups, installments]);

  const selectedTotal = visibleInstallments
    .filter(i => selectedIds.has(i.id) && !justPaidIds.has(i.id))
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const totalAmount = visibleInstallments.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalLate = visibleInstallments.filter(i => i.status === 'late').length;

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 dark:text-white mb-6">التحصيل</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-base font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">المدينة</label>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full px-3 py-3 text-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">الكل</option>
              {villages.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">الشهر</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedMonth(prev => prev === 0 ? 11 : prev - 1)}
                className="px-3 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 text-xl min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                →
              </button>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="flex-1 px-3 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx}>{name}</option>
                ))}
              </select>
              <button
                onClick={() => setSelectedMonth(prev => prev === 11 ? 0 : prev + 1)}
                className="px-3 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 text-xl min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                ←
              </button>
            </div>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-1">السنة</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedYear(prev => prev - 1)}
                className="px-3 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 text-xl min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                →
              </button>
              <span className="flex-1 text-center text-xl font-semibold py-3">{selectedYear}</span>
              <button
                onClick={() => setSelectedYear(prev => prev + 1)}
                className="px-3 py-3 bg-gray-200 rounded-lg hover:bg-gray-300 text-xl min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                ←
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xl font-semibold py-3 rounded-lg transition-colors min-h-[44px]"
        >
          {loading ? 'جاري البحث...' : 'بحث'}
        </button>
      </div>

      {searchError && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-lg mb-4 flex items-center justify-between">
          <span>{searchError}</span>
          <button onClick={handleSearch} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-base font-semibold min-h-[44px]">
            إعادة المحاولة
          </button>
        </div>
      )}

      {searched && installments.length === 0 && !loading && !searchError && (
        <EmptyState
          icon="✅"
          message="لا توجد أقساط مستحقة لهذا الشهر"
        />
      )}

      {searched && installments.length > 0 && filteredGroups.length === 0 && !loading && (
        <EmptyState
          icon="🔍"
          message={
            searchQuery.trim()
              ? `لا توجد نتائج تطابق "${searchQuery.trim()}"`
              : 'لا توجد نتائج تطابق بحثك'
          }
          actionLabel={searchQuery.trim() ? 'مسح البحث' : undefined}
          onAction={searchQuery.trim() ? () => setSearchQuery('') : undefined}
        />
      )}

      {/* Just paid banner */}
      {justPaidIds.size > 0 && (
        <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-lg text-lg mb-4 flex items-center justify-between">
          <span>
            تم دفع <strong>{justPaidIds.size}</strong>{' '}
            {justPaidIds.size === 1 ? 'قسط' : 'أقساط'}
            {' — '}متبقي {visibleInstallments.length - justPaidIds.size} قسط
          </span>
          <button
            onClick={() => completePayment(justPaidIds)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-base font-semibold min-h-[44px]"
          >
            تأكيد الدفع
          </button>
        </div>
      )}

      {installments.length > 0 && filteredGroups.length > 0 && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم العميل أو رقم الهاتف أو المدينة..."
                className="flex-1 px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                dir="rtl"
              />
              {searchQuery.trim() && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 dark:text-gray-300 rounded-lg text-lg min-h-[44px] transition-colors"
                >
                  مسح
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-base font-semibold transition-colors min-h-[44px] ${
                  filterTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <span className="text-lg text-gray-600 dark:text-gray-400">
              {searchQuery.trim() ? `${filteredGroups.length} من أصل ${customerGroups.length} عميل` : `${filteredGroups.length} عميل`}
              {' | '}{visibleInstallments.length} قسط | {formatCurrency(totalAmount)}
            </span>
            <div className="flex items-center gap-2">
              {totalLate > 0 && (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-base font-semibold">
                  {totalLate} متأخر
                </span>
              )}
              <div className="flex items-center gap-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setSortAsc(prev => !prev)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-base min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                  title={sortAsc ? 'تصاعدي' : 'تنازلي'}
                >
                  {sortAsc ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <input
              type="checkbox"
              checked={visibleInstallments.length > 0 && visibleInstallments.every(i => selectedIds.has(i.id))}
              onChange={toggleSelectAll}
              className="w-6 h-6 rounded"
            />
            <span className="text-lg font-medium">تحديد الكل ({visibleInstallments.length})</span>
          </div>

          {skippedCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-lg mb-4">
              تم تخطي {skippedCount} قسط لأن لديه إيصال بالفعل
            </div>
          )}

          <div className="space-y-4">
            {filteredGroups.map(group => {
              const isExpanded = expandedCustomers.has(group.customerId);
              const hasLate = group.lateCount > 0;

              return (
                <div
                  key={group.customerId}
                  className={`bg-white rounded-xl border overflow-hidden transition-all ${
                    hasLate ? 'border-red-300' : 'border-gray-200'
                  }`}
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(group.customerId)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={group.allSelected}
                        ref={el => {
                          if (el) el.indeterminate = group.someSelected && !group.allSelected;
                        }}
                        onChange={(e) => { e.stopPropagation(); toggleSelectCustomer(group.customerId); }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-6 h-6 rounded flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate">{group.customer.full_name || '-'}</h3>
                          {hasLate && (
                            <span className="bg-red-100 text-red-700 text-sm px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                              {group.lateCount} متأخر
                            </span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleShowPaymentHistory(group.customerId, group.customer.full_name); }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex-shrink-0"
                            title="سجل الدفع"
                          >
                            سجل الدفع
                          </button>
                        </div>
                        <div className="flex items-center gap-3 text-base text-gray-500 dark:text-gray-400">
                          {group.customer.phone && (
                            <span dir="ltr">{group.customer.phone}</span>
                          )}
                          {group.customer.village && (
                            <span>{group.customer.village}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-left flex-shrink-0 flex items-center gap-4">
                        <div>
                          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(group.totalAmount)}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{group.count} قسط</p>
                        </div>
                        <svg
                          className={`w-6 h-6 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3 mr-9">
                      {group.months.map((m, idx) => {
                        const inst = group.installments[idx];
                        const isJustPaid = justPaidIds.has(inst.id);
                        const isSelected = selectedIds.has(inst.id);
                        return (
                          <span
                            key={idx}
                            className={`text-sm px-2.5 py-1 rounded-full font-medium transition-all ${
                              isJustPaid
                                ? 'bg-green-100 text-green-700 line-through opacity-60'
                                : inst.status === 'late'
                                ? 'bg-red-100 text-red-700'
                                : inst.status === 'pending'
                                ? isSelected
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600 dark:text-gray-400'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {m}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {group.installments.map(inst => {
                        const isSelected = selectedIds.has(inst.id);
                        const isJustPaid = justPaidIds.has(inst.id);
                        const dueDate = inst.due_date?.toDate?.() || inst.due_date;
                        const monthLabel = dueDate ? getArabicMonthName(dueDate.getMonth()) : '';

                        return (
                          <div
                            key={inst.id}
                            className={`px-4 py-3 border-b border-gray-50 last:border-b-0 flex items-center gap-3 transition-all ${
                              isJustPaid
                                ? 'bg-green-50 opacity-60'
                                : isSelected
                                ? 'bg-blue-50'
                                : ''
                            } ${inst.status === 'late' ? 'bg-red-50' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(inst.id)}
                              disabled={isJustPaid}
                              className="w-5 h-5 rounded flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-lg font-semibold ${isJustPaid ? 'text-green-700 line-through' : 'text-gray-800 dark:text-gray-100'}`}>
                                  {monthLabel}
                                </span>
                                <StatusBadge 
                                  status={isJustPaid ? 'paid' : (inst.paid_amount != null ? 'partial' : inst.status)}
                                  paidAmount={inst.paid_amount}
                                  originalAmount={inst.amount}
                                />
                                {group.contract.product_name && (
                                  <span className="text-xs sm:text-sm text-gray-400">{group.contract.product_name}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`text-lg font-bold flex-shrink-0 ${isJustPaid ? 'text-green-700 line-through' : inst.paid_amount ? 'text-orange-600' : 'text-gray-700 dark:text-gray-300'}`}>
                                {formatCurrency(inst.amount)}
                              </span>
                              {(inst.paid_amount != null || inst.carryover_from_partial) && (
                                <span className="text-xs text-orange-600">
                                  {inst.carryover_from_partial && <span className="text-blue-600">(+{formatCurrency(inst.carryover_from_partial)} من قسط سابق) </span>}
                                  {inst.paid_amount != null && `مدفوع: ${formatCurrency(inst.paid_amount)} | باقي: ${formatCurrency(inst.amount - inst.paid_amount)}`}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => setConfirmPaid(inst)}
                                disabled={actionLoading === inst.id || isJustPaid}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-2 rounded-lg text-base font-semibold transition-colors min-h-[44px] disabled:opacity-50"
                              >
                                {isJustPaid ? 'تم' : actionLoading === inst.id ? '...' : 'دفع'}
                              </button>
                              {!isJustPaid && inst.paid_amount == null && (
                                <button
                                  onClick={() => { setPartialPaymentModal(inst); setPartialAmount(String(inst.amount)); }}
                                  disabled={actionLoading === inst.id}
                                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-base font-semibold transition-colors min-h-[44px]"
                                >
                                  جزئي
                                </button>
                              )}
                              <button
                                onClick={() => handleMarkLate(inst)}
                                disabled={actionLoading === inst.id || isJustPaid}
                                className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-base font-semibold transition-colors min-h-[44px] disabled:opacity-50"
                              >
                                متأخر
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectedIds.size > 0 && (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 bg-gray-900 text-white rounded-xl p-4 z-40 shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg">{selectedIds.size} قسط محدد</span>
            <span className="text-xl font-bold">{formatCurrency(selectedTotal)}</span>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setConfirmBulkPaid(true)}
              disabled={actionLoading === 'bulk'}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-3 rounded-lg text-xl font-semibold transition-colors min-h-[44px]"
            >
              {actionLoading === 'bulk' ? 'جاري الدفع...' : 'دفع المحدد'}
            </button>
            <button
              onClick={handleGenerateReceipts}
              disabled={generating}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 rounded-lg text-xl font-semibold transition-colors min-h-[44px]"
            >
              {generating ? 'جاري إنشاء الإيصالات...' : 'إنشاء الإيصالات'}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          action={toast.action}
          onDismiss={dismissToast}
          duration={5000}
        />
      )}

      <ConfirmationDialog
        isOpen={!!confirmPaid}
        title="تأكيد الدفع"
        message={confirmPaid ? `هل تريد تأكيد دفع ${formatCurrency(confirmPaid.amount)} للعميل ${customersMap[confirmPaid.customer_id]?.full_name || '...'}` : ''}
        onConfirm={() => confirmPaid && handleMarkPaid(confirmPaid)}
        onCancel={() => setConfirmPaid(null)}
      />

      <ConfirmationDialog
        isOpen={confirmBulkPaid}
        title="تأكيد الدفع الجماعي"
        message={`هل تريد تأكيد دفع ${selectedIds.size} قسط بقيمة إجمالية ${formatCurrency(selectedTotal)}؟`}
        onConfirm={handleBulkMarkPaid}
        onCancel={() => setConfirmBulkPaid(false)}
      />

      {partialPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setPartialPaymentModal(null)}>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">دفع جزئي</h3>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-base text-gray-600 dark:text-gray-400">المطلوب:</span>
                <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{formatCurrency(partialPaymentModal.amount)}</span>
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2">المبلغ المدفوع</label>
                <input
                  type="number"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="أدخل المبلغ"
                  min="1"
                  max={partialPaymentModal.amount}
                  step="0.01"
                />
              </div>
              {partialAmount && parseFloat(partialAmount) > 0 && (
                <div className="flex justify-between items-center bg-orange-50 p-3 rounded-lg">
                  <span className="text-base text-orange-700">المتبقي:</span>
                  <span className="text-lg font-bold text-orange-700">
                    {formatCurrency(Math.max(0, partialPaymentModal.amount - parseFloat(partialAmount)))}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setPartialPaymentModal(null); setPartialAmount(''); }}
                className="flex-1 px-4 py-3 text-lg border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
              >
                إلغاء
              </button>
              <button
                onClick={handlePartialPayment}
                disabled={!partialAmount || parseFloat(partialAmount) <= 0 || parseFloat(partialAmount) > partialPaymentModal.amount || actionLoading === 'partial'}
                className="flex-1 px-4 py-3 text-lg bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg transition-colors min-h-[44px]"
              >
                {actionLoading === 'partial' ? 'جاري...' : 'دفع'}
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setPaymentHistoryModal(null)}>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">سجل الدفع</h3>
              <button
                onClick={() => setPaymentHistoryModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 text-2xl min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{paymentHistoryModal.customerName}</p>
            
            {paymentHistoryLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-gray-500 dark:text-gray-400">جاري التحميل...</span>
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-gray-500 dark:text-gray-400">لا يوجد سجل دفع</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400">الشهر</th>
                      <th className="px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400">المطلوب</th>
                      <th className="px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400">المدفوع</th>
                      <th className="px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400">تاريخ الدفع</th>
                      <th className="px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400">الإيصال</th>
                      <th className="px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map(inst => {
                      const dueDate = inst.due_date?.toDate?.() || inst.due_date;
                      const paymentDate = inst.payment_date?.toDate?.() || inst.payment_date;
                      const isPartial = inst.paid_amount != null && inst.paid_amount < inst.amount;
                      
                      return (
                        <tr key={inst.id} className="border-t border-gray-100">
                          <td className="px-3 py-2 text-base">
                            {dueDate ? `${getArabicMonthName(dueDate.getMonth())} ${dueDate.getFullYear()}` : '-'}
                          </td>
                          <td className="px-3 py-2 text-base font-medium">{formatCurrency(inst.amount)}</td>
                          <td className="px-3 py-2 text-base">
                            {inst.status === 'paid' || isPartial ? formatCurrency(inst.paid_amount || inst.amount) : '-'}
                          </td>
                          <td className="px-3 py-2 text-base text-gray-600 dark:text-gray-400">
                            {paymentDate ? paymentDate.toLocaleDateString('ar-EG') : '-'}
                          </td>
                          <td className="px-3 py-2 text-base text-blue-600">
                            {inst.receipt_number || '-'}
                          </td>
                          <td className="px-3 py-2">
                            <StatusBadge 
                              status={isPartial ? 'partial' : inst.status}
                              paidAmount={inst.paid_amount}
                              originalAmount={inst.amount}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
