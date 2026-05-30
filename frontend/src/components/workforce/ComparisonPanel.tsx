import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkforce, type Employee } from '../../contexts/WorkforceContext';
import { X, Equal, ArrowUp, ArrowDown } from 'lucide-react';
import {
  fmt, fmtPct, fmtHrs, fmtDays, fmtMoney, totalRevenue,
  computeAvg, activeEmployees, groupBy,
} from '../../utils/displayUtils';

interface CompMetrics {
  name: string;
  empCount: number;
  revenue: number;
  contribPct: number;
  ach: number;
  growth: number;
  cov: number;
  inv: number;
  hrs: number;
}

function compute(emps: Employee[], name: string): CompMetrics {
  const totalAll = totalRevenue(activeEmployees(emps));
  const rev = totalRevenue(emps);
  return {
    name,
    empCount: emps.length,
    revenue: rev,
    contribPct: totalAll > 0 ? (rev / totalAll) * 100 : 0,
    ach: computeAvg(emps, 'apr_ach'),
    growth: computeAvg(emps, 'growth'),
    cov: computeAvg(emps, 'april26_cov'),
    inv: computeAvg(emps, 'apr26_inv_days'),
    hrs: computeAvg(emps, 'april26_avg_working_hrs'),
  };
}

const METRICS: { key: keyof CompMetrics; label: string; fmt: (v: number) => string }[] = [
  { key: 'empCount', label: 'Employees', fmt: v => fmt(v, 0) },
  { key: 'revenue', label: 'Revenue', fmt: fmtMoney },
  { key: 'contribPct', label: 'Contribution', fmt: v => fmtPct(v) },
  { key: 'ach', label: 'Achievement', fmt: v => fmtPct(v) },
  { key: 'growth', label: 'Growth', fmt: v => fmtPct(v) },
  { key: 'cov', label: 'Coverage', fmt: v => fmtPct(v) },
  { key: 'inv', label: 'Inventory', fmt: v => fmtDays(v) },
  { key: 'hrs', label: 'Work Hours', fmt: v => fmtHrs(v) },
];

export function ComparisonPanel() {
  const { employees, comparisonPanel, closeComparisonPanel } = useWorkforce();
  const [tab, setTab] = useState<'hq' | 'bm' | 'rm'>('hq');
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');

  const active = useMemo(() => activeEmployees(employees), [employees]);

  const groups = useMemo(() => {
    if (tab === 'hq') {
      const g = groupBy(active.filter(e => e.hq), e => String(e.hq || ''));
      return [...g.entries()].map(([name, emps]) => compute(emps, name)).sort((a, b) => b.revenue - a.revenue);
    }
    if (tab === 'bm') {
      const g = groupBy(active.filter(e => e.dsgn === 'BM' && e.name), e => String(e.name || ''));
      return [...g.entries()].map(([name, emps]) => compute(emps, name)).sort((a, b) => b.revenue - a.revenue);
    }
    const g = groupBy(active.filter(e => e.dsgn === 'RM' && e.name), e => String(e.name || ''));
    return [...g.entries()].map(([name, emps]) => compute(emps, name)).sort((a, b) => b.revenue - a.revenue);
  }, [active, tab]);

  const entityA = useMemo(() => groups.find(g => g.name === selectedA), [groups, selectedA]);
  const entityB = useMemo(() => groups.find(g => g.name === selectedB), [groups, selectedB]);

  const options = groups.slice(0, 30);

  const Cell = ({ a, b, metric }: { a: CompMetrics | undefined; b: CompMetrics | undefined; metric: typeof METRICS[0] }) => {
    const valA = a ? a[metric.key] : 0;
    const valB = b ? b[metric.key] : 0;
    const diff = Number(valA) > 0 ? ((Number(valB) - Number(valA)) / Number(valA)) * 100 : 0;
    const isPos = diff > 1;
    return (
      <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-50 text-xs">
        <span className="text-slate-500">{metric.label}</span>
        <span className="text-right font-medium text-slate-900">{metric.fmt(Number(valA))}</span>
        <div className="flex items-center justify-end gap-1">
          <span className="font-medium text-slate-900">{metric.fmt(Number(valB))}</span>
          {Math.abs(diff) > 1 && (
            <span className={`text-[9px] ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPos ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
              {fmt(Math.abs(diff), 0)}%
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {comparisonPanel && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeComparisonPanel} className="fixed inset-0 bg-black/30 z-50" />
          <motion.div initial={{ opacity: 0, x: 400 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Equal className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">Comparison</h3>
              </div>
              <button onClick={closeComparisonPanel} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab selector */}
            <div className="flex gap-1 px-5 py-2 border-b border-slate-100">
              {(['hq', 'bm', 'rm'] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setSelectedA(''); setSelectedB(''); }}
                  className={`text-xs px-3 py-1.5 rounded-lg ${tab === t ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}>
                  {t === 'hq' ? 'HQ' : t === 'bm' ? 'BM' : 'RM'}
                </button>
              ))}
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-2 gap-3 px-5 py-3 border-b border-slate-100">
              <select value={selectedA} onChange={e => setSelectedA(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400">
                <option value="">Select A</option>
                {options.map(o => <option key={o.name} value={o.name}>{o.name}</option>)}
              </select>
              <select value={selectedB} onChange={e => setSelectedB(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400">
                <option value="">Select B</option>
                {options.map(o => <option key={o.name} value={o.name}>{o.name}</option>)}
              </select>
            </div>

            {/* Comparison table */}
            <div className="flex-1 overflow-y-auto p-5">
              {selectedA && selectedB && entityA && entityB ? (
                <div>
                  <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-200 text-[9px] text-slate-400 uppercase font-semibold">
                    <span>Metric</span>
                    <span className="text-right">{entityA.name}</span>
                    <span className="text-right">{entityB.name}</span>
                  </div>
                  <div className="mt-1">
                    {METRICS.map(m => <Cell key={m.key} a={entityA} b={entityB} metric={m} />)}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Equal className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select two entities to compare</p>
                  <p className="text-xs mt-1">Compare HQ, BM, or RM performance side by side</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}