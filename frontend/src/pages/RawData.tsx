import { useWorkforce } from '../contexts/WorkforceContext';
import { MasterDataGrid } from '../components/workforce/MasterDataGrid';
import { BreadcrumbNav } from '../components/workforce/BreadcrumbNav';
import { GlobalFilterBar } from '../components/workforce/GlobalFilterBar';
import { RecordDrawer } from '../components/workforce/RecordDrawer';
import { motion } from 'framer-motion';
import { Database, Table } from 'lucide-react';

export function RawData() {
  const { employees, allColumns, loadingState } = useWorkforce();

  return (
    <div className="space-y-5 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shrink-0">
          <Database className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Raw Data</h1>
          <p className="text-xs text-slate-400">
            {allColumns.length} columns · {employees.length} records
          </p>
        </div>
      </motion.div>

      <BreadcrumbNav />
      <GlobalFilterBar />

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">Master Data Grid</h3>
          </div>
          <span className="text-xs text-slate-400">
            {loadingState.employees ? 'Loading...' : `${employees.length} rows · ${allColumns.length} columns`}
          </span>
        </div>
        <MasterDataGrid />
      </div>

      <RecordDrawer />
    </div>
  );
}