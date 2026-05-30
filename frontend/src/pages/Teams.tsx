import { useWorkforce } from '../contexts/WorkforceContext';
import { BmPerformance } from '../components/workforce/BmPerformance';
import { RmPerformance } from '../components/workforce/RmPerformance';
import { BreadcrumbNav } from '../components/workforce/BreadcrumbNav';
import { GlobalFilterBar } from '../components/workforce/GlobalFilterBar';
import { RecordDrawer } from '../components/workforce/RecordDrawer';
import { motion } from 'framer-motion';
import { Users, TrendingUp, PieChart, Target, UserX } from 'lucide-react';
import {
  Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, CartesianGrid, XAxis, YAxis,
  PieChart as RePieChart, Pie, Cell,
} from 'recharts';
import { useMemo } from 'react';

const BM_COLOR = '#3b82f6';
const RM_COLOR = '#f59e0b';

export function Teams() {
  const { bmData, rmData, teamTrend, employees, loadingState, showDrillDown } = useWorkforce();

  const allBmRm = useMemo(() => {
    const bm = employees.filter(e => e.dsgn === 'BM');
    const rm = employees.filter(e => e.dsgn === 'RM');
    return { bm, rm };
  }, [employees]);

  const bmByHq = useMemo(() => {
    const counts: Record<string, number> = {};
    allBmRm.bm.forEach(e => {
      const hq = String(e.hq || 'Unknown');
      counts[hq] = (counts[hq] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [allBmRm.bm]);

  const rmByHq = useMemo(() => {
    const counts: Record<string, number> = {};
    allBmRm.rm.forEach(e => {
      const hq = String(e.hq || 'Unknown');
      counts[hq] = (counts[hq] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [allBmRm.rm]);

  const bmVacancyPct = useMemo(() => {
    if (!allBmRm.bm.length) return 0;
    const abolished = allBmRm.bm.filter(e => e.dsgn === 'ABOLISHED' || !e.name).length;
    return Math.round((abolished / allBmRm.bm.length) * 100);
  }, [allBmRm.bm]);

  const rmVacancyPct = useMemo(() => {
    if (!allBmRm.rm.length) return 0;
    const abolished = allBmRm.rm.filter(e => e.dsgn === 'ABOLISHED' || !e.name).length;
    return Math.round((abolished / allBmRm.rm.length) * 100);
  }, [allBmRm.rm]);

  const bmVacant = allBmRm.bm.filter(e => e.dsgn === 'ABOLISHED' || !e.name).length;
  const rmVacant = allBmRm.rm.filter(e => e.dsgn === 'ABOLISHED' || !e.name).length;
  const totalBm = allBmRm.bm.length;
  const totalRm = allBmRm.rm.length;

  if (loadingState.bm && loadingState.rm && !bmData && !rmData) {
    return (
      <div className="space-y-5 pb-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-100 rounded w-40" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="h-[300px] bg-slate-100 rounded-xl" />
            <div className="h-[300px] bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Teams</h1>
          <p className="text-xs text-slate-400">BM & RM performance analytics</p>
        </div>
      </motion.div>

      <BreadcrumbNav />
      <GlobalFilterBar />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={() => showDrillDown(allBmRm.bm, 'All BM Records')} className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-200 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded bg-blue-100"><Users className="w-4 h-4 text-blue-600" /></div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalBm}</p>
          <p className="text-xs text-slate-500">Total BM</p>
        </button>
        <button onClick={() => showDrillDown(allBmRm.rm, 'All RM Records')} className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-200 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded bg-orange-100"><Users className="w-4 h-4 text-orange-600" /></div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalRm}</p>
          <p className="text-xs text-slate-500">Total RM</p>
        </button>
        <button onClick={() => {
          const vacant = allBmRm.bm.filter(e => e.dsgn === 'ABOLISHED' || !e.name);
          showDrillDown(vacant, 'BM Vacant Positions');
        }} className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-200 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded bg-red-100"><UserX className="w-4 h-4 text-red-600" /></div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{bmVacant}</p>
          <p className="text-xs text-slate-500">BM Vacant</p>
          <p className="text-[10px] text-slate-400">{bmVacancyPct}% vacancy</p>
        </button>
        <button onClick={() => {
          const vacant = allBmRm.rm.filter(e => e.dsgn === 'ABOLISHED' || !e.name);
          showDrillDown(vacant, 'RM Vacant Positions');
        }} className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-200 hover:shadow-sm transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded bg-red-100"><UserX className="w-4 h-4 text-red-600" /></div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{rmVacant}</p>
          <p className="text-xs text-slate-500">RM Vacant</p>
          <p className="text-[10px] text-slate-400">{rmVacancyPct}% vacancy</p>
        </button>
      </div>

      <BmPerformance />
      <RmPerformance />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">BM vs RM Distribution</h3>
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={[
                    { name: 'BM', value: totalBm },
                    { name: 'RM', value: totalRm },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  onClick={(entry) => {
                    if (entry.name === 'BM') showDrillDown(allBmRm.bm, 'All BM Records');
                    else if (entry.name === 'RM') showDrillDown(allBmRm.rm, 'All RM Records');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <Cell fill={BM_COLOR} />
                  <Cell fill={RM_COLOR} />
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">BM vs RM Comparison</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => showDrillDown(allBmRm.bm, 'All BM Records')} className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200 hover:border-blue-400 hover:shadow-sm transition-all">
              <p className="text-2xl font-bold text-blue-700">{totalBm}</p>
              <p className="text-xs text-blue-600">BM</p>
              <p className="text-[10px] text-blue-400 mt-1">{bmByHq.length} HQs</p>
            </button>
            <button onClick={() => showDrillDown(allBmRm.rm, 'All RM Records')} className="text-center p-4 rounded-lg bg-orange-50 border border-orange-200 hover:border-orange-400 hover:shadow-sm transition-all">
              <p className="text-2xl font-bold text-orange-700">{totalRm}</p>
              <p className="text-xs text-orange-600">RM</p>
              <p className="text-[10px] text-orange-400 mt-1">{rmByHq.length} HQs</p>
            </button>
          </div>
        </motion.div>
      </div>

      {teamTrend.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">BM/RM Trend Analysis</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={teamTrend}
              margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              onClick={(data: unknown) => {
                const d = data as { activePayload?: Array<{ payload: { period: string } }> } | null;
                if (!d?.activePayload?.length) return;
                const period = d.activePayload[0].payload.period;
                const records = employees.filter(e => {
                  const d = String(e.doj || '');
                  if (d.length >= 7) return d.slice(0, 4) === period.slice(0, 4);
                  return false;
                });
                if (records.length > 0) showDrillDown(records, `Employees in ${period}`);
              }}
              style={{ cursor: 'pointer' }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} interval={Math.max(Math.floor(teamTrend.length / 10), 1)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="bm" stroke={BM_COLOR} strokeWidth={2} name="BM" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="rm" stroke={RM_COLOR} strokeWidth={2} name="RM" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <RecordDrawer />
    </div>
  );
}
