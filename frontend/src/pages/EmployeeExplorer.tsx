import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, User } from 'lucide-react';
import { useWorkforce } from '../contexts/WorkforceContext';
import { EntityProfile } from '../components/sales-os/EntityProfile';
import { workforceAPI } from '../services/workforce';
import type { OSProfile } from '../types/salesOS';
import type { Employee } from '../contexts/WorkforceContext';

export function EmployeeExplorer() {
  const { employees, loading } = useWorkforce();
  const [search, setSearch] = useState('');
  const [profile, setProfile] = useState<OSProfile | null>(null);

  const active = useMemo(() =>
    employees.filter(e => e.dsgn !== 'ABOLISHED' && e.name && !['Vacant', 'VACANT'].includes(String(e.name).trim())),
  [employees]);

  const filtered = useMemo(() => {
    if (!search) return active.slice(0, 30);
    const q = search.toLowerCase();
    return active.filter(e =>
      String(e.name || '').toLowerCase().includes(q) ||
      String(e.zone || '').toLowerCase().includes(q) ||
      String(e.state || '').toLowerCase().includes(q) ||
      String(e.hq || '').toLowerCase().includes(q) ||
      String(e.dsgn || '').toLowerCase().includes(q)
    ).slice(0, 50);
  }, [active, search]);

  const openProfile = async (emp: Employee) => {
    const code = String(emp.empCode || emp.empcode || '');
    const dsgn = String(emp.dsgn || '').toUpperCase();
    if (dsgn === 'BM' && code) {
      const r = await workforceAPI.getOSProfile('bm', code);
      setProfile(r.data);
    } else if (dsgn === 'RM' && code) {
      const r = await workforceAPI.getOSProfile('rm', code);
      setProfile(r.data);
    }
  };

  if (profile) {
    return (
      <div className="max-w-4xl mx-auto pb-8">
        <EntityProfile profile={profile} onBack={() => setProfile(null)} onSelectBM={id => workforceAPI.getOSProfile('bm', id).then(r => setProfile(r.data))} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Employee Explorer</h1>
          <p className="text-xs text-slate-500">Search and open BM/RM profiles</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, zone, state, HQ, role..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-1">
          {filtered.map((emp, i) => {
            const isProfile = ['BM', 'RM'].includes(String(emp.dsgn));
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => isProfile && openProfile(emp)}
                disabled={!isProfile}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${isProfile ? 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer' : 'bg-slate-50 border-slate-100 cursor-default opacity-60'}`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {String(emp.name || '?').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{String(emp.name)}</p>
                  <p className="text-[10px] text-slate-400">{String(emp.dsgn)} · {String(emp.zone)} · {String(emp.hq)}</p>
                </div>
                {isProfile && <span className="text-[10px] text-blue-600 font-medium">Open profile →</span>}
              </motion.button>
            );
          })}
          {!search && <p className="text-xs text-slate-400 text-center pt-2">Type to search {active.length.toLocaleString()} employees</p>}
        </div>
      )}
    </div>
  );
}
