import { useEffect, useMemo, useState } from 'react';
import sqlRequirements from './data/sql-requirements';
import { entities } from './lib/content';
import {
  buildSqlOralScore,
  clauseLikelyQuestion,
  clauseMeaning,
  clauseStrongAnswer,
  deliveryCheckLabels,
  executionCheckLabels,
  gradeChecklistAnswer,
  gradeManualChecklist,
  highlightSql,
  verdictFromTotal,
  type ChecklistAnswerGrade,
} from './lib/sql-oral';
import type {
  MasteryResult,
  ProgressState,
  SqlAnswerMode,
  SqlOralSession,
  SqlRequirement,
} from './types';

type Navigate = (path: string) => void;

type ProgressStoreLike = {
  progress: ProgressState;
  recordAttempt: (itemId: string, result: MasteryResult, confidence: number) => void;
  saveSqlOralSession: (session: SqlOralSession) => void;
};

type AnswerSectionProps = {
  accent: 'blue' | 'amber';
  title: string;
  question: string;
  checklist: string[];
  weight: number;
  mode: SqlAnswerMode;
  answer: string;
  manualChecks: Record<string, boolean>;
  grade: ChecklistAnswerGrade | null;
  onModeChange: (mode: SqlAnswerMode) => void;
  onAnswerChange: (answer: string) => void;
  onManualToggle: (item: string, checked: boolean) => void;
  onScore: () => void;
};

const connectionStepLabels = [
  'Open MySQL Workbench',
  'Open or add the AWS connection',
  'Enter the host name',
  'Enter the database username',
  'Click Test Connection',
  'Open the schema successfully',
] as const;

