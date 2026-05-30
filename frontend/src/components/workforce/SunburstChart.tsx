import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { type Employee } from '../../contexts/WorkforceContext';
import { toNum, fmtMoney } from '../../utils/displayUtils';

const HIERARCHY_ORDER = ['BU Head', 'NSM', 'ZM', 'SM', 'RM', 'BM'] as const;
const RING_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6'];
const CHILD_COLORS = ['#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f0abfc', '#f5d0fe',
  '#34d399', '#6ee7b7', '#a7f3d0', '#86efac', '#4ade80', '#22c55e',
  '#fb923c', '#fdba74', '#fed7aa', '#fcd34d', '#fbbf24', '#f59e0b',
  '#60a5fa', '#93c5fd', '#bfdbfe', '#38bdf8', '#7dd3fc', '#bae6fd',
  '#f472b6', '#f9a8d4', '#fbcfe8', '#2dd4bf', '#5eead4', '#99f6e4'];

function groupByDsgn(emps: Employee[], dsgn: string): Employee[] {
  return emps.filter(e => e.dsgn?.toUpperCase() === dsgn.toUpperCase());
}

interface SunburstLevel {
  level: number;
  name: string;
  label: string;
  data: { name: string; value: number; revenue: number; count: number; fill: string }[];
}

export function SunburstChart({ employees, onSliceClick }: {
  employees: Employee[];
  onSliceClick: (level: string, value: string, emps: Employee[]) => void;
}) {
  const levels = useMemo(() => {
    const result: SunburstLevel[] = [];
    const active = employees.filter(e => e.dsgn !== 'ABOLISHED' && e.name);

    for (let levelIdx = 0; levelIdx < HIERARCHY_ORDER.length; levelIdx++) {
      const role = HIERARCHY_ORDER[levelIdx];
      const roleEmps = groupByDsgn(active, role);
      const groups: Record<string, { emps: Employee[]; revenue: number }> = {};

      for (const emp of roleEmps) {
        const key = emp.name || 'Unknown';
        if (!groups[key]) groups[key] = { emps: [], revenue: 0 };
        groups[key].emps.push(emp);
        groups[key].revenue += toNum(emp.net_sale_apr_26);
      }

      const entries = Object.entries(groups)
        .map(([name, g]) => ({ name, count: g.emps.length, revenue: g.revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 20);

      result.push({
        level: levelIdx,
        name: role,
        label: role,
        data: entries.map((e, i) => ({
          ...e,
          value: e.revenue || 1,
          fill: CHILD_COLORS[i % CHILD_COLORS.length],
        })),
      });

      // Only compute next level from children of this level's top entries
      // (simplification: compute overall totals)
    }

    return result;
  }, [employees]);

  const renderPie = (level: SunburstLevel, index: number) => {
    const innerR = 20 + index * 55;
    const outerR = 20 + (index + 1) * 55;

    return (
      <Pie
        key={index}
        data={level.data}
        cx="50%"
        cy="50%"
        innerRadius={innerR}
        outerRadius={outerR}
        dataKey="value"
        nameKey="name"
        startAngle={90}
        endAngle={-270}
        onClick={(entry) => {
          const payload = entry as unknown as { name: string };
          const role = level.name;
          const roleEmps = groupByDsgn(employees, role).filter(e => e.name === payload.name);
          onSliceClick(level.name, payload.name, roleEmps);
        }}
        style={{ cursor: 'pointer' }}
      >
        {level.data.map((entry, idx) => (
          <Cell key={idx} fill={entry.fill} />
        ))}
      </Pie>
    );
  };

  if (levels.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-xs text-slate-400">No hierarchy data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Sales Hierarchy</h3>
        <span className="text-xs text-slate-400 ml-auto">{employees.length} employees</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-400 mb-3 pb-2 border-b border-slate-100 flex-wrap">
        {HIERARCHY_ORDER.map((role, i) => (
          <span key={role} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RING_COLORS[i] }} />
            {role}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <PieChart>
          {levels.map((level, i) => renderPie(level, i))}
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as { name: string; count: number; revenue: number };
            return (
              <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs max-w-[200px]">
                <p className="font-semibold text-slate-900 mb-1">{d.name}</p>
                <div className="space-y-1 text-slate-600">
                  <p className="flex justify-between"><span>Count</span><span className="font-medium text-slate-900">{d.count}</span></p>
                  <p className="flex justify-between"><span>Revenue</span><span className="font-medium text-slate-900">{fmtMoney(d.revenue)}</span></p>
                </div>
              </div>
            );
          }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
