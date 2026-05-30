import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { fmtMoney, fmtPct } from '../../utils/format';

export interface SegmentMember {
  name: string;
  empCode: string;
  designation: string;
  zone: string;
  state: string;
  revenue: number;
  achievement: number;
  growth: number;
  contributionPct: number;
  revenueAtRisk: number;
  atRisk: boolean;
  managerChain: { role: string; name: string; empCode: string }[];
}

interface Props {
  title: string;
  members: SegmentMember[];
  totalCount: number;
  onClose: () => void;
}

export function SegmentExpansion({ title, members, totalCount, onClose }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">{title}</h4>
              <p className="text-[10px] text-slate-500">{totalCount} managers · showing {members.length}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {members.map((m, i) => (
              <div key={m.empCode + i} className="bg-white rounded-xl border border-slate-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                    <p className="text-[10px] text-slate-400">{m.designation} · {m.zone} · {m.state}</p>
                  </div>
                  {m.atRisk && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2 text-[10px]">
                  <Stat label="Revenue" value={fmtMoney(m.revenue)} />
                  <Stat label="Contrib" value={fmtPct(m.contributionPct)} />
                  <Stat label="Ach" value={fmtPct(m.achievement)} warn={m.achievement < 80} />
                  <Stat label="Growth" value={`${m.growth >= 0 ? '+' : ''}${fmtPct(m.growth)}`} warn={m.growth < 0} />
                  <Stat label="At Risk" value={m.revenueAtRisk > 0 ? fmtMoney(m.revenueAtRisk) : '—'} warn={m.revenueAtRisk > 0} />
                </div>
                {m.managerChain.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-2 truncate">
                    Chain: {m.managerChain.map(c => `${c.role}: ${c.name}`).join(' → ')}
                  </p>
                )}
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No managers in this segment.</p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <p className="text-slate-400">{label}</p>
      <p className={`font-semibold ${warn ? 'text-red-600' : 'text-slate-800'}`}>{value}</p>
    </div>
  );
}
