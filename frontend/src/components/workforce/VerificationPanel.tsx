import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWorkforce, type Employee } from '../../contexts/WorkforceContext';
import { Search, Shield, CheckCircle, XCircle } from 'lucide-react';

export function VerificationPanel() {
  const { verifyResults, verifyLoading, runVerify, openDrawer } = useWorkforce();
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = () => {
    runVerify(searchInput);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-emerald-100">
          <Shield className="w-4 h-4 text-emerald-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">Verification Panel</h3>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Search employee name, code, or any field..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={verifyLoading || !searchInput}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {verifyLoading ? 'Searching...' : 'Verify'}
        </button>
      </div>

      {verifyResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            Found {verifyResults.length} matching records
          </p>
          {verifyResults.map((result, i) => {
            const emp = result.record as Employee;
            const matchCount = result.matchedFields.length;
            return (
              <button
                key={i}
                onClick={() => openDrawer(emp)}
                className="w-full text-left p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-900">
                    {String(emp.name || emp.empCode || '-')}
                  </span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5" />
                    {matchCount} matches
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {result.matchedFields.slice(0, 5).map(field => (
                    <span key={field} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-mono">
                      {field}: {String(emp[field] ?? '').slice(0, 30)}
                    </span>
                  ))}
                  {result.matchedFields.length > 5 && (
                    <span className="text-[10px] text-slate-400">+{result.matchedFields.length - 5} more</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {verifyResults.length === 0 && searchInput && !verifyLoading && (
        <div className="text-center py-6 text-slate-400">
          <XCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No matching records found</p>
        </div>
      )}

      {!searchInput && (
        <div className="text-center py-6 text-slate-400">
          <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Enter a search term to verify records</p>
          <p className="text-xs mt-1">Matches against all columns in the Excel data</p>
        </div>
      )}
    </motion.div>
  );
}
