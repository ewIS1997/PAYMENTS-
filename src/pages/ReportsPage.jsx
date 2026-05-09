import { useState } from 'react';
import AppShell from '../components/AppShell';
import EmptyState from '../components/EmptyState';
import { fetchMonthlyReport, fetchVillageBreakdown, fetchLateCustomers, fetchGrandTotals } from '../services/reportsService';
import { formatCurrency } from '../utils/currencyUtils';
import { getArabicMonthName } from '../utils/dateUtils';

export default function ReportsPage() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [lateCustomers, setLateCustomers] = useState([]);
  const [grandTotals, setGrandTotals] = useState(null);

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const [monthly, villages, late, totals] = await Promise.all([
        fetchMonthlyReport(selectedMonth, selectedYear),
        fetchVillageBreakdown(selectedMonth, selectedYear),
        fetchLateCustomers(),
        fetchGrandTotals(),
      ]);
      setReportData({ monthly, villages });
      setLateCustomers(late);
      setGrandTotals(totals);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('حدث خطأ أثناء تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    handleGenerateReport();
  };

  return (
    <AppShell>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">التقارير</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onClick={() => setSelectedMonth(prev => (prev + 1) % 12)}
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
          onClick={handleGenerateReport}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xl font-semibold py-3 rounded-lg transition-colors min-h-[44px]"
        >
          {loading ? 'جاري تحميل التقرير...' : 'عرض التقرير'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-lg mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={handleRetry} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-base font-semibold min-h-[44px]">
            إعادة المحاولة
          </button>
        </div>
      )}

      {!reportData && !loading && !error && (
        <EmptyState
          icon="📊"
          message="اختر شهراً من الأعلى لعرض التقرير"
        />
      )}

      {loading && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-7 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-7 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
            <div className="space-y-3">
              <div className="h-14 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-14 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-14 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {reportData && (
        <div className="space-y-6">
          {/* Section 1: Monthly Collection Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">ملخص تحصيل {getArabicMonthName(selectedMonth)} {selectedYear}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <div className="text-4xl font-bold text-green-600 mb-1">{formatCurrency(reportData.monthly.totalCollected)}</div>
                <div className="text-base text-green-700">إجمالي المحصّل</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <div className="text-4xl font-bold text-blue-600 mb-1">{reportData.monthly.paidCount}</div>
                <div className="text-base text-blue-700">أقساط تم دفعها</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <div className="text-4xl font-bold text-red-600 mb-1">{reportData.monthly.unpaidCount}</div>
                <div className="text-base text-red-700">أقساط غير مدفوعة</div>
              </div>
            </div>
          </div>

          {/* Section 2: Village Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">تفصيل حسب القرية</h2>
            {reportData.villages.length === 0 ? (
              <p className="text-lg text-gray-500 text-center py-4">لا توجد بيانات لهذا الشهر</p>
            ) : (
              <div className="space-y-2">
                {reportData.villages.map((v, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 px-4 border-b border-gray-100 last:border-b-0">
                    <div>
                      <span className="text-xl font-semibold text-gray-800">{v.village}</span>
                      <span className="text-base text-gray-500 mr-3">({v.paidCount} مدفوع | {v.unpaidCount} غير مدفوع)</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">{formatCurrency(v.totalCollected)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Late Customers */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">العملاء المتأخرون</h2>
            {lateCustomers.length === 0 ? (
              <p className="text-lg text-gray-500 text-center py-4">لا يوجد عملاء متأخرون</p>
            ) : (
              <div className="space-y-2">
                {lateCustomers.map((c) => (
                  <div key={c.id} className="flex justify-between items-center py-3 px-4 border-b border-gray-100 last:border-b-0">
                    <div>
                      <span className="text-xl font-semibold text-gray-800">{c.full_name}</span>
                      <span className="text-base text-gray-500 mr-3">{c.village} | <span dir="ltr">{c.phone}</span></span>
                    </div>
                    <span className="text-xl font-bold text-red-600">{c.lateCount} أقساط</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Grand Totals */}
          {grandTotals && (
            <div className="bg-gray-900 text-white rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">الإجماليات العامة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <div className="text-4xl font-bold text-green-400 mb-1">{formatCurrency(grandTotals.totalCollected)}</div>
                  <div className="text-base text-gray-300">إجمالي المحصّل (كل الأشهر)</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <div className="text-4xl font-bold text-red-400 mb-1">{formatCurrency(grandTotals.totalOutstanding)}</div>
                  <div className="text-base text-gray-300">إجمالي المتبقي (كل الأشهر)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
