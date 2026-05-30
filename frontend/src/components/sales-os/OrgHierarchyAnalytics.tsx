import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Network } from 'lucide-react';
import { workforceAPI } from '../../services/workforce';
import { OrgHierarchyRibbon, type RibbonLevel } from './org/OrgHierarchyRibbon';
import { OrgLandscape } from './org/OrgLandscape';
import { OrgNodeDrilldown } from './org/OrgNodeDrilldown';
import { OrgLiveLeaderboard } from './org/OrgLiveLeaderboard';
import { OrgRevenueRiver } from './org/OrgRevenueRiver';
import { OrgRiskRadar } from './org/OrgRiskRadar';
import type { PersonRow, RegionOwner } from './org/OrgLevelInsightPanel';
import type { LandscapeNode } from './org/orgVisualUtils';
import { personToNode, regionsToNodes } from './org/orgVisualUtils';

interface LevelInsight {
  regions: RegionOwner[];
  topPerformers: PersonRow[];
  bottomPerformers: PersonRow[];
  riskContributors: PersonRow[];
}

const EMPTY: LevelInsight = {
  regions: [],
  topPerformers: [],
  bottomPerformers: [],
  riskContributors: [],
};

export function OrgHierarchyAnalytics() {
  const [levels, setLevels] = useState<RibbonLevel[]>([]);
  const [activeLevel, setActiveLevel] = useState<string | null>(null);
  const [insight, setInsight] = useState<LevelInsight>(EMPTY);
  const [selectedNode, setSelectedNode] = useState<LandscapeNode | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await workforceAPI.getOSOrgHealth();
      const next = (res.data?.levels ?? []) as RibbonLevel[];
      setLevels(next);
      if (next.length > 0) {
        setActiveLevel(prev => prev ?? next[0].level);
      }
    } catch {
      setLevels([]);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const loadLevelInsight = useCallback(async (level: string) => {
    setInsightLoading(true);
    setInsight(EMPTY);
    setSelectedNode(null);
    try {
      const levelRes = await workforceAPI.getOSOrgLevel({ level, breakdownBy: 'zone' });
      const regions = (levelRes.data?.regions ?? []) as RegionOwner[];

      let topPerformers: PersonRow[] = [];
      let bottomPerformers: PersonRow[] = [];
      let allManagers: PersonRow[] = [];

      if (level === 'RM' || level === 'BM') {
        const tbRes = await workforceAPI.getOSTopBottom();
        const bucket = level === 'RM' ? tbRes.data?.rm : tbRes.data?.bm;
        topPerformers = (bucket?.top ?? []).slice(0, 5);
        bottomPerformers = (bucket?.bottom ?? []).slice(0, 5);
        allManagers = [...(bucket?.top ?? []), ...(bucket?.bottom ?? [])];
      } else if (regions.length > 0) {
        const regionResults = await Promise.all(
          regions.map(r =>
            workforceAPI.getOSOrgRegion({ level, region: r.name, breakdownBy: 'zone' })
          )
        );
        allManagers = regionResults.flatMap(r => (r.data?.managers ?? []) as PersonRow[]);
        topPerformers = [...allManagers].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
        bottomPerformers = [...allManagers]
          .filter(m => m.achievement > 0)
          .sort((a, b) => a.achievement - b.achievement)
          .slice(0, 5);
      }

      let riskContributors = [...allManagers]
        .filter(m => m.atRisk || m.revenueAtRisk > 0)
        .sort((a, b) => b.revenueAtRisk - a.revenueAtRisk)
        .slice(0, 12);

      if ((level === 'RM' || level === 'BM') && riskContributors.length === 0) {
        const leakRes = await workforceAPI.getOSLeakageOwnership();
        const owners =
          level === 'RM'
            ? (leakRes.data?.revenueLeakage?.topRMs ?? [])
            : (leakRes.data?.revenueLeakage?.topBMs ?? []);
        riskContributors = owners.slice(0, 12).map((o: { name: string; revenueAtRisk: number }) => ({
          name: o.name,
          empCode: o.name,
          revenue: 0,
          achievement: 0,
          growth: 0,
          contributionPct: 0,
          revenueAtRisk: o.revenueAtRisk,
        }));
      }

      setInsight({ regions, topPerformers, bottomPerformers, riskContributors });
    } catch {
      setInsight(EMPTY);
    } finally {
      setInsightLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeLevel) loadLevelInsight(activeLevel);
  }, [activeLevel, loadLevelInsight]);

  const landscapeNodes = useMemo(() => regionsToNodes(insight.regions), [insight.regions]);

  const handleSelectLevel = (level: string) => {
    if (level === activeLevel) return;
    setActiveLevel(level);
    setSelectedNode(null);
  };

  const activeMeta = levels.find(l => l.level === activeLevel);
  const levelLabel = activeMeta?.label ?? activeLevel ?? '';

  const handleLandscapeSelect = async (node: LandscapeNode) => {
    setSelectedNode(node);
    if (node.kind === 'zone' && activeLevel) {
      try {
        const res = await workforceAPI.getOSOrgRegion({
          level: activeLevel,
          region: node.label,
          breakdownBy: 'zone',
        });
        const managers = (res.data?.managers ?? []) as PersonRow[];
        if (managers.length === 1) {
          setSelectedNode(personToNode(managers[0]));
        }
      } catch {
        /* keep zone node */
      }
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 pb-12 px-1 sm:px-2">
      <header className="flex items-center gap-3 pt-1">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Network className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Organization Intelligence</h1>
          <p className="text-xs text-slate-500 mt-0.5">Visual hierarchy · landscape · flow · risk</p>
        </div>
      </header>

      <OrgHierarchyRibbon
        levels={levels}
        activeLevel={activeLevel}
        onSelect={handleSelectLevel}
        loading={healthLoading}
      />

      <AnimatePresence mode="wait">
        {activeLevel && (
          <motion.div
            key={activeLevel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="space-y-5"
          >
            <OrgLandscape
              nodes={landscapeNodes}
              selectedId={selectedNode?.id ?? null}
              onSelect={handleLandscapeSelect}
              loading={insightLoading}
            />

            <AnimatePresence>
              {selectedNode && (
                <OrgNodeDrilldown node={selectedNode} levelLabel={levelLabel} />
              )}
            </AnimatePresence>

            <OrgRevenueRiver
              regions={insight.regions}
              levelLabel={levelLabel}
              loading={insightLoading}
            />

            <OrgLiveLeaderboard
              top={insight.topPerformers}
              bottom={insight.bottomPerformers}
              visible={!insightLoading && !!activeLevel}
            />

            <OrgRiskRadar
              items={insight.riskContributors}
              selectedId={selectedNode?.id ?? null}
              onSelect={p => setSelectedNode(personToNode(p))}
              loading={insightLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!healthLoading && !activeLevel && (
        <p className="text-center text-sm text-slate-400 py-12">Select a hierarchy level to explore.</p>
      )}
    </div>
  );
}
