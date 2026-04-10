import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArcadeShell } from '../ArcadeShell';
import { ScorePanel, BossHealthBar } from '../ScorePanel';
import { useArcadeProgress } from '../useArcadeProgress';
import sqlRequirements from '../../data/sql-requirements';
import { highlightSql } from '../../lib/sql-oral';
import type { ProgressState } from '../../types';

type Navigate = (path: string) => void;

interface BossPhase {
  type: 'execute' | 'explain' | 'defend';
  prompt: string;
  checklist: string[];
  timeLimit: number;
}

function buildBossPhases(reqIndex: number): BossPhase[] {
  const req = sqlRequirements[reqIndex % sqlRequirements.length];
  const phases: BossPhase[] = [
    {
      type: 'execute',
      prompt: `Name functionality "${req.title}" and state its business purpose in one sentence.`,
      checklist: [
        `States the functionality title: ${req.title}`,
        `Identifies the business question it answers`,
        `Mentions the key tables involved: ${req.tables.slice(0, 3).join(', ')}`,
      ],
      timeLimit: 30,
    },
    {
      type: 'explain',
      prompt: req.easyQuestion ?? `Explain what the main clause does in the ${req.title} query.`,
      checklist: req.easyChecklist ?? [
        'Uses correct SQL vocabulary',
        'Ties the clause to this specific query',
        'Distinguishes from related clauses',
        'Answers directly without rambling',
      ],
      timeLimit: 45,
    },
    {
      type: 'defend',
      prompt: req.hardQuestion ?? `Why is each JOIN needed in the ${req.title} query? What breaks if you remove one?`,
      checklist: req.hardChecklist ?? [
        'Explains the business logic behind the query',
        'Justifies each major clause choice',
        'Explains what would break if a clause were removed',
        'Interprets the result for bakery decision-making',
      ],
      timeLimit: 60,
    },
  ];
  return phases;
}

