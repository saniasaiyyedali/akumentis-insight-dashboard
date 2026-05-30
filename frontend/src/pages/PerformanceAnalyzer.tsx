import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import type { SplitChart } from '../components/sales-os/AnalyticsSplitGrid';
import { PerformanceHierarchySwitcher, PERFORMANCE_LEVELS } from '../components/sales-os/performance/PerformanceHierarchySwitcher';
import { PerformanceSplitCharts } from '../components/sales-os/performance/PerformanceSplitCharts';
import { PerformanceSegmentInsight } from '../components/sales-os/performance/PerformanceSegmentInsight';
import type { SegmentMember } from '../components/sales-os/SegmentExpansion';
import { workforceAPI } from '../services/workforce';

function mapHubChart(c: SplitChart & { level?: string; segmentType?: string }): SplitChart {
  const isAch = c.id.includes('achievement') || c.segmentType === 'achievement';
  return {
    id: c.id,
    title: isAch ? 'Achievement Split' : 'Growth Split',
    vizType: (c.vizType as SplitChart['vizType']) || (isAch ? 'bar' : 'radial'),
    segments: c.segments ?? [],
    level: c.level,
    segmentType: c.segmentType,
  };
}

export function PerformanceAnalyzer() {
  const [hubCharts, setHubCharts] = useState<SplitChart[]>([]);
  const [levelCharts, setLevelCharts] = useState<SplitChart[]>([]);
  const [level, setLevel] = useState('RM');
  const [activeChartId, setActiveChartId] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [insight, setInsight] = useState<{
    title: string;
    aggregate: { revenue: number; achievement: number; growth: number; contributionPct: number; revenueAtRisk: number; count: number } | null;
    topPerformers: SegmentMember[];
    bottomPerformers: SegmentMember[];
    totalCount: number;
  } | null>(null);
  const [hubLoading, setHubLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    workforceAPI
      .getOSPerformanceHub()
      .then(r => {
        const hub = r.data?.charts ?? [];
        setHubCharts(
          hub.map((c: SplitChart & { level?: string; segmentType?: string; vizType?: string }) => ({
            id: c.id,
            title: c.title,
            vizType: (c.vizType as SplitChart['vizType']) || 'bar',
            segments: c.segments ?? [],
            level: c.level,
            segmentType: c.segmentType,
          }))
        );
      })
      .catch(() => setError('Failed to load performance data'))
      .finally(() => setHubLoading(false));
  }, []);

  const loadChartsForLevel = useCallback(
    async (nextLevel: string) => {
      if (nextLevel === 'RM' || nextLevel === 'BM') {
        const fromHub = hubCharts
          .filter(c => c.id.startsWith(nextLevel.toLowerCase()))
          .map(c => mapHubChart(c as SplitChart & { level?: string; segmentType?: string }));
        if (fromHub.length >= 2) {
          setLevelCharts(fromHub);
          return;
        }
      }

      setChartsLoading(true);
      try {
        const [achRes, grRes] = await Promise.all([
          workforceAPI.getOSSegments({ level: nextLevel, segmentType: 'achievement' }),
          workforceAPI.getOSSegments({ level: nextLevel, segmentType: 'growth' }),
        ]);
        const achSegs = achRes.data?.segments ?? [];
        const grSegs = grRes.data?.segments ?? [];
        setLevelCharts([
          {
            id: `${nextLevel}-achievement`,
            title: 'Achievement Split',
            vizType: 'bar',
            segments: achSegs,
            level: nextLevel,
            segmentType: 'achievement',
          },
          {
            id: `${nextLevel}-growth`,
            title: 'Growth Split',
            vizType: 'radial',
            segments: grSegs,
            level: nextLevel,
            segmentType: 'growth',
          },
        ]);
      } catch {
        setLevelCharts([]);
      } finally {
        setChartsLoading(false);
      }
    },
    [hubCharts]
  );

  useEffect(() => {
    if (hubLoading) return;
    loadChartsForLevel(level);
  }, [level, hubLoading, loadChartsForLevel]);

  const displayCharts = useMemo(() => levelCharts, [levelCharts]);

  const handleLevelChange = (next: string) => {
    if (next === level) return;
    setLevel(next);
    setActiveChartId(null);
    setActiveSegment(null);
    setInsight(null);
  };

  const onSegment = useCallback(
    async (chartId: string, seg: string) => {
      if (activeChartId === chartId && activeSegment === seg) {
        setActiveChartId(null);
        setActiveSegment(null);
        setInsight(null);
        return;
      }

      const chart = displayCharts.find(c => c.id === chartId);
      if (!chart) return;

      setActiveChartId(chartId);
      setActiveSegment(seg);
      setInsightLoading(true);

      const segType = chart.segmentType ?? (chartId.includes('growth') ? 'growth' : 'achievement');
      const chartLevel = chart.level ?? level;

      try {
        const res = await workforceAPI.getOSSegmentMembers({
          level: chartLevel,
          segmentType: segType,
          segment: seg,
        });
        const d = res.data;
        const label = chart.segments?.find(s => s.key === seg)?.label ?? seg;
        setInsight({
          title: `${chart.title.replace(/^(RM|BM) /, '')} · ${label}`,
          aggregate: d?.aggregate
            ? { ...d.aggregate, count: d.aggregate.count ?? d.totalCount ?? 0 }
            : null,
          topPerformers: d?.topPerformers ?? [],
          bottomPerformers: d?.bottomPerformers ?? [],
          totalCount: d?.totalCount ?? 0,
        });
      } catch {
        setInsight({
          title: `${chart.title} · ${seg}`,
          aggregate: null,
          topPerformers: [],
          bottomPerformers: [],
          totalCount: 0,
        });
      } finally {
        setInsightLoading(false);
      }
    },
    [activeChartId, activeSegment, displayCharts, level]
  );

  const chartsBusy = hubLoading || chartsLoading;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-5 pb-10 px-1 sm:px-2">
      <header className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/25">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Performance Analyzer</h1>
          <p className="text-xs text-slate-500">Achievement & growth splits by hierarchy level</p>
        </div>
      </header>

      {error && (
        <p className="text-sm text-red-600 bg-red-50/90 border border-red-100 rounded-xl px-4 py-2">{error}</p>
      )}

      <PerformanceHierarchySwitcher activeLevel={level} onChange={handleLevelChange} />

      <AnimatePresence mode="wait">
        <motion.div
          key={level}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {chartsBusy ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="min-h-[360px] rounded-2xl bg-slate-100/80 animate-pulse" />
              <div className="min-h-[360px] rounded-2xl bg-slate-100/80 animate-pulse" />
            </div>
          ) : displayCharts.length > 0 ? (
            <PerformanceSplitCharts
              charts={displayCharts}
              activeChartId={activeChartId}
              activeSegment={activeSegment}
              onSegmentClick={onSegment}
            />
          ) : (
            <p className="text-sm text-slate-400 text-center py-12 rounded-2xl border border-slate-100 bg-white/80">
              No segment data for {PERFORMANCE_LEVELS.find(l => l.level === level)?.short ?? level}.
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {(insight || insightLoading) && activeSegment && (
          <motion.div
            key={`${activeChartId}-${activeSegment}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <PerformanceSegmentInsight
              title={insight?.title ?? 'Segment insight'}
              aggregate={insight?.aggregate ?? null}
              topPerformers={insight?.topPerformers ?? []}
              bottomPerformers={insight?.bottomPerformers ?? []}
              totalCount={insight?.totalCount ?? 0}
              loading={insightLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!insightLoading && activeSegment && insight && insight.totalCount === 0 && !insight.aggregate && (
        <p className="text-sm text-slate-400 text-center py-4">No data in this segment.</p>
      )}
    </div>
  );
}
