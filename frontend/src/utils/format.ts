export function fmtMoney(v: number) {
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(1)}Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `₹${(v / 1e3).toFixed(1)}K`;
  return `₹${Math.round(v).toLocaleString()}`;
}

export function fmtPct(v: number) {
  return `${(v ?? 0).toFixed(1)}%`;
}
