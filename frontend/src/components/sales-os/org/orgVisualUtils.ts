import type { RegionOwner } from './OrgLevelInsightPanel';
import type { PersonRow } from './OrgLevelInsightPanel';

export type LandscapeNode = {
  id: string;
  label: string;
  kind: 'zone' | 'manager';
  revenue: number;
  achievement: number;
  growth: number;
  contributionPct: number;
  revenueAtRisk: number;
  count: number;
  atRisk?: boolean;
  raw?: RegionOwner | PersonRow;
};

export function perfColor(
  achievement: number,
  revenueAtRisk: number,
  atRisk?: boolean
): string {

  // Critical

  if (achievement < 70) {
    return '#ef4444';
  }

  // Risk

  if (achievement < 80 || atRisk) {
    return '#f97316';
  }

  // Average

  if (achievement < 90) {
    return '#f59e0b';
  }

  // Healthy

  if (achievement < 95) {
    return '#06b6d4';
  }

  // Strong

  return '#22c55e';
}

export function riskSeverity(revenueAtRisk: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(1, revenueAtRisk / max);
}

export function regionsToNodes(regions: RegionOwner[]): LandscapeNode[] {
  return regions.map(r => ({
    id: `zone-${r.name}`,
    label: r.name,
    kind: 'zone',
    revenue: r.revenue,
    achievement: r.achievement,
    growth: r.growth,
    contributionPct: r.contributionPct,
    revenueAtRisk: r.revenueAtRisk,
    count: r.count,
    atRisk: r.revenueAtRisk > 0,
    raw: r,
  }));
}

export function managersToNodes(managers: PersonRow[]): LandscapeNode[] {
  return managers.map(m => ({
    id: m.empCode || m.name,
    label: m.name,
    kind: 'manager',
    revenue: m.revenue,
    achievement: m.achievement,
    growth: m.growth,
    contributionPct: m.contributionPct,
    revenueAtRisk: m.revenueAtRisk,
    count: 1,
    atRisk: m.atRisk,
    raw: m,
  }));
}

export function personToNode(p: PersonRow): LandscapeNode {
  return {
    id: p.empCode || p.name,
    label: p.name,
    kind: 'manager',
    revenue: p.revenue,
    achievement: p.achievement,
    growth: p.growth,
    contributionPct: p.contributionPct,
    revenueAtRisk: p.revenueAtRisk,
    count: 1,
    atRisk: p.atRisk,
    raw: p,
  };
}
