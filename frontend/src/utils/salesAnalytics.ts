import { type Employee } from '../contexts/WorkforceContext';
import {
  toNum, fmt, fmtMoney, totalRevenue, activeEmployees, groupBy, normalizeKey,
  bms, rms, sms, zms, nsms, generateInsights,
} from './displayUtils';

export const PCT_FIELDS = new Set(['apr_ach', 'growth', 'april26_cov', 'april26_dr_coverage', 'april26_chem_met', 'april26_stk_met']);

export function pct(e: Employee, field: string): number {
  const raw = toNum(e[field]);
  if (PCT_FIELDS.has(field)) return raw * 100;
  return raw;
}

export function avgPct(emps: Employee[], field: string): number {
  const vals = emps.map(e => pct(e, field)).filter(v => v > 0 || field === 'growth');
  const valid = field === 'growth' ? vals : vals.filter(v => v > 0);
  return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
}

export const ACH_SLABS = [
  { name: '>100%', min: 100, max: Infinity, color: '#15803d' },
  { name: '90-100%', min: 90, max: 100, color: '#86efac' },
  { name: '80-90%', min: 80, max: 90, color: '#f59e0b' },
  { name: '<80%', min: -Infinity, max: 80, color: '#dc2626' },
];

export const GROWTH_SLABS = [
  { name: '20%+', min: 20, max: Infinity, color: '#15803d' },
  { name: '10-20%', min: 10, max: 20, color: '#eab308' },
  { name: '0-10%', min: 0, max: 10, color: '#f97316' },
  { name: '<0%', min: -Infinity, max: 0, color: '#dc2626' },
];

export interface SlabData {
  name: string;
  count: number;
  pct: number;
  revenue: number;
  emps: Employee[];
  color: string;
}

export function computeSlabs(emps: Employee[], slabDefs: typeof ACH_SLABS, field: 'apr_ach' | 'growth'): SlabData[] {
  const vals = emps.map(e => ({ e, v: pct(e, field) })).filter(x => field === 'growth' || x.v > 0);
  const total = vals.length;
  return slabDefs.map(slab => {
    const matching = vals.filter(x => {
      if (slab.name === '>100%' || slab.name === '20%+') return x.v >= slab.min;
      if (slab.name === '<80%' || slab.name === '<0%') return x.v < slab.max;
      return x.v >= slab.min && x.v < slab.max;
    });
    const rev = totalRevenue(matching.map(x => x.e));
    return {
      name: slab.name, count: matching.length,
      pct: total > 0 ? (matching.length / total) * 100 : 0,
      revenue: rev, emps: matching.map(x => x.e), color: slab.color,
    };
  }).filter(s => s.count > 0);
}

export type RoleKey = 'BM' | 'RM' | 'SM' | 'ZM' | 'NSM';

export function byRole(employees: Employee[], role: RoleKey): Employee[] {
  const map = { BM: bms, RM: rms, SM: sms, ZM: zms, NSM: nsms };
  return map[role](employees);
}

export interface ExecutiveKPI {
  totalRev: number;
  achPct: number;
  grPct: number;
  covPct: number;
  totalRiskRev: number;
  negGrowthRev: number;
  lowCovRev: number;
  lowAchRev: number;
  lowAchBms: Employee[];
  negGrowthEmps: Employee[];
  lowCov: Employee[];
  lowAchAll: Employee[];
  zoneStats: { zone: string; rev: number; ach: number; growth: number; count: number; riskRev: number }[];
  stateStats: { state: string; rev: number; ach: number; growth: number; count: number; riskRev: number }[];
  bestZone: { zone: string; rev: number; ach: number; growth: number; count: number; riskRev: number } | undefined;
  worstZone: { zone: string; rev: number; ach: number; growth: number; count: number; riskRev: number } | undefined;
  bestState: { state: string; rev: number; ach: number; growth: number; count: number; riskRev: number } | undefined;
  worstState: { state: string; rev: number; ach: number; growth: number; count: number; riskRev: number } | undefined;
  bestRM: Employee | undefined;
  worstRM: Employee | undefined;
  bestBM: Employee | undefined;
  worstBM: Employee | undefined;
  criticalRegion: { zone: string; riskRev: number } | undefined;
  criticalState: { state: string; riskRev: number } | undefined;
  topRevenueEmp: Employee | undefined;
  topGrowthEmp: Employee | undefined;
}

