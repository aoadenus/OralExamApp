import { ArcadeShell } from './ArcadeShell';
import { ScorePanel } from './ScorePanel';
import { useArcadeProgress } from './useArcadeProgress';
import { getRank } from './arcade-theme';
import type { ProgressState } from '../types';

type Navigate = (path: string) => void;

export function ArcadeScoreboard({ navigate, progress }: { navigate: Navigate; progress: ProgressState }) {
  const arcade = useArcadeProgress();

  const gameNames: Record<string, string> = {
    'clause-blaster': 'Clause Blaster',
    'join-juggernaut': 'JOIN Juggernaut',
    'time-window-rush': 'Time Window Rush',
    'aggregation-forge': 'Aggregation Forge',
    'boss-rush': 'Boss Rush',
  };

  const recentGames = arcade.gameHistory.slice(0, 10);

  return (
    <ArcadeShell
      title="Scoreboard"
      subtitle="Track your XP, high scores, streaks, and rank progression."
      activeZone="scoreboard"
      navigate={navigate}
      scoreBar={<ScorePanel xp={arcade.xp} rank={arcade.rank} streak={arcade.currentStreak} rankProgress={arcade.rankProgress} />}
    >
      <div className="space-y-6">
        {/* Stats grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatBlock label="Total XP" value={arcade.xp.toString()} icon="⚡" color="text-cyan-300" />
          <StatBlock label="Rank" value={arcade.rank.rank} icon="🎖️" color="text-fuchsia-300" />
          <StatBlock label="Games Played" value={arcade.totalGamesPlayed.toString()} icon="🎮" color="text-emerald-300" />
          <StatBlock label="Best Streak" value={arcade.bestStreak.toString()} icon="🔥" color="text-amber-300" />
        </div>

        {/* High Scores */}
        <div className="rounded-2xl border border-slate-700/40 bg-[#101826] p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 mb-4">High Scores</p>
          {Object.keys(gameNames).length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(gameNames).map(([gameId, name]) => {
                const highScore = arcade.highScores[gameId] ?? 0;
                return (
                  <div key={gameId} className="rounded-xl border border-slate-700/40 bg-[#0D1117] p-4">
                    <p className="text-sm font-semibold text-slate-300">{name}</p>
                    <p className="mt-1 font-['Orbitron'] text-2xl font-bold text-cyan-300">{highScore}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No games played yet. Hit the lobby!</p>
          )}
        </div>

        {/* Recent Games */}
        <div className="rounded-2xl border border-slate-700/40 bg-[#101826] p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-fuchsia-400 mb-4">Recent Games</p>
          {recentGames.length === 0 ? (
            <p className="text-sm text-slate-500">No game history yet.</p>
          ) : (
            <div className="space-y-2">
              {recentGames.map((game, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-700/40 bg-[#0D1117] px-4 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{gameNames[game.gameId] ?? game.gameId}</p>
                    <p className="font-mono text-[10px] text-slate-500">{new Date(game.completedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-['Orbitron'] text-sm font-bold text-cyan-300">{game.score}</p>
                    <p className="font-mono text-[10px] text-slate-500">{Math.round(game.accuracy * 100)}% accuracy</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medals */}
        {arcade.medals.length > 0 && (
          <div className="rounded-2xl border border-slate-700/40 bg-[#101826] p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-amber-400 mb-4">Medals</p>
            <div className="flex flex-wrap gap-2">
              {arcade.medals.map((medal) => (
                <span key={medal} className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-sm font-semibold text-amber-300">
                  🏅 {medal}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => navigate('/arcade')}
            className="rounded-xl border border-slate-600 px-6 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800/50 transition-all"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    </ArcadeShell>
  );
}

function StatBlock({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div className="rounded-xl border border-slate-700/40 bg-[#101826] p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`mt-2 font-['Orbitron'] text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
