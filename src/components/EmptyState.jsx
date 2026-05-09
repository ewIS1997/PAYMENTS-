import { IconDocument, IconSearch, IconCheck, IconUsers, IconChart } from './Icons';

const iconMap = {
  '📄': IconDocument,
  '🔍': IconSearch,
  '✅': IconCheck,
  '❌': IconDocument,
  '👥': IconUsers,
  '📋': IconDocument,
  '📊': IconChart,
};

export default function EmptyState({ icon = '📋', message, actionLabel, onAction }) {
  const IconComponent = iconMap[icon] || IconDocument;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-4 text-gray-300">
        <IconComponent className="w-16 h-16" />
      </div>
      <p className="text-xl text-gray-500 text-center mb-4">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-6 py-3 rounded-lg transition-colors min-h-[44px]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
