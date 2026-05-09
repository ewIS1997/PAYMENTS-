import { useEffect } from 'react';

export default function ConfirmationDialog({ isOpen, title, message, onConfirm, onCancel, danger = false }) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
        <p className="text-lg text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-lg border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 text-lg text-white rounded-lg transition-colors min-h-[44px] ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );
}
