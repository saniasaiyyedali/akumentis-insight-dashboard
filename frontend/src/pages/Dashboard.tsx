import { useMemo, useState } from 'react';
import { useWorkforce, type Employee } from '../contexts/WorkforceContext';
import { GlobalFilterBar } from '../components/workforce/GlobalFilterBar';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  AlertTriangle, RefreshCw, Clock, DollarSign, Target, TrendingUp,
  Users, UserCheck, BarChart3, Lightbulb, ChevronRight,
} from 'lucide-react';
import { toNum, fmtMoney, fmtPct, totalRevenue, activeEmployees, bms, rms, normalizeKey, groupBy } from '../utils/displayUtils';

const ACH_SLABS = [
  { name: '>100%', min: 100, max: Infinity, color: '#15803d' },
  { name: '90-100%', min: 90, max: 100, color: '#86efac' },
  { name: '80-90%', min: 80, max: 90, color: '#f59e0b' },
  { name: '<80%', min: -Infinity, max: 80, color: '#dc2626' },
];

const GROWTH_SLABS = [
  { name: '<0%', min: -Infinity, max: 0, color: '#dc2626' },
  { name: '0-10%', min: 0, max: 10, color: '#f97316' },
  { name: '10-20%', min: 10, max: 20, color: '#eab308' },
  { name: '20%+', min: 20, max: Infinity, color: '#15803d' },
];

interface SlabData {
  name: string;
  count: number;
  pct: number;
  revenue: number;
  emps: Employee[];
  color: string;
}

function pctVal(e: Employee, field: string): number {
  return toNum(e[field]) * 100;
}

function computeSlabs(emps: Employee[], slabDefs: typeof ACH_SLABS, field: 'apr_ach' | 'growth'): SlabData[] {
  const filtered = emps.filter(e => {
    const val = pctVal(e, field);
    if (field === 'apr_ach' && val <= 0) return false;
    return true;
  });
  const total = filtered.length;

  return slabDefs.map(slab => {
    const matching = filtered.filter(e => {
      const val = pctVal(e, field);
      if (slab.name === '>100%' || slab.name === '20%+') return val >= slab.min;
      return val >= slab.min && val < slab.max;
    });
    const rev = totalRevenue(matching);
    return {
      name: slab.name,
      count: matching.length,
      pct: total > 0 ? (matching.length / total) * 100 : 0,
      revenue: rev,
      emps: matching,
      color: slab.color,
    };
  }).filter(s => s.count > 0);
}

