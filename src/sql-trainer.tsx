import { useMemo, useState } from 'react';
import sqlRequirementsData from './data/sql-requirements.json';
import { getItemProgress, masteryLabel } from './lib/progress';
import type { MasteryResult, ProgressState, SqlNote, SqlRequirement } from './types';

type Navigate = (path: string) => void;
type StudyPanel = 'sql' | 'notes';
type OverlayView = 'result' | 'questions' | 'breakdown' | null;
type ProgressStoreLike = {
  progress: ProgressState;
  recordAttempt: (itemId: string, result: MasteryResult, confidence: number) => void;
  resetAll: () => void;
  toggleFavorite: (itemId: string) => void;
};

const sqlRequirements = sqlRequirementsData as SqlRequirement[];

export function SqlExamBanner({ navigate }: { navigate: Navigate }) {
  return (
    <section className="mb-6 rounded-3xl border border-cyan-200 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">RestaurantDB SQL Oral</p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Study the SQL, not the schema recap</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Assume the ERD already makes sense. This workspace is for explaining the query, defending the clauses, and getting faster at oral answers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/sql-study')} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700">Open SQL Study</button>
          <button onClick={() => navigate('/sql-rapid-fire')} className="rounded-xl border border-cyan-300 bg-white px-4 py-2 text-sm font-semibold text-cyan-800 hover:bg-cyan-50">Night Before Mode</button>
          <button onClick={() => navigate('/sql-games')} className="rounded-xl border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50">SQL Games</button>
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
  const [panel, setPanel] = useState<StudyPanel>('sql');
  const [overlay, setOverlay] = useState<OverlayView>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [rapidFire, setRapidFire] = useState(initialRapidFire);
  const [revealed, setRevealed] = useState(!initialRapidFire);
  const req = sqlRequirements[activeIndex];
  const itemProgress = getItemProgress(progressStore.progress, req.id);
  const isStarred = progressStore.progress.favoriteItemIds?.includes(req.id) ?? false;
  const checkedCount = req.checklist.filter((line) => checked[line]).length;
  const checklistRatio = req.checklist.length === 0 ? 0 : checkedCount / req.checklist.length;
  const resultLines = req.expectedResultShape ?? [
    `Expect one row per reporting unit for ${req.title.toLowerCase()}.`,
    'The SELECT list tells you what each row returns.',
    'WHERE, GROUP BY, HAVING, and ORDER BY explain why those rows appear in that order.',
  ];
  const oralQuestions = req.oralQuestions ?? ['Why is each JOIN needed here?', 'What business question does this answer?', 'What breaks if one clause is removed?'];
  const clauseBreakdown = req.clauseBreakdown ?? [
    { clause: 'SELECT', why: 'Defines the output you must explain.' },
    { clause: 'FROM / JOIN', why: 'Reconnects normalized tables.' },
    { clause: 'WHERE / HAVING / ORDER BY', why: 'Controls filtering, grouped filtering, and output order.' },
  ];

  function resetForRequirement(index: number) {
    setActiveIndex(index);
    setChecked({});
    setPanel('sql');
    setOverlay(null);
    setRevealed(!rapidFire);
  }

  function moveNext() {
    resetForRequirement((activeIndex + 1) % sqlRequirements.length);
  }

  function toggleRapidFire() {
    const nextValue = !rapidFire;
    setRapidFire(nextValue);
    setRevealed(!nextValue);
    setOverlay(null);
  }

  return (
    <section className="layout-safe space-y-4">
      <header className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">RestaurantDB SQL Study Guide</p>
            <h1 className="text-2xl font-extrabold text-slate-950">One requirement, one explanation, one checklist</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">Use Full Study for complete panels. Use Night Before mode to practice from prompt memory first.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={toggleRapidFire} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${rapidFire ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>{rapidFire ? 'Night Before Mode' : 'Full Study Mode'}</button>
            <button onClick={() => navigate('/sql-flashcards')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">SQL Flashcards</button>
            <button onClick={() => navigate('/sql-mock-oral')} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">SQL Mock Oral</button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:h-[calc(100vh-15rem)] xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        <aside className="min-h-0 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="px-2 pb-3 text-xs font-bold uppercase tracking-wide text-slate-500">15 Functional Requirements</p>
          <div className="h-full max-h-[65vh] space-y-1 overflow-auto pr-1 xl:max-h-none">
            {sqlRequirements.map((item, idx) => {
              const active = idx === activeIndex;
              const progress = getItemProgress(progressStore.progress, item.id);
              const dotClass = progress.attempts === 0 ? 'bg-slate-300' : progress.mastery >= 0.75 ? 'bg-emerald-500' : progress.mastery >= 0.4 ? 'bg-amber-500' : 'bg-rose-500';
              return (
                <button key={item.id} onClick={() => resetForRequirement(idx)} className={`w-full rounded-xl border px-2.5 py-2 text-left transition ${active ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold text-slate-500">{idx + 1}</p>
                    <span className={`h-1 w-1 rounded-full ${dotClass}`} />
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.category}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <article className="min-h-0 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <header className="border-b border-slate-200 bg-slate-50/90 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">#{activeIndex + 1}</span>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700">{req.category}</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{req.difficulty}</span>
                  </div>
                  <h2 className="mt-3 text-2xl font-extrabold text-slate-950">{req.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm text-slate-600">{req.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => progressStore.toggleFavorite(req.id)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold ${isStarred ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                    aria-label={isStarred ? 'Saved requirement' : 'Save requirement'}
                    title={isStarred ? 'Saved requirement' : 'Save requirement'}
                  >
                    {isStarred ? 'Saved' : 'Save'}
                  </button>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-right">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Mastery</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{masteryLabel(itemProgress.mastery)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Tables used</p>
                  <div className="mt-2 flex flex-wrap gap-2">{req.tables.map((table) => <span key={table} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{table}</span>)}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Concepts tested</p>
                  <div className="mt-2 flex flex-wrap gap-2">{req.concepts.map((concept) => <span key={concept} className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800">{concept}</span>)}</div>
                </div>
              </div>
            </header>

            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
                  <StudyToggle active={panel === 'sql'} onClick={() => setPanel('sql')}>SQL Query</StudyToggle>
                  <StudyToggle active={panel === 'notes'} onClick={() => setPanel('notes')}>Study Notes</StudyToggle>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setOverlay('result')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Result shape</button>
                  <button onClick={() => setOverlay('questions')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Follow-up questions</button>
                  <button onClick={() => setOverlay('breakdown')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Clause logic</button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 p-4">
              {rapidFire && !revealed ? (
                <section className="flex h-full items-center justify-center rounded-3xl border border-dashed border-amber-300 bg-amber-50 p-6 text-center">
                  <div className="max-w-xl">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Rapid Fire Mode</p>
                    <h3 className="mt-2 text-2xl font-extrabold text-slate-950">{req.title}</h3>
                    <p className="mt-3 text-sm text-slate-700">Speak first from the requirement title and business question. Reveal only when you are ready to check the SQL and notes.</p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      <button onClick={() => setRevealed(true)} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">Reveal study pack</button>
                      <button onClick={moveNext} className="rounded-xl border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100">Next requirement</button>
                    </div>
                  </div>
                </section>
              ) : panel === 'sql' ? (
                <section className="h-full overflow-auto rounded-3xl border border-slate-200 bg-slate-950 p-4 text-slate-100">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-cyan-300">SQL Query</p>
                  <pre className="sql-code-view overflow-auto text-[12.5px] leading-6" dangerouslySetInnerHTML={{ __html: highlightSql(req.sql) }} />
                </section>
              ) : (
                <section className="h-full overflow-auto rounded-3xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-amber-700">Key Study Notes</p>
                  <div className="space-y-3">{req.notes.map((note, idx) => <NoteCard key={`${req.id}-note-${idx}`} note={note} />)}</div>
                </section>
              )}
            </div>
          </div>
        </article>

        <aside className="min-h-0 flex flex-col gap-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Clear oral prompt</p>
            <p className="mt-1.5 text-sm font-semibold text-slate-950">{`Explain how this query answers "${req.title}" and justify the key clauses.`}</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              <li>Start with what the query returns.</li>
              <li>Then explain how the tables connect.</li>
              <li>Finish by defending the filter, grouping, and ordering logic.</li>
            </ul>
          </section>

          <section className="min-h-0 flex flex-1 flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Oral Checklist</p>
                <h3 className="mt-1 text-lg font-bold text-slate-950">What you should mention out loud</h3>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Coverage</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{checkedCount} / {req.checklist.length}</p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${checklistRatio * 100}%` }} /></div>
            <div className="mt-4 grid flex-1 content-start gap-2">{req.checklist.map((line) => {
              const active = Boolean(checked[line]);
              return (
                <label key={line} className={`grid cursor-pointer grid-cols-[16px_1fr] gap-2 rounded-2xl border px-3 py-2 text-[12px] leading-5 transition ${active ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                  <input type="checkbox" checked={active} onChange={(event) => setChecked((prev) => ({ ...prev, [line]: event.target.checked }))} className="mt-1 h-4 w-4 rounded border-slate-300" />
                  <span>{line}</span>
                </label>
              );
            })}</div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button onClick={() => progressStore.recordAttempt(req.id, 'correct', 5)} className="rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">I explained it well</button>
              <button onClick={() => progressStore.recordAttempt(req.id, 'partial', 3)} className="rounded-2xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600">Mostly there</button>
              <button onClick={() => progressStore.recordAttempt(req.id, 'incorrect', 1)} className="rounded-2xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700">Need review</button>
              <button onClick={moveNext} className="rounded-2xl border border-violet-300 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50">Next requirement</button>
            </div>
          </section>
        </aside>
      </div>

      {overlay && <Overlay title={overlay === 'result' ? 'Result shape' : overlay === 'questions' ? 'Professor follow-up questions' : 'Clause-by-clause logic'} subtitle={req.title} onClose={() => setOverlay(null)}>
        {overlay === 'result' && <div className="space-y-3">{resultLines.map((line) => <div key={line} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{line}</div>)}</div>}
        {overlay === 'questions' && <div className="space-y-3">{oralQuestions.map((question) => <div key={question} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{question}</div>)}</div>}
        {overlay === 'breakdown' && <div className="space-y-3">{clauseBreakdown.map((item) => <div key={`${item.clause}-${item.why}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{item.clause}</p><p className="mt-2 text-sm text-slate-700">{item.why}</p></div>)}</div>}
      </Overlay>}
    </section>
  );
}

export function SqlFlashcards({ progressStore }: { progressStore: ProgressStoreLike }) {
  const cards = useMemo(() => sqlRequirements.flatMap((req) => req.notes.map((note, idx) => ({ id: `${req.id}-note-${idx}`, reqId: req.id, reqTitle: req.title, note }))), []);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const card = cards[index % cards.length];
  function next(result?: MasteryResult) {
    if (result) progressStore.recordAttempt(card.reqId, result, result === 'correct' ? 4 : 2);
    setIndex((value) => (value + 1) % cards.length);
    setRevealed(false);
  }
  return (
    <section className="layout-safe space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-fuchsia-700">RestaurantDB SQL Flashcards</p>
        <h1 className="text-2xl font-extrabold text-slate-950">Fast concept recall</h1>
        <p className="mt-2 text-sm text-slate-600">Speak the idea first, then reveal. This mode is for SQL concepts, not full schema review.</p>
      </div>
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Card {index + 1} / {cards.length}</p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">{card.reqTitle}</h2>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Prompt</p>
        <p className="mt-1 text-xl font-semibold text-slate-950">{card.note.title}</p>
        <div className="mt-4">{revealed ? <NoteCard note={card.note} /> : <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Explain this concept out loud before revealing the explanation.</div>}</div>
        <div className="mt-5 flex flex-wrap gap-2">
          {!revealed ? <button onClick={() => setRevealed(true)} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">Reveal</button> : <>
            <button onClick={() => next('correct')} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Nailed it</button>
            <button onClick={() => next('partial')} className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600">Almost</button>
            <button onClick={() => next('incorrect')} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700">Missed it</button>
          </>}
          <button onClick={() => next()} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Skip</button>
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
  const isStarred = progressStore.progress.favoriteItemIds?.includes(req.id) ?? false;
  function submit() {
    const graded = gradeAgainstChecklist(answer, req.checklist);
    setResult(graded);
    const ratio = req.checklist.length === 0 ? 0 : graded.score / req.checklist.length;
    const mastery: MasteryResult = ratio >= 0.75 ? 'correct' : ratio >= 0.4 ? 'partial' : 'incorrect';
    progressStore.recordAttempt(req.id, mastery, mastery === 'correct' ? 4 : mastery === 'partial' ? 3 : 2);
  }
  function next() {
    setIndex((current) => (current + 1) % sqlRequirements.length);
    setAnswer('');
    setResult(null);
  }
  return (
    <section className="layout-safe space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-rose-700">RestaurantDB SQL Mock Oral</p>
            <h1 className="text-2xl font-extrabold text-slate-950">Speak, type, self-score, repeat</h1>
            <p className="mt-2 text-sm text-slate-600">Focus on what the query returns, how the tables connect, and why the main clauses are needed.</p>
          </div>
          <button onClick={() => navigate('/sql-study')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back to SQL Study</button>
        </div>
      </div>
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Prompt {index + 1} / {sqlRequirements.length}</p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-950">{req.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{req.desc}</p>
          </div>
          <button
            onClick={() => progressStore.toggleFavorite(req.id)}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${isStarred ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
            aria-label={isStarred ? 'Saved prompt' : 'Save prompt'}
            title={isStarred ? 'Saved prompt' : 'Save prompt'}
          >
            {isStarred ? 'Saved' : 'Save'}
          </button>
        </div>
        <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Explain what the query returns, how the tables connect, and why the main clauses are necessary." className="mt-4 min-h-[180px] w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-slate-500" />
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={submit} disabled={answer.trim().length < 8} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Score my answer</button>
        </div>
      </article>
      {result && <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">What you covered</p>
          <p className="mt-1 text-lg font-extrabold text-emerald-900">{result.score} / {req.checklist.length}</p>
          <ul className="mt-3 space-y-2 text-sm text-emerald-900">{result.matched.length === 0 ? <li>No checklist item was detected yet.</li> : result.matched.map((line) => <li key={line}>- {line}</li>)}</ul>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700">What to add next time</p>
          <ul className="mt-3 space-y-2 text-sm text-amber-900">{result.missed.length === 0 ? <li>Complete coverage. Nothing important was missed.</li> : result.missed.map((line) => <li key={line}>- {line}</li>)}</ul>
        </div>
      </section>}
      {result ? (
        <div className="flex gap-2">
          <button onClick={next} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Next prompt</button>
          <button onClick={() => progressStore.resetAll()} className="rounded-xl border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Reset Progress For Next Exam</button>
        </div>
      ) : null}
    </section>
  );
}

function StudyToggle({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{children}</button>;
}

function Overlay({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-auto mt-6 max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{subtitle}</p>
            <h3 className="mt-1 text-xl font-extrabold text-slate-950">{title}</h3>
          </div>
          <button onClick={onClose} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
        </div>
        <div className="max-h-[70vh] overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}

function NoteCard({ note }: { note: SqlNote }) {
  const tone = note.type === 'concept' ? 'border-cyan-200 bg-cyan-50' : note.type === 'tip' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50';
  const label = note.type === 'concept' ? 'Concept' : note.type === 'tip' ? 'Study Tip' : 'Exam Hint';
  return (
    <article className={`rounded-2xl border p-3 ${tone}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <h3 className="mt-1 text-sm font-semibold text-slate-900">{note.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">{note.text}</p>
    </article>
  );
}

function gradeAgainstChecklist(answer: string, checklist: string[]) {
  const normalizedAnswer = answer.toLowerCase();
  const matched: string[] = [];
  const missed: string[] = [];
  for (const line of checklist) {
    const tokens = line.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((token) => token.length >= 4).slice(0, 3);
    if (tokens.some((token) => normalizedAnswer.includes(token))) matched.push(line);
    else missed.push(line);
  }
  return { score: matched.length, matched, missed };
}

function highlightSql(sql: string) {
  let html = sql.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'CROSS JOIN', 'ON', 'AND', 'OR', 'NOT', 'IN', 'AS', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'UNION', 'UNION ALL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IS NULL', 'IS NOT NULL', 'BETWEEN', 'WITH', 'DISTINCT', 'DESC', 'ASC'];
  const functions = ['COUNT', 'SUM', 'AVG', 'ROUND', 'MAX', 'MIN', 'DATE_TRUNC', 'EXTRACT', 'STRING_AGG', 'COALESCE', 'CURRENT_DATE', 'INTERVAL'];
  html = html.replace(/(--[^\n]*)/g, '<span class="sql-cm">$1</span>');
  html = html.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="sql-str">$1</span>');
  html = html.replace(new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi'), '<span class="sql-kw">$1</span>');
  html = html.replace(new RegExp(`\\b(${functions.join('|')})\\b`, 'gi'), '<span class="sql-fn">$1</span>');
  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="sql-num">$1</span>');
  return html;
}
