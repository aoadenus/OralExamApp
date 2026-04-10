import { useCallback, useEffect, useMemo, useState } from 'react';
import { domains, entities, relationships } from './content';
import type { ItemProgress, MasteryResult, MockOralHistoryItem, ProgressState, SettingsState, WeakSpot, StudySession, ErrorCategory, SqlOralSession } from '../types';

const STORAGE_KEY = 'restaurant-sql-oral-trainer-progress-v2';

const defaultSettings: SettingsState = {
  soundEnabled: false,
  timerWarningsEnabled: true,
  reducedMotion: false,
  fontScale: 'md',
  theme: 'light',
  examDate: '2026-04-16',
  dailyGoalMinutes: 15,
  awsHost: '',
  awsUser: '',
  awsDatabase: '',
};

export function createDefaultProgress(): ProgressState {
  return {
    version: 1,
    userId: 'local-device-user',
    initializedAt: new Date().toISOString(),
    overallReadiness: 0,
    itemProgress: {},
    mockOrals: [],
    streak: 0,
    settings: defaultSettings,
    studySessions: [],
    weakSpots: {},
    totalStudyTimeMs: 0,
    favoriteItemIds: [],
    acknowledgedMilestones: [],
    sqlOralSessions: [],
  };
}

export function useProgressStore() {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const recordAttempt = useCallback((itemId: string, result: MasteryResult, confidence: number) => {
    setProgress((current) => {
      const previous = current.itemProgress[itemId] ?? blankItemProgress();
      const score = result === 'correct' ? 1 : result === 'partial' ? 0.5 : 0;
      const attempts = previous.attempts + 1;
      const correct = previous.correct + score;
      const incorrect = previous.incorrect + (result === 'incorrect' ? 1 : 0);
      const confidenceAvg =
        previous.attempts === 0
          ? confidence
          : (previous.confidenceAvg * previous.attempts + confidence) / attempts;
      const streak = result === 'correct' ? previous.streak + 1 : 0;
      const correctRate = attempts === 0 ? 0 : correct / attempts;
      const mastery = clamp(correctRate * 0.72 + Math.min(streak, 5) * 0.04 + (confidenceAvg / 5) * 0.08);
      const updatedItem: ItemProgress = {
        attempts,
        correct,
        incorrect,
        streak,
        confidenceAvg,
        lastResult: result,
        lastSeenAt: new Date().toISOString(),
        mastery,
      };
      const next = {
        ...current,
        itemProgress: {
          ...current.itemProgress,
          [itemId]: updatedItem,
        },
        streak: result === 'correct' ? current.streak + 1 : 0,
      };
      return {
        ...next,
        overallReadiness: calculateOverallReadiness(next.itemProgress),
      };
    });
  }, []);

  const saveMockOral = useCallback((session: MockOralHistoryItem) => {
    setProgress((current) => ({
      ...current,
      mockOrals: [session, ...current.mockOrals].slice(0, 20),
    }));
  }, []);

  const saveSqlOralSession = useCallback((session: SqlOralSession) => {
    setProgress((current) => ({
      ...current,
      sqlOralSessions: [session, ...(current.sqlOralSessions ?? [])].slice(0, 20),
    }));
  }, []);

  const updateSettings = useCallback((settings: Partial<SettingsState>) => {
    setProgress((current) => ({
      ...current,
      settings: {
        ...current.settings,
        ...settings,
      },
    }));
  }, []);

  const resetAll = useCallback(() => {
    setProgress(createDefaultProgress());
  }, []);

  const importProgress = useCallback((incoming: ProgressState) => {
    setProgress(normalizeProgress(incoming));
  }, []);

  const startStudySession = useCallback(() => {
    const sessionId = `session-${Date.now()}`;
    const sessionStartTime = Date.now();
    
    return {
      sessionId,
      endSession: (itemsAttempted: number, itemsCorrect: number) => {
        const durationMs = Date.now() - sessionStartTime;
        const session: StudySession = {
          id: sessionId,
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
          durationMs,
          itemsAttempted,
          itemsCorrect,
        };
        
        setProgress((current) => ({
          ...current,
          studySessions: [session, ...current.studySessions].slice(0, 100),
          totalStudyTimeMs: current.totalStudyTimeMs + durationMs,
          lastStudySessionAt: new Date().toISOString(),
        }));
      },
    };
  }, []);

  const recordWeakSpot = useCallback((itemId: string, itemName: string, category: ErrorCategory, result: MasteryResult) => {
    setProgress((current) => {
      const spotId = `${category}-${itemId}`;
      const existing = current.weakSpots[spotId];
      
      const updated: WeakSpot = {
        id: spotId,
        category,
        itemId,
        itemName,
        errorCount: (existing?.errorCount ?? 0) + (result === 'incorrect' ? 1 : 0),
        correctCount: (existing?.correctCount ?? 0) + (result === 'correct' ? 1 : 0),
        lastErrorAt: result === 'incorrect' ? new Date().toISOString() : existing?.lastErrorAt ?? new Date().toISOString(),
      };
      
      return {
        ...current,
        weakSpots: {
          ...current.weakSpots,
          [spotId]: updated,
        },
      };
    });
  }, []);

  const toggleFavorite = useCallback((itemId: string) => {
    setProgress((current) => {
      const favorites = current.favoriteItemIds ?? [];
      const isFavorite = favorites.includes(itemId);
      return {
        ...current,
        favoriteItemIds: isFavorite ? favorites.filter((id) => id !== itemId) : [itemId, ...favorites],
      };
    });
  }, []);

  const acknowledgeMilestone = useCallback((milestone: number) => {
    setProgress((current) => ({
      ...current,
      acknowledgedMilestones: Array.from(new Set([...(current.acknowledgedMilestones ?? []), milestone])),
    }));
  }, []);

  const analytics = useMemo(() => buildAnalytics(progress.itemProgress), [progress.itemProgress]);

  return {
    progress,
    analytics,
    recordAttempt,
    saveMockOral,
    saveSqlOralSession,
    updateSettings,
    resetAll,
    importProgress,
    startStudySession,
    recordWeakSpot,
    toggleFavorite,
    acknowledgeMilestone,
  };
}

