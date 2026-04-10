import { useCallback, useState } from 'react';
import type { ArcadeProgress, GameScore } from './arcade-types';
import { getRank, xpToNextRank } from './arcade-theme';

const ARCADE_STORAGE_KEY = 'stratos-arcade-progress-v1';

function loadArcadeProgress(): ArcadeProgress {
  try {
    const raw = localStorage.getItem(ARCADE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    xp: 0,
    totalGamesPlayed: 0,
    highScores: {},
    gameHistory: [],
    currentStreak: 0,
    bestStreak: 0,
    medals: [],
  };
}

function saveArcadeProgress(state: ArcadeProgress) {
  localStorage.setItem(ARCADE_STORAGE_KEY, JSON.stringify(state));
}

export function useArcadeProgress() {
  const [state, setState] = useState<ArcadeProgress>(loadArcadeProgress);

  const addXP = useCallback((amount: number) => {
    setState((prev) => {
      const next = { ...prev, xp: prev.xp + amount };
      saveArcadeProgress(next);
      return next;
    });
  }, []);

  const recordGameScore = useCallback((score: GameScore) => {
    setState((prev) => {
      const currentHigh = prev.highScores[score.gameId] ?? 0;
      const newStreak = prev.currentStreak + 1;
      const next: ArcadeProgress = {
        ...prev,
        xp: prev.xp + Math.round(score.score * score.accuracy),
        totalGamesPlayed: prev.totalGamesPlayed + 1,
        highScores: {
          ...prev.highScores,
          [score.gameId]: Math.max(currentHigh, score.score),
        },
        gameHistory: [score, ...prev.gameHistory].slice(0, 50),
        currentStreak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
      };
      saveArcadeProgress(next);
      return next;
    });
  }, []);

  const addMedal = useCallback((medal: string) => {
    setState((prev) => {
      if (prev.medals.includes(medal)) return prev;
      const next = { ...prev, medals: [...prev.medals, medal] };
      saveArcadeProgress(next);
      return next;
    });
  }, []);

  const resetStreak = useCallback(() => {
    setState((prev) => {
      const next = { ...prev, currentStreak: 0 };
      saveArcadeProgress(next);
      return next;
    });
  }, []);

  const rank = getRank(state.xp);
  const rankProgress = xpToNextRank(state.xp);

  return {
    ...state,
    rank,
    rankProgress,
    addXP,
    recordGameScore,
    addMedal,
    resetStreak,
  };
}
