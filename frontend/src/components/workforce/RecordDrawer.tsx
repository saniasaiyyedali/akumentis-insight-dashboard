import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkforce, type Employee } from '../../contexts/WorkforceContext';
import {
  X, User, Target,
  Activity,
  Trophy, BarChart3, DollarSign, ArrowUp, ArrowDown, Minus, ChevronRight,
} from 'lucide-react';
import { useEffect } from 'react';
import {
  toNum, fmt, fmtPct, fmtHrs, fmtDays, fmtMoney, totalRevenue,
  healthScore, healthStatus, healthColor, getBadges, computeAvg,
} from '../../utils/displayUtils';

function computeRank(emp: Employee, pool: Employee[], field: string): { rank: number; total: number; pct: number } {
  const sorted = pool.filter(e => toNum(e[field]) > 0).sort((a, b) => toNum(b[field]) - toNum(a[field]));
  const idx = sorted.findIndex(e => e.empCode === emp.empCode || e.name === emp.name);
  const rank = idx >= 0 ? idx + 1 : sorted.length;
  const total = sorted.length;
  return { rank, total, pct: total > 0 ? Math.round((1 - rank / total) * 100) : 50 };
}

export function RecordDrawer() {
  const { drawerRecord, closeDrawer, employees } = useWorkforce();

  useEffect(() => {
    if (!drawerRecord.visible) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [drawerRecord.visible, closeDrawer]);

  const emp = drawerRecord.employee as (Employee & { name?: string; empCode?: string }) | null;
  const activeEmps = useMemo(() => employees.filter(e => e.dsgn !== 'ABOLISHED' && e.name), [employees]);

  const ranks = useMemo(() => {
    if (!emp) return null;
    const hqPool = emp.hq ? activeEmps.filter(e => String(e.hq).toLowerCase() === String(emp.hq).toLowerCase()) : [];
    const statePool = emp.state ? activeEmps.filter(e => String(e.state).toLowerCase() === String(emp.state).toLowerCase()) : [];
    const zonePool = emp.zone ? activeEmps.filter(e => String(e.zone).toLowerCase() === String(emp.zone).toLowerCase()) : [];
    return {
      hq: hqPool.length > 1 ? computeRank(emp, hqPool, 'apr_ach') : null,
      state: statePool.length > 1 ? computeRank(emp, statePool, 'apr_ach') : null,
      zone: zonePool.length > 1 ? computeRank(emp, zonePool, 'apr_ach') : null,
      national: activeEmps.length > 1 ? computeRank(emp, activeEmps, 'apr_ach') : null,
    };
  }, [emp, activeEmps]);

  const managerChain = useMemo(() => {
    if (!emp) return [];
    const HIERARCHY = ['BU Head', 'NSM', 'ZM', 'SM', 'RM', 'BM'];
    const empRole = String(emp.dsgn || '').toUpperCase();
    const idx = HIERARCHY.indexOf(empRole);
    if (idx <= 0) return [];
    const chain: { role: string; name: string }[] = [];
    for (let i = 0; i < idx; i++) {
      const role = HIERARCHY[i];
      const candidates = activeEmps.filter(e => {
        if (e.dsgn?.toUpperCase() !== role.toUpperCase()) return false;
        if (e.name === emp.name || e.name === 'VACANCY' || e.name === 'VACANT') return false;
        const eZone = String(e.zone || '').toLowerCase();
        const empZone = String(emp.zone || '').toLowerCase();
        const eState = String(e.state || '').toLowerCase();
        const empState = String(emp.state || '').toLowerCase();
        const eHq = String(e.hq || '').toLowerCase();
        const empHq = String(emp.hq || '').toLowerCase();
        return (empHq && eHq === empHq) || (empState && eState === empState) || (empZone && eZone === empZone);
      });
      if (candidates.length > 0) {
        chain.push({ role, name: candidates[0].name || '' });
      }
    }
    return chain;
  }, [emp, activeEmps]);

  const ctx = useMemo(() => {
    if (!emp) return null;
    const nationalAch = computeAvg(activeEmps, 'apr_ach');
    const nationalGrowth = computeAvg(activeEmps, 'growth');
    const zonePool = emp.zone ? activeEmps.filter(e => String(e.zone).toLowerCase() === String(emp.zone).toLowerCase()) : [];
    const statePool = emp.state ? activeEmps.filter(e => String(e.state).toLowerCase() === String(emp.state).toLowerCase()) : [];
    const hqPool = emp.hq ? activeEmps.filter(e => String(e.hq).toLowerCase() === String(emp.hq).toLowerCase()) : [];
    return {
      ach: toNum(emp.apr_ach),
      growth: toNum(emp.growth),
      national: { ach: nationalAch, growth: nationalGrowth },
      zone: zonePool.length > 0 ? { ach: computeAvg(zonePool, 'apr_ach'), growth: computeAvg(zonePool, 'growth') } : null,
      state: statePool.length > 0 ? { ach: computeAvg(statePool, 'apr_ach'), growth: computeAvg(statePool, 'growth') } : null,
      hq: hqPool.length > 0 ? { ach: computeAvg(hqPool, 'apr_ach'), growth: computeAvg(hqPool, 'growth') } : null,
    };
  }, [emp, activeEmps]);

  if (!emp) return null;

  const score = healthScore(emp);
  const badges = getBadges(emp);
  const val = (key: string) => emp[key] !== undefined && emp[key] !== null ? String(emp[key]) : null;
  const rev = totalRevenue([emp]);
  const totalAllRev = totalRevenue(activeEmps);
  const contribPct = totalAllRev > 0 ? (rev / totalAllRev) * 100 : 0;

  const Section = ({ title, icon: Icon, color, children }: { title: string; icon: typeof User; color: string; children: React.ReactNode }) => (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-100">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-slate-500">{label}</span>
      <div className="text-right">
        <span className="text-xs font-medium text-slate-900">{value}</span>
        {sub && <span className="text-[10px] text-slate-400 ml-1">{sub}</span>}
      </div>
    </div>
  );

  const DiffField = ({ label, value, avg }: { label: string; value: string; avg: string }) => {
    const v = parseFloat(value);
    const a = parseFloat(avg);
    const diff = v - a;
    const isPos = diff > 0;
    const isNeg = diff < 0;
    return (
      <div className="flex items-center justify-between py-0.5">
        <span className="text-[10px] text-slate-500">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400">{avg}</span>
          <span className={`text-[10px] font-medium ${isPos ? 'text-emerald-600' : isNeg ? 'text-red-500' : 'text-slate-400'}`}>
            {value}
            {isPos ? <ArrowUp className="w-2.5 h-2.5 inline" /> : isNeg ? <ArrowDown className="w-2.5 h-2.5 inline" /> : <Minus className="w-2.5 h-2.5 inline" />}
          </span>
        </div>
      </div>
    );
  };

  const RankBadge = ({ rank, total, label }: { rank: number | null; total?: number; label: string }) => {
    if (!rank) return null;
    const isTop = rank <= Math.ceil((total || 1) * 0.1);
    return (
      <div className={`flex items-center justify-between py-1 px-2 rounded ${isTop ? 'bg-emerald-50' : 'bg-slate-50'}`}>
        <span className="text-[10px] text-slate-500">{label}</span>
        <span className={`text-xs font-semibold ${isTop ? 'text-emerald-700' : 'text-slate-700'}`}>
          #{rank} / {total}
        </span>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {drawerRecord.visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black/30 z-50"
          />
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-bold">
                    {String(emp.name || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">{String(emp.name || 'Unknown')}</h3>
                  {emp.empCode && <p className="text-[10px] text-slate-400">#{String(emp.empCode)}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${healthColor(score)}`}>
                  {score}/100 {healthStatus(score)}
                </div>
                <button onClick={closeDrawer} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="px-5 pt-3 flex flex-wrap gap-1">
                {badges.map((b, i) => (
                  <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full border ${b.color}`}>
                    {b.icon} {b.label}
                  </span>
                ))}
              </div>
            )}

            <div className="p-5 space-y-1">
              <Section title="Personal" icon={User} color="text-blue-600">
                <Field label="Name" value={String(emp.name || '-')} />
                {emp.empCode && <Field label="Emp Code" value={String(emp.empCode)} />}
                <Field label="Division" value={val('division') || '-'} />
                <Field label="Zone" value={val('zone') || '-'} />
                <Field label="State" value={val('state') || '-'} />
                <Field label="HQ" value={val('hq') || '-'} />
                <Field label="Role" value={val('dsgn') || '-'} />
              </Section>

              {managerChain.length > 0 && (
                <Section title="Manager Chain" icon={User} color="text-violet-600">
                  {managerChain.map((m, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs py-0.5">
                      <span className="text-slate-400 w-14 text-[10px]">{m.role}</span>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                      <span className="font-medium text-slate-800">{m.name}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1 text-xs py-0.5">
                    <span className="text-slate-400 w-14 text-[10px]">{String(emp.dsgn || '-')}</span>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="font-semibold text-blue-600">{emp.name}</span>
                  </div>
                </Section>
              )}

              <Section title="Revenue" icon={DollarSign} color="text-emerald-600">
                <Field label="Revenue" value={fmtMoney(rev)} />
                <Field label="Contribution" value={fmtPct(contribPct)} />
              </Section>

              <Section title="Performance" icon={Target} color="text-indigo-600">
                <Field label="Achievement %" value={fmtPct(toNum(emp.apr_ach))} />
                <Field label="Growth %" value={fmtPct(toNum(emp.growth))} sub={toNum(emp.growth) >= 0 ? '▲' : '▼'} />
                <Field label="Target" value={fmtMoney(toNum(emp.apr_26_tgt))} />
                <Field label="Actual (Net)" value={fmtMoney(toNum(emp.net_sale_apr_26))} />
                <Field label="Gross Sales" value={fmtMoney(toNum(emp.gross_sale_apr26))} />
                <Field label="Secondary Sales" value={fmtMoney(toNum(emp.apr26_sec_sales))} />
              </Section>

              {/* Contextual Performance */}
              {ctx && (
                <Section title="Contextual Performance" icon={BarChart3} color="text-violet-600">
                  <p className="text-[9px] text-slate-400 mb-1 font-medium">Achievement %</p>
                  <DiffField label="Employee" value={fmt(ctx.ach, 1)} avg={fmt(ctx.ach, 1)} />
                  {ctx.national && <DiffField label="National Avg" value={fmt(ctx.ach, 1)} avg={`${fmt(ctx.national.ach, 1)}%`} />}
                  {ctx.zone && <DiffField label="Zone Avg" value={fmt(ctx.ach, 1)} avg={`${fmt(ctx.zone.ach, 1)}%`} />}
                  {ctx.state && <DiffField label="State Avg" value={fmt(ctx.ach, 1)} avg={`${fmt(ctx.state.ach, 1)}%`} />}
                  {ctx.hq && <DiffField label="HQ Avg" value={fmt(ctx.ach, 1)} avg={`${fmt(ctx.hq.ach, 1)}%`} />}
                  <div className="border-t border-slate-50 my-1" />
                  <p className="text-[9px] text-slate-400 mb-1 font-medium">Growth %</p>
                  <DiffField label="Employee" value={fmt(ctx.growth, 1)} avg={fmt(ctx.growth, 1)} />
                  {ctx.national && <DiffField label="National Avg" value={fmt(ctx.growth, 1)} avg={`${fmt(ctx.national.growth, 1)}%`} />}
                  {ctx.zone && <DiffField label="Zone Avg" value={fmt(ctx.growth, 1)} avg={`${fmt(ctx.zone.growth, 1)}%`} />}
                  {ctx.state && <DiffField label="State Avg" value={fmt(ctx.growth, 1)} avg={`${fmt(ctx.state.growth, 1)}%`} />}
                  {ctx.hq && <DiffField label="HQ Avg" value={fmt(ctx.growth, 1)} avg={`${fmt(ctx.hq.growth, 1)}%`} />}
                </Section>
              )}

              <Section title="Operations" icon={Activity} color="text-teal-600">
                <Field label="Dr. Coverage" value={fmtPct(toNum(emp.april26_dr_coverage))} />
                <Field label="Chemist Met" value={fmtPct(toNum(emp.april26_chem_met))} />
                <Field label="Stock Met" value={fmtPct(toNum(emp.april26_stk_met))} />
                <Field label="Coverage %" value={fmtPct(toNum(emp.april26_cov))} />
                <Field label="Working Hours" value={fmtHrs(toNum(emp.april26_avg_working_hrs))} />
                <Field label="Inventory Days" value={fmtDays(toNum(emp.apr26_inv_days))} />
                <Field label="Doctors/Day" value={fmt(toNum(emp.april26_dr_avg), 1)} />
              </Section>

              <Section title="Rankings" icon={Trophy} color="text-amber-600">
                <RankBadge rank={ranks?.national?.rank ?? null} total={ranks?.national?.total ?? undefined} label="National" />
                <RankBadge rank={ranks?.zone?.rank ?? null} total={ranks?.zone?.total ?? undefined} label="Zone" />
                <RankBadge rank={ranks?.state?.rank ?? null} total={ranks?.state?.total ?? undefined} label="State" />
                <RankBadge rank={ranks?.hq?.rank ?? null} total={ranks?.hq?.total ?? undefined} label="HQ" />
              </Section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}