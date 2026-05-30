import { useMemo, useState } from 'react';
import { Equal, ArrowUp, ArrowDown } from 'lucide-react';
import { type Employee } from '../../contexts/WorkforceContext';
import { fmt, fmtPct, fmtMoney, totalRevenue, computeAvg, activeEmployees, groupBy, normalizeKey } from '../../utils/displayUtils';

type CompMode = 'zone' | 'state' | 'rm' | 'bm' | 'employee';

interface CompMetrics {
  name: string;
  empCount: number;
  revenue: number;
  contribPct: number;
  ach: number;
  growth: number;
  cov: number;
}

function compute(emps: Employee[], name: string, poolTotal: number): CompMetrics {
  const rev = totalRevenue(emps);
  return {
    name, empCount: emps.length, revenue: rev,
    contribPct: poolTotal > 0 ? (rev / poolTotal) * 100 : 0,
    ach: computeAvg(emps, 'apr_ach') * 100,
    growth: computeAvg(emps, 'growth') * 100,
    cov: computeAvg(emps, 'april26_cov') * 100,
  };
}

const MODES: { key: CompMode; label: string }[] = [
  { key: 'zone', label: 'Zone vs Zone' },
  { key: 'state', label: 'State vs State' },
  { key: 'rm', label: 'RM vs RM' },
  { key: 'bm', label: 'BM vs BM' },
  { key: 'employee', label: 'Employee vs Employee' },
];

export function InlineComparison({ employees }: { employees: Employee[] }) {
  const [mode, setMode] = useState<CompMode>('zone');
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [vsAvg, setVsAvg] = useState(false);

  const active = useMemo(() => activeEmployees(employees), [employees]);
  const poolTotal = useMemo(() => totalRevenue(active), [active]);

  const groups = useMemo(() => {
    if (mode === 'zone') {
      return [...groupBy(active.filter(e => e.zone), e => normalizeKey(String(e.zone))).entries()]
        .map(([name, emps]) => compute(emps, name, poolTotal)).sort((a, b) => b.revenue - a.revenue);
    }
    if (mode === 'state') {
      return [...groupBy(active.filter(e => e.state), e => normalizeKey(String(e.state))).entries()]
        .map(([name, emps]) => compute(emps, name, poolTotal)).sort((a, b) => b.revenue - a.revenue);
    }
    if (mode === 'rm') {
      return active.filter(e => e.dsgn === 'RM' && e.name).map(e => compute([e], String(e.name), poolTotal))
        .sort((a, b) => b.revenue - a.revenue);
    }
    if (mode === 'bm') {
      return active.filter(e => e.dsgn === 'BM' && e.name).map(e => compute([e], String(e.name), poolTotal))
        .sort((a, b) => b.revenue - a.revenue);
    }
    return active.filter(e => e.name).map(e => compute([e], String(e.name), poolTotal))
      .sort((a, b) => b.revenue - a.revenue);
  }, [active, mode, poolTotal]);

  const companyAvg = useMemo(() => compute(active, 'Company Average', poolTotal), [active, poolTotal]);

  const entityA = groups.find(g => g.name === selectedA);
  const entityB = vsAvg ? companyAvg : groups.find(g => g.name === selectedB);

  const METRICS: { label: string; a: number; b: number; fmt: (v: number) => string }[] = entityA && entityB ? [
    { label: 'Employees', a: entityA.empCount, b: entityB.empCount, fmt: v => fmt(v, 0) },
    { label: 'Revenue', a: entityA.revenue, b: entityB.revenue, fmt: fmtMoney },
    { label: 'Contribution', a: entityA.contribPct, b: entityB.contribPct, fmt: v => fmtPct(v) },
    { label: 'Achievement', a: entityA.ach, b: entityB.ach, fmt: v => fmtPct(v) },
    { label: 'Growth', a: entityA.growth, b: entityB.growth, fmt: v => fmtPct(v) },
    { label: 'Coverage', a: entityA.cov, b: entityB.cov, fmt: v => fmtPct(v) },
  ] : [];

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Equal className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-bold text-slate-900">Comparison Engine</h2>
      </div>
      <div className="flex flex-wrap gap-1 mb-4">
        {MODES.map(m => (
          <button key={m.key} onClick={() => { setMode(m.key); setSelectedA(''); setSelectedB(''); setVsAvg(false); }}
            className={`text-xs px-3 py-1.5 rounded-lg ${mode === m.key ? 'bg-indigo-100 text-indigo-800 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}>
            {m.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <select value={selectedA} onChange={e => setSelectedA(e.target.value)} className="text-sm px-3 py-2 border border-slate-200 rounded-lg">
          <option value="">Select entity A</option>
          {groups.slice(0, 50).map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
        </select>
        <select value={vsAvg ? '__avg__' : selectedB} onChange={e => { if (e.target.value === '__avg__') { setVsAvg(true); setSelectedB(''); } else { setVsAvg(false); setSelectedB(e.target.value); } }}
          className="text-sm px-3 py-2 border border-slate-200 rounded-lg">
          <option value="">Select entity B</option>
          <option value="__avg__">Company Average</option>
          {groups.slice(0, 50).map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-slate-600 px-2">
          <input type="checkbox" checked={vsAvg} onChange={e => setVsAvg(e.target.checked)} className="rounded" />
          Compare B to company average
        </label>
      </div>
      {entityA && entityB ? (
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-slate-50 text-xs font-semibold text-slate-500">
            <span>Metric</span><span className="text-right">{entityA.name}</span><span className="text-right">{entityB.name}</span>
          </div>
          {METRICS.map(m => {
            const diff = m.a !== 0 ? ((m.b - m.a) / m.a) * 100 : 0;
            return (
              <div key={m.label} className="grid grid-cols-3 gap-2 px-4 py-2 border-t border-slate-50 text-sm">
                <span className="text-slate-500 text-xs">{m.label}</span>
                <span className="text-right font-medium">{m.fmt(m.a)}</span>
                <span className="text-right font-medium flex items-center justify-end gap-1">
                  {m.fmt(m.b)}
                  {Math.abs(diff) > 1 && (diff > 0 ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-red-500" />)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-6">Select two entities to compare performance metrics from live Excel data.</p>
      )}
    </section>
  );
}
