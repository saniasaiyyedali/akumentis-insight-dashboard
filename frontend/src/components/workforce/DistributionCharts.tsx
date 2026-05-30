import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Treemap, Cell } from 'recharts';
import { type Employee } from '../../contexts/WorkforceContext';
import { totalRevenue, groupBy, normalizeKey, toNum, activeEmployees } from '../../utils/displayUtils';
import { pct, ACH_SLABS, GROWTH_SLABS, computeSlabs } from '../../utils/salesAnalytics';

const COLORS = ['#15803d', '#86efac', '#f59e0b', '#dc2626', '#3b82f6', '#8b5cf6'];

interface DistributionChartsProps {
  employees: Employee[];
}

export function DistributionCharts({ employees }: DistributionChartsProps) {
  const active = useMemo(() => activeEmployees(employees), [employees]);
  const achSlabs = useMemo(() => computeSlabs(active, ACH_SLABS, 'apr_ach'), [active]);
  const grSlabs = useMemo(() => computeSlabs(active, GROWTH_SLABS, 'growth'), [active]);

  const zoneTreemap = useMemo(() => {
    const g = groupBy(active.filter(e => e.zone), e => normalizeKey(String(e.zone)));
    return [...g.entries()].map(([name, emps]) => ({
      name, size: totalRevenue(emps), count: emps.length,
    })).sort((a, b) => b.size - a.size).slice(0, 12);
  }, [active]);

  const riskDist = useMemo(() => {
    let lowAch = 0, negGr = 0, lowCov = 0, healthy = 0;
    for (const e of active) {
      const ach = pct(e, 'apr_ach');
      const gr = pct(e, 'growth');
      const cov = pct(e, 'april26_cov');
      if (ach > 0 && ach < 80) lowAch++;
      else if (gr < 0) negGr++;
      else if (cov > 0 && cov < 60) lowCov++;
      else healthy++;
    }
    return [
      { name: 'Low Achievement', value: lowAch, fill: '#dc2626' },
      { name: 'Negative Growth', value: negGr, fill: '#f97316' },
      { name: 'Coverage Risk', value: lowCov, fill: '#eab308' },
      { name: 'Healthy', value: healthy, fill: '#15803d' },
    ].filter(d => d.value > 0);
  }, [active]);

  const revenueByState = useMemo(() => {
    const g = groupBy(active.filter(e => e.state), e => normalizeKey(String(e.state)));
    return [...g.entries()].map(([name, emps]) => ({ name, revenue: totalRevenue(emps) }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [active]);

  if (active.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ChartCard title="Achievement Distribution">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={achSlabs} layout="vertical" margin={{ left: 60 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={55} />
            <Tooltip formatter={(v, _n, p) => [`${v} people · ${(p.payload as { revenue: number }).revenue?.toFixed?.(0) || ''}`, 'Count']} />
            <Bar dataKey="count" radius={4}>
              {achSlabs.map((s, i) => <Cell key={i} fill={s.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Growth Distribution">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={grSlabs} layout="vertical" margin={{ left: 60 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={55} />
            <Tooltip />
            <Bar dataKey="count" radius={4}>
              {grSlabs.map((s, i) => <Cell key={i} fill={s.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Revenue Treemap by Zone">
        <ResponsiveContainer width="100%" height={220}>
          <Treemap data={zoneTreemap} dataKey="size" nameKey="name" aspectRatio={4 / 3} stroke="#fff">
            {zoneTreemap.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Treemap>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Risk Distribution">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={riskDist}>
            <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" radius={4}>{riskDist.map((d, i) => <Cell key={i} fill={d.fill} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top States by Revenue" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={revenueByState}>
            <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={55} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => [toNum(v).toFixed(2), 'Revenue']} />
            <Bar dataKey="revenue" fill="#3b82f6" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 ${className || ''}`}>
      <h3 className="text-sm font-bold text-slate-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}
