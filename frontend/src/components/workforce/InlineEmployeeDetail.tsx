import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, User, Target, Activity, Trophy, DollarSign, BarChart3, X } from 'lucide-react';
import { type Employee } from '../../contexts/WorkforceContext';
import {
  toNum, fmtPct, fmtHrs, fmtDays, fmtMoney, totalRevenue,
  healthScore, healthStatus, healthColor, getBadges, computeAvg, activeEmployees,
} from '../../utils/displayUtils';

function computeRank(emp: Employee, pool: Employee[], field: string): { rank: number; total: number } {
  const sorted = pool.filter(e => toNum(e[field]) > 0).sort((a, b) => toNum(b[field]) - toNum(a[field]));
  const idx = sorted.findIndex(e =>
    (e.empCode && emp.empCode && e.empCode === emp.empCode) ||
    (e.empcode && emp.empcode && e.empcode === emp.empcode) ||
    e.name === emp.name
  );
  return { rank: idx >= 0 ? idx + 1 : sorted.length, total: sorted.length };
}

interface InlineEmployeeDetailProps {
  employee: Employee;
  allEmployees: Employee[];
  onClose?: () => void;
  compact?: boolean;
}

export function InlineEmployeeDetail({ employee: emp, allEmployees, onClose, compact }: InlineEmployeeDetailProps) {
  const activeEmps = useMemo(() => activeEmployees(allEmployees), [allEmployees]);

  const managerChain = useMemo(() => {
    const HIERARCHY = ['BU HEAD', 'NSM', 'ZM', 'SM', 'RM', 'BM'];
    const empRole = String(emp.dsgn || '').trim().toUpperCase();
    const idx = HIERARCHY.indexOf(empRole);
    if (idx <= 0) return [];
    const chain: { role: string; name: string }[] = [];
    for (let i = 0; i < idx; i++) {
      const role = HIERARCHY[i];
      const candidates = activeEmps.filter(e => {
        if (String(e.dsgn || '').trim().toUpperCase() !== role) return false;
        if (!e.name || e.name === emp.name) return false;
        const eZone = String(e.zone || '').toLowerCase();
        const empZone = String(emp.zone || '').toLowerCase();
        const eState = String(e.state || '').toLowerCase();
        const empState = String(emp.state || '').toLowerCase();
        const eHq = String(e.hq || '').toLowerCase();
        const empHq = String(emp.hq || '').toLowerCase();
        return (empHq && eHq === empHq) || (empState && eState === empState) || (empZone && eZone === empZone);
      });
      if (candidates.length > 0) chain.push({ role, name: String(candidates[0].name) });
    }
    return chain;
  }, [emp, activeEmps]);

  const ranks = useMemo(() => {
    const bmPool = activeEmps.filter(e => e.dsgn === 'BM');
    const rmPool = activeEmps.filter(e => e.dsgn === 'RM');
    const zonePool = emp.zone ? activeEmps.filter(e => String(e.zone).toLowerCase() === String(emp.zone).toLowerCase()) : [];
    return {
      bm: bmPool.length > 1 ? computeRank(emp, bmPool, 'net_sale_apr_26') : null,
      rm: rmPool.length > 1 ? computeRank(emp, rmPool, 'net_sale_apr_26') : null,
      zone: zonePool.length > 1 ? computeRank(emp, zonePool, 'net_sale_apr_26') : null,
    };
  }, [emp, activeEmps]);

  const score = healthScore(emp);
  const badges = getBadges(emp);
  const rev = totalRevenue([emp]);
  const totalAllRev = totalRevenue(activeEmps);
  const contribPct = totalAllRev > 0 ? (rev / totalAllRev) * 100 : 0;
  const ach = toNum(emp.apr_ach) * 100;
  const gr = toNum(emp.growth) * 100;
  const cov = toNum(emp.april26_cov) * 100;

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-xs font-medium text-slate-900">{value}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-slate-50 border border-blue-200 rounded-xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{String(emp.name || '?').charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 truncate">{String(emp.name || 'Unknown')}</h3>
            <p className="text-[10px] text-slate-400">{String(emp.dsgn || '-')} · {String(emp.hq || '-')} · {String(emp.zone || '-')}</p>
          </div>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${healthColor(score)}`}>
            {score}/100 {healthStatus(score)}
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {badges.length > 0 && (
        <div className="px-4 pt-2 flex flex-wrap gap-1">
          {badges.map((b, i) => (
            <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full border ${b.color}`}>{b.icon} {b.label}</span>
          ))}
        </div>
      )}

      <div className={`p-4 grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        <div>
          <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-200">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Identity</span>
          </div>
          <Field label="Emp Code" value={String(emp.empCode || emp.empcode || '-')} />
          <Field label="Division" value={String(emp.division || '-')} />
          <Field label="State" value={String(emp.state || '-')} />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-200">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Revenue</span>
          </div>
          <Field label="Net Sales" value={fmtMoney(rev)} />
          <Field label="Gross Sales" value={fmtMoney(toNum(emp.gross_sale_apr26))} />
          <Field label="Secondary Sales" value={fmtMoney(toNum(emp.apr26_sec_sales))} />
          <Field label="Target" value={fmtMoney(toNum(emp.apr_26_tgt))} />
          <Field label="Contribution" value={fmtPct(contribPct)} />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-200">
            <Target className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Performance</span>
          </div>
          <Field label="Achievement" value={fmtPct(ach)} />
          <Field label="Growth" value={`${gr >= 0 ? '+' : ''}${fmtPct(gr)}`} />
          <Field label="Coverage" value={fmtPct(cov)} />
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-200">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Rankings</span>
          </div>
          {ranks.zone && <Field label="Zone Rank" value={`#${ranks.zone.rank} / ${ranks.zone.total}`} />}
          {ranks.rm && <Field label="RM Rank" value={`#${ranks.rm.rank} / ${ranks.rm.total}`} />}
          {ranks.bm && <Field label="BM Rank" value={`#${ranks.bm.rank} / ${ranks.bm.total}`} />}
        </div>
      </div>

      {(managerChain.length > 0 || emp.zone) && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Hierarchy Path</span>
          </div>
          <p className="text-xs text-slate-600 mb-2">
            {[emp.division, emp.zone, emp.state, emp.hq, emp.dsgn, emp.name].filter(Boolean).join(' → ')}
          </p>
          {managerChain.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 text-xs">
              {managerChain.map((m, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                  <span className="text-slate-400">{m.role}</span>
                  <span className="font-medium text-slate-800">{m.name}</span>
                </span>
              ))}
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="font-semibold text-blue-600">{String(emp.name)}</span>
            </div>
          )}
        </div>
      )}

      {!compact && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-4 mx-4 mb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Operations</span>
            </div>
            <Field label="Dr. Coverage" value={fmtPct(toNum(emp.april26_dr_coverage) * 100)} />
            <Field label="Working Hours" value={fmtHrs(toNum(emp.april26_avg_working_hrs))} />
            <Field label="Inventory Days" value={fmtDays(toNum(emp.apr26_inv_days))} />
            <Field label="Stock Met" value={fmtPct(toNum(emp.april26_stk_met) * 100)} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Peer Comparison</span>
            </div>
            <Field label="Zone Avg Ach" value={fmtPct(computeAvg(activeEmps.filter(e => String(e.zone) === String(emp.zone)), 'apr_ach') * 100)} />
            <Field label="National Avg Ach" value={fmtPct(computeAvg(activeEmps, 'apr_ach') * 100)} />
            <Field label="National Avg Growth" value={fmtPct(computeAvg(activeEmps, 'growth') * 100)} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
