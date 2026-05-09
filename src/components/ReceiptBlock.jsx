import { formatCurrency } from '../utils/currencyUtils';
import { formatArabicMonth } from '../utils/dateUtils';

export default function ReceiptBlock({ receipt, customer, contract, shopName, showLogo, logoUrl }) {
  const issueDate = receipt.issue_date?.toDate?.() || receipt.issue_date;
  const monthYear = formatArabicMonth(receipt.month, receipt.year);

  return (
    <div className="receipt-block border-2 border-dashed border-gray-400 p-3 mb-1">
      <div className="flex justify-between items-start mb-1 pb-1 border-b border-gray-300">
        <div className="text-right flex-1">
          <p className="font-bold" style={{ fontSize: '12pt' }}>{receipt.receipt_number}</p>
          {issueDate && (
            <p style={{ fontSize: '8pt' }} className="text-gray-600">
              تاريخ الإصدار: {issueDate.toLocaleDateString('ar-EG')}
            </p>
          )}
        </div>
        <div className="text-left">
          {showLogo && logoUrl && (
            <img src={logoUrl} alt="شعار المتجر" className="max-h-[40pt] max-w-[90pt] object-contain" />
          )}
        </div>
      </div>

      {shopName && (
        <p className="text-center font-bold mb-1" style={{ fontSize: '13pt' }}>{shopName}</p>
      )}

      <div className="space-y-0.5" style={{ fontSize: '9pt' }}>
        <div className="flex justify-between">
          <span className="text-gray-500">اسم العميل:</span>
          <span className="font-semibold">{customer?.full_name || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">رقم الهاتف:</span>
          <span className="font-semibold" dir="ltr">{customer?.phone || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">القرية:</span>
          <span className="font-semibold">{customer?.village || '-'}</span>
        </div>
        {customer?.address && (
          <div className="flex justify-between">
            <span className="text-gray-500">العنوان:</span>
            <span className="font-semibold">{customer.address}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">المنتج:</span>
          <span className="font-semibold">{contract?.product_name || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">الشهر:</span>
          <span className="font-semibold">{monthYear}</span>
        </div>
      </div>

      <div className="mt-2 pt-1 border-t border-gray-300 text-center">
        <p className="font-bold" style={{ fontSize: '14pt' }}>
          {formatCurrency(receipt.amount)}
        </p>
      </div>

      <div className="mt-2 pt-1 border-t border-gray-300 flex justify-between items-end" style={{ fontSize: '8pt' }}>
        <div className="text-right">
          <p>التوقيع:</p>
          <p className="mt-2">________________</p>
        </div>
      </div>
    </div>
  );
}
