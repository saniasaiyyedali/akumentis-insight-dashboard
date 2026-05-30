import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { workforceAPI } from '../services/workforce';

export interface Employee {
  [key: string]: unknown;
  division?: string | null;
  zone?: string | null;
  state?: string | null;
  hq?: string | null;
  dsgn?: string | null;
  name?: string | null;
  empCode?: string | null;
  designation?: string | null;
  doj?: string | null;
}

export interface KPI {
  totalPositions: number;
  filledPositions: number;
  vacancies: number;
  vacancyPct: number;
  activeEmployees: number;
  totalDivisions: number;
  totalZones: number;
  totalStates: number;
  totalHQs: number;
}

export interface SalesKPI {
  totalTarget: number;
  totalNetSales: number;
  totalGrossSales: number;
  totalSecondarySales: number;
  achievementPct: number;
  avgGrowth: number;
  avgAchievement: number;
  avgCoverage: number;
  avgWorkingHrs: number;
  avgInventoryDays: number;
  bmCount: number;
  rmCount: number;
  smCount: number;
  zmCount: number;
  nsmCount: number;
  hqCount: number;
  totalEmployees: number;
  employeesWithTarget: number;
  employeesWithSales: number;
}

export interface DynamicFilter {
  key: string;
  label: string;
  options: string[];
  dynamic?: boolean;
}

export interface DataQuality {
  totalRecords: number;
  totalColumns: number;
  missingValues: number;
  missingHq: number;
  missingState: number;
  missingDsgn: number;
  duplicateEmpCodes: number;
  duplicateNames: number;
  lastRefresh: string;
  columnKeys: string[];
}

export interface TreemapItem {
  name: string;
  parent: string;
  value: number;
  vacancyPct: number;
}

export interface BMData {
  total: number;
  byHq: { name: string; count: number; vacant: number; employees: Employee[] }[];
}

export interface RMData {
  total: number;
  byHq: { name: string; count: number; vacant: number; employees: Employee[] }[];
}

export interface TeamTrendItem {
  period: string;
  bm: number;
  rm: number;
}

export interface HierarchyNode {
  name: string;
  empCode: string;
  designation: string;
  zone: string;
  state: string;
  hq: string;
  division: string;
  revenue: number;
  target?: number;
  achievement: number;
  growth: number;
  coverage: number;
  childCount: number;
  directReports?: number;
  totalRevenue: number;
  totalTarget?: number;
  totalCount: number;
  teamSize?: number;
  contributionPct?: number;
  revenueAtRisk?: number;
  negativeGrowthCount?: number;
  lowAchievementCount?: number;
  coverageRiskCount?: number;
  avgAchievement: number;
  avgGrowth: number;
  avgCoverage?: number;
  positiveIndicators?: string[];
  negativeIndicators?: string[];
  topContributor?: string;
  worstContributor?: string;
  children: HierarchyNode[];
}

export interface Insight {
  type: 'positive' | 'negative' | 'neutral';
  icon: string;
  text: string;
}

interface Breadcrumb {
  label: string;
  level: string;
  value: string;
}

interface DrawerRecord {
  employee: Employee;
  visible: boolean;
}

interface DrillDownData {
  records: Employee[];
  label: string;
}

interface HierarchyDrillDownData {
  records: Employee[];
  label: string;
}

interface DrilldownPanelData {
  records: Employee[];
  label: string;
}

interface LoadingState {
  kpi: boolean;
  salesKpi: boolean;
  employees: boolean;
  hierarchy: boolean;
  dataQuality: boolean;
  treemap: boolean;
  filters: boolean;
  designations: boolean;
  hiring: boolean;
  states: boolean;
  columns: boolean;
  bm: boolean;
  rm: boolean;
  teamTrend: boolean;
}

