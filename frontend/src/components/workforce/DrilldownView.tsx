import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Users, DollarSign, Percent, Target, ArrowUpRight } from 'lucide-react';
import { type Employee } from '../../contexts/WorkforceContext';
import { toNum, fmtMoney, fmtPct, normalizeKey, groupBy } from '../../utils/displayUtils';

type SlabType = 'achievement' | 'growth';

interface SlabInfo {
  name: string;
  count?: number;
  revenue?: number;
  contribPct?: number;
  emps: Employee[];
  color: string;
}

interface DrilldownProps {
  open: boolean;
  onClose: () => void;
  designation: string;
  slabType: SlabType;
  slab: SlabInfo;
  allActiveEmps: Employee[];
  onEmployeeClick?: (emp: Employee) => void;
}

interface PathStep {
  level: string;
  value: string;
  label: string;
}

const LEVELS = [
  { key: 'zone', label: 'Zone' },
  { key: 'state', label: 'State' },
  { key: 'hq', label: 'HQ' },
];

function sumRevenue(emps: Employee[]): number {
  return emps.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);
}

function avgMetric(emps: Employee[], field: string, isPct = false): number {
  const vals = emps.map(e => toNum(e[field]) * (isPct ? 100 : 1)).filter(v => v !== 0);
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

export function DrilldownView({ open, onClose, designation, slabType, slab, allActiveEmps }: DrilldownProps) {
  const [path, setPath] = useState<PathStep[]>([]);

  useEffect(() => {
    if (open) setPath([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [open, onClose]);

  const baseEmps = useMemo(() => slab.emps, [slab]);
  const totalRevAll = useMemo(() => sumRevenue(allActiveEmps), [allActiveEmps]);
  const totalRevSlab = useMemo(() => sumRevenue(baseEmps), [baseEmps]);
  const currentLevel = path.length;

  const groupedData = useMemo(() => {
    let filtered = [...baseEmps];
    for (const step of path) {
      if (step.level === 'zone') {
        filtered = filtered.filter(e => normalizeKey(String(e.zone)) === step.value);
      } else if (step.level === 'state') {
        filtered = filtered.filter(e => normalizeKey(String(e.state)) === step.value);
      } else if (step.level === 'hq') {
        filtered = filtered.filter(e => normalizeKey(String(e.hq)) === step.value);
      } else if (step.level === 'rm') {
        filtered = filtered.filter(e => e.dsgn === 'RM' ? e.name && String(e.name).trim() === step.value : true);
      }
    }
    return filtered;
  }, [baseEmps, path]);

  const currentItems = useMemo(() => {
    if (currentLevel === 0) {
      const groups = groupBy(groupedData, e => normalizeKey(String(e.zone || 'Unknown')));
      return [...groups.entries()].map(([name, g]) => ({
        name, count: g.length, revenue: sumRevenue(g),
        avgAch: avgMetric(g, 'apr_ach', true), avgGrowth: avgMetric(g, 'growth', true), emps: g,
      })).sort((a, b) => b.revenue - a.revenue);
    } else if (currentLevel === 1) {
      const groups = groupBy(groupedData, e => normalizeKey(String(e.state || 'Unknown')));
      return [...groups.entries()].map(([name, g]) => ({
        name, count: g.length, revenue: sumRevenue(g),
        avgAch: avgMetric(g, 'apr_ach', true), avgGrowth: avgMetric(g, 'growth', true), emps: g,
      })).sort((a, b) => b.revenue - a.revenue);
    } else if (currentLevel === 2) {
      const groups = groupBy(groupedData, e => normalizeKey(String(e.hq || 'Unknown')));
      return [...groups.entries()].map(([name, g]) => ({
        name, count: g.length, revenue: sumRevenue(g),
        avgAch: avgMetric(g, 'apr_ach', true), avgGrowth: avgMetric(g, 'growth', true), emps: g,
      })).sort((a, b) => b.revenue - a.revenue);
    } else {
      const rms = groupedData.filter(e => e.dsgn === 'RM');
      if (rms.length > 0) {
        return [...groupBy(rms, e => String(e.name || 'Unknown')).entries()].map(([name, g]) => ({
          name, count: g.length, revenue: sumRevenue(g),
          avgAch: avgMetric(g, 'apr_ach', true), avgGrowth: avgMetric(g, 'growth', true), emps: g, isRM: true,
        })).sort((a, b) => b.revenue - a.revenue);
      }
      return [{
        name: 'All Employees', count: groupedData.length, revenue: sumRevenue(groupedData),
        avgAch: avgMetric(groupedData, 'apr_ach', true), avgGrowth: avgMetric(groupedData, 'growth', true), emps: groupedData, isRM: false,
      }];
    }
  }, [groupedData, currentLevel]);

  const handleDrill = useCallback((name: string, isRM?: boolean) => {
    if (isRM) {
      setPath(prev => [...prev, { level: 'rm', value: name, label: name }]);
    } else {
      const nextLevel = LEVELS[currentLevel]?.key || 'hq';
      setPath(prev => [...prev, { level: nextLevel, value: name, label: name }]);
    }
  }, [currentLevel]);

  const handleBack = useCallback((index: number) => {
    if (index < 0) setPath([]);
    else setPath(prev => prev.slice(0, index + 1));
  }, []);

  const metricLabel = slabType === 'achievement' ? 'Avg Achievement' : 'Avg Growth';

  if (!open) return null;

  const getLevelLabel = () => {
    if (currentLevel === 0) return 'Zones';
    if (currentLevel === 1) return 'States';
    if (currentLevel === 2) return 'HQs';
    if (currentLevel === 3) return 'RMs';
    return 'Employees';
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 z-50" />
          <motion.div
            initial={{ opacity: 0, x: 500 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 500 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/20">{designation}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: slab.color + '33', color: slab.color }}>{slab.name}</span>
                </div>
                <h2 className="text-lg font-bold truncate">{designation} {slabType === 'achievement' ? 'Achievement' : 'Growth'}: {slab.name}</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 transition-colors shrink-0"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex items-center gap-2 px-6 py-2 border-b border-slate-200 bg-slate-50 shrink-0 overflow-x-auto">
              <button onClick={() => setPath([])} className="text-xs font-medium text-blue-600 hover:text-blue-800 px-1.5 py-0.5 rounded hover:bg-blue-50 whitespace-nowrap">All</button>
              {path.map((p, i) => (
                <span key={`${p.level}-${p.value}-${i}`} className="flex items-center gap-1 shrink-0">
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <button onClick={() => handleBack(i)} className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${i === path.length - 1 ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}>{p.label}</button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-6 px-6 py-3 border-b border-slate-200 bg-white shrink-0">
              <div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-500" /><span className="text-sm font-semibold text-slate-900">{groupedData.length}</span><span className="text-xs text-slate-500">employees</span></div>
              <div className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-500" /><span className="text-sm font-semibold text-slate-900">{fmtMoney(totalRevSlab)}</span><span className="text-xs text-slate-500">revenue</span></div>
              <div className="flex items-center gap-1.5"><Percent className="w-4 h-4 text-blue-500" /><span className="text-sm font-semibold text-slate-900">{totalRevAll > 0 ? fmtPct((totalRevSlab / totalRevAll) * 100) : '0%'}</span><span className="text-xs text-slate-500">contribution</span></div>
              <div className="flex items-center gap-1.5"><Target className="w-4 h-4 text-indigo-500" /><span className="text-sm font-semibold text-slate-900">{fmtPct(avgMetric(groupedData, slabType === 'achievement' ? 'apr_ach' : 'growth', true))}</span><span className="text-xs text-slate-500">{metricLabel}</span></div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-700">{getLevelLabel()} ({currentItems.length})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {currentItems.map(item => (
                    <button
                      key={item.name}
                      onClick={() => handleDrill(item.name, 'isRM' in item && item.isRM ? true : undefined)}
                      className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-900 truncate">{item.name}</span>
                        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Employees</span>
                          <span className="font-semibold text-slate-700">{item.count}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Revenue</span>
                          <span className="font-semibold text-emerald-600">{fmtMoney(item.revenue)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Achievement</span>
                          <span className={`font-semibold ${item.avgAch >= 90 ? 'text-emerald-600' : item.avgAch >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{fmtPct(item.avgAch)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Growth</span>
                          <span className={`font-semibold ${item.avgGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{item.avgGrowth >= 0 ? '+' : ''}{fmtPct(item.avgGrowth)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                  {currentItems.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400 text-sm">No data available for this selection</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}