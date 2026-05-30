import { useMemo } from 'react';
import { useWorkforce, type Employee } from '../contexts/WorkforceContext';
import { BreadcrumbNav } from '../components/workforce/BreadcrumbNav';
import { GlobalFilterBar } from '../components/workforce/GlobalFilterBar';
import { RecordDrawer } from '../components/workforce/RecordDrawer';
import { DrilldownPanel } from '../components/workforce/DrilldownPanel';
import { motion } from 'framer-motion';
import {
  Activity, Clock, Users, ShoppingCart, Stethoscope, FlaskConical,
  BarChart3,
} from 'lucide-react';
import {
  Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell,
} from 'recharts';
import {
  toNum, avg, fmtMoney, totalRevenue,
  activeEmployees, bestPerformerLabel, worstPerformerLabel, bestHQLabel, worstHQLabel,
} from '../utils/displayUtils';

function computeCoverageBuckets(emps: Employee[], field: string) {
  const above80 = emps.filter(e => toNum(e[field]) >= 80);
  const above60 = emps.filter(e => toNum(e[field]) >= 60 && toNum(e[field]) < 80);
  const below60 = emps.filter(e => toNum(e[field]) > 0 && toNum(e[field]) < 60);
  const noData = emps.filter(e => e.dsgn !== 'ABOLISHED' && e.name && (e[field] === null || e[field] === undefined || String(e[field]).trim() === ''));
  return {
    above80: above80.length,
    above60: above60.length,
    below60: below60.length,
    noData: noData.length,
    coveragePct: avg(emps.filter(e => e[field] !== null).map(e => toNum(e[field]))),
    buckets: { above80, above60, below60, noData },
  };
}

function computeMetric(emps: Employee[], field: string) {
  const vals = emps.map(e => toNum(e[field])).filter(v => v > 0);
  return {
    avg: avg(vals),
    min: vals.length > 0 ? Math.min(...vals) : 0,
    max: vals.length > 0 ? Math.max(...vals) : 0,
    count: vals.length,
  };
}

function CoverageCard({ title, icon: Icon, color, bg, stats, field, emps, onDrillDown }: {
  title: string; icon: typeof Activity; color: string; bg: string;
  stats: ReturnType<typeof computeCoverageBuckets>;
  field: string; emps: Employee[];
  onDrillDown: (records: Employee[], label: string) => void;
}) {
  const handleBucket = (bucket: Employee[], label: string) => {
    if (bucket.length === 0) return;
    const sorted = [...bucket].sort((a, b) => toNum(b[field]) - toNum(a[field]));
    onDrillDown(sorted, `${title}: ${label}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3 cursor-pointer" onClick={() => handleBucket(emps.filter(e => toNum(e[field]) > 0), `${title} All`)}>
        <div className={`p-1.5 rounded ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-400 ml-auto">{stats.coveragePct.toFixed(1)}% avg</span>
      </div>
      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(stats.coveragePct, 100)}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1 text-center mb-3">
        <div className="p-1 rounded bg-emerald-50 cursor-pointer hover:bg-emerald-100 transition-colors" onClick={() => handleBucket(stats.buckets.above80, '\u226580%')}>
          <p className="text-xs font-bold text-emerald-700">{stats.above80}</p>
          <p className="text-[9px] text-emerald-500">&ge;80%</p>
        </div>
        <div className="p-1 rounded bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => handleBucket(stats.buckets.above60, '60-80%')}>
          <p className="text-xs font-bold text-amber-700">{stats.above60}</p>
          <p className="text-[9px] text-amber-500">60-80%</p>
        </div>
        <div className="p-1 rounded bg-red-50 cursor-pointer hover:bg-red-100 transition-colors" onClick={() => handleBucket(stats.buckets.below60, '<60%')}>
          <p className="text-xs font-bold text-red-700">{stats.below60}</p>
          <p className="text-[9px] text-red-500">&lt;60%</p>
        </div>
        <div className="p-1 rounded bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleBucket(stats.buckets.noData, 'No Data')}>
          <p className="text-xs font-bold text-slate-700">{stats.noData}</p>
          <p className="text-[9px] text-slate-400">N/A</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-100 pt-2">
        <div>
          <span className="text-slate-400">Best: </span>
          <span className="font-medium text-emerald-600">{bestPerformerLabel(emps, field)}</span>
        </div>
        <div>
          <span className="text-slate-400">Worst: </span>
          <span className="font-medium text-red-500">{worstPerformerLabel(emps, field)}</span>
        </div>
        <div>
          <span className="text-slate-400">Best HQ: </span>
          <span className="font-medium text-emerald-600">{bestHQLabel(emps, field)}</span>
        </div>
        <div>
          <span className="text-slate-400">Worst HQ: </span>
          <span className="font-medium text-red-500">{worstHQLabel(emps, field)}</span>
        </div>
      </div>
    </motion.div>
  );
}

