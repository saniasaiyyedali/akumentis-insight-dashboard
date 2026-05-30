import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ChevronDown } from 'lucide-react';
import { fmtMoney } from '../../utils/format';

interface OwnerGroup {
  name: string;
  revenueAtRisk: number;
  count: number;
}

interface RiskTile {
  count: number;
  revenueAtRisk: number;
  topZones: OwnerGroup[];
  topStates: OwnerGroup[];
  topRMs: OwnerGroup[];
  topBMs: OwnerGroup[];
}

interface Props {
  data: {
    revenueLeakage: RiskTile;
    coverageRisk: RiskTile;
    negativeGrowth: RiskTile;
    achievementRisk: RiskTile;
    totalRevenueAtRisk: number;
  };
}

const TILES = [
  { key: 'revenueLeakage' as const, label: 'Revenue Leakage', color: 'from-red-500 to-orange-500' },
  { key: 'coverageRisk' as const, label: 'Coverage Risk', color: 'from-amber-500 to-yellow-500' },
  { key: 'negativeGrowth' as const, label: 'Negative Growth', color: 'from-rose-500 to-pink-500' },
  { key: 'achievementRisk' as const, label: 'Achievement Risk', color: 'from-orange-600 to-red-600' },
];

export function LeakageOwnership({ data }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-red-500" />
        <h2 className="text-sm font-bold text-slate-900">Revenue Leakage Ownership</h2>
        <span className="text-xs text-red-600 font-semibold ml-auto">{fmtMoney(data.totalRevenueAtRisk)} total at risk</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TILES.map(tile => {
          const t = data[tile.key];
          const isOpen = open === tile.key;
          return (
            <div key={tile.key} className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <button
                onClick={() => setOpen(isOpen ? null : tile.key)}
                className={`w-full p-4 text-left bg-gradient-to-br ${tile.color} text-white`}
              >
                <p className="text-xs opacity-80">{tile.label}</p>
                <p className="text-2xl font-bold mt-1">{fmtMoney(t.revenueAtRisk)}</p>
                <p className="text-[10px] opacity-70 mt-1">{t.count} employees</p>
                <ChevronDown className={`w-4 h-4 mt-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-white">
                    <div className="p-3 space-y-3 text-[10px]">
                      <OwnerSection label="Zones" items={t.topZones} />
                      <OwnerSection label="States" items={t.topStates} />
                      <OwnerSection label="RMs" items={t.topRMs} />
                      <OwnerSection label="BMs" items={t.topBMs} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OwnerSection({ label, items }: { label: string; items: OwnerGroup[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="font-semibold text-slate-500 uppercase mb-1">{label}</p>
      {items.map(o => (
        <div key={o.name} className="flex justify-between py-0.5 text-slate-700">
          <span className="truncate">{o.name}</span>
          <span className="text-red-600 font-medium shrink-0 ml-2">{fmtMoney(o.revenueAtRisk)}</span>
        </div>
      ))}
    </div>
  );
}