function loadProgress(): ProgressState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createDefaultProgress();
  try {
    return normalizeProgress(JSON.parse(raw) as ProgressState);
  } catch {
    return createDefaultProgress();
  }
}

function normalizeProgress(progress: ProgressState): ProgressState {
  return {
    ...createDefaultProgress(),
    ...progress,
    settings: {
      ...defaultSettings,
      ...(progress.settings ?? {}),
    },
    itemProgress: progress.itemProgress ?? {},
    mockOrals: progress.mockOrals ?? [],
    studySessions: progress.studySessions ?? [],
    weakSpots: progress.weakSpots ?? {},
    favoriteItemIds: progress.favoriteItemIds ?? [],
    acknowledgedMilestones: progress.acknowledgedMilestones ?? [],
    sqlOralSessions: progress.sqlOralSessions ?? [],
  };
}

function blankItemProgress(): ItemProgress {
  return {
    attempts: 0,
    correct: 0,
    incorrect: 0,
    streak: 0,
    confidenceAvg: 0,
    mastery: 0,
  };
}

export function getItemProgress(progress: ProgressState, itemId: string): ItemProgress {
  return progress.itemProgress[itemId] ?? blankItemProgress();
}

export function masteryLabel(mastery: number) {
  if (mastery >= 0.85) return 'Mastered';
  if (mastery >= 0.68) return 'Strong';
  if (mastery >= 0.45) return 'Improving';
  if (mastery > 0) return 'Learning';
  return 'New';
}

export function calculateDomainMastery(itemProgress: Record<string, ItemProgress>, domainId: string) {
  const entityIds = entities.filter((entity) => entity.domainId === domainId).map((entity) => entity.id);
  const relationshipIds = relationships
    .filter((relationship) => relationship.domainId === domainId)
    .map((relationship) => relationship.id);
  const ids = [...entityIds, ...relationshipIds];
  if (ids.length === 0) return 0;
  return ids.reduce((sum, id) => sum + (itemProgress[id]?.mastery ?? 0), 0) / ids.length;
}

export function buildAnalytics(itemProgress: Record<string, ItemProgress>) {
  const domainProgress = domains.map((domain) => ({
    domain,
    mastery: calculateDomainMastery(itemProgress, domain.id),
  }));
  const weakItems = Object.entries(itemProgress)
    .filter(([, item]) => item.attempts > 0 && item.mastery < 0.55)
    .sort((a, b) => a[1].mastery - b[1].mastery)
    .slice(0, 8);
  const masteredCount = Object.values(itemProgress).filter((item) => item.mastery >= 0.85).length;
  const attemptedCount = Object.values(itemProgress).filter((item) => item.attempts > 0).length;
  const weakestDomain = [...domainProgress].sort((a, b) => a.mastery - b.mastery)[0];
  return {
    domainProgress,
    weakItems,
    masteredCount,
    attemptedCount,
    weakestDomain,
  };
}

function calculateOverallReadiness(itemProgress: Record<string, ItemProgress>) {
  const ids = [...entities.map((entity) => entity.id), ...relationships.map((relationship) => relationship.id)];
  if (ids.length === 0) return 0;
  return ids.reduce((sum, id) => sum + (itemProgress[id]?.mastery ?? 0), 0) / ids.length;
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function buildWeakSpotAnalytics(weakSpots: Record<string, WeakSpot>) {
  const spots = Object.values(weakSpots)
    .filter((spot) => spot.errorCount > 0)
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 15);
  
  const byCategory = Object.entries(weakSpots).reduce(
    (acc, [, spot]) => {
      if (!acc[spot.category]) acc[spot.category] = [];
      acc[spot.category].push(spot);
      return acc;
    },
    {} as Record<ErrorCategory, WeakSpot[]>,
  );
  
  return { spots, byCategory };
}

export function calculateTodayStudyTime(sessions: StudySession[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return sessions
    .filter((session) => new Date(session.startedAt) >= today)
    .reduce((sum, session) => sum + session.durationMs, 0);
}