export function SqlExecutionLab({ navigate, progressStore }: { navigate: Navigate; progressStore: ProgressStoreLike }) {
  const [selectedId, setSelectedId] = useState(() => pickRandomRequirementId());
  const [connectionChecks, setConnectionChecks] = useState<Record<string, boolean>>(() => createCheckState(connectionStepLabels));
  const [executionChecks, setExecutionChecks] = useState<Record<string, boolean>>(() => createCheckState(executionCheckLabels));
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [completedMs, setCompletedMs] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const req = sqlRequirements.find((item) => item.id === selectedId) ?? sqlRequirements[0];
  const connectionReady = Object.values(connectionChecks).every(Boolean);
  const connectionMs = completedMs ?? (timerStartedAt ? now - timerStartedAt : 0);
  const officialTask = req.officialTask ?? req.desc;
  const currentMeaning = req.currentMeaning ?? req.businessMeaning ?? 'Explain what the current script is trying to answer.';
  const resultSummary = req.expectedResultDescription ?? req.expectedResultShape?.[0] ?? 'Explain what the returned rows mean for the bakery.';
  const riskNotes = req.knownRiskNotes ?? [];
  const clauseItems = req.clauseBreakdown ?? [];

  useEffect(() => {
    if (!timerStartedAt || completedMs !== null) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [completedMs, timerStartedAt]);

  function toggleConnectionStep(step: string, checked: boolean) {
    if (checked && timerStartedAt === null) setTimerStartedAt(Date.now());
    setConnectionChecks((current) => {
      const next = { ...current, [step]: checked };
      if (Object.values(next).every(Boolean)) {
        const started = timerStartedAt ?? Date.now();
        setCompletedMs(Date.now() - started);
      } else if (!checked) {
        setCompletedMs(null);
      }
      return next;
    });
  }

  function toggleExecutionCheck(check: string, checked: boolean) {
    setExecutionChecks((current) => ({ ...current, [check]: checked }));
  }

  function pickAnother() {
    setSelectedId((current) => pickRandomRequirementId(current));
    setExecutionChecks(createCheckState(executionCheckLabels));
  }

  return (
    <section className="layout-safe space-y-4 workspace-canvas">
      <header className="workspace-shell p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Execution Workspace</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">Rehearse the AWS ritual and the script explanation in one place</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              This page is intentionally operational: connection steps on the left, selected functionality and explanation support on the right.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={pickAnother} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Pick another</button>
            <button onClick={() => navigate(`/sql-study/${req.id}`)} className="rounded-xl border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100">Open study card</button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <aside className="space-y-4 xl:sticky xl:top-4">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">AWS / Workbench drill</p>
                <h3 className="mt-1 text-lg font-bold text-slate-950">Connection ritual</h3>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${connectionReady ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {connectionReady ? `Complete in ${formatMs(connectionMs)}` : timerStartedAt ? formatMs(connectionMs) : 'Not started'}
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {connectionStepLabels.map((step) => (
                <label key={step} className={`grid cursor-pointer grid-cols-[16px_1fr] gap-3 rounded-2xl border px-3 py-2 text-sm ${connectionChecks[step] ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                  <input type="checkbox" checked={connectionChecks[step]} onChange={(event) => toggleConnectionStep(step, event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
                  <span>{step}</span>
                </label>
              ))}
            </div>
            <div className="workspace-panel workspace-panel-muted mt-4 rounded-2xl p-3 text-sm">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Saved credentials</p>
              <p className="mt-2 text-slate-700">Host: {progressStore.progress.settings.awsHost || 'not set'}</p>
              <p className="mt-1 text-slate-700">Username: {progressStore.progress.settings.awsUser || 'not set'}</p>
              <p className="mt-1 text-slate-700">Database: {progressStore.progress.settings.awsDatabase || 'not set'}</p>
              <p className="mt-1 text-slate-500">Port: 3306</p>
            </div>
          </Card>

          <Card>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Execution self-check</p>
            <div className="mt-3 space-y-2">
              {executionCheckLabels.map((label) => (
                <label key={label} className={`grid cursor-pointer grid-cols-[16px_1fr] gap-3 rounded-2xl border px-3 py-2 text-sm ${executionChecks[label] ? 'border-cyan-300 bg-cyan-50 text-cyan-950' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                  <input type="checkbox" checked={executionChecks[label]} onChange={(event) => toggleExecutionCheck(label, event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-600">Execution readiness: <span className="font-semibold text-slate-950">{Object.values(executionChecks).filter(Boolean).length} / {executionCheckLabels.length}</span></p>
          </Card>
        </aside>

        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Professor-picked number</p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-50 text-3xl font-extrabold text-cyan-700">
                    {requirementNumber(req.id)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">{req.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{officialTask}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(req.status)}`}>{req.status ?? 'study-ready'}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{req.tables.length} tables</span>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{currentMeaning}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {req.tables.map((table) => (
                <span key={table} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{table}</span>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Current script</p>
                <p className="mt-1 text-sm text-slate-600">Keep this visible while you rehearse how you would run and defend the functionality.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{req.currentScriptSource ?? 'group_script'}</span>
            </div>
            <div className="workspace-code-panel mt-4 rounded-3xl p-5 text-slate-100">
              <pre className="workspace-scroll sql-code-view overflow-auto text-[12.5px] leading-6" dangerouslySetInnerHTML={{ __html: highlightSql(req.sql) }} />
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Result rehearsal</p>
              <h3 className="mt-1 text-lg font-bold text-slate-950">What the output is supposed to mean</h3>
              <p className="mt-3 text-sm text-slate-700">{resultSummary}</p>
              <div className="mt-4 space-y-2">
                {(req.expectedResultShape ?? []).map((line) => (
                  <div key={line} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{line}</div>
                ))}
              </div>
            </Card>

            <Card>
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Live run policy</p>
              <h3 className="mt-1 text-lg font-bold text-slate-950">v1 does not block on database wiring</h3>
              <p className="mt-3 text-sm text-slate-700">This version is intentionally rehearsal-first. Use it to practice the ritual, the script lookup, and the result explanation. A safe server-backed runner can be added later if you want live execution support.</p>
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                One row should mean: {req.expectedResultShape?.[1] ?? 'Describe the reporting grain before you defend any clause.'}
              </div>
              {riskNotes.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-rose-700">Current script risk notes</p>
                  <div className="mt-2 space-y-2">
                    {riskNotes.map((note) => (
                      <p key={note} className="text-sm text-rose-900">{note}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>

            <Card>
              <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700">Clause defense</p>
              <h3 className="mt-1 text-lg font-bold text-slate-950">Explain the script one clause at a time</h3>
              <div className="mt-4 space-y-3">
                {clauseItems.map((item) => (
                  <LabDisclosure
                    key={`${req.id}-${item.clause}`}
                    accent="violet"
                    title={item.clause}
                    description={item.why}
                  >
                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">What it does generally</p>
                        <p className="mt-1 text-sm text-slate-700">{clauseMeaning(item.clause)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Likely professor ask</p>
                        <p className="mt-1 text-sm text-slate-700">{clauseLikelyQuestion(item.clause, req)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Strong answer guidance</p>
                        <p className="mt-1 text-sm text-slate-700">{clauseStrongAnswer(item.clause)}</p>
                      </div>
                    </div>
                  </LabDisclosure>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SqlProfessorMode({ navigate, progressStore }: { navigate: Navigate; progressStore: ProgressStoreLike }) {
  const [requirementId, setRequirementId] = useState(() => pickRandomRequirementId());
  const [easyMode, setEasyMode] = useState<SqlAnswerMode>('typed');
  const [hardMode, setHardMode] = useState<SqlAnswerMode>('typed');
  const [easyAnswer, setEasyAnswer] = useState('');
  const [hardAnswer, setHardAnswer] = useState('');
  const [easyChecks, setEasyChecks] = useState<Record<string, boolean>>({});
  const [hardChecks, setHardChecks] = useState<Record<string, boolean>>({});
  const [easyGrade, setEasyGrade] = useState<ChecklistAnswerGrade | null>(null);
  const [hardGrade, setHardGrade] = useState<ChecklistAnswerGrade | null>(null);
  const [executionChecks, setExecutionChecks] = useState<Record<string, boolean>>(() => createCheckState(executionCheckLabels));
  const [deliveryChecks, setDeliveryChecks] = useState<Record<string, boolean>>(() => createCheckState(deliveryCheckLabels));
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState(() => Date.now());

  const req = sqlRequirements.find((item) => item.id === requirementId) ?? sqlRequirements[0];
  const easyChecklist = req.easyChecklist ?? req.checklist.slice(0, Math.min(5, req.checklist.length));
  const hardChecklist = req.hardChecklist ?? req.checklist.slice(0, Math.min(5, req.checklist.length));
  const easyQuestion = req.easyQuestion ?? req.oralQuestions?.[0] ?? 'Define the key SQL concept that drives this script.';
  const hardQuestion = req.hardQuestion ?? req.oralQuestions?.[1] ?? 'Why is the main clause choice necessary in this script?';
  const officialTask = req.officialTask ?? req.desc;
  const currentMeaning = req.currentMeaning ?? req.businessMeaning ?? 'Explain what the script is trying to answer in plain English.';
  const resultSummary = req.expectedResultDescription ?? req.expectedResultShape?.[0] ?? 'Explain what the returned rows mean for the bakery.';
  const riskNotes = req.knownRiskNotes ?? [];
  const recentSessions = progressStore.progress.sqlOralSessions?.slice(0, 4) ?? [];
  const weakPoints = buildMissedSummary(progressStore.progress.sqlOralSessions ?? []).slice(0, 5);

  const liveScore = useMemo(() => {
    if (!easyGrade || !hardGrade) return null;
    return buildSqlOralScore({ executionChecks, easyGrade, hardGrade, deliveryChecks });
  }, [deliveryChecks, easyGrade, executionChecks, hardGrade]);

  function resetForRequirement(nextId: string) {
    setRequirementId(nextId);
    setEasyMode('typed');
    setHardMode('typed');
    setEasyAnswer('');
    setHardAnswer('');
    setEasyChecks({});
    setHardChecks({});
    setEasyGrade(null);
    setHardGrade(null);
    setExecutionChecks(createCheckState(executionCheckLabels));
    setDeliveryChecks(createCheckState(deliveryCheckLabels));
    setSavedSessionId(null);
    setSessionStartedAt(Date.now());
  }

  function nextRandom() {
    resetForRequirement(pickRandomRequirementId(requirementId));
  }

  function scoreEasy() {
    setSavedSessionId(null);
    setEasyGrade(
      easyMode === 'typed'
        ? gradeChecklistAnswer(easyAnswer, easyChecklist, 1, `${req.id}-easy`)
        : gradeManualChecklist(easyChecks, easyChecklist, 1),
    );
  }

  function scoreHard() {
    setSavedSessionId(null);
    setHardGrade(
      hardMode === 'typed'
        ? gradeChecklistAnswer(hardAnswer, hardChecklist, 2, `${req.id}-hard`)
        : gradeManualChecklist(hardChecks, hardChecklist, 2),
    );
  }

  function toggleCheck(
    setState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
    item: string,
    checked: boolean,
  ) {
    setSavedSessionId(null);
    setState((current) => ({ ...current, [item]: checked }));
  }

  function saveSession() {
    if (!liveScore || savedSessionId) return;
    const sessionId = `sql-oral-${Date.now()}`;
    const session: SqlOralSession = {
      id: sessionId,
      startedAt: new Date(sessionStartedAt).toISOString(),
      requirementId: req.id,
      executionScore: liveScore.executionScore,
      easyScore: liveScore.easyScore,
      hardScore: liveScore.hardScore,
      deliveryScore: liveScore.deliveryScore,
      total: liveScore.total,
      easyAnswerMode: easyMode,
      hardAnswerMode: hardMode,
      easyAnswer,
      hardAnswer,
      easyMatched: easyGrade?.matched ?? [],
      easyMissed: easyGrade?.missed ?? [],
      hardMatched: hardGrade?.matched ?? [],
      hardMissed: hardGrade?.missed ?? [],
      verdict: liveScore.verdict,
      coachNote: liveScore.coachNote,
      durationSeconds: Math.max(1, Math.round((Date.now() - sessionStartedAt) / 1000)),
    };
    progressStore.saveSqlOralSession(session);
    progressStore.recordAttempt(req.id, masteryFromTotal(liveScore.total), confidenceFromTotal(liveScore.total));
    setSavedSessionId(sessionId);
  }

  return (
    <section className="layout-safe space-y-4 workspace-canvas">
      <header className="workspace-shell p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Professor Workspace</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">Run the mock oral as one disciplined canvas</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Brief the functionality, answer the easy concept, answer the hard why-question, then score the delivery. No alternate modes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={nextRandom} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Pick another</button>
            <button onClick={() => navigate(`/sql-study/${req.id}`)} className="rounded-xl border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100">Open study card</button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <aside className="space-y-4 xl:sticky xl:top-4">
          <Card>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Professor-picked functionality</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-violet-50 text-4xl font-extrabold text-violet-700">
                {requirementNumber(req.id)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-950">{req.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{officialTask}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-950">Current script is trying to do</p>
              <p className="mt-1">{currentMeaning}</p>
            </div>
            <div className="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900">
              <p className="font-semibold text-cyan-950">Expected result meaning</p>
              <p className="mt-1">{resultSummary}</p>
            </div>
            <div className="mt-3">
              <LabDisclosure accent="slate" title="Script preview" description="Keep the SQL nearby without flooding the main workspace.">
                <div className="workspace-code-panel rounded-3xl p-4 text-slate-100">
                  <pre className="workspace-scroll sql-code-view overflow-auto text-[12px] leading-6" dangerouslySetInnerHTML={{ __html: highlightSql(req.sql) }} />
                </div>
              </LabDisclosure>
            </div>
            {riskNotes.length > 0 ? (
              <div className="mt-3">
                <LabDisclosure accent="rose" title="Current script risk notes" description="Useful warning layer for oral defense.">
                  <div className="space-y-2">
                    {riskNotes.map((note) => (
                      <p key={note} className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{note}</p>
                    ))}
                  </div>
                </LabDisclosure>
              </div>
            ) : null}
          </Card>

          <Card>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Recent oral sessions</p>
            {recentSessions.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No professor-mode sessions saved yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {recentSessions.map((session) => (
                  <div key={session.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-950">{requirementNumber(session.requirementId)}. {sqlRequirements.find((item) => item.id === session.requirementId)?.title ?? session.requirementId}</p>
                    <p className="mt-1">{session.total} / 25 · {session.verdict}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Most-missed oral points</p>
              <div className="mt-2 space-y-2 text-sm text-amber-900">
                {weakPoints.length === 0 ? <p>No repeated misses yet.</p> : weakPoints.map((item) => <p key={item.label}>- {item.label} ({item.count})</p>)}
              </div>
            </div>
          </Card>
        </aside>

        <div className="space-y-4">
          <section className="workspace-shell p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Oral briefing</p>
                <h2 className="mt-1 text-lg font-bold text-slate-950">Say what the query answers, why the tables and clauses are needed, and what the result means</h2>
                <p className="mt-2 text-sm text-slate-600">{currentMeaning}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(req.status)}`}>{req.status ?? 'study-ready'}</span>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">{req.tables.length} tables in play</span>
              </div>
            </div>
          </section>

          <AnswerSection
            accent="blue"
            title="Easy Question"
            question={easyQuestion}
            checklist={easyChecklist}
            weight={1}
            mode={easyMode}
            answer={easyAnswer}
            manualChecks={easyChecks}
            grade={easyGrade}
            onModeChange={setEasyMode}
            onAnswerChange={setEasyAnswer}
            onManualToggle={(item, checked) => toggleCheck(setEasyChecks, item, checked)}
            onScore={scoreEasy}
          />

          <AnswerSection
            accent="amber"
            title="Hard Question"
            question={hardQuestion}
            checklist={hardChecklist}
            weight={2}
            mode={hardMode}
            answer={hardAnswer}
            manualChecks={hardChecks}
            grade={hardGrade}
            onModeChange={setHardMode}
            onAnswerChange={setHardAnswer}
            onManualToggle={(item, checked) => toggleCheck(setHardChecks, item, checked)}
            onScore={scoreHard}
          />

          <Card>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Execution checklist</p>
                <div className="mt-3 space-y-2">
                  {executionCheckLabels.map((label) => (
                    <label key={label} className={`grid cursor-pointer grid-cols-[16px_1fr] gap-3 rounded-2xl border px-3 py-2 text-sm ${executionChecks[label] ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                      <input type="checkbox" checked={executionChecks[label]} onChange={(event) => toggleCheck(setExecutionChecks, label, event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Delivery checklist</p>
                <div className="mt-3 space-y-2">
                  {deliveryCheckLabels.map((label) => (
                    <label key={label} className={`grid cursor-pointer grid-cols-[16px_1fr] gap-3 rounded-2xl border px-3 py-2 text-sm ${deliveryChecks[label] ? 'border-violet-300 bg-violet-50 text-violet-950' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                      <input type="checkbox" checked={deliveryChecks[label]} onChange={(event) => toggleCheck(setDeliveryChecks, label, event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {liveScore ? (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">25-point score</p>
                    <h3 className="mt-1 text-xl font-extrabold text-slate-950">{liveScore.total} / 25</h3>
                    <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${verdictTone(liveScore.verdict)}`}>{liveScore.verdict}</p>
                  </div>
                  <div className="text-sm text-slate-700">
                    <p>Execution: {liveScore.executionScore} / 5</p>
                    <p>Easy: {liveScore.easyScore} / 5</p>
                    <p>Hard: {liveScore.hardScore} / 10</p>
                    <p>Delivery: {liveScore.deliveryScore} / 5</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">What you got right</p>
                    <div className="mt-3 space-y-2 text-sm text-emerald-900">
                      {[...(easyGrade?.matched ?? []), ...(hardGrade?.matched ?? [])].slice(0, 6).map((item) => (
                        <p key={item}>- {item}</p>
                      ))}
                      {(easyGrade?.matched.length ?? 0) + (hardGrade?.matched.length ?? 0) === 0 ? <p>No rubric point matched yet.</p> : null}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">What you missed</p>
                    <div className="mt-3 space-y-2 text-sm text-amber-900">
                      {[...(easyGrade?.missed ?? []), ...(hardGrade?.missed ?? [])].slice(0, 6).map((item) => (
                        <p key={item}>- {item}</p>
                      ))}
                      {(easyGrade?.missed.length ?? 0) + (hardGrade?.missed.length ?? 0) === 0 ? <p>Complete checklist coverage.</p> : null}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Coach note</p>
                  <p className="mt-2 text-sm text-slate-700">{liveScore.coachNote}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={saveSession} disabled={Boolean(savedSessionId)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                    {savedSessionId ? 'Session Saved' : 'Save Session'}
                  </button>
                  <button onClick={nextRandom} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Try Another</button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">Score the easy and hard answers first. Then check execution and delivery to see the full 25-point result.</p>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}

export function SqlTableInspector({ navigate }: { navigate: Navigate }) {
  const [search, setSearch] = useState('');

  const tables = useMemo(() => {
    const byTable = new Map<string, SqlRequirement[]>();
    sqlRequirements.forEach((req) => {
      req.tables.forEach((table) => {
        const current = byTable.get(table) ?? [];
        current.push(req);
        byTable.set(table, current);
      });
    });

    return Array.from(byTable.entries())
      .map(([name, requirements]) => {
        const entity = entities.find((item) => item.name.toLowerCase() === name.toLowerCase());
        return {
          name,
          requirements,
          description: entity?.description ?? `Used in ${requirements.length} functionality ${requirements.length === 1 ? 'card' : 'cards'} for current oral-exam study.`,
          primaryKey: entity?.primaryKey ?? [],
          foreignKeys: entity?.foreignKeys ?? [],
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filtered = tables.filter((table) => table.name.toLowerCase().includes(search.toLowerCase()));
  const quizTable = filtered[0] ?? tables[0];
  const quizReveal = false;
  const setQuizReveal: React.Dispatch<React.SetStateAction<boolean>> = () => undefined;

  return (
    <section className="layout-safe space-y-4">
      {/* Compact header for side navigation layout */}
<header className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
  <div className="flex items-center justify-between gap-2">
    <h1 className="text-lg font-bold text-slate-950">Table Inspector</h1>
  </div>
</header>

      <div className="space-y-4">
        {false && (
        <Card>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Quick quiz</p>
          <h3 className="mt-1 text-lg font-bold text-slate-950">{quizTable?.name ?? 'No table available'}</h3>
          <p className="mt-3 text-sm text-slate-700">If the professor says “open this table,” say what it stores and which functionality scripts depend on it.</p>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>Prompt 1: What does this table store?</p>
            <p className="mt-2">Prompt 2: Which functionality uses it and why?</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => setQuizReveal((current) => !current)} className="rounded-xl border border-violet-300 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50">{quizReveal ? 'Hide Answer' : 'Reveal Answer'}</button>
          </div>
          {quizReveal && quizTable ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{quizTable.description}</div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">Functionalities using it</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {quizTable.requirements.map((req) => (
                    <button key={req.id} onClick={() => navigate(`/sql-study/${req.id}`)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                      {requirementNumber(req.id)}. {req.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </Card>
        )}

        <div className="space-y-4">
          <Card>
            <label className="block text-sm text-slate-700">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Search tables</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500" placeholder="Customer, OrderLine, HolidaySale..." />
            </label>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((table) => (
              <Card key={table.name}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">{table.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">{table.description}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{table.requirements.length} use{table.requirements.length === 1 ? '' : 's'}</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Primary key</p>
                    <p className="mt-1">{table.primaryKey.length > 0 ? table.primaryKey.join(', ') : 'Not mapped in ERD support data.'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Foreign keys</p>
                    <p className="mt-1">{table.foreignKeys.length > 0 ? table.foreignKeys.join(', ') : 'No FK list available in support data.'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Functionality uses this</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {table.requirements.map((req) => (
                      <button key={req.id} onClick={() => navigate(`/sql-study/${req.id}`)} className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100">
                        {requirementNumber(req.id)}. {req.title}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900">
                  Likely oral prompt: What business question does this table help answer in {table.requirements[0]?.title ?? 'the selected functionality'}?
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AnswerSection({
  accent,
  title,
  question,
  checklist,
  weight,
  mode,
  answer,
  manualChecks,
  grade,
  onModeChange,
  onAnswerChange,
  onManualToggle,
  onScore,
}: AnswerSectionProps) {
  const accentClass = accent === 'amber' ? 'text-amber-700' : 'text-blue-700';
  const panelClass = accent === 'amber' ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-blue-300 bg-blue-50 text-blue-950';

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-[11px] font-bold uppercase tracking-wide ${accentClass}`}>{title}</p>
          <h3 className="mt-1 text-lg font-bold text-slate-950">{question}</h3>
        </div>
        <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
          <button onClick={() => onModeChange('typed')} className={`rounded-xl px-3 py-2 text-sm font-semibold ${mode === 'typed' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Typed answer</button>
          <button onClick={() => onModeChange('out-loud')} className={`rounded-xl px-3 py-2 text-sm font-semibold ${mode === 'out-loud' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Answered out loud</button>
        </div>
      </div>

      {mode === 'typed' ? (
        <div className="mt-4">
          <textarea value={answer} onChange={(event) => onAnswerChange(event.target.value)} placeholder="Type the answer you would give out loud." className="min-h-[160px] w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-slate-500" />
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {checklist.map((item) => (
            <label key={item} className={`grid cursor-pointer grid-cols-[16px_1fr] gap-3 rounded-2xl border px-3 py-2 text-sm ${manualChecks[item] ? panelClass : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
              <input type="checkbox" checked={Boolean(manualChecks[item])} onChange={(event) => onManualToggle(item, event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
              <span>{item}</span>
            </label>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={onScore} disabled={mode === 'typed' && answer.trim().length < 8} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
          Score {title}
        </button>
        <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">{weight === 1 ? 'Worth 5 points total' : 'Worth 10 points total'}</span>
      </div>

      {grade ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Matched</p>
            <p className="mt-1 text-lg font-extrabold text-emerald-900">{grade.weightedScore} / {grade.maxScore * weight}</p>
            <div className="mt-3 space-y-2 text-sm text-emerald-900">
              {grade.matched.length === 0 ? <p>No rubric point matched yet.</p> : grade.matched.map((item) => <p key={item}>- {item}</p>)}
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Still missing</p>
            <div className="mt-3 space-y-2 text-sm text-amber-900">
              {grade.missed.length === 0 ? <p>Complete checklist coverage.</p> : grade.missed.map((item) => <p key={item}>- {item}</p>)}
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function LabDisclosure({
  accent,
  title,
  description,
  children,
  defaultOpen = false,
}: {
  accent: 'violet' | 'rose' | 'slate';
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const toneClass =
    accent === 'violet'
      ? 'bg-violet-100 text-violet-700'
      : accent === 'rose'
        ? 'bg-rose-100 text-rose-700'
        : 'bg-slate-100 text-slate-600';

  return (
    <details open={defaultOpen} className="rounded-2xl border border-slate-200 bg-slate-50">
      <summary className="cursor-pointer list-none px-4 py-4 [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">{title}</p>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${toneClass}`}>Details</span>
        </div>
      </summary>
      <div className="border-t border-slate-200 px-4 py-4">{children}</div>
    </details>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="workspace-panel p-4">{children}</section>;
}

function createCheckState(items: readonly string[]) {
  return Object.fromEntries(items.map((item) => [item, false])) as Record<string, boolean>;
}

function pickRandomRequirementId(exclude?: string) {
  const pool = sqlRequirements.filter((item) => item.id !== exclude);
  const picked = pool[Math.floor(Math.random() * pool.length)] ?? sqlRequirements[0];
  return picked.id;
}

function requirementNumber(id: string) {
  return String(Number(id.replace('sql-', '')));
}

function statusTone(status?: SqlRequirement['status']) {
  if (status === 'risky') return 'bg-rose-100 text-rose-700';
  if (status === 'draft') return 'bg-amber-100 text-amber-800';
  return 'bg-emerald-100 text-emerald-700';
}

function verdictTone(verdict: ReturnType<typeof verdictFromTotal>) {
  if (verdict === 'strong') return 'bg-emerald-100 text-emerald-700';
  if (verdict === 'shaky') return 'bg-amber-100 text-amber-800';
  return 'bg-rose-100 text-rose-700';
}

function masteryFromTotal(total: number): MasteryResult {
  if (total >= 20) return 'correct';
  if (total >= 13) return 'partial';
  return 'incorrect';
}

function confidenceFromTotal(total: number) {
  if (total >= 20) return 5;
  if (total >= 13) return 3;
  return 2;
}

function formatMs(ms: number) {
  const seconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

function buildMissedSummary(sessions: SqlOralSession[]) {
  const counts = new Map<string, number>();
  sessions.forEach((session) => {
    [...session.easyMissed, ...session.hardMissed].forEach((item) => {
      counts.set(item, (counts.get(item) ?? 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
