export const arcadeColors = {
  bg: '#070B14',
  surface: '#101826',
  surfaceLight: '#1A2332',
  primary: '#00E5FF',
  accent: '#7C4DFF',
  success: '#00F5A0',
  warning: '#FFB800',
  danger: '#FF4D6D',
  muted: '#94A3B8',
  border: 'rgba(0, 229, 255, 0.2)',
  borderAccent: 'rgba(124, 77, 255, 0.2)',
  glow: {
    cyan: '0 0 25px rgba(0, 229, 255, 0.12)',
    purple: '0 0 25px rgba(124, 77, 255, 0.12)',
    success: '0 0 25px rgba(0, 245, 160, 0.15)',
    danger: '0 0 25px rgba(255, 77, 109, 0.15)',
  },
} as const;

export const arcadeFonts = {
  display: "'Orbitron', sans-serif",
  body: "'Inter', sans-serif",
  code: "'Fira Code', monospace",
} as const;

export const rankThresholds = [
  { rank: 'Rookie', minXP: 0, color: arcadeColors.muted },
  { rank: 'Operator', minXP: 500, color: arcadeColors.primary },
  { rank: 'Commander', minXP: 1500, color: arcadeColors.accent },
  { rank: 'SQL Master', minXP: 3500, color: arcadeColors.success },
] as const;

export function getRank(xp: number) {
  for (let i = rankThresholds.length - 1; i >= 0; i--) {
    if (xp >= rankThresholds[i].minXP) return rankThresholds[i];
  }
  return rankThresholds[0];
}

export function getNextRank(xp: number) {
  const current = getRank(xp);
  const idx = rankThresholds.findIndex((r) => r.rank === current.rank);
  return idx < rankThresholds.length - 1 ? rankThresholds[idx + 1] : null;
}

export function xpToNextRank(xp: number) {
  const next = getNextRank(xp);
  if (!next) return { current: xp, needed: 0, progress: 1 };
  const current = getRank(xp);
  const rangeTotal = next.minXP - current.minXP;
  const rangeProgress = xp - current.minXP;
  return { current: rangeProgress, needed: rangeTotal, progress: rangeTotal > 0 ? rangeProgress / rangeTotal : 1 };
}
