import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { CoreKPIs } from '../components/sales-os/CoreKPIs';
import { AnalyticsSplitGrid, type SplitChart } from '../components/sales-os/AnalyticsSplitGrid';
import { SegmentDrillPanel } from '../components/sales-os/SegmentDrillPanel';
import { TopBottomLeaderboards } from '../components/sales-os/TopBottomLeaderboards';
import { LeakageOwnership } from '../components/sales-os/LeakageOwnership';
import { SalesCopilot } from '../components/sales-os/SalesCopilot';
import { workforceAPI } from '../services/workforce';
import type { OSSummary } from '../types/salesOS';
import type { SegmentMember } from '../components/sales-os/SegmentExpansion';

export function Overview() {
  const [summary, setSummary] = useState<OSSummary | null>(null);
  const [charts, setCharts] = useState<SplitChart[]>([]);
  const [topBottom, setTopBottom] = useState<{ rm: { top: SegmentMember[]; bottom: SegmentMember[] }; bm: { top: SegmentMember[]; bottom: SegmentMember[] } } | null>(null);
  const [leakage, setLeakage] = useState<Parameters<typeof LeakageOwnership>[0]['data'] | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeChartId, setActiveChartId] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [drill, setDrill] = useState<{
    title: string;
    aggregate: { revenue: number; achievement: number; growth: number; contributionPct: number; revenueAtRisk: number; count: number } | null;
    byZone: { name: string; revenue: number; achievement: number; growth: number; revenueAtRisk: number }[];
    byState: { name: string; revenue: number; achievement: number; growth: number; revenueAtRisk: number }[];
    topPerformers: SegmentMember[];
    bottomPerformers: SegmentMember[];
    totalCount: number;
  } | null>(null);
  const [segmentLoading, setSegmentLoading] = useState(false);
  const drillRef = useRef<HTMLDivElement>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, hubRes, tbRes, leakRes] = await Promise.all([
        workforceAPI.getOSSummary(),
        workforceAPI.getOSPerformanceHub(),
        workforceAPI.getOSTopBottom(),
        workforceAPI.getOSLeakageOwnership(),
      ]);
      setSummary(sumRes.data ?? null);
      const hubCharts = hubRes.data?.charts ?? [];
      setCharts(hubCharts.map((c: SplitChart) => ({
        id: c.id,
        title: c.title,
        vizType: c.vizType || 'bar',
        segments: c.segments ?? [],
        level: c.level,
        segmentType: c.segmentType,
      })));
      setTopBottom(tbRes.data ?? null);
      setLeakage(leakRes.data ?? null);
    } catch {
      setSummary(null);
      setCharts([]);
      setTopBottom(null);
      setLeakage(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleSegmentClick = async (chartId: string, segment: string) => {
    if (activeChartId === chartId && activeSegment === segment) {
      setActiveChartId(null);
      setActiveSegment(null);
      setDrill(null);
      return;
    }
    const chart = charts.find(c => c.id === chartId);
    if (!chart) return;

    setActiveChartId(chartId);
    setActiveSegment(segment);
    setSegmentLoading(true);

    try {
      const hubChart = charts.find(c => c.id === chartId);
      const res = await workforceAPI.getOSSegmentMembers({
        level: hubChart?.level ?? (chartId.includes('rm') ? 'RM' : 'BM'),
        segmentType: hubChart?.segmentType ?? (chartId.includes('growth') ? 'growth' : 'achievement'),
        segment,
      });
      const d = res.data;
      setDrill({
        title: `${chart.title} · ${segment}`,
        aggregate: d?.aggregate ?? null,
        byZone: d?.byZone ?? [],
        byState: d?.byState ?? [],
        topPerformers: d?.topPerformers ?? [],
        bottomPerformers: d?.bottomPerformers ?? [],
        totalCount: d?.totalCount ?? 0,
      });
      setTimeout(() => drillRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
    } catch {
      setDrill({ title: `${chart.title} · ${segment}`, aggregate: null, byZone: [], byState: [], topPerformers: [], bottomPerformers: [], totalCount: 0 });
    } finally {
      setSegmentLoading(false);
    }
  };

  const scrollToLeakage = () => document.getElementById('leakage-section')?.scrollIntoView({ behavior: 'smooth' });

  if (loading && !summary) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-10 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Command</h1>
        <p className="text-sm text-slate-500 mt-0.5">Operational intelligence for sales leadership</p>
      </motion.div>

      {summary && <CoreKPIs summary={summary} onRiskClick={scrollToLeakage} />}

      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Performance Splits</h2>
        {charts.length > 0 ? (
          <AnalyticsSplitGrid
            charts={charts}
            activeChartId={activeChartId}
            activeSegment={activeSegment}
            onSegmentClick={handleSegmentClick}
          />
        ) : (
          <p className="text-sm text-slate-400 py-8 text-center bg-white rounded-2xl border">Performance data unavailable.</p>
        )}
        <div ref={drillRef}>
          {segmentLoading && <div className="mt-4 h-32 bg-slate-50 rounded-2xl animate-pulse" />}
          {!segmentLoading && drill && activeSegment && (
            <SegmentDrillPanel
              title={drill.title}
              aggregate={drill.aggregate}
              byZone={drill.byZone}
              byState={drill.byState}
              topPerformers={drill.topPerformers}
              bottomPerformers={drill.bottomPerformers}
              totalCount={drill.totalCount}
              onClose={() => { setActiveChartId(null); setActiveSegment(null); setDrill(null); }}
            />
          )}
        </div>
      </section>

      {topBottom && (
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Top & Bottom Ownership</h2>
          <TopBottomLeaderboards rm={topBottom.rm} bm={topBottom.bm} />
        </section>
      )}

      {leakage && (
        <section id="leakage-section">
          <LeakageOwnership data={leakage} />
        </section>
      )}

      <SalesCopilot onAction={(a) => { if (a?.type === 'leakage') scrollToLeakage(); }} />
    </div>
  );
}
