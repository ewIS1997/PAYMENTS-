import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import AppShell from '../components/AppShell';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { IconPhone, IconPlus } from '../components/Icons';
import { getCustomer } from '../services/customerService';
import { getContractsByCustomerId, getInstallmentsByCustomerId } from '../services/contractService';
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
    const unpaid = allInstallments.filter(i => i.status !== 'paid');
    const totalPaid = paid.reduce((s, i) => s + (i.amount || 0), 0);
    const totalRemaining = unpaid.reduce((s, i) => s + (i.amount || 0), 0);

    const now = new Date();
    const dueThisMonth = unpaid.filter(i => {
      const d = i.due_date?.toDate?.() || i.due_date;
      return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const dueThisMonthAmount = dueThisMonth.reduce((s, i) => s + (i.amount || 0), 0);

    return { totalContracted, totalPaid, totalRemaining, dueThisMonthAmount, paidCount: paid.length, totalCount: allInstallments.length };
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
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
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
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-lg transition-colors"
        >
          تعديل
        </button>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{customer.full_name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-base text-gray-500">رقم الهاتف</p>
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
            <p className="text-base text-gray-500">القرية</p>
            <p className="text-xl font-medium">{customer.village}</p>
          </div>
          {customer.national_id && (
            <div>
              <p className="text-base text-gray-500">الرقم القومي</p>
              <p className="text-xl font-medium" dir="ltr">{customer.national_id}</p>
            </div>
          )}
          {customer.address && (
            <div>
              <p className="text-base text-gray-500">العنوان</p>
              <p className="text-xl font-medium">{customer.address}</p>
            </div>
          )}
          {customer.notes && (
            <div className="md:col-span-2">
              <p className="text-base text-gray-500">ملاحظات</p>
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
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold text-gray-700">تقدم السداد</span>
            <span className="text-lg font-bold text-gray-800">{stats.paidCount} من {stats.totalCount} قسط ({paidPercent}%)</span>
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
      <h2 className="text-2xl font-bold text-gray-800 mb-4">العقود</h2>

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
              <div key={contract.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Contract Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(`/customers/${id}/contract/${contract.id}`)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-800">{contract.product_name}</h3>
                    <StatusBadge status={contract.status} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-base mb-3">
                    <div>
                      <p className="text-gray-500">الإجمالي</p>
                      <p className="font-medium">{formatCurrency(contract.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">القسط الشهري</p>
                      <p className="font-medium">{formatCurrency(contract.monthly_amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">عدد الأشهر</p>
                      <p className="font-medium">{contract.months_count}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">تاريخ البداية</p>
                      <p className="font-medium">
                        {toDateValue(contract.start_date) ? formatDateForDisplay(toDateValue(contract.start_date)) : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Contract Progress */}
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-gray-500">المدفوع: {formatCurrency(cPaidAmount)}</span>
                    <span className="text-sm font-semibold text-gray-700">{cPaid.length} من {cTotal} قسط ({cPercent}%)</span>
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

                      return (
                        <div
                          key={inst.id}
                          className={`px-4 py-2.5 border-b border-gray-50 last:border-b-0 flex items-center gap-3 text-base ${
                            inst.status === 'paid' ? 'bg-green-50/50' : inst.status === 'late' ? 'bg-red-50/50' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">{monthLabel}</span>
                              <StatusBadge status={inst.status} />
                            </div>
                            {inst.status === 'paid' && paymentDate && (
                              <p className="text-sm text-green-600 mt-0.5">
                                تم الدفع: {formatDateForDisplay(paymentDate)}
                              </p>
                            )}
                          </div>
                          <span className="text-lg font-bold text-gray-700 flex-shrink-0">{formatCurrency(inst.amount)}</span>
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
    </AppShell>
  );
}
