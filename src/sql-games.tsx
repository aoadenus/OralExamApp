import { useMemo, useState } from 'react';
import sqlRequirements from './data/sql-requirements';
import { getItemProgress, masteryLabel } from './lib/progress';
import type { MasteryResult, ProgressState, SqlRequirement } from './types';

type Navigate = (path: string) => void;

type ProgressStoreLike = {
  progress: ProgressState;
  recordAttempt: (itemId: string, result: MasteryResult, confidence: number) => void;
};

type GameMode = 'intro' | 'matching' | 'scramble' | 'bug-hunter' | 'professor';

const modeCards: Array<{ mode: GameMode; title: string; subtitle: string }> = [
  { mode: 'intro', title: 'Intro to SQL Games', subtitle: 'Prime your mental model before timed practice.' },
  { mode: 'matching', title: 'Matching Game', subtitle: 'Match business goals to the correct SQL requirement.' },
  { mode: 'scramble', title: 'Clause Scramble', subtitle: 'Rebuild query logic in a defensible clause order.' },
  { mode: 'bug-hunter', title: 'Bug Hunter', subtitle: 'Identify oral-exam mistakes before the professor does.' },
  { mode: 'professor', title: 'Professor Simulator', subtitle: 'Answer concise prompts and get checklist coaching.' },
];

