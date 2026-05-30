export interface OSSummary {
  revenue: number;
  achievement: number;
  growth: number;
  revenueAtRisk: number;
  target: number;
  coverage: number;
  employeeCount: number;
  hierarchyLevels: OSHierarchyLevel[];
  lastRefresh?: string;
}

export interface OSHierarchyLevel {
  level: string;
  label: string;
  color: { from: string; to: string; label: string };
  count: number;
  revenue: number;
  achievement: number;
  growth: number;
  coverage: number;
}

export interface OSSegment {
  key: string;
  label: string;
  color: string;
  count: number;
  revenue: number;
  achievement: number;
  growth: number;
  coverage: number;
}

export interface OSBreakdownItem {
  key: string;
  name: string;
  empCode?: string;
  designation?: string;
  count: number;
  revenue: number;
  achievement: number;
  growth: number;
  coverage: number;
  revenueAtRisk: number;
  contributionPct: number;
}

export interface OSProfile {
  type: string;
  name: string;
  empCode?: string;
  zone?: string;
  state?: string;
  hq?: string;
  revenue: number;
  target?: number;
  actual?: number;
  achievement: number;
  growth: number;
  coverage: number;
  contributionPct?: number;
  revenueAtRisk: number;
  managerChain?: { role: string; name: string; empCode: string }[];
  team?: { name: string; empCode: string; designation: string; revenue: number; achievement: number; growth: number }[];
  teamCount?: number;
  bms?: { name: string; empCode: string; revenue: number; achievement: number; growth: number; coverage: number; revenueAtRisk: number; atRisk: boolean }[];
  bmCount?: number;
  bestState?: OSBreakdownItem | null;
  worstState?: OSBreakdownItem | null;
  topRM?: OSBreakdownItem | null;
  bottomRM?: OSBreakdownItem | null;
  topBM?: OSBreakdownItem | null;
  bottomBM?: OSBreakdownItem | null;
  states?: OSBreakdownItem[];
  riskContributionPct?: number;
}

export interface OSLeakage {
  revenueAtRisk: number;
  atRiskCount: number;
  coverageRiskCount: number;
  negativeGrowthCount: number;
  achievementRiskCount: number;
  topZones: OSBreakdownItem[];
  topStates: OSBreakdownItem[];
  topRMs: OSBreakdownItem[];
  topBMs: OSBreakdownItem[];
}

export interface OSOrgNode {
  name: string;
  empCode: string;
  designation: string;
  zone: string;
  state: string;
  hq: string;
  revenue: number;
  achievement: number;
  growth: number;
  coverage: number;
  teamSize: number;
  revenueAtRisk: number;
  contributionPct?: number;
  atRisk?: boolean;
  hasChildren: boolean;
  children: OSOrgNode[];
}

export type SegmentType = 'achievement' | 'growth' | 'coverage' | 'revenue';

export interface DrillBreadcrumb {
  label: string;
  step: DrillStep;
}

export interface DrillStep {
  view: 'home' | 'segments' | 'breakdown' | 'profile' | 'leakage';
  level?: string;
  segmentType?: SegmentType;
  segment?: string;
  breakdownBy?: string;
  zone?: string;
  state?: string;
  profileType?: 'bm' | 'rm' | 'zone';
  profileId?: string;
}

export const LEVEL_GRADIENTS: Record<string, string> = {
  'BU HEAD': 'from-indigo-600 to-indigo-500',
  NSM: 'from-purple-600 to-purple-500',
  SM: 'from-blue-600 to-blue-500',
  ZM: 'from-teal-600 to-teal-500',
  RM: 'from-green-600 to-green-500',
  BM: 'from-orange-600 to-orange-500',
};

export const SEGMENT_TYPES: { key: SegmentType; label: string }[] = [
  { key: 'achievement', label: 'Achievement' },
  { key: 'growth', label: 'Growth' },
  { key: 'coverage', label: 'Coverage' },
  { key: 'revenue', label: 'Revenue' },
];