function riskRev(emps: Employee[]): number {
  return totalRevenue(emps.filter(e => {
    const ach = pct(e, 'apr_ach');
    const gr = pct(e, 'growth');
    const cov = pct(e, 'april26_cov');
    return (ach > 0 && ach < 80) || gr < 0 || (cov > 0 && cov < 60);
  }));
}

function isAtRisk(e: Employee): boolean {
  const ach = pct(e, 'apr_ach');
  const gr = pct(e, 'growth');
  const cov = pct(e, 'april26_cov');
  return (ach > 0 && ach < 80) || gr < 0 || (cov > 0 && cov < 60);
}

export function computeExecutiveKPI(employees: Employee[]): ExecutiveKPI {
  const active = activeEmployees(employees);
  const allBms = bms(employees);
  const allRms = rms(employees);
  const totalRev = totalRevenue(active);

  const lowAchAll = active.filter(e => pct(e, 'apr_ach') > 0 && pct(e, 'apr_ach') < 80);
  const lowAchBms = allBms.filter(e => pct(e, 'apr_ach') > 0 && pct(e, 'apr_ach') < 80);
  const negGrowthEmps = active.filter(e => pct(e, 'growth') < 0);
  const lowCov = active.filter(e => pct(e, 'april26_cov') > 0 && pct(e, 'april26_cov') < 60);
  const atRisk = active.filter(isAtRisk);

  const zoneGroups = groupBy(active.filter(e => e.zone), e => normalizeKey(String(e.zone)));
  const stateGroups = groupBy(active.filter(e => e.state), e => normalizeKey(String(e.state)));

  const zoneStats = [...zoneGroups.entries()].map(([zone, g]) => ({
    zone, rev: totalRevenue(g), ach: avgPct(g, 'apr_ach'), growth: avgPct(g, 'growth'),
    count: g.length, riskRev: riskRev(g),
  }));
  const stateStats = [...stateGroups.entries()].map(([state, g]) => ({
    state, rev: totalRevenue(g), ach: avgPct(g, 'apr_ach'), growth: avgPct(g, 'growth'),
    count: g.length, riskRev: riskRev(g),
  }));

  const validRms = allRms.filter(e => toNum(e.net_sale_apr_26) > 0 && String(e.name).trim() !== 'Vacant');
  const validBms = allBms.filter(e => toNum(e.net_sale_apr_26) > 0 && String(e.name).trim() !== 'Vacant');
  const sortedRmsRev = [...validRms].sort((a, b) => toNum(b.net_sale_apr_26) - toNum(a.net_sale_apr_26));
  const sortedBmsRev = [...validBms].sort((a, b) => toNum(b.net_sale_apr_26) - toNum(a.net_sale_apr_26));
  const sortedRmsAch = [...validRms].filter(e => pct(e, 'apr_ach') > 0).sort((a, b) => pct(a, 'apr_ach') - pct(b, 'apr_ach'));
  const sortedBmsAch = [...validBms].filter(e => pct(e, 'apr_ach') > 0).sort((a, b) => pct(a, 'apr_ach') - pct(b, 'apr_ach'));

  const topRevenue = [...active].sort((a, b) => toNum(b.net_sale_apr_26) - toNum(a.net_sale_apr_26))[0];
  const topGrowth = [...active].filter(e => pct(e, 'growth') !== 0).sort((a, b) => pct(b, 'growth') - pct(a, 'growth'))[0];

  return {
    totalRev,
    achPct: avgPct(active, 'apr_ach'),
    grPct: avgPct(active, 'growth'),
    covPct: avgPct(active, 'april26_cov'),
    totalRiskRev: totalRevenue(atRisk),
    negGrowthRev: totalRevenue(negGrowthEmps),
    lowCovRev: totalRevenue(lowCov),
    lowAchRev: totalRevenue(lowAchAll),
    lowAchBms, negGrowthEmps, lowCov, lowAchAll,
    zoneStats,
    stateStats,
    bestZone: [...zoneStats].sort((a, b) => b.rev - a.rev)[0],
    worstZone: [...zoneStats].sort((a, b) => a.ach - b.ach)[0],
    bestState: [...stateStats].sort((a, b) => b.rev - a.rev)[0],
    worstState: [...stateStats].sort((a, b) => a.ach - b.ach)[0],
    bestRM: sortedRmsRev[0],
    worstRM: sortedRmsAch[0],
    bestBM: sortedBmsRev[0],
    worstBM: sortedBmsAch[0],
    criticalRegion: [...zoneStats].sort((a, b) => b.riskRev - a.riskRev)[0] ? { zone: [...zoneStats].sort((a, b) => b.riskRev - a.riskRev)[0].zone, riskRev: [...zoneStats].sort((a, b) => b.riskRev - a.riskRev)[0].riskRev } : undefined,
    criticalState: [...stateStats].sort((a, b) => b.riskRev - a.riskRev)[0] ? { state: [...stateStats].sort((a, b) => b.riskRev - a.riskRev)[0].state, riskRev: [...stateStats].sort((a, b) => b.riskRev - a.riskRev)[0].riskRev } : undefined,
    topRevenueEmp: topRevenue,
    topGrowthEmp: topGrowth,
  };
}

