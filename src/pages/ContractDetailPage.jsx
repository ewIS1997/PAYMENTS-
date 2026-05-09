import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { getContract, getInstallmentsByContractId } from '../services/contractService';
import { formatCurrency } from '../utils/currencyUtils';
import { formatArabicMonth, toDateValue } from '../utils/dateUtils';
import { IconReceipt } from '../components/Icons';

export default function ContractDetailPage() {
  const { id: customerId, contractId } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [contractData, installmentsData] = await Promise.all([
          getContract(contractId),
          getInstallmentsByContractId(contractId),
        ]);
        setContract(contractData);
        setInstallments(installmentsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching contract data:', err);
        setError('حدث خطأ أثناء تحميل بيانات العقد');
      } finally {
        setLoading(false);
      }
    }
    if (contractId) fetchData();
  }, [contractId]);

  if (loading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 rounded h-8 w-48"></div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-3">
            <div className="bg-gray-200 rounded h-6 w-1/2"></div>
            <div className="bg-gray-200 rounded h-5 w-1/3"></div>
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-20 animate-pulse">
              <div className="bg-gray-200 rounded h-5 w-2/3"></div>
            </div>
          ))}
        </div>
      </AppShell>
    );
  }

  if (!contract) {
    return (
      <AppShell>
        <EmptyState
          icon="❌"
          message="لم يتم العثور على العقد"
          actionLabel="العودة للعميل"
          onAction={() => navigate(`/customers/${customerId}`)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <button
        onClick={() => navigate(`/customers/${customerId}`)}
        className="text-lg text-blue-600 mb-4 hover:underline"
      >
        → رجوع
      </button>

      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{contract.product_name}</h1>
      <div className="flex items-center gap-3 mb-6">
        <StatusBadge status={contract.status} />
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-base text-gray-500 dark:text-gray-400">الإجمالي</p>
            <p className="text-xl font-bold">{formatCurrency(contract.total_amount)}</p>
          </div>
          <div>
            <p className="text-base text-gray-500 dark:text-gray-400">القسط الشهري</p>
            <p className="text-xl font-bold">{formatCurrency(contract.monthly_amount)}</p>
          </div>
          <div>
            <p className="text-base text-gray-500 dark:text-gray-400">عدد الأشهر</p>
            <p className="text-xl font-bold">{contract.months_count}</p>
          </div>
          <div>
            <p className="text-base text-gray-500 dark:text-gray-400">تاريخ البداية</p>
            <p className="text-xl font-medium">
              {contract.start_date
                ? formatArabicMonth(
                    (toDateValue(contract.start_date))?.getMonth() ?? 0,
                    (toDateValue(contract.start_date))?.getFullYear() ?? 0
                  )
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-base text-gray-500 dark:text-gray-400">تاريخ النهاية</p>
            <p className="text-xl font-medium">
              {contract.end_date
                ? formatArabicMonth(
                    (toDateValue(contract.end_date))?.getMonth() ?? 0,
                    (toDateValue(contract.end_date))?.getFullYear() ?? 0
                  )
                : '-'}
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">الأقساط</h2>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-lg">
          {error}
        </div>
      ) : installments.length === 0 ? (
        <EmptyState
          icon="📋"
          message="لا توجد أقساط لهذا العقد"
        />
      ) : (
        <div className="space-y-3">
          {installments.map(inst => (
            <div
              key={inst.id}
              className={`bg-white rounded-xl border p-4 ${
                inst.status === 'late'
                  ? 'border-red-300 border-r-4'
                  : inst.status === 'paid'
                  ? 'border-green-200'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {inst.due_date
                      ? formatArabicMonth(
                          (toDateValue(inst.due_date))?.getMonth() ?? 0,
                          (toDateValue(inst.due_date))?.getFullYear() ?? 0
                        )
                      : '-'}
                  </p>
                  <p className={`text-lg ${inst.carryover_from_partial ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>
                    {formatCurrency(inst.amount)}
                    {inst.carryover_from_partial && <span className="text-xs block text-blue-500">+{formatCurrency(inst.carryover_from_partial)} من قسط سابق</span>}
                  </p>
                </div>
                <div className="text-left">
                  <StatusBadge status={inst.status} />
                  {inst.status === 'paid' && inst.payment_date && (
                    <p className="text-sm text-green-600 mt-1">
                      تاريخ الدفع:{' '}
                      {inst.payment_date.toDate?.().toLocaleDateString('ar-EG') ?? inst.payment_date}
                    </p>
                  )}
                  {inst.receipt_id && (
                    <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                      <IconReceipt className="w-3.5 h-3.5" />
                      إيصال
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
