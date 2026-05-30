import { useWorkforce } from '../contexts/WorkforceContext';
import { KpiCards } from '../components/workforce/KpiCards';
import { HierarchyDrilldown } from '../components/workforce/HierarchyDrilldown';
import { GlobalFilterBar } from '../components/workforce/GlobalFilterBar';
import { BreadcrumbNav } from '../components/workforce/BreadcrumbNav';
import { GlobalSearch } from '../components/workforce/GlobalSearch';
import { RecordDrawer } from '../components/workforce/RecordDrawer';
import { motion } from 'framer-motion';
import { Briefcase, RefreshCw, Clock, Users, Building2, MapPin, Target } from 'lucide-react';
import { normalizeKey } from '../utils/displayUtils';

export function WorkforceOverview() {
  const { loading, kpi, error, refreshData, lastRefresh, employees, showDrillDown } = useWorkforce();

  const snapshotCards = kpi ? [
    { label: 'Active Employees', value: kpi.activeEmployees.toLocaleString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Divisions', value: kpi.totalDivisions.toLocaleString(), icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Zones', value: kpi.totalZones.toLocaleString(), icon: MapPin, color: 'text-violet-600', bg: 'bg-violet-100' },
    { label: 'States', value: kpi.totalStates.toLocaleString(), icon: Target, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Headquarters', value: kpi.totalHQs.toLocaleString(), icon: Building2, color: 'text-teal-600', bg: 'bg-teal-100' },
  ] : [];

  if (error && !kpi) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Unable to load data</h2>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Workforce Overview</h1>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{employees.length} records</span>
              {lastRefresh && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(lastRefresh).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto sm:max-w-sm">
          <GlobalSearch />
          <button
            onClick={refreshData}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 shrink-0"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-700"
        >
          <Briefcase className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={refreshData} className="ml-auto text-xs font-medium underline">Retry</button>
        </motion.div>
      )}

      <BreadcrumbNav />
      <GlobalFilterBar />

      <KpiCards />

      {!loading && snapshotCards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-xl p-4"
        >
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Workforce Snapshot</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {snapshotCards.map(card => {
              const Icon = card.icon;
              const handleSnapshotClick = () => {
                switch (card.label) {
                  case 'Active Employees':
                    if (employees.length > 0) showDrillDown(employees, 'All Employees');
                    break;
                  case 'Divisions': {
                    const divisions = [...new Set(employees.map(e => normalizeKey(e.division)).filter(Boolean))];
                    const records = employees.filter(e => e.division);
                    if (records.length > 0) showDrillDown(records, `All ${divisions.length} Divisions`);
                    break;
                  }
                  case 'Zones': {
                    const records = employees.filter(e => e.zone);
                    if (records.length > 0) showDrillDown(records, 'All Zones');
                    break;
                  }
                  case 'States': {
                    const records = employees.filter(e => e.state);
                    if (records.length > 0) showDrillDown(records, 'All States');
                    break;
                  }
                  case 'Headquarters': {
                    const records = employees.filter(e => e.hq);
                    if (records.length > 0) showDrillDown(records, 'All HQs');
                    break;
                  }
                }
              };
              return (
                <button key={card.label} onClick={handleSnapshotClick} className="p-3 rounded-lg border border-slate-100 text-left hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded ${card.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{card.value}</p>
                  <p className="text-xs text-slate-500">{card.label}</p>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <HierarchyDrilldown />
        </div>
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-400">
            <p className="text-sm">Select a hierarchy node or apply filters to drill down</p>
            <p className="text-xs mt-1">Use the organization hierarchy to explore the workforce structure</p>
          </div>
        </div>
      </div>

      <RecordDrawer />
    </div>
  );
}
