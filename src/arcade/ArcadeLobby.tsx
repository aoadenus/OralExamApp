import { motion } from 'framer-motion';
import { CabinetCard } from './CabinetCard';
import { ArcadeShell } from './ArcadeShell';
import { ScorePanel } from './ScorePanel';
import { useArcadeProgress } from './useArcadeProgress';
import sqlRequirements from '../data/sql-requirements';
import { getItemProgress } from '../lib/progress';
import type { ProgressState } from '../types';

type Navigate = (path: string) => void;

const cabinets = [
  {
    title: 'Clause Blaster',
    description: 'Enemies drop SQL prompts. Fire the correct clause before they reach the bottom.',
    difficulty: 'ARCADE',
    icon: '🔫',
    accent: 'cyan' as const,
    path: '/arcade/clause-blaster',
  },
  {
    title: 'JOIN Juggernaut',
    description: 'Connect floating tables with the right join type to build valid query results.',
    difficulty: 'PUZZLE',
    icon: '🔗',
    accent: 'fuchsia' as const,
    path: '/arcade/join-juggernaut',
  },
  {
    title: 'Time Window Rush',
    description: 'Switch lanes to dodge wrong date filters. React fast or get caught by bad logic.',
    difficulty: 'RUNNER',
    icon: '⏱️',
    accent: 'amber' as const,
    path: '/arcade/time-window-rush',
  },
  {
    title: 'Aggregation Forge',
    description: 'Route raw data through COUNT, SUM, AVG, and GROUP BY machines to forge results.',
    difficulty: 'FACTORY',
    icon: '⚒️',
    accent: 'emerald' as const,
    path: '/arcade/aggregation-forge',
  },
  {
    title: 'Professor Boss Rush',
    description: 'Face the professor in a timed oral exam. Execute, explain, and defend your SQL.',
    difficulty: 'BOSS',
    icon: '👨‍🏫',
    accent: 'rose' as const,
    path: '/arcade/boss-rush',
  },
];

export function ArcadeLobby({
  navigate,
  progress,
}: {
  navigate: Navigate;
  progress: ProgressState;
}) {
  const arcade = useArcadeProgress();
  const sqlIds = sqlRequirements.map((r) => r.id);
  const sqlProgressItems = sqlIds.map((id) => getItemProgress(progress, id));
  const readiness = sqlProgressItems.length > 0
    ? sqlProgressItems.reduce((sum, item) => sum + item.mastery, 0) / sqlProgressItems.length
    : 0;
  const attempted = sqlProgressItems.filter((item) => item.attempts > 0).length;
  const mastered = sqlProgressItems.filter((item) => item.mastery >= 0.75).length;

  return (
    <ArcadeShell
      title="Arcade Lobby"
      subtitle="Choose your game cabinet. Every round trains a real SQL oral exam skill."
      activeZone="lobby"
      navigate={navigate}
      scoreBar={
        <ScorePanel
          xp={arcade.xp}
          rank={arcade.rank}
          streak={arcade.currentStreak}
          rankProgress={arcade.rankProgress}
        />
      }
    >
      {/* Readiness stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="SQL Readiness" value={`${Math.round(readiness * 100)}%`} icon="📊" />
        <StatCard label="Attempted" value={`${attempted}/${sqlRequirements.length}`} icon="🎯" />
        <StatCard label="Mastered" value={`${mastered}/${sqlRequirements.length}`} icon="⭐" />
      </div>

      {/* Game Cabinets */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      >
        {cabinets.map((cab) => (
          <motion.div
            key={cab.title}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 },
            }}
          >
            <CabinetCard
              title={cab.title}
              description={cab.description}
              difficulty={cab.difficulty}
              icon={cab.icon}
              accentColor={cab.accent}
              onClick={() => navigate(cab.path)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Quick links */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => navigate('/sql-study')}
          className="rounded-xl border border-slate-700/50 bg-[#101826] px-4 py-3 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/5"
        >
          <p className="font-['Orbitron'] text-sm font-bold text-white">Mission Terminal</p>
          <p className="mt-1 text-xs text-slate-400">Deep-study the 15 functionalities with full clause breakdowns.</p>
        </button>
        <button
          onClick={() => navigate('/arcade/scoreboard')}
          className="rounded-xl border border-slate-700/50 bg-[#101826] px-4 py-3 text-left transition hover:border-amber-400/30 hover:bg-amber-400/5"
        >
          <p className="font-['Orbitron'] text-sm font-bold text-white">Scoreboard</p>
          <p className="mt-1 text-xs text-slate-400">Track your XP, high scores, streaks, and rank progression.</p>
        </button>
      </div>
    </ArcadeShell>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-xl border border-slate-700/40 bg-[#101826]/80 p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-2 font-['Orbitron'] text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
