import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArcadeShell } from '../ArcadeShell';
import { ScorePanel } from '../ScorePanel';
import { useArcadeProgress } from '../useArcadeProgress';
import sqlRequirements from '../../data/sql-requirements';
import type { ProgressState } from '../../types';

type Navigate = (path: string) => void;

interface Enemy {
  id: string;
  prompt: string;
  correctClause: string;
  explanation: string;
  reqTitle: string;
  y: number;
  speed: number;
  status: 'falling' | 'hit' | 'missed';
}

const clauseWeapons = ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT', 'GROUP BY', 'JOIN', 'CASE', 'DISTINCT', 'COALESCE', 'NOT IN / NOT EXISTS'];

function buildEnemyPool(): Array<Omit<Enemy, 'id' | 'y' | 'speed' | 'status'>> {
  const pool: Array<Omit<Enemy, 'id' | 'y' | 'speed' | 'status'>> = [];
  for (const req of sqlRequirements) {
    const breakdown = req.clauseBreakdown ?? [];
    for (const item of breakdown) {
      const clause = item.clause.toUpperCase();
      let mapped = clause;
      if (clause.includes('WHERE')) mapped = 'WHERE';
      else if (clause.includes('HAVING')) mapped = 'HAVING';
      else if (clause.includes('ORDER')) mapped = 'ORDER BY';
      else if (clause.includes('LIMIT')) mapped = 'LIMIT';
      else if (clause.includes('GROUP')) mapped = 'GROUP BY';
      else if (clause.includes('JOIN')) mapped = 'JOIN';
      else if (clause.includes('CASE')) mapped = 'CASE';
      else if (clause.includes('SELECT')) continue;
      else if (clause.includes('FROM')) continue;
      else continue;

      pool.push({
        prompt: item.why,
        correctClause: mapped,
        explanation: `${req.title}: ${item.clause} — ${item.why}`,
        reqTitle: req.title,
      });
    }
  }
  if (pool.length === 0) {
    pool.push(
      { prompt: 'Filter rows before grouping', correctClause: 'WHERE', explanation: 'WHERE filters before GROUP BY.', reqTitle: 'General' },
      { prompt: 'Filter after aggregation', correctClause: 'HAVING', explanation: 'HAVING filters grouped results.', reqTitle: 'General' },
      { prompt: 'Sort the final output', correctClause: 'ORDER BY', explanation: 'ORDER BY controls result order.', reqTitle: 'General' },
      { prompt: 'Combine rows into groups', correctClause: 'GROUP BY', explanation: 'GROUP BY aggregates rows.', reqTitle: 'General' },
      { prompt: 'Connect related tables', correctClause: 'JOIN', explanation: 'JOIN reconnects normalized tables.', reqTitle: 'General' },
    );
  }
  return pool;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ClauseBlasterGame({ navigate, progress }: { navigate: Navigate; progress: ProgressState }) {
  const arcade = useArcadeProgress();
  const enemyPool = useMemo(() => shuffleArray(buildEnemyPool()), []);

  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [round, setRound] = useState(0);
  const [selectedWeapon, setSelectedWeapon] = useState<string>('WHERE');
  const [feedback, setFeedback] = useState<{ text: string; correct: boolean } | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'done'>('ready');
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [waveIndex, setWaveIndex] = useState(0);
  const [totalShots, setTotalShots] = useState(0);

  const spawnEnemy = useCallback(() => {
    const template = enemyPool[waveIndex % enemyPool.length];
    const enemy: Enemy = {
      ...template,
      id: `enemy-${Date.now()}-${Math.random()}`,
      y: 0,
      speed: 1 + Math.floor(waveIndex / 5) * 0.3,
      status: 'falling',
    };
    setEnemies((prev) => [...prev, enemy]);
    setWaveIndex((w) => w + 1);
  }, [enemyPool, waveIndex]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(spawnEnemy, 3500 - Math.min(waveIndex * 100, 2000));
    return () => clearInterval(interval);
  }, [gameState, spawnEnemy, waveIndex]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const tick = setInterval(() => {
      setEnemies((prev) => {
        const updated = prev.map((e) =>
          e.status === 'falling' ? { ...e, y: e.y + e.speed * 2 } : e
        );
        const missed = updated.filter((e) => e.y >= 100 && e.status === 'falling');
        if (missed.length > 0) {
          setMisses((m) => m + missed.length);
          setCombo(0);
        }
        return updated
          .map((e) => (e.y >= 100 && e.status === 'falling' ? { ...e, status: 'missed' as const } : e))
          .filter((e) => e.status !== 'missed' || e.y < 120);
      });
    }, 50);
    return () => clearInterval(tick);
  }, [gameState]);

  useEffect(() => {
    if (misses >= 5 && gameState === 'playing') {
      setGameState('done');
      const accuracy = totalShots > 0 ? hits / totalShots : 0;
      arcade.recordGameScore({
        gameId: 'clause-blaster',
        score,
        maxCombo,
        accuracy,
        completedAt: new Date().toISOString(),
      });
    }
  }, [misses, gameState]);

  function fireWeapon(targetId: string) {
    if (gameState !== 'playing') return;
    const target = enemies.find((e) => e.id === targetId && e.status === 'falling');
    if (!target) return;

    setTotalShots((s) => s + 1);
    const correct = target.correctClause === selectedWeapon;

    if (correct) {
      const comboBonus = Math.min(combo, 10) * 5;
      const points = 100 + comboBonus;
      setScore((s) => s + points);
      setCombo((c) => {
        const next = c + 1;
        setMaxCombo((m) => Math.max(m, next));
        return next;
      });
      setHits((h) => h + 1);
      setEnemies((prev) => prev.map((e) => (e.id === targetId ? { ...e, status: 'hit' as const } : e)));
      setFeedback({ text: `✓ ${target.correctClause} — +${points}`, correct: true });
    } else {
      setCombo(0);
      setFeedback({ text: `✗ Needed: ${target.correctClause}`, correct: false });
    }

    setTimeout(() => setFeedback(null), 1500);
    setTimeout(() => {
      setEnemies((prev) => prev.filter((e) => e.id !== targetId || e.status === 'falling'));
    }, 400);
  }

  function startGame() {
    setEnemies([]);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setHits(0);
    setMisses(0);
    setTotalShots(0);
    setWaveIndex(0);
    setGameState('playing');
  }

  return (
    <ArcadeShell
      title="Clause Blaster"
      subtitle="Enemies drop SQL prompts. Select your clause weapon and fire!"
      activeZone="clause-blaster"
      navigate={navigate}
      scoreBar={
        <ScorePanel xp={arcade.xp} rank={arcade.rank} streak={arcade.currentStreak} rankProgress={arcade.rankProgress} />
      }
    >
      {gameState === 'ready' && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-cyan-400/20 bg-[#101826] p-12 text-center">
          <p className="text-5xl mb-4">🔫</p>
          <h3 className="font-['Orbitron'] text-2xl font-bold text-white">Ready to Blast?</h3>
          <p className="mt-3 max-w-md text-sm text-slate-400">
            SQL prompts will drop from above. Select the correct clause weapon, then click the enemy to destroy it. 5 misses and it's game over.
          </p>
          <button
            onClick={startGame}
            className="mt-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3 font-['Orbitron'] text-sm font-bold text-white shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all"
          >
            INSERT COIN
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-4">
          {/* HUD */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700/40 bg-[#101826]/80 px-4 py-2">
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-slate-500">SCORE</span>
              <span className="font-['Orbitron'] text-lg font-bold text-cyan-300">{score}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-slate-500">COMBO</span>
              <span className="font-['Orbitron'] text-lg font-bold text-amber-400">{combo}x</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-slate-500">LIVES</span>
              <span className="font-['Orbitron'] text-lg font-bold text-rose-400">{5 - misses}</span>
            </div>
          </div>

          {/* Weapon selector */}
          <div className="flex flex-wrap gap-2">
            {clauseWeapons.map((w) => (
              <button
                key={w}
                onClick={() => setSelectedWeapon(w)}
                className={`rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition-all ${
                  selectedWeapon === w
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          {/* Battle area */}
          <div className="relative h-[300px] sm:h-[400px] overflow-hidden rounded-2xl border border-slate-700/40 bg-[#0D1117]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <AnimatePresence>
              {enemies.filter((e) => e.status === 'falling').map((enemy) => (
                <motion.button
                  key={enemy.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  onClick={() => fireWeapon(enemy.id)}
                  className="absolute left-1/2 -translate-x-1/2 w-[80%] max-w-md rounded-xl border border-rose-400/30 bg-[#1a1025] px-4 py-3 text-left cursor-crosshair hover:border-rose-400/60 hover:bg-rose-400/10 transition-colors"
                  style={{ top: `${Math.min(enemy.y, 85)}%` }}
                >
                  <p className="text-xs font-semibold text-rose-300">{enemy.reqTitle}</p>
                  <p className="mt-1 text-sm text-slate-200">{enemy.prompt}</p>
                </motion.button>
              ))}
            </AnimatePresence>

            {/* Feedback popup */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl px-6 py-3 font-['Orbitron'] text-sm font-bold shadow-lg ${
                    feedback.correct
                      ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                      : 'bg-rose-500/20 border border-rose-400/40 text-rose-300'
                  }`}
                >
                  {feedback.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom danger zone */}
            <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-rose-500/10 to-transparent border-t border-rose-400/20" />
          </div>
        </div>
      )}

      {gameState === 'done' && (
        <div className="rounded-2xl border border-cyan-400/20 bg-[#101826] p-8 text-center">
          <p className="text-5xl mb-4">🎮</p>
          <h3 className="font-['Orbitron'] text-2xl font-bold text-white">Game Over</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-3 max-w-lg mx-auto">
            <div className="rounded-xl border border-slate-700/40 bg-[#0D1117] p-3">
              <p className="font-mono text-[10px] text-slate-500">SCORE</p>
              <p className="font-['Orbitron'] text-xl font-bold text-cyan-300">{score}</p>
            </div>
            <div className="rounded-xl border border-slate-700/40 bg-[#0D1117] p-3">
              <p className="font-mono text-[10px] text-slate-500">MAX COMBO</p>
              <p className="font-['Orbitron'] text-xl font-bold text-amber-400">{maxCombo}x</p>
            </div>
            <div className="rounded-xl border border-slate-700/40 bg-[#0D1117] p-3">
              <p className="font-mono text-[10px] text-slate-500">ACCURACY</p>
              <p className="font-['Orbitron'] text-xl font-bold text-emerald-400">
                {totalShots > 0 ? Math.round((hits / totalShots) * 100) : 0}%
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={startGame}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 font-['Orbitron'] text-sm font-bold text-white shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] transition-all"
            >
              Play Again
            </button>
            <button
              onClick={() => navigate('/arcade')}
              className="rounded-xl border border-slate-600 px-6 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800/50 transition-all"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      )}
    </ArcadeShell>
  );
}
