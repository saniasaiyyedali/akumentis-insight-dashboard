export function GlobalLegend() {
  const items = [
    { color: 'bg-emerald-500', label: 'High performance / positive growth' },
    { color: 'bg-blue-500', label: 'Stable / average' },
    { color: 'bg-amber-500', label: 'Warning / attention needed' },
    { color: 'bg-red-500', label: 'Revenue risk / negative growth' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-4 px-1 py-2 text-[10px] text-slate-500">
      <span className="font-semibold text-slate-600 uppercase tracking-wider">Legend</span>
      {items.map(item => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
