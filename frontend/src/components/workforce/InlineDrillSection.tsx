import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { type Employee } from '../../contexts/WorkforceContext';
import { toNum, fmt, fmtMoney, fmtPct, totalRevenue, normalizeKey, groupBy } from '../../utils/displayUtils';
import { InlineEmployeeDetail } from './InlineEmployeeDetail';

const PCT_FIELDS = new Set(['apr_ach', 'growth', 'april26_cov']);

function pct(e: Employee, field: string): number {
  const raw = toNum(e[field]);
  if (PCT_FIELDS.has(field)) return raw * 100;
  return raw;
}

function avgPct(emps: Employee[], field: string): number {
  const vals = emps.map(e => pct(e, field)).filter(v => v > 0 || field === 'growth');
  const valid = field === 'growth' ? vals : vals.filter(v => v > 0);
  return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
}

export interface InlineDrillSectionProps {
  title: string;
  emps: Employee[];
  allActive: Employee[];
  color?: string;
  onClose: () => void;
}

export function InlineDrillSection({ title, emps, allActive, color = '#3b82f6', onClose }: InlineDrillSectionProps) {
  const [path, setPath] = useState<{ level: string; value: string }[]>([]);
  const [expandedEmp, setExpandedEmp] = useState<Employee | null>(null);

  const filteredEmps = useMemo(() => {
    let result = [...emps];
    for (const step of path) {
      if (step.level === 'zone') result = result.filter(e => normalizeKey(String(e.zone)) === step.value);
      else if (step.level === 'state') result = result.filter(e => normalizeKey(String(e.state)) === step.value);
      else if (step.level === 'hq') result = result.filter(e => normalizeKey(String(e.hq)) === step.value);
      else if (step.level === 'rm') result = result.filter(e => String(e.dsgn) === 'RM' && normalizeKey(String(e.name)) === step.value);
      else if (step.level === 'bm') result = result.filter(e => String(e.dsgn) === 'BM' && normalizeKey(String(e.name)) === step.value);
    }
    return result;
  }, [emps, path]);

  const currentLevel = path.length;
  const levelNames = ['Zone', 'State', 'HQ', 'RM', 'BM', 'Employee'];
  const levelKeys = ['zone', 'state', 'hq', 'rm', 'bm', 'employee'];

  const groups = useMemo(() => {
    if (currentLevel >= 5) {
      return filteredEmps
        .filter(e => e.dsgn === 'BM' || !['NSM', 'ZM', 'SM', 'RM', 'BU HEAD', 'BU Head'].includes(String(e.dsgn)))
        .sort((a, b) => toNum(b.net_sale_apr_26) - toNum(a.net_sale_apr_26))
        .map(e => ({
          name: String(e.name || 'Unknown'),
          key: String(e.empCode || e.empcode || e.name),
          revenue: toNum(e.net_sale_apr_26),
          ach: pct(e, 'apr_ach'),
          growth: pct(e, 'growth'),
          cov: pct(e, 'april26_cov'),
          emp: e,
          isLeaf: true,
          count: 1,
          dsgn: String(e.dsgn || ''),
        }));
    }
    const levelKey = levelKeys[currentLevel];
    if (levelKey === 'rm') {
      const rms = filteredEmps.filter(e => e.dsgn === 'RM');
      return rms.map(e => ({
        name: String(e.name || 'Unknown'),
        key: normalizeKey(String(e.name)),
        count: filteredEmps.filter(x => x.dsgn === 'BM' && String(x.state) === String(e.state) && String(x.zone) === String(e.zone)).length,
        revenue: toNum(e.net_sale_apr_26),
        ach: pct(e, 'apr_ach'),
        growth: pct(e, 'growth'),
        cov: pct(e, 'april26_cov'),
        emp: e,
        isLeaf: false,
        dsgn: 'RM',
      })).sort((a, b) => b.revenue - a.revenue);
    }
    if (levelKey === 'bm') {
      const bms = filteredEmps.filter(e => e.dsgn === 'BM');
      return bms.map(e => ({
        name: String(e.name || 'Unknown'),
        key: normalizeKey(String(e.name)),
        count: 1,
        revenue: toNum(e.net_sale_apr_26),
        ach: pct(e, 'apr_ach'),
        growth: pct(e, 'growth'),
        cov: pct(e, 'april26_cov'),
        emp: e,
        isLeaf: true,
        dsgn: 'BM',
      })).sort((a, b) => b.revenue - a.revenue);
    }
    const grouped = groupBy(filteredEmps, e => normalizeKey(String(e[levelKey] || 'Unknown')));
    return [...grouped.entries()].map(([name, g]) => ({
      name,
      key: name,
      count: g.length,
      revenue: totalRevenue(g),
      ach: avgPct(g, 'apr_ach'),
      growth: avgPct(g, 'growth'),
      cov: avgPct(g, 'april26_cov'),
      emp: null as unknown as Employee,
      isLeaf: false,
      dsgn: '',
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredEmps, currentLevel]);

  const totalRev = useMemo(() => totalRevenue(filteredEmps), [filteredEmps]);
  const allRev = useMemo(() => totalRevenue(allActive), [allActive]);

  const handleItemClick = (item: typeof groups[0]) => {
    if (item.isLeaf && item.emp) {
      setExpandedEmp(expandedEmp?.name === item.emp.name ? null : item.emp);
      return;
    }
    const nextLevel = levelKeys[currentLevel];
    if (nextLevel && nextLevel !== 'employee') {
      setPath(prev => [...prev, { level: nextLevel, value: item.name }]);
      setExpandedEmp(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm"
    >
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 py-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: color + '33', color: '#fff' }}>
            Drill Down
          </span>
          <h2 className="text-lg font-bold mt-1">{title}</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {filteredEmps.length} people · {fmtMoney(totalRev)} revenue
            {allRev > 0 && ` · ${fmt(totalRev / allRev * 100, 1)}% contribution`}
          </p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-200 bg-slate-50 overflow-x-auto">
        <button onClick={() => { setPath([]); setExpandedEmp(null); }} className="text-xs font-medium text-blue-600 hover:text-blue-800 px-1.5 py-0.5 rounded hover:bg-blue-50 whitespace-nowrap">
          All
        </button>
        {path.map((p, i) => (
          <span key={`${p.level}-${p.value}-${i}`} className="flex items-center gap-1 shrink-0">
            <span className="text-slate-300 text-xs">/</span>
            <button
              onClick={() => { setPath(prev => prev.slice(0, i + 1)); setExpandedEmp(null); }}
              className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${i === path.length - 1 ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-500 hover:text-blue-600'}`}
            >
              {p.value}
            </button>
          </span>
        ))}
        <span className="text-xs text-slate-400 ml-auto shrink-0">Level: {levelNames[currentLevel] || 'Employee'}</span>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {groups.map(item => (
            <button
              key={item.key}
              onClick={() => handleItemClick(item)}
              className={`bg-white border rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-md transition-all group ${
                expandedEmp && item.emp && expandedEmp.name === item.emp.name ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-slate-900 truncate">{item.name}</span>
                {item.isLeaf ? (
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedEmp?.name === item.emp?.name ? 'rotate-180' : ''}`} />
                ) : (
                  <ChevronRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100" />
                )}
              </div>
              {item.dsgn && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{item.dsgn}</span>}
              <div className="grid grid-cols-2 gap-2 mt-2">
                {!item.isLeaf && (
                  <div><p className="text-[10px] text-slate-400">People</p><p className="text-sm font-bold text-slate-900">{item.count}</p></div>
                )}
                <div><p className="text-[10px] text-slate-400">Revenue</p><p className="text-sm font-bold text-emerald-600">{fmtMoney(item.revenue)}</p></div>
                <div><p className="text-[10px] text-slate-400">Ach</p><p className={`text-xs font-bold ${item.ach >= 90 ? 'text-emerald-600' : item.ach >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{fmtPct(item.ach)}</p></div>
                <div><p className="text-[10px] text-slate-400">Growth</p><p className={`text-xs font-bold ${item.growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{item.growth >= 0 ? '+' : ''}{fmt(item.growth, 1)}%</p></div>
              </div>
            </button>
          ))}
        </div>
        {groups.length === 0 && <p className="text-center py-8 text-slate-400 text-sm">No data at this level</p>}

        <AnimatePresence>
          {expandedEmp && (
            <div className="mt-4">
              <InlineEmployeeDetail
                employee={expandedEmp}
                allEmployees={allActive}
                onClose={() => setExpandedEmp(null)}
                compact
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
