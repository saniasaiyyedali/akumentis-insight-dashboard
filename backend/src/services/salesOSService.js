/**
 * Sales Operating System — all aggregations from master_data.xlsx
 * Frontend renders only; no business logic duplication.
 */
const excelService = require('./excelService');

const { loadExcel, getEmployees } = excelService;

const HIERARCHY_LEVELS = ['BU HEAD', 'NSM', 'SM', 'ZM', 'RM', 'BM'];
const HIERARCHY_COLORS = {
  'BU HEAD': { from: '#4338ca', to: '#6366f1', label: 'BU Head' },
  NSM: { from: '#7c3aed', to: '#a855f7', label: 'NSM' },
  SM: { from: '#2563eb', to: '#3b82f6', label: 'SM' },
  ZM: { from: '#0d9488', to: '#14b8a6', label: 'ZM' },
  RM: { from: '#16a34a', to: '#22c55e', label: 'RM' },
  BM: { from: '#ea580c', to: '#f97316', label: 'BM' },
};

const ACH_SLABS = [
  { key: '>100%', label: '> 100%', min: 1.0, max: Infinity, color: '#059669' },
  { key: '90-100%', label: '90-100%', min: 0.9, max: 1.0, color: '#10b981' },
  { key: '80-90%', label: '80-90%', min: 0.8, max: 0.9, color: '#f59e0b' },
  { key: '<80%', label: '< 80%', min: -Infinity, max: 0.8, color: '#ef4444' },
];

const GROWTH_SLABS = [
  { key: '20%+', label: '20%+', min: 0.2, max: Infinity, color: '#059669' },
  { key: '10-20%', label: '10-20%', min: 0.1, max: 0.2, color: '#10b981' },
  { key: '0-10%', label: '0-10%', min: 0, max: 0.1, color: '#f59e0b' },
  { key: '<0%', label: '< 0%', min: -Infinity, max: 0, color: '#ef4444' },
];

const COV_SLABS = [
  { key: 'Healthy', label: 'Healthy', min: 0.8, max: Infinity, color: '#059669' },
  { key: 'Warning', label: 'Warning', min: 0.6, max: 0.8, color: '#f59e0b' },
  { key: 'Risk', label: 'Risk', min: -Infinity, max: 0.6, color: '#ef4444' },
];

