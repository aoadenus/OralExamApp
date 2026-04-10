import { useMemo, useState } from 'react';
import sqlRequirementsData from './data/sql-requirements.json';
import { getItemProgress, masteryLabel } from './lib/progress';
import type { MasteryResult, ProgressState, SqlNote, SqlRequirement } from './types';

type Navigate = (path: string) => void;

type ProgressStoreLike = {
  progress: ProgressState;
  recordAttempt: (itemId: string, result: MasteryResult, confidence: number) => void;
  resetAll: () => void;
};

const sqlRequirements = sqlRequirementsData as SqlRequirement[];

export function SqlExamBanner({ navigate }: { navigate: Navigate }) {
  return (
    <section className="mb-6 rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">Mama's Little Bakery</p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-950">SQL Oral Trainer</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Study the 15 bakery functionality requirements with oral-first panels built for MySQL Workbench + AWS exam explanations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/sql-study')}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
          >
            Open SQL Study
          </button>
          <button
            onClick={() => navigate('/sql-rapid-fire')}
            className="rounded-lg border border-cyan-300 bg-white px-4 py-2 text-sm font-semibold text-cyan-800 hover:bg-cyan-50"
          >
            Night Before Exam
          </button>
        </div>
      </div>
    </section>
  );
}

export function SqlStudyGuide({
  navigate,
  progressStore,
  initialRapidFire = false,
}: {
  navigate: Navigate;
  progressStore: ProgressStoreLike;
  initialRapidFire?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [rapidFire, setRapidFire] = useState(initialRapidFire);
  const [revealed, setRevealed] = useState(!initialRapidFire);
  const req = sqlRequirements[activeIndex];
  const itemProgress = getItemProgress(progressStore.progress, req.id);
  const checkedCount = req.checklist.filter((line) => checked[line]).length;

  function selectRequirement(idx: number) {
    setActiveIndex(idx);
    setChecked({});
    setRevealed(!rapidFire);
  }

  function moveNext() {
    setActiveIndex((current) => (current + 1) % sqlRequirements.length);
    setChecked({});
    setRevealed(!rapidFire);
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Mama's Little Bakery SQL Oral Trainer</p>
            <h1 className="text-2xl font-extrabold text-slate-950">15 Functional Requirements Study Guide</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const next = !rapidFire;
                setRapidFire(next);
                setRevealed(!next);
              }}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${rapidFire ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
            >
              {rapidFire ? 'Rapid Fire: ON' : 'Rapid Fire: OFF'}
            </button>
            <button
              onClick={() => navigate('/sql-flashcards')}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              SQL Flashcards
            </button>
            <button
              onClick={() => navigate('/sql-mock-oral')}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              SQL Mock Oral
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Bakery Requirement List</p>
          <div className="max-h-[72vh] space-y-1 overflow-auto pr-1">
            {sqlRequirements.map((item, idx) => {
              const active = idx === activeIndex;
              const progress = getItemProgress(progressStore.progress, item.id);
              const dotClass =
                progress.attempts === 0
                  ? 'bg-slate-300'
                  : progress.mastery >= 0.75
                    ? 'bg-emerald-500'
                    : progress.mastery >= 0.4
                      ? 'bg-amber-500'
                      : 'bg-rose-500';

              return (
                <button
                  key={item.id}
                  onClick={() => selectRequirement(idx)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    active
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-500">{idx + 1}</p>
                    <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">#{activeIndex + 1} {req.category}</p>
                  <h2 className="text-xl font-extrabold text-slate-950">{req.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{req.desc}</p>
                </div>
                <div className="text-right">
                  <p className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold uppercase text-blue-700">{req.difficulty}</p>
                  <p className="mt-2 text-xs text-slate-500">Mastery: {masteryLabel(itemProgress.mastery)}</p>
                </div>
              </div>
              <p className="mt-3 rounded-lg border border-cyan-200 bg-cyan-50 p-2 text-sm text-cyan-900">
                <span className="font-semibold">Business Meaning:</span> {req.businessMeaning ?? 'The bakery wants to answer this requirement clearly during the oral exam.'}
              </p>
            </header>

            <div className="space-y-4 p-4">
              {rapidFire && !revealed ? (
                <section className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-5 text-center">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Rapid Fire Mode</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">Explain this requirement from title only, then reveal.</p>
                  <button
                    onClick={() => setRevealed(true)}
                    className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                  >
                    Reveal SQL + Notes
                  </button>
                </section>
              ) : (
                <>
                  <section className="rounded-xl border border-slate-200 bg-slate-950 p-4 text-slate-100">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-cyan-300">SQL Query</p>
                    <pre
                      className="sql-code-view overflow-auto text-xs leading-6"
                      dangerouslySetInnerHTML={{ __html: highlightSql(req.sql) }}
                    />
                  </section>

                  <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700">Study Notes</p>
                    <div className="space-y-2">
                      {req.notes.map((note, idx) => (
                        <NoteCard key={`${req.id}-note-${idx}`} note={note} />
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>
          </article>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Expected Result Shape</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {(req.expectedResultShape ?? ['Columns listed in SELECT', 'Rows grouped by business reporting grain']).map((line) => (
                  <li key={line}>- {line}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-violet-700">Professor Might Ask</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {(req.oralQuestions ?? []).slice(0, 6).map((question) => (
                  <li key={question}>- {question}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Clause-by-Clause Breakdown</p>
              <div className="mt-2 space-y-2">
                {(req.clauseBreakdown ?? []).map((item) => (
                  <div key={`${item.clause}-${item.why}`} className="rounded-lg border border-slate-200 p-2">
                    <p className="text-xs font-bold uppercase text-slate-500">{item.clause}</p>
                    <p className="text-sm text-slate-700">{item.why}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Oral Checklist</p>
              <div className="mt-3 space-y-2">
                {req.checklist.map((line) => (
                  <label key={line} className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={Boolean(checked[line])}
                      onChange={(event) => setChecked((prev) => ({ ...prev, [line]: event.target.checked }))}
                      className="mt-1 h-4 w-4"
                    />
                    <span className="text-sm text-slate-700">{line}</span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">Coverage: {checkedCount} / {req.checklist.length}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => progressStore.recordAttempt(req.id, 'correct', 5)}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Explained Well
                </button>
                <button
                  onClick={() => progressStore.recordAttempt(req.id, 'partial', 3)}
                  className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600"
                >
                  Partial
                </button>
                <button
                  onClick={() => progressStore.recordAttempt(req.id, 'incorrect', 1)}
                  className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  Missed
                </button>
                <button
                  onClick={moveNext}
                  className="rounded-lg border border-violet-300 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50"
                >
                  Next Requirement
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}

export function SqlFlashcards({ progressStore }: { progressStore: ProgressStoreLike }) {
  const cards = useMemo(
    () =>
      sqlRequirements.flatMap((req) =>
        req.notes.map((note, idx) => ({
          id: `${req.id}-note-${idx}`,
          reqId: req.id,
          reqTitle: req.title,
          note,
        })),
      ),
    [],
  );
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const card = cards[index % cards.length];

  function next(result?: MasteryResult) {
    if (result) progressStore.recordAttempt(card.reqId, result, result === 'correct' ? 4 : 2);
    setIndex((value) => (value + 1) % cards.length);
    setRevealed(false);
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-fuchsia-700">Mama's Little Bakery SQL Flashcards</p>
        <h1 className="text-2xl font-extrabold text-slate-950">Rapid Concept Recall</h1>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Card {index + 1} / {cards.length}</p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">{card.reqTitle}</h2>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Prompt</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">{card.note.title}</p>

        {revealed ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
            {card.note.text}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Explain this concept out loud first, then reveal.
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Reveal
            </button>
          ) : (
            <>
              <button
                onClick={() => next('correct')}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Nailed It
              </button>
              <button
                onClick={() => next('partial')}
                className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600"
              >
                Almost
              </button>
              <button
                onClick={() => next('incorrect')}
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Missed
              </button>
            </>
          )}
          <button
            onClick={() => next()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Skip
          </button>
        </div>
      </article>
    </section>
  );
}

export function SqlMockOral({ navigate, progressStore }: { navigate: Navigate; progressStore: ProgressStoreLike }) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * sqlRequirements.length));
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<{ score: number; matched: string[]; missed: string[] } | null>(null);
  const req = sqlRequirements[index];

  function submit() {
    const graded = gradeAgainstChecklist(answer, req.checklist);
    setResult(graded);

    const ratio = req.checklist.length === 0 ? 0 : graded.score / req.checklist.length;
    const mastery: MasteryResult = ratio >= 0.75 ? 'correct' : ratio >= 0.4 ? 'partial' : 'incorrect';
    const confidence = mastery === 'correct' ? 4 : mastery === 'partial' ? 3 : 2;
    progressStore.recordAttempt(req.id, mastery, confidence);
  }

  function next() {
    setIndex((current) => (current + 1) % sqlRequirements.length);
    setAnswer('');
    setResult(null);
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Mama's Little Bakery SQL Mock Oral</p>
            <h1 className="text-2xl font-extrabold text-slate-950">Speak, Type, Self-Score, Repeat</h1>
          </div>
          <button
            onClick={() => navigate('/sql-study')}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to SQL Study
          </button>
        </div>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Prompt {index + 1} / {sqlRequirements.length}</p>
        <h2 className="mt-1 text-xl font-extrabold text-slate-950">{req.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{req.desc}</p>
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Explain what the bakery learns from this query, clause by clause."
          className="mt-4 min-h-[180px] w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-slate-500"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={submit}
            disabled={answer.trim().length < 8}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Score My Answer
          </button>
          <button
            onClick={next}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Next Prompt
          </button>
          <button
            onClick={() => progressStore.resetAll()}
            className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
          >
            Reset Progress For Next Exam
          </button>
        </div>
      </article>

      {result && (
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Matched Checklist</p>
            <p className="mt-1 text-lg font-extrabold text-emerald-900">{result.score} / {req.checklist.length}</p>
            <ul className="mt-2 space-y-1 text-sm text-emerald-900">
              {result.matched.length === 0 ? <li>No checklist item detected yet.</li> : result.matched.map((line) => <li key={line}>- {line}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Still Missing</p>
            <ul className="mt-2 space-y-1 text-sm text-amber-900">
              {result.missed.length === 0 ? <li>Complete coverage. Great job.</li> : result.missed.map((line) => <li key={line}>- {line}</li>)}
            </ul>
          </div>
        </section>
      )}
    </section>
  );
}

function NoteCard({ note }: { note: SqlNote }) {
  const tone =
    note.type === 'concept'
      ? 'border-cyan-200 bg-cyan-50'
      : note.type === 'tip'
        ? 'border-emerald-200 bg-emerald-50'
        : 'border-amber-200 bg-amber-50';

  return (
    <article className={`rounded-lg border p-3 ${tone}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{note.type}</p>
      <h3 className="mt-1 text-sm font-semibold text-slate-900">{note.title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-700">{note.text}</p>
    </article>
  );
}

function gradeAgainstChecklist(answer: string, checklist: string[]) {
  const normalizedAnswer = answer.toLowerCase();
  const matched: string[] = [];
  const missed: string[] = [];

  for (const line of checklist) {
    const tokens = line
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length >= 4)
      .slice(0, 3);

    const hasMatch = tokens.some((token) => normalizedAnswer.includes(token));
    if (hasMatch) matched.push(line);
    else missed.push(line);
  }

  return { score: matched.length, matched, missed };
}

function highlightSql(sql: string) {
  const escaped = sql
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'CROSS JOIN',
    'ON', 'AND', 'OR', 'NOT', 'IN', 'AS', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'UNION',
    'UNION ALL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IS NULL', 'IS NOT NULL', 'BETWEEN',
    'WITH', 'DISTINCT', 'DESC', 'ASC'
  ];
  const functions = ['COUNT', 'SUM', 'AVG', 'ROUND', 'MAX', 'MIN', 'DATE_TRUNC', 'EXTRACT', 'STRING_AGG', 'COALESCE', 'CURRENT_DATE', 'INTERVAL'];

  let html = escaped;
  html = html.replace(/(--[^\n]*)/g, '<span class="sql-cm">$1</span>');
  html = html.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="sql-str">$1</span>');
  html = html.replace(new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi'), '<span class="sql-kw">$1</span>');
  html = html.replace(new RegExp(`\\b(${functions.join('|')})\\b`, 'gi'), '<span class="sql-fn">$1</span>');
  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="sql-num">$1</span>');
  return html;
}
