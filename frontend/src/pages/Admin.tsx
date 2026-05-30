import { useWorkforce } from '../contexts/WorkforceContext';
import { DataQualityPanel } from '../components/workforce/DataQualityPanel';
import { VerificationPanel } from '../components/workforce/VerificationPanel';
import { BreadcrumbNav } from '../components/workforce/BreadcrumbNav';
import { motion } from 'framer-motion';
import { Shield, Clock, Database, CheckCircle, AlertTriangle } from 'lucide-react';

export function Admin() {
  const { dataQuality, lastRefresh, employees } = useWorkforce();

  const refreshTime = dataQuality?.lastRefresh || lastRefresh;

  return (
    <div className="space-y-5 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Admin</h1>
          <p className="text-xs text-slate-400">Data verification and quality monitoring</p>
        </div>
      </motion.div>

      <BreadcrumbNav />

      <DataQualityPanel />

      <VerificationPanel />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Last Refresh</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border border-slate-100">
            <p className="text-xs text-slate-500">Excel Loaded Time</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">
              {refreshTime ? new Date(refreshTime).toLocaleString() : 'N/A'}
            </p>
          </div>
          <div className="p-3 rounded-lg border border-slate-100">
            <p className="text-xs text-slate-500">Data Refresh Time</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">
              {refreshTime ? new Date(refreshTime).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>
      </motion.div>

      {dataQuality && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">System Information</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500">Data Source</p>
              <p className="text-sm font-medium text-slate-900 mt-1">master_data.xlsx</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500">Total Records</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{dataQuality.totalRecords.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500">Total Columns</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{dataQuality.totalColumns}</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-500">Employee Records</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{employees.length.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>
      )}

      {dataQuality && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-slate-900">Data Quality Summary</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className={`p-3 rounded-lg border ${
              dataQuality.missingValues === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
            }`}>
              <div className="flex items-center gap-2">
                {dataQuality.missingValues === 0
                  ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                  : <AlertTriangle className="w-4 h-4 text-amber-600" />
                }
                <span className="text-xs font-medium text-slate-700">Records with Missing Values</span>
              </div>
              <p className="text-lg font-bold text-slate-900 mt-1">{dataQuality.missingValues}</p>
            </div>
            <div className={`p-3 rounded-lg border ${
              dataQuality.duplicateEmpCodes === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
            }`}>
              <div className="flex items-center gap-2">
                {dataQuality.duplicateEmpCodes === 0
                  ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                  : <AlertTriangle className="w-4 h-4 text-amber-600" />
                }
                <span className="text-xs font-medium text-slate-700">Duplicate Emp Codes</span>
              </div>
              <p className="text-lg font-bold text-slate-900 mt-1">{dataQuality.duplicateEmpCodes}</p>
            </div>
            <div className={`p-3 rounded-lg border ${
              dataQuality.duplicateNames === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
            }`}>
              <div className="flex items-center gap-2">
                {dataQuality.duplicateNames === 0
                  ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                  : <AlertTriangle className="w-4 h-4 text-amber-600" />
                }
                <span className="text-xs font-medium text-slate-700">Duplicate Names</span>
              </div>
              <p className="text-lg font-bold text-slate-900 mt-1">{dataQuality.duplicateNames}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