export type MatrixQuadrant = 'stars' | 'performers' | 'growers' | 'concerns';

export function computeMatrix(emps: Employee[]) {
  const data = emps.filter(e => pct(e, 'apr_ach') > 0 && String(e.name).trim() !== 'Vacant');
  return {
    stars: data.filter(e => pct(e, 'apr_ach') >= 90 && pct(e, 'growth') > 0),
    performers: data.filter(e => pct(e, 'apr_ach') >= 90 && pct(e, 'growth') <= 0),
    growers: data.filter(e => pct(e, 'apr_ach') < 90 && pct(e, 'growth') > 0),
    concerns: data.filter(e => pct(e, 'apr_ach') < 90 && pct(e, 'growth') <= 0),
  };
}

export interface SmartInsight {
  text: string;
  type: 'positive' | 'negative' | 'neutral';
  icon: string;
  emps: Employee[];
}

export function computeSmartInsights(employees: Employee[]): SmartInsight[] {
  const active = activeEmployees(employees);
  const kpi = computeExecutiveKPI(employees);
  const insights: SmartInsight[] = [];

  if (kpi.topRevenueEmp?.name) {
    insights.push({
      type: 'positive', icon: '💰',
      text: `${kpi.topRevenueEmp.name} is the highest revenue contributor (${fmtMoney(toNum(kpi.topRevenueEmp.net_sale_apr_26))}).`,
      emps: [kpi.topRevenueEmp],
    });
  }
  if (kpi.topGrowthEmp?.name) {
    insights.push({
      type: 'positive', icon: '📈',
      text: `${kpi.topGrowthEmp.name} leads growth at ${fmt(pct(kpi.topGrowthEmp, 'growth'), 1)}%.`,
      emps: [kpi.topGrowthEmp],
    });
  }
  if (kpi.bestZone) {
    insights.push({
      type: 'positive', icon: '🌎',
      text: `${kpi.bestZone.zone} is the highest revenue zone (${fmtMoney(kpi.bestZone.rev)}, ${fmt(kpi.bestZone.count, 0)} people).`,
      emps: active.filter(e => normalizeKey(String(e.zone)) === kpi.bestZone!.zone),
    });
  }
  if (kpi.criticalRegion) {
    insights.push({
      type: 'negative', icon: '🚨',
      text: `${kpi.criticalRegion.zone} is the most critical region with ${fmtMoney(kpi.criticalRegion.riskRev)} revenue at risk.`,
      emps: active.filter(e => normalizeKey(String(e.zone)) === kpi.criticalRegion!.zone && isAtRisk(e)),
    });
  }
  if (kpi.criticalState) {
    insights.push({
      type: 'negative', icon: '⚠️',
      text: `${kpi.criticalState.state} is the most critical state with ${fmtMoney(kpi.criticalState.riskRev)} at risk.`,
      emps: active.filter(e => normalizeKey(String(e.state)) === kpi.criticalState!.state && isAtRisk(e)),
    });
  }
  if (kpi.worstRM?.name) {
    insights.push({
      type: 'negative', icon: '🎯',
      text: `${kpi.worstRM.name} is the lowest achievement RM (${fmt(pct(kpi.worstRM, 'apr_ach'), 1)}%).`,
      emps: [kpi.worstRM],
    });
  }

  const improved = active.filter(e => pct(e, 'growth') > 15 && pct(e, 'apr_ach') >= 80);
  if (improved.length > 0) {
    const best = [...improved].sort((a, b) => pct(b, 'growth') - pct(a, 'growth'))[0];
    insights.push({
      type: 'positive', icon: '🔥',
      text: `${best.name} is among the most improved performers (${fmt(pct(best, 'growth'), 1)}% growth).`,
      emps: improved.slice(0, 20),
    });
  }

  generateInsights(employees).forEach(gi => {
    if (!insights.some(i => i.text === gi.text)) {
      insights.push({ ...gi, icon: gi.type === 'positive' ? '✅' : gi.type === 'negative' ? '❌' : 'ℹ️', emps: active });
    }
  });

  return insights.slice(0, 12);
}

