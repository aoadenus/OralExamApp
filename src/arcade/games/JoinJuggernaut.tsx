import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArcadeShell } from '../ArcadeShell';
import { ScorePanel } from '../ScorePanel';
import { useArcadeProgress } from '../useArcadeProgress';
import sqlRequirements from '../../data/sql-requirements';
import type { ProgressState } from '../../types';

type Navigate = (path: string) => void;

interface JoinConnection {
  from: string;
  to: string;
  type: string;
}

function buildPuzzle(reqIndex: number) {
  const req = sqlRequirements[reqIndex % sqlRequirements.length];
  const tables = req.tables;
  const joins: JoinConnection[] = [];
  const breakdown = req.clauseBreakdown ?? [];
  for (const item of breakdown) {
    if (item.clause.toUpperCase().includes('JOIN')) {
      const type = item.clause.toUpperCase().includes('LEFT') ? 'LEFT JOIN' : item.clause.toUpperCase().includes('RIGHT') ? 'RIGHT JOIN' : 'INNER JOIN';
      if (tables.length >= 2) {
        for (let i = 1; i < tables.length; i++) {
          joins.push({ from: tables[i - 1], to: tables[i], type });
        }
      }
      break;
    }
  }
  if (joins.length === 0 && tables.length >= 2) {
    for (let i = 1; i < tables.length; i++) {
      joins.push({ from: tables[i - 1], to: tables[i], type: 'INNER JOIN' });
    }
  }
  return { req, tables, expectedJoins: joins };
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const joinTypes = ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN'];

export function JoinJuggernautGame({ navigate, progress }: { navigate: Navigate; progress: ProgressState }) {
  const arcade = useArcadeProgress();
  const [reqIndex, setReqIndex] = useState(0);
  const [connections, setConnections] = useState<JoinConnection[]>([]);
  const [selectedFrom, setSelectedFrom] = useState<string | null>(null);
  const [selectedJoinType, setSelectedJoinType] = useState('INNER JOIN');
  const [result, setResult] = useState<'correct' | 'partial' | 'wrong' | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);

  const puzzle = useMemo(() => buildPuzzle(reqIndex), [reqIndex]);
  const shuffledTables = useMemo(() => shuffleArray([...puzzle.tables]), [puzzle.req.id]);

  function handleTableClick(table: string) {
    if (result) return;
    if (!selectedFrom) {
      setSelectedFrom(table);
    } else if (selectedFrom === table) {
      setSelectedFrom(null);
    } else {
      setConnections((prev) => [...prev, { from: selectedFrom, to: table, type: selectedJoinType }]);
      setSelectedFrom(null);
    }
  }

  function removeConnection(idx: number) {
    if (result) return;
    setConnections((prev) => prev.filter((_, i) => i !== idx));
  }

  function checkAnswer() {
    const expected = puzzle.expectedJoins;
    let matched = 0;
    for (const exp of expected) {
      const found = connections.some(
        (c) =>
          ((c.from === exp.from && c.to === exp.to) || (c.from === exp.to && c.to === exp.from)) &&
          c.type === exp.type
      );
      if (found) matched++;
    }

    const ratio = expected.length > 0 ? matched / expected.length : connections.length > 0 ? 0.5 : 0;
    const grade = ratio >= 0.8 ? 'correct' : ratio >= 0.4 ? 'partial' : 'wrong';
    setResult(grade);

    const points = grade === 'correct' ? 150 : grade === 'partial' ? 75 : 0;
    setScore((s) => s + points);

    if (grade === 'correct') {
      arcade.addXP(points);
    }
  }

  function nextRound() {
    setReqIndex((i) => (i + 1) % sqlRequirements.length);
    setConnections([]);
    setSelectedFrom(null);
    setResult(null);
    setRound((r) => r + 1);
  }

  return (
    <ArcadeShell
      title="JOIN Juggernaut"
      subtitle="Connect tables with the correct join type to build valid query results."
      activeZone="join-juggernaut"
      navigate={navigate}
      scoreBar={<ScorePanel xp={arcade.xp} rank={arcade.rank} streak={arcade.currentStreak} rankProgress={arcade.rankProgress} />}
    >
      <div className="space-y-4">
        {/* HUD */}
        <div className="flex items-center justify-between rounded-xl border border-slate-700/40 bg-[#101826]/80 px-4 py-2">
          <span className="font-mono text-xs text-slate-500">ROUND <span className="text-white">{round + 1}</span></span>
          <span className="font-mono text-xs text-slate-500">SCORE <span className="font-['Orbitron'] text-cyan-300">{score}</span></span>
        </div>

        {/* Prompt */}
        <div className="rounded-2xl border border-fuchsia-400/20 bg-[#101826] p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-fuchsia-400">Target Query</p>
          <h3 className="mt-2 font-['Orbitron'] text-lg font-bold text-white">{puzzle.req.title}</h3>
          <p className="mt-2 text-sm text-slate-400">{puzzle.req.desc}</p>
        </div>

        {/* Join type selector */}
        <div className="flex gap-2">
          {joinTypes.map((jt) => (
            <button
              key={jt}
              onClick={() => setSelectedJoinType(jt)}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition-all ${
                selectedJoinType === jt
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/50 shadow-[0_0_12px_rgba(124,77,255,0.2)]'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'
              }`}
            >
              {jt}
            </button>
          ))}
        </div>

        {/* Table islands */}
        <div className="rounded-2xl border border-slate-700/40 bg-[#0D1117] p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-4">
            Click two tables to connect them with {selectedJoinType}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {shuffledTables.map((table) => (
              <motion.button
                key={table}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTableClick(table)}
                className={`rounded-xl border-2 px-5 py-4 font-['Orbitron'] text-sm font-bold transition-all ${
                  selectedFrom === table
                    ? 'border-cyan-400 bg-cyan-400/15 text-cyan-300 shadow-[0_0_20px_rgba(0,229,255,0.25)]'
                    : 'border-slate-600 bg-[#101826] text-white hover:border-slate-500'
                }`}
              >
                {table}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Connections made */}
        <div className="rounded-2xl border border-slate-700/40 bg-[#101826] p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3">Your Joins</p>
          {connections.length === 0 ? (
            <p className="text-sm text-slate-500">No joins created yet. Click two tables to connect them.</p>
          ) : (
            <div className="space-y-2">
              {connections.map((conn, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-700/40 bg-[#0D1117] px-3 py-2">
                  <span className="text-sm text-slate-200">
                    <span className="text-cyan-300">{conn.from}</span>
                    <span className="mx-2 text-fuchsia-400">{conn.type}</span>
                    <span className="text-cyan-300">{conn.to}</span>
                  </span>
                  {!result && (
                    <button onClick={() => removeConnection(idx)} className="text-xs text-rose-400 hover:text-rose-300">Remove</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-5 text-center ${
                result === 'correct' ? 'border-emerald-400/30 bg-emerald-400/10' : result === 'partial' ? 'border-amber-400/30 bg-amber-400/10' : 'border-rose-400/30 bg-rose-400/10'
              }`}
            >
              <p className="font-['Orbitron'] text-lg font-bold text-white">
                {result === 'correct' ? '✓ Perfect Joins!' : result === 'partial' ? '~ Partial Match' : '✗ Incorrect'}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Expected: {puzzle.expectedJoins.map((j) => `${j.from} ${j.type} ${j.to}`).join(', ')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-3">
          {!result ? (
            <button onClick={checkAnswer} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 px-6 py-2.5 font-['Orbitron'] text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all">
              Check Joins
            </button>
          ) : (
            <button onClick={nextRound} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 font-['Orbitron'] text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all">
              Next Puzzle →
            </button>
          )}
          <button onClick={() => navigate('/arcade')} className="rounded-xl border border-slate-600 px-6 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800/50">
            Lobby
          </button>
        </div>
      </div>
    </ArcadeShell>
  );
}