interface WorkforceContextType {
  employees: Employee[];
  kpi: KPI | null;
  salesKpi: SalesKPI | null;
  dataQuality: DataQuality | null;
  treemapData: TreemapItem[];
  dynamicFilters: DynamicFilter[];
  hierarchy: unknown;
  loading: boolean;
  loadingState: LoadingState;
  error: string | null;
  searchQuery: string;
  filters: Record<string, string>;
  breadcrumbs: Breadcrumb[];
  activeNode: { level: string; value: string } | null;
  designations: { name: string; value: number }[];
  hiringTrend: { period: string; count: number }[];
  hiringPeriod: string;
  stateData: { name: string; total: number; filled: number; vacant: number }[];
  allColumns: string[];
  rawHeaders: string[];
  columnMap: Array<{ originalName: string; safeKey: string }>;
  drawerRecord: DrawerRecord;
  drillDown: DrillDownData | null;
  hierarchyDrillDown: HierarchyDrillDownData | null;
  verifyResults: { record: Employee; matchedFields: string[] }[];
  verifyLoading: boolean;
  lastRefresh: string;
  bmData: BMData | null;
  rmData: RMData | null;
  teamTrend: TeamTrendItem[];
  salesHierarchy: HierarchyNode[];
  executiveInsights: Insight[];
  setSearchQuery: (q: string) => void;
  setFilter: (key: string, value: string) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  setActiveNode: (level: string, value: string) => void;
  clearActiveNode: () => void;
  navigateBreadcrumb: (index: number) => void;
  openDrawer: (employee: Employee) => void;
  closeDrawer: () => void;
  showDrillDown: (records: Employee[], label: string) => void;
  closeDrillDown: () => void;
  showHierarchyDrillDown: (records: Employee[], label: string) => void;
  closeHierarchyDrillDown: () => void;
  drilldownPanel: DrilldownPanelData | null;
  showDrilldownPanel: (records: Employee[], label: string) => void;
  closeDrilldownPanel: () => void;
  comparisonPanel: boolean;
  openComparisonPanel: () => void;
  closeComparisonPanel: () => void;
  runVerify: (search: string) => void;
  refreshData: () => void;
  setHiringPeriod: (period: string) => void;
  drilldownTo: (filterFn: (emp: Employee) => boolean, label: string, level?: string, value?: string) => void;
}

const WorkforceContext = createContext<WorkforceContextType | undefined>(undefined);

const LOADING_INIT: LoadingState = {
  kpi: true, salesKpi: true, employees: true, hierarchy: true, dataQuality: true,
  treemap: true, filters: true, designations: true, hiring: true,
  states: true, columns: true, bm: true, rm: true, teamTrend: true,
};

const STORAGE_KEY_FILTERS = 'akumentis_filters';
const STORAGE_KEY_SEARCH = 'akumentis_search';

function loadSavedFilters(): { filters: Record<string, string>; search: string } {
  try {
    const f = localStorage.getItem(STORAGE_KEY_FILTERS);
    const s = localStorage.getItem(STORAGE_KEY_SEARCH);
    return {
      filters: f ? JSON.parse(f) : {},
      search: s || '',
    };
  } catch {
    return { filters: {}, search: '' };
  }
}

async function safeFetch<T>(fetcher: () => Promise<{ data: T }>, onFinally?: () => void): Promise<T | null> {
  try {
    const res = await fetcher();
    return res.data;
  } catch {
    return null;
  } finally {
    if (onFinally) onFinally();
  }
}

