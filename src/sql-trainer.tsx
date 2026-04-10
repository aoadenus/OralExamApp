import { useEffect, useMemo, useState } from 'react';
import sqlBasicsFlashcards, { sqlBasicsClauseOrder, sqlBasicsStudySequence } from './data/sql-basics-flashcards';
import sqlRequirements from './data/sql-requirements';
import { getItemProgress, masteryLabel } from './lib/progress';
import { gradeChecklistAnswer, highlightSql } from './lib/sql-oral';
import type { MasteryResult, ProgressState, SqlNote, SqlRequirement } from './types';

type Navigate = (path: string) => void;
type StudyPanel = 'sql' | 'notes';
type ProgressStoreLike = {
  progress: ProgressState;
  recordAttempt: (itemId: string, result: MasteryResult, confidence: number) => void;
  resetAll: () => void;
  toggleFavorite: (itemId: string) => void;
};

export function SqlExamBanner({ navigate }: { navigate: Navigate }) {
  return (
    <section className="mb-6 rounded-3xl border border-cyan-200 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">Mama's Little Bakery SQL Oral</p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-950">Study the SQL, not the schema recap</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Assume the ERD already makes sense. This workspace is for explaining the query, defending the clauses, and getting faster at oral answers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/sql-study')} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700">Open SQL Study</button>
          <button onClick={() => navigate('/sql-rapid-fire')} className="rounded-xl border border-cyan-300 bg-white px-4 py-2 text-sm font-semibold text-cyan-800 hover:bg-cyan-50">Night Before Mode</button>
          <button onClick={() => navigate('/sql-games')} className="rounded-xl border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50">SQL Games</button>
          <button onClick={() => navigate('/sql-execution')} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Execution Lab</button>
        </div>
      </div>
    </section>
  );
}

