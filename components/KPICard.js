export default function KPICard({ title, value, subtitle, color = 'brand' }) {
  const colorMap = {
    brand:  'bg-brand-50 text-brand-700 border-brand-100',
    blue:   'bg-blue-50 text-blue-700 border-blue-100',
    amber:  'bg-amber-50 text-amber-700 border-amber-100',
    red:    'bg-red-50 text-red-700 border-red-100',
  };

  return (
    <div className={`rounded-xl border p-4 sm:p-6 ${colorMap[color] ?? colorMap.brand}`}>
      <p className="text-xs sm:text-sm font-medium opacity-70">{title}</p>
      <p className="mt-1 text-2xl sm:text-4xl font-bold tracking-tight">{value}</p>
      {subtitle && <p className="mt-1 text-xs opacity-60">{subtitle}</p>}
    </div>
  );
}
