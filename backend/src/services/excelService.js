const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const EXCEL_PATH = path.join(__dirname, '..', '..', 'data', 'master_data.xlsx');
const SRC_EXCEL_PATH = path.join(__dirname, '..', 'data', 'master_data.xlsx');

let cache = null;
let lastLoaded = null;
let lastRefreshTime = null;

const RENAMED_COLUMNS = {
  'HQ.': 'HQ',
  'System HQ': 'hqSystem',
  'STATE': 'state',
  'STATE2': 'state2',
  'Name Of Employee': 'name',
  'Emp. Code': 'empCode',
  'Dsgn': 'dsgn',
  'Age In Organization': 'ageInOrg',
};

function norm(v) {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t || t === '-' || t === 'N/A') return null;
    return t;
  }
  return v;
}

const KNOWN_ACRONYMS = new Set(['HQ', 'BM', 'RM', 'SM', 'ZM', 'NSM', 'BU']);

const ZONE_NORMALIZE = { 'WEST': 'West', 'EAST': 'East', 'NORTH': 'North', 'SOUTH': 'South' };

function normalizeDisplayValue(v) {
  if (!v || typeof v !== 'string') return v;
  const trimmed = v.trim().replace(/\s+/g, ' ');
  // Proper title case: first letter uppercase, rest lowercase per word,
  // but preserve known acronyms like HQ, BM, RM
  return trimmed.replace(/\b\w+/g, word => {
    const upper = word.toUpperCase();
    if (KNOWN_ACRONYMS.has(upper)) return upper;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

function generateUniqueKey(headers, idx) {
  let base = String(headers[idx] || '').trim();
  if (!base) return `_col${idx}`;
  const renamed = RENAMED_COLUMNS[base];
  if (renamed) base = renamed;
  base = base.replace(/[^a-zA-Z0-9_ ]/g, '').trim();
  const key = base.replace(/\s+/g, '_').toLowerCase();
  const existing = headers.slice(0, idx).filter(h => h).map(h => {
    const r = RENAMED_COLUMNS[String(h).trim()] || String(h).trim();
    return r.replace(/[^a-zA-Z0-9_ ]/g, '').trim().replace(/\s+/g, '_').toLowerCase();
  });
  if (existing.includes(key)) return `${key}_${idx}`;
  return key;
}

function loadExcel() {
  if (cache && lastLoaded) {
    try {
      const st = fs.statSync(EXCEL_PATH);
      if (st.mtimeMs === lastLoaded) return cache;
    } catch { }
  }

  let fp = EXCEL_PATH;
  if (!fs.existsSync(fp)) fp = SRC_EXCEL_PATH;
  if (!fs.existsSync(fp)) {
    cache = { employees: [], columns: [], rawHeaders: [], columnKeys: [] };
    return cache;
  }

  const wb = XLSX.readFile(fp, { cellDates: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { defval: '', header: 1 });

  const headers = raw[1] || [];
  const columnKeys = [];
  const rawHeaders = [];

  for (let i = 0; i < headers.length; i++) {
    if (headers[i] !== undefined && headers[i] !== null && headers[i] !== '') {
      const rawName = String(headers[i]).trim();
      rawHeaders.push(rawName);
      columnKeys.push(generateUniqueKey(headers, i));
    }
  }

  const employees = [];

  for (let i = 2; i < raw.length; i++) {
    const row = raw[i];
    if (!row || !row[0]) continue;

    const emp = {};
    let hasData = false;
    let keyIdx = 0;

    for (let j = 0; j < headers.length; j++) {
      if (!headers[j] || headers[j] === '') continue;
      const key = columnKeys[keyIdx];
      keyIdx++;
      const val = norm(row[j]);
      emp[key] = val;
      if (val !== null) hasData = true;
    }

    if (hasData) {
      if (emp.zone && typeof emp.zone === 'string') {
        const z = emp.zone.trim().toUpperCase();
        if (ZONE_NORMALIZE[z] || ZONE_NORMALIZE[emp.zone.trim()]) {
          emp.zone = ZONE_NORMALIZE[z] || ZONE_NORMALIZE[emp.zone.trim()];
        }
      }
      if (emp.empcode != null && emp.empCode == null) emp.empCode = emp.empcode;
      employees.push(emp);
    }
  }

  try {
    const st = fs.statSync(fp);
    lastLoaded = st.mtimeMs;
  } catch { }
  lastRefreshTime = new Date().toISOString();

  const columnMap = rawHeaders.map((raw, i) => ({
    originalName: raw,
    safeKey: columnKeys[i],
  }));

  cache = { employees, columns: rawHeaders, columnKeys, columnMap, lastRefresh: lastRefreshTime };
  return cache;
}

function getEmployees(filters = {}) {
  const data = loadExcel().employees;
  let res = [...data];

  if (filters.search) {
    const q = String(filters.search).toLowerCase();
    res = res.filter(e =>
      Object.values(e).some(v => v !== null && String(v).toLowerCase().includes(q))
    );
  }

  for (const [key, val] of Object.entries(filters)) {
    if (!val || val === 'all' || key === 'search') continue;
    const vals = Array.isArray(val) ? val : [val];
    res = res.filter(e =>
      e[key] !== undefined && e[key] !== null &&
      vals.some(v => normalizeDisplayValue(String(e[key])) === normalizeDisplayValue(String(v)))
    );
  }

  return res;
}

function getKPI(filters = {}) {
  const emps = getEmployees(filters);
  const total = emps.length;
  const active = emps.filter(e =>
    e.dsgn !== 'ABOLISHED' && e.name && String(e.name).trim() !== 'Vacant' && String(e.name).trim() !== 'VACANT'
  ).length;
  const abolished = total - active;

  return {
    totalPositions: total,
    filledPositions: active,
    vacancies: abolished,
    vacancyPct: total > 0 ? Math.round((abolished / total) * 10000) / 100 : 0,
    activeEmployees: active,
    totalDivisions: new Set(emps.map(e => normalizeDisplayValue(e.division)).filter(Boolean)).size,
    totalZones: new Set(emps.map(e => normalizeDisplayValue(e.zone)).filter(Boolean)).size,
    totalStates: new Set(emps.map(e => normalizeDisplayValue(e.state)).filter(Boolean)).size,
    totalHQs: new Set(emps.map(e => normalizeDisplayValue(e.hq)).filter(Boolean)).size,
  };
}

function getHierarchyTree(filters = {}) {
  const emps = getEmployees(filters);
  const root = { name: 'ALL', children: [], _count: emps.length };

  for (const emp of emps) {
    const div = normalizeDisplayValue(emp.division || 'Unknown');
    let d = root.children.find(c => c.name === div);
    if (!d) { d = { name: div, children: [], _count: 0, _emps: [] }; root.children.push(d); }
    d._count++; d._emps.push(emp);

    const zone = normalizeDisplayValue(emp.zone || 'Unknown');
    let z = d.children.find(c => c.name === zone);
    if (!z) { z = { name: zone, children: [], _count: 0, _emps: [] }; d.children.push(z); }
    z._count++; z._emps.push(emp);

    const state = normalizeDisplayValue(emp.state || 'Unknown');
    let s = z.children.find(c => c.name === state);
    if (!s) { s = { name: state, children: [], _count: 0, _emps: [] }; z.children.push(s); }
    s._count++; s._emps.push(emp);

    const hq = normalizeDisplayValue(emp.hq || 'Unknown');
    let h = s.children.find(c => c.name === hq);
    if (!h) { h = { name: hq, children: [], _count: 0, _emps: [] }; s.children.push(h); }
    h._count++; h._emps.push(emp);

    const dsgn = normalizeDisplayValue(emp.dsgn || 'Unknown');
    let dg = h.children.find(c => c.name === dsgn);
    if (!dg) { dg = { name: dsgn, children: [], _count: 0, _emps: [] }; h.children.push(dg); }
    dg._count++; dg._emps.push(emp);
  }

  return root;
}

function getDataQuality() {
  const data = loadExcel();
  const emps = data.employees;
  const total = emps.length;
  const allKeys = data.columnKeys;

  let missingCount = 0;
  let missingHq = 0;
  let missingState = 0;
  let missingDsgn = 0;
  const seen = new Set();
  const dupCodes = new Set();

  for (const e of emps) {
    let emptyFields = 0;
    for (const k of allKeys) {
      if (e[k] === null || e[k] === undefined) emptyFields++;
    }
    if (emptyFields > 0) missingCount++;
    if (!e.hq) missingHq++;
    if (!e.state) missingState++;
    if (!e.dsgn) missingDsgn++;

    if (e.empCode) {
      if (seen.has(String(e.empCode))) dupCodes.add(String(e.empCode));
      seen.add(String(e.empCode));
    }
  }

  const nameCounts = {};
  for (const e of emps) {
    if (e.name) {
      nameCounts[e.name] = (nameCounts[e.name] || 0) + 1;
    }
  }
  const dupNames = Object.entries(nameCounts).filter(([_, c]) => c > 1).length;

  return {
    totalRecords: total,
    totalColumns: allKeys.length,
    missingValues: missingCount,
    missingHq,
    missingState,
    missingDsgn,
    duplicateEmpCodes: dupCodes.size,
    duplicateNames: dupNames,
    lastRefresh: lastRefreshTime,
    columnKeys: allKeys,
  };
}

function getTreemapData(filters = {}) {
  const emps = getEmployees(filters);
  const groups = {};

  for (const e of emps) {
    const state = normalizeDisplayValue(e.state || 'Unknown');
    const hq = normalizeDisplayValue(e.hq || 'Unknown');
    const key = `${state}||${hq}`;
    if (!groups[key]) groups[key] = { state, hq, count: 0, vacant: 0 };
    groups[key].count++;
    if (e.dsgn === 'ABOLISHED' || !e.name) groups[key].vacant++;
  }

  return Object.values(groups).map(g => ({
    name: g.hq,
    parent: g.state,
    value: g.count,
    vacancyPct: g.count > 0 ? Math.round((g.vacant / g.count) * 10000) / 100 : 0,
  }));
}

function getVerifyRecords(search) {
  if (!search) return [];
  const q = String(search).toLowerCase();
  const emps = loadExcel().employees;
  const results = [];

  for (const e of emps) {
    if (!e.name) continue;
    let matched = false;
    const matches = {};
    for (const [k, v] of Object.entries(e)) {
      if (v !== null && String(v).toLowerCase().includes(q)) {
        matched = true;
        matches[k] = true;
      }
    }
    if (matched) {
      results.push({ record: e, matchedFields: Object.keys(matches) });
      if (results.length >= 50) break;
    }
  }
  return results;
}

function getDynamicFilters() {
  const data = loadExcel();
  const emps = data.employees;
  const filterDefs = [];

  const hierarchyFields = ['division', 'zone', 'state', 'hq', 'dsgn'];
  for (const key of hierarchyFields) {
    if (!data.columnKeys.includes(key)) continue;
    const valMap = new Map(); // normalized lowercase -> normalized display value
    for (const e of emps) {
      if (e[key]) {
        const normalized = normalizeDisplayValue(String(e[key]).trim());
        const lower = normalized.toLowerCase();
        valMap.set(lower, normalized);
      }
    }
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    filterDefs.push({ key, label, options: [...valMap.values()].sort() });
  }

  const extraCols = data.columnKeys.filter(k =>
    !hierarchyFields.includes(k) &&
    !['name', 'empcode', 'doj', 'ageinorg', 'division', 'zone', 'state', 'hq', 'dsgn', 'merge', 'hqsystem', 'state2', 'divisiongroup', 'hqwisegroup', 'designation', 'code'].includes(k)
  );

  for (const col of extraCols) {
    const valMap = new Map();
    for (const e of emps) {
      if (e[col]) {
        const normalized = normalizeDisplayValue(String(e[col]).trim());
        valMap.set(normalized.toLowerCase(), normalized);
      }
      if (valMap.size > 100) break;
    }
    if (valMap.size > 0 && valMap.size <= 100) {
      filterDefs.push({ key: col, label: col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), options: [...valMap.values()].sort(), dynamic: true });
    }
  }

  return filterDefs;
}

function getDrillDownRecords(level, value, filters = {}) {
  const combinedFilters = { ...filters, [level]: value };
  return getEmployees(combinedFilters);
}

function getSalesMetrics(filters = {}) {
  const emps = getEmployees(filters);
  const toNum = (v) => { const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; };

  let totalTarget = 0;
  let totalNetSales = 0;
  let totalGrossSales = 0;
  let totalSecSales = 0;
  let totalTargetCount = 0;
  let totalSalesCount = 0;
  const growthValues = [];
  const coverageValues = [];
  const achValues = [];
  let bmCount = 0;
  let rmCount = 0;
  let smCount = 0;
  let zmCount = 0;
  let nsmCount = 0;
  const hqSet = new Set();
  const hrsValues = [];
  const invDaysValues = [];

  for (const e of emps) {
    if (e.dsgn === 'ABOLISHED' || !e.name || String(e.name).trim() === 'Vacant' || String(e.name).trim() === 'VACANT') continue;

    const tgt = toNum(e.apr_26_tgt);
    if (tgt > 0) { totalTarget += tgt; totalTargetCount++; }

    const ns = toNum(e.net_sale_apr_26);
    if (ns > 0) { totalNetSales += ns; totalSalesCount++; }

    const gs = toNum(e.gross_sale_apr26);
    if (gs > 0) totalGrossSales += gs;

    const ss = toNum(e.apr26_sec_sales);
    if (ss > 0) totalSecSales += ss;

    const gr = toNum(e.growth);
    if (gr !== 0 || (e.growth && String(e.growth).trim() !== '')) growthValues.push(gr);

    const cov = toNum(e.april26_cov);
    if (cov !== 0 || (e.april26_cov && String(e.april26_cov).trim() !== '')) coverageValues.push(cov);

    const ach = toNum(e.apr_ach);
    if (ach !== 0 || (e.apr_ach && String(e.apr_ach).trim() !== '')) achValues.push(ach);

    if (e.dsgn === 'BM') bmCount++;
    if (e.dsgn === 'RM') rmCount++;
    if (e.dsgn === 'SM') smCount++;
    if (e.dsgn === 'ZM') zmCount++;
    if (e.dsgn === 'NSM') nsmCount++;
    if (e.hq) hqSet.add(normalizeDisplayValue(e.hq));


    const hrs = toNum(e.april26_avg_working_hrs);
    if (hrs > 0) hrsValues.push(hrs);

    const inv = toNum(e.apr26_inv_days);
    if (inv > 0) invDaysValues.push(inv);
  }

  const achievementPct = totalTarget > 0 ? Math.round((totalNetSales / totalTarget) * 10000) / 100 : 0;
  const avgGrowth = growthValues.length > 0
    ? Math.round((growthValues.reduce((a, b) => a + b, 0) / growthValues.length) * 10000) / 100
    : 0;
  const avgCoverage = coverageValues.length > 0
    ? Math.round((coverageValues.reduce((a, b) => a + b, 0) / coverageValues.length) * 10000) / 100
    : 0;
  const avgAchievement = achValues.length > 0
    ? Math.round((achValues.reduce((a, b) => a + b, 0) / achValues.length) * 10000) / 100
    : 0;

  const avgWorkingHrs = hrsValues.length > 0
    ? Math.round((hrsValues.reduce((a, b) => a + b, 0) / hrsValues.length) * 100) / 100
    : 0;
  const avgInventoryDays = invDaysValues.length > 0
    ? Math.round((invDaysValues.reduce((a, b) => a + b, 0) / invDaysValues.length) * 100) / 100
    : 0;

  return {
    totalTarget: Math.round(totalTarget),
    totalNetSales: Math.round(totalNetSales),
    totalGrossSales: Math.round(totalGrossSales),
    totalSecondarySales: Math.round(totalSecSales),
    achievementPct,
    avgGrowth,
    avgAchievement,
    avgCoverage,
    avgWorkingHrs,
    avgInventoryDays,
    bmCount,
    rmCount,
    smCount,
    zmCount,
    nsmCount,
    hqCount: hqSet.size,
    totalEmployees: emps.length,
    employeesWithTarget: totalTargetCount,
    employeesWithSales: totalSalesCount,
  };
}

module.exports = {
  loadExcel,
  getEmployees,
  getKPI,
  getSalesMetrics,
  getHierarchyTree,
  getDataQuality,
  getTreemapData,
  getVerifyRecords,
  getDynamicFilters,
  getDrillDownRecords,
    getDesignationDistribution: (filters = {}) => {
      const emps = getEmployees(filters);
      const counts = {};
      for (const e of emps) {
        const k = normalizeDisplayValue(e.dsgn || e.designation || 'Unknown');
        counts[k] = (counts[k] || 0) + 1;
      }
      return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    },
  getHiringTrend: (period = 'monthly', filters = {}) => {
    const emps = getEmployees(filters);
    const trends = {};
    for (const e of emps) {
      if (!e.doj) continue;
      try {
        const d = new Date(e.doj);
        if (isNaN(d.getTime())) continue;
        let key;
        if (period === 'yearly') key = String(d.getFullYear());
        else if (period === 'quarterly') key = `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
        else key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        trends[key] = (trends[key] || 0) + 1;
      } catch { }
    }
    return Object.entries(trends).map(([period, count]) => ({ period, count })).sort((a, b) => a.period.localeCompare(b.period));
  },
  getVacancyByDimension: (dimension, filters = {}) => {
      const emps = getEmployees(filters);
      const groups = {};
      for (const e of emps) {
        const key = normalizeDisplayValue(e[dimension] || 'Unknown');
        if (!groups[key]) groups[key] = { name: key, total: 0, filled: 0, vacant: 0 };
      groups[key].total++;
      if (e.dsgn !== 'ABOLISHED' && e.name) groups[key].filled++;
      else groups[key].vacant++;
    }
    return Object.values(groups).map(g => ({
      ...g,
      vacancyPct: g.total > 0 ? Math.round((g.vacant / g.total) * 10000) / 100 : 0,
      coveragePct: g.total > 0 ? Math.round((g.filled / g.total) * 10000) / 100 : 0,
    }));
  },
  getHeadcountByState: (filters = {}) => {
      const emps = getEmployees(filters);
      const groups = {};
      for (const e of emps) {
        const key = normalizeDisplayValue(e.state || 'Unknown');
        if (!groups[key]) groups[key] = { name: key, total: 0, filled: 0, vacant: 0 };
      groups[key].total++;
      if (e.dsgn !== 'ABOLISHED' && e.name) groups[key].filled++;
      else groups[key].vacant++;
    }
    return Object.values(groups);
  },
  getAllColumns: () => {
    const data = loadExcel();
    return {
      columns: data.columnKeys,
      rawHeaders: data.columns,
      columnMap: data.columnMap,
      count: data.columnKeys.length,
    };
  },
  getAllColumnValues: (colName, filters = {}) => {
    const data = loadExcel();

    let resolvedKey = colName;
    const mapping = data.columnMap.find(m => m.safeKey === colName);
    if (mapping) {
      resolvedKey = mapping.safeKey;
    } else if (data.columns.includes(colName)) {
      const idx = data.columns.indexOf(colName);
      resolvedKey = data.columnKeys[idx];
    } else {
      return {
        success: false,
        column: colName,
        availableColumns: data.columnMap,
      };
    }

    const emps = getEmployees(filters);
    const vals = {};
    for (const e of emps) {
      const v = e[resolvedKey];
      if (v !== null && v !== undefined) vals[v] = (vals[v] || 0) + 1;
    }
    const result = Object.entries(vals).map(([value, count]) => ({ value, count }));
    return result;
  },
  getBMData: (filters = {}) => {
      const emps = getEmployees(filters);
      const bm = emps.filter(e => e.dsgn === 'BM');
      const byHq = {};
      for (const e of bm) {
        const hq = normalizeDisplayValue(e.hq || 'Unknown');
        if (!byHq[hq]) byHq[hq] = { name: hq, count: 0, vacant: 0, employees: [] };
      byHq[hq].count++;
      byHq[hq].employees.push(e);
      if (e.dsgn === 'ABOLISHED') byHq[hq].vacant++;
    }
    return {
      total: bm.length,
      byHq: Object.values(byHq).sort((a, b) => b.count - a.count),
    };
  },
  getRMData: (filters = {}) => {
      const emps = getEmployees(filters);
      const rm = emps.filter(e => e.dsgn === 'RM');
      const byHq = {};
      for (const e of rm) {
        const hq = normalizeDisplayValue(e.hq || 'Unknown');
        if (!byHq[hq]) byHq[hq] = { name: hq, count: 0, vacant: 0, employees: [] };
      byHq[hq].count++;
      byHq[hq].employees.push(e);
      if (e.dsgn === 'ABOLISHED') byHq[hq].vacant++;
    }
    return {
      total: rm.length,
      byHq: Object.values(byHq).sort((a, b) => b.count - a.count),
    };
  },
  getTeamTrend: (filters = {}) => {
    const emps = getEmployees(filters);
    const bmTrend = {};
    const rmTrend = {};
    for (const e of emps) {
      if (!e.doj) continue;
      try {
        const d = new Date(e.doj);
        if (isNaN(d.getTime())) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (e.dsgn === 'BM') bmTrend[key] = (bmTrend[key] || 0) + 1;
        if (e.dsgn === 'RM') rmTrend[key] = (rmTrend[key] || 0) + 1;
      } catch { }
    }
    const allPeriods = new Set([...Object.keys(bmTrend), ...Object.keys(rmTrend)]);
    return [...allPeriods].sort().map(period => ({
      period,
      bm: bmTrend[period] || 0,
      rm: rmTrend[period] || 0,
    }));
  },
  getSalesHierarchy: (filters = {}) => {
    const emps = getEmployees(filters);
    const active = emps.filter(e => e.dsgn !== 'ABOLISHED' && e.name && String(e.name).trim() !== 'Vacant' && String(e.name).trim() !== 'VACANT');
    const toNum = (v) => { const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; };

    const HIERARCHY_LEVELS = ['BU HEAD', 'NSM', 'ZM', 'SM', 'RM', 'BM', 'EMPLOYEE'];
    const ROLE_LABELS = {
      'BU HEAD': 'BU Head', NSM: 'NSM', ZM: 'ZM', SM: 'SM', RM: 'RM', BM: 'BM', EMPLOYEE: 'Employee',
    };

    const orgTotalRevenue = active.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);

    function countRisks(empList) {
      let negGrowth = 0, lowAch = 0, covRisk = 0, revenueAtRisk = 0;
      for (const e of empList) {
        const rev = toNum(e.net_sale_apr_26);
        const ach = toNum(e.apr_ach);
        const gr = toNum(e.growth);
        const cov = toNum(e.april26_cov);
        let atRisk = false;
        if (gr < 0) { negGrowth++; atRisk = true; }
        if (ach > 0 && ach < 0.8) { lowAch++; atRisk = true; }
        if (cov > 0 && cov < 0.6) { covRisk++; atRisk = true; }
        if (atRisk) revenueAtRisk += rev;
      }
      return { negGrowth, lowAch, covRisk, revenueAtRisk };
    }

    function buildNode(role, parentEmp, allEmps, assignedKeys) {
      const roleEmps = allEmps.filter(e => {
        const dsgn = String(e.dsgn || '').trim().toUpperCase();
        if (dsgn !== role) return false;
        const key = String(e.empCode || e.empcode || '') + '|' + String(e.name || '');
        if (assignedKeys.has(key)) return false;
        if (parentEmp) {
          if (role === 'NSM') {
            return String(e.division || '').toLowerCase() === String(parentEmp.division || '').toLowerCase();
          }
          if (role === 'ZM') {
            return String(e.zone || '').toLowerCase() === String(parentEmp.zone || '').toLowerCase();
          }
          if (role === 'SM') {
            return String(e.state || '').toLowerCase() === String(parentEmp.state || '').toLowerCase()
              && String(e.zone || '').toLowerCase() === String(parentEmp.zone || '').toLowerCase();
          }
          if (role === 'RM') {
            return String(e.state || '').toLowerCase() === String(parentEmp.state || '').toLowerCase()
              && String(e.zone || '').toLowerCase() === String(parentEmp.zone || '').toLowerCase();
          }
          if (role === 'BM') {
            return String(e.hq || '').toLowerCase() === String(parentEmp.hq || '').toLowerCase()
              && String(e.state || '').toLowerCase() === String(parentEmp.state || '').toLowerCase();
          }
        }
        return true;
      });

      const uniqueEmps = [];
      const seen = new Set();
      for (const e of roleEmps) {
        const key = String(e.empCode || e.empcode || '') + '|' + String(e.name || '');
        if (!seen.has(key)) {
          seen.add(key);
          uniqueEmps.push(e);
        }
      }

      return uniqueEmps.map(e => {
        const key = String(e.empCode || e.empcode || '') + '|' + String(e.name || '');
        assignedKeys.add(key);

        const roleIdx = HIERARCHY_LEVELS.indexOf(role);
        const nextRole = roleIdx < HIERARCHY_LEVELS.length - 1 ? HIERARCHY_LEVELS[roleIdx + 1] : null;
        let children = nextRole && nextRole !== 'EMPLOYEE' ? buildNode(nextRole, e, allEmps, assignedKeys) : [];

        const revenue = toNum(e.net_sale_apr_26);
        const target = toNum(e.apr_26_tgt);
        const achievement = toNum(e.apr_ach);
        const growth = toNum(e.growth);
        const coverage = toNum(e.april26_cov);

        if (role === 'BM') {
          children = [{
            name: e.name || 'Unknown',
            empCode: String(e.empCode || e.empcode || ''),
            designation: 'Employee',
            zone: normalizeDisplayValue(e.zone || ''),
            state: normalizeDisplayValue(e.state || ''),
            hq: normalizeDisplayValue(e.hq || ''),
            division: normalizeDisplayValue(e.division || ''),
            revenue,
            target,
            achievement,
            growth,
            coverage,
            childCount: 0,
            directReports: 0,
            totalRevenue: revenue,
            totalTarget: target,
            totalCount: 1,
            teamSize: 1,
            contributionPct: orgTotalRevenue > 0 ? Math.round((revenue / orgTotalRevenue) * 10000) / 100 : 0,
            revenueAtRisk: countRisks([e]).revenueAtRisk,
            negativeGrowthCount: toNum(e.growth) < 0 ? 1 : 0,
            lowAchievementCount: achievement > 0 && achievement < 0.8 ? 1 : 0,
            coverageRiskCount: coverage > 0 && coverage < 0.6 ? 1 : 0,
            avgAchievement: achievement,
            avgGrowth: growth,
            avgCoverage: coverage,
            positiveIndicators: [
              ...(achievement >= 0.9 ? ['High Achievement'] : []),
              ...(growth > 0.1 ? ['Strong Growth'] : []),
              ...(coverage >= 0.8 ? ['High Coverage'] : []),
            ],
            negativeIndicators: [
              ...(achievement > 0 && achievement < 0.8 ? ['Low Achievement'] : []),
              ...(growth < 0 ? ['Negative Growth'] : []),
              ...(coverage > 0 && coverage < 0.6 ? ['Coverage Risk'] : []),
            ],
            children: [],
          }];
        }

        const totalChildRevenue = children.reduce((s, c) => s + (c.totalRevenue || 0), 0);
        const totalChildTarget = children.reduce((s, c) => s + (c.totalTarget || 0), 0);
        const totalChildCount = children.reduce((s, c) => s + (c.totalCount || 0), 0);
        const totalRevenue = revenue + totalChildRevenue;
        const totalTarget = target + totalChildTarget;

        const subtreeEmps = [e];
        function collectEmps(nodes) {
          for (const c of nodes) {
            if (c._sourceEmp) subtreeEmps.push(c._sourceEmp);
            collectEmps(c.children || []);
          }
        }
        collectEmps(children);

        const risks = countRisks(subtreeEmps);
        const childNeg = children.reduce((s, c) => s + (c.negativeGrowthCount || 0), 0);
        const childLow = children.reduce((s, c) => s + (c.lowAchievementCount || 0), 0);
        const childCov = children.reduce((s, c) => s + (c.coverageRiskCount || 0), 0);
        const childRiskRev = children.reduce((s, c) => s + (c.revenueAtRisk || 0), 0);

        const negGrowthCount = risks.negGrowth + childNeg;
        const lowAchievementCount = risks.lowAch + childLow;
        const coverageRiskCount = risks.covRisk + childCov;
        const revenueAtRisk = risks.revenueAtRisk + childRiskRev;

        const covVals = subtreeEmps.map(x => toNum(x.april26_cov)).filter(v => v > 0);
        const avgCoverage = covVals.length > 0 ? covVals.reduce((a, b) => a + b, 0) / covVals.length : coverage;

        const childRevenues = children.map(c => ({ name: c.name, rev: c.totalRevenue || 0 }));
        const topContributor = childRevenues.length > 0 ? [...childRevenues].sort((a, b) => b.rev - a.rev)[0]?.name : undefined;
        const worstContributor = childRevenues.length > 0 ? [...childRevenues].sort((a, b) => a.rev - b.rev)[0]?.name : undefined;

        return {
          name: e.name || 'Unknown',
          empCode: String(e.empCode || e.empcode || ''),
          designation: ROLE_LABELS[role] || role,
          zone: normalizeDisplayValue(e.zone || ''),
          state: normalizeDisplayValue(e.state || ''),
          hq: normalizeDisplayValue(e.hq || ''),
          division: normalizeDisplayValue(e.division || ''),
          revenue,
          target,
          achievement,
          growth,
          coverage,
          childCount: children.length,
          directReports: children.length,
          totalRevenue,
          totalTarget,
          totalCount: role === 'BM' ? 1 + totalChildCount : 1 + totalChildCount,
          teamSize: role === 'BM' ? 1 + totalChildCount : 1 + totalChildCount,
          contributionPct: orgTotalRevenue > 0 ? Math.round((totalRevenue / orgTotalRevenue) * 10000) / 100 : 0,
          revenueAtRisk: Math.round(revenueAtRisk * 100) / 100,
          negativeGrowthCount: negGrowthCount,
          lowAchievementCount: lowAchievementCount,
          coverageRiskCount: coverageRiskCount,
          avgAchievement: children.length > 0
            ? (children.reduce((s, c) => s + (c.avgAchievement || 0), 0) + achievement) / (children.length + 1)
            : achievement,
          avgGrowth: children.length > 0
            ? (children.reduce((s, c) => s + (c.avgGrowth || 0), 0) + growth) / (children.length + 1)
            : growth,
          avgCoverage,
          positiveIndicators: [
            ...(achievement >= 0.9 ? ['High Achievement'] : []),
            ...(growth > 0.1 ? ['Strong Growth'] : []),
            ...(avgCoverage >= 0.8 ? ['High Coverage'] : []),
          ],
          negativeIndicators: [
            ...(lowAchievementCount > 0 ? [`${lowAchievementCount} Low Achievement`] : []),
            ...(negGrowthCount > 0 ? [`${negGrowthCount} Negative Growth`] : []),
            ...(coverageRiskCount > 0 ? [`${coverageRiskCount} Coverage Risk`] : []),
            ...(revenueAtRisk > 0 ? [`${Math.round(revenueAtRisk)} Revenue At Risk`] : []),
          ],
          topContributor,
          worstContributor,
          children,
        };
      }).sort((a, b) => b.totalRevenue - a.totalRevenue);
    }

    const tree = buildNode('BU HEAD', null, active, new Set());
    return tree;
  },
  getExecutiveInsights: (filters = {}) => {
    const emps = getEmployees(filters);
    const active = emps.filter(e => e.dsgn !== 'ABOLISHED' && e.name);
    const toNum = (v) => { const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; };

    const insights = [];

    const totalRev = active.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);
    const achVals = active.filter(e => toNum(e.apr_ach) > 0).map(e => toNum(e.apr_ach) * 100);
    const avgAch = achVals.length > 0 ? achVals.reduce((a, b) => a + b, 0) / achVals.length : 0;
    const grVals = active.filter(e => toNum(e.growth) !== 0).map(e => toNum(e.growth) * 100);
    const avgGr = grVals.length > 0 ? grVals.reduce((a, b) => a + b, 0) / grVals.length : 0;
    const covVals = active.filter(e => toNum(e.april26_cov) > 0).map(e => toNum(e.april26_cov) * 100);
    const avgCov = covVals.length > 0 ? covVals.reduce((a, b) => a + b, 0) / covVals.length : 0;

    if (avgAch >= 90) {
      insights.push({ type: 'positive', icon: '🎯', text: `Strong achievement at ${avgAch.toFixed(1)}% average across ${active.length} employees.` });
    } else if (avgAch >= 80) {
      insights.push({ type: 'neutral', icon: '📊', text: `Achievement is at ${avgAch.toFixed(1)}% — room for improvement towards 100%.` });
    } else {
      insights.push({ type: 'negative', icon: '⚠️', text: `Achievement is only at ${avgAch.toFixed(1)}% — immediate attention needed.` });
    }

    if (avgGr >= 10) {
      insights.push({ type: 'positive', icon: '📈', text: `Healthy growth at ${avgGr.toFixed(1)}% average.` });
    } else if (avgGr >= 0) {
      insights.push({ type: 'neutral', icon: '📊', text: `Growth is moderate at ${avgGr.toFixed(1)}% — focus on high-growth territories.` });
    } else {
      insights.push({ type: 'negative', icon: '📉', text: `Negative growth at ${avgGr.toFixed(1)}% — strategic intervention required.` });
    }

    const negGrowth = active.filter(e => toNum(e.growth) < 0);
    if (negGrowth.length > 0) {
      const negZones = {};
      for (const e of negGrowth) {
        const z = normalizeDisplayValue(e.zone || 'Unknown');
        negZones[z] = (negZones[z] || 0) + 1;
      }
      const topZone = Object.entries(negZones).sort((a, b) => b[1] - a[1])[0];
      if (topZone) {
        insights.push({ type: 'negative', icon: '🔴', text: `${negGrowth.length} employees in negative growth. Concentrated in ${topZone[0]} Zone (${topZone[1]} employees).` });
      }
    }

    const lowAchBms = active.filter(e => e.dsgn === 'BM' && toNum(e.apr_ach) > 0 && toNum(e.apr_ach) * 100 < 80);
    if (lowAchBms.length > 0) {
      const lowAchRev = lowAchBms.reduce((s, e) => s + toNum(e.net_sale_apr_26), 0);
      insights.push({ type: 'negative', icon: '🚨', text: `${lowAchBms.length} BMs below 80% achievement, impacting ${totalRev > 0 ? ((lowAchRev / totalRev) * 100).toFixed(1) : 0}% of revenue.` });
    }

    const topRms = active.filter(e => e.dsgn === 'RM' && e.name && e.name !== 'Vacant' && e.name !== 'VACANT' && toNum(e.apr_ach) > 0).sort((a, b) => toNum(b.apr_ach) - toNum(a.apr_ach)).slice(0, 3);
    if (topRms.length > 0) {
      insights.push({ type: 'positive', icon: '🏆', text: `Top RMs: ${topRms.map(r => `${r.name} (${(toNum(r.apr_ach) * 100).toFixed(1)}%)`).join(', ')}.` });
    }

    const topBms = active.filter(e => e.dsgn === 'BM' && e.name && e.name !== 'Vacant' && e.name !== 'VACANT' && toNum(e.net_sale_apr_26) > 0).sort((a, b) => toNum(b.net_sale_apr_26) - toNum(a.net_sale_apr_26)).slice(0, 3);
    if (topBms.length > 0) {
      insights.push({ type: 'positive', icon: '💰', text: `Top revenue BMs: ${topBms.map(r => `${r.name} (${normalizeDisplayValue(r.hq || '')})`).join(', ')}.` });
    }

    if (avgCov < 60) {
      insights.push({ type: 'negative', icon: '🏥', text: `Low average coverage at ${avgCov.toFixed(1)}% — doctor coverage needs improvement.` });
    } else if (avgCov >= 60 && avgCov < 80) {
      insights.push({ type: 'neutral', icon: '🏥', text: `Coverage at ${avgCov.toFixed(1)}% — moderate, consider pushing towards 80%+.` });
    }

    const stateGroups = {};
    for (const e of active) {
      const s = normalizeDisplayValue(e.state || 'Unknown');
      if (!stateGroups[s]) stateGroups[s] = { rev: 0, count: 0 };
      stateGroups[s].rev += toNum(e.net_sale_apr_26);
      stateGroups[s].count++;
    }
    const topState = Object.entries(stateGroups).sort((a, b) => b[1].rev - a[1].rev)[0];
    if (topState && totalRev > 0) {
      const pct = (topState[1].rev / totalRev * 100).toFixed(1);
      insights.push({ type: 'neutral', icon: '🗺️', text: `${topState[0]} leads with ${pct}% of total revenue (${topState[1].count} employees).` });
    }

    return insights;
  },
  reloadExcel: () => {
    cache = null;
    lastLoaded = null;
    return loadExcel();
  },
};