export function SqlStudyGuide({
  navigate,
  progressStore,
  initialRapidFire = false,
  initialRequirementId,
}: {
  navigate: Navigate;
  progressStore: ProgressStoreLike;
  initialRapidFire?: boolean;
  initialRequirementId?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(() => {
    const requestedIndex = sqlRequirements.findIndex((item) => item.id === initialRequirementId);
    return requestedIndex >= 0 ? requestedIndex : 0;
  });
  const [panel, setPanel] = useState<StudyPanel>('sql');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [rapidFire, setRapidFire] = useState(initialRapidFire);
  const [revealed, setRevealed] = useState(!initialRapidFire);
  const [showRequirementList, setShowRequirementList] = useState(true);
  const req = sqlRequirements[activeIndex];
  const itemProgress = getItemProgress(progressStore.progress, req.id);
  const isStarred = progressStore.progress.favoriteItemIds?.includes(req.id) ?? false;
  const checkedCount = req.checklist.filter((line) => checked[line]).length;
  const checklistRatio = req.checklist.length === 0 ? 0 : checkedCount / req.checklist.length;
  const resultLines = [
    ...(req.expectedResultDescription ? [req.expectedResultDescription] : []),
    ...(req.expectedResultShape ?? [
      `Expect one row per reporting unit for ${req.title.toLowerCase()}.`,
      'The SELECT list tells you what each row returns.',
      'WHERE, GROUP BY, HAVING, and ORDER BY explain why those rows appear in that order.',
    ]),
  ];
  const oralQuestions = uniqueStrings([
    req.easyQuestion,
    req.hardQuestion,
    ...(req.oralQuestions ?? ['Why is each JOIN needed here?', 'What business question does this answer?', 'What breaks if one clause is removed?']),
  ]).filter(Boolean) as string[];
  const clauseBreakdown = req.clauseBreakdown ?? [
    { clause: 'SELECT', why: 'Defines the output you must explain.' },
    { clause: 'FROM / JOIN', why: 'Reconnects normalized tables.' },
    { clause: 'WHERE / HAVING / ORDER BY', why: 'Controls filtering, grouped filtering, and output order.' },
  ];
  const keyClauses = req.keyClauses ?? clauseBreakdown.map((item) => item.clause);
  const riskNotes = req.knownRiskNotes ?? [];
  const scriptStatus = req.status ?? 'study-ready';
  const currentMeaning = req.currentMeaning ?? req.businessMeaning ?? 'Explain what business question the script answers before you defend any clause.';
  const officialTask = req.officialTask ?? req.desc;
  const resultSummary = req.expectedResultDescription ?? resultLines[0] ?? 'Explain what one returned row means for the bakery.';
  const sourceLabel =
    req.currentScriptSource === 'teammate_html'
      ? 'Teammate study HTML'
      : req.currentScriptSource === 'manual'
        ? 'Manual paste'
        : 'Group script';

  useEffect(() => {
    if (!initialRequirementId) return;
    const requestedIndex = sqlRequirements.findIndex((item) => item.id === initialRequirementId);
    if (requestedIndex >= 0) {
      setActiveIndex(requestedIndex);
      setChecked({});
      setPanel('sql');
      setRevealed(!rapidFire);
    }
  }, [initialRequirementId, rapidFire]);

  function resetForRequirement(index: number) {
    setActiveIndex(index);
    setChecked({});
    setPanel('sql');
    setRevealed(!rapidFire);
  }

  function moveNext() {
    resetForRequirement((activeIndex + 1) % sqlRequirements.length);
  }

  function toggleRapidFire() {
    const nextValue = !rapidFire;
    setRapidFire(nextValue);
    setRevealed(!nextValue);
  }

  return (
    <section className="layout-safe space-y-4 workspace-canvas">
      <header className="workspace-shell p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">SQL Study Workspace</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">Study the current script like a clean oral-defense brief</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              One navigator, one primary canvas, one support dock. The goal is quick recognition, clear explanation, and less screen noise.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowRequirementList((current) => !current)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {showRequirementList ? 'Hide Navigator' : 'Show Navigator'}
            </button>
            <button
              onClick={toggleRapidFire}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                rapidFire ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {rapidFire ? 'Night Before Mode' : 'Standard Study'}
            </button>
          </div>
        </div>
      </header>

      <div className={`grid gap-6 xl:items-start ${showRequirementList ? 'xl:grid-cols-[280px_minmax(0,1fr)]' : 'xl:grid-cols-[minmax(0,1fr)]'}`}>
        {showRequirementList ? (
          <aside className="workspace-panel workspace-rail p-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-10rem)]">
          <div className="flex items-center justify-between gap-2 px-2 pb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Navigator</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">15 functionalities</p>
            </div>
            <button
              onClick={() => setShowRequirementList(false)}
              className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
          <div className="workspace-scroll h-full space-y-1 overflow-y-auto pr-1">
            {sqlRequirements.map((item, idx) => {
              const active = idx === activeIndex;
              const progress = getItemProgress(progressStore.progress, item.id);
              const dotClass = progress.attempts === 0 ? 'bg-slate-300' : progress.mastery >= 0.75 ? 'bg-emerald-500' : progress.mastery >= 0.4 ? 'bg-amber-500' : 'bg-rose-500';
              return (
                <button
                  key={item.id}
                  onClick={() => resetForRequirement(idx)}
                  title={item.title}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition ${active ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">#{idx + 1}</p>
                    <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-5 text-slate-900">{item.title}</p>
                </button>
              );
            })}
          </div>
        </aside>
        ) : null}

        <article className="workspace-panel overflow-hidden">
          <div className="flex flex-col">
            <header className="border-b border-slate-200 bg-slate-50/80 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">#{activeIndex + 1}</span>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700">{req.category}</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{req.difficulty}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${scriptStatus === 'study-ready' ? 'bg-emerald-100 text-emerald-700' : scriptStatus === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-700'}`}>
                      {scriptStatus}
                    </span>
                  </div>
                  <h2 className="mt-3 text-2xl font-extrabold text-slate-950">{req.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{officialTask}</p>
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

              <div className="mt-5 grid gap-3 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Tables used</p>
                  <div className="mt-2 flex flex-wrap gap-2">{req.tables.map((table) => <span key={table} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{table}</span>)}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Key clauses</p>
                  <div className="mt-2 flex flex-wrap gap-2">{keyClauses.map((clause) => <span key={clause} className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800">{clause}</span>)}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Script reality</p>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{sourceLabel}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">{req.concepts.map((concept) => <span key={concept} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{concept}</span>)}</div>
                  <p className="mt-3 text-xs text-slate-500">{riskNotes.length > 0 ? `${riskNotes.length} risk note${riskNotes.length > 1 ? 's' : ''} tracked for oral defense.` : 'No blocking risk notes recorded for this study version.'}</p>
                </div>
              </div>
            </header>

            <div className="flex-1 p-6">
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
              ) : (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-5">
                    <div className="workspace-toolbar inline-flex p-1">
                      <StudyToggle active={panel === 'sql'} onClick={() => setPanel('sql')}>SQL Query</StudyToggle>
                      <StudyToggle active={panel === 'notes'} onClick={() => setPanel('notes')}>Study Notes</StudyToggle>
                    </div>

                    {panel === 'sql' ? (
                      <section className="workspace-code-panel rounded-3xl p-5 text-slate-100">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-cyan-300">Current Group Script</p>
                        <pre className="workspace-scroll sql-code-view overflow-auto text-[12.5px] leading-6" dangerouslySetInnerHTML={{ __html: highlightSql(req.sql) }} />
                      </section>
                    ) : (
                      <section className="workspace-panel workspace-panel-muted p-5">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-amber-700">Draft-Reality Study Notes</p>
                        <div className="grid gap-3 md:grid-cols-2">
                          <SummaryCard title="Official task" tone="slate">{officialTask}</SummaryCard>
                          <SummaryCard title="Plain-English answer" tone="emerald">{currentMeaning}</SummaryCard>
                          <SummaryCard title="Expected result meaning" tone="cyan">{resultSummary}</SummaryCard>
                          <SummaryCard title="Current script source" tone="amber">{sourceLabel}</SummaryCard>
                        </div>
                        <div className="mt-4 space-y-3">{req.notes.map((note, idx) => <NoteCard key={`${req.id}-note-${idx}`} note={note} />)}</div>
                      </section>
                    )}

                    <div className="space-y-3">
                      <StudyDisclosure title="Result Interpretation" description="How to explain the output in bakery terms." defaultOpen>
                        <div className="space-y-3">
                          {resultLines.map((line) => (
                            <div key={line} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                              {line}
                            </div>
                          ))}
                        </div>
                      </StudyDisclosure>

                      <StudyDisclosure title="Likely Professor Follow-Ups" description="Use these as oral prompts, not just reading notes.">
                        <div className="space-y-3">
                          {oralQuestions.map((question) => (
                            <div key={question} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                              {question}
                            </div>
                          ))}
                        </div>
                      </StudyDisclosure>

                      <StudyDisclosure title="Clause-by-Clause Logic" description="What each major clause is doing in this specific script.">
                        <div className="space-y-3">
                          {clauseBreakdown.map((item) => (
                            <div key={`${item.clause}-${item.why}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{item.clause}</p>
                              <p className="mt-2 text-sm text-slate-700">{item.why}</p>
                            </div>
                          ))}
                        </div>
                      </StudyDisclosure>
                    </div>
                  </div>

                  <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
                    <section className="workspace-panel p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Oral framing</p>
                      <div className="mt-3 space-y-4 text-sm">
                        <div>
                          <p className="font-semibold text-slate-950">Official task</p>
                          <p className="mt-1 text-slate-600">{officialTask}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">What the current script is trying to do</p>
                          <p className="mt-1 text-slate-600">{currentMeaning}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">How to finish the explanation</p>
                          <p className="mt-1 text-slate-600">{resultSummary}</p>
                        </div>
                      </div>
                    </section>

                    <section className="workspace-panel p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Checklist</p>
                          <h3 className="mt-1 text-lg font-bold text-slate-950">What to say out loud</h3>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Coverage</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{checkedCount} / {req.checklist.length}</p>
                        </div>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${checklistRatio * 100}%` }} />
                      </div>
                      <div className="mt-4 space-y-2">
                        {req.checklist.map((line) => {
                          const active = Boolean(checked[line]);
                          return (
                            <label key={line} className={`grid cursor-pointer grid-cols-[16px_1fr] gap-2 rounded-2xl border px-3 py-2 text-[12px] leading-5 transition ${active ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                              <input type="checkbox" checked={active} onChange={(event) => setChecked((prev) => ({ ...prev, [line]: event.target.checked }))} className="mt-1 h-4 w-4 rounded border-slate-300" />
                              <span>{line}</span>
                            </label>
                          );
                        })}
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <button onClick={() => progressStore.recordAttempt(req.id, 'correct', 5)} className="rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">I explained it well</button>
                        <button onClick={() => progressStore.recordAttempt(req.id, 'partial', 3)} className="rounded-2xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600">Mostly there</button>
                        <button onClick={() => progressStore.recordAttempt(req.id, 'incorrect', 1)} className="rounded-2xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700">Need review</button>
                        <button onClick={moveNext} className="rounded-2xl border border-violet-300 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50">Next requirement</button>
                      </div>
                    </section>

                    {riskNotes.length > 0 ? (
                      <StudyDisclosure title={`Risk Notes (${riskNotes.length})`} description="Useful warning layer for oral defense.">
                        <div className="space-y-2">
                          {riskNotes.map((note) => (
                            <p key={note} className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                              {note}
                            </p>
                          ))}
                        </div>
                      </StudyDisclosure>
                    ) : null}
                  </aside>
                </div>
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export function SqlBasicsFlashcards({
  navigate,
  progressStore,
}: {
  navigate: Navigate;
  progressStore: ProgressStoreLike;
}) {
  const categories = ['All', ...Array.from(new Set(sqlBasicsFlashcards.map((card) => card.category)))] as const;
  const [category, setCategory] = useState<(typeof categories)[number]>('All');
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const cards = category === 'All' ? sqlBasicsFlashcards : sqlBasicsFlashcards.filter((card) => card.category === category);
  const card = cards[index % cards.length];

  useEffect(() => {
    setIndex(0);
    setRevealed(false);
  }, [category]);

  function next(result?: MasteryResult) {
    if (result) progressStore.recordAttempt(card.id, result, result === 'correct' ? 4 : 2);
    setIndex((value) => (value + 1) % cards.length);
    setRevealed(false);
  }

  return (
    <section className="layout-safe space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">SQL Basics Flashcards</p>
            <h1 className="text-2xl font-extrabold text-slate-950">Clause order, filters, grouping, joins</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Use this page before the 15 functionality scripts when you need the basic language locked in. This is the warm-up layer for Hu's easy concept questions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/sql-flashcards')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Query Flashcards
            </button>
            <button onClick={() => navigate('/sql-study')} className="rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800 hover:bg-cyan-100">
              Back to SQL Study
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryCard title="What SQL is" tone="slate">
          SQL is the language you use to ask a database questions. ERD is the map, tables are the storage boxes, and SQL is the question you ask those boxes.
        </SummaryCard>
        <SummaryCard title="Clause order" tone="cyan">
          {sqlBasicsClauseOrder}
        </SummaryCard>
        <SummaryCard title="How to read a query" tone="emerald">
          Ask the business question first. Then find FROM, inspect JOINs, read WHERE, find GROUP BY, check aggregates, check HAVING, and finish with ORDER BY and LIMIT.
        </SummaryCard>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Study order</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          {sqlBasicsStudySequence.map((step, stepIndex) => (
            <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Step {stepIndex + 1}</p>
              <p className="mt-2">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {categories.map((option) => (
            <button
              key={option}
              onClick={() => setCategory(option)}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                category === option ? 'bg-slate-900 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Card {index + 1} / {cards.length}</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">{card.category}</h2>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Prompt</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">{card.front}</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
            Answer it out loud first. Then reveal and self-grade.
          </div>
        </div>
        <div className="mt-4">
          {revealed ? (
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-700">Back</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{card.back}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Say the answer without looking first. Hu can ask these basics before he asks you to defend a specific line in the query.
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {!revealed ? (
            <button onClick={() => setRevealed(true)} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">
              Reveal
            </button>
          ) : (
            <>
              <button onClick={() => next('correct')} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                Nailed it
              </button>
              <button onClick={() => next('partial')} className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600">
                Almost
              </button>
              <button onClick={() => next('incorrect')} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                Missed it
              </button>
            </>
          )}
          <button onClick={() => next()} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Skip
          </button>
        </div>
      </article>
    </section>
  );
}

export function SqlFlashcards({
  navigate,
  progressStore,
}: {
  navigate?: Navigate;
  progressStore: ProgressStoreLike;
}) {
  const cards = useMemo(() => buildSqlFlashcards(sqlRequirements), []);
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-fuchsia-700">Query-Specific SQL Flashcards</p>
            <h1 className="text-2xl font-extrabold text-slate-950">Recall tied to the 15 bakery functionalities</h1>
            <p className="mt-2 text-sm text-slate-600">These cards are built from the current functionality scripts, likely professor questions, and known draft risks.</p>
          </div>
          {navigate ? (
            <button onClick={() => navigate('/sql-basics')} className="rounded-xl border border-fuchsia-300 bg-fuchsia-50 px-3 py-2 text-sm font-semibold text-fuchsia-800 hover:bg-fuchsia-100">
              SQL Basics Flashcards
            </button>
          ) : null}
        </div>
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
    const graded = gradeChecklistAnswer(answer, req.checklist, 1, `${req.id}-mock-oral`);
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
            <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Mama's Little Bakery SQL Mock Oral</p>
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
  return <button onClick={onClick} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${active ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'}`}>{children}</button>;
}

function StudyDisclosure({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="workspace-panel overflow-hidden">
      <summary className="cursor-pointer list-none px-4 py-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">{title}</p>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Open
          </span>
        </div>
      </summary>
      <div className="border-t border-slate-200 px-4 py-4">{children}</div>
    </details>
  );
}

function NoteCard({ note }: { note: SqlNote }) {
  const tone = note.type === 'concept' ? 'border-cyan-200 bg-cyan-50' : note.type === 'tip' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50';
  const label = note.type === 'concept' ? 'Concept' : note.type === 'tip' ? 'Study Tip' : 'Exam Hint';
  return (
    <article className={`workspace-panel rounded-2xl border p-3 ${tone}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <h3 className="mt-1 text-sm font-semibold text-slate-900">{note.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">{note.text}</p>
    </article>
  );
}

function SummaryCard({ title, tone, children }: { title: string; tone: 'slate' | 'emerald' | 'cyan' | 'amber'; children: React.ReactNode }) {
  const toneClass =
    tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50'
      : tone === 'cyan'
        ? 'border-cyan-200 bg-cyan-50'
        : tone === 'amber'
          ? 'border-amber-200 bg-amber-50'
          : 'border-slate-200 bg-slate-50';
  return (
    <article className={`workspace-panel rounded-2xl border p-3 ${toneClass}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{children}</p>
    </article>
  );
}

function buildSqlFlashcards(requirements: SqlRequirement[]) {
  return requirements.flatMap((req) => {
    const cards = req.notes.map((note, idx) => ({ id: `${req.id}-note-${idx}`, reqId: req.id, reqTitle: req.title, note }));
    if (req.easyQuestion) {
      cards.push({
        id: `${req.id}-easy-question`,
        reqId: req.id,
        reqTitle: req.title,
        note: {
          type: 'concept',
          title: req.easyQuestion,
          text: `Strong answer target: ${(req.easyChecklist ?? []).join('; ')}`,
        },
      });
    }
    if (req.hardQuestion) {
      cards.push({
        id: `${req.id}-hard-question`,
        reqId: req.id,
        reqTitle: req.title,
        note: {
          type: 'tip',
          title: req.hardQuestion,
          text: `Cover these oral-defense points: ${(req.hardChecklist ?? []).join('; ')}`,
        },
      });
    }
    (req.knownRiskNotes ?? []).forEach((risk, idx) => {
      cards.push({
        id: `${req.id}-risk-${idx}`,
        reqId: req.id,
        reqTitle: req.title,
        note: {
          type: 'warn',
          title: 'Current script risk note',
          text: risk,
        },
      });
    });
    return cards;
  });
}

function uniqueStrings(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter(Boolean)));
}
