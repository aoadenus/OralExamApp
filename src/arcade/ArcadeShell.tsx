import { type ReactNode, useState } from 'react';
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

const mobileBottomNavZones = navZones.filter((z) =>
  ['lobby', 'clause-blaster', 'boss-rush', 'scoreboard'].includes(z.zone)
);

function NavContent({ activeZone, navigate, onNavClick }: { activeZone?: ArcadeZone; navigate: Navigate; onNavClick?: () => void }) {
  const handleNav = (path: string) => {
    navigate(path);
    onNavClick?.();
  };
  return (
    <>
      <button onClick={() => handleNav('/arcade')} className="mb-6 w-full rounded-2xl border border-cyan-400/20 bg-black/40 p-4 text-left shadow-[0_0_25px_rgba(0,229,255,0.08)] hover:border-cyan-400/40 transition-colors">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400">Stratos</p>
        <h1 className="mt-1 font-['Orbitron'] text-lg font-bold text-white leading-tight">SQL Arcade</h1>
        <p className="mt-1 font-mono text-[10px] text-slate-500">Execute • Explain • Defend</p>
      </button>

      <nav className="space-y-1">
        {navZones.map((item) => {
          const active = activeZone === item.zone;
          return (
            <button
              key={item.zone}
              onClick={() => handleNav(item.path)}
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
          onClick={() => handleNav('/')}
          className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-slate-500 hover:border-slate-700/50 hover:bg-slate-800/40 hover:text-slate-300 transition-all"
        >
          <span className="text-base">📋</span>
          <span className="font-semibold">Classic View</span>
        </button>
      </div>
    </>
  );
}

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 relative overflow-hidden">
      {/* CRT scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.04] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.15)_2px,rgba(255,255,255,0.15)_4px)]" />
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,229,255,0.07),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(124,77,255,0.06),transparent_50%)]" />

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-cyan-400/10 bg-[#0B1220]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <button onClick={() => navigate('/arcade')} className="flex items-center gap-2">
          <span className="text-lg">🕹️</span>
          <span className="font-['Orbitron'] text-sm font-bold text-white">Stratos</span>
        </button>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/50 text-slate-300 hover:bg-slate-800/50 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile slide-out menu */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto bg-[#0B1220] p-4 shadow-2xl lg:hidden">
            <NavContent activeZone={activeZone} navigate={navigate} onNavClick={() => setMobileMenuOpen(false)} />
          </aside>
        </>
      )}

      <div className="relative z-10 flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto border-r border-cyan-400/10 bg-[#0B1220]/95 p-4 backdrop-blur-xl lg:block">
          <NavContent activeZone={activeZone} navigate={navigate} />
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 pb-24 sm:p-5 md:p-6 lg:p-8 lg:pb-8">
          {scoreBar && <div className="mb-4">{scoreBar}</div>}

          <header className="mb-4 rounded-2xl border border-cyan-400/15 bg-[#101826]/80 p-4 shadow-[0_0_30px_rgba(0,229,255,0.06)] sm:mb-6 sm:p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400">
              Execute • Explain • Defend
            </p>
            <h2 className="mt-2 font-['Orbitron'] text-xl font-bold text-white sm:text-2xl md:text-3xl">{title}</h2>
            {subtitle && (
              <p className="mt-2 max-w-3xl text-sm text-slate-400">{subtitle}</p>
            )}
          </header>

          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Arcade mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-cyan-400/10 bg-[#0B1220]/95 px-2 py-2 backdrop-blur-xl lg:hidden"
      >
        {mobileBottomNavZones.map((item) => {
          const active = activeZone === item.zone;
          return (
            <button
              key={item.zone}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-semibold transition-colors ${
                active ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-500'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span className="leading-none">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
