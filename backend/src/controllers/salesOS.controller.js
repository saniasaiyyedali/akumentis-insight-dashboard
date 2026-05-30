const salesOS = require('../services/salesOSService');

module.exports = {
  getSummary: (req, res) => {
    try { res.json(salesOS.getSummary(req.query)); }
    catch (err) { res.status(500).json({ error: 'Failed to get summary.', detail: err.message }); }
  },
  getHierarchyLevels: (req, res) => {
    try { res.json(salesOS.getHierarchyLevels(req.query)); }
    catch (err) { res.status(500).json({ error: 'Failed to get hierarchy levels.', detail: err.message }); }
  },
  getSegments: (req, res) => {
    try { res.json(salesOS.getSegments(req.query)); }
    catch (err) { res.status(500).json({ error: 'Failed to get segments.', detail: err.message }); }
  },
  getBreakdown: (req, res) => {
    try { res.json(salesOS.getBreakdown(req.query)); }
    catch (err) { res.status(500).json({ error: 'Failed to get breakdown.', detail: err.message }); }
  },
  getProfile: (req, res) => {
    try {
      const { type, id } = req.params;
      let profile = null;
      if (type === 'bm') profile = salesOS.getBMProfile(id);
      else if (type === 'rm') profile = salesOS.getRMProfile(id);
      else if (type === 'zone') profile = salesOS.getZoneProfile(decodeURIComponent(id));
      if (!profile) return res.status(404).json({ error: 'Profile not found.' });
      res.json(profile);
    } catch (err) { res.status(500).json({ error: 'Failed to get profile.', detail: err.message }); }
  },
  getLeakage: (req, res) => {
    try { res.json(salesOS.getLeakage(req.query)); }
    catch (err) { res.status(500).json({ error: 'Failed to get leakage.', detail: err.message }); }
  },
  getOrgTree: (req, res) => {
    try { res.json(salesOS.getOrgTree(req.query)); }
    catch (err) { res.status(500).json({ error: 'Failed to get org tree.', detail: err.message }); }
  },
  compare: (req, res) => {
    try { res.json(salesOS.compareEntities(req.query)); }
    catch (err) { res.status(500).json({ error: 'Failed to compare.', detail: err.message }); }
  },
  aiQuery: (req, res) => {
    try {
      const { query } = req.body;
      res.json(salesOS.processAIQuery(query));
    } catch (err) { res.status(500).json({ error: 'AI query failed.', detail: err.message }); }
  },
  getPerformanceHub: (req, res) => {
    try { res.json(salesOS.getPerformanceHub(req.query)); }
    catch (err) { res.status(500).json({ error: 'Failed to get performance hub.', detail: err.message }); }
  },
  getSegmentMembers: (req, res) => {
    try { res.json(salesOS.getSegmentMembers(req.query)); }
    catch (err) { res.status(500).json({ error: 'Failed to get segment members.', detail: err.message }); }
  },
  getTopBottom: (req, res) => {
    try { res.json(salesOS.getTopBottomPerformers(req.query)); }
    catch (err) { res.status(500).json({ error: 'Failed to get top/bottom performers.', detail: err.message }); }
  },
  getLeakageOwnership: (req, res) => {
    try { res.json(salesOS.getLeakageOwnership(req.query)); }
    catch (err) { res.status(500).json({ error: 'Failed to get leakage ownership.', detail: err.message }); }
  },
  getOrgNodeDetail: (req, res) => {
    try {
      const detail = salesOS.getOrgNodeDetail(req.params.empCode);
      if (!detail) return res.status(404).json({ error: 'Node not found.' });
      res.json(detail);
    } catch (err) { res.status(500).json({ error: 'Failed to get node detail.', detail: err.message }); }
  },
  getOrgHierarchyHealth: (req, res) => {
    try { res.json(salesOS.getOrgHierarchyHealth(req.query)); }
    catch (err) { res.status(500).json({ error: 'Failed to get org health.', detail: err.message }); }
  },
  getOrgLevelDistribution: (req, res) => {
    try { res.json(salesOS.getOrgLevelDistribution(req.query)); }
    catch (err) { res.status(500).json({ error: 'Failed to get level distribution.', detail: err.message }); }
  },
  getOrgRegionManagers: (req, res) => {
    try { res.json(salesOS.getOrgRegionManagers(req.query)); }
    catch (err) { res.status(500).json({ error: 'Failed to get region managers.', detail: err.message }); }
  },
  getOrgManagerDetail: (req, res) => {
    try {
      const detail = salesOS.getOrgManagerDetail(req.params.empCode);
      if (!detail) return res.status(404).json({ error: 'Manager not found.' });
      res.json(detail);
    } catch (err) { res.status(500).json({ error: 'Failed to get manager.', detail: err.message }); }
  },
};
