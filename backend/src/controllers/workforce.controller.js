const excelService = require('../services/excelService');

module.exports = {
  getKPI: (req, res) => {
    try { res.json(excelService.getKPI(req.query)); }
    catch { res.status(500).json({ error: 'Failed to get KPIs.' }); }
  },
  getSalesKPI: (req, res) => {
    try { res.json(excelService.getSalesMetrics(req.query)); }
    catch (err) { res.status(500).json({ error: 'Failed to get sales KPIs.', detail: err.message }); }
  },
  getHierarchy: (req, res) => {
    try { res.json(excelService.getHierarchyTree(req.query)); }
    catch { res.status(500).json({ error: 'Failed to get hierarchy.' }); }
  },
  getDataQuality: (req, res) => {
    try { res.json(excelService.getDataQuality()); }
    catch { res.status(500).json({ error: 'Failed to get data quality.' }); }
  },
  getTreemap: (req, res) => {
    try { res.json(excelService.getTreemapData(req.query)); }
    catch { res.status(500).json({ error: 'Failed to get treemap data.' }); }
  },
  getVerify: (req, res) => {
    try {
      const { search } = req.query;
      res.json(excelService.getVerifyRecords(search));
    } catch { res.status(500).json({ error: 'Failed to verify.' }); }
  },
  getDynamicFilters: (req, res) => {
    try { res.json(excelService.getDynamicFilters()); }
    catch { res.status(500).json({ error: 'Failed to get filters.' }); }
  },
  getDrillDown: (req, res) => {
    try {
      const { level, value } = req.params;
      res.json(excelService.getDrillDownRecords(level, value, req.query));
    } catch { res.status(500).json({ error: 'Failed to get drill-down records.' }); }
  },
  getVacancyByDimension: (req, res) => {
    try { res.json(excelService.getVacancyByDimension(req.params.dimension, req.query)); }
    catch { res.status(500).json({ error: 'Failed to get vacancy data.' }); }
  },
  getDesignations: (req, res) => {
    try { res.json(excelService.getDesignationDistribution(req.query)); }
    catch { res.status(500).json({ error: 'Failed to get designations.' }); }
  },
  getHiringTrend: (req, res) => {
    try { res.json(excelService.getHiringTrend(req.params.period || 'monthly', req.query)); }
    catch { res.status(500).json({ error: 'Failed to get hiring trend.' }); }
  },
  getHeadcountByState: (req, res) => {
    try { res.json(excelService.getHeadcountByState(req.query)); }
    catch { res.status(500).json({ error: 'Failed to get state analysis.' }); }
  },
  getEmployees: (req, res) => {
    try { res.json(excelService.getEmployees(req.query)); }
    catch { res.status(500).json({ error: 'Failed to get employees.' }); }
  },
  getColumns: (req, res) => {
    try { res.json(excelService.getAllColumns()); }
    catch { res.status(500).json({ error: 'Failed to get columns.' }); }
  },
  getColumnValues: (req, res) => {
    try {
      const rawColumn = req.query.column;
      if (!rawColumn) {
        return res.status(400).json({ success: false, error: 'Missing ?column= query parameter' });
      }
      // Strip 'column' from filters so it doesn't leak into excelService filtering
      const { column, ...filters } = req.query;
      const result = excelService.getAllColumnValues(rawColumn, filters);
      const hasValues = Array.isArray(result) ? result.length : result?.success !== false;
      if (!Array.isArray(result) && result?.success === false) {
        return res.status(404).json(result);
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to get column values.', detail: err.message });
    }
  },
  getBMData: (req, res) => {
    try { res.json(excelService.getBMData(req.query)); }
    catch { res.status(500).json({ error: 'Failed to get BM data.' }); }
  },
  getRMData: (req, res) => {
    try { res.json(excelService.getRMData(req.query)); }
    catch { res.status(500).json({ error: 'Failed to get RM data.' }); }
  },
  getTeamTrend: (req, res) => {
    try { res.json(excelService.getTeamTrend(req.query)); }
    catch { res.status(500).json({ error: 'Failed to get team trend.' }); }
  },
  getSalesHierarchy: (req, res) => {
    try { res.json(excelService.getSalesHierarchy(req.query)); }
    catch (err) { res.status(500).json({ error: 'Failed to get sales hierarchy.', detail: err.message }); }
  },
  getExecutiveInsights: (req, res) => {
    try { res.json(excelService.getExecutiveInsights(req.query)); }
    catch (err) { res.status(500).json({ error: 'Failed to get executive insights.', detail: err.message }); }
  },
  reloadExcel: (req, res) => {
    try {
      excelService.reloadExcel();
      res.json({ success: true, message: 'Excel reloaded.' });
    } catch { res.status(500).json({ error: 'Failed to reload Excel.' }); }
  },
};
