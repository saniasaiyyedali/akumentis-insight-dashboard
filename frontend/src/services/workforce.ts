import api from './api';

export const workforceAPI = {
  getKPI: (params?: Record<string, string>) => api.get('/workforce/kpi', { params }),
  getSalesKPI: (params?: Record<string, string>) => api.get('/workforce/sales-kpi', { params }),
  getHierarchy: (params?: Record<string, string>) => api.get('/workforce/hierarchy', { params }),
  getDataQuality: () => api.get('/workforce/data-quality'),
  getTreemap: (params?: Record<string, string>) => api.get('/workforce/treemap', { params }),
  getVerify: (search: string) => api.get('/workforce/verify', { params: { search } }),
  getDynamicFilters: () => api.get('/workforce/dynamic-filters'),
  getDrillDown: (level: string, value: string, params?: Record<string, string>) =>
    api.get(`/workforce/drilldown/${level}/${encodeURIComponent(value)}`, { params }),
  getVacancyByDimension: (dimension: string, params?: Record<string, string>) =>
    api.get(`/workforce/vacancy/${dimension}`, { params }),
  getDesignations: (params?: Record<string, string>) => api.get('/workforce/designations', { params }),
  getHiringTrend: (period: string, params?: Record<string, string>) =>
    api.get(`/workforce/hiring/${period}`, { params }),
  getStates: (params?: Record<string, string>) => api.get('/workforce/states', { params }),
  getEmployees: (params?: Record<string, string>) => api.get('/workforce/employees', { params }),
  getColumns: () => api.get('/workforce/columns'),
  getColumnValues: (column: string, params?: Record<string, string>) =>
    api.get('/workforce/column-values', { params: { ...params, column } }),
  getBMData: (params?: Record<string, string>) => api.get('/workforce/bm', { params }),
  getRMData: (params?: Record<string, string>) => api.get('/workforce/rm', { params }),
  getTeamTrend: (params?: Record<string, string>) => api.get('/workforce/team-trend', { params }),
  getSalesHierarchy: (params?: Record<string, string>) => api.get('/workforce/sales-hierarchy', { params }),
  getExecutiveInsights: (params?: Record<string, string>) => api.get('/workforce/executive-insights', { params }),

  // Sales OS APIs — backend-driven aggregations
  getOSSummary: (params?: Record<string, string>) => api.get('/workforce/os/summary', { params }),
  getOSHierarchyLevels: (params?: Record<string, string>) => api.get('/workforce/os/hierarchy-levels', { params }),
  getOSSegments: (params?: Record<string, string>) => api.get('/workforce/os/segments', { params }),
  getOSBreakdown: (params?: Record<string, string>) => api.get('/workforce/os/breakdown', { params }),
  getOSProfile: (type: string, id: string) => api.get(`/workforce/os/profile/${type}/${encodeURIComponent(id)}`),
  getOSLeakage: (params?: Record<string, string>) => api.get('/workforce/os/leakage', { params }),
  getOSOrgTree: (params?: Record<string, string>) => api.get('/workforce/os/org-tree', { params }),
  getOSCompare: (params?: Record<string, string>) => api.get('/workforce/os/compare', { params }),
  postOSAI: (query: string) => api.post('/workforce/os/ai', { query }),
  getOSPerformanceHub: (params?: Record<string, string>) => api.get('/workforce/os/performance-hub', { params }),
  getOSSegmentMembers: (params?: Record<string, string>) => api.get('/workforce/os/segment-members', { params }),
  getOSTopBottom: (params?: Record<string, string>) => api.get('/workforce/os/top-bottom', { params }),
  getOSLeakageOwnership: (params?: Record<string, string>) => api.get('/workforce/os/leakage-ownership', { params }),
  getOSOrgNode: (empCode: string) => api.get(`/workforce/os/org-node/${encodeURIComponent(empCode)}`),
  getOSOrgHealth: () => api.get('/workforce/os/org-health'),
  getOSOrgLevel: (params?: Record<string, string>) => api.get('/workforce/os/org-level', { params }),
  getOSOrgRegion: (params?: Record<string, string>) => api.get('/workforce/os/org-region', { params }),
  getOSOrgManager: (empCode: string) => api.get(`/workforce/os/org-manager/${encodeURIComponent(empCode)}`),
};
