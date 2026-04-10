import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArcadeShell } from '../ArcadeShell';
import { ScorePanel } from '../ScorePanel';
import { useArcadeProgress } from '../useArcadeProgress';
import sqlRequirements from '../../data/sql-requirements';
import type { ProgressState } from '../../types';

type Navigate = (path: string) => void;

interface Lane {
  id: string;
  label: string;
  sqlHint: string;
}

interface Prompt {
  id: string;
  text: string;
  correctLaneId: string;
  explanation: string;
  reqTitle: string;
}

const lanes: Lane[] = [
  { id: 'last-month', label: 'Last Month', sqlHint: ">= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND < DATE_TRUNC('month', CURRENT_DATE)" },
  { id: 'current-quarter', label: 'Current Quarter', sqlHint: ">= DATE_TRUNC('quarter', CURRENT_DATE)" },
  { id: 'last-quarter', label: 'Last Quarter', sqlHint: ">= DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '3 months') AND < DATE_TRUNC('quarter', CURRENT_DATE)" },
  { id: 'past-year', label: 'Past Year', sqlHint: ">= CURRENT_DATE - INTERVAL '1 year'" },
  { id: 'before-promo', label: 'Before Promo', sqlHint: "< promo_start_date" },
];

function buildPrompts(): Prompt[] {
  const prompts: Prompt[] = [
    { id: 'p1', text: 'Find best-selling products last month', correctLaneId: 'last-month', explanation: 'Uses half-open month interval with DATE_TRUNC.', reqTitle: 'Product Sales' },
    { id: 'p2', text: 'Total spending by supplier this quarter', correctLaneId: 'current-quarter', explanation: 'Filters from start of current quarter to now.', reqTitle: 'Supplier Costs' },
    { id: 'p3', text: 'Revenue by category last quarter', correctLaneId: 'last-quarter', explanation: 'Uses DATE_TRUNC quarter minus 3 months interval.', reqTitle: 'Category Revenue' },
    { id: 'p4', text: 'Customer orders over the past year', correctLaneId: 'past-year', explanation: "Uses CURRENT_DATE minus '1 year' interval.", reqTitle: 'Customer Orders' },
    { id: 'p5', text: 'Sales before the January promotion', correctLaneId: 'before-promo', explanation: 'Filters for dates before the promotion start.', reqTitle: 'Promo Impact' },
    { id: 'p6', text: 'Employee performance last month', correctLaneId: 'last-month', explanation: 'Same half-open month pattern for recent performance.', reqTitle: 'Top Employees' },
    { id: 'p7', text: 'Inventory restocked last quarter', correctLaneId: 'last-quarter', explanation: 'Quarter boundary filtering for restock events.', reqTitle: 'Inventory' },
    { id: 'p8', text: 'New loyalty signups this quarter', correctLaneId: 'current-quarter', explanation: 'Current quarter from DATE_TRUNC to now.', reqTitle: 'Loyalty Analysis' },
    { id: 'p9', text: 'Average ratings over the past year', correctLaneId: 'past-year', explanation: 'Rolling year lookback for quality trends.', reqTitle: 'Product Ratings' },
    { id: 'p10', text: 'Baseline revenue before holiday promo', correctLaneId: 'before-promo', explanation: 'Pre-promo comparison window.', reqTitle: 'Promo Comparison' },
  ];
  return prompts;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TimeWindowRushGame({ navigate, progress }: { navigate: Navigate; progress: ProgressState }) {
  const arcade = useArcadeProgress();
  const allPrompts = useMemo(() => shuffleArray(buildPrompts()), []);
  const [promptIndex, setPromptIndex] = useState(0);
  const [selectedLane, setSelectedLane] = useState<string | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'done'>('ready');
  const [timer, setTimer] = useState(8);

  const currentPrompt = allPrompts[promptIndex % allPrompts.length];

  useEffect(() => {
    if (gameState !== 'playing' || result) return;
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, result, promptIndex]);

  function handleTimeout() {
    setResult('wrong');
    setStreak(0);
    setTotalAnswered((a) => a + 1);
  }

  function selectLane(laneId: string) {
    if (result || gameState !== 'playing') return;
    setSelectedLane(laneId);
    const correct = laneId === currentPrompt.correctLaneId;
    setResult(correct ? 'correct' : 'wrong');
    setTotalAnswered((a) => a + 1);

    if (correct) {
      const timeBonus = timer * 10;
      const streakBonus = streak * 15;
      setScore((s) => s + 100 + timeBonus + streakBonus);
      setStreak((s) => s + 1);
      setTotalCorrect((c) => c + 1);
    } else {
      setStreak(0);
    }
  }

  function nextPrompt() {
    if (promptIndex >= allPrompts.length - 1) {
      setGameState('done');
      const accuracy = totalAnswered > 0 ? totalCorrect / totalAnswered : 0;
      arcade.recordGameScore({
        gameId: 'time-window-rush',
        score,
        maxCombo: streak,
        accuracy,
        completedAt: new Date().toISOString(),
      });
      return;
    }
    setPromptIndex((i) => i + 1);
    setSelectedLane(null);
    setResult(null);
    setTimer(8);
  }

  function startGame() {
    setPromptIndex(0);
    setSelectedLane(null);
    setResult(null);
    setScore(0);
    setStreak(0);
    setTotalCorrect(0);
    setTotalAnswered(0);
    setTimer(8);
    setGameState('playing');
  }

  return (
    <ArcadeShell
      title="Time Window Rush"
      subtitle="Pick the correct date-filter lane before time runs out!"
      activeZone="time-window-rush"
      navigate={navigate}
      scoreBar={<ScorePanel xp={arcade.xp} rank={arcade.rank} streak={arcade.currentStreak} rankProgress={arcade.rankProgress} />}
    >
      {gameState === 'ready' && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-400/20 bg-[#101826] p-12 text-center">
          <p className="text-5xl mb-4">⏱️</p>
          <h3 className="font-['Orbitron'] text-2xl font-bold text-white">Time Window Rush</h3>
          <p className="mt-3 max-w-md text-sm text-slate-400">
            A date-related prompt appears. Choose the correct time-window lane before the timer expires. Faster answers earn bonus points.
          </p>
          <button onClick={startGame} className="mt-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-3 font-['Orbitron'] text-sm font-bold text-white shadow-[0_0_20px_rgba(255,184,0,0.3)] hover:shadow-[0_0_30px_rgba(255,184,0,0.5)] transition-all">
            START
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-700/40 bg-[#101826]/80 px-4 py-2">
            <span className="font-mono text-xs text-slate-500">SCORE <span className="text-cyan-300 font-['Orbitron']">{score}</span></span>
            <span className="font-mono text-xs text-slate-500">STREAK <span className="text-amber-400 font-['Orbitron']">{streak}🔥</span></span>
            <span className={`font-['Orbitron'] text-lg font-bold ${timer <= 3 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>{timer}s</span>
            <span className="font-mono text-xs text-slate-500">{promptIndex + 1}/{allPrompts.length}</span>
          </div>

          <div className="rounded-2xl border border-amber-400/20 bg-[#101826] p-5 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-amber-400">{currentPrompt.reqTitle}</p>
            <p className="mt-2 font-['Orbitron'] text-lg font-bold text-white">{currentPrompt.text}</p>
          </div>

          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            {lanes.map((lane) => {
              const isSelected = selectedLane === lane.id;
              const isCorrect = lane.id === currentPrompt.correctLaneId;
              let style = 'border-slate-700/40 bg-[#101826] text-slate-300 hover:border-slate-500';
              if (result) {
                if (isCorrect) style = 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300 shadow-[0_0_15px_rgba(0,245,160,0.15)]';
                else if (isSelected && !isCorrect) style = 'border-rose-400/50 bg-rose-400/15 text-rose-300';
              }
              return (
                <button
                  key={lane.id}
                  onClick={() => selectLane(lane.id)}
                  disabled={!!result}
                  className={`rounded-xl border-2 px-3 py-4 text-center transition-all ${style}`}
                >
                  <p className="font-['Orbitron'] text-sm font-bold">{lane.label}</p>
                  <p className="mt-1 font-mono text-[9px] text-slate-500 leading-tight">{lane.sqlHint.slice(0, 40)}...</p>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-4 ${result === 'correct' ? 'border-emerald-400/30 bg-emerald-400/10' : 'border-rose-400/30 bg-rose-400/10'}`}
              >
                <p className="font-['Orbitron'] text-sm font-bold text-white">{result === 'correct' ? '✓ Correct!' : '✗ Wrong lane'}</p>
                <p className="mt-1 text-sm text-slate-400">{currentPrompt.explanation}</p>
                <button onClick={nextPrompt} className="mt-3 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                  {promptIndex >= allPrompts.length - 1 ? 'See Results' : 'Next →'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {gameState === 'done' && (
        <div className="rounded-2xl border border-cyan-400/20 bg-[#101826] p-8 text-center">
          <p className="text-5xl mb-4">🏁</p>
          <h3 className="font-['Orbitron'] text-2xl font-bold text-white">Run Complete!</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3 max-w-md mx-auto">
            <div className="rounded-xl border border-slate-700/40 bg-[#0D1117] p-3">
              <p className="font-mono text-[10px] text-slate-500">SCORE</p>
              <p className="font-['Orbitron'] text-xl font-bold text-cyan-300">{score}</p>
            </div>
            <div className="rounded-xl border border-slate-700/40 bg-[#0D1117] p-3">
              <p className="font-mono text-[10px] text-slate-500">ACCURACY</p>
              <p className="font-['Orbitron'] text-xl font-bold text-emerald-400">{totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0}%</p>
            </div>
            <div className="rounded-xl border border-slate-700/40 bg-[#0D1117] p-3">
              <p className="font-mono text-[10px] text-slate-500">BEST STREAK</p>
              <p className="font-['Orbitron'] text-xl font-bold text-amber-400">{streak}🔥</p>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={startGame} className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2.5 font-['Orbitron'] text-sm font-bold text-white">Play Again</button>
            <button onClick={() => navigate('/arcade')} className="rounded-xl border border-slate-600 px-6 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800/50">Lobby</button>
          </div>
        </div>
      )}
    </ArcadeShell>
  );
}
