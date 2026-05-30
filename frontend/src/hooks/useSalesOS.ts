import { useCallback, useEffect, useState } from 'react';
import { workforceAPI } from '../services/workforce';
import type { DrillStep, OSBreakdownItem, OSLeakage, OSProfile, OSSegment, OSSummary } from '../types/salesOS';

export function useSalesOS() {
  const [summary, setSummary] = useState<OSSummary | null>(null);
  const [segments, setSegments] = useState<OSSegment[]>([]);
  const [breakdown, setBreakdown] = useState<OSBreakdownItem[]>([]);
  const [profile, setProfile] = useState<OSProfile | null>(null);
  const [leakage, setLeakage] = useState<OSLeakage | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<DrillStep>({ view: 'home' });
  const [nextBreakdown, setNextBreakdown] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    const res = await workforceAPI.getOSSummary();
    setSummary(res.data);
  }, []);

  const loadSegments = useCallback(async (s: DrillStep) => {
    const params: Record<string, string> = {
      level: s.level || 'RM',
      segmentType: s.segmentType || 'achievement',
    };
    if (s.zone) params.zone = s.zone;
    if (s.state) params.state = s.state;
    if (s.segment) params.segment = s.segment;
    const res = await workforceAPI.getOSSegments(params);
    setSegments(res.data.segments || []);
  }, []);

  const loadBreakdown = useCallback(async (s: DrillStep) => {
    const params: Record<string, string> = {
      level: s.level || 'RM',
      segmentType: s.segmentType || 'achievement',
      breakdownBy: s.breakdownBy || 'zone',
    };
    if (s.segment) params.segment = s.segment;
    if (s.zone) params.zone = s.zone;
    if (s.state) params.state = s.state;
    const res = await workforceAPI.getOSBreakdown(params);
    setBreakdown(res.data.items || []);
    setNextBreakdown(res.data.nextBreakdown || null);
  }, []);

  const loadProfile = useCallback(async (type: 'bm' | 'rm' | 'zone', id: string) => {
    const res = await workforceAPI.getOSProfile(type, id);
    setProfile(res.data);
  }, []);

  const loadLeakage = useCallback(async () => {
    const res = await workforceAPI.getOSLeakage();
    setLeakage(res.data);
  }, []);

  const navigate = useCallback(async (newStep: DrillStep) => {
    setLoading(true);
    setStep(newStep);
    try {
      if (newStep.view === 'home') {
        await loadSummary();
        setSegments([]);
        setBreakdown([]);
        setProfile(null);
      } else if (newStep.view === 'segments') {
        await loadSegments(newStep);
        setBreakdown([]);
        setProfile(null);
      } else if (newStep.view === 'breakdown') {
        await loadBreakdown(newStep);
        setProfile(null);
      } else if (newStep.view === 'profile' && newStep.profileType && newStep.profileId) {
        await loadProfile(newStep.profileType, newStep.profileId);
      } else if (newStep.view === 'leakage') {
        await loadLeakage();
      }
    } finally {
      setLoading(false);
    }
  }, [loadSummary, loadSegments, loadBreakdown, loadProfile, loadLeakage]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadSummary();
      setLoading(false);
    })();
  }, [loadSummary]);

  const clickLevel = (level: string, segmentType: 'achievement' | 'growth' | 'coverage' | 'revenue' = 'achievement') => {
    navigate({ view: 'segments', level, segmentType });
  };

  const clickSegment = (segment: string) => {
    navigate({ ...step, view: 'breakdown', segment, breakdownBy: 'zone' });
  };

  const clickBreakdownItem = (item: OSBreakdownItem) => {
    if (step.breakdownBy === 'zone' && !step.zone) {
      navigate({ ...step, view: 'breakdown', zone: item.name, breakdownBy: 'state', segment: step.segment });
    } else if (step.breakdownBy === 'state' || (step.zone && step.breakdownBy === 'state')) {
      if (item.empCode && item.designation === 'RM') {
        navigate({ view: 'profile', profileType: 'rm', profileId: item.empCode });
      } else if (item.empCode && item.designation === 'BM') {
        navigate({ view: 'profile', profileType: 'bm', profileId: item.empCode });
      } else {
        navigate({ ...step, view: 'breakdown', state: item.name, breakdownBy: 'person', segment: step.segment });
      }
    } else if (item.empCode) {
      const type = item.designation === 'RM' ? 'rm' : 'bm';
      navigate({ view: 'profile', profileType: type, profileId: item.empCode });
    } else if (step.breakdownBy === 'zone') {
      navigate({ view: 'profile', profileType: 'zone', profileId: item.name });
    }
  };

  const goHome = () => navigate({ view: 'home' });
  const showLeakage = () => navigate({ view: 'leakage' });

  return {
    summary, segments, breakdown, profile, leakage, loading, step, nextBreakdown,
    navigate, clickLevel, clickSegment, clickBreakdownItem, goHome, showLeakage,
  };
}