export interface LeakageSummary {
  revenueAtRisk: number;
  coverageRisk: Employee[];
  negGrowth: Employee[];
  achRisk: Employee[];
  topRiskZones: { name: string; rev: number; emps: Employee[] }[];
  topRiskStates: { name: string; rev: number; emps: Employee[] }[];
  topRiskRms: Employee[];
  topRiskBms: Employee[];
}

export function computeLeakage(employees: Employee[]): LeakageSummary {
  const active = activeEmployees(employees);
  const coverageRisk = active.filter(e => pct(e, 'april26_cov') > 0 && pct(e, 'april26_cov') < 60);
  const negGrowth = active.filter(e => pct(e, 'growth') < 0);
  const achRisk = active.filter(e => pct(e, 'apr_ach') > 0 && pct(e, 'apr_ach') < 80);
  const atRisk = active.filter(isAtRisk);

  const zoneG = groupBy(atRisk.filter(e => e.zone), e => normalizeKey(String(e.zone)));
  const stateG = groupBy(atRisk.filter(e => e.state), e => normalizeKey(String(e.state)));

  return {
    revenueAtRisk: totalRevenue(atRisk),
    coverageRisk,
    negGrowth,
    achRisk,
    topRiskZones: [...zoneG.entries()].map(([name, emps]) => ({ name, rev: totalRevenue(emps), emps })).sort((a, b) => b.rev - a.rev).slice(0, 5),
    topRiskStates: [...stateG.entries()].map(([name, emps]) => ({ name, rev: totalRevenue(emps), emps })).sort((a, b) => b.rev - a.rev).slice(0, 5),
    topRiskRms: rms(employees).filter(isAtRisk).sort((a, b) => toNum(b.net_sale_apr_26) - toNum(a.net_sale_apr_26)).slice(0, 10),
    topRiskBms: bms(employees).filter(isAtRisk).sort((a, b) => toNum(b.net_sale_apr_26) - toNum(a.net_sale_apr_26)).slice(0, 10),
  };
}

export function mostImproved(emps: Employee[]): Employee[] {
  return [...emps].filter(e => pct(e, 'growth') > 0 && toNum(e.net_sale_apr_26) > 0)
    .sort((a, b) => pct(b, 'growth') - pct(a, 'growth'));
}

export function mostDeclined(emps: Employee[]): Employee[] {
  return [...emps].filter(e => pct(e, 'growth') < 0)
    .sort((a, b) => pct(a, 'growth') - pct(b, 'growth'));
}
