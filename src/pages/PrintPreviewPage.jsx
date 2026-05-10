import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppShell from '../components/AppShell';
import EmptyState from '../components/EmptyState';
import ReceiptBlock from '../components/ReceiptBlock';
import { getSettings } from '../services/settingsService';
import { getReceiptData } from '../services/receiptService';

const PRINT_RECEIPTS_KEY = 'print_receipts';

export default function PrintPreviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationReceipts = location.state?.receipts;
  const hasReceipts = Boolean(locationReceipts && locationReceipts.length > 0);
  const receiptsRef = useRef(locationReceipts || JSON.parse(sessionStorage.getItem(PRINT_RECEIPTS_KEY) || 'null'));
  const [settings, setSettings] = useState(null);
  const [fullData, setFullData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    async function loadData() {
      try {
        const s = await getSettings();
        setSettings(s);

        if (!receiptsRef.current || receiptsRef.current.length === 0) {
          setLoading(false);
          return;
        }

        sessionStorage.setItem(PRINT_RECEIPTS_KEY, JSON.stringify(receiptsRef.current));

        const dataPromises = receiptsRef.current.map(async (receipt) => {
          if (receipt.customer && receipt.contract) {
            return { receipt, customer: receipt.customer, contract: receipt.contract };
          }
          const receiptData = await getReceiptData(receipt.id);
          return receiptData;
        });

        const results = await Promise.all(dataPromises);
        setFullData(results.filter(Boolean));
      } catch (err) {
        console.error('Error loading print preview:', err);
        setError('حدث خطأ أثناء تحميل المعاينة');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 dark:bg-gray-700 rounded h-8 w-48"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-64"></div>
          ))}
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-lg mb-4">
          {error}
        </div>
        <button onClick={() => navigate(-1)} className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg min-h-[44px]">
          رجوع
        </button>
      </AppShell>
    );
  }

  if (fullData.length === 0) {
    return (
      <AppShell>
        <EmptyState
          icon="📄"
          message="لم يتم العثور على إيصالات. الرجوع وإنشاء إيصالات جديدة."
          actionLabel="رجوع"
          onAction={() => navigate(-1)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="print:hidden flex gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg text-lg transition-colors min-h-[44px]"
        >
          رجوع
        </button>
        <button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors min-h-[44px]"
        >
          طباعة
        </button>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-6 print:hidden">معاينة الطباعة</h1>

      <div>
        {fullData.map((data, index) => (
          <div
            key={data.receipt.id}
            className={((index + 1) % 3 === 0) ? 'receipt-page-break' : ''}
          >
            <ReceiptBlock
              receipt={data.receipt}
              customer={data.customer}
              contract={data.contract}
              shopName={settings?.shop_name || ''}
              showLogo={settings?.show_logo ?? true}
              logoUrl={settings?.logo_url || ''}
            />
          </div>
        ))}
      </div>
    </AppShell>
  );
}
