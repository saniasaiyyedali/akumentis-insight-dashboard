import { motion } from 'framer-motion';
import { useWorkforce } from '../../contexts/WorkforceContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useState, useEffect } from 'react';
import { workforceAPI } from '../../services/workforce';

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#3b82f6', '#a855f7', '#fb7185'];

const CATEGORICAL_KEYWORDS = ['gender', 'department', 'grade', 'region', 'band', 'category', 'type', 'status', 'level', 'slab', 'code', 'coverage'];

export function DynamicInsights() {
  const { allColumns, rawHeaders, columnMap, filters, employees, showDrillDown } = useWorkforce();
  const [dynamicData, setDynamicData] = useState<Record<string, { value: string; count: number }[]>>({});
  const [loading, setLoading] = useState(false);

  const getDisplayName = (col: string) => {
    const map = columnMap.find(m => m.safeKey === col);
    if (map) return map.originalName;
    const idx = allColumns.indexOf(col);
    if (idx >= 0 && rawHeaders[idx]) return rawHeaders[idx];
    return col.replace(/_/g, ' ');
  };

  useEffect(() => {
    const categorical = allColumns.filter(col =>
      CATEGORICAL_KEYWORDS.some(kw => col.toLowerCase().includes(kw))
    );

    if (categorical.length === 0) {
      setDynamicData({});
      return;
    }

    setLoading(true);
    const promises = categorical.slice(0, 6).map(col =>
      workforceAPI.getColumnValues(col, filters).then(res => ({ col, data: res.data }))
    );

    Promise.all(promises).then(results => {
      const data: Record<string, { value: string; count: number }[]> = {};
      results.forEach(r => { data[r.col] = r.data; });
      setDynamicData(data);
    }).finally(() => setLoading(false));
  }, [allColumns, rawHeaders, filters]);

  const entries = Object.entries(dynamicData).filter(([_, vals]) => vals.length > 0);

  const handlePieClick = (col: string, entry: { value?: string }) => {
    if (!entry.value) return;
    const records = employees.filter(e => String(e[col] ?? '') === entry.value);
    if (records.length > 0) showDrillDown(records, `${col}: ${entry.value}`);
  };

  if (loading && entries.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[200px] bg-slate-50 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl p-4"
    >
      <h3 className="text-sm font-semibold text-slate-900 mb-4">
        Dynamic Column Insights
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map(([col, values]) => (
          <div key={col} className="border border-slate-100 rounded-lg p-3">
            <h4 className="text-xs font-medium text-slate-600 mb-2">{getDisplayName(col)}</h4>
                <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={values.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="count"
                  nameKey="value"
                  onClick={(entry: unknown) => {
                    const e = entry as { value?: string };
                    handlePieClick(col, e);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {values.slice(0, 8).map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: unknown) => [Number(value).toLocaleString(), '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {values.slice(0, 5).map(v => (
                <div key={v.value} className="flex justify-between text-xs text-slate-500">
                  <span>{v.value}</span>
                  <span className="font-medium text-slate-700">{v.count}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
