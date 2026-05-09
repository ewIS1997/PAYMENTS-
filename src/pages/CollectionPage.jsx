import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import StatusBadge from '../components/StatusBadge';
import ConfirmationDialog from '../components/ConfirmationDialog';
import EmptyState from '../components/EmptyState';
import { fetchInstallmentsForCollection, markInstallmentAsPaid, markInstallmentAsLate, getAllVillages } from '../services/collectionService';
import { generateReceipts } from '../services/receiptService';
import { getContract } from '../services/contractService';
import { getCustomer } from '../services/customerService';
import { formatCurrency } from '../utils/currencyUtils';
import { getArabicMonthName } from '../utils/dateUtils';

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
  const [actionLoading, setActionLoading] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [expandedCustomers, setExpandedCustomers] = useState(new Set());

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

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    setSelectedIds(new Set());
    setSkippedCount(0);
    setSearchError(null);
    setExpandedCustomers(new Set());
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
      setInstallments(prev => prev.filter(i => i.id !== inst.id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(inst.id);
        return next;
      });
    } catch (err) {
      console.error('Error marking as paid:', err);
    } finally {
      setActionLoading(null);
      setConfirmPaid(null);
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
    if (selectedIds.size === installments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(installments.map(i => i.id)));
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
    }).sort((a, b) => {
      if (a.lateCount > 0 && b.lateCount === 0) return -1;
      if (b.lateCount > 0 && a.lateCount === 0) return 1;
      return b.totalAmount - a.totalAmount;
    });
  }, [installments, customersMap, contractsMap, selectedIds]);

  const selectedTotal = installments
    .filter(i => selectedIds.has(i.id))
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const totalAmount = installments.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalLate = installments.filter(i => i.status === 'late').length;

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">التحصيل</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">القرية</label>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full px-3 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">الكل</option>
              {villages.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1">الشهر</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedMonth(prev => (prev + 11) % 12)}
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
            <label className="block text-base font-medium text-gray-700 mb-1">السنة</label>
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
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-lg mb-4 flex items-center justify-between">
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

      {installments.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg text-gray-600">
              {customerGroups.length} عميل | {installments.length} قسط | {formatCurrency(totalAmount)}
            </span>
            {totalLate > 0 && (
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-base font-semibold">
                {totalLate} متأخر
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-4 bg-white rounded-xl border border-gray-200 p-3">
            <input
              type="checkbox"
              checked={selectedIds.size === installments.length && installments.length > 0}
              onChange={toggleSelectAll}
              className="w-6 h-6 rounded"
            />
            <span className="text-lg font-medium">تحديد الكل ({installments.length})</span>
          </div>

          {skippedCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-lg mb-4">
              تم تخطي {skippedCount} قسط لأن لديه إيصال بالفعل
            </div>
          )}

          <div className="space-y-4">
            {customerGroups.map(group => {
              const isExpanded = expandedCustomers.has(group.customerId);
              const hasLate = group.lateCount > 0;

              return (
                <div
                  key={group.customerId}
                  className={`bg-white rounded-xl border overflow-hidden transition-all ${
                    hasLate ? 'border-red-300' : 'border-gray-200'
                  }`}
                >
                  {/* Customer Header */}
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
                          <h3 className="text-xl font-bold text-gray-800 truncate">{group.customer.full_name || '-'}</h3>
                          {hasLate && (
                            <span className="bg-red-100 text-red-700 text-sm px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                              {group.lateCount} متأخر
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-base text-gray-500">
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
                          <p className="text-2xl font-bold text-gray-800">{formatCurrency(group.totalAmount)}</p>
                          <p className="text-sm text-gray-500">{group.count} قسط</p>
                        </div>
                        <svg
                          className={`w-6 h-6 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Month badges */}
                    <div className="flex flex-wrap gap-1.5 mt-3 mr-9">
                      {group.months.map((m, idx) => {
                        const inst = group.installments[idx];
                        const isSelected = selectedIds.has(inst.id);
                        return (
                          <span
                            key={idx}
                            className={`text-sm px-2.5 py-1 rounded-full font-medium ${
                              inst.status === 'late'
                                ? 'bg-red-100 text-red-700'
                                : inst.status === 'pending'
                                ? isSelected
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {m}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expanded Installments */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {group.installments.map(inst => {
                        const isSelected = selectedIds.has(inst.id);
                        const dueDate = inst.due_date?.toDate?.() || inst.due_date;
                        const monthLabel = dueDate ? getArabicMonthName(dueDate.getMonth()) : '';

                        return (
                          <div
                            key={inst.id}
                            className={`px-4 py-3 border-b border-gray-50 last:border-b-0 flex items-center gap-3 ${
                              isSelected ? 'bg-blue-50' : ''
                            } ${inst.status === 'late' ? 'bg-red-50' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(inst.id)}
                              className="w-5 h-5 rounded flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold text-gray-800">{monthLabel}</span>
                                <StatusBadge status={inst.status} />
                                {group.contract.product_name && (
                                  <span className="text-xs sm:text-sm text-gray-400">{group.contract.product_name}</span>
                                )}
                              </div>
                            </div>
                            <span className="text-lg font-bold text-gray-700 flex-shrink-0">{formatCurrency(inst.amount)}</span>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => setConfirmPaid(inst)}
                                disabled={actionLoading === inst.id}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-2 rounded-lg text-base font-semibold transition-colors min-h-[44px]"
                              >
                                {actionLoading === inst.id ? '...' : 'دفع'}
                              </button>
                              <button
                                onClick={() => handleMarkLate(inst)}
                                disabled={actionLoading === inst.id}
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
          <button
            onClick={handleGenerateReceipts}
            disabled={generating}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 rounded-lg text-xl font-semibold transition-colors min-h-[44px]"
          >
            {generating ? 'جاري إنشاء الإيصالات...' : 'إنشاء الإيصالات'}
          </button>
        </div>
      )}

      <ConfirmationDialog
        isOpen={!!confirmPaid}
        title="تأكيد الدفع"
        message={confirmPaid ? `هل تريد تأكيد دفع ${formatCurrency(confirmPaid.amount)} للعميل ${customersMap[confirmPaid.customer_id]?.full_name || '...'}` : ''}
        onConfirm={() => confirmPaid && handleMarkPaid(confirmPaid)}
        onCancel={() => setConfirmPaid(null)}
      />
    </AppShell>
  );
}
