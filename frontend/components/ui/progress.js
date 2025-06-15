export function Progress({ value, className = '', max = 100 }) {
  const percentage = Math.min(Math.max(value, 0), max);

  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-blue-600 transition-all duration-300 ease-out"
        style={{ width: `${(percentage / max) * 100}%` }}
      />
    </div>
  );
}
