import { arcadeColors } from './arcade-theme';

export function TerminalPanel({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-cyan-400/20 bg-[#0D1117] p-4 shadow-[0_0_20px_rgba(0,229,255,0.06)] ${className}`}
    >
      {title && (
        <div className="mb-3 flex items-center gap-2 border-b border-cyan-400/10 pb-2">
          <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,229,255,0.5)]" />
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400">{title}</span>
        </div>
      )}
      <pre className="overflow-auto font-['Fira_Code'] text-[13px] leading-7 text-slate-200">
        {children}
      </pre>
    </div>
  );
}

export function ScorePanel({
  xp,
  rank,
  streak,
  rankProgress,
}: {
  xp: number;
  rank: { rank: string; color: string };
  streak: number;
  rankProgress: { current: number; needed: number; progress: number };
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-cyan-400/15 bg-[#101826]/80 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-slate-500">XP</span>
        <span className="font-['Orbitron'] text-lg font-bold" style={{ color: rank.color }}>{xp}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-slate-500">RANK</span>
        <span className="font-['Orbitron'] text-sm font-semibold" style={{ color: rank.color }}>{rank.rank}</span>
      </div>
      {streak > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400">🔥</span>
          <span className="font-['Orbitron'] text-sm font-bold text-amber-400">{streak}</span>
        </div>
      )}
      {rankProgress.needed > 0 && (
        <div className="flex flex-1 items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500"
              style={{ width: `${Math.round(rankProgress.progress * 100)}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-slate-500">{Math.round(rankProgress.progress * 100)}%</span>
        </div>
      )}
    </div>
  );
}

export function XPBanner({ amount, message }: { amount: number; message?: string }) {
  return (
    <div className="arcade-xp-popup animate-pop rounded-xl border border-cyan-400/30 bg-[#101826] px-4 py-2 text-center shadow-[0_0_20px_rgba(0,229,255,0.2)]">
      <span className="font-['Orbitron'] text-xl font-bold text-cyan-300">+{amount} XP</span>
      {message && <p className="mt-1 text-xs text-slate-400">{message}</p>}
    </div>
  );
}

export function BossHealthBar({
  name,
  hp,
  maxHp,
  phase,
}: {
  name: string;
  hp: number;
  maxHp: number;
  phase: string;
}) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const barColor = pct > 60 ? 'from-rose-500 to-red-600' : pct > 30 ? 'from-amber-500 to-orange-600' : 'from-emerald-400 to-cyan-500';

  return (
    <div className="rounded-2xl border border-rose-400/20 bg-[#101826] p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">👨‍🏫</span>
          <span className="font-['Orbitron'] text-sm font-bold text-white">{name}</span>
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-rose-400">{phase}</span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between">
        <span className="font-mono text-[10px] text-slate-500">{hp}/{maxHp} HP</span>
      </div>
    </div>
  );
}
