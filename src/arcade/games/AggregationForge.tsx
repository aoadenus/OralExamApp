import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArcadeShell } from '../ArcadeShell';
import { ScorePanel } from '../ScorePanel';
import { useArcadeProgress } from '../useArcadeProgress';
import type { ProgressState } from '../../types';

type Navigate = (path: string) => void;

interface ForgePrompt {
  id: string;
  prompt: string;
  requiredMachines: string[];
  explanation: string;
  hint: string;
}

const machines = ['COUNT', 'SUM', 'AVG', 'GROUP BY', 'DISTINCT', 'COALESCE', 'ROUND', 'HAVING'];

const forgePrompts: ForgePrompt[] = [
  { id: 'f1', prompt: 'Count total orders per customer', requiredMachines: ['COUNT', 'GROUP BY'], explanation: 'COUNT aggregates per customer after GROUP BY splits rows.', hint: 'Need a per-customer aggregate.' },
  { id: 'f2', prompt: 'Total revenue by product category', requiredMachines: ['SUM', 'GROUP BY'], explanation: 'SUM calculates revenue, GROUP BY separates by category.', hint: 'Revenue is a sum of line items.' },
  { id: 'f3', prompt: 'Average order value by sales channel', requiredMachines: ['AVG', 'GROUP BY', 'ROUND'], explanation: 'AVG computes mean value, GROUP BY splits by channel, ROUND formats output.', hint: 'Mean + formatting + grouping.' },
  { id: 'f4', prompt: 'Count unique products sold last month', requiredMachines: ['COUNT', 'DISTINCT'], explanation: 'COUNT(DISTINCT product_id) ensures each product counted once.', hint: 'Unique counting needs DISTINCT.' },
  { id: 'f5', prompt: 'Revenue by category, only categories above $1000', requiredMachines: ['SUM', 'GROUP BY', 'HAVING'], explanation: 'SUM + GROUP BY calculates per-category revenue; HAVING filters grouped results.', hint: 'Post-aggregation filter needed.' },
  { id: 'f6', prompt: 'Handle NULL phone numbers in customer report', requiredMachines: ['COALESCE'], explanation: "COALESCE replaces NULL with a fallback like 'N/A'.", hint: 'NULL safety function.' },
  { id: 'f7', prompt: 'Average rating per product, show 2 decimals', requiredMachines: ['AVG', 'GROUP BY', 'ROUND'], explanation: 'AVG computes mean, ROUND formats to 2 decimal places.', hint: 'Average + formatting.' },
  { id: 'f8', prompt: 'Count distinct suppliers per ingredient category', requiredMachines: ['COUNT', 'DISTINCT', 'GROUP BY'], explanation: 'COUNT(DISTINCT supplier_id) per category via GROUP BY.', hint: 'Unique count within groups.' },
  { id: 'f9', prompt: 'Total + average spending per customer, handle NULLs', requiredMachines: ['SUM', 'AVG', 'GROUP BY', 'COALESCE'], explanation: 'SUM and AVG for spending, GROUP BY per customer, COALESCE for NULL-safe display.', hint: 'Multiple aggregates + NULL safety.' },
  { id: 'f10', prompt: 'Top 5 product categories by count, exclude low sellers', requiredMachines: ['COUNT', 'GROUP BY', 'HAVING'], explanation: 'COUNT per category, GROUP BY category, HAVING filters low counts.', hint: 'Counting + filtering groups.' },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function AggregationForgeGame({ navigate, progress }: { navigate: Navigate; progress: ProgressState }) {
  const arcade = useArcadeProgress();
  const prompts = useMemo(() => shuffleArray(forgePrompts), []);
  const [promptIndex, setPromptIndex] = useState(0);
  const [pipeline, setPipeline] = useState<string[]>([]);
  const [result, setResult] = useState<'correct' | 'partial' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);

  const current = prompts[promptIndex % prompts.length];

  function addMachine(machine: string) {
    if (result) return;
    if (pipeline.includes(machine)) {
      setPipeline((p) => p.filter((m) => m !== machine));
    } else {
      setPipeline((p) => [...p, machine]);
    }
  }

  function checkPipeline() {
    const required = new Set(current.requiredMachines);
    const selected = new Set(pipeline);
    const correct = [...required].filter((m) => selected.has(m)).length;
    const extra = [...selected].filter((m) => !required.has(m)).length;
    const ratio = required.size > 0 ? correct / required.size : 0;
    const penalized = Math.max(0, ratio - extra * 0.15);

    const grade = penalized >= 0.8 ? 'correct' : penalized >= 0.4 ? 'partial' : 'wrong';
    setResult(grade);
    const points = grade === 'correct' ? 120 : grade === 'partial' ? 50 : 0;
    setScore((s) => s + points);
    if (grade === 'correct') {
      setTotalCorrect((c) => c + 1);
      arcade.addXP(points);
    }
  }

  function nextPrompt() {
    if (promptIndex >= prompts.length - 1) {
      arcade.recordGameScore({
        gameId: 'aggregation-forge',
        score,
        maxCombo: totalCorrect,
        accuracy: prompts.length > 0 ? totalCorrect / prompts.length : 0,
        completedAt: new Date().toISOString(),
      });
    }
    setPromptIndex((i) => i + 1);
    setPipeline([]);
    setResult(null);
  }

  const isDone = promptIndex >= prompts.length;

  return (
    <ArcadeShell
      title="Aggregation Forge"
      subtitle="Route raw data through the correct SQL machines to forge results."
      activeZone="aggregation-forge"
      navigate={navigate}
      scoreBar={<ScorePanel xp={arcade.xp} rank={arcade.rank} streak={arcade.currentStreak} rankProgress={arcade.rankProgress} />}
    >
      {isDone ? (
        <div className="rounded-2xl border border-cyan-400/20 bg-[#101826] p-8 text-center">
          <p className="text-5xl mb-4">⚒️</p>
          <h3 className="font-['Orbitron'] text-2xl font-bold text-white">Forge Complete!</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 max-w-sm mx-auto">
            <div className="rounded-xl border border-slate-700/40 bg-[#0D1117] p-3">
              <p className="font-mono text-[10px] text-slate-500">SCORE</p>
              <p className="font-['Orbitron'] text-xl font-bold text-cyan-300">{score}</p>
            </div>
            <div className="rounded-xl border border-slate-700/40 bg-[#0D1117] p-3">
              <p className="font-mono text-[10px] text-slate-500">ACCURACY</p>
              <p className="font-['Orbitron'] text-xl font-bold text-emerald-400">{Math.round((totalCorrect / prompts.length) * 100)}%</p>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => { setPromptIndex(0); setPipeline([]); setResult(null); setScore(0); setTotalCorrect(0); }} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 font-['Orbitron'] text-sm font-bold text-white">Again</button>
            <button onClick={() => navigate('/arcade')} className="rounded-xl border border-slate-600 px-6 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800/50">Lobby</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-700/40 bg-[#101826]/80 px-4 py-2">
            <span className="font-mono text-xs text-slate-500">ROUND <span className="text-white">{promptIndex + 1}/{prompts.length}</span></span>
            <span className="font-mono text-xs text-slate-500">SCORE <span className="font-['Orbitron'] text-cyan-300">{score}</span></span>
          </div>

          {/* Prompt */}
          <div className="rounded-2xl border border-emerald-400/20 bg-[#101826] p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">Forge Order</p>
            <p className="mt-2 font-['Orbitron'] text-lg font-bold text-white">{current.prompt}</p>
            <p className="mt-2 text-xs text-slate-500">💡 {current.hint}</p>
          </div>

          {/* Machine selector */}
          <div className="rounded-2xl border border-slate-700/40 bg-[#0D1117] p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3">Select Machines</p>
            <div className="flex flex-wrap gap-2">
              {machines.map((m) => {
                const active = pipeline.includes(m);
                const isRequired = result && current.requiredMachines.includes(m);
                const isExtra = result && active && !current.requiredMachines.includes(m);
                let style = active
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_12px_rgba(0,245,160,0.15)]'
                  : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:border-slate-600';
                if (result && isRequired && active) style = 'bg-emerald-500/30 text-emerald-300 border-emerald-400/60';
                if (result && isRequired && !active) style = 'bg-amber-500/20 text-amber-300 border-amber-400/50';
                if (result && isExtra) style = 'bg-rose-500/20 text-rose-300 border-rose-400/50';
                return (
                  <button
                    key={m}
                    onClick={() => addMachine(m)}
                    disabled={!!result}
                    className={`rounded-lg border px-4 py-2 font-mono text-xs font-bold transition-all ${style}`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pipeline display */}
          <div className="rounded-xl border border-slate-700/40 bg-[#101826] p-4">
            <p className="font-mono text-[10px] text-slate-500 mb-2">YOUR PIPELINE</p>
            <div className="flex flex-wrap items-center gap-2 min-h-[36px]">
              {pipeline.length === 0 ? (
                <span className="text-sm text-slate-500">Click machines above to build your pipeline.</span>
              ) : (
                pipeline.map((m, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-slate-600">→</span>}
                    <span className="rounded-lg bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 font-mono text-xs font-bold text-emerald-300">{m}</span>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-4 ${result === 'correct' ? 'border-emerald-400/30 bg-emerald-400/10' : result === 'partial' ? 'border-amber-400/30 bg-amber-400/10' : 'border-rose-400/30 bg-rose-400/10'}`}
              >
                <p className="font-['Orbitron'] text-sm font-bold text-white">
                  {result === 'correct' ? '✓ Perfect Pipeline!' : result === 'partial' ? '~ Close' : '✗ Wrong Machines'}
                </p>
                <p className="mt-1 text-sm text-slate-400">{current.explanation}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">Required: {current.requiredMachines.join(' → ')}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3">
            {!result ? (
              <button onClick={checkPipeline} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 font-['Orbitron'] text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all">
                Forge!
              </button>
            ) : (
              <button onClick={nextPrompt} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 font-['Orbitron'] text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all">
                Next →
              </button>
            )}
            <button onClick={() => navigate('/arcade')} className="rounded-xl border border-slate-600 px-6 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800/50">Lobby</button>
          </div>
        </div>
      )}
    </ArcadeShell>
  );
}
