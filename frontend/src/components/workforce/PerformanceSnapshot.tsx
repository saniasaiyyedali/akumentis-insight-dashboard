import { useMemo } from 'react';
import { type Employee } from '../../contexts/WorkforceContext';
import {
  toNum, fmt, fmtMoney, totalRevenue,
} from '../../utils/displayUtils';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';

const ROLES = ['ZM', 'SM', 'RM', 'BM'] as const;

function roleFilter(emps: Employee[], role: string): Employee[] {
  if (role === 'ZM') return emps.filter(e => e.dsgn?.toUpperCase() === 'ZM');
  if (role === 'SM') return emps.filter(e => e.dsgn?.toUpperCase() === 'SM');
  if (role === 'RM') return emps.filter(e => e.dsgn?.toUpperCase() === 'RM');
  return emps.filter(e => e.dsgn?.toUpperCase() === 'BM');
}

export function PerformanceSnapshot({ employees, onOpenDrawer }: {
  employees: Employee[]; onOpenDrawer: (emp: Employee) => void;
}) {
  const all = useMemo(() => employees.filter(e => e.dsgn !== 'ABOLISHED' && e.name), [employees]);

  const rankings = useMemo(() => {
    const result: Record<string, { top: Employee[]; bottom: Employee[] }> = {};
    for (const role of ROLES) {
      const pool = roleFilter(all, role).filter(e => toNum(e.apr_ach) > 0 && e.name && e.name !== 'VACANCY' && e.name !== 'VACANT');
      const sorted = [...pool].sort((a, b) => toNum(b.apr_ach) - toNum(a.apr_ach));
      result[role] = {
        top: sorted.slice(0, 3),
        bottom: sorted.slice(-3).reverse(),
      };
    }
    return result;
  }, [all]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-bold text-slate-900">Executive Performance</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {ROLES.map(role => (
          <div key={role} className="space-y-2">
            <SnapCard role={role} items={rankings[role].top} variant="top" onOpenDrawer={onOpenDrawer} />
            <SnapCard role={role} items={rankings[role].bottom} variant="bottom" onOpenDrawer={onOpenDrawer} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SnapCard({ role, items, variant, onOpenDrawer }: {
  role: string; items: Employee[]; variant: 'top' | 'bottom';
  onOpenDrawer: (emp: Employee) => void;
}) {
  const isTop = variant === 'top';
  const accent = isTop ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50';
  const textColor = isTop ? 'text-emerald-700' : 'text-red-700';
  const Icon = isTop ? TrendingUp : TrendingDown;

  return (
    <div className={`border rounded-lg p-2 ${accent}`}>
      <div className="flex items-center gap-1 mb-1.5">
        {isTop ? <Trophy className="w-3 h-3 text-amber-500" /> : <Icon className="w-3 h-3 text-red-500" />}
        <span className={`text-[9px] font-bold uppercase tracking-wider ${textColor}`}>
          {isTop ? 'Top' : 'Bottom'} {role}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-[9px] text-slate-400 py-1">No data</p>
      ) : (
        <div className="space-y-1">
          {items.map((emp, i) => {
            const rev = totalRevenue([emp]);
            return (
              <div key={i} onClick={() => onOpenDrawer(emp)}
                className="flex items-center justify-between text-[10px] py-0.5 px-1 rounded hover:bg-white/80 cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 truncate max-w-[80px]">{emp.name}</p>
                  <p className="text-[8px] text-slate-400">{fmtMoney(rev)} · {fmt(toNum(emp.apr_ach), 0)}% ach</p>
                </div>
                <span className={`text-[9px] font-semibold ${textColor}`}>
                  {isTop ? `#${i + 1}` : `#${items.length - i}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
