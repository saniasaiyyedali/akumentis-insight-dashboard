import { useMemo, useState } from 'react';
import { useWorkforce } from '../contexts/WorkforceContext';
import { GlobalFilterBar } from '../components/workforce/GlobalFilterBar';
import { RecordDrawer } from '../components/workforce/RecordDrawer';
import { DrilldownPanel } from '../components/workforce/DrilldownPanel';
import { motion } from 'framer-motion';
import { Search, Download, ChevronUp, ChevronDown, X, FileSpreadsheet } from 'lucide-react';
import { toNum, fmtMoney, fmtPct, fmt, totalRevenue, activeEmployees } from '../utils/displayUtils';

type SortKey = 'name' | 'dsgn' | 'hq' | 'zone' | 'state' | 'net_sale_apr_26' | 'apr_ach' | 'growth' | 'april26_cov' | 'apr_26_tgt' | 'gross_sale_apr26' | 'apr26_sec_sales' | 'april26_avg_working_hrs' | 'apr26_inv_days';
type SortDir = 'asc' | 'desc';

const VISIBLE_COLUMNS: { key: string; label: string; align: 'left' | 'right' }[] = [
  { key: 'name', label: 'Name', align: 'left' },
  { key: 'dsgn', label: 'Role', align: 'left' },
  { key: 'hq', label: 'HQ', align: 'left' },
  { key: 'zone', label: 'Zone', align: 'left' },
  { key: 'state', label: 'State', align: 'left' },
  { key: 'net_sale_apr_26', label: 'Revenue', align: 'right' },
  { key: 'apr_26_tgt', label: 'Target', align: 'right' },
  { key: 'apr_ach', label: 'Ach %', align: 'right' },
  { key: 'growth', label: 'Growth %', align: 'right' },
  { key: 'april26_cov', label: 'Coverage', align: 'right' },
  { key: 'gross_sale_apr26', label: 'Gross Sales', align: 'right' },
  { key: 'apr26_sec_sales', label: 'Sec Sales', align: 'right' },
  { key: 'april26_avg_working_hrs', label: 'Work Hrs', align: 'right' },
  { key: 'apr26_inv_days', label: 'Inv Days', align: 'right' },
];