export function Dashboard() {
  const { salesKpi, kpi, employees, error, refreshData, lastRefresh, executiveInsights } = useWorkforce();
  const [drilldown, setDrilldown] = useState<{ title: string; emps: Employee[]; color: string } | null>(null);

  const activeEmps = useMemo(() => activeEmployees(employees), [employees]);
  const allBms = useMemo(() => bms(employees), [employees]);
  const allRms = useMemo(() => rms(employees), [employees]);

  const bmAchSlabs = useMemo(() => computeSlabs(allBms, ACH_SLABS, 'apr_ach'), [allBms]);
  const bmGrSlabs = useMemo(() => computeSlabs(allBms, GROWTH_SLABS, 'growth'), [allBms]);
  const rmAchSlabs = useMemo(() => computeSlabs(allRms, ACH_SLABS, 'apr_ach'), [allRms]);

  const totalRev = useMemo(() => totalRevenue(activeEmps), [activeEmps]);
  const avgAch = useMemo(() => {
    const vals = activeEmps.filter(e => toNum(e.apr_ach) > 0).map(e => toNum(e.apr_ach));
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [activeEmps]);
  const avgGrowth = useMemo(() => {
    const vals = activeEmps.map(e => toNum(e.growth)).filter(v => v !== 0);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [activeEmps]);
  const avgCov = useMemo(() => {
    const vals = activeEmps.filter(e => toNum(e.april26_cov) > 0).map(e => toNum(e.april26_cov));
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [activeEmps]);

  const kpiCards = useMemo(() => [
    { key: 'revenue', label: 'Revenue', value: fmtMoney(totalRev), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', emps: activeEmps.filter(e => toNum(e.net_sale_apr_26) > 0) },
    { key: 'achievement', label: 'Achievement %', value: fmtPct(avgAch), icon: Target, color: avgAch >= 90 ? 'text-emerald-600' : avgAch >= 80 ? 'text-amber-600' : 'text-red-600', bg: avgAch >= 90 ? 'bg-emerald-50' : avgAch >= 80 ? 'bg-amber-50' : 'bg-red-50', emps: activeEmps.filter(e => toNum(e.apr_ach) > 0) },
    { key: 'growth', label: 'Growth %', value: fmtPct(avgGrowth), icon: TrendingUp, color: avgGrowth >= 0 ? 'text-emerald-600' : 'text-red-600', bg: avgGrowth >= 0 ? 'bg-emerald-50' : 'bg-red-50', emps: activeEmps },
    { key: 'coverage', label: 'Coverage %', value: fmtPct(avgCov), icon: BarChart3, color: avgCov >= 80 ? 'text-emerald-600' : avgCov >= 60 ? 'text-amber-600' : 'text-red-600', bg: avgCov >= 80 ? 'bg-emerald-50' : avgCov >= 60 ? 'bg-amber-50' : 'bg-red-50', emps: activeEmps.filter(e => toNum(e.april26_cov) > 0) },
    { key: 'employees', label: 'Employees', value: String(activeEmps.length), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', emps: activeEmps },
    { key: 'rm', label: 'RM Count', value: String(allRms.length), icon: UserCheck, color: 'text-violet-600', bg: 'bg-violet-50', emps: allRms },
    { key: 'bm', label: 'BM Count', value: String(allBms.length), icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', emps: allBms },
  ], [totalRev, avgAch, avgGrowth, avgCov, activeEmps, allRms, allBms]);

  if (error && !salesKpi && !kpi) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Unable to load data</h2>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button onClick={refreshData} className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Overview</h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>{activeEmps.length} active employees</span>
            {lastRefresh && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(lastRefresh).toLocaleTimeString()}</span>}
          </div>
        </div>
        <button onClick={refreshData} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><RefreshCw className="w-4 h-4" /></button>
      </motion.div>

      <GlobalFilterBar visibleKeys={['division', 'zone', 'state', 'hq', 'dsgn']} />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* KPI CARDS */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.key}
                onClick={() => {
                  if (card.emps.length > 0) {
                    setDrilldown({ title: card.label, emps: card.emps, color: '#3b82f6' });
                  }
                }}
                className={`bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-md transition-all group relative overflow-hidden`}
              >
                <div className={`p-2 rounded-lg ${card.bg} w-fit mb-2`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <p className="text-xl font-bold text-slate-900">{card.value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{card.label}</p>
                <ChevronRight className="w-4 h-4 text-slate-300 absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* BM PERFORMANCE SPLIT */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="text-lg font-bold text-slate-900 mb-1">BM Performance Split</h2>
        <p className="text-xs text-slate-400 mb-4">Click any segment to see BM details</p>
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <DonutSection slabs={bmAchSlabs} totalLabel="Total BMs" onSlabClick={(slab) => setDrilldown({ title: `BM Achievement: ${slab.name}`, emps: slab.emps, color: slab.color })} />
        </div>
      </motion.section>

      {/* BM GROWTH SPLIT */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="text-lg font-bold text-slate-900 mb-1">BM Growth Split</h2>
        <p className="text-xs text-slate-400 mb-4">Click any segment to see BM details</p>
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <DonutSection slabs={bmGrSlabs} totalLabel="Total BMs" onSlabClick={(slab) => setDrilldown({ title: `BM Growth: ${slab.name}`, emps: slab.emps, color: slab.color })} />
        </div>
      </motion.section>

      {/* RM PERFORMANCE SPLIT */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-lg font-bold text-slate-900 mb-1">RM Performance Split</h2>
        <p className="text-xs text-slate-400 mb-4">Click any segment to see RM details</p>
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <DonutSection slabs={rmAchSlabs} totalLabel="Total RMs" onSlabClick={(slab) => setDrilldown({ title: `RM Achievement: ${slab.name}`, emps: slab.emps, color: slab.color })} />
        </div>
      </motion.section>

      {/* EXECUTIVE INSIGHTS */}
      {executiveInsights && executiveInsights.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">Executive Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {executiveInsights.map((insight, i) => (
              <div key={i} className={`rounded-xl border p-4 ${
                insight.type === 'positive' ? 'bg-emerald-50 border-emerald-200' :
                insight.type === 'negative' ? 'bg-red-50 border-red-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-lg">{insight.icon}</span>
                  <p className={`text-sm font-medium ${
                    insight.type === 'positive' ? 'text-emerald-800' :
                    insight.type === 'negative' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                    {insight.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* DRILLDOWN PANEL */}
      {drilldown && (
        <DrilldownPanel
          title={drilldown.title}
          emps={drilldown.emps}
          color={drilldown.color}
          allActiveEmps={activeEmps}
          onClose={() => setDrilldown(null)}
        />
      )}
    </div>
  );
}

function DonutSection({ slabs, totalLabel, onSlabClick }: { slabs: SlabData[]; totalLabel: string; onSlabClick: (slab: SlabData) => void }) {
  const totalCount = slabs.reduce((s, d) => s + d.count, 0);
  const pieData = slabs.map(s => ({ name: s.name, value: s.count, color: s.color }));

  if (totalCount === 0) return <div className="text-center py-12 text-slate-400">No data available</div>;

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8">
      <div className="relative cursor-pointer shrink-0">
        <ResponsiveContainer width={280} height={280}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={3}
              dataKey="value"
              onClick={(_, index) => { if (slabs[index]) onSlabClick(slabs[index]); }}
              style={{ cursor: 'pointer' }}
            >
              {pieData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} stroke="white" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-4xl font-bold text-slate-900">{totalCount}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{totalLabel}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full">
        <div className="space-y-2">
          {slabs.map(slab => (
            <button
              key={slab.name}
              onClick={() => onSlabClick(slab)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
            >
              <span className="w-4 h-4 rounded-full shrink-0 ring-2 ring-white shadow-sm" style={{ backgroundColor: slab.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">{slab.name}</span>
                  <span className="text-lg font-bold text-slate-900">{slab.count}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-slate-500">{fmtPct(slab.pct)} of total</span>
                  <span className="text-xs text-slate-500">{fmtMoney(slab.revenue)} revenue</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${slab.pct}%`, backgroundColor: slab.color }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface DrilldownPanelProps {
  title: string;
  emps: Employee[];
  color: string;
  allActiveEmps: Employee[];
  onClose: () => void;
}

function DrilldownPanel({ title, emps, color, allActiveEmps, onClose }: DrilldownPanelProps) {
  const [path, setPath] = useState<{ level: string; value: string }[]>([]);

  const filteredEmps = useMemo(() => {
    let result = [...emps];
    for (const step of path) {
      if (step.level === 'zone') result = result.filter(e => normalizeKey(String(e.zone)) === step.value);
      else if (step.level === 'state') result = result.filter(e => normalizeKey(String(e.state)) === step.value);
      else if (step.level === 'hq') result = result.filter(e => normalizeKey(String(e.hq)) === step.value);
      else if (step.level === 'rm') result = result.filter(e => String(e.name || '').trim() === step.value);
    }
    return result;
  }, [emps, path]);

  const currentLevel = path.length;
  const totalRev = useMemo(() => totalRevenue(filteredEmps), [filteredEmps]);
  const allRev = useMemo(() => totalRevenue(allActiveEmps), [allActiveEmps]);
  const avgAch = useMemo(() => {
    const vals = filteredEmps.map(e => pctVal(e, 'apr_ach')).filter(v => v > 0);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [filteredEmps]);
  const avgGr = useMemo(() => {
    const vals = filteredEmps.map(e => pctVal(e, 'growth'));
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [filteredEmps]);

  const groups = useMemo(() => {
    const levelKey = currentLevel === 0 ? 'zone' : currentLevel === 1 ? 'state' : currentLevel === 2 ? 'hq' : currentLevel === 3 ? 'rm' : 'name';
    if (currentLevel >= 4) {
      return filteredEmps.sort((a, b) => toNum(b.net_sale_apr_26) - toNum(a.net_sale_apr_26)).map(e => ({
        name: String(e.name || 'Unknown'),
        key: String(e.empCode || String(e.name)),
        count: 1,
        revenue: toNum(e.net_sale_apr_26),
        ach: pctVal(e, 'apr_ach'),
        gr: pctVal(e, 'growth'),
        emp: e,
        isLeaf: true,
      }));
    }

    const grouped = groupBy(filteredEmps, e => {
      if (levelKey === 'rm') return String(e.dsgn === 'RM' ? (e.name || 'Unknown') : e.name || 'Unknown');
      return normalizeKey(String(e[levelKey] || 'Unknown'));
    });

    return [...grouped.entries()].map(([name, g]) => ({
      name,
      key: name,
      count: g.length,
      revenue: totalRevenue(g),
      ach: g.map(e => pctVal(e, 'apr_ach')).filter(v => v > 0).reduce((a, b) => a + b, 0) / Math.max(g.map(e => pctVal(e, 'apr_ach')).filter(v => v > 0).length, 1) || 0,
      gr: g.map(e => pctVal(e, 'growth')).reduce((a, b) => a + b, 0) / g.length || 0,
      emp: null as unknown as Employee,
      isLeaf: false,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredEmps, currentLevel, path]);

  const levelLinks = ['Zone', 'State', 'HQ', 'RM', 'Employee'];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: color + '33', color }}>{title.includes('Growth') ? 'Growth' : 'Achievement'}</span>
              <h2 className="text-lg font-bold mt-1">{title}</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20">✕</button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-6 py-2 border-b border-slate-200 bg-slate-50 overflow-x-auto shrink-0">
          <button onClick={() => setPath([])} className="text-xs font-medium text-blue-600 hover:text-blue-800 px-1.5 py-0.5 rounded hover:bg-blue-50 whitespace-nowrap">All</button>
          {path.map((p, i) => (
            <span key={`${p.level}-${p.value}-${i}`} className="flex items-center gap-1 shrink-0">
              <span className="text-slate-300 text-xs">/</span>
              <button onClick={() => setPath(prev => prev.slice(0, i + 1))} className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${i === path.length - 1 ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-500 hover:text-blue-600'}`}>{p.value}</button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-6 px-6 py-3 border-b border-slate-200 bg-white shrink-0">
          <div><span className="text-sm font-bold text-slate-900">{filteredEmps.length}</span> <span className="text-xs text-slate-500">employees</span></div>
          <div><span className="text-sm font-bold text-emerald-600">{fmtMoney(totalRev)}</span> <span className="text-xs text-slate-500">revenue</span></div>
          <div><span className="text-sm font-bold text-slate-900">{allRev > 0 ? fmtPct((totalRev / allRev) * 100) : '0%'}</span> <span className="text-xs text-slate-500">contribution</span></div>
          <div><span className={`text-sm font-bold ${avgAch >= 90 ? 'text-emerald-600' : avgAch >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{fmtPct(avgAch)}</span> <span className="text-xs text-slate-500">achievement</span></div>
          <div><span className={`text-sm font-bold ${avgGr >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{avgGr >= 0 ? '+' : ''}{fmtPct(avgGr)}</span> <span className="text-xs text-slate-500">growth</span></div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-xs text-slate-400 mb-3">Drill down by {levelLinks[currentLevel] || 'detail'}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {groups.map(item => {
              if (item.isLeaf && item.emp) {
                const e = item.emp;
                const ach = pctVal(e, 'apr_ach');
                const gr = pctVal(e, 'growth');
                const rm = allActiveEmps.find((a: Employee) => a.dsgn === 'RM' && normalizeKey(String(a.zone)) === normalizeKey(String(e.zone)) && normalizeKey(String(a.state)) === normalizeKey(String(e.state)) && normalizeKey(String(a.hq)) === normalizeKey(String(e.hq)));
                return (
                  <div key={item.key} className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{String(e.dsgn || '')} · {String(e.hq || '')}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div><p className="text-[10px] text-slate-400">Achievement</p><p className={`text-xs font-bold ${ach >= 90 ? 'text-emerald-600' : ach >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{fmtPct(ach)}</p></div>
                      <div><p className="text-[10px] text-slate-400">Growth</p><p className={`text-xs font-bold ${gr >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{gr >= 0 ? '+' : ''}{fmtPct(gr)}</p></div>
                      <div><p className="text-[10px] text-slate-400">Revenue</p><p className="text-xs font-bold text-slate-900">{fmtMoney(item.revenue)}</p></div>
                      {e.dsgn === 'BM' && rm && <div><p className="text-[10px] text-slate-400">RM</p><p className="text-xs font-bold text-slate-900 truncate">{String(rm.name || '')}</p></div>}
                    </div>
                  </div>
                );
              }
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    const nextLevel = currentLevel === 0 ? 'zone' : currentLevel === 1 ? 'state' : currentLevel === 2 ? 'hq' : 'rm';
                    setPath(prev => [...prev, { level: nextLevel, value: item.name }]);
                  }}
                  className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-900 truncate">{item.name}</span>
                    <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100">→</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                    <div><p className="text-[10px] text-slate-400">Employees</p><p className="text-sm font-bold text-slate-900">{item.count}</p></div>
                    <div><p className="text-[10px] text-slate-400">Revenue</p><p className="text-sm font-bold text-emerald-600">{fmtMoney(item.revenue)}</p></div>
                    <div><p className="text-[10px] text-slate-400">Achievement</p><p className={`text-xs font-bold ${item.ach >= 90 ? 'text-emerald-600' : item.ach >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{fmtPct(item.ach)}</p></div>
                    <div><p className="text-[10px] text-slate-400">Growth</p><p className={`text-xs font-bold ${item.gr >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{item.gr >= 0 ? '+' : ''}{fmtPct(item.gr)}</p></div>
                  </div>
                </button>
              );
            })}
          </div>
          {groups.length === 0 && <p className="text-center py-12 text-slate-400">No data at this level</p>}
        </div>
      </div>
    </div>
  );
}