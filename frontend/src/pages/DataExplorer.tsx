import { useWorkforce } from '../contexts/WorkforceContext';
import { MasterDataGrid } from '../components/workforce/MasterDataGrid';
import { BreadcrumbNav } from '../components/workforce/BreadcrumbNav';
import { GlobalFilterBar } from '../components/workforce/GlobalFilterBar';
import { RecordDrawer } from '../components/workforce/RecordDrawer';
import { motion } from 'framer-motion';
import { Database, Search, Table } from 'lucide-react';
import { useState, useMemo } from 'react';
import { workforceAPI } from '../services/workforce';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#3b82f6', '#a855f7', '#fb7185', '#84cc16', '#06b6d4', '#d946ef', '#f97316', '#0ea5e9'];

export function DataExplorer() {
  const { allColumns, rawHeaders, employees, showDrillDown } = useWorkforce();
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [columnValues, setColumnValues] = useState<{ value: string; count: number }[]>([]);
  const [loadingValues, setLoadingValues] = useState(false);
  const [numericStats, setNumericStats] = useState<{ min: number; max: number; avg: number; sum: number; count: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'grid' | 'columns' | 'search'>('grid');

  const columnInfo = useMemo(() => {
    if (!allColumns.length) return [];
    return allColumns.map((key, i) => ({
      key,
      raw: rawHeaders[i] || key,
    }));
  }, [allColumns, rawHeaders]);

  const handleColumnClick = async (colKey: string) => {
    setSelectedColumn(colKey);
    setLoadingValues(true);
    try {
      const res = await workforceAPI.getColumnValues(colKey);
      const values = res.data as { value: string; count: number }[];

      const numVals = values
        .map(v => Number(v.value))
        .filter(v => !isNaN(v) && v !== null && v !== undefined);

      if (numVals.length > 5 && numVals.length === values.length) {
        setNumericStats({
          min: Math.min(...numVals),
          max: Math.max(...numVals),
          avg: Math.round((numVals.reduce((a, b) => a + b, 0) / numVals.length) * 100) / 100,
          sum: Math.round(numVals.reduce((a, b) => a + b, 0) * 100) / 100,
          count: numVals.length,
        });
      } else {
        setNumericStats(null);
      }

      setColumnValues(values.slice(0, 50));
    } catch {
      setColumnValues([]);
      setNumericStats(null);
    } finally {
      setLoadingValues(false);
    }
  };

  const isNumeric = !!numericStats;

  return (
    <div className="space-y-5 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Data Explorer</h1>
            <p className="text-xs text-slate-400">{allColumns.length} columns · {employees.length} records</p>
          </div>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {(['grid', 'columns', 'search'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs px-3 py-1.5 rounded-md transition-all ${
                activeTab === tab ? 'bg-white text-slate-900 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'grid' ? 'Data Grid' : tab === 'columns' ? 'Column Explorer' : 'Search Studio'}
            </button>
          ))}
        </div>
      </motion.div>

      <BreadcrumbNav />
      <GlobalFilterBar />

      {activeTab === 'grid' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Master Data Grid</h3>
            </div>
            <span className="text-xs text-slate-400">{employees.length} rows · {allColumns.length} columns</span>
          </div>
          <MasterDataGrid />
        </div>
      )}

      {activeTab === 'columns' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Column Explorer</h3>
              <p className="text-xs text-slate-400">Click a column to analyze</p>
            </div>
            <div className="overflow-y-auto max-h-[600px]">
              {columnInfo.map((col) => (
                <button
                  key={col.key}
                  onClick={() => handleColumnClick(col.key)}
                  className={`w-full text-left px-4 py-2.5 text-sm border-b border-slate-50 hover:bg-blue-50 transition-colors ${
                    selectedColumn === col.key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'
                  }`}
                >
                  <span className="block truncate">{col.raw || col.key}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{col.key}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            {!selectedColumn && (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
                <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Select a column to explore</p>
                <p className="text-xs mt-1">Click any column name to see its distribution and statistics</p>
              </div>
            )}

            {selectedColumn && loadingValues && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-48 mb-4" />
                <div className="h-[300px] bg-slate-50 rounded" />
              </div>
            )}

            {selectedColumn && !loadingValues && columnValues.length > 0 && (
              <>
                {isNumeric && numericStats && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-xl p-4"
                  >
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">
                      Numeric Statistics: {rawHeaders[allColumns.indexOf(selectedColumn)] || selectedColumn}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-xs text-blue-600">Min</p>
                        <p className="text-lg font-bold text-blue-800">{numericStats.min.toLocaleString()}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                        <p className="text-xs text-emerald-600">Max</p>
                        <p className="text-lg font-bold text-emerald-800">{numericStats.max.toLocaleString()}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                        <p className="text-xs text-purple-600">Average</p>
                        <p className="text-lg font-bold text-purple-800">{numericStats.avg.toLocaleString()}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-xs text-amber-600">Sum</p>
                        <p className="text-lg font-bold text-amber-800">{numericStats.sum.toLocaleString()}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-200 rounded-xl p-4"
                >
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    Distribution: {rawHeaders[allColumns.indexOf(selectedColumn)] || selectedColumn}
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      {isNumeric ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={columnValues.slice(0, 20)}
                            onClick={(e) => {
                              if (e?.activeLabel) {
                                const records = employees.filter(emp => String(emp[selectedColumn] ?? '') === e.activeLabel);
                                if (records.length > 0) showDrillDown(records, `${selectedColumn}: ${e.activeLabel}`);
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="value" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <RePieChart>
                            <Pie
                              data={columnValues.slice(0, 10)}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              dataKey="count"
                              nameKey="value"
                              label={({ value }: { value: unknown }) => String(value)}
                              onClick={(entry: unknown) => {
                                const e = entry as { value?: string };
                                if (e?.value) {
                                  const records = employees.filter(emp => String(emp[selectedColumn] ?? '') === e.value);
                                  if (records.length > 0) showDrillDown(records, `${selectedColumn}: ${e.value}`);
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              {columnValues.slice(0, 10).map((_, idx) => (
                                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RePieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left font-medium text-slate-500 pb-2">Value</th>
                            <th className="text-right font-medium text-slate-500 pb-2">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {columnValues.map((v, i) => (
                            <tr key={i} className="border-b border-slate-50">
                              <td className="py-1.5 text-slate-700">{v.value}</td>
                              <td className="py-1.5 text-right font-medium text-slate-900">{v.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              </>
            )}

            {selectedColumn && !loadingValues && columnValues.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                <p className="text-sm">No values found for this column</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-semibold text-slate-900">Advanced Search Studio</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Use the global search bar at the top of the page to search across all {allColumns.length} columns.
            The search supports partial match, exact match, and scans every field in every record.
          </p>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs font-medium text-slate-700 mb-2">Searchable Columns ({allColumns.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {allColumns.slice(0, 30).map(col => (
                <span key={col} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                  {col}
                </span>
              ))}
              {allColumns.length > 30 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
                  +{allColumns.length - 30} more
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <RecordDrawer />
    </div>
  );
}
