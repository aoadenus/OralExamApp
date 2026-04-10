import { type ReactNode } from 'react';
import type { ArcadeZone } from './arcade-types';

type Navigate = (path: string) => void;

const navZones: Array<{ zone: ArcadeZone; label: string; path: string; icon: string }> = [
  { zone: 'lobby', label: 'Arcade Lobby', path: '/arcade', icon: '🕹️' },
  { zone: 'mission-terminal', label: 'Mission Terminal', path: '/sql-study', icon: '📡' },
  { zone: 'clause-blaster', label: 'Clause Blaster', path: '/arcade/clause-blaster', icon: '🔫' },
  { zone: 'join-juggernaut', label: 'JOIN Juggernaut', path: '/arcade/join-juggernaut', icon: '🔗' },
  { zone: 'time-window-rush', label: 'Time Window Rush', path: '/arcade/time-window-rush', icon: '⏱️' },
  { zone: 'aggregation-forge', label: 'Aggregation Forge', path: '/arcade/aggregation-forge', icon: '⚒️' },
  { zone: 'boss-rush', label: 'Boss Rush', path: '/arcade/boss-rush', icon: '👨‍🏫' },
  { zone: 'data-vault', label: 'Data Vault', path: '/sql-tables', icon: '🗄️' },
  { zone: 'scoreboard', label: 'Scoreboard', path: '/arcade/scoreboard', icon: '🏆' },
];

export function ArcadeShell({
  title,
  subtitle,
  activeZone,
  navigate,
  children,
  scoreBar,
}: {
  title: string;
  subtitle?: string;
  activeZone?: ArcadeZone;
  navigate: Navigate;
  children: ReactNode;
  scoreBar?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 relative overflow-hidden">
      {/* CRT scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.04] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.15)_2px,rgba(255,255,255,0.15)_4px)]" />
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,229,255,0.07),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(124,77,255,0.06),transparent_50%)]" />

      <div className="relative z-10 grid min-h-screen grid-cols-[240px_1fr]">
        {/* Arcade Nav Rail */}
        <aside className="sticky top-0 h-screen overflow-y-auto border-r border-cyan-400/10 bg-[#0B1220]/95 p-4 backdrop-blur-xl">
          <button onClick={() => navigate('/arcade')} className="mb-6 w-full rounded-2xl border border-cyan-400/20 bg-black/40 p-4 text-left shadow-[0_0_25px_rgba(0,229,255,0.08)] hover:border-cyan-400/40 transition-colors">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400">
              Stratos
            </p>
            <h1 className="mt-1 font-['Orbitron'] text-lg font-bold text-white leading-tight">
              SQL Arcade
            </h1>
            <p className="mt-1 font-mono text-[10px] text-slate-500">Execute • Explain • Defend</p>
          </button>

          <nav className="space-y-1">
            {navZones.map((item) => {
              const active = activeZone === item.zone;
              return (
                <button
                  key={item.zone}
                  onClick={() => navigate(item.path)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                    active
                      ? 'border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.1)]'
                      : 'border border-transparent text-slate-400 hover:border-slate-700/50 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="font-semibold">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 border-t border-slate-700/40 pt-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-slate-600">Legacy Mode</p>
            <button
              onClick={() => navigate('/')}
              className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-slate-500 hover:border-slate-700/50 hover:bg-slate-800/40 hover:text-slate-300 transition-all"
            >
              <span className="text-base">📋</span>
              <span className="font-semibold">Classic View</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 overflow-x-hidden p-6 md:p-8">
          {scoreBar && <div className="mb-4">{scoreBar}</div>}

          <header className="mb-6 rounded-2xl border border-cyan-400/15 bg-[#101826]/80 p-5 shadow-[0_0_30px_rgba(0,229,255,0.06)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400">
              Execute • Explain • Defend
            </p>
            <h2 className="mt-2 font-['Orbitron'] text-2xl font-bold text-white md:text-3xl">{title}</h2>
            {subtitle && (
              <p className="mt-2 max-w-3xl text-sm text-slate-400">{subtitle}</p>
            )}
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
