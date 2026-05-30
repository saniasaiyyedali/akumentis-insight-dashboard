import { type Employee } from '../contexts/WorkforceContext';

export function toNum(v: unknown): number {
  const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

export function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
}

export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

export function fmt(v: number, d = 1): string {
  return Number.isFinite(v) ? v.toFixed(d) : '0';
}

export function fmtPct(v: number): string {
  return `${fmt(v, 1)}%`;
}

export function fmtHrs(v: number): string {
  return `${fmt(v, 1)}h`;
}

export function fmtDays(v: number): string {
  return `${fmt(v, 1)}d`;
}

export function fmtMoney(v: number): string {
  if (!Number.isFinite(v)) return '0';
  if (v >= 10000000) return `${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000) return `${(v / 100000).toFixed(2)}L`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return v.toFixed(0);
}

export function revenue(e: Employee): number {
  return toNum(e.net_sale_apr_26);
}

export function contribution(emp: Employee, poolTotalRev: number): number {
  if (poolTotalRev <= 0) return 0;
  return (revenue(emp) / poolTotalRev) * 100;
}

export function totalRevenue(emps: Employee[]): number {
  return sum(emps.map(revenue));
}

export function topN<T>(arr: T[], key: (item: T) => number, n: number): T[] {
  return [...arr].sort((a, b) => key(b) - key(a)).slice(0, n);
}

export function bottomN<T>(arr: T[], key: (item: T) => number, n: number): T[] {
  return [...arr].sort((a, b) => key(a) - key(b)).slice(0, n);
}

export function activeEmployees(emps: Employee[]): Employee[] {
  return emps.filter(e => e.dsgn !== 'ABOLISHED' && e.name && String(e.name).trim() !== 'Vacant' && String(e.name).trim() !== 'VACANT');
}

export function bms(emps: Employee[]): Employee[] {
  return activeEmployees(emps).filter(e => e.dsgn === 'BM');
}

export function rms(emps: Employee[]): Employee[] {
  return activeEmployees(emps).filter(e => e.dsgn === 'RM');
}

export function sms(emps: Employee[]): Employee[] {
  return activeEmployees(emps).filter(e => e.dsgn === 'SM');
}

export function zms(emps: Employee[]): Employee[] {
  return activeEmployees(emps).filter(e => e.dsgn === 'ZM');
}

export function nsms(emps: Employee[]): Employee[] {
  return activeEmployees(emps).filter(e => e.dsgn === 'NSM');
}

const ACRONYMS = new Set(['HQ', 'BM', 'RM', 'SM', 'ZM', 'NSM', 'BU']);

export function normalizeKey(v: unknown): string {
  const s = String(v ?? '').trim().replace(/\s+/g, ' ');
  if (!s) return '';
  return s.replace(/\b\w+/g, word => {
    const upper = word.toUpperCase();
    if (ACRONYMS.has(upper)) return upper;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

export function groupBy<T>(arr: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  arr.forEach(item => {
    const k = normalizeKey(key(item));
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  });
  return map;
}

export function perfScore(e: Employee): number {
  return toNum(e.apr_ach);
}

export interface SlabInfo {
  name: string;
  value: number;
  emps: Employee[];
  revenue: number;
  contribPct: number;
  topHQ: { name: string; count: number; revenue: number }[];
  topBM: { name: string; revenue: number; ach: number }[];
  topRM: { name: string; revenue: number; ach: number }[];
}

export function computeSlabs(emps: Employee[], field: 'apr_ach' | 'growth'): SlabInfo[] {
  const totalRev = totalRevenue(emps);
  const init: Record<string, Employee[]> = {};
  if (field === 'apr_ach') {
    init['>100%'] = []; init['90-100%'] = []; init['80-90%'] = []; init['<80%'] = [];
  } else {
    init['<0%'] = []; init['0-10%'] = []; init['10-20%'] = []; init['20%+'] = [];
  }

  for (const e of emps) {
    const val = toNum(e[field]);
    if (field === 'apr_ach') {
      if (val <= 0) continue;
      if (val >= 100) init['>100%'].push(e);
      else if (val >= 90) init['90-100%'].push(e);
      else if (val >= 80) init['80-90%'].push(e);
      else init['<80%'].push(e);
    } else {
      if (val < 0) init['<0%'].push(e);
      else if (val <= 10) init['0-10%'].push(e);
      else if (val <= 20) init['10-20%'].push(e);
      else init['20%+'].push(e);
    }
  }

  return Object.entries(init)
    .filter(([_, grp]) => grp.length > 0)
    .map(([name, grp]) => {
      const rev = totalRevenue(grp);
      const hqGroups = groupBy(grp, e => String(e.hq || 'Unknown'));
      const topHQ = [...hqGroups.entries()]
        .map(([n, g]) => ({ name: n, count: g.length, revenue: totalRevenue(g) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      const bmGroup = grp.filter(e => e.dsgn === 'BM');
      const rmGroup = grp.filter(e => e.dsgn === 'RM');
      const topBM = topN(bmGroup, revenue, 3).map(e => ({ name: String(e.name || ''), revenue: revenue(e), ach: toNum(e.apr_ach) }));
      const topRM = topN(rmGroup, revenue, 3).map(e => ({ name: String(e.name || ''), revenue: revenue(e), ach: toNum(e.apr_ach) }));

      return {
        name,
        value: grp.length,
        emps: grp,
        revenue: rev,
        contribPct: totalRev > 0 ? (rev / totalRev) * 100 : 0,
        topHQ,
        topBM,
        topRM,
      };
    });
}

export function bestPerformerLabel(emps: Employee[], field: string): string {
  const valid = emps.filter(e => toNum(e[field]) > 0);
  if (valid.length === 0) return 'N/A';
  const best = valid.reduce((a, b) => toNum(a[field]) > toNum(b[field]) ? a : b);
  return `${String(best.name || '')} (${fmt(toNum(best[field]), 1)}${field.includes('hrs') ? 'h' : field.includes('inv') ? 'd' : '%'})`;
}

export function worstPerformerLabel(emps: Employee[], field: string): string {
  const valid = emps.filter(e => toNum(e[field]) > 0);
  if (valid.length === 0) return 'N/A';
  const worst = valid.reduce((a, b) => toNum(a[field]) < toNum(b[field]) ? a : b);
  return `${String(worst.name || '')} (${fmt(toNum(worst[field]), 1)}${field.includes('hrs') ? 'h' : field.includes('inv') ? 'd' : '%'})`;
}

export function bestHQLabel(emps: Employee[], field: string): string {
  const groups = groupBy(emps.filter(e => toNum(e[field]) > 0), e => String(e.hq || 'Unknown HQ'));
  let bestName = 'N/A';
  let bestVal = 0;
  groups.forEach((g, name) => {
    const v = avg(g.map(e => toNum(e[field])));
    if (v > bestVal) { bestVal = v; bestName = name; }
  });
  return `${bestName} (${fmt(bestVal, 1)}${field.includes('hrs') ? 'h' : '%'})`;
}

export function worstHQLabel(emps: Employee[], field: string): string {
  const groups = groupBy(emps.filter(e => toNum(e[field]) > 0), e => String(e.hq || 'Unknown HQ'));
  let worstName = 'N/A';
  let worstVal = Infinity;
  groups.forEach((g, name) => {
    const v = avg(g.map(e => toNum(e[field])));
    if (v < worstVal) { worstVal = v; worstName = name; }
  });
  return `${worstName} (${fmt(worstVal, 1)}${field.includes('hrs') ? 'h' : '%'})`;
}

export function healthScore(emp: Employee): number {
  const ach = toNum(emp.apr_ach);
  const growth = toNum(emp.growth);
  const cov = toNum(emp.april26_cov);
  const inv = toNum(emp.apr26_inv_days);
  const hrs = toNum(emp.april26_avg_working_hrs);
  if (ach <= 0) return 0;
  let score = 0;
  score += Math.min(ach, 100) / 100 * 40;
  score += Math.max(0, Math.min(growth, 30)) / 30 * 20;
  score += Math.min(cov, 80) / 80 * 20;
  score += Math.max(0, 1 - inv / 90) * 10;
  score += Math.min(hrs, 8) / 8 * 10;
  return Math.min(Math.round(score), 100);
}

export function healthStatus(score: number): string {
  if (score >= 92) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Watchlist';
  return 'Critical';
}

export function healthColor(score: number): string {
  if (score >= 92) return 'text-emerald-600 bg-emerald-100';
  if (score >= 75) return 'text-blue-600 bg-blue-100';
  if (score >= 60) return 'text-amber-600 bg-amber-100';
  return 'text-red-600 bg-red-100';
}

export function healthBgColor(score: number): string {
  if (score >= 92) return 'bg-emerald-500';
  if (score >= 75) return 'bg-blue-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export interface Badge {
  label: string;
  color: string;
  icon: string;
}

export function getBadges(emp: Employee): Badge[] {
  const result: Badge[] = [];
  const ach = toNum(emp.apr_ach);
  const growth = toNum(emp.growth);
  const cov = toNum(emp.april26_cov);
  const inv = toNum(emp.apr26_inv_days);
  if (ach >= 90) result.push({ label: 'Top Performer', color: 'text-emerald-700 bg-emerald-100 border-emerald-200', icon: '🏆' });
  if (growth > 15) result.push({ label: 'Fast Growth', color: 'text-blue-700 bg-blue-100 border-blue-200', icon: '🔥' });
  if (cov > 0 && cov < 60) result.push({ label: 'Coverage Risk', color: 'text-amber-700 bg-amber-100 border-amber-200', icon: '⚠' });
  if (growth < 0) result.push({ label: 'Negative Growth', color: 'text-red-700 bg-red-100 border-red-200', icon: '📉' });
  if (inv > 60) result.push({ label: 'Inventory Risk', color: 'text-purple-700 bg-purple-100 border-purple-200', icon: '🚨' });
  return result;
}

export function groupHealthScores(emps: Employee[]): { name: string; avg: number; status: string; count: number; revenue: number; contribPct: number }[] {
  const groups = groupBy(emps.filter(e => e.dsgn !== 'ABOLISHED' && e.name && toNum(e.apr_ach) > 0), e => String(e.hq || 'Unknown'));
  const totalRev = totalRevenue(emps);
  return [...groups.entries()]
    .map(([name, g]) => {
      const rev = totalRevenue(g);
      const scores = g.map(healthScore);
      return {
        name,
        avg: Math.round(avg(scores)),
        status: healthStatus(Math.round(avg(scores))),
        count: g.length,
        revenue: rev,
        contribPct: totalRev > 0 ? (rev / totalRev) * 100 : 0,
      };
    })
    .sort((a, b) => b.avg - a.avg);
}

export interface RiskCard {
  label: string;
  icon: string;
  color: string;
  bg: string;
  count: number;
  revenue: number;
  contribPct: number;
  emps: Employee[];
}

export function computeAttentionRequired(emps: Employee[]): RiskCard[] {
  const active = activeEmployees(emps);
  const totalRev = totalRevenue(active);
  const allBms = bms(emps);
  const cards: RiskCard[] = [];

  const lowAch = allBms.filter(e => toNum(e.apr_ach) > 0 && toNum(e.apr_ach) < 80);
  if (lowAch.length > 0) cards.push({
    label: 'Achievement Risk (<80%)', icon: '🎯', color: 'text-red-600', bg: 'bg-red-50 border-red-200',
    count: lowAch.length, revenue: totalRevenue(lowAch), contribPct: totalRev > 0 ? (totalRevenue(lowAch) / totalRev) * 100 : 0, emps: lowAch,
  });

  const negGrowth = active.filter(e => toNum(e.growth) < 0);
  if (negGrowth.length > 0) cards.push({
    label: 'Negative Growth Risk', icon: '📉', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200',
    count: negGrowth.length, revenue: totalRevenue(negGrowth), contribPct: totalRev > 0 ? (totalRevenue(negGrowth) / totalRev) * 100 : 0, emps: negGrowth,
  });

  const lowCov = active.filter(e => toNum(e.april26_cov) > 0 && toNum(e.april26_cov) < 60);
  if (lowCov.length > 0) cards.push({
    label: 'Coverage Risk (<60%)', icon: '⚠', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200',
    count: lowCov.length, revenue: totalRevenue(lowCov), contribPct: totalRev > 0 ? (totalRevenue(lowCov) / totalRev) * 100 : 0, emps: lowCov,
  });

  const highInv = active.filter(e => toNum(e.apr26_inv_days) > 60);
  if (highInv.length > 0) cards.push({
    label: 'Inventory Risk (>60d)', icon: '📦', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200',
    count: highInv.length, revenue: totalRevenue(highInv), contribPct: totalRev > 0 ? (totalRevenue(highInv) / totalRev) * 100 : 0, emps: highInv,
  });

  const lowHrs = active.filter(e => toNum(e.april26_avg_working_hrs) > 0 && toNum(e.april26_avg_working_hrs) < 4);
  if (lowHrs.length > 0) cards.push({
    label: 'Low Productivity (<4h)', icon: '⏰', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200',
    count: lowHrs.length, revenue: totalRevenue(lowHrs), contribPct: totalRev > 0 ? (totalRevenue(lowHrs) / totalRev) * 100 : 0, emps: lowHrs,
  });

  return cards;
}

export function computeAvg(emps: Employee[], field: string): number {
  const vals = emps.map(e => toNum(e[field])).filter(v => v > 0);
  return vals.length > 0 ? avg(vals) : 0;
}

export interface Insight {
  text: string;
  type: 'positive' | 'negative' | 'neutral';
}

export function generateInsights(emps: Employee[]): Insight[] {
  const active = activeEmployees(emps);
  const totalRev = totalRevenue(active);
  const allBms = bms(emps);
  const allRms = rms(emps);
  const insights: Insight[] = [];

  // Revenue concentration by state
  const stateGroups = groupBy(active.filter(e => e.state), e => String(e.state));
  const stateRev = [...stateGroups.entries()].map(([name, g]) => ({ name, rev: totalRevenue(g), count: g.length }));
  stateRev.sort((a, b) => b.rev - a.rev);
  const topState = stateRev[0];
  if (topState && totalRev > 0) {
    const pct = (topState.rev / totalRev) * 100;
    insights.push({ text: `${topState.name} contributes ${fmt(pct, 0)}% of total revenue (${fmtMoney(topState.rev)}).`, type: pct > 25 ? 'positive' : 'neutral' });
  }

  // Top HQs concentration
  const hqGroups = groupBy(active.filter(e => e.hq), e => String(e.hq));
  const hqRev = [...hqGroups.entries()].map(([name, g]) => ({ name, rev: totalRevenue(g) }));
  hqRev.sort((a, b) => b.rev - a.rev);
  const top5HqRev = hqRev.slice(0, 5).reduce((s, h) => s + h.rev, 0);
  if (totalRev > 0) insights.push({ text: `Top 5 HQs contribute ${fmt((top5HqRev / totalRev) * 100, 0)}% of total business.`, type: top5HqRev / totalRev > 0.5 ? 'positive' : 'neutral' });

  // Negative growth concentration
  const negGrowth = active.filter(e => toNum(e.growth) < 0);
  if (negGrowth.length > 0) {
    const negZoneGroups = groupBy(negGrowth.filter(e => e.zone), e => String(e.zone));
    const topNegZone = [...negZoneGroups.entries()].sort((a, b) => b[1].length - a[1].length)[0];
    if (topNegZone) insights.push({ text: `Negative growth is concentrated in ${topNegZone[0]} Zone (${topNegZone[1].length} employees).`, type: 'negative' });
  }

  // Coverage risk by HQ
  const lowCov = active.filter(e => toNum(e.april26_cov) > 0 && toNum(e.april26_cov) < 60);
  if (lowCov.length > 0) {
    const lowCovHq = groupBy(lowCov, e => String(e.hq || 'Unknown'));
    const worstCovHq = [...lowCovHq.entries()].sort((a, b) => b[1].length - a[1].length)[0];
    if (worstCovHq) insights.push({ text: `Coverage risk is highest in ${worstCovHq[0]} HQ (${worstCovHq[1].length} employees below 60%).`, type: 'negative' });
  }

  // BM revenue concentration
  if (allBms.length > 0) {
    const sortedBms = [...allBms].sort((a, b) => revenue(b) - revenue(a));
    const topCount = Math.max(1, Math.round(allBms.length * 0.1));
    const topBmRev = sortedBms.slice(0, topCount).reduce((s, e) => s + revenue(e), 0);
    if (totalRev > 0) {
      const pct = (topBmRev / totalRev) * 100;
      insights.push({ text: `Top ${topCount} BMs generate ${fmt(pct, 0)}% of revenue (${fmtMoney(topBmRev)}).`, type: pct > 40 ? 'positive' : 'neutral' });
    }
  }

  // Inventory risk impact
  const highInv = active.filter(e => toNum(e.apr26_inv_days) > 60);
  if (highInv.length > 0) {
    const invRev = totalRevenue(highInv);
    insights.push({ text: `Inventory risk impacts ${fmtMoney(invRev)} revenue across ${highInv.length} employees.`, type: 'negative' });
  }

  // Low productivity impact
  const lowHrs = active.filter(e => toNum(e.april26_avg_working_hrs) > 0 && toNum(e.april26_avg_working_hrs) < 4);
  if (lowHrs.length > 0) {
    insights.push({ text: `${lowHrs.length} employees have working hours below 4h, impacting ${fmtMoney(totalRevenue(lowHrs))} revenue.`, type: 'negative' });
  }

  // RM achievement trends
  const rmAch = computeAvg(allRms, 'apr_ach');
  if (rmAch > 0) insights.push({ text: `Average RM achievement is ${fmt(rmAch, 1)}% across ${allRms.length} RMs.`, type: rmAch >= 80 ? 'positive' : 'negative' });

  // BM achievement trends
  const bmAch = computeAvg(allBms, 'apr_ach');
  if (bmAch > 0) insights.push({ text: `Average BM achievement is ${fmt(bmAch, 1)}% across ${allBms.length} BMs.`, type: bmAch >= 80 ? 'positive' : 'negative' });

  // Overall health
  const scores = active.filter(e => toNum(e.apr_ach) > 0).map(healthScore);
  const avgScore = scores.length > 0 ? avg(scores) : 0;
  if (avgScore > 0) insights.push({ text: `Overall organizational health score is ${fmt(avgScore, 0)}/100`, type: avgScore >= 75 ? 'positive' : avgScore >= 60 ? 'neutral' : 'negative' });

  return insights.slice(0, 10);
}

export function comparisonMetrics(emps: Employee[]): { empCount: number; revenue: number; contribPct: number; ach: number; growth: number; cov: number; inv: number; hrs: number } {
  const rev = totalRevenue(emps);
  const totalAll = totalRevenue(activeEmployees(emps));
  return {
    empCount: emps.length,
    revenue: rev,
    contribPct: totalAll > 0 ? (rev / totalAll) * 100 : 0,
    ach: computeAvg(emps, 'apr_ach'),
    growth: computeAvg(emps, 'growth'),
    cov: computeAvg(emps, 'april26_cov'),
    inv: computeAvg(emps, 'apr26_inv_days'),
    hrs: computeAvg(emps, 'april26_avg_working_hrs'),
  };
}

export const ACH_COLORS = ['#22c55e', '#86efac', '#fde047', '#ef4444'];
export const GROWTH_COLORS = ['#ef4444', '#f97316', '#fde047', '#22c55e'];
export const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];