function MetricCard({ title, icon: Icon, color, bg, metric, suffix, field, emps, onDrillDown }: {
  title: string; icon: typeof Activity; color: string; bg: string;
  metric: { avg: number; min: number; max: number; count: number };
  suffix?: string; field: string; emps: Employee[];
  onDrillDown: (records: Employee[], label: string) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-blue-300 transition-colors"
      onClick={() => {
        const sorted = [...emps].filter(e => toNum(e[field]) > 0).sort((a, b) => toNum(b[field]) - toNum(a[field]));
        if (sorted.length > 0) onDrillDown(sorted, `${title} Ranking`);
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="p-2 rounded-lg border border-slate-100">
          <p className="text-[9px] text-slate-400">Avg</p>
          <p className="text-sm font-bold text-slate-900">{metric.avg}{suffix || ''}</p>
        </div>
        <div className="p-2 rounded-lg border border-slate-100">
          <p className="text-[9px] text-slate-400">Min</p>
          <p className="text-sm font-bold text-slate-900">{metric.min}{suffix || ''}</p>
        </div>
        <div className="p-2 rounded-lg border border-slate-100">
          <p className="text-[9px] text-slate-400">Max</p>
          <p className="text-sm font-bold text-slate-900">{metric.max}{suffix || ''}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-100 pt-2">
        <div>
          <span className="text-slate-400">Best: </span>
          <span className="font-medium text-emerald-600">{bestPerformerLabel(emps, field)}</span>
        </div>
        <div>
          <span className="text-slate-400">Worst: </span>
          <span className="font-medium text-red-500">{worstPerformerLabel(emps, field)}</span>
        </div>
        <div>
          <span className="text-slate-400">Best HQ: </span>
          <span className="font-medium text-emerald-600">{bestHQLabel(emps, field)}</span>
        </div>
        <div>
          <span className="text-slate-400">Worst HQ: </span>
          <span className="font-medium text-red-500">{worstHQLabel(emps, field)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export function Operations() {
  const { employees, showDrilldownPanel } = useWorkforce();

  const activeEmps = useMemo(() => activeEmployees(employees), [employees]);
  const totalRev = useMemo(() => totalRevenue(activeEmps), [activeEmps]);

  const drCoverage = useMemo(() => computeCoverageBuckets(activeEmps, 'april26_dr_coverage'), [activeEmps]);
  const chemCoverage = useMemo(() => computeCoverageBuckets(activeEmps, 'april26_chem_met'), [activeEmps]);
  const stockCoverage = useMemo(() => computeCoverageBuckets(activeEmps, 'april26_stk_met'), [activeEmps]);

  const workingHours = useMemo(() => computeMetric(activeEmps, 'april26_avg_working_hrs'), [activeEmps]);
  const inventoryDays = useMemo(() => computeMetric(activeEmps, 'apr26_inv_days'), [activeEmps]);
  const drsPerDay = useMemo(() => computeMetric(activeEmps, 'april26_dr_avg'), [activeEmps]);
  const compPct = useMemo(() => computeMetric(activeEmps, 'april26_comp'), [activeEmps]);
  const covPct = useMemo(() => computeMetric(activeEmps, 'april26_cov'), [activeEmps]);

  const crmData = useMemo(() => {
    const withData = activeEmps.filter(e => e.april26_crm_dr_count);
    const totalVisited = withData.reduce((s, e) => s + toNum(e.april26_crm_dr_visited_count), 0);
    const totalMissed = withData.reduce((s, e) => s + toNum(e.april26_crm_dr_missed_count), 0);
    const totalCount = withData.reduce((s, e) => s + toNum(e.april26_crm_dr_count), 0);
    return {
      visited: totalVisited, missed: totalMissed, total: totalCount,
      avgVisited: withData.length > 0 ? Math.round(totalVisited / withData.length * 10) / 10 : 0,
      avgMissed: withData.length > 0 ? Math.round(totalMissed / withData.length * 10) / 10 : 0,
      count: withData.length,
    };
  }, [activeEmps]);

  if (employees.length === 0) {
    return (
      <div className="space-y-5 pb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Operations</h1>
            <p className="text-xs text-slate-400">Loading operational data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Operations</h1>
          <p className="text-xs text-slate-400">
            {activeEmps.length} employees · {fmtMoney(totalRev)} revenue
          </p>
        </div>
      </motion.div>

      <BreadcrumbNav />
      <GlobalFilterBar />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CoverageCard title="Dr. Coverage" icon={Stethoscope} color="text-blue-600" bg="bg-blue-100" stats={drCoverage} field="april26_dr_coverage" emps={activeEmps} onDrillDown={showDrilldownPanel} />
        <CoverageCard title="Chemist Coverage" icon={FlaskConical} color="text-emerald-600" bg="bg-emerald-100" stats={chemCoverage} field="april26_chem_met" emps={activeEmps} onDrillDown={showDrilldownPanel} />
        <CoverageCard title="Stock Coverage" icon={ShoppingCart} color="text-amber-600" bg="bg-amber-100" stats={stockCoverage} field="april26_stk_met" emps={activeEmps} onDrillDown={showDrilldownPanel} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard title="Avg Working Hours" icon={Clock} color="text-indigo-600" bg="bg-indigo-100" metric={workingHours} suffix="h" field="april26_avg_working_hrs" emps={activeEmps} onDrillDown={showDrilldownPanel} />
        <MetricCard title="Inventory Days" icon={Activity} color="text-sky-600" bg="bg-sky-100" metric={inventoryDays} suffix="d" field="apr26_inv_days" emps={activeEmps} onDrillDown={showDrilldownPanel} />
        <MetricCard title="Doctors per Day" icon={Stethoscope} color="text-violet-600" bg="bg-violet-100" metric={drsPerDay} field="april26_dr_avg" emps={activeEmps} onDrillDown={showDrilldownPanel} />
        <MetricCard title="Compliance %" icon={Users} color="text-teal-600" bg="bg-teal-100" metric={compPct} suffix="%" field="april26_comp" emps={activeEmps} onDrillDown={showDrilldownPanel} />
        <MetricCard title="Coverage %" icon={BarChart3} color="text-amber-600" bg="bg-amber-100" metric={covPct} suffix="%" field="april26_cov" emps={activeEmps} onDrillDown={showDrilldownPanel} />
      </div>

      {/* CRM Visits */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-rose-600" />
          <h3 className="text-sm font-semibold text-slate-900">CRM Visit Analysis</h3>
          <span className="text-xs text-slate-400 ml-auto">{crmData.count} employees</span>
        </div>
        {crmData.total > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResponsiveContainer width="100%" height={200}>
              <RePieChart>
                <Pie data={[
                  { name: 'Visited', value: crmData.visited, count: crmData.visited },
                  { name: 'Missed', value: crmData.missed, count: crmData.missed },
                ]} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  onClick={(entry) => {
                    if (entry.name === 'Visited') showDrilldownPanel(activeEmps.filter(e => toNum(e.april26_crm_dr_visited_count) > 0), 'CRM Visited Doctors');
                    else showDrilldownPanel(activeEmps.filter(e => toNum(e.april26_crm_dr_missed_count) > 0), 'CRM Missed Doctors');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
            <div className="flex flex-col justify-center gap-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50">
                <span className="text-xs text-slate-700">Avg Visited</span>
                <span className="text-sm font-bold text-emerald-700">{crmData.avgVisited}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-red-50">
                <span className="text-xs text-slate-700">Avg Missed</span>
                <span className="text-sm font-bold text-red-700">{crmData.avgMissed}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50">
                <span className="text-xs text-slate-700">Visit Rate</span>
                <span className="text-sm font-bold text-blue-700">
                  {crmData.total > 0 ? Math.round((crmData.visited / crmData.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-slate-400">
            <Users className="w-6 h-6 mx-auto mb-2 opacity-30" />
            <p>No CRM visit data available</p>
          </div>
        )}
      </motion.div>

      <RecordDrawer />
      <DrilldownPanel />
    </div>
  );
}