function toNum(v) {
  const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function isActive(e) {
  return e.dsgn !== 'ABOLISHED' && e.name &&
    String(e.name).trim() !== 'Vacant' && String(e.name).trim() !== 'VACANT';
}

function getActive(filters = {}) {
  return getEmployees(filters).filter(isActive);
}

function pctVal(e, field) {
  const v = toNum(e[field]);
  return Math.abs(v) <= 1 ? v * 100 : v;
}

function achRatio(e) {
  const v = toNum(e.apr_ach);
  return Math.abs(v) <= 1 ? v : v / 100;
}

function growthRatio(e) {
  const v = toNum(e.growth);
  return Math.abs(v) <= 1 ? v : v / 100;
}

function covRatio(e) {
  const v = toNum(e.april26_cov);
  return Math.abs(v) <= 1 ? v : v / 100;
}

function isAtRisk(e) {
  const ach = achRatio(e);
  const gr = growthRatio(e);
  const cov = covRatio(e);
  return (ach > 0 && ach < 0.8) || gr < 0 || (cov > 0 && cov < 0.6);
}

function aggregateMetrics(emps, poolTotalRev = null) {
  if (!emps.length) {
    return { count: 0, revenue: 0, target: 0, achievement: 0, growth: 0, coverage: 0, revenueAtRisk: 0, contributionPct: 0, riskCount: 0 };
  }
  let revenue = 0, target = 0, riskRev = 0, riskCount = 0;
  const achVals = [], grVals = [], covVals = [];

  for (const e of emps) {
    const rev = toNum(e.net_sale_apr_26);
    const tgt = toNum(e.apr_26_tgt);
    revenue += rev;
    target += tgt;
    const ach = achRatio(e);
    const gr = growthRatio(e);
    const cov = covRatio(e);
    if (ach > 0) achVals.push(ach);
    grVals.push(gr);
    if (cov > 0) covVals.push(cov);
    if (isAtRisk(e)) { riskRev += rev; riskCount++; }
  }

  const achievement = target > 0 ? (revenue / target) * 100 :
    achVals.length > 0 ? (achVals.reduce((a, b) => a + b, 0) / achVals.length) * 100 : 0;
  const growth = grVals.length > 0 ? (grVals.reduce((a, b) => a + b, 0) / grVals.length) * 100 : 0;
  const coverage = covVals.length > 0 ? (covVals.reduce((a, b) => a + b, 0) / covVals.length) * 100 : 0;
  const totalRev = poolTotalRev ?? revenue;

  return {
    count: emps.length,
    revenue: Math.round(revenue * 100) / 100,
    target: Math.round(target * 100) / 100,
    achievement: Math.round(achievement * 100) / 100,
    growth: Math.round(growth * 100) / 100,
    coverage: Math.round(coverage * 100) / 100,
    revenueAtRisk: Math.round(riskRev * 100) / 100,
    contributionPct: totalRev > 0 ? Math.round((revenue / totalRev) * 10000) / 100 : 0,
    riskCount,
  };
}

function filterByRole(emps, role) {
  const r = role.toUpperCase().replace('BU HEAD', 'BU HEAD');
  return emps.filter(e => String(e.dsgn || '').trim().toUpperCase() === r);
}

function matchSlab(value, slabs) {
  for (const s of slabs) {
    if (value >= s.min && value < s.max) return s;
    if (s.max === Infinity && value >= s.min) return s;
  }
  return slabs[slabs.length - 1];
}

function computeRevenueSlabs(emps) {
  const sorted = [...emps].filter(e => toNum(e.net_sale_apr_26) > 0)
    .sort((a, b) => toNum(b.net_sale_apr_26) - toNum(a.net_sale_apr_26));
  const n = sorted.length;
  if (n === 0) return [];

  const top25 = Math.ceil(n * 0.25);
  const bottom25 = Math.ceil(n * 0.25);
  const bottom10 = Math.ceil(n * 0.1);

  const topSet = new Set(sorted.slice(0, top25).map(e => empKey(e)));
  const bottomSet = new Set(sorted.slice(n - bottom25).map(e => empKey(e)));
  const criticalSet = new Set(sorted.slice(n - bottom10).map(e => empKey(e)));

  const slabs = [
    { key: 'Top Contributors', label: 'Top Contributors', color: '#059669', emps: [] },
    { key: 'Average', label: 'Average', color: '#3b82f6', emps: [] },
    { key: 'Low Revenue', label: 'Low Revenue', color: '#f59e0b', emps: [] },
    { key: 'Critical Revenue', label: 'Critical Revenue', color: '#ef4444', emps: [] },
  ];

  for (const e of emps) {
    const k = empKey(e);
    if (criticalSet.has(k) && isAtRisk(e)) slabs[3].emps.push(e);
    else if (bottomSet.has(k)) slabs[2].emps.push(e);
    else if (topSet.has(k)) slabs[0].emps.push(e);
    else slabs[1].emps.push(e);
  }
  return slabs;
}

function empKey(e) {
  return String(e.empCode || e.empcode || '') + '|' + String(e.name || '');
}

function buildSegmentDistribution(emps, segmentType, poolTotalRev) {
  let slabs;
  if (segmentType === 'achievement') slabs = ACH_SLABS;
  else if (segmentType === 'growth') slabs = GROWTH_SLABS;
  else if (segmentType === 'coverage') slabs = COV_SLABS;
  else if (segmentType === 'revenue') {
    const revSlabs = computeRevenueSlabs(emps);
    return revSlabs.map(s => {
      const m = aggregateMetrics(s.emps, poolTotalRev);
      return { ...s, count: m.count, revenue: m.revenue, achievement: m.achievement, growth: m.growth, coverage: m.coverage };
    });
  } else slabs = ACH_SLABS;

  const bucketEmps = slabs.map(() => []);
  for (const e of emps) {
    let val;
    if (segmentType === 'achievement') val = achRatio(e);
    else if (segmentType === 'growth') val = growthRatio(e);
    else val = covRatio(e);
    if (segmentType === 'coverage' && val === 0) continue;
    const slab = matchSlab(val, slabs);
    const idx = slabs.findIndex(s => s.key === slab.key);
    if (idx >= 0) bucketEmps[idx].push(e);
  }

  return slabs.map((s, i) => {
    const m = aggregateMetrics(bucketEmps[i], poolTotalRev);
    return { key: s.key, label: s.label, color: s.color, count: m.count, revenue: m.revenue, achievement: m.achievement, growth: m.growth, coverage: m.coverage, emps: bucketEmps[i] };
  }).filter(s => s.count > 0);
}

function getSummary(filters = {}) {
  const emps = getActive(filters);
  const poolTotal = emps.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);
  const m = aggregateMetrics(emps, poolTotal);

  const hierarchyLevels = HIERARCHY_LEVELS.map(level => {
    const roleEmps = filterByRole(emps, level);
    const rm = aggregateMetrics(roleEmps, poolTotal);
    return {
      level,
      label: HIERARCHY_COLORS[level]?.label || level,
      color: HIERARCHY_COLORS[level] || {},
      count: rm.count,
      revenue: rm.revenue,
      achievement: rm.achievement,
      growth: rm.growth,
      coverage: rm.coverage,
    };
  });

  return {
    revenue: m.revenue,
    achievement: m.achievement,
    growth: m.growth,
    revenueAtRisk: m.revenueAtRisk,
    target: m.target,
    coverage: m.coverage,
    employeeCount: m.count,
    hierarchyLevels,
    lastRefresh: loadExcel().lastRefresh,
  };
}

function getHierarchyLevels(filters = {}) {
  return getSummary(filters).hierarchyLevels;
}

function getSegments(params = {}) {
  const { level = 'RM', segmentType = 'achievement', zone, state, hq, division, segment } = params;
  const filters = { zone, state, hq, division };
  Object.keys(filters).forEach(k => { if (!filters[k]) delete filters[k]; });

  let emps = getActive(filters);
  if (level && level !== 'COMPANY') {
    emps = filterByRole(emps, level);
  }

  if (segment && segmentType) {
    const allSegs = buildSegmentDistribution(emps, segmentType, emps.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0));
    const match = allSegs.find(s => s.key === segment || s.label === segment);
    if (match) emps = match.emps;
  }

  const poolTotal = getActive(filters).reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);
  const segments = buildSegmentDistribution(emps, segmentType, poolTotal);

  return {
    level,
    segmentType,
    totalCount: emps.length,
    segments: segments.map(({ emps: _e, ...rest }) => rest),
  };
}

const BREAKDOWN_ORDER = ['zone', 'state', 'division', 'hq', 'person'];

function getBreakdown(params = {}) {
  const {
    level = 'RM', segmentType = 'achievement', segment,
    breakdownBy = 'zone', zone, state, hq, division,
  } = params;

  const filters = { zone, state, hq, division };
  Object.keys(filters).forEach(k => { if (!filters[k]) delete filters[k]; });

  let emps = getActive(filters);
  if (level && level !== 'COMPANY') emps = filterByRole(emps, level);

  if (segment) {
    const segs = buildSegmentDistribution(emps, segmentType, emps.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0));
    const match = segs.find(s => s.key === segment || s.label === segment);
    if (match) emps = match.emps;
  }

  const poolTotal = getActive(filters).reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);
  const groups = new Map();

  if (breakdownBy === 'person') {
    for (const e of emps) {
      const name = String(e.name || 'Unknown');
      const key = empKey(e);
      if (!groups.has(key)) groups.set(key, { key, name, emps: [], empCode: String(e.empCode || e.empcode || ''), designation: String(e.dsgn || '') });
      groups.get(key).emps.push(e);
    }
  } else {
    for (const e of emps) {
      const val = String(e[breakdownBy] || 'Unknown').trim() || 'Unknown';
      if (!groups.has(val)) groups.set(val, { key: val, name: val, emps: [] });
      groups.get(val).emps.push(e);
    }
  }

  const items = [...groups.values()].map(g => {
    const m = aggregateMetrics(g.emps, poolTotal);
    return {
      key: g.key,
      name: g.name,
      empCode: g.empCode,
      designation: g.designation,
      ...m,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const nextBreakdown = getNextBreakdown(breakdownBy, { zone, state });

  return {
    level, segmentType, segment, breakdownBy,
    items,
    nextBreakdown,
    totalCount: emps.length,
  };
}

function getNextBreakdown(current, ctx = {}) {
  const idx = BREAKDOWN_ORDER.indexOf(current);
  if (idx === -1 || idx >= BREAKDOWN_ORDER.length - 1) return null;
  if (current === 'zone' && ctx.zone) return 'state';
  if (current === 'state' && ctx.state) return 'person';
  return BREAKDOWN_ORDER[idx + 1];
}

function findEmployee(empCode, name) {
  const emps = getActive({});
  if (empCode) {
    const found = emps.find(e => String(e.empCode || e.empcode) === String(empCode));
    if (found) return found;
  }
  if (name) return emps.find(e => String(e.name).trim().toLowerCase() === String(name).trim().toLowerCase());
  return null;
}

function getManagerChain(emp) {
  const HIER = ['BU HEAD', 'NSM', 'SM', 'ZM', 'RM', 'BM'];
  const empRole = String(emp.dsgn || '').trim().toUpperCase();
  const idx = HIER.indexOf(empRole);
  const chain = [];
  const all = getActive({});

  for (let i = 0; i < idx; i++) {
    const role = HIER[i];
    const candidates = all.filter(e => {
      if (String(e.dsgn || '').trim().toUpperCase() !== role) return false;
      if (e.name === emp.name) return false;
      const matchHq = emp.hq && String(e.hq).toLowerCase() === String(emp.hq).toLowerCase();
      const matchState = emp.state && String(e.state).toLowerCase() === String(emp.state).toLowerCase();
      const matchZone = emp.zone && String(e.zone).toLowerCase() === String(emp.zone).toLowerCase();
      return matchHq || matchState || matchZone;
    });
    if (candidates.length) {
      chain.push({
        role: HIERARCHY_COLORS[role]?.label || role,
        name: String(candidates[0].name),
        empCode: String(candidates[0].empCode || candidates[0].empcode || ''),
      });
    }
  }
  return chain;
}

function getBMProfile(empCode) {
  const emp = findEmployee(empCode);
  if (!emp) return null;
  const all = getActive({});
  const poolTotal = all.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);
  const m = aggregateMetrics([emp], poolTotal);
  const team = all.filter(e =>
    String(e.dsgn || '').toUpperCase() !== 'BM' &&
    String(e.hq || '').toLowerCase() === String(emp.hq || '').toLowerCase() &&
    String(e.state || '').toLowerCase() === String(emp.state || '').toLowerCase()
  );

  return {
    type: 'BM',
    name: String(emp.name),
    empCode: String(emp.empCode || emp.empcode || ''),
    zone: String(emp.zone || ''),
    state: String(emp.state || ''),
    hq: String(emp.hq || ''),
    revenue: toNum(emp.net_sale_apr_26),
    target: toNum(emp.apr_26_tgt),
    actual: toNum(emp.net_sale_apr_26),
    achievement: pctVal(emp, 'apr_ach'),
    growth: pctVal(emp, 'growth'),
    coverage: pctVal(emp, 'april26_cov'),
    contributionPct: m.contributionPct,
    revenueAtRisk: isAtRisk(emp) ? toNum(emp.net_sale_apr_26) : 0,
    managerChain: getManagerChain(emp),
    team: team.slice(0, 50).map(e => ({
      name: String(e.name), empCode: String(e.empCode || e.empcode || ''),
      designation: String(e.dsgn || ''), revenue: toNum(e.net_sale_apr_26),
      achievement: pctVal(e, 'apr_ach'), growth: pctVal(e, 'growth'),
    })),
    teamCount: team.length,
  };
}

function getRMProfile(empCode) {
  const emp = findEmployee(empCode);
  if (!emp) return null;
  const all = getActive({});
  const poolTotal = all.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);

  const bms = all.filter(e =>
    e.dsgn === 'BM' &&
    String(e.state || '').toLowerCase() === String(emp.state || '').toLowerCase() &&
    String(e.zone || '').toLowerCase() === String(emp.zone || '').toLowerCase()
  );

  const bmMetrics = bms.map(b => {
    const rev = toNum(b.net_sale_apr_26);
    return {
      name: String(b.name), empCode: String(b.empCode || b.empcode || ''),
      revenue: rev, achievement: pctVal(b, 'apr_ach'), growth: pctVal(b, 'growth'),
      coverage: pctVal(b, 'april26_cov'),
      revenueAtRisk: isAtRisk(b) ? rev : 0,
      atRisk: isAtRisk(b),
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const owned = [emp, ...bms];
  const m = aggregateMetrics(owned, poolTotal);
  const riskRev = bmMetrics.reduce((s, b) => s + b.revenueAtRisk, 0);

  return {
    type: 'RM',
    name: String(emp.name),
    empCode: String(emp.empCode || emp.empcode || ''),
    zone: String(emp.zone || ''), state: String(emp.state || ''), hq: String(emp.hq || ''),
    revenue: m.revenue, achievement: m.achievement, growth: m.growth, coverage: m.coverage,
    contributionPct: m.contributionPct,
    revenueAtRisk: riskRev,
    riskContributionPct: m.revenue > 0 ? Math.round((riskRev / m.revenue) * 10000) / 100 : 0,
    managerChain: getManagerChain(emp),
    bms: bmMetrics,
    bmCount: bms.length,
  };
}

function getZoneProfile(zoneName) {
  const all = getActive({});
  const poolTotal = all.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);
  const zoneEmps = all.filter(e => String(e.zone || '').toLowerCase() === String(zoneName).toLowerCase());
  if (!zoneEmps.length) return null;

  const m = aggregateMetrics(zoneEmps, poolTotal);

  const stateGroups = new Map();
  for (const e of zoneEmps) {
    const st = String(e.state || 'Unknown');
    if (!stateGroups.has(st)) stateGroups.set(st, []);
    stateGroups.get(st).push(e);
  }
  const states = [...stateGroups.entries()].map(([name, emps]) => ({ name, ...aggregateMetrics(emps, poolTotal) }))
    .sort((a, b) => b.revenue - a.revenue);

  const rms = filterByRole(zoneEmps, 'RM').map(e => ({ name: String(e.name), empCode: String(e.empCode || e.empcode || ''), ...aggregateMetrics([e], poolTotal) }))
    .sort((a, b) => b.revenue - a.revenue);

  const bms = filterByRole(zoneEmps, 'BM').map(e => ({ name: String(e.name), empCode: String(e.empCode || e.empcode || ''), ...aggregateMetrics([e], poolTotal) }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    type: 'Zone',
    name: zoneName,
    ...m,
    bestState: states[0] || null,
    worstState: states.length > 1 ? states[states.length - 1] : null,
    topRM: rms[0] || null,
    bottomRM: rms.length > 1 ? rms[rms.length - 1] : null,
    topBM: bms[0] || null,
    bottomBM: bms.length > 1 ? bms[bms.length - 1] : null,
    states: states.slice(0, 10),
  };
}

function getLeakage(filters = {}) {
  const all = getActive(filters);
  const poolTotal = all.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);
  const atRisk = all.filter(isAtRisk);
  const totalRisk = atRisk.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);

  function topBy(field, roleFilter) {
    const groups = new Map();
    for (const e of atRisk) {
      if (roleFilter && String(e.dsgn || '').toUpperCase() !== roleFilter) continue;
      const val = String(e[field] || 'Unknown');
      if (!groups.has(val)) groups.set(val, []);
      groups.get(val).push(e);
    }
    return [...groups.entries()]
      .map(([name, emps]) => ({ name, ...aggregateMetrics(emps, poolTotal) }))
      .sort((a, b) => b.revenueAtRisk - a.revenueAtRisk)
      .slice(0, 8);
  }

  return {
    revenueAtRisk: Math.round(totalRisk * 100) / 100,
    atRiskCount: atRisk.length,
    coverageRiskCount: all.filter(e => covRatio(e) > 0 && covRatio(e) < 0.6).length,
    negativeGrowthCount: all.filter(e => growthRatio(e) < 0).length,
    achievementRiskCount: all.filter(e => achRatio(e) > 0 && achRatio(e) < 0.8).length,
    topZones: topBy('zone'),
    topStates: topBy('state'),
    topRMs: topBy('name', 'RM'),
    topBMs: topBy('name', 'BM'),
  };
}

function getOrgTree(params = {}) {
  const { zone, state, parentRole, parentEmpCode } = params;
  const filters = {};
  if (zone) filters.zone = zone;
  if (state) filters.state = state;

  const hierarchy = excelService.getSalesHierarchy(filters);

  function simplifyNode(node) {
    const ach = (node.avgAchievement ?? node.achievement) * 100;
    const gr = (node.avgGrowth ?? node.growth) * 100;
    const cov = (node.avgCoverage ?? node.coverage) * 100;
    const riskRev = node.revenueAtRisk ?? 0;
    return {
      name: node.name,
      empCode: node.empCode,
      designation: node.designation,
      zone: node.zone,
      state: node.state,
      hq: node.hq,
      revenue: node.totalRevenue,
      achievement: Math.round(ach * 100) / 100,
      growth: Math.round(gr * 100) / 100,
      coverage: Math.round(cov * 100) / 100,
      teamSize: node.teamSize ?? node.totalCount,
      contributionPct: node.contributionPct ?? 0,
      revenueAtRisk: riskRev,
      atRisk: riskRev > 0,
      hasChildren: (node.children || []).length > 0,
      children: [],
    };
  }

  if (parentEmpCode) {
    function findNode(nodes) {
      for (const n of nodes) {
        if (String(n.empCode) === String(parentEmpCode)) return n;
        const found = findNode(n.children || []);
        if (found) return found;
      }
      return null;
    }
    const parent = findNode(hierarchy);
    if (parent) {
      return (parent.children || []).map(c => simplifyNode(c));
    }
    return [];
  }

  return hierarchy.map(n => simplifyNode(n));
}

function compareEntities(params = {}) {
  const { a, b, dimension = 'state' } = params;
  const all = getActive({});
  const poolTotal = all.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);

  function getGroup(name) {
    if (dimension === 'state') return all.filter(e => String(e.state).toLowerCase() === String(name).toLowerCase());
    if (dimension === 'zone') return all.filter(e => String(e.zone).toLowerCase() === String(name).toLowerCase());
    return all.filter(e => String(e.name).toLowerCase() === String(name).toLowerCase());
  }

  const ga = getGroup(a);
  const gb = getGroup(b);
  return {
    a: { name: a, ...aggregateMetrics(ga, poolTotal) },
    b: { name: b, ...aggregateMetrics(gb, poolTotal) },
    dimension,
  };
}

function processAIQuery(query) {
  const q = String(query || '').toLowerCase().trim();
  const all = getActive({});
  const responses = [];

  if (/low performing rm|underperforming rm|worst rm/.test(q)) {
    const rms = filterByRole(all, 'RM')
      .map(e => ({ name: String(e.name), empCode: String(e.empCode || e.empcode || ''), ach: pctVal(e, 'apr_ach'), rev: toNum(e.net_sale_apr_26) }))
      .filter(e => e.ach > 0 && e.ach < 80)
      .sort((a, b) => a.ach - b.ach)
      .slice(0, 10);
    return {
      answer: rms.length ? `Found ${rms.length} RMs below 80% achievement.` : 'No RMs below 80% achievement in current data.',
      data: rms,
      action: { type: 'drill', level: 'RM', segmentType: 'achievement', segment: '<80%' },
    };
  }

  if (/bm.*below 80|below 80.*bm/.test(q)) {
    const bms = filterByRole(all, 'BM').filter(e => achRatio(e) > 0 && achRatio(e) < 0.8).length;
    return {
      answer: `${bms} BMs are below 80% achievement.`,
      data: { count: bms },
      action: { type: 'drill', level: 'BM', segmentType: 'achievement', segment: '<80%' },
    };
  }

  if (/why.*west|west.*underperform/.test(q)) {
    const profile = getZoneProfile('West');
    return {
      answer: profile
        ? `West zone: ${profile.achievement.toFixed(1)}% achievement, ${profile.growth >= 0 ? '+' : ''}${profile.growth.toFixed(1)}% growth. Revenue at risk: ${profile.revenueAtRisk}. Worst state: ${profile.worstState?.name || 'N/A'}.`
        : 'West zone data not found.',
      data: profile,
      action: profile ? { type: 'profile', profileType: 'zone', name: 'West' } : null,
    };
  }

  if (/compare.*maharashtra.*up|maharashtra vs up|up vs maharashtra/.test(q)) {
    const cmp = compareEntities({ a: 'Maharashtra', b: 'UP', dimension: 'state' });
    return {
      answer: `Maharashtra: ${cmp.a.revenue} revenue, ${cmp.a.achievement.toFixed(1)}% ach. UP: ${cmp.b.revenue} revenue, ${cmp.b.achievement.toFixed(1)}% ach.`,
      data: cmp,
      action: null,
    };
  }

  if (/revenue leakage|revenue at risk/.test(q)) {
    const leak = getLeakage();
    return {
      answer: `Total revenue at risk: ${leak.revenueAtRisk}. ${leak.atRiskCount} employees flagged. Top risk zone: ${leak.topZones[0]?.name || 'N/A'}.`,
      data: leak,
      action: { type: 'leakage' },
    };
  }

  if (/top growth|growth manager/.test(q)) {
    const top = filterByRole(all, 'RM')
      .map(e => ({ name: String(e.name), growth: pctVal(e, 'growth'), rev: toNum(e.net_sale_apr_26) }))
      .sort((a, b) => b.growth - a.growth).slice(0, 5);
    return {
      answer: `Top growth RMs: ${top.map(t => `${t.name} (${t.growth >= 0 ? '+' : ''}${t.growth.toFixed(1)}%)`).join(', ')}.`,
      data: top,
      action: { type: 'drill', level: 'RM', segmentType: 'growth', segment: '20%+' },
    };
  }

  if (/critical state/.test(q)) {
    const states = new Map();
    for (const e of all.filter(isAtRisk)) {
      const st = String(e.state || 'Unknown');
      if (!states.has(st)) states.set(st, []);
      states.get(st).push(e);
    }
    const top = [...states.entries()]
      .map(([name, emps]) => ({ name, risk: emps.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0) }))
      .sort((a, b) => b.risk - a.risk).slice(0, 5);
    return {
      answer: `Critical states by revenue at risk: ${top.map(t => `${t.name} (${Math.round(t.risk)})`).join(', ')}.`,
      data: top,
      action: null,
    };
  }

  if (/hierarchy summary|org summary/.test(q)) {
    const summary = getSummary();
    return {
      answer: `Organization: ${summary.employeeCount} active employees. Revenue ${summary.revenue}, ${summary.achievement.toFixed(1)}% achievement. ${summary.hierarchyLevels.map(h => `${h.label} (${h.count})`).join(', ')}.`,
      data: summary,
      action: null,
    };
  }

  if (/achievement trend|achievement/.test(q)) {
    const segs = getSegments({ level: 'COMPANY', segmentType: 'achievement' });
    return {
      answer: `Achievement distribution: ${segs.segments.map(s => `${s.label}: ${s.count}`).join(', ')}.`,
      data: segs,
      action: { type: 'drill', level: 'BM', segmentType: 'achievement' },
    };
  }

  if (/best rm|top rm|highest revenue rm/.test(q)) {
    const tb = getTopBottomPerformers();
    const top = tb.rm.top[0];
    return {
      answer: top ? `Best RM by revenue: ${top.name} — ${top.revenue} revenue, ${top.achievement.toFixed(1)}% achievement, ${top.growth >= 0 ? '+' : ''}${top.growth.toFixed(1)}% growth.` : 'No RM data.',
      data: tb.rm.top.slice(0, 5),
      action: top?.empCode ? { type: 'profile', profileType: 'rm', name: top.empCode } : null,
    };
  }

  if (/worst bm|bottom bm|lowest bm/.test(q)) {
    const tb = getTopBottomPerformers();
    const w = tb.bm.bottom[0];
    return {
      answer: w ? `Lowest achievement BM: ${w.name} — ${w.achievement.toFixed(1)}% achievement, ${fmtMoneyShort(w.revenue)} revenue.` : 'No BM data.',
      data: tb.bm.bottom.slice(0, 5),
      action: w?.empCode ? { type: 'profile', profileType: 'bm', name: w.empCode } : null,
    };
  }

  if (/best zone|top zone|highest zone/.test(q)) {
    const dist = getOrgLevelDistribution({ level: 'RM', breakdownBy: 'zone' });
    const z = dist.regions[0];
    return {
      answer: z ? `Top zone by RM revenue: ${z.name} — ${z.revenue} revenue, ${z.achievement.toFixed(1)}% achievement.` : 'No zone data.',
      data: dist.regions.slice(0, 5),
      action: z ? { type: 'profile', profileType: 'zone', name: z.name } : null,
    };
  }

  if (/lowest achievement|worst achievement/.test(q)) {
    const all = filterByRole(getActive({}), 'RM').concat(filterByRole(getActive({}), 'BM'));
    const worst = all.map(e => ({ name: String(e.name), ach: pctVal(e, 'apr_ach'), dsgn: e.dsgn }))
      .filter(x => x.ach > 0).sort((a, b) => a.ach - b.ach)[0];
    return {
      answer: worst ? `Lowest achievement manager: ${worst.name} (${worst.dsgn}) at ${worst.ach.toFixed(1)}%.` : 'No data.',
      data: worst,
      action: null,
    };
  }

  if (/highest growth|best growth|top growth/.test(q)) {
    const rms = filterByRole(getActive({}), 'RM')
      .map(e => ({ name: String(e.name), growth: pctVal(e, 'growth'), empCode: String(e.empCode || e.empcode || '') }))
      .sort((a, b) => b.growth - a.growth);
    const top = rms[0];
    return {
      answer: top ? `Highest growth RM: ${top.name} at ${top.growth >= 0 ? '+' : ''}${top.growth.toFixed(1)}%.` : 'No growth data.',
      data: rms.slice(0, 5),
      action: top?.empCode ? { type: 'drill', level: 'RM', segmentType: 'growth', segment: '20%+' } : null,
    };
  }

  if (/leakage by state|revenue leakage.*state/.test(q)) {
    const leak = getLeakageOwnership();
    const states = leak.revenueLeakage.topStates || [];
    return {
      answer: states.length ? `Top states by revenue leakage: ${states.map(s => `${s.name} (${s.revenueAtRisk})`).join(', ')}.` : 'No state leakage data.',
      data: states,
      action: { type: 'leakage' },
    };
  }

  const summary = getSummary();
  return {
    answer: `Sales OS summary: Revenue ${summary.revenue}, Achievement ${summary.achievement.toFixed(1)}%, Growth ${summary.growth >= 0 ? '+' : ''}${summary.growth.toFixed(1)}%, Revenue at Risk ${summary.revenueAtRisk}. Try: "Show low performing RMs", "Why is West underperforming?", "Compare Maharashtra vs UP".`,
    data: summary,
    action: null,
  };
}

function fmtMoneyShort(v) {
  if (v >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(Math.round(v));
}

function personRow(e, poolTotal) {
  const rev = toNum(e.net_sale_apr_26);
  const atRisk = isAtRisk(e);
  return {
    name: String(e.name || 'Unknown'),
    empCode: String(e.empCode || e.empcode || ''),
    designation: String(e.dsgn || ''),
    zone: String(e.zone || ''),
    state: String(e.state || ''),
    hq: String(e.hq || ''),
    revenue: rev,
    achievement: pctVal(e, 'apr_ach'),
    growth: pctVal(e, 'growth'),
    coverage: pctVal(e, 'april26_cov'),
    contributionPct: poolTotal > 0 ? Math.round((rev / poolTotal) * 10000) / 100 : 0,
    revenueAtRisk: atRisk ? rev : 0,
    atRisk,
    managerChain: getManagerChain(e),
  };
}

function getPerformanceHub(filters = {}) {
  const emps = getActive(filters);
  const poolTotal = emps.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);

  const charts = [
    { id: 'rm-achievement', level: 'RM', segmentType: 'achievement', title: 'RM Achievement Split', vizType: 'bar' },
    { id: 'rm-growth', level: 'RM', segmentType: 'growth', title: 'RM Growth Split', vizType: 'radial' },
    { id: 'bm-achievement', level: 'BM', segmentType: 'achievement', title: 'BM Achievement Split', vizType: 'treemap' },
    { id: 'bm-growth', level: 'BM', segmentType: 'growth', title: 'BM Growth Split', vizType: 'ring' },
  ].map(c => {
    const roleEmps = filterByRole(emps, c.level);
    const segments = buildSegmentDistribution(roleEmps, c.segmentType, poolTotal)
      .map(({ emps: _e, ...rest }) => rest);
    return { ...c, totalCount: roleEmps.length, segments };
  });

  return { charts, poolTotalRevenue: poolTotal };
}

function getSegmentMembers(params = {}) {
  const { level = 'BM', segmentType = 'achievement', segment } = params;
  if (!segment) return { members: [], totalCount: 0, aggregate: null, byZone: [], topPerformers: [], bottomPerformers: [] };

  const emps = getActive({});
  const poolTotal = emps.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);
  const roleEmps = filterByRole(emps, level);
  const segs = buildSegmentDistribution(roleEmps, segmentType, poolTotal);
  const match = segs.find(s => s.key === segment || s.label === segment);
  if (!match) return { members: [], totalCount: 0, aggregate: null, byZone: [], topPerformers: [], bottomPerformers: [] };

  const rows = match.emps.map(e => personRow(e, poolTotal));
  const sorted = [...rows].sort((a, b) => b.revenue - a.revenue);

  const zoneMap = new Map();
  for (const e of match.emps) {
    const z = String(e.zone || 'Unknown');
    if (!zoneMap.has(z)) zoneMap.set(z, []);
    zoneMap.get(z).push(e);
  }
  const byZone = [...zoneMap.entries()]
    .map(([name, zEmps]) => ({ name, ...aggregateMetrics(zEmps, poolTotal) }))
    .sort((a, b) => b.revenue - a.revenue);

  const stateMap = new Map();
  for (const e of match.emps) {
    const st = String(e.state || 'Unknown');
    if (!stateMap.has(st)) stateMap.set(st, []);
    stateMap.get(st).push(e);
  }
  const byState = [...stateMap.entries()]
    .map(([name, sEmps]) => ({ name, ...aggregateMetrics(sEmps, poolTotal) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const agg = aggregateMetrics(match.emps, poolTotal);
  return {
    level, segmentType, segment,
    totalCount: match.emps.length,
    aggregate: agg,
    members: sorted.slice(0, 24),
    byZone: byZone.slice(0, 8),
    byState,
    topPerformers: sorted.slice(0, 5),
    bottomPerformers: [...sorted].sort((a, b) => a.achievement - b.achievement || a.revenue - b.revenue).slice(0, 5),
  };
}

function getOrgHierarchyHealth(filters = {}) {
  const summary = getSummary(filters);
  const emps = getActive(filters);
  const poolTotal = emps.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);

  return {
    levels: summary.hierarchyLevels.map(lv => {
      const roleEmps = filterByRole(emps, lv.level);
      const riskRev = roleEmps.filter(isAtRisk).reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);
      return {
        ...lv,
        teamSize: lv.count,
        contributionPct: poolTotal > 0 ? Math.round((lv.revenue / poolTotal) * 10000) / 100 : 0,
        revenueAtRisk: Math.round(riskRev * 100) / 100,
        atRisk: riskRev > 0,
        color: HIERARCHY_COLORS[lv.level] || {},
      };
    }),
  };
}

function getOrgLevelDistribution(params = {}) {
  const { level = 'RM', breakdownBy = 'zone' } = params;
  const emps = filterByRole(getActive({}), level);
  const poolTotal = emps.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);
  const groups = new Map();

  for (const e of emps) {
    const key = String(e[breakdownBy] || 'Unknown');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }

  const regions = [...groups.entries()]
    .map(([name, gEmps]) => {
      const m = aggregateMetrics(gEmps, poolTotal);
      const achSegs = buildSegmentDistribution(gEmps, 'achievement', poolTotal)
        .map(({ emps: _e, ...rest }) => rest);
      return { name, breakdownBy, ...m, segments: achSegs };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const achDist = buildSegmentDistribution(emps, 'achievement', poolTotal)
    .map(({ emps: _e, ...rest }) => rest);
  const grDist = buildSegmentDistribution(emps, 'growth', poolTotal)
    .map(({ emps: _e, ...rest }) => rest);

  return { level, breakdownBy, regions, achievementDistribution: achDist, growthDistribution: grDist };
}

function getOrgRegionManagers(params = {}) {
  const { level = 'RM', region, breakdownBy = 'zone' } = params;
  if (!region) return { managers: [] };

  const emps = filterByRole(getActive({}), level).filter(e =>
    String(e[breakdownBy] || '').toLowerCase() === String(region).toLowerCase()
  );
  const poolTotal = getActive({}).reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);

  const managers = emps
    .map(e => personRow(e, poolTotal))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    level, region, breakdownBy,
    aggregate: aggregateMetrics(emps, poolTotal),
    managers,
  };
}

function getOrgManagerDetail(empCode) {
  const emp = findEmployee(empCode);
  if (!emp) return null;
  const dsgn = String(emp.dsgn || '').toUpperCase();
  if (dsgn === 'BM') return getBMProfile(empCode);
  if (dsgn === 'RM') return getRMProfile(empCode);
  const poolTotal = getActive({}).reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);
  const row = personRow(emp, poolTotal);
  return {
    type: dsgn,
    ...row,
    name: row.name,
    revenue: row.revenue,
    achievement: row.achievement,
    growth: row.growth,
    coverage: row.coverage,
    revenueAtRisk: row.revenueAtRisk,
    managerChain: row.managerChain,
    topPerformers: [],
    bottomPerformers: [],
  };
}

function getTopBottomPerformers(filters = {}) {
  const all = getActive(filters);
  const poolTotal = all.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);

  function rankRole(role, topField, bottomField) {
    const emps = filterByRole(all, role);
    const rows = emps.map(e => personRow(e, poolTotal));
    const top = [...rows].sort((a, b) => b[topField] - a[topField]).slice(0, 10);
    const bottom = [...rows]
      .filter(r => topField === 'achievement' ? r.achievement > 0 : true)
      .sort((a, b) => a[bottomField] - b[bottomField])
      .slice(0, 10);
    return { top, bottom };
  }

  return {
    rm: rankRole('RM', 'revenue', 'achievement'),
    bm: rankRole('BM', 'revenue', 'achievement'),
  };
}

function getLeakageOwnership(filters = {}) {
  const all = getActive(filters);
  const poolTotal = all.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);

  function ownersFor(predicate) {
    const flagged = all.filter(predicate);
    const riskRev = flagged.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);
    function topOwners(field, roleFilter) {
      const groups = new Map();
      for (const e of flagged) {
        if (roleFilter && String(e.dsgn || '').toUpperCase() !== roleFilter) continue;
        const val = String(e[field] || 'Unknown');
        if (!groups.has(val)) groups.set(val, []);
        groups.get(val).push(e);
      }
      return [...groups.entries()]
        .map(([name, emps]) => ({ name, ...aggregateMetrics(emps, poolTotal) }))
        .sort((a, b) => b.revenueAtRisk - a.revenueAtRisk)
        .slice(0, 5);
    }
    return {
      count: flagged.length,
      revenueAtRisk: Math.round(riskRev * 100) / 100,
      topZones: topOwners('zone'),
      topStates: topOwners('state'),
      topRMs: topOwners('name', 'RM'),
      topBMs: topOwners('name', 'BM'),
    };
  }

  return {
    revenueLeakage: ownersFor(isAtRisk),
    coverageRisk: ownersFor(e => covRatio(e) > 0 && covRatio(e) < 0.6),
    negativeGrowth: ownersFor(e => growthRatio(e) < 0),
    achievementRisk: ownersFor(e => achRatio(e) > 0 && achRatio(e) < 0.8),
    totalRevenueAtRisk: getLeakage(filters).revenueAtRisk,
  };
}

function getOrgNodeDetail(empCode) {
  const hierarchy = excelService.getSalesHierarchy({});
  let found = null;
  function walk(nodes) {
    for (const n of nodes) {
      if (String(n.empCode) === String(empCode)) { found = n; return; }
      walk(n.children || []);
    }
  }
  walk(hierarchy);
  if (!found) return null;
  const ach = (found.avgAchievement ?? found.achievement) * 100;
  const gr = (found.avgGrowth ?? found.growth) * 100;
  const cov = (found.avgCoverage ?? found.coverage) * 100;
  return {
    name: found.name,
    empCode: found.empCode,
    designation: found.designation,
    zone: found.zone,
    state: found.state,
    hq: found.hq,
    revenue: found.totalRevenue,
    achievement: Math.round(ach * 100) / 100,
    growth: Math.round(gr * 100) / 100,
    coverage: Math.round(cov * 100) / 100,
    teamSize: found.teamSize ?? found.totalCount,
    contributionPct: found.contributionPct ?? 0,
    revenueAtRisk: found.revenueAtRisk ?? 0,
    atRisk: (found.revenueAtRisk ?? 0) > 0,
    hasChildren: (found.children || []).length > 0,
  };
}

module.exports = {
  HIERARCHY_LEVELS,
  HIERARCHY_COLORS,
  getSummary,
  getHierarchyLevels,
  getSegments,
  getBreakdown,
  getBMProfile,
  getRMProfile,
  getZoneProfile,
  getLeakage,
  getOrgTree,
  compareEntities,
  processAIQuery,
  getPerformanceHub,
  getSegmentMembers,
  getTopBottomPerformers,
  getLeakageOwnership,
  getOrgNodeDetail,
  getOrgHierarchyHealth,
  getOrgLevelDistribution,
  getOrgRegionManagers,
  getOrgManagerDetail,
  aggregateMetrics,
  getActive,
};
