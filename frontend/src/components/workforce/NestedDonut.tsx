import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { type Employee } from '../../contexts/WorkforceContext';
import { toNum, fmtMoney, fmtPct, totalRevenue } from '../../utils/displayUtils';

interface SlabData {
  name: string;
  count: number;
  revenue: number;
  contribPct: number;
  emps: Employee[];
  color: string;
}

const ACH_SLABS = [
  { name: '>100%', min: 100, max: Infinity, color: '#15803d' },
  { name: '90-100%', min: 90, max: 100, color: '#86efac' },
  { name: '80-90%', min: 80, max: 90, color: '#f59e0b' },
  { name: '<80%', min: -Infinity, max: 80, color: '#dc2626' },
];

const GROWTH_SLABS = [
  { name: '20%+', min: 20, max: Infinity, color: '#15803d' },
  { name: '10-20%', min: 10, max: 20, color: '#eab308' },
  { name: '0-10%', min: 0, max: 10, color: '#f97316' },
  { name: '<0%', min: -Infinity, max: 0, color: '#dc2626' },
];

function pctVal(e: Employee, field: string): number {
  return toNum(e[field]) * 100;
}

function computeSlabs(emps: Employee[], slabDefs: typeof ACH_SLABS, field: 'apr_ach' | 'growth'): SlabData[] {
  const filtered = emps.filter(e => {
    const val = pctVal(e, field);
    if (field === 'apr_ach' && val <= 0) return false;
    return true;
  });
  const totalRev = totalRevenue(filtered);

  return slabDefs.map(slab => {
    const matching = filtered.filter(e => {
      const val = pctVal(e, field);
      if (slab.name === '>100%' || slab.name === '20%+') return val >= slab.min;
      return val >= slab.min && val < slab.max;
    });
    const rev = totalRevenue(matching);
    return {
      name: slab.name,
      count: matching.length,
      revenue: rev,
      contribPct: totalRev > 0 ? (rev / totalRev) * 100 : 0,
      emps: matching,
      color: slab.color,
    };
  }).filter(s => s.count > 0);
}

interface NestedDonutProps {
  title: string;
  designation: string;
  employees: Employee[];
  onSlabClick: (designation: string, slabType: 'achievement' | 'growth', slab: SlabData) => void;
}

export type { SlabData };

export function NestedDonut({ title, designation, employees, onSlabClick }: NestedDonutProps) {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  const achSlabs = useMemo(() => computeSlabs(employees, ACH_SLABS, 'apr_ach'), [employees]);
  const grSlabs = useMemo(() => computeSlabs(employees, GROWTH_SLABS, 'growth'), [employees]);

  const totalCount = achSlabs.reduce((s, d) => s + d.count, 0);
  const avgAch = useMemo(() => {
    const vals = employees.map(e => pctVal(e, 'apr_ach')).filter(v => v > 0);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [employees]);
  const avgGr = useMemo(() => {
    const vals = employees.map(e => pctVal(e, 'growth'));
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [employees]);

  const outerData = achSlabs.map(s => ({ name: s.name, value: s.count, color: s.color }));
  const innerData = grSlabs.map(s => ({ name: s.name, value: s.count, color: s.color }));

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center py-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
        <p className="text-sm text-slate-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 mb-4">{designation} Distribution</p>

      <div className="relative cursor-pointer" style={{ width: 280, height: 280 }}>
        <ResponsiveContainer width={280} height={280}>
          <PieChart>
            <Pie
              data={outerData}
              cx="50%"
              cy="50%"
              innerRadius={95}
              outerRadius={130}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveSegment(`ach-${index}`)}
              onMouseLeave={() => setActiveSegment(null)}
              onClick={(_, index) => {
                if (achSlabs[index]) onSlabClick(designation, 'achievement', achSlabs[index]);
              }}
              style={{ cursor: 'pointer' }}
            >
              {outerData.map((entry, idx) => (
                <Cell
                  key={`ach-${idx}`}
                  fill={entry.color}
                  stroke="white"
                  strokeWidth={2}
                  opacity={activeSegment === `ach-${idx}` ? 1 : 0.9}
                />
              ))}
            </Pie>
            <Pie
              data={innerData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveSegment(`gr-${index}`)}
              onMouseLeave={() => setActiveSegment(null)}
              onClick={(_, index) => {
                if (grSlabs[index]) onSlabClick(designation, 'growth', grSlabs[index]);
              }}
              style={{ cursor: 'pointer' }}
            >
              {innerData.map((entry, idx) => (
                <Cell
                  key={`gr-${idx}`}
                  fill={entry.color}
                  stroke="white"
                  strokeWidth={2}
                  opacity={activeSegment === `gr-${idx}` ? 1 : 0.9}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as { name: string; value: number; color: string };
                const isOuter = outerData.some(o => o.name === d.name);
                const slab = isOuter
                  ? achSlabs.find(s => s.name === d.name)
                  : grSlabs.find(s => s.name === d.name);
                return (
                  <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="font-semibold text-slate-900">{d.name}</span>
                      <span className="text-slate-400">({isOuter ? 'Achievement' : 'Growth'})</span>
                    </div>
                    {slab && (
                      <div className="space-y-0.5 text-slate-600">
                        <p>Count: <span className="font-semibold text-slate-900">{slab.count}</span></p>
                        <p>Revenue: <span className="font-semibold text-slate-900">{fmtMoney(slab.revenue)}</span></p>
                        <p>Contribution: <span className="font-semibold text-slate-900">{fmtPct(slab.contribPct)}</span></p>
                      </div>
                    )}
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: 0 }}>
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">{totalCount}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">{designation}s</p>
            <div className="flex items-center justify-center gap-3 mt-1">
              <div>
                <p className={`text-xs font-bold ${avgAch >= 90 ? 'text-emerald-600' : avgAch >= 80 ? 'text-amber-600' : 'text-red-600'}`}>{fmtPct(avgAch)}</p>
                <p className="text-[8px] text-slate-400">ACH</p>
              </div>
              <div>
                <p className={`text-xs font-bold ${avgGr >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{avgGr >= 0 ? '+' : ''}{fmtPct(avgGr)}</p>
                <p className="text-[8px] text-slate-400">GR</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mt-4 space-y-2">
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Achievement (Outer Ring)</p>
          <div className="space-y-1">
            {achSlabs.map(slab => (
              <button
                key={`ach-${slab.name}`}
                onClick={() => onSlabClick(designation, 'achievement', slab)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors text-left"
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slab.color }} />
                <span className="text-xs font-medium text-slate-700 w-16">{slab.name}</span>
                <span className="text-sm font-bold text-slate-900">{slab.count}</span>
                <span className="text-[10px] text-slate-400 ml-auto">{fmtMoney(slab.revenue)}</span>
                <span className="text-[10px] font-medium text-slate-500 w-10 text-right">{fmtPct(slab.contribPct)}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Growth (Inner Ring)</p>
          <div className="space-y-1">
            {grSlabs.map(slab => (
              <button
                key={`gr-${slab.name}`}
                onClick={() => onSlabClick(designation, 'growth', slab)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors text-left"
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slab.color }} />
                <span className="text-xs font-medium text-slate-700 w-16">{slab.name}</span>
                <span className="text-sm font-bold text-slate-900">{slab.count}</span>
                <span className="text-[10px] text-slate-400 ml-auto">{fmtMoney(slab.revenue)}</span>
                <span className="text-[10px] font-medium text-slate-500 w-10 text-right">{fmtPct(slab.contribPct)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { ACH_SLABS, GROWTH_SLABS, computeSlabs, pctVal };