export function BossRushGame({ navigate, progress }: { navigate: Navigate; progress: ProgressState }) {
  const arcade = useArcadeProgress();
  const [reqIndex, setReqIndex] = useState(() => Math.floor(Math.random() * sqlRequirements.length));
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [gameState, setGameState] = useState<'select' | 'fighting' | 'phase-result' | 'victory' | 'defeat'>('select');
  const [bossHP, setBossHP] = useState(100);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [phaseScores, setPhaseScores] = useState<number[]>([]);

  const req = sqlRequirements[reqIndex % sqlRequirements.length];
  const phases = useMemo(() => buildBossPhases(reqIndex), [reqIndex]);
  const currentPhase = phases[phaseIndex];

  // Timer
  useState(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 0) {
          setTimerActive(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  });

  function startBattle() {
    setPhaseIndex(0);
    setBossHP(100);
    setChecks({});
    setTotalScore(0);
    setPhaseScores([]);
    setTimer(phases[0].timeLimit);
    setTimerActive(true);
    setGameState('fighting');
  }

  function selectRequirement(idx: number) {
    setReqIndex(idx);
    setGameState('select');
  }

  function submitPhase() {
    const checklist = currentPhase.checklist;
    const checked = checklist.filter((item) => checks[item]).length;
    const ratio = checklist.length > 0 ? checked / checklist.length : 0;
    const phaseScore = Math.round(ratio * 100);
    const damage = Math.round(ratio * 35);

    setBossHP((hp) => Math.max(0, hp - damage));
    setTotalScore((s) => s + phaseScore);
    setPhaseScores((prev) => [...prev, phaseScore]);
    setTimerActive(false);

    if (phaseIndex >= phases.length - 1 || bossHP - damage <= 0) {
      const won = bossHP - damage <= 0;
      setGameState(won ? 'victory' : ratio >= 0.5 ? 'victory' : 'defeat');
      const finalScore = totalScore + phaseScore;
      arcade.recordGameScore({
        gameId: 'boss-rush',
        score: finalScore,
        maxCombo: phaseScores.length + 1,
        accuracy: finalScore / 300,
        completedAt: new Date().toISOString(),
        requirementId: req.id,
      });
    } else {
      setGameState('phase-result');
    }
  }

  function nextPhase() {
    const next = phaseIndex + 1;
    setPhaseIndex(next);
    setChecks({});
    setTimer(phases[next].timeLimit);
    setTimerActive(true);
    setGameState('fighting');
  }

  const phaseLabel = currentPhase?.type === 'execute' ? 'Phase 1: Execute' : currentPhase?.type === 'explain' ? 'Phase 2: Explain' : 'Phase 3: Defend';

  return (
    <ArcadeShell
      title="Professor Boss Rush"
      subtitle="Face the professor. Execute, explain, and defend your SQL under pressure."
      activeZone="boss-rush"
      navigate={navigate}
      scoreBar={<ScorePanel xp={arcade.xp} rank={arcade.rank} streak={arcade.currentStreak} rankProgress={arcade.rankProgress} />}
    >
      {gameState === 'select' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-rose-400/20 bg-[#101826] p-6 text-center">
            <p className="text-5xl mb-3">👨‍🏫</p>
            <h3 className="font-['Orbitron'] text-2xl font-bold text-white">Choose Your Battle</h3>
            <p className="mt-2 text-sm text-slate-400">Select a functionality to defend against the professor.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {sqlRequirements.map((r, idx) => (
              <button
                key={r.id}
                onClick={() => { selectRequirement(idx); }}
                className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
                  idx === reqIndex
                    ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
                    : 'border-slate-700/40 bg-[#101826] text-slate-300 hover:border-slate-600'
                }`}
              >
                <span className="font-mono text-[10px] text-slate-500">#{idx + 1}</span>
                <p className="text-sm font-semibold">{r.title}</p>
              </button>
            ))}
          </div>
          <div className="text-center">
            <button
              onClick={startBattle}
              className="mt-4 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 px-8 py-3 font-['Orbitron'] text-sm font-bold text-white shadow-[0_0_20px_rgba(255,77,109,0.3)] hover:shadow-[0_0_30px_rgba(255,77,109,0.5)] transition-all"
            >
              FIGHT
            </button>
          </div>
        </div>
      )}

      {gameState === 'fighting' && currentPhase && (
        <div className="space-y-4">
          <BossHealthBar name="Professor Hu" hp={bossHP} maxHp={100} phase={phaseLabel} />

          <div className="flex items-center justify-between rounded-xl border border-slate-700/40 bg-[#101826]/80 px-4 py-2">
            <span className="font-mono text-xs text-slate-500">SCORE: <span className="text-cyan-300">{totalScore}</span></span>
            <span className={`font-['Orbitron'] text-lg font-bold ${timer <= 10 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
              {timer}s
            </span>
          </div>

          <div className="rounded-2xl border border-fuchsia-400/20 bg-[#101826] p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-fuchsia-400 mb-2">{phaseLabel}</p>
            <p className="font-['Orbitron'] text-lg font-bold text-white">{currentPhase.prompt}</p>
            <p className="mt-3 text-xs text-slate-500">Speak your answer out loud, then self-check the points below:</p>

            <div className="mt-4 space-y-2">
              {currentPhase.checklist.map((item) => (
                <label
                  key={item}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-all ${
                    checks[item]
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                      : 'border-slate-700/40 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!checks[item]}
                    onChange={(e) => setChecks((prev) => ({ ...prev, [item]: e.target.checked }))}
                    className="mt-0.5 accent-emerald-400"
                  />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </div>

            <button
              onClick={submitPhase}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-['Orbitron'] text-sm font-bold text-white shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] transition-all"
            >
              Submit Answer
            </button>
          </div>
        </div>
      )}

      {gameState === 'phase-result' && (
        <div className="rounded-2xl border border-cyan-400/20 bg-[#101826] p-8 text-center">
          <p className="font-['Orbitron'] text-xl font-bold text-white">Phase Complete</p>
          <p className="mt-2 text-sm text-slate-400">Score: <span className="text-cyan-300">{phaseScores[phaseScores.length - 1]}/100</span></p>
          <p className="mt-1 text-sm text-slate-400">Boss HP: <span className="text-rose-400">{bossHP}/100</span></p>
          <button
            onClick={nextPhase}
            className="mt-6 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-8 py-3 font-['Orbitron'] text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all"
          >
            Next Phase →
          </button>
        </div>
      )}

      {(gameState === 'victory' || gameState === 'defeat') && (
        <div className="rounded-2xl border border-cyan-400/20 bg-[#101826] p-8 text-center">
          <p className="text-5xl mb-4">{gameState === 'victory' ? '🏆' : '💀'}</p>
          <h3 className="font-['Orbitron'] text-2xl font-bold text-white">
            {gameState === 'victory' ? 'Boss Defeated!' : 'Defeated...'}
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            {gameState === 'victory'
              ? `You defended "${req.title}" successfully!`
              : 'Study the weak points and try again.'}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 max-w-md mx-auto">
            {phaseScores.map((s, i) => (
              <div key={i} className="rounded-xl border border-slate-700/40 bg-[#0D1117] p-3">
                <p className="font-mono text-[10px] text-slate-500">PHASE {i + 1}</p>
                <p className="font-['Orbitron'] text-lg font-bold text-cyan-300">{s}/100</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={startBattle} className="rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-600 px-6 py-2.5 font-['Orbitron'] text-sm font-bold text-white">
              Rematch
            </button>
            <button onClick={() => navigate('/arcade')} className="rounded-xl border border-slate-600 px-6 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800/50">
              Lobby
            </button>
          </div>
        </div>
      )}
    </ArcadeShell>
  );
}
