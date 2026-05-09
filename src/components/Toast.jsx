import { useEffect, useRef } from 'react';

export default function Toast({ message, action, onDismiss, duration = 5000 }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss?.(), duration);
    return () => clearTimeout(timerRef.current);
  }, [duration, onDismiss]);

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-xl px-5 py-3 shadow-2xl flex items-center gap-4 min-w-[320px] max-w-[90vw]"
      role="alert"
    >
      <span className="flex-1 text-base">{message}</span>
      {action && (
        <button
          onClick={action.onClick}
          className="text-blue-400 hover:text-blue-300 font-bold whitespace-nowrap transition-colors min-h-[44px] px-2"
        >
          {action.label}
        </button>
      )}
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="إغلاق"
      >
        ✕
      </button>
    </div>
  );
}
