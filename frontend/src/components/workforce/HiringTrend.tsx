import { motion } from 'framer-motion';
import { useWorkforce } from '../../contexts/WorkforceContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function HiringTrend() {
  const { hiringTrend, hiringPeriod, setHiringPeriod, loadingState, employees, showDrillDown } = useWorkforce();

  if (loadingState.hiring && hiringTrend.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-40 mb-4" />
        <div className="h-[250px] bg-slate-50 rounded" />
      </div>
    );
  }

  if (!hiringTrend || hiringTrend.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-xl p-4"
      >
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Employee Joining Trend</h3>
        <div className="text-center py-8 text-slate-400">
          <p className="text-sm">No hiring trend data available</p>
          <p className="text-xs mt-1">Joining dates may not be populated</p>
        </div>
      </motion.div>
    );
  }

  const handleTrendClick = (data: { activePayload?: Array<Record<string, unknown>> }) => {
    if (!data?.activePayload?.length) return;
    const period = (data.activePayload[0].payload as { period: string }).period;
    const records = employees.filter(e => {
      const d = String(e.doj || '');
      if (hiringPeriod === 'yearly') return d.slice(0, 4) === period;
      if (hiringPeriod === 'quarterly') {
        const q = period.replace('Q', '-');
        return d.startsWith(q);
      }
      return d.startsWith(period.slice(0, 7));
    });
    if (records.length > 0) showDrillDown(records, `Joined in ${period}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Employee Joining Trend</h3>
        <div className="flex gap-1">
          {(['monthly', 'quarterly', 'yearly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setHiringPeriod(p)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                hiringPeriod === p
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={hiringTrend}
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          onClick={(data: unknown) => handleTrendClick(data as { activePayload?: Array<Record<string, unknown>> })}
          style={{ cursor: 'pointer' }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 10 }}
            interval={Math.max(Math.floor(hiringTrend.length / 10), 1)}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value: unknown) => [Number(value).toLocaleString(), 'New Hires']} labelStyle={{ fontWeight: 600 }} />
          <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5, fill: '#6366f1' }} />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
