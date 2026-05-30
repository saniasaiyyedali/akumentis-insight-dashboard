import { motion } from 'framer-motion';
import { ArrowLeft, Users, AlertTriangle } from 'lucide-react';
import type { OSProfile } from '../../types/salesOS';

function fmtMoney(v: number) {
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return `₹${Math.round(v).toLocaleString()}`;
}

interface Props {
  profile: OSProfile;
  onBack: () => void;
  onSelectBM?: (empCode: string) => void;
}

export function EntityProfile({ profile, onBack, onSelectBM }: Props) {
  const isZone = profile.type === 'Zone';
  const isRM = profile.type === 'RM';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 shadow-xl">
        <p className="text-xs uppercase tracking-widest opacity-60">{profile.type} Profile</p>
        <h2 className="text-2xl font-bold mt-1">{profile.name}</h2>
        {(profile.zone || profile.state) && (
          <p className="text-sm opacity-70 mt-1">{[profile.zone, profile.state, profile.hq].filter(Boolean).join(' · ')}</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <Metric label="Revenue" value={fmtMoney(profile.revenue)} />
          <Metric label="Achievement" value={`${profile.achievement.toFixed(1)}%`} />
          <Metric label="Growth" value={`${profile.growth >= 0 ? '+' : ''}${profile.growth.toFixed(1)}%`} />
          <Metric label="At Risk" value={fmtMoney(profile.revenueAtRisk)} warn />
        </div>
      </div>

      {profile.managerChain && profile.managerChain.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Manager Chain</p>
          <div className="flex flex-wrap items-center gap-1 text-sm">
            {profile.managerChain.map((m, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-300">→</span>}
                <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                  <span className="text-[10px] text-slate-400 block">{m.role}</span>
                  {m.name}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {isZone && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Highlight label="Best State" name={profile.bestState?.name} value={profile.bestState ? fmtMoney(profile.bestState.revenue) : '-'} positive />
          <Highlight label="Worst State" name={profile.worstState?.name} value={profile.worstState ? `${profile.worstState.achievement.toFixed(0)}% ach` : '-'} />
          <Highlight label="Top RM" name={profile.topRM?.name} value={profile.topRM ? fmtMoney(profile.topRM.revenue) : '-'} positive />
          <Highlight label="Bottom RM" name={profile.bottomRM?.name} value={profile.bottomRM ? `${profile.bottomRM.achievement.toFixed(0)}% ach` : '-'} />
        </div>
      )}

      {(isRM && profile.bms) && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">BMs under {profile.name} ({profile.bmCount})</h3>
          </div>
          <div className="space-y-1 max-h-[320px] overflow-y-auto">
            {profile.bms.map(bm => (
              <button key={bm.empCode} onClick={() => onSelectBM?.(bm.empCode)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 text-left text-sm">
                <span className="flex-1 truncate font-medium">{bm.name}</span>
                <span className="text-emerald-600 font-semibold">{fmtMoney(bm.revenue)}</span>
                <span className={`text-xs ${bm.achievement >= 80 ? 'text-emerald-600' : 'text-red-600'}`}>{bm.achievement.toFixed(0)}%</span>
                {bm.atRisk && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {profile.type === 'BM' && profile.team && profile.team.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Team ({profile.teamCount})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {profile.team.map((t, i) => (
              <div key={i} className="px-3 py-2 rounded-lg bg-slate-50 text-sm">
                <span className="font-medium">{t.name}</span>
                <span className="text-emerald-600 ml-2">{fmtMoney(t.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <p className={`text-xl font-bold ${warn ? 'text-orange-300' : ''}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider opacity-60 mt-0.5">{label}</p>
    </div>
  );
}

function Highlight({ label, name, value, positive }: { label: string; name?: string; value: string; positive?: boolean }) {
  return (
    <div className={`rounded-xl p-3 border ${positive ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-[10px] uppercase text-slate-500">{label}</p>
      <p className="text-sm font-bold text-slate-900 truncate mt-1">{name || '-'}</p>
      <p className="text-xs text-slate-600">{value}</p>
    </div>
  );
}
