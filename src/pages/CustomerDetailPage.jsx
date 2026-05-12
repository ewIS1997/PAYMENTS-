import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import AppShell from '../components/AppShell';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { IconPhone, IconPlus, IconTrash } from '../components/Icons';
import { getCustomer, softDeleteCustomer, findPotentialDuplicates } from '../services/customerService';
import { getContractsByCustomerId, getInstallmentsByCustomerId } from '../services/contractService';
import { getCustomerReceipts } from '../services/receiptService';
import { formatCurrency } from '../utils/currencyUtils';
import { formatDateForDisplay, getArabicMonthName, toDateValue } from '../utils/dateUtils';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [allInstallments, setAllInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [cust, conts, insts] = await Promise.all([
          getCustomer(id),
          getContractsByCustomerId(id),
          getInstallmentsByCustomerId(id),
        ]);
        setCustomer(cust);
        setContracts(conts);
        setAllInstallments(insts);
      } catch (err) {
        console.error('Error fetching customer:', err);
        setError('حدث خطأ أثناء تحميل البيانات');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  const stats = useMemo(() => {
    const totalContracted = contracts.reduce((s, c) => s + (c.total_amount || 0), 0);
    const paid = allInstallments.filter(i => i.status === 'paid');
    const partial = allInstallments.filter(i => i.status === 'partial');
    const unpaid = allInstallments.filter(i => i.status === 'pending' || i.status === 'late');
    const totalPaid = paid.reduce((s, i) => s + (i.amount || 0), 0);
    const partialPaid = partial.reduce((s, i) => s + (i.paid_amount || 0), 0);
    const totalRemaining = unpaid.reduce((s, i) => s + (i.amount || 0), 0) + partial.reduce((s, i) => s + ((i.amount || 0) - (i.paid_amount || 0)), 0);

    const now = new Date();
    const dueThisMonth = unpaid.filter(i => {
      const d = i.due_date?.toDate?.() || i.due_date;
      return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const dueThisMonthPartial = partial.filter(i => {
      const d = i.due_date?.toDate?.() || i.due_date;
      return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const dueThisMonthAmount = dueThisMonth.reduce((s, i) => s + (i.amount || 0), 0) + dueThisMonthPartial.reduce((s, i) => s + ((i.amount || 0) - (i.paid_amount || 0)), 0);

    return { totalContracted, totalPaid: totalPaid + partialPaid, totalRemaining, dueThisMonthAmount, paidCount: paid.length + partial.length, totalCount: allInstallments.length };
  }, [contracts, allInstallments]);

  const installmentsByContract = useMemo(() => {
    const map = {};
    allInstallments.forEach(inst => {
      if (!map[inst.contract_id]) map[inst.contract_id] = [];
      map[inst.contract_id].push(inst);
    });
    return map;
  }, [allInstallments]);

  if (loading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 rounded-lg h-8 w-48"></div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-3">
            <div className="bg-gray-200 rounded h-6 w-3/4"></div>
            <div className="bg-gray-200 rounded h-5 w-1/2"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse"></div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-lg mb-4">
          {error}
        </div>
      </AppShell>
    );
  }

  if (!customer) {
    return (
      <AppShell>
        <EmptyState
          icon="❌"
          message="لم يتم العثور على العميل"
          actionLabel="العودة للعملاء"
          onAction={() => navigate('/customers')}
        />
      </AppShell>
    );
  }

  const handleDeleteCustomer = async () => {
    setDeleting(true);
    try {
      await softDeleteCustomer(id);
      navigate('/customers');
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError('حدث خطأ أثناء حذف العميل');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCheckDuplicates = async () => {
    if (!customer.phone) return;
    setCheckingDuplicates(true);
    setShowDuplicates(true);
    try {
      const results = await findPotentialDuplicates(customer.phone);
      setDuplicates(results.filter(c => c.id !== customer.id));
    } catch (err) {
      console.error('Error checking duplicates:', err);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handlePrintAllReceipts = async () => {
    setPrinting(true);
    try {
      const receipts = await getCustomerReceipts(id, customer, contracts);
      if (receipts.length === 0) {
        alert('لا توجد أقساط مدفوعة لهذا العميل لإنشاء إيصالات');
        return;
      }
      navigate('/print', { state: { receipts } });
    } catch (err) {
      console.error('Error fetching customer receipts:', err);
      alert('حدث خطأ أثناء تحميل الإيصالات');
    } finally {
      setPrinting(false);
    }
  };

  const paidPercent = stats.totalCount > 0 ? Math.round((stats.paidCount / stats.totalCount) * 100) : 0;

  return (
    <AppShell>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/customers')}
          className="text-lg text-blue-600 hover:underline"
        >
          → رجوع
        </button>
        <button
          onClick={() => navigate(`/customers/${id}/edit`)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-lg transition-colors"
        >
          تعديل
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-lg transition-colors flex items-center gap-2"
        >
          <IconTrash className="w-4 h-4" />
          حذف
        </button>
        <button
          onClick={handlePrintAllReceipts}
          disabled={printing}
          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-lg transition-colors flex items-center gap-2"
        >
          {printing ? '...' : 'طباعة كل الإيصالات'}
        </button>
        {customer.phone && (
          <button
            onClick={handleCheckDuplicates}
            disabled={checkingDuplicates}
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-2 rounded-lg text-lg transition-colors flex items-center gap-2"
          >
            {checkingDuplicates ? '...' : 'البحث عن تكرار'}
          </button>
        )}
      </div>

      {/* Customer Info */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          {customer.photo ? (
            <img 
              src={customer.photo} 
              alt={customer.full_name}
              className="w-20 h-20 rounded-full object-cover border-4 border-blue-500"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl font-bold text-gray-500 dark:text-gray-400">
              {customer.full_name?.charAt(0) || '?'}
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{customer.full_name}</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-base text-gray-500 dark:text-gray-400">رقم الهاتف</p>
            <a
              href={`tel:${customer.phone}`}
              className="text-xl font-medium text-blue-600 hover:underline flex items-center gap-2"
              dir="ltr"
            >
              <IconPhone className="w-4 h-4" />
              {customer.phone}
            </a>
          </div>
          <div>
            <p className="text-base text-gray-500 dark:text-gray-400">المدينة</p>
            <p className="text-xl font-medium">{customer.village}</p>
          </div>
          {customer.national_id && (
            <div>
              <p className="text-base text-gray-500 dark:text-gray-400">الرقم القومي</p>
              <p className="text-xl font-medium" dir="ltr">{customer.national_id}</p>
            </div>
          )}
          {customer.address && (
            <div>
              <p className="text-base text-gray-500 dark:text-gray-400">العنوان</p>
              <p className="text-xl font-medium">{customer.address}</p>
            </div>
          )}
          {customer.notes && (
            <div className="md:col-span-2">
              <p className="text-base text-gray-500 dark:text-gray-400">ملاحظات</p>
              <p className="text-xl font-medium">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-2xl md:text-3xl font-bold text-blue-600">{formatCurrency(stats.totalContracted)}</p>
          <p className="text-sm md:text-base text-blue-700 mt-1">إجمالي التعاقدات</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl md:text-3xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
          <p className="text-sm md:text-base text-green-700 mt-1">إجمالي المدفوع</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-2xl md:text-3xl font-bold text-red-600">{formatCurrency(stats.totalRemaining)}</p>
          <p className="text-sm md:text-base text-red-700 mt-1">إجمالي المتبقي</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
          <p className="text-2xl md:text-3xl font-bold text-orange-600">{formatCurrency(stats.dueThisMonthAmount)}</p>
          <p className="text-sm md:text-base text-orange-700 mt-1">مستحق هذا الشهر</p>
        </div>
      </div>

      {/* Overall Progress */}
      {stats.totalCount > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">تقدم السداد</span>
            <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{stats.paidCount} من {stats.totalCount} قسط ({paidPercent}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${paidPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Contracts with Installments */}
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">العقود</h2>

      {contracts.length === 0 ? (
        <EmptyState
          icon="📄"
          message="لا توجد عقود لهذا العميل بعد"
          actionLabel="أضف عقد جديد"
          onAction={() => navigate(`/customers/${id}/contract/add`)}
        />
      ) : (
        <div className="space-y-6">
          {contracts.map(contract => {
            const contractInsts = installmentsByContract[contract.id] || [];
            const cPaid = contractInsts.filter(i => i.status === 'paid');
            const cTotal = contractInsts.length;
            const cPaidAmount = cPaid.reduce((s, i) => s + (i.amount || 0), 0);
            const cPercent = cTotal > 0 ? Math.round((cPaid.length / cTotal) * 100) : 0;

            return (
              <div key={contract.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Contract Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(`/customers/${id}/contract/${contract.id}`)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{contract.product_name}</h3>
                    <StatusBadge status={contract.status} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-base mb-3">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">الإجمالي</p>
                      <p className="font-medium">{formatCurrency(contract.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">القسط الشهري</p>
                      <p className="font-medium">{formatCurrency(contract.monthly_amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">عدد الأشهر</p>
                      <p className="font-medium">{contract.months_count}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">تاريخ البداية</p>
                      <p className="font-medium">
                        {toDateValue(contract.start_date) ? formatDateForDisplay(toDateValue(contract.start_date)) : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Contract Progress */}
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-gray-500 dark:text-gray-400">المدفوع: {formatCurrency(cPaidAmount)}</span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{cPaid.length} من {cTotal} قسط ({cPercent}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${cPercent}%` }}></div>
                  </div>
                </div>

                {/* Installment Rows */}
                {contractInsts.length > 0 && (
                  <div className="border-t border-gray-100">
                    {contractInsts.map(inst => {
                      const dueDate = inst.due_date?.toDate?.() || inst.due_date;
                      const paymentDate = inst.payment_date?.toDate?.() || inst.payment_date;
                      const monthLabel = dueDate ? `${getArabicMonthName(dueDate.getMonth())} ${dueDate.getFullYear()}` : '-';
                      const isPartial = inst.status === 'partial' || (inst.paid_amount != null && inst.paid_amount < inst.amount);
                      const displayAmount = isPartial ? (inst.amount - inst.paid_amount) : inst.amount;

                      return (
                        <div
                          key={inst.id}
                          className={`px-4 py-2.5 border-b border-gray-50 last:border-b-0 flex items-center gap-3 text-base ${
                            inst.status === 'paid' ? 'bg-green-50/50' : inst.status === 'late' ? 'bg-red-50/50' : isPartial ? 'bg-amber-50/50 dark:bg-amber-900/20' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800 dark:text-gray-100">{monthLabel}</span>
                              <StatusBadge status={isPartial ? 'partial' : inst.status} />
                            </div>
                            {(inst.status === 'paid' || isPartial) && paymentDate && (
                              <p className="text-sm text-green-600 mt-0.5">
                                تم الدفع: {formatDateForDisplay(paymentDate)}
                                {isPartial && ` (${formatCurrency(inst.paid_amount)})`}
                              </p>
                            )}
                          </div>
                          <span className={`text-lg font-bold flex-shrink-0 ${inst.carryover_from_partial ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}>
                              {formatCurrency(displayAmount)}
                              {inst.carryover_from_partial && <span className="text-xs block text-blue-500">+{formatCurrency(inst.carryover_from_partial)} من قسط سابق</span>}
                            </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Contract Button */}
      <div className="mt-6">
        <button
          onClick={() => navigate(`/customers/${id}/contract/add`)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 min-h-[44px]"
        >
          <IconPlus className="w-5 h-5" />
          أضف عقد جديد
        </button>
      </div>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="حذف العميل"
        message={`هل أنت متأكد من حذف "${customer.full_name}"؟ لن تتمكن من استعادة هذا العميل.`}
        onConfirm={handleDeleteCustomer}
        onCancel={() => setShowDeleteConfirm(false)}
        danger={true}
      />

      {showDuplicates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setShowDuplicates(false)}>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">عملاء مشابهين (قد يكونون مكررين)</h3>
              <button
                onClick={() => setShowDuplicates(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            
            {checkingDuplicates ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-gray-500 dark:text-gray-400">جاري البحث...</span>
              </div>
            ) : duplicates.length === 0 ? (
              <div className="text-center py-8 text-green-600 text-lg">
                ✓ لا يوجد عملاء بنفس رقم الهاتف
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {duplicates.map(dup => (
                  <div
                    key={dup.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => { setShowDuplicates(false); navigate(`/customers/${dup.id}`); }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{dup.full_name}</p>
                        <p className="text-base text-gray-500 dark:text-gray-400" dir="ltr">{dup.phone}</p>
                        {dup.village && <p className="text-base text-gray-500 dark:text-gray-400">{dup.village}</p>}
                      </div>
                      <span className="text-blue-600 text-base font-medium">عرض</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
