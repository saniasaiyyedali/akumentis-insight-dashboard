import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkforce, type Employee } from '../../contexts/WorkforceContext';
import {
  X, ChevronRight, Users, Globe,
  DollarSign, Percent,
} from 'lucide-react';
import { toNum, fmt, fmtMoney, totalRevenue, groupBy, topN } from '../../utils/displayUtils';

type LevelKey = 'zone' | 'state' | 'hq' | 'employee';

const HIERARCHY: LevelKey[] = ['zone', 'state', 'hq'];

interface LevelData {
  key: string;
  label: string;
  count: number;
  revenue: number;
  contribPct: number;
  emps: Employee[];
  children: LevelData[];
}

function buildLevels(emps: Employee[], startIdx: number): LevelData[] {
  if (startIdx >= HIERARCHY.length) return [];
  const key = HIERARCHY[startIdx];
  const groups = groupBy(emps, e => String(e[key] || 'Unknown'));
  const totalRev = totalRevenue(emps);
  return [...groups.entries()]
    .map(([label, groupEmps]) => {
      const rev = totalRevenue(groupEmps);
      return {
        key,
        label,
        count: groupEmps.length,
        revenue: rev,
        contribPct: totalRev > 0 ? (rev / totalRev) * 100 : 0,
        emps: groupEmps,
        children: buildLevels(groupEmps, startIdx + 1),
      };
    })
    .sort((a, b) => b.count - a.count);
}

function fmtContrib(v: number) {
  if (v >= 10) return `${fmt(v, 0)}%`;
  if (v >= 1) return `${fmt(v, 1)}%`;
  return `${fmt(v, 2)}%`;
}

export function DrilldownPanel() {
  const {
    drilldownPanel, closeDrilldownPanel,
    openDrawer,
  } = useWorkforce();

  const [path, setPath] = useState<LevelData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!drilldownPanel) return;
    setEmployees(drilldownPanel.records);
    setLabel(drilldownPanel.label);
    setPath([]);
  }, [drilldownPanel]);

  useEffect(() => {
    if (!drilldownPanel) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrilldownPanel(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [drilldownPanel, closeDrilldownPanel]);

  const levels = useMemo(() => {
    if (employees.length === 0) return [];
    return buildLevels(employees, 0);
  }, [employees]);

  const currentItems = useMemo(() => {
    if (path.length === 0) return levels;
    const last = path[path.length - 1];
    return last.children;
  }, [path, levels]);

  const currentLevel = path.length;

  const handleDrill = (item: LevelData) => {
    setPath(prev => [...prev, item]);
  };

  const handleBack = (idx: number) => {
    setPath(prev => prev.slice(0, idx));
  };

  const currentEmps = useMemo(() => {
    if (path.length === 0) return employees;
    return path[path.length - 1].emps;
  }, [path, employees]);

  const totalRev = useMemo(() => totalRevenue(employees), [employees]);

  const Bar = ({ pct }: { pct: number }) => (
    <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden shrink-0">
      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );

  if (!drilldownPanel) return null;

  return (
    <AnimatePresence>
      {drilldownPanel && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrilldownPanel}
            className="fixed inset-0 bg-black/30 z-50"
          />
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                <h3 className="text-sm font-semibold text-slate-900 truncate">{label}</h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                  {employees.length}
                </span>
              </div>
              <button onClick={closeDrilldownPanel} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 px-5 py-2 border-b border-slate-100 text-xs text-slate-500 overflow-x-auto shrink-0">
              <button onClick={() => { setPath([]); }} className="hover:text-blue-600 px-1.5 py-0.5 rounded hover:bg-blue-50 shrink-0">
                {label.split(':')[0]}
              </button>
              {path.map((p, i) => (
                <span key={p.label} className="flex items-center gap-1 shrink-0">
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <button
                    onClick={() => handleBack(i)}
                    className={`px-1.5 py-0.5 rounded hover:bg-blue-50 ${i === path.length - 1 ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:text-blue-600'}`}
                  >
                    {p.label}
                  </button>
                </span>
              ))}
            </div>

            {/* Summary bar */}
            <div className="flex items-center gap-4 px-5 py-2 border-b border-slate-100 text-xs text-slate-500 shrink-0">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {currentEmps.length} employees</span>
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {fmtMoney(totalRev)}</span>
              <span className="flex items-center gap-1"><Percent className="w-3 h-3" /> 100%</span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {currentLevel < HIERARCHY.length ? (
                /* Hierarchy levels */
                <div className="p-4 space-y-1">
                  {currentItems.map((item) => {
                    const pctOfParent = totalRev > 0 ? (item.revenue / totalRev) * 100 : 0;
                    const isDrilled = path.length > 0 && path[path.length - 1].label === item.label;
                    return (
                      <div
                        key={`${item.key}-${item.label}`}
                        onClick={() => handleDrill(item)}
                        className={`flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer transition-all ${isDrilled ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${isDrilled ? 'text-blue-700' : 'text-slate-800'}`}>{item.label}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{item.count}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                            <span>{fmtMoney(item.revenue)}</span>
                            <Bar pct={pctOfParent} />
                            <span>{fmtContrib(item.contribPct)}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Employee list */
                <div className="p-4">
                  <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    Employees in {path.length > 0 ? path[path.length - 1].label : label}
                  </h4>
                  <div className="space-y-0.5">
                    {topN(currentEmps, e => toNum(e.apr_ach), 200).map((emp, i) => {
                      const rev = totalRevenue([emp]);
                      const contribPct = totalRev > 0 ? (rev / totalRev) * 100 : 0;
                      return (
                        <div
                          key={`emp-${i}`}
                          onClick={() => openDrawer(emp)}
                          className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-blue-50/50 cursor-pointer transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                            <span className="text-white text-[8px] font-bold">
                              {String(emp.name || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-slate-700 truncate flex-1">{String(emp.name || '-')}</span>
                          <span className="text-[10px] text-slate-400 w-12 truncate">{String(emp.hq || '-')}</span>
                          <span className="text-[10px] text-slate-400 w-8">{String(emp.dsgn || '-')}</span>
                          <span className="text-[10px] font-semibold text-emerald-600 w-14 text-right">{fmtMoney(rev)}</span>
                          <span className="text-[10px] text-slate-400 w-10 text-right">{fmtContrib(contribPct)}</span>
                          <span className="text-[10px] font-semibold text-indigo-600 w-12 text-right">{toNum(emp.apr_ach) > 0 ? `${fmt(toNum(emp.apr_ach), 1)}%` : '-'}</span>
                        </div>
                      );
                    })}
                    {currentEmps.length > 200 && (
                      <p className="text-xs text-slate-400 text-center pt-2">Showing 200 of {currentEmps.length} employees</p>
                    )}
                    {currentEmps.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-8">No employees found</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}