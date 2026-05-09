export function SkeletonCard({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-gray-200 rounded mt-1"></div>
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded w-2/3"></div>
              <div className="h-5 bg-gray-100 rounded w-1/3"></div>
              <div className="h-5 bg-gray-100 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-xl h-28 animate-pulse"></div>
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-40"></div>
              <div className="h-4 bg-gray-100 rounded w-24"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ width = 'w-48' }) {
  return <div className={`h-7 ${width} bg-gray-200 rounded animate-pulse`}></div>;
}