export function SqlGamesLab({ navigate, progressStore }: { navigate: Navigate; progressStore: ProgressStoreLike }) {
  const [mode, setMode] = useState<GameMode>('intro');

  return (
    <section className="layout-safe space-y-4">
      {/* Compact header for side navigation layout */}
<header className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
  <div className="flex items-center justify-between gap-2">
    <h1 className="text-lg font-bold text-slate-950">SQL Games</h1>
  </div>
</header>

      <div className="grid gap-3 md:grid-cols-5">
        {modeCards.map((item) => (
          <button
            key={item.mode}
            onClick={() => setMode(item.mode)}
            className={`rounded-xl border p-3 text-left transition ${
              mode === item.mode ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <p className="text-sm font-bold text-slate-900">{item.title}</p>
            <p className="mt-1 text-xs text-slate-600">{item.subtitle}</p>
          </button>
        ))}
      </div>

      {mode === 'intro' && <IntroSqlGames navigate={navigate} progressStore={progressStore} onJump={setMode} />}
      {mode === 'matching' && <MatchingGame progressStore={progressStore} />}
      {mode === 'scramble' && <ClauseScrambleGame progressStore={progressStore} />}
      {mode === 'bug-hunter' && <BugHunterGame progressStore={progressStore} />}
      {mode === 'professor' && <ProfessorSimulatorGame progressStore={progressStore} />}
    </section>
  );
}

function IntroSqlGames({
  navigate,
  progressStore,
  onJump,
}: {
  navigate: Navigate;
  progressStore: ProgressStoreLike;
  onJump: (mode: GameMode) => void;
}) {
  const readiness =
    sqlRequirements.reduce((sum, req) => sum + getItemProgress(progressStore.progress, req.id).mastery, 0) /
    Math.max(1, sqlRequirements.length);
  const attempted = sqlRequirements.filter((req) => getItemProgress(progressStore.progress, req.id).attempts > 0).length;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <article className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-white to-indigo-50 p-5">
        <h2 className="text-xl font-extrabold text-slate-950">How to Use the Games Like a Professor</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>Start with Matching to connect each requirement title to business meaning.</li>
          <li>Move to Clause Scramble to verbalize the order and purpose of each clause.</li>
          <li>Use Bug Hunter to catch analytical errors under pressure.</li>
          <li>Finish with Professor Simulator to speak answers with checklist discipline.</li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => onJump('matching')}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Begin Matching
          </button>
          <button
            onClick={() => onJump('professor')}
            className="rounded-lg border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            Jump to Professor Simulator
          </button>
          <button
            onClick={() => navigate('/sql-flashcards')}
            className="rounded-lg border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            Open SQL Flashcards
          </button>
          <button
            onClick={() => navigate('/sql-execution')}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Execution Lab
          </button>
          <button
            onClick={() => navigate('/sql-study')}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Night Before Drill
          </button>
        </div>
      </article>

      <aside className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Readiness snapshot</h3>
        <p className="mt-2 text-4xl font-extrabold text-slate-950">{Math.round(readiness * 100)}%</p>
        <p className="mt-2 text-sm text-slate-600">Requirements attempted: {attempted} / {sqlRequirements.length}</p>
        <p className="mt-1 text-sm text-slate-600">Current level: {masteryLabel(readiness)}</p>
      </aside>
    </div>
  );
}

function MatchingGame({ progressStore }: { progressStore: ProgressStoreLike }) {
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const current = useMemo(() => buildMatchingRound(round), [round]);

  function scoreAndReveal(optionId: string) {
    if (revealed) return;
    setSelected(optionId);
    setRevealed(true);

    const isCorrect = optionId === current.correctId;
    progressStore.recordAttempt(current.requirementId, isCorrect ? 'correct' : 'partial', isCorrect ? 4 : 3);
  }

  function nextRound() {
    setRound((value) => value + 1);
    setSelected(null);
    setRevealed(false);
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-fuchsia-700">Matching Game</p>
      <h2 className="mt-1 text-xl font-extrabold text-slate-950">Match Requirement to Business Meaning</h2>
      <p className="mt-2 text-sm text-slate-600">Prompt: <span className="font-semibold text-slate-900">{current.title}</span></p>

      <div className="mt-4 grid gap-2">
        {current.options.map((option) => {
          const isCorrect = option.id === current.correctId;
          const isChosen = option.id === selected;

          let tone = 'border-slate-200 hover:border-slate-300';
          if (revealed && isCorrect) tone = 'border-emerald-300 bg-emerald-50';
          if (revealed && isChosen && !isCorrect) tone = 'border-rose-300 bg-rose-50';

          return (
            <button
              key={option.id}
              onClick={() => scoreAndReveal(option.id)}
              disabled={revealed}
              className={`rounded-xl border p-3 text-left text-sm text-slate-700 transition ${tone}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
          <p className="text-sm text-indigo-900">
            {selected === current.correctId ? 'Excellent match. Your business framing is exam-ready.' : 'Close. Anchor your explanation to decision-making impact, not only SQL mechanics.'}
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button onClick={nextRound} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          Next Round
        </button>
      </div>
    </article>
  );
}

function ClauseScrambleGame({ progressStore }: { progressStore: ProgressStoreLike }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const req = sqlRequirements[index % sqlRequirements.length];
  const canonical = (req.clauseBreakdown ?? []).map((item) => item.clause);
  const shuffled = useMemo(() => shuffleArray([...canonical]), [req.id]);

  const remaining = shuffled.filter((clause) => !picked.includes(clause));

  function chooseClause(clause: string) {
    if (picked.includes(clause)) return;
    setPicked((prev) => [...prev, clause]);
  }

  function resetRound() {
    setPicked([]);
  }

  function checkOrder() {
    if (picked.length === 0) return;
    const exact = canonical.every((clause, idx) => picked[idx] === clause);
    const aligned = canonical.filter((clause, idx) => picked[idx] === clause).length;
    const ratio = canonical.length === 0 ? 0 : aligned / canonical.length;
    const result: MasteryResult = exact ? 'correct' : ratio >= 0.5 ? 'partial' : 'incorrect';
    const confidence = result === 'correct' ? 5 : result === 'partial' ? 3 : 2;
    progressStore.recordAttempt(req.id, result, confidence);
  }

  function nextRequirement() {
    setIndex((value) => value + 1);
    setPicked([]);
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Clause Scramble</p>
      <h2 className="mt-1 text-xl font-extrabold text-slate-950">{req.title}</h2>
      <p className="mt-2 text-sm text-slate-600">Place clauses in a defensible explanation order.</p>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Your order</p>
        <div className="mt-2 flex min-h-[42px] flex-wrap gap-2">
          {picked.length === 0 ? <span className="text-sm text-slate-500">No clauses selected yet.</span> : null}
          {picked.map((clause) => (
            <span key={clause} className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-900">
              {clause}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {remaining.map((clause) => (
          <button
            key={clause}
            onClick={() => chooseClause(clause)}
            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {clause}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={checkOrder} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          Score Order
        </button>
        <button onClick={resetRound} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Reset
        </button>
        <button onClick={nextRequirement} className="rounded-lg border border-sky-300 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50">
          Next Requirement
        </button>
      </div>
    </article>
  );
}

function BugHunterGame({ progressStore }: { progressStore: ProgressStoreLike }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const req = sqlRequirements[index % sqlRequirements.length];
  const scenario = buildBugScenario(req, index);

  function submit(choice: string) {
    if (revealed) return;
    setSelected(choice);
    setRevealed(true);
    const correct = choice === scenario.correct;
    progressStore.recordAttempt(req.id, correct ? 'correct' : 'partial', correct ? 4 : 2);
  }

  function next() {
    setIndex((value) => value + 1);
    setSelected(null);
    setRevealed(false);
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Bug Hunter</p>
      <h2 className="mt-1 text-xl font-extrabold text-slate-950">{req.title}</h2>
      <p className="mt-2 text-sm text-slate-600">Find the highest-risk mistake in this oral explanation scenario.</p>

      <pre className="mt-3 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-3 text-xs leading-6 text-slate-100">
{scenario.snippet}
      </pre>

      <div className="mt-4 grid gap-2">
        {scenario.options.map((option) => {
          const isCorrect = option === scenario.correct;
          const isPicked = option === selected;
          let tone = 'border-slate-200';
          if (revealed && isCorrect) tone = 'border-emerald-300 bg-emerald-50';
          if (revealed && isPicked && !isCorrect) tone = 'border-rose-300 bg-rose-50';

          return (
            <button
              key={option}
              onClick={() => submit(option)}
              disabled={revealed}
              className={`rounded-xl border p-3 text-left text-sm text-slate-700 ${tone}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {revealed ? (
        <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{scenario.coaching}</p>
      ) : null}

      <button onClick={next} className="mt-4 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">
        Next Scenario
      </button>
    </article>
  );
}

function ProfessorSimulatorGame({ progressStore }: { progressStore: ProgressStoreLike }) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * sqlRequirements.length));
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<{ score: number; total: number; missed: string[] } | null>(null);
  const req = sqlRequirements[index % sqlRequirements.length];
  const prompt = req.oralQuestions?.[index % Math.max(1, req.oralQuestions?.length ?? 1)] ?? `Explain ${req.title} in business terms.`;

  function evaluate() {
    const checks = req.checklist;
    const normalized = answer.toLowerCase();
    const matched = checks.filter((line) => {
      const tokens = line
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length >= 4)
        .slice(0, 3);
      return tokens.some((token) => normalized.includes(token));
    });

    const score = matched.length;
    const total = checks.length;
    const ratio = total === 0 ? 0 : score / total;
    const mastery: MasteryResult = ratio >= 0.75 ? 'correct' : ratio >= 0.4 ? 'partial' : 'incorrect';
    progressStore.recordAttempt(req.id, mastery, mastery === 'correct' ? 5 : mastery === 'partial' ? 3 : 2);
    setFeedback({ score, total, missed: checks.filter((line) => !matched.includes(line)) });
  }

  function nextPrompt() {
    setIndex((value) => value + 1);
    setAnswer('');
    setFeedback(null);
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Professor Simulator</p>
      <h2 className="mt-1 text-xl font-extrabold text-slate-950">{req.title}</h2>
      <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{prompt}</p>

      <textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        className="mt-4 min-h-[160px] w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-slate-500"
        placeholder="Answer as if your professor asked for clause-level justification and business interpretation."
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={evaluate}
          disabled={answer.trim().length < 12}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Evaluate Answer
        </button>
        <button onClick={nextPrompt} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Next Prompt
        </button>
      </div>

      {feedback ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-900">Checklist coverage: {feedback.score} / {feedback.total}</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {feedback.missed.length === 0 ? <li>Complete coverage. Excellent oral structure.</li> : feedback.missed.map((line) => <li key={line}>- {line}</li>)}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function buildMatchingRound(round: number) {
  const current = sqlRequirements[round % sqlRequirements.length];
  const distractors = sqlRequirements
    .filter((item) => item.id !== current.id)
    .slice((round * 3) % Math.max(1, sqlRequirements.length - 1), ((round * 3) % Math.max(1, sqlRequirements.length - 1)) + 3);

  const options = shuffleArray([
    {
      id: current.id,
      label: current.businessMeaning ?? 'Explain the practical business use of this requirement.',
    },
    ...distractors.map((item) => ({
      id: item.id,
      label: item.businessMeaning ?? 'Explain the practical business use of this requirement.',
    })),
  ]).slice(0, 4);

  return {
    title: current.title,
    correctId: current.id,
    requirementId: current.id,
    options,
  };
}

function buildBugScenario(req: SqlRequirement, index: number) {
  const scenarios = [
    {
      snippet: `SELECT ...\nFROM ...\nJOIN ...\nWHERE ...\nGROUP BY ...\nORDER BY ...`,
      correct: 'The explanation skipped why GROUP BY is required for aggregates.',
      options: [
        'The explanation skipped why GROUP BY is required for aggregates.',
        'The query should remove all JOIN clauses.',
        'The query must always include UNION ALL.',
        'The ORDER BY clause always belongs before WHERE.',
      ],
      coaching: 'When aggregate functions appear, explicitly justify grouping grain and business unit of analysis.',
    },
    {
      snippet: `SELECT ...\nFROM orders o\nJOIN customers c ON o.customer_id = c.customer_id\nWHERE ...`,
      correct: 'The speaker did not justify the JOIN path using entity relationships.',
      options: [
        'The speaker did not justify the JOIN path using entity relationships.',
        'All aliases should be removed in oral explanations.',
        'Primary keys cannot appear in JOIN conditions.',
        'The query should never filter in WHERE.',
      ],
      coaching: 'In oral defense, tie every JOIN back to ERD cardinality and foreign-key intent.',
    },
    {
      snippet: `SELECT ...\nFROM ...\nWHERE date_col >= ...\nAND status = ...`,
      correct: 'The explanation gave syntax but not business interpretation of filters.',
      options: [
        'The explanation gave syntax but not business interpretation of filters.',
        'WHERE cannot contain more than one condition.',
        'Only text columns can be filtered.',
        'Filters should always be in HAVING.',
      ],
      coaching: 'Professor-level answers translate each filter into a business rule and reporting scope.',
    },
  ];

  const picked = scenarios[index % scenarios.length];
  return {
    ...picked,
    snippet: `${picked.snippet}\n\n-- Requirement Context: ${req.title}`,
  };
}

function shuffleArray<T>(arr: T[]) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