export function DetailedAnalysis() {
  const { employees } = useWorkforce();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('net_sale_apr_26');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const perPage = 50;

  const activeEmps = useMemo(() => activeEmployees(employees), [employees]);

  const searched = useMemo(() => {
    let result = [...activeEmps];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        Object.values(e).some(v => v !== null && String(v).toLowerCase().includes(q))
      );
    }
    return result;
  }, [activeEmps, search]);

  const sorted = useMemo(() => {
    return [...searched].sort((a, b) => {
      const aVal = sortBy === 'name' || sortBy === 'hq' || sortBy === 'zone' || sortBy === 'dsgn' || sortBy === 'state'
        ? String(a[sortBy] || '').toLowerCase()
        : toNum(a[sortBy]);
      const bVal = sortBy === 'name' || sortBy === 'hq' || sortBy === 'zone' || sortBy === 'dsgn' || sortBy === 'state'
        ? String(b[sortBy] || '').toLowerCase()
        : toNum(b[sortBy]);
      if (sortDir === 'asc') return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    });
  }, [searched, sortBy, sortDir]);

  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice(page * perPage, (page + 1) * perPage);

  const totalStats = useMemo(() => {
    const rev = totalRevenue(searched);
    const achVals = searched.filter(e => toNum(e.apr_ach) > 0).map(e => toNum(e.apr_ach));
    const grVals = searched.map(e => toNum(e.growth)).filter(v => v !== 0);
    return {
      count: searched.length,
      revenue: rev,
      avgAch: achVals.length > 0 ? achVals.reduce((a, b) => a + b, 0) / achVals.length : 0,
      avgGrowth: grVals.length > 0 ? grVals.reduce((a, b) => a + b, 0) / grVals.length : 0,
    };
  }, [searched]);

  const handleSort = (key: string) => {
    const sKey = key as SortKey;
    if (sortBy === sKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(sKey);
      setSortDir('desc');
    }
    setPage(0);
  };

  const handleExport = () => {
    const header = VISIBLE_COLUMNS.map(c => c.label).join(',');
    const rows = sorted.map(e => VISIBLE_COLUMNS.map(c => {
      const val = e[c.key];
      return String(val ?? '').replace(/,/g, ';');
    }).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'detailed_analysis.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Detailed Analysis</h1>
            <p className="text-xs text-slate-400">{activeEmps.length} active employees · Actual Excel records</p>
          </div>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </motion.div>

      <GlobalFilterBar visibleKeys={['division', 'zone', 'state', 'hq', 'dsgn']} />

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Records</p>
          <p className="text-lg font-bold text-slate-900">{totalStats.count}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Revenue</p>
          <p className="text-lg font-bold text-emerald-600">{fmtMoney(totalStats.revenue)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Achievement</p>
          <p className={`text-lg font-bold ${totalStats.avgAch >= 90 ? 'text-emerald-600' : totalStats.avgAch >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{fmtPct(totalStats.avgAch)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Growth</p>
          <p className={`text-lg font-bold ${totalStats.avgGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{totalStats.avgGrowth >= 0 ? '+' : ''}{fmtPct(totalStats.avgGrowth)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search by name, HQ, zone, designation..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
        {search && (
          <button onClick={() => { setSearch(''); setPage(0); }} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {VISIBLE_COLUMNS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`py-2 px-2 font-semibold text-slate-600 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortBy === col.key && (
                        <span className="text-blue-500">{sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((emp, i) => (
                <tr key={String(emp.empCode || i)} className="border-b border-slate-50 hover:bg-blue-50/30 cursor-pointer transition-colors">
                  <td className="py-1.5 px-2 font-medium text-slate-900 truncate max-w-[140px]">{String(emp.name || '-')}</td>
                  <td className="py-1.5 px-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{String(emp.dsgn || '-')}</span>
                  </td>
                  <td className="py-1.5 px-2 text-slate-600 truncate max-w-[80px]">{String(emp.hq || '-')}</td>
                  <td className="py-1.5 px-2 text-slate-600">{String(emp.zone || '-')}</td>
                  <td className="py-1.5 px-2 text-slate-600">{String(emp.state || '-')}</td>
                  <td className="py-1.5 px-2 text-right font-medium text-slate-900">{fmtMoney(toNum(emp.net_sale_apr_26))}</td>
                  <td className="py-1.5 px-2 text-right text-slate-500">{fmtMoney(toNum(emp.apr_26_tgt))}</td>
                  <td className={`py-1.5 px-2 text-right font-semibold ${toNum(emp.apr_ach) >= 90 ? 'text-emerald-600' : toNum(emp.apr_ach) >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                    {fmtPct(toNum(emp.apr_ach))}
                  </td>
                  <td className={`py-1.5 px-2 text-right ${toNum(emp.growth) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {toNum(emp.growth) >= 0 ? '+' : ''}{fmt(toNum(emp.growth), 1)}%
                  </td>
                  <td className="py-1.5 px-2 text-right text-slate-500">{fmtPct(toNum(emp.april26_cov))}</td>
                  <td className="py-1.5 px-2 text-right text-slate-500">{fmtMoney(toNum(emp.gross_sale_apr26))}</td>
                  <td className="py-1.5 px-2 text-right text-slate-500">{fmtMoney(toNum(emp.apr26_sec_sales))}</td>
                  <td className="py-1.5 px-2 text-right text-slate-500">{fmt(toNum(emp.april26_avg_working_hrs), 1)}h</td>
                  <td className="py-1.5 px-2 text-right text-slate-500">{fmt(toNum(emp.apr26_inv_days), 1)}d</td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={VISIBLE_COLUMNS.length} className="text-center py-12 text-slate-400">No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500">
            Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, sorted.length)} of {sorted.length} records
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >Previous</button>
            <span className="text-xs text-slate-500">Page {page + 1} of {totalPages || 1}</span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >Next</button>
          </div>
        </div>
      </div>

      <RecordDrawer />
      <DrilldownPanel />
    </div>
  );
}