export function WorkforceProvider({ children }: { children: ReactNode }) {
  const saved = loadSavedFilters();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [kpi, setKPI] = useState<KPI | null>(null);
  const [salesKpi, setSalesKPI] = useState<SalesKPI | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQuality | null>(null);
  const [treemapData, setTreemapData] = useState<TreemapItem[]>([]);
  const [dynamicFilters, setDynamicFilters] = useState<DynamicFilter[]>([]);
  const [hierarchy, setHierarchy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingState, setLoadingState] = useState<LoadingState>(LOADING_INIT);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQueryRaw] = useState(saved.search);
  const [filters, setFilters] = useState<Record<string, string>>(saved.filters);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [activeNode, setActiveNodeState] = useState<{ level: string; value: string } | null>(null);
  const [designations, setDesignations] = useState<{ name: string; value: number }[]>([]);
  const [hiringTrend, setHiringTrend] = useState<{ period: string; count: number }[]>([]);
  const [hiringPeriod, setHiringPeriod] = useState('monthly');
  const [stateData, setStateData] = useState<{ name: string; total: number; filled: number; vacant: number }[]>([]);
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Array<{ originalName: string; safeKey: string }>>([]);
  const [drawerRecord, setDrawerRecord] = useState<DrawerRecord>({ employee: {} as Employee, visible: false });
  const [drillDown, setDrillDown] = useState<DrillDownData | null>(null);
  const [hierarchyDrillDown, setHierarchyDrillDown] = useState<HierarchyDrillDownData | null>(null);
  const [drilldownPanel, setDrilldownPanel] = useState<DrilldownPanelData | null>(null);
  const [comparisonPanel, setComparisonPanel] = useState(false);
  const [verifyResults, setVerifyResults] = useState<{ record: Employee; matchedFields: string[] }[]>([]);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState('');
  const [bmData, setBmData] = useState<BMData | null>(null);
  const [rmData, setRmData] = useState<RMData | null>(null);
  const [teamTrend, setTeamTrend] = useState<TeamTrendItem[]>([]);
  const [salesHierarchy, setSalesHierarchy] = useState<HierarchyNode[]>([]);
  const [executiveInsights, setExecutiveInsights] = useState<Insight[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filters)); } catch {}
  }, [filters]);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_SEARCH, searchQuery); } catch {}
  }, [searchQuery]);

  const setSearchQuery = useCallback((q: string) => {
    setSearchQueryRaw(q);
  }, []);

  const UI_ONLY_FILTERS = new Set(['ach_slab', 'growth_slab', 'dr_coverage', 'chem_coverage', 'stock_cov', 'inv_days', 'work_hrs']);

  const buildParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (searchQuery) params.search = searchQuery;
    for (const [key, val] of Object.entries(filters)) {
      if (val && val !== 'all' && !UI_ONLY_FILTERS.has(key)) params[key] = val;
    }
    if (activeNode) params[activeNode.level] = activeNode.value;
    return params;
  }, [searchQuery, filters, activeNode]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingState(LOADING_INIT);
    const params = buildParams();

    const markDone = (s: keyof LoadingState) => () => {
      setLoadingState(prev => ({ ...prev, [s]: false }));
    };

    try {
      const results = await Promise.allSettled([
        safeFetch(() => workforceAPI.getKPI(params), markDone('kpi')).then(d => { if (d) setKPI(d as KPI); }),
        safeFetch(() => workforceAPI.getSalesKPI(params), markDone('salesKpi')).then(d => { if (d) setSalesKPI(d as SalesKPI); }),
        safeFetch(() => workforceAPI.getEmployees(params), markDone('employees')).then(d => { if (d) setEmployees(d as Employee[]); }),
        safeFetch(() => workforceAPI.getHierarchy(params), markDone('hierarchy')).then(d => { if (d) setHierarchy(d); }),
        safeFetch(() => workforceAPI.getDataQuality(), markDone('dataQuality')).then(d => { if (d) { setDataQuality(d as DataQuality); if ((d as DataQuality).lastRefresh) setLastRefresh((d as DataQuality).lastRefresh); } }),
        safeFetch(() => workforceAPI.getTreemap(params), markDone('treemap')).then(d => { if (d) setTreemapData(d as TreemapItem[]); }),
        safeFetch(() => workforceAPI.getDynamicFilters(), markDone('filters')).then(d => { if (d) setDynamicFilters(d as DynamicFilter[]); }),
        safeFetch(() => workforceAPI.getDesignations(params), markDone('designations')).then(d => { if (d) setDesignations(d as { name: string; value: number }[]); }),
        safeFetch(() => workforceAPI.getHiringTrend(hiringPeriod, params), markDone('hiring')).then(d => { if (d) setHiringTrend(d as { period: string; count: number }[]); }),
        safeFetch(() => workforceAPI.getStates(params), markDone('states')).then(d => { if (d) setStateData(d as { name: string; total: number; filled: number; vacant: number }[]); }),
        safeFetch(() => workforceAPI.getColumns(), markDone('columns')).then(d => {
          if (d) {
            const colData = d as Record<string, unknown>;
            if (Array.isArray(d)) {
              setAllColumns(d as string[]);
              setRawHeaders(d as string[]);
              setColumnMap([]);
            } else if (colData.columns) {
              setAllColumns(colData.columns as string[]);
              setRawHeaders((colData.rawHeaders as string[]) || []);
              setColumnMap((colData.columnMap as Array<{ originalName: string; safeKey: string }>) || []);
            }
          }
        }),
        safeFetch(() => workforceAPI.getBMData(params), markDone('bm')).then(d => { if (d) setBmData(d as BMData); }),
        safeFetch(() => workforceAPI.getRMData(params), markDone('rm')).then(d => { if (d) setRmData(d as RMData); }),
        safeFetch(() => workforceAPI.getTeamTrend(params), markDone('teamTrend')).then(d => { if (d) setTeamTrend(d as TeamTrendItem[]); }),
        safeFetch(() => workforceAPI.getSalesHierarchy(params), markDone('teamTrend')).then(d => { if (d) setSalesHierarchy(d as HierarchyNode[]); }),
        safeFetch(() => workforceAPI.getExecutiveInsights(params), markDone('teamTrend')).then(d => { if (d) setExecutiveInsights(d as Insight[]); }),
      ]);

      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        /* silently handle failed API calls */
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load workforce data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [buildParams, hiringPeriod]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchAll();
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
  }, []);

  const setFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  const removeFilter = (key: string) => {
    setFilters(prev => { const n = { ...prev }; delete n[key]; return n; });
  };
  const clearFilters = () => {
    setFilters({});
    setSearchQueryRaw('');
    setActiveNodeState(null);
    setBreadcrumbs([]);
  };

  const setActiveNode = (level: string, value: string) => {
    setActiveNodeState({ level, value });
    setBreadcrumbs(prev => {
      const idx = prev.findIndex(b => b.level === level);
      if (idx !== -1) return prev.slice(0, idx + 1);
      return [...prev, { label: value, level, value }];
    });
  };

  const clearActiveNode = () => { setActiveNodeState(null); setBreadcrumbs([]); };
  const navigateBreadcrumb = (index: number) => {
    if (index < 0) { clearActiveNode(); return; }
    const crumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(crumbs);
    setActiveNodeState({ level: crumbs[crumbs.length - 1].level, value: crumbs[crumbs.length - 1].value });
  };

  const openDrawer = (employee: Employee) => setDrawerRecord({ employee, visible: true });
  const closeDrawer = () => setDrawerRecord({ employee: {} as Employee, visible: false });
  const showDrillDown = (records: Employee[], label: string) => setDrillDown({ records, label });
  const closeDrillDown = () => setDrillDown(null);
  const showHierarchyDrillDown = (records: Employee[], label: string) => setHierarchyDrillDown({ records, label });
  const closeHierarchyDrillDown = () => setHierarchyDrillDown(null);
  const showDrilldownPanel = (records: Employee[], label: string) => setDrilldownPanel({ records, label });
  const closeDrilldownPanel = () => setDrilldownPanel(null);
  const openComparisonPanel = () => setComparisonPanel(true);
  const closeComparisonPanel = () => setComparisonPanel(false);
  const drilldownTo = (filterFn: (emp: Employee) => boolean, label: string, level?: string, value?: string) => {
    const records = employees.filter(filterFn);
    if (records.length > 0) setDrillDown({ records, label });
    if (level && value) setActiveNode(level, value);
  };

  const runVerify = async (search: string) => {
    if (!search) { setVerifyResults([]); return; }
    setVerifyLoading(true);
    try {
      const res = await workforceAPI.getVerify(search);
      setVerifyResults(res.data);
    } catch {
      setVerifyResults([]);
    } finally {
      setVerifyLoading(false);
    }
  };

  const refreshData = () => fetchAll();

  return (
    <WorkforceContext.Provider
      value={{
        employees, kpi, salesKpi, dataQuality, treemapData, dynamicFilters, hierarchy,
        loading, loadingState, error,
        searchQuery, filters, breadcrumbs, activeNode,
        designations, hiringTrend, hiringPeriod, stateData, allColumns, rawHeaders, columnMap,
        drawerRecord, drillDown, hierarchyDrillDown, drilldownPanel, comparisonPanel, verifyResults, verifyLoading, lastRefresh,
        bmData, rmData, teamTrend, salesHierarchy, executiveInsights,
        setSearchQuery, setFilter, removeFilter, clearFilters,
        setActiveNode, clearActiveNode, navigateBreadcrumb,
        openDrawer, closeDrawer, showDrillDown, closeDrillDown, showHierarchyDrillDown, closeHierarchyDrillDown, showDrilldownPanel, closeDrilldownPanel, openComparisonPanel, closeComparisonPanel, drilldownTo,
        runVerify, refreshData,
        setHiringPeriod,
      }}
    >
      {children}
    </WorkforceContext.Provider>
  );
}

export function useWorkforce() {
  const ctx = useContext(WorkforceContext);
  if (!ctx) throw new Error('useWorkforce must be used within WorkforceProvider');
  return ctx;
}
