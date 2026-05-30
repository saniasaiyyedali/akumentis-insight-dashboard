import { useMemo, useState } from 'react';
import { useWorkforce } from '../contexts/WorkforceContext';
import { BreadcrumbNav } from '../components/workforce/BreadcrumbNav';
import { GlobalFilterBar } from '../components/workforce/GlobalFilterBar';
import { RecordDrawer } from '../components/workforce/RecordDrawer';
import { DrilldownPanel } from '../components/workforce/DrilldownPanel';
import { motion } from 'framer-motion';
import {
  AlertTriangle, TrendingDown, Target, Clock, ShoppingCart,
  Users, DollarSign, Percent, ChevronRight,
} from 'lucide-react';
import {
  toNum, fmt, fmtMoney, totalRevenue, activeEmployees, normalizeKey,
} from '../utils/displayUtils';

interface ExceptionTab {
  key: string;
  label: string;
  icon: typeof AlertTriangle;
  color: string;
  bg: string;
  filter: (e: Record<string, unknown>) => boolean;
  field: string;
  threshold: string;
}

const TABS: ExceptionTab[] = [
  { key: 'achievement', label: 'Low Achievement', icon: Target, color: 'text-red-600', bg: 'bg-red-100', filter: e => toNum(e.apr_ach) > 0 && toNum(e.apr_ach) < 80, field: 'apr_ach', threshold: '<80%' },
  { key: 'growth', label: 'Negative Growth', icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-100', filter: e => toNum(e.growth) < 0, field: 'growth', threshold: '<0%' },
  { key: 'coverage', label: 'Low Coverage', icon: Target, color: 'text-amber-600', bg: 'bg-amber-100', filter: e => toNum(e.april26_cov) > 0 && toNum(e.april26_cov) < 60, field: 'april26_cov', threshold: '<60%' },
  { key: 'inventory', label: 'High Inventory', icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-100', filter: e => toNum(e.apr26_inv_days) > 60, field: 'apr26_inv_days', threshold: '>60d' },
  { key: 'hours', label: 'Low Hours', icon: Clock, color: 'text-rose-600', bg: 'bg-rose-100', filter: e => toNum(e.april26_avg_working_hrs) > 0 && toNum(e.april26_avg_working_hrs) < 4, field: 'april26_avg_working_hrs', threshold: '<4h' },
];

export function Exceptions() {
  const { employees, showDrilldownPanel } = useWorkforce();
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const [search, setSearch] = useState('');
  const [hqFilter, setHqFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  const activeEmps = useMemo(() => activeEmployees(employees), [employees]);

  const tab = TABS.find(t => t.key === activeTab)!;

  const filteredEmps = useMemo(() => {
    let result = activeEmps.filter(tab.filter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e => String(e.name || '').toLowerCase().includes(q) || String(e.empCode || '').toLowerCase().includes(q));
    }
    if (hqFilter) result = result.filter(e => normalizeKey(e.hq) === hqFilter);
    if (stateFilter) result = result.filter(e => normalizeKey(e.state) === stateFilter);
    return result.sort((a, b) => toNum(a[tab.field]) - toNum(b[tab.field]));
  }, [activeEmps, tab, search, hqFilter, stateFilter]);

  const hqOptions = useMemo(() => {
    const matched = activeEmps.filter(tab.filter);
    const hqs = [...new Set(matched.map(e => normalizeKey(e.hq)).filter(Boolean))].sort();
    return hqs;
  }, [activeEmps, tab]);

  const stateOptions = useMemo(() => {
    const matched = activeEmps.filter(tab.filter);
    const states = [...new Set(matched.map(e => normalizeKey(e.state)).filter(Boolean))].sort();
    return states;
  }, [activeEmps, tab]);

  const totalRev = useMemo(() => totalRevenue(filteredEmps), [filteredEmps]);

  return (
    <div className="space-y-5 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Exception Center</h1>
          <p className="text-xs text-slate-400">Identify outliers and performance issues</p>
        </div>
      </motion.div>

      <BreadcrumbNav />
      <GlobalFilterBar />

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => {
          const count = activeEmps.filter(t.filter).length;
          const isActive = t.key === activeTab;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white border-2 border-slate-800 text-slate-900 shadow-sm'
                  : 'bg-slate-50 border-2 border-transparent text-slate-500 hover:bg-slate-100'
              }`}
            >
              <t.icon className={`w-4 h-4 ${t.color}`} />
              <span>{t.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400 w-48"
          />
          <Users className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
        <select
          value={hqFilter}
          onChange={e => setHqFilter(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400"
        >
          <option value="">All HQs</option>
          {hqOptions.slice(0, 50).map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <select
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-400"
        >
          <option value="">All States</option>
          {stateOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs text-slate-400 ml-auto">{filteredEmps.length} employees • {fmtMoney(totalRev)} revenue</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <SummaryCard label="Employees" value={filteredEmps.length} icon={Users} color="text-blue-600" bg="bg-blue-100" />
        <SummaryCard label="Total Revenue" value={fmtMoney(totalRev)} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-100" />
        <SummaryCard label="Avg Value" value={filteredEmps.length > 0 ? fmtMoney(totalRev / filteredEmps.length) : '0'} icon={Percent} color="text-violet-600" bg="bg-violet-100" />
        <SummaryCard
          label={tab.field.includes('hrs') ? 'Avg Hours' : tab.field.includes('inv') ? 'Avg Days' : tab.field.includes('cov') ? 'Avg Coverage' : tab.field === 'growth' ? 'Avg Growth' : 'Avg Achievement'}
          value={tab.field.includes('hrs') ? `${fmt(filteredEmps.reduce((s, e) => s + toNum(e[tab.field]), 0) / Math.max(filteredEmps.length, 1), 1)}h` :
            tab.field.includes('inv') ? `${fmt(filteredEmps.reduce((s, e) => s + toNum(e[tab.field]), 0) / Math.max(filteredEmps.length, 1), 1)}d` :
            `${fmt(filteredEmps.reduce((s, e) => s + toNum(e[tab.field]), 0) / Math.max(filteredEmps.length, 1), 1)}%`}
          icon={tab.icon}
          color="text-amber-600"
          bg="bg-amber-100"
        />
      </div>

      {/* Employee list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">{tab.label} ({tab.threshold})</h3>
          <button
            onClick={() => showDrilldownPanel(filteredEmps, `Exception: ${tab.label}`)}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Drill Down <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left text-[10px] font-medium text-slate-500 px-3 py-2">#</th>
                <th className="text-left text-[10px] font-medium text-slate-500 px-3 py-2">Name</th>
                <th className="text-left text-[10px] font-medium text-slate-500 px-3 py-2">HQ</th>
                <th className="text-left text-[10px] font-medium text-slate-500 px-3 py-2">Role</th>
                <th className="text-right text-[10px] font-medium text-slate-500 px-3 py-2">{tab.field.includes('hrs') ? 'Hours' : tab.field.includes('inv') ? 'Days' : 'Achievement'}</th>
                <th className="text-right text-[10px] font-medium text-slate-500 px-3 py-2">Revenue</th>
                <th className="text-right text-[10px] font-medium text-slate-500 px-3 py-2">Contrib %</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmps.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-xs text-slate-400">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-30" />
                  No exceptions found with current filters
                </td></tr>
              ) : (
                filteredEmps.slice(0, 100).map((emp, i) => {
                  const rev = totalRevenue([emp]);
                  const contribPct = totalRev > 0 ? (rev / totalRev) * 100 : 0;
                  const val = toNum(emp[tab.field]);
                  return (
                    <tr
                      key={i}
                      onClick={() => showDrilldownPanel([emp], String(emp.name || ''))}
                      className="border-b border-slate-50 hover:bg-red-50/30 cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-2 text-xs text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2 text-xs text-slate-800 font-medium">{String(emp.name || '-')}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{normalizeKey(emp.hq) || '-'}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{normalizeKey(emp.dsgn) || '-'}</td>
                      <td className={`px-3 py-2 text-xs text-right font-semibold ${tab.field.includes('hrs') ? 'text-rose-600' : tab.field.includes('inv') ? 'text-purple-600' : 'text-red-600'}`}>
                        {tab.field.includes('hrs') ? `${fmt(val, 1)}h` : tab.field.includes('inv') ? `${fmt(val, 1)}d` : `${fmt(val, 1)}%`}
                      </td>
                      <td className="px-3 py-2 text-xs text-right text-slate-600">{fmtMoney(rev)}</td>
                      <td className="px-3 py-2 text-xs text-right text-slate-500">{contribPct >= 0.01 ? `${fmt(contribPct, 2)}%` : '<0.01%'}</td>
                    </tr>
                  );
                })
              )}
              {filteredEmps.length > 100 && (
                <tr><td colSpan={7} className="text-center py-2 text-xs text-slate-400">Showing 100 of {filteredEmps.length} employees</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RecordDrawer />
      <DrilldownPanel />
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, bg }: { label: string; value: string | number; icon: typeof Users; color: string; bg: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1 rounded ${bg}`}><Icon className={`w-3 h-3 ${color}`} /></div>
        <span className="text-[10px] text-slate-500">{label}</span>
      </div>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}