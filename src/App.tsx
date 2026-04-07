import { useEffect, useState } from 'react';
import {
  associativeById,
  associativeEntities,
  domainById,
  domains,
  entities,
  entitiesForDomain,
  entityById,
  erdHotspotByEntityId,
  erdHotspots,
  getDomainName,
  getEntityName,
  oralQuestions,
  relationshipById,
  relationshipLabel,
  relationships,
  relationshipsForDomain,
  subtypes,
} from './lib/content';
import { buildWeakSpotAnalytics, calculateTodayStudyTime, getItemProgress, masteryLabel, useProgressStore } from './lib/progress';
import { pickAssociativeEntity, pickEntity, pickRelationship } from './lib/questions';
import type {
  AssociativeEntity,
  Entity,
  ErdHotspot,
  MasteryResult,
  OralQuestion,
  ProgressState,
  Relationship,
  SubtypeRelationship,
} from './types';

type Navigate = (path: string) => void;
type DrillMode = 'purpose' | 'pk' | 'fk' | 'attributes' | 'domain';

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Study', path: '/study' },
  { label: 'Flashcards', path: '/study/flashcards' },
  { label: 'Visual ERD', path: '/study/erd-visual' },
  { label: 'Cheat Sheet', path: '/study/cheat-sheet' },
  { label: 'Practice', path: '/practice' },
  { label: 'Mock Oral', path: '/mock-oral' },
  { label: 'Review', path: '/review' },
  { label: 'Progress', path: '/progress' },
  { label: 'Settings', path: '/settings' },
];

const entityModes: DrillMode[] = ['purpose', 'pk', 'fk', 'attributes', 'domain'];
const likelyOralRelationshipIds = ['rule-01', 'rule-05', 'rule-22', 'rule-21', 'rule-34', 'rule-13', 'rule-18', 'rule-40', 'rule-43'];
const likelyOralBridgeIds = ['customerallergyinfo'];
const fkPlacementRules = [
  '1:M relationship: put the foreign key on the many side.',
  '1:1 relationship: put the foreign key where the design can best enforce optionality and uniqueness, then justify it clearly.',
  'M:N relationship: do not place a direct FK on either source table. Create an associative entity.',
  'Associative entity: use the related primary keys as foreign keys, often as a composite primary key.',
  'Subtype relationship: the subtype table uses the supertype primary key as its own primary key and foreign key.',
];
const erdImageSrc = `${import.meta.env.BASE_URL}erd/group8-erd.png`;
const erdPdfSrc = `${import.meta.env.BASE_URL}erd/group8-erd.pdf`;

export default function App() {
  const route = useRoute();
  const progressStore = useProgressStore();
  const fontClass =
    progressStore.progress.settings.fontScale === 'lg'
      ? 'text-[18px]'
      : progressStore.progress.settings.fontScale === 'sm'
        ? 'text-[14px]'
        : 'text-[16px]';

  return (
    <div className={`min-h-screen bakery-gradient-bg text-ink ${fontClass}`}>
      <AppShell path={route.path} navigate={route.navigate}>
        <RouteRenderer path={route.path} navigate={route.navigate} progressStore={progressStore} />
      </AppShell>
    </div>
  );
}

function RouteRenderer({
  path,
  navigate,
  progressStore,
}: {
  path: string;
  navigate: Navigate;
  progressStore: ReturnType<typeof useProgressStore>;
}) {
  if (path === '/') return <Dashboard navigate={navigate} progressStore={progressStore} />;
  if (path === '/study') return <StudyHub navigate={navigate} progressStore={progressStore} />;
  if (path === '/study/flashcards') return <StudyFlashcards progressStore={progressStore} />;
  if (path === '/study/erd-visual') return <VisualErdPractice progressStore={progressStore} />;
  if (path === '/study/cheat-sheet') return <CheatSheet navigate={navigate} />;
  if (path === '/practice') return <PracticeHub navigate={navigate} progressStore={progressStore} />;
  if (path === '/practice/quick-drills') return <QuickDrills progressStore={progressStore} />;
  if (path === '/practice/free-recall') return <FreeRecallDrill progressStore={progressStore} />;
  if (path === '/study/domains') return <DomainIndex navigate={navigate} progressStore={progressStore} />;
  if (path.startsWith('/study/domains/')) {
    return <DomainDetail domainId={lastPathPart(path)} navigate={navigate} progressStore={progressStore} />;
  }
  if (path === '/study/entities') return <EntityMastery progressStore={progressStore} />;
  if (path.startsWith('/study/entities/')) {
    return <EntityDetail entityId={lastPathPart(path)} navigate={navigate} progressStore={progressStore} />;
  }
  if (path === '/study/relationships') return <RelationshipBuilder progressStore={progressStore} />;
  if (path.startsWith('/study/relationships/')) {
    return <RelationshipDetail relationshipId={lastPathPart(path)} navigate={navigate} progressStore={progressStore} />;
  }
  if (path === '/study/fk-logic') return <FkLogicTrainer progressStore={progressStore} />;
  if (path === '/study/associative-entities') return <AssociativeEntityDrill progressStore={progressStore} />;
  if (path.startsWith('/study/associative-entities/')) {
    return <AssociativeDetail entityId={lastPathPart(path)} navigate={navigate} progressStore={progressStore} />;
  }
  if (path === '/study/subtypes') return <SubtypeDrill progressStore={progressStore} />;
  if (path === '/mock-oral') return <MockOralSetup navigate={navigate} progressStore={progressStore} />;
  if (path === '/mock-oral/session') return <MockOralSession navigate={navigate} progressStore={progressStore} />;
  if (path === '/mock-oral/exam') return <MockOralSession navigate={navigate} progressStore={progressStore} strict />;
  if (path === '/review') return <ReviewMistakes navigate={navigate} progressStore={progressStore} />;
  if (path === '/review/weak-spots') return <WeakSpotAnalytics navigate={navigate} progressStore={progressStore} />;
  if (path === '/review/mock-replays') return <MockOralReplays progressStore={progressStore} />;
  if (path === '/progress') return <ProgressAnalytics navigate={navigate} progressStore={progressStore} />;
  if (path === '/settings') return <SettingsScreen progressStore={progressStore} />;
  return <NotFound navigate={navigate} />;
}

function AppShell({ children, path, navigate }: { children: React.ReactNode; path: string; navigate: Navigate }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1920px]">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-pink-100 bg-white/90 px-5 py-6 shadow-[2px_0_16px_rgba(236,72,153,0.06)] lg:block" style={{ backdropFilter: 'blur(8px)' }}>
        <button className="mb-8 text-left group" onClick={() => navigate('/')}>
          <span className="mb-2 block text-2xl">🧁</span>
          <span className="block text-xs font-bold uppercase tracking-widest text-pink-400">CIS 4365 Group 8</span>
          <span
            className="block text-xl font-extrabold leading-tight"
            style={{
              background: 'linear-gradient(135deg,#f59e0b,#ec4899,#8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Bakery ERD
            <br />
            Oral Trainer
          </span>
          <span className="mt-1 block text-[11px] text-slate-400">Mama's Little Bakery</span>
        </button>
        <nav aria-label="Primary navigation" className="space-y-1">
          {navItems.map((item) => (
            <NavButton key={item.path} item={item} active={isActivePath(path, item.path)} navigate={navigate} />
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">{children}</main>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-pink-100 bg-white/95 px-2 py-2 shadow-[0_-4px_20px_rgba(236,72,153,0.08)] lg:hidden"
        style={{ backdropFilter: 'blur(8px)' }}
      >
        {navItems.slice(0, 10).map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`rounded-lg px-1 py-2 text-[10px] font-semibold flex flex-col items-center gap-0.5 ${
              isActivePath(path, item.path) ? 'bg-pink-50 text-pink-600' : 'text-slate-500'
            }`}
          >
            <span className="text-[11px] leading-none">{item.label.split(' ')[0]}</span>
            <span className="leading-none">{item.label.split(' ')[1] ?? ''}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function NavButton({
  item,
  active,
  navigate,
}: {
  item: { label: string; path: string };
  active: boolean;
  navigate: Navigate;
}) {
  return (
    <button
      onClick={() => navigate(item.path)}
      className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 shadow-sm border border-pink-100'
          : 'text-slate-600 hover:bg-gradient-to-r hover:from-slate-50 hover:to-pink-50 hover:text-slate-900'
      }`}
    >
      {item.label}
    </button>
  );
}

function Dashboard({
  navigate,
  progressStore,
}: {
  navigate: Navigate;
  progressStore: ReturnType<typeof useProgressStore>;
}) {
  const { progress, analytics } = progressStore;
  const recent = progress.mockOrals.slice(0, 3);
  const todayMs = calculateTodayStudyTime(progress.studySessions);
  const totalHours = (progress.totalStudyTimeMs / 3_600_000).toFixed(1);

  return (
    <Page title="🏠 Dashboard" eyebrow="✨ Solo oral exam practice" action={<PrimaryButton onClick={() => navigate('/mock-oral/session')}>🎤 Start Mock Oral</PrimaryButton>}>

      {/* Bakery ERD Illustration Banner */}
      <BakeryIllustration />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-pink-100 bg-gradient-to-br from-white to-pink-50/40">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-pink-500">🧁 Overall readiness</p>
              <h2 className="mt-2 text-5xl font-extrabold text-slate-950">{percent(progress.overallReadiness)}</h2>
              <p className="mt-3 max-w-2xl text-slate-600">
                Practice is weighted across <strong>41 entities</strong> 🏷️ and <strong>46 ERD relationship rules</strong> 🔗. New items start at zero until you drill them.
              </p>
            </div>
            <ReadinessRing value={progress.overallReadiness} />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <Metric label="🎯 Attempted" value={String(analytics.attemptedCount)} />
            <Metric label="⭐ Mastered" value={String(analytics.masteredCount)} />
            <Metric label="🔥 Streak" value={String(progress.streak)} />
            <Metric label="⏱️ Today" value={todayMs > 0 ? formatStudyTime(todayMs) : '—'} />
          </div>
        </Card>
        <Card className="border-purple-100 bg-gradient-to-br from-white to-purple-50/30">
          <h2 className="text-xl font-bold text-slate-950">💡 Recommended next action</h2>
          <p className="mt-2 text-slate-600">
            {analytics.weakestDomain
              ? `🎯 Review ${analytics.weakestDomain.domain.name}. Current domain mastery is ${percent(analytics.weakestDomain.mastery)}.`
              : '🚀 Start with Entity Mastery, then run a mock oral!'}
          </p>
          <p className="mt-2 text-sm text-slate-500">⏰ Total study time: {totalHours}h</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <SecondaryButton onClick={() => navigate('/practice/quick-drills')}>⚡ Quick Drills</SecondaryButton>
            <SecondaryButton onClick={() => navigate('/practice/free-recall')}>✍️ Free Recall</SecondaryButton>
            <SecondaryButton onClick={() => navigate('/review')}>🔍 Review Mistakes</SecondaryButton>
          </div>
        </Card>
      </div>

      <SectionHeader title="🗂️ Domain mastery" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {analytics.domainProgress.map(({ domain, mastery }) => (
          <button key={domain.id} onClick={() => navigate(`/study/domains/${domain.id}`)} className="text-left">
            <Card className={`h-full card-hover-magic ${mastery >= 0.75 ? 'border-green-200' : mastery >= 0.4 ? 'border-amber-200' : 'border-red-100'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">{domainEmoji(domain.name)} {domain.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">{domain.description}</p>
                </div>
                <ProgressBadge value={mastery} />
              </div>
              <ProgressBar value={mastery} className="mt-5" />
            </Card>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-red-100 bg-gradient-to-br from-white to-red-50/30">
          <h2 className="text-xl font-bold text-slate-950">🎯 Weak areas</h2>
          <ItemList empty="🎉 No missed items yet — keep it up!" items={analytics.weakItems} navigate={navigate} />
        </Card>
        <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
          <h2 className="text-xl font-bold text-slate-950">🎤 Recent mock orals</h2>
          {recent.length === 0 ? (
            <p className="mt-3 text-slate-500">✨ No mock oral sessions yet — run one!</p>
          ) : (
            <div className="mt-4 space-y-3">
              {recent.map((session) => (
                <div key={session.id} className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
                  <p className="font-semibold text-slate-950">
                    🏅 Score {session.score}/{session.maxScore}
                    {session.score >= 8 && ' 🌟'}
                    {session.score >= 5 && session.score < 8 && ' 👍'}
                    {session.score < 5 && ' 💪'}
                  </p>
                  <p className="text-sm text-slate-500">{formatDate(session.startedAt)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}

function StudyHub({
  navigate,
  progressStore,
}: {
  navigate: Navigate;
  progressStore: ReturnType<typeof useProgressStore>;
}) {
  const modules = [
    ['🃏 1. Flashcards', 'Review flashcards, domains, model oral answers, and key fields before testing yourself.', '/study/flashcards'],
    ['📋 Cheat Sheet', 'Review the six domains, bridge entities, subtypes, FK rules, and likely oral targets in one place.', '/study/cheat-sheet'],
    ['🗺️ Visual ERD', 'Practice finding entities and tracing relationships on the real Group 8 ERD diagram.', '/study/erd-visual'],
    ['🏋️ 2. Practice', 'Use auto-graded entity recall, business rules, FK logic, bridges, and subtypes.', '/practice'],
    ['🎤 3. Mock Oral', 'Run the normal five-minute simulation with self-grading and answer review.', '/mock-oral/session'],
    ['🔒 Strict Exam Mode', 'No hints or answer reveal until you finish answering and enter the final self-score step.', '/mock-oral/exam'],
    ['🗂️ Domain Map', 'Browse the six domains and see which entities and rules belong to each one.', '/study/domains'],
  ];

  return (
    <Page title="📚 Study Flow" eyebrow={`✨ ${percent(progressStore.progress.overallReadiness)} readiness`}>
      <Card className="mb-5 border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50">
        <h2 className="text-xl font-bold text-slate-950">🍰 Recommended study order</h2>
        <p className="mt-2 text-slate-700">
          Start by studying with flashcards 🃏, move into checked practice drills 🏋️, then finish with a timed mock oral 🎤. Layer by layer, like a cake!
        </p>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {modules.map(([title, description, route]) => (
          <button key={route} onClick={() => navigate(route)} className="text-left">
            <Card className="h-full card-hover-magic hover:border-pink-200">
              <h2 className="text-xl font-bold text-slate-950">{title}</h2>
              <p className="mt-3 text-slate-600">{description}</p>
            </Card>
          </button>
        ))}
      </div>
    </Page>
  );
}

function CheatSheet({ navigate }: { navigate: Navigate }) {
  const likelyRelationships = likelyOralRelationshipIds
    .map((id) => relationshipById[id])
    .filter((relationship): relationship is Relationship => Boolean(relationship));
  const likelyBridges = likelyOralBridgeIds
    .map((id) => associativeById[id])
    .filter((bridge): bridge is AssociativeEntity => Boolean(bridge));

  return (
    <Page
      title="Cheat Sheet"
      eyebrow="Fast ERD recall"
      action={<SecondaryButton onClick={() => navigate('/mock-oral/exam')}>Start Exam Mode</SecondaryButton>}
    >
      <Card className="mb-5 border-pink-200 bg-gradient-to-r from-pink-50 to-amber-50">
        <h2 className="text-xl font-bold text-slate-950">🎤 Oral answer formula</h2>
        <p className="mt-2 text-slate-700">
          🏁 Start with <strong>purpose</strong> → then say the <strong>key fields</strong> 🔑 → both sides of the <strong>relationship</strong> 🔗 → <strong>cardinality</strong> 📐 → why the FK or bridge entity is placed there 📌
        </p>
        <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[11px] font-bold text-slate-500">
          <span className="rounded-lg bg-white/80 p-1">Purpose 🎯</span>
          <span className="rounded-lg bg-white/80 p-1">Keys 🔑</span>
          <span className="rounded-lg bg-white/80 p-1">Both sides 🔗</span>
          <span className="rounded-lg bg-white/80 p-1">Cardinality 📐</span>
          <span className="rounded-lg bg-white/80 p-1">FK logic 📌</span>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold text-slate-950">Six domains</h2>
          <div className="mt-4 grid gap-3">
            {domains.map((domain) => (
              <button
                key={domain.id}
                onClick={() => navigate(`/study/domains/${domain.id}`)}
                className="rounded-lg border border-line p-3 text-left hover:border-blue-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-slate-950">{domain.name}</strong>
                  <span className="text-sm text-slate-500">
                    {domain.entityIds.length} entities, {domain.relationshipIds.length} rules
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{domain.description}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-950">Six associative entities</h2>
          <div className="mt-4 grid gap-3">
            {associativeEntities.map((bridge) => (
              <button
                key={bridge.id}
                onClick={() => navigate(`/study/associative-entities/${bridge.id}`)}
                className="rounded-lg border border-line p-3 text-left hover:border-blue-300"
              >
                <strong className="text-slate-950">{bridge.name}</strong>
                <p className="mt-1 text-sm text-slate-600">{bridge.description}</p>
                <p className="mt-2 text-sm text-slate-500">Resolves: {bridge.resolves.map(getEntityName).join(' + ')}</p>
                <p className="mt-1 font-mono text-sm text-slate-700">{bridge.compositePrimaryKey.join(' + ')}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-950">Subtype relationships</h2>
          <div className="mt-4 grid gap-3">
            {subtypes.map((subtype) => (
              <button
                key={subtype.id}
                onClick={() => navigate('/study/subtypes')}
                className="rounded-lg border border-line p-3 text-left hover:border-blue-300"
              >
                <strong className="text-slate-950">
                  {getEntityName(subtype.subtypeId)} → {getEntityName(subtype.supertypeId)}
                </strong>
                <p className="mt-1 text-sm text-slate-600">{subtype.description}</p>
                <p className="mt-2 font-mono text-sm text-slate-700">Shared key: {subtype.primaryKey.join(', ')}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-950">🔑 FK placement rules</h2>
          <ul className="mt-4 space-y-3 text-slate-700">
            {fkPlacementRules.map((rule, i) => (
              <li key={rule} className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 flex gap-2 items-start">
                <span className="shrink-0 text-base">{['📍','📍','🌉','🌉','🌿'][i]}</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <SectionHeader title="Most likely oral targets" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold text-slate-950">Relationships to know cold</h2>
          <div className="mt-4 grid gap-2">
            {likelyRelationships.map((relationship) => (
              <button
                key={relationship.id}
                onClick={() => navigate(`/study/relationships/${relationship.id}`)}
                className="rounded-lg border border-line p-3 text-left hover:border-blue-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-slate-950">{relationshipLabel(relationship)}</strong>
                  <span className="rounded bg-blue-100 px-2 py-1 text-sm font-bold text-blue-700">{relationship.cardinality}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{relationship.ruleForward}</p>
                <p className="mt-1 text-sm text-slate-600">{relationship.ruleReverse}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-950">Bridge and subtype targets</h2>
          <div className="mt-4 grid gap-2">
            {likelyBridges.map((bridge) => (
              <button
                key={bridge.id}
                onClick={() => navigate(`/study/associative-entities/${bridge.id}`)}
                className="rounded-lg border border-line p-3 text-left hover:border-blue-300"
              >
                <strong className="text-slate-950">{bridge.name}</strong>
                <p className="mt-1 text-sm text-slate-600">
                  Explain how {bridge.resolves.map(getEntityName).join(' and ')} connect through this bridge.
                </p>
              </button>
            ))}
            {subtypes.map((subtype) => (
              <button
                key={subtype.id}
                onClick={() => navigate('/study/subtypes')}
                className="rounded-lg border border-line p-3 text-left hover:border-blue-300"
              >
                <strong className="text-slate-950">
                  {getEntityName(subtype.subtypeId)} as a subtype of {getEntityName(subtype.supertypeId)}
                </strong>
                <p className="mt-1 text-sm text-slate-600">Explain the shared key and why not every supertype row needs this subtype.</p>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </Page>
  );
}

function PracticeHub({
  navigate,
  progressStore,
}: {
  navigate: Navigate;
  progressStore: ReturnType<typeof useProgressStore>;
}) {
  const modules = [
    ['⚡ Quick Drills', '2-minute lightning round — rapid self-grade drills to warm up or reinforce.', '/practice/quick-drills'],
    ['✍️ Free Recall', 'Type your answer from memory — no multiple choice, no scaffolding.', '/practice/free-recall'],
    ['🗺️ Visual ERD', 'Find entities and trace relationships directly on the actual ERD.', '/study/erd-visual'],
    ['🏷️ Entity Mastery', 'Auto-graded PK, FK, attributes, domain recall, plus oral purpose practice.', '/study/entities'],
    ['🔗 Business Rules', 'Self-grade both directions, cardinality, and FK explanation.', '/study/relationships'],
    ['🔑 FK Logic', 'Rapid-fire placement questions with immediate right/wrong feedback.', '/study/fk-logic'],
    ['🌉 Associative Entities', 'Bridge table identification, composite keys, and extra attributes.', '/study/associative-entities'],
    ['🌿 Subtype Drill', 'SeasonalItem and GiftCard subtype explanation practice.', '/study/subtypes'],
    ['🔍 Review Mistakes', 'Retry weak or recently missed items.', '/review'],
  ];

  return (
    <Page title="🏋️ Practice" eyebrow={`✨ ${percent(progressStore.progress.overallReadiness)} readiness`}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map(([title, description, route]) => (
          <button key={route} onClick={() => navigate(route)} className="text-left">
            <Card className="h-full card-hover-magic hover:border-pink-200">
              <h2 className="text-xl font-bold text-slate-950">{title}</h2>
              <p className="mt-3 text-slate-600">{description}</p>
            </Card>
          </button>
        ))}
      </div>
    </Page>
  );
}

function StudyFlashcards({ progressStore }: { progressStore: ReturnType<typeof useProgressStore> }) {
  const [deck, setDeck] = useState<'entities' | 'relationships'>('entities');
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const cards = deck === 'entities' ? entities : relationships;
  const current = cards[index % cards.length];
  const itemId = current.id;
  const isEntityCard = deck === 'entities';

  function changeDeck(nextDeck: 'entities' | 'relationships') {
    setDeck(nextDeck);
    setIndex(0);
    setRevealed(false);
  }

  function next(result?: MasteryResult) {
    if (result) progressStore.recordAttempt(itemId, result, result === 'correct' ? 4 : 2);
    setIndex((value) => (value + 1) % cards.length);
    setRevealed(false);
  }

  function previous() {
    setIndex((value) => (value - 1 + cards.length) % cards.length);
    setRevealed(false);
  }

  function shuffleDeck() {
    setIndex(Math.floor(Math.random() * cards.length));
    setRevealed(false);
  }

  return (
    <Page title="🃏 Flashcards" eyebrow="✨ Study before practice">
      <div className="mb-4 flex flex-wrap gap-2">
        <ToggleButton active={deck === 'entities'} onClick={() => changeDeck('entities')}>🏷️ Entity deck</ToggleButton>
        <ToggleButton active={deck === 'relationships'} onClick={() => changeDeck('relationships')}>🔗 Relationship deck</ToggleButton>
        <SecondaryButton onClick={shuffleDeck}>🔀 Shuffle</SecondaryButton>
      </div>
      <Card className={`min-h-[420px] transition ${revealed ? 'animate-flip-in border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50' : 'animate-rise'}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase text-pink-600">
              🃏 Card {index + 1} of {cards.length}
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">
              {isEntityCard ? (current as Entity).name : relationshipLabel(current as Relationship)}
            </h2>
          </div>
          <ProgressBadge value={getItemProgress(progressStore.progress, itemId).mastery} />
        </div>
        {!revealed ? (
          <div className="mt-8 rounded-xl border-2 border-dashed border-pink-300 bg-white/80 p-6 text-center">
            <div className="mb-3 text-4xl emoji-float">🤔</div>
            <p className="text-lg font-semibold text-slate-950">
              {isEntityCard
                ? `Explain ${(current as Entity).name}: purpose, PK, FKs, attributes, and domain.`
                : `Explain ${relationshipLabel(current as Relationship)}: both rules, cardinality, and FK logic.`}
            </p>
            <p className="mt-3 text-slate-500">🎙️ Say the answer out loud before revealing it!</p>
          </div>
        ) : isEntityCard ? (
          <EntitySummary entity={current as Entity} compact />
        ) : (
          <RelationshipSummary relationship={current as Relationship} compact />
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <SecondaryButton onClick={previous}>⬅️ Previous</SecondaryButton>
          {!revealed ? (
            <PrimaryButton onClick={() => setRevealed(true)}>🔍 Reveal Answer</PrimaryButton>
          ) : (
            <>
              <PrimaryButton onClick={() => next('correct')}>🎉 Remembered!</PrimaryButton>
              <SecondaryButton onClick={() => next('partial')}>🙂 Almost</SecondaryButton>
              <SecondaryButton onClick={() => next('incorrect')}>💪 Missed</SecondaryButton>
            </>
          )}
          <SecondaryButton onClick={() => next()}>Next ➡️</SecondaryButton>
        </div>
      </Card>
    </Page>
  );
}

function VisualErdPractice({ progressStore }: { progressStore: ReturnType<typeof useProgressStore> }) {
  const [mode, setMode] = useState<'entity' | 'relationship'>('entity');
  const [entityTarget, setEntityTarget] = useState(() => pickEntity(progressStore.progress.itemProgress));
  const [relationshipTarget, setRelationshipTarget] = useState(() => pickRelationship(progressStore.progress.itemProgress));
  const [revealed, setRevealed] = useState(false);
  const [weakOnly, setWeakOnly] = useState(false);
  const [zoom, setZoom] = useState(1);
  const weakEntityCount = weakEntities(progressStore.progress).length;
  const weakRelationshipCount = weakRelationships(progressStore.progress).length;
  const currentId = mode === 'entity' ? entityTarget.id : relationshipTarget.id;
  const highlightedIds =
    mode === 'entity'
      ? [entityTarget.id]
      : unique([
          relationshipTarget.entityA,
          relationshipTarget.entityB,
          relationshipTarget.associativeEntityId ?? '',
          relationshipTarget.fkTable ?? '',
        ]).filter(Boolean);
  const prompt =
    mode === 'entity'
      ? `Find ${entityTarget.name} on the actual ERD. Then explain its PK, FKs, and domain.`
      : `Find ${relationshipLabel(relationshipTarget)} on the actual ERD. Then trace the relationship and explain FK logic.`;

  function next(result?: MasteryResult) {
    if (result) progressStore.recordAttempt(currentId, result, result === 'correct' ? 4 : 2);
    if (mode === 'entity') setEntityTarget(pickEntity(progressStore.progress.itemProgress, entityVisualPool(progressStore.progress, weakOnly)));
    else setRelationshipTarget(pickRelationship(progressStore.progress.itemProgress, relationshipVisualPool(progressStore.progress, weakOnly)));
    setRevealed(false);
  }

  function switchMode(nextMode: 'entity' | 'relationship') {
    setMode(nextMode);
    if (nextMode === 'entity') setEntityTarget(pickEntity(progressStore.progress.itemProgress, entityVisualPool(progressStore.progress, weakOnly)));
    else setRelationshipTarget(pickRelationship(progressStore.progress.itemProgress, relationshipVisualPool(progressStore.progress, weakOnly)));
    setRevealed(false);
  }

  function switchWeakOnly(nextWeakOnly: boolean) {
    setWeakOnly(nextWeakOnly);
    if (mode === 'entity') setEntityTarget(pickEntity(progressStore.progress.itemProgress, entityVisualPool(progressStore.progress, nextWeakOnly)));
    else setRelationshipTarget(pickRelationship(progressStore.progress.itemProgress, relationshipVisualPool(progressStore.progress, nextWeakOnly)));
    setRevealed(false);
  }

  return (
    <Page title="Visual ERD Practice" eyebrow="Actual Group 8 ERD">
      <Card className="mb-4 border-blue-200 bg-blue-50">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <div className="flex flex-wrap gap-2">
              <ToggleButton active={mode === 'entity'} onClick={() => switchMode('entity')}>Find entity</ToggleButton>
              <ToggleButton active={mode === 'relationship'} onClick={() => switchMode('relationship')}>Trace relationship</ToggleButton>
              <ToggleButton active={weakOnly} onClick={() => switchWeakOnly(!weakOnly)}>Weak areas only</ToggleButton>
            </div>
            <div className="mt-5">
              <p className="text-sm font-semibold uppercase text-blue-700">Visual prompt</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">{prompt}</h2>
              <p className="mt-3 text-slate-700">
                Use the full-width diagram below. Zoom in, scroll around, point to the table or trace the relationship path, then reveal the highlight.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Weak areas only uses missed or low-mastery items when available. Current weak pools: {weakEntityCount} entities, {weakRelationshipCount} relationships.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            <PrimaryButton onClick={() => setRevealed(true)}>Reveal on ERD</PrimaryButton>
            <SecondaryButton onClick={() => next('correct')}>Found it</SecondaryButton>
            <SecondaryButton onClick={() => next('partial')}>Needed hint</SecondaryButton>
            <SecondaryButton onClick={() => next('incorrect')}>Missed it</SecondaryButton>
          </div>
        </div>
        {revealed && (
          <Card className="mt-5 border-green-300 bg-green-50 animate-correct-pulse">
            <FeedbackBanner result="correct" />
            {mode === 'entity' ? (
              <EntitySummary entity={entityTarget} compact />
            ) : (
              <RelationshipSummary relationship={relationshipTarget} compact />
            )}
          </Card>
        )}
      </Card>

      <Card className="-mx-2 overflow-hidden sm:-mx-4 lg:-mx-6">
        <div className="mb-4 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Actual ERD viewer</h2>
            <p className="text-sm text-slate-500">
              Zoom up to 800%. Use the scrollbars to move around the wide diagram.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            {[0.75, 1, 1.5, 2.5, 4, 6, 8].map((value) => (
              <button
                key={value}
                onClick={() => setZoom(value)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                  zoom === value ? 'border-blue-700 bg-blue-700 text-white' : 'border-line bg-white text-slate-700 hover:border-blue-300'
                }`}
              >
                {Math.round(value * 100)}%
              </button>
            ))}
            <ProgressBadge value={getItemProgress(progressStore.progress, currentId).mastery} />
          </div>
        </div>
        <label className="mb-4 block">
          <span className="text-sm font-semibold text-slate-700">Zoom: {Math.round(zoom * 100)}%</span>
          <input
            className="mt-2 block w-full"
            type="range"
            min="0.5"
            max="8"
            step="0.25"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>
        <div className="h-[78vh] overflow-auto rounded-lg border border-line bg-slate-100">
          <div className="relative" style={{ width: `${zoom * 100}%`, minWidth: '100%' }}>
            <img
              src={erdImageSrc}
              alt="Group 8 Mama's Little Bakery Management System ERD"
              className="block w-full max-w-none select-none"
              draggable={false}
            />
            {revealed &&
              erdHotspots
                .filter((hotspot) => highlightedIds.includes(hotspot.entityId))
                .map((hotspot) => <ErdHotspotBox key={hotspot.entityId} hotspot={hotspot} />)}
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          <a className="font-semibold text-blue-700 underline" href={erdPdfSrc} target="_blank" rel="noreferrer">
            Open source PDF
          </a>
        </p>
      </Card>
    </Page>
  );
}

function DomainIndex({
  navigate,
  progressStore,
}: {
  navigate: Navigate;
  progressStore: ReturnType<typeof useProgressStore>;
}) {
  return (
    <Page title="Study by Domain" eyebrow="Six project domains">
      <div className="grid gap-4 md:grid-cols-2">
        {progressStore.analytics.domainProgress.map(({ domain, mastery }) => (
          <button key={domain.id} onClick={() => navigate(`/study/domains/${domain.id}`)} className="text-left">
            <Card className="h-full hover:border-blue-300">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">{domain.name}</h2>
                  <p className="mt-2 text-slate-600">{domain.description}</p>
                </div>
                <ProgressBadge value={mastery} />
              </div>
              <ProgressBar value={mastery} className="mt-5" />
              <p className="mt-4 text-sm text-slate-500">
                {domain.entityIds.length} entities, {domain.relationshipIds.length} relationship rules
              </p>
            </Card>
          </button>
        ))}
      </div>
    </Page>
  );
}

function DomainDetail({
  domainId,
  navigate,
  progressStore,
}: {
  domainId: string;
  navigate: Navigate;
  progressStore: ReturnType<typeof useProgressStore>;
}) {
  const domain = domainById[domainId];
  if (!domain) return <NotFound navigate={navigate} />;
  const domainEntities = entitiesForDomain(domainId);
  const domainRelationships = relationshipsForDomain(domainId);

  return (
    <Page title={domain.name} eyebrow="Domain detail" action={<SecondaryButton onClick={() => navigate('/study/domains')}>All Domains</SecondaryButton>}>
      <Card>
        <p className="text-slate-600">{domain.description}</p>
        <ProgressBar
          value={progressStore.analytics.domainProgress.find((item) => item.domain.id === domainId)?.mastery ?? 0}
          className="mt-5"
        />
      </Card>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold text-slate-950">Entities</h2>
          <div className="mt-4 grid gap-2">
            {domainEntities.map((entity) => (
              <button
                key={entity.id}
                onClick={() => navigate(`/study/entities/${entity.id}`)}
                className="rounded-lg border border-line px-3 py-2 text-left hover:border-blue-300"
              >
                <span className="font-semibold">{entity.name}</span>
                <span className="ml-2 text-sm text-slate-500">
                  {masteryLabel(getItemProgress(progressStore.progress, entity.id).mastery)}
                </span>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-bold text-slate-950">Relationships</h2>
          <div className="mt-4 grid gap-2">
            {domainRelationships.map((relationship) => (
              <button
                key={relationship.id}
                onClick={() => navigate(`/study/relationships/${relationship.id}`)}
                className="rounded-lg border border-line px-3 py-2 text-left hover:border-blue-300"
              >
                <span className="font-semibold">{relationshipLabel(relationship)}</span>
                <span className="ml-2 text-sm text-slate-500">{relationship.cardinality}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </Page>
  );
}

function EntityMastery({ progressStore }: { progressStore: ReturnType<typeof useProgressStore> }) {
  const [entity, setEntity] = useState(() => pickEntity(progressStore.progress.itemProgress));
  const [mode, setMode] = useState<DrillMode>(() => randomFrom(entityModes));
  const [revealed, setRevealed] = useState(false);
  const [confidence, setConfidence] = useState(3);
  const isAutoChecked = mode !== 'purpose';

  function next() {
    setEntity(pickEntity(progressStore.progress.itemProgress));
    setMode(randomFrom(entityModes));
    setRevealed(false);
    setConfidence(3);
  }

  return (
    <Page title="Entity Mastery" eyebrow="41 entities">
      <DrillCard
        label={`${getDomainName(entity.domainId)} - ${masteryLabel(getItemProgress(progressStore.progress, entity.id).mastery)}`}
        title={entityQuestion(entity, mode)}
        prompt={
          isAutoChecked
            ? 'Select the answer, rate confidence, and submit for immediate scoring.'
            : 'Answer out loud first. Then reveal the expected points and score your recall.'
        }
      >
        {isAutoChecked ? (
          <AutoEntityDrill
            key={`${entity.id}-${mode}`}
            entity={entity}
            mode={mode}
            confidence={confidence}
            setConfidence={setConfidence}
            onAnswered={(result) => progressStore.recordAttempt(entity.id, result, confidence)}
            onNext={next}
          />
        ) : (
          <>
            <StudyInput placeholder="Optional notes: purpose, PK, FKs, attributes, domain..." />
            {revealed && <EntityAnswer entity={entity} mode={mode} />}
            <DrillFooter
              revealed={revealed}
              confidence={confidence}
              setConfidence={setConfidence}
              onReveal={() => setRevealed(true)}
              onScore={(result) => {
                progressStore.recordAttempt(entity.id, result, confidence);
                next();
              }}
              onSkip={next}
            />
          </>
        )}
      </DrillCard>
    </Page>
  );
}

function AutoEntityDrill({
  entity,
  mode,
  confidence,
  setConfidence,
  onAnswered,
  onNext,
}: {
  entity: Entity;
  mode: Exclude<DrillMode, 'purpose'>;
  confidence: number;
  setConfidence: (value: number) => void;
  onAnswered: (result: MasteryResult) => void;
  onNext: () => void;
}) {
  const options = getEntityOptions(entity, mode);
  const correct = getEntityCorrectAnswers(entity, mode);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<MasteryResult | null>(null);

  function toggle(value: string) {
    if (result) return;
    if (mode === 'domain') {
      setSelected([value]);
      return;
    }
    setSelected((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  function submit() {
    const evaluated = evaluateSelection(selected, correct);
    setResult(evaluated);
    onAnswered(evaluated);
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => toggle(option)}
            className={`rounded-lg border px-4 py-3 text-left font-semibold ${
              selected.includes(option) ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-line bg-white hover:border-blue-300'
            }`}
          >
            {mode === 'domain' ? getDomainName(option) : option}
          </button>
        ))}
      </div>
      <ConfidenceSelector value={confidence} onChange={setConfidence} />
      {result && (
        <Card className={`mt-5 ${resultFeedbackClass(result)}`}>
          <FeedbackBanner result={result} />
          <p className="font-semibold">{result === 'correct' ? 'Correct' : result === 'partial' ? 'Partially correct' : 'Incorrect'}</p>
          <p className="mt-2 text-slate-700">
            Expected: {correct.map((value) => (mode === 'domain' ? getDomainName(value) : value)).join(', ')}
          </p>
          <EntityAnswer entity={entity} mode={mode} />
        </Card>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        {!result ? (
          <PrimaryButton onClick={submit}>Check Answer</PrimaryButton>
        ) : (
          <PrimaryButton onClick={onNext}>Next Entity</PrimaryButton>
        )}
        <SecondaryButton onClick={onNext}>Skip</SecondaryButton>
      </div>
    </div>
  );
}

function EntityDetail({
  entityId,
  navigate,
  progressStore,
}: {
  entityId: string;
  navigate: Navigate;
  progressStore: ReturnType<typeof useProgressStore>;
}) {
  const entity = entityById[entityId];
  if (!entity) return <NotFound navigate={navigate} />;

  return (
    <Page title={entity.name} eyebrow={getDomainName(entity.domainId)} action={<SecondaryButton onClick={() => navigate('/study/entities')}>Practice Entities</SecondaryButton>}>
      <EntitySummary entity={entity} progress={getItemProgress(progressStore.progress, entity.id).mastery} />
    </Page>
  );
}

function RelationshipBuilder({ progressStore }: { progressStore: ReturnType<typeof useProgressStore> }) {
  const [relationship, setRelationship] = useState(() => pickRelationship(progressStore.progress.itemProgress));
  const [revealed, setRevealed] = useState(false);
  const [confidence, setConfidence] = useState(3);

  function next() {
    setRelationship(pickRelationship(progressStore.progress.itemProgress));
    setRevealed(false);
    setConfidence(3);
  }

  return (
    <Page title="Business Rule Builder" eyebrow="46 bi-directional rules">
      <RelationshipQuestionCard
        relationship={relationship}
        revealed={revealed}
        confidence={confidence}
        setConfidence={setConfidence}
        onReveal={() => setRevealed(true)}
        onScore={(result) => {
          progressStore.recordAttempt(relationship.id, result, confidence);
          next();
        }}
        onSkip={next}
      />
    </Page>
  );
}

function RelationshipDetail({
  relationshipId,
  navigate,
  progressStore,
}: {
  relationshipId: string;
  navigate: Navigate;
  progressStore: ReturnType<typeof useProgressStore>;
}) {
  const relationship = relationshipById[relationshipId];
  if (!relationship) return <NotFound navigate={navigate} />;
  return (
    <Page title={relationshipLabel(relationship)} eyebrow={getDomainName(relationship.domainId)} action={<SecondaryButton onClick={() => navigate('/study/relationships')}>Practice Rules</SecondaryButton>}>
      <RelationshipSummary relationship={relationship} mastery={getItemProgress(progressStore.progress, relationship.id).mastery} />
    </Page>
  );
}

function RelationshipQuestionCard({
  relationship,
  revealed,
  confidence,
  setConfidence,
  onReveal,
  onScore,
  onSkip,
}: {
  relationship: Relationship;
  revealed: boolean;
  confidence: number;
  setConfidence: (value: number) => void;
  onReveal: () => void;
  onScore: (result: MasteryResult) => void;
  onSkip: () => void;
}) {
  return (
    <DrillCard
      label={`${getDomainName(relationship.domainId)} - ${relationship.cardinality}`}
      title={`Explain ${relationshipLabel(relationship)}.`}
      prompt="State both sides, identify the relationship type, then justify FK placement."
    >
      <div className="grid gap-3 md:grid-cols-3">
        <SelectBox label="Cardinality">
          <option>Choose</option>
          <option>1:1</option>
          <option>1:M</option>
          <option>M:N</option>
        </SelectBox>
        <SelectBox label="FK / bridge table">
          <option>Choose</option>
          {[relationship.entityA, relationship.entityB, relationship.fkTable, relationship.associativeEntityId]
            .filter(Boolean)
            .map((id) => (
              <option key={id ?? ''}>{getEntityName(id)}</option>
            ))}
        </SelectBox>
        <SelectBox label="Rule direction">
          <option>Forward and reverse</option>
          <option>Forward only</option>
          <option>Reverse only</option>
        </SelectBox>
      </div>
      <StudyInput placeholder="Type the two business-rule sentences and FK reasoning..." />
      {revealed && <RelationshipAnswer relationship={relationship} />}
      <DrillFooter
        revealed={revealed}
        confidence={confidence}
        setConfidence={setConfidence}
        onReveal={onReveal}
        onScore={onScore}
        onSkip={onSkip}
      />
    </DrillCard>
  );
}

function FkLogicTrainer({ progressStore }: { progressStore: ReturnType<typeof useProgressStore> }) {
  const directPool = relationships.filter((relationship) => relationship.fkTable || relationship.associativeEntityId);
  const [relationship, setRelationship] = useState(() => pickRelationship(progressStore.progress.itemProgress, directPool));
  const [selected, setSelected] = useState('');
  const [confidence, setConfidence] = useState(3);
  const expected = relationship.requiresAssociativeEntity
    ? relationship.associativeEntityId ?? relationship.fkTable ?? ''
    : relationship.fkTable ?? '';
  const choices = unique([relationship.entityA, relationship.entityB, relationship.fkTable ?? '', relationship.associativeEntityId ?? '']).filter(Boolean);

  function next(result?: MasteryResult) {
    if (result) progressStore.recordAttempt(relationship.id, result, confidence);
    setRelationship(pickRelationship(progressStore.progress.itemProgress, directPool));
    setSelected('');
    setConfidence(3);
  }

  return (
    <Page title="FK Logic Trainer" eyebrow="Placement and justification">
      <DrillCard
        label={relationship.cardinality}
        title={`Where does the FK or bridge belong for ${relationshipLabel(relationship)}?`}
        prompt="Use the rule: 1:M puts the FK on the many side; M:N uses an associative entity."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {choices.map((choice) => (
            <button
              key={choice}
              onClick={() => setSelected(choice)}
              className={`rounded-lg border px-4 py-3 text-left font-semibold ${
                selected === choice ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-line bg-white hover:border-blue-300'
              }`}
            >
              {getEntityName(choice)}
            </button>
          ))}
        </div>
        {selected && (
          <Card className={`mt-5 ${resultFeedbackClass(selected === expected ? 'correct' : 'incorrect')}`}>
            <FeedbackBanner result={selected === expected ? 'correct' : 'incorrect'} />
            <p className="font-semibold">{selected === expected ? 'Correct placement' : 'Check the placement'}</p>
            <p className="mt-2 text-slate-700">
              Expected: <Code>{getEntityName(expected)}</Code>. {relationship.oralCue}
            </p>
            <ConfidenceSelector value={confidence} onChange={setConfidence} />
            <div className="mt-4 flex gap-2">
              <PrimaryButton onClick={() => next(selected === expected ? 'correct' : 'incorrect')}>Save and Next</PrimaryButton>
              {selected !== expected && <SecondaryButton onClick={() => next('partial')}>Mark Partial</SecondaryButton>}
            </div>
          </Card>
        )}
      </DrillCard>
    </Page>
  );
}

function AssociativeEntityDrill({ progressStore }: { progressStore: ReturnType<typeof useProgressStore> }) {
  const [bridge, setBridge] = useState(() => pickAssociativeEntity(progressStore.progress.itemProgress));
  const [selected, setSelected] = useState('');
  const [confidence, setConfidence] = useState(3);
  const sourceNames = bridge.resolves.map(getEntityName).join(' and ');

  function next(result?: MasteryResult) {
    if (result) progressStore.recordAttempt(bridge.id, result, confidence);
    setBridge(pickAssociativeEntity(progressStore.progress.itemProgress));
    setSelected('');
    setConfidence(3);
  }

  return (
    <Page title="Associative Entity Drill" eyebrow="Six bridge tables">
      <DrillCard
        label="M:N resolution"
        title={`Which bridge resolves ${sourceNames}?`}
        prompt="Name the associative entity, composite key fields, and any extra bridge attributes."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {associativeEntities.map((candidate) => (
            <button
              key={candidate.id}
              onClick={() => setSelected(candidate.id)}
              className={`rounded-lg border px-4 py-3 text-left font-semibold ${
                selected === candidate.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-line bg-white hover:border-blue-300'
              }`}
            >
              {candidate.name}
            </button>
          ))}
        </div>
        {selected && (
          <Card className={`mt-5 ${resultFeedbackClass(selected === bridge.id ? 'correct' : 'incorrect')}`}>
            <FeedbackBanner result={selected === bridge.id ? 'correct' : 'incorrect'} />
            <p className="font-semibold">{selected === bridge.id ? 'Correct bridge' : `Expected ${bridge.name}`}</p>
            <BridgeSummary bridge={bridge} />
            <ConfidenceSelector value={confidence} onChange={setConfidence} />
            <div className="mt-4 flex gap-2">
              <PrimaryButton onClick={() => next(selected === bridge.id ? 'correct' : 'incorrect')}>Save and Next</PrimaryButton>
              {selected !== bridge.id && <SecondaryButton onClick={() => next('partial')}>Mark Partial</SecondaryButton>}
            </div>
          </Card>
        )}
      </DrillCard>
    </Page>
  );
}

function AssociativeDetail({
  entityId,
  navigate,
  progressStore,
}: {
  entityId: string;
  navigate: Navigate;
  progressStore: ReturnType<typeof useProgressStore>;
}) {
  const bridge = associativeById[entityId];
  if (!bridge) return <NotFound navigate={navigate} />;
  return (
    <Page title={bridge.name} eyebrow="Associative entity" action={<SecondaryButton onClick={() => navigate('/study/associative-entities')}>Practice Bridges</SecondaryButton>}>
      <Card>
        <ProgressBar value={getItemProgress(progressStore.progress, bridge.id).mastery} />
        <BridgeSummary bridge={bridge} />
      </Card>
    </Page>
  );
}

function SubtypeDrill({ progressStore }: { progressStore: ReturnType<typeof useProgressStore> }) {
  const [subtype, setSubtype] = useState(() => randomFrom(subtypes));
  const [revealed, setRevealed] = useState(false);
  const [confidence, setConfidence] = useState(3);

  function next(result?: MasteryResult) {
    if (result) progressStore.recordAttempt(subtype.subtypeId, result, confidence);
    setSubtype(randomFrom(subtypes));
    setRevealed(false);
    setConfidence(3);
  }

  return (
    <Page title="Subtype Drill" eyebrow="Two subtype relationships">
      <DrillCard
        label="Subtype relationship"
        title={`Explain ${getEntityName(subtype.subtypeId)} as a subtype of ${getEntityName(subtype.supertypeId)}.`}
        prompt="Mention the supertype, subtype, shared key, and why not every supertype row must have a subtype row."
      >
        <StudyInput placeholder="Answer out loud, then capture the key points here..." />
        {revealed && <SubtypeSummary subtype={subtype} />}
        <DrillFooter
          revealed={revealed}
          confidence={confidence}
          setConfidence={setConfidence}
          onReveal={() => setRevealed(true)}
          onScore={(result) => next(result)}
          onSkip={() => next()}
        />
      </DrillCard>
    </Page>
  );
}

function MockOralSetup({
  navigate,
  progressStore,
}: {
  navigate: Navigate;
  progressStore: ReturnType<typeof useProgressStore>;
}) {
  return (
    <Page
      title="Mock Oral"
      eyebrow="Five-minute simulation"
      action={
        <div className="flex flex-wrap gap-2">
          <SecondaryButton onClick={() => navigate('/mock-oral/exam')}>Start Exam Mode</SecondaryButton>
          <PrimaryButton onClick={() => navigate('/mock-oral/session')}>Start Practice Session</PrimaryButton>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <h2 className="text-xl font-bold text-slate-950">Format</h2>
          <ul className="mt-4 space-y-3 text-slate-700">
            <li>One random entity explanation question.</li>
            <li>One random relationship and business-rule question.</li>
            <li>Five-minute timer with a self-grading rubric.</li>
            <li>Progress saved locally on this device.</li>
          </ul>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <button onClick={() => navigate('/mock-oral/session')} className="rounded-lg border border-line p-3 text-left hover:border-blue-300">
              <strong className="text-slate-950">Practice session</strong>
              <p className="mt-1 text-sm text-slate-600">Allows expected-answer reveal while you self-grade.</p>
            </button>
            <button onClick={() => navigate('/mock-oral/exam')} className="rounded-lg border border-red-200 bg-red-50 p-3 text-left hover:border-red-400">
              <strong className="text-red-900">Strict exam mode</strong>
              <p className="mt-1 text-sm text-red-800">No hints, no reveal button, timed answering first, forced self-score at the end.</p>
            </button>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-bold text-slate-950">Recent scores</h2>
          {progressStore.progress.mockOrals.length === 0 ? (
            <p className="mt-3 text-slate-600">No saved sessions yet.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {progressStore.progress.mockOrals.slice(0, 5).map((session) => (
                <div key={session.id} className="flex justify-between rounded-lg border border-line px-3 py-2">
                  <span>{formatDate(session.startedAt)}</span>
                  <strong>
                    {session.score}/{session.maxScore}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}

function MockOralSession({
  navigate,
  progressStore,
  strict = false,
}: {
  navigate: Navigate;
  progressStore: ReturnType<typeof useProgressStore>;
  strict?: boolean;
}) {
  const entityQuestions = oralQuestions.filter((question) => question.type === 'entity' && question.id.startsWith('q-entity-'));
  const relationshipQuestions = oralQuestions.filter((question) => question.type === 'relationship');
  const [entityQuestion] = useState(() => randomFrom(entityQuestions));
  const [relationshipQuestion] = useState(() => randomFrom(relationshipQuestions));
  const [seconds, setSeconds] = useState(300);
  const [sessionRef] = useState(() => progressStore.startStudySession());
  const [entityChecks, setEntityChecks] = useState<boolean[]>([false, false, false, false, false]);
  const [relationshipChecks, setRelationshipChecks] = useState<boolean[]>([false, false, false, false, false]);
  const [scoring, setScoring] = useState(false);
  const [finished, setFinished] = useState(false);
  const entity = entityQuestion.entityId ? entityById[entityQuestion.entityId] : undefined;
  const relationship = relationshipQuestion.relationshipId ? relationshipById[relationshipQuestion.relationshipId] : undefined;
  const startedAtRef = useState(() => Date.now())[0];

  useEffect(() => {
    if (finished || (strict && scoring)) return undefined;
    const id = window.setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [finished, scoring, strict]);

  useEffect(() => {
    if (strict && seconds === 0 && !finished) setScoring(true);
  }, [finished, seconds, strict]);

  function finishSession() {
    if (finished) return;
    const entityScore = entityChecks.filter(Boolean).length;
    const relationshipScore = relationshipChecks.filter(Boolean).length;
    const score = entityScore + relationshipScore;
    const startedAt = new Date().toISOString();
    const durationSeconds = Math.floor((Date.now() - startedAtRef) / 1000);
    const entityResult = scoreResult(entityScore);
    const relationshipResult = scoreResult(relationshipScore);
    progressStore.saveMockOral({
      id: `session-${Date.now()}`,
      startedAt,
      entityQuestionId: entityQuestion.id,
      relationshipQuestionId: relationshipQuestion.id,
      score,
      maxScore: 10,
      durationSeconds,
    });
    sessionRef.endSession(2, (entityResult === 'correct' ? 1 : 0) + (relationshipResult === 'correct' ? 1 : 0));
    if (entity) {
      progressStore.recordAttempt(entity.id, entityResult, 4);
      progressStore.recordWeakSpot(entity.id, entity.name, 'entity', entityResult);
    }
    if (relationship) {
      progressStore.recordAttempt(relationship.id, relationshipResult, 4);
      progressStore.recordWeakSpot(relationship.id, `${getEntityName(relationship.entityA)} → ${getEntityName(relationship.entityB)}`, 'relationship', relationshipResult);
    }
    setFinished(true);
  }

  function primaryAction() {
    if (strict && !scoring) {
      setScoring(true);
      return;
    }
    finishSession();
  }

  return (
    <Page title={strict ? '🔒 Exam Mode' : '🎤 Active Mock Oral'} eyebrow={strict ? '⚠️ Strict timed oral exam' : '1️⃣ entity + 1️⃣ relationship'}>
      <div className="sticky top-0 z-10 mb-4 rounded-xl border border-pink-100 bg-white/95 p-4 shadow-md" style={{backdropFilter:'blur(8px)'}}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-pink-500">⏱️ Time remaining</p>
            <p className={`text-4xl font-bold ${seconds <= 60 ? 'text-red-600 animate-heartbeat' : 'text-slate-950'}`}>{formatTimer(seconds)} {seconds <= 60 ? '🔥' : '⏳'}</p>
            {strict && (
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                {scoring
                  ? 'Answering is closed. Self-score both questions now, then save the exam score.'
                  : 'Strict mode hides hints and answer reveals until you finish answering or the timer reaches zero.'}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <SecondaryButton onClick={() => navigate('/mock-oral')}>Exit</SecondaryButton>
            {!finished && (
              <PrimaryButton onClick={primaryAction}>
                {strict ? (scoring ? 'Save Exam Score' : 'I Answered - Self-Score') : 'Finish and Score'}
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>

      {finished ? (
        <Card>
          <h2 className="text-2xl font-bold text-slate-950">
            Score {entityChecks.filter(Boolean).length + relationshipChecks.filter(Boolean).length}/10
          </h2>
          <p className="mt-3 text-slate-600">Session saved to local mock oral history.</p>
          <div className="mt-5 flex gap-2">
            <PrimaryButton onClick={() => navigate(strict ? '/mock-oral/exam' : '/mock-oral/session')}>Start Another</PrimaryButton>
            <SecondaryButton onClick={() => navigate('/review/mock-replays')}>View Replays</SecondaryButton>
            <SecondaryButton onClick={() => navigate('/review')}>Review Weak Areas</SecondaryButton>
          </div>
        </Card>
      ) : strict && !scoring ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <ExamQuestionPanel title="Phase 1: Easy entity question" question={entityQuestion} />
          <ExamQuestionPanel title="Phase 2: Hard relationship question" question={relationshipQuestion} />
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <MockQuestionPanel
            title={strict ? 'Self-score: Easy entity question' : 'Phase 1: Easy entity question'}
            question={entityQuestion}
            answer={entity ? <EntitySummary entity={entity} compact /> : null}
            followUp={entity ? entityFollowUp(entity) : undefined}
            checks={entityChecks}
            setChecks={setEntityChecks}
          />
          <MockQuestionPanel
            title={strict ? 'Self-score: Hard relationship question' : 'Phase 2: Hard relationship question'}
            question={relationshipQuestion}
            answer={relationship ? <RelationshipSummary relationship={relationship} compact /> : null}
            followUp={relationship ? relationshipFollowUp(relationship) : undefined}
            checks={relationshipChecks}
            setChecks={setRelationshipChecks}
          />
        </div>
      )}
    </Page>
  );
}

function ReviewMistakes({
  navigate,
  progressStore,
}: {
  navigate: Navigate;
  progressStore: ReturnType<typeof useProgressStore>;
}) {
  const weakItems = progressStore.analytics.weakItems;
  const weakAnalytics = buildWeakSpotAnalytics(progressStore.progress.weakSpots);
  const topWeakSpots = weakAnalytics.spots.slice(0, 5);

  return (
    <Page title="Review Mistakes" eyebrow="Targeted weak-area queue" action={<SecondaryButton onClick={() => navigate('/study')}>Study Hub</SecondaryButton>}>
      <div className="mb-4 flex gap-2">
        <SecondaryButton onClick={() => navigate('/review/weak-spots')}>Error Breakdown</SecondaryButton>
        <SecondaryButton onClick={() => navigate('/review/mock-replays')}>Mock Replays</SecondaryButton>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold text-slate-950">Missed or low-mastery items</h2>
          <ItemList items={weakItems} empty="No mistakes have been saved yet. Complete a drill or mock oral first." navigate={navigate} />
        </Card>
        <Card>
          <h2 className="text-xl font-bold text-slate-950">Error patterns</h2>
          {topWeakSpots.length === 0 ? (
            <p className="mt-3 text-slate-600">No error patterns recorded yet. Complete some drills first.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {topWeakSpots.map((spot) => (
                <div key={spot.id} className="flex items-center justify-between rounded-lg border border-line p-2">
                  <div>
                    <p className="font-semibold text-slate-950">{spot.itemName}</p>
                    <p className="text-xs text-slate-500 capitalize">{spot.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded bg-red-100 px-2 py-0.5 text-sm font-bold text-red-700">{spot.errorCount} errors</span>
                  </div>
                </div>
              ))}
              <button onClick={() => navigate('/review/weak-spots')} className="mt-2 text-sm font-semibold text-blue-600 hover:underline">
                View all error patterns →
              </button>
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}

function ProgressAnalytics({
  navigate,
  progressStore,
}: {
  navigate: Navigate;
  progressStore: ReturnType<typeof useProgressStore>;
}) {
  const averageMock =
    progressStore.progress.mockOrals.length === 0
      ? 0
      : progressStore.progress.mockOrals.reduce((sum, session) => sum + session.score / session.maxScore, 0) /
        progressStore.progress.mockOrals.length;

  const todayMs = calculateTodayStudyTime(progressStore.progress.studySessions);
  const totalMs = progressStore.progress.totalStudyTimeMs;
  const sessions = progressStore.progress.studySessions;

  return (
    <Page title="Progress" eyebrow="Local mastery analytics" action={<SecondaryButton onClick={() => navigate('/settings')}>Data Controls</SecondaryButton>}>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Readiness" value={percent(progressStore.progress.overallReadiness)} />
        <MetricCard label="Average mock score" value={percent(averageMock)} />
        <MetricCard label="Mastered" value={String(progressStore.analytics.masteredCount)} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <MetricCard label="Today's study" value={todayMs > 0 ? formatStudyTime(todayMs) : '—'} />
        <MetricCard label="Total study time" value={totalMs > 0 ? formatStudyTime(totalMs) : '—'} />
        <MetricCard label="Sessions" value={String(sessions.length)} />
      </div>
      <SectionHeader title="Domains" />
      <div className="grid gap-3">
        {progressStore.analytics.domainProgress.map(({ domain, mastery }) => (
          <Card key={domain.id}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-950">{domain.name}</h2>
                <p className="text-sm text-slate-500">{masteryLabel(mastery)}</p>
              </div>
              <ProgressBadge value={mastery} />
            </div>
            <ProgressBar value={mastery} className="mt-4" />
          </Card>
        ))}
      </div>
    </Page>
  );
}

function SettingsScreen({ progressStore }: { progressStore: ReturnType<typeof useProgressStore> }) {
  const [importError, setImportError] = useState('');

  function exportProgress() {
    const blob = new Blob([JSON.stringify(progressStore.progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'bakery-erd-oral-progress.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Page title="Settings" eyebrow="Local data controls">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold text-slate-950">Preferences</h2>
          <div className="mt-4 space-y-4">
            <label className="flex items-center justify-between gap-3 rounded-lg border border-line p-3">
              <span>Timer warnings</span>
              <input
                type="checkbox"
                checked={progressStore.progress.settings.timerWarningsEnabled}
                onChange={(event) => progressStore.updateSettings({ timerWarningsEnabled: event.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-lg border border-line p-3">
              <span>Reduced motion</span>
              <input
                type="checkbox"
                checked={progressStore.progress.settings.reducedMotion}
                onChange={(event) => progressStore.updateSettings({ reducedMotion: event.target.checked })}
              />
            </label>
            <label className="block rounded-lg border border-line p-3">
              <span className="font-semibold">Font size</span>
              <select
                className="mt-2 w-full rounded-lg border border-line px-3 py-2"
                value={progressStore.progress.settings.fontScale}
                onChange={(event) => progressStore.updateSettings({ fontScale: event.target.value as 'sm' | 'md' | 'lg' })}
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </label>
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-bold text-slate-950">Progress data</h2>
          <p className="mt-2 text-slate-600">Progress is stored in localStorage on this browser.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <PrimaryButton onClick={exportProgress}>Export JSON</PrimaryButton>
            <label className="inline-flex cursor-pointer rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300">
              Import JSON
              <input
                className="sr-only"
                type="file"
                accept="application/json"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    progressStore.importProgress(JSON.parse(await file.text()) as ProgressState);
                    setImportError('');
                  } catch {
                    setImportError('Could not import that JSON file.');
                  }
                }}
              />
            </label>
            <SecondaryButton
              onClick={() => {
                if (window.confirm('Reset all local progress?')) progressStore.resetAll();
              }}
            >
              Reset Progress
            </SecondaryButton>
          </div>
          {importError && <p className="mt-3 text-sm font-semibold text-red-700">{importError}</p>}
        </Card>
      </div>
    </Page>
  );
}

function ExamQuestionPanel({ title, question }: { title: string; question: OralQuestion }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <p className="text-sm font-semibold uppercase text-red-700">{title}</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-950">{question.prompt}</h2>
      <p className="mt-4 text-slate-700">
        Speak the answer out loud. Do not reveal answers or use hints in this phase. Use the box only for short notes if it helps you self-score later.
      </p>
      <textarea className="mt-5 min-h-52 w-full rounded-lg border border-red-200 bg-white p-3" placeholder="Strict exam notes..." />
    </Card>
  );
}

function MockQuestionPanel({
  title,
  question,
  answer,
  followUp,
  checks,
  setChecks,
}: {
  title: string;
  question: OralQuestion;
  answer: React.ReactNode;
  followUp?: string;
  checks: boolean[];
  setChecks: (checks: boolean[]) => void;
}) {
  const labels =
    question.type === 'entity'
      ? ['Meaning clear', 'PK correct', 'FKs correct', 'Two attributes', 'Domain correct']
      : ['Both sides stated', 'Type correct', 'FK placement', 'FK justification', 'Bridge mentioned if needed'];
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <Card>
      <p className="text-sm font-semibold uppercase text-slate-500">{title}</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-950">{question.prompt}</h2>
      {followUp && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm font-semibold uppercase text-blue-700">Professor follow-up</p>
          <p className="mt-1 text-slate-800">{followUp}</p>
        </div>
      )}
      <textarea className="mt-5 min-h-36 w-full rounded-lg border border-line p-3" placeholder="Optional speaking notes..." />
      <div className="mt-4 grid gap-2">
        {labels.map((label, index) => (
          <label key={label} className="flex items-center gap-3 rounded-lg border border-line p-3">
            <input
              type="checkbox"
              checked={checks[index]}
              onChange={(event) => {
                const next = [...checks];
                next[index] = event.target.checked;
                setChecks(next);
              }}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <div className="mt-4">
        <SecondaryButton onClick={() => setShowAnswer((value) => !value)}>
          {showAnswer ? 'Hide Expected Answer' : 'Show Expected Answer'}
        </SecondaryButton>
      </div>
      {showAnswer && <div className="mt-4">{answer}</div>}
    </Card>
  );
}

function EntityAnswer({ entity, mode }: { entity: Entity; mode: DrillMode }) {
  return (
    <Card className="mt-5 border-blue-200 bg-blue-50">
      <h3 className="text-lg font-bold text-slate-950">Expected answer</h3>
      {mode === 'purpose' && <p className="mt-2 text-slate-700">{entity.description}</p>}
      {mode === 'pk' && <KeyValue label="Primary key" values={entity.primaryKey} />}
      {mode === 'fk' && <KeyValue label="Foreign keys" values={entity.foreignKeys.length ? entity.foreignKeys : ['none']} />}
      {mode === 'attributes' && <KeyValue label="Attributes" values={entity.attributes} />}
      {mode === 'domain' && <KeyValue label="Domain" values={[getDomainName(entity.domainId)]} />}
      <EntitySummary entity={entity} compact />
    </Card>
  );
}

function RelationshipAnswer({ relationship }: { relationship: Relationship }) {
  return (
    <Card className="mt-5 border-blue-200 bg-blue-50">
      <h3 className="text-lg font-bold text-slate-950">Expected answer</h3>
      <RelationshipSummary relationship={relationship} compact />
    </Card>
  );
}

function EntitySummary({ entity, progress, compact = false }: { entity: Entity; progress?: number; compact?: boolean }) {
  return (
    <Card className={compact ? 'mt-4 bg-white/70' : ''}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{entity.name}</h2>
          <p className="mt-2 text-slate-600">{entity.description}</p>
        </div>
        {progress !== undefined && <ProgressBadge value={progress} />}
      </div>
      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
        <p className="text-sm font-semibold uppercase text-blue-700">Model oral answer</p>
        <p className="mt-1 text-slate-800">{modelEntityAnswer(entity)}</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <InfoBlock label="Primary key" values={entity.primaryKey} />
        <InfoBlock label="Foreign keys" values={entity.foreignKeys.length ? entity.foreignKeys : ['none']} />
        <InfoBlock label="Attributes" values={entity.attributes} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Tag>{getDomainName(entity.domainId)}</Tag>
        {entity.isAssociative && <Tag>Associative entity</Tag>}
        {entity.subtypeOf && <Tag>Subtype of {getEntityName(entity.subtypeOf)}</Tag>}
      </div>
    </Card>
  );
}

function RelationshipSummary({
  relationship,
  mastery,
  compact = false,
}: {
  relationship: Relationship;
  mastery?: number;
  compact?: boolean;
}) {
  return (
    <Card className={compact ? 'mt-4 bg-white/70' : ''}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{relationshipLabel(relationship)}</h2>
          <p className="mt-2 text-slate-600">{relationship.oralCue}</p>
        </div>
        {mastery !== undefined && <ProgressBadge value={mastery} />}
      </div>
      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
        <p className="text-sm font-semibold uppercase text-blue-700">Model oral answer</p>
        <p className="mt-1 text-slate-800">{modelRelationshipAnswer(relationship)}</p>
      </div>
      <div className="mt-4 grid gap-3">
        <p>
          <strong>Forward:</strong> {relationship.ruleForward}
        </p>
        <p>
          <strong>Reverse:</strong> {relationship.ruleReverse}
        </p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <InfoBlock label="Cardinality" values={[relationship.cardinality]} />
        <InfoBlock label="FK table" values={[relationship.fkTable ? getEntityName(relationship.fkTable) : 'none']} />
        <InfoBlock label="FK field" values={[relationship.fkField ?? 'none']} />
      </div>
      {relationship.requiresAssociativeEntity && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <strong>Bridge:</strong> {getEntityName(relationship.associativeEntityId)}
        </div>
      )}
    </Card>
  );
}

function BridgeSummary({ bridge }: { bridge: AssociativeEntity }) {
  return (
    <div className="mt-4 grid gap-3">
      <p className="text-slate-700">{bridge.description}</p>
      <InfoBlock label="Resolves" values={bridge.resolves.map(getEntityName)} />
      <InfoBlock label="Composite PK" values={bridge.compositePrimaryKey} />
      <InfoBlock label="Extra attributes" values={bridge.attributes} />
    </div>
  );
}

function SubtypeSummary({ subtype }: { subtype: SubtypeRelationship }) {
  return (
    <Card className="mt-5 border-blue-200 bg-blue-50">
      <h3 className="text-lg font-bold text-slate-950">Expected answer</h3>
      <p className="mt-2 text-slate-700">{subtype.description}</p>
      <InfoBlock label="Shared key" values={subtype.primaryKey} />
    </Card>
  );
}

function ErdHotspotBox({ hotspot }: { hotspot: ErdHotspot }) {
  const entity = entityById[hotspot.entityId];
  return (
    <div
      className="absolute rounded-lg border-4 border-green-500 bg-green-400/20 shadow-[0_0_0_9999px_rgba(15,23,42,0.08)] animate-correct-pulse"
      style={{
        left: `${hotspot.x}%`,
        top: `${hotspot.y}%`,
        width: `${hotspot.width}%`,
        height: `${hotspot.height}%`,
      }}
      aria-label={`Highlighted ${entity?.name ?? hotspot.entityId}`}
    >
      <span className="absolute -top-8 left-0 whitespace-nowrap rounded-lg bg-green-700 px-2 py-1 text-xs font-bold text-white">
        {entity?.name ?? hotspot.entityId}
      </span>
    </div>
  );
}

function ItemList({
  items,
  empty,
  navigate,
}: {
  items: [string, { mastery: number; attempts: number; lastResult?: string }][];
  empty: string;
  navigate: Navigate;
}) {
  if (items.length === 0) return <p className="mt-3 text-slate-600">{empty}</p>;
  return (
    <div className="mt-4 space-y-2">
      {items.map(([itemId, item]) => (
        <button
          key={itemId}
          onClick={() => navigate(itemRoute(itemId))}
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-left hover:border-blue-300"
        >
          <span>
            <span className="block font-semibold text-slate-950">{itemLabel(itemId)}</span>
            <span className="block text-sm text-slate-500">
              {item.lastResult ?? 'low mastery'} after {item.attempts} attempt(s)
            </span>
          </span>
          <ProgressBadge value={item.mastery} />
        </button>
      ))}
    </div>
  );
}

function Page({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow && <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">{eyebrow}</p>}
          <h1 className="mt-1 text-3xl font-extrabold text-slate-950 sm:text-4xl">{title}</h1>
        </div>
        {action}
      </header>
      {children}
    </div>
  );
}

function DrillCard({
  label,
  title,
  prompt,
  children,
}: {
  label: string;
  title: string;
  prompt: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <p className="text-sm font-semibold uppercase text-blue-700">{label}</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-950">{title}</h2>
      <p className="mt-3 text-slate-600">{prompt}</p>
      <div className="mt-6">{children}</div>
    </Card>
  );
}

function DrillFooter({
  revealed,
  confidence,
  setConfidence,
  onReveal,
  onScore,
  onSkip,
}: {
  revealed: boolean;
  confidence: number;
  setConfidence: (value: number) => void;
  onReveal: () => void;
  onScore: (result: MasteryResult) => void;
  onSkip: () => void;
}) {
  return (
    <div className="mt-5">
      {revealed && <ConfidenceSelector value={confidence} onChange={setConfidence} />}
      <div className="mt-4 flex flex-wrap gap-2">
        {!revealed ? (
          <PrimaryButton onClick={onReveal}>Reveal Answer</PrimaryButton>
        ) : (
          <>
            <PrimaryButton onClick={() => onScore('correct')}>I Got It</PrimaryButton>
            <SecondaryButton onClick={() => onScore('partial')}>Partially</SecondaryButton>
            <SecondaryButton onClick={() => onScore('incorrect')}>Missed</SecondaryButton>
          </>
        )}
        <SecondaryButton onClick={onSkip}>Skip</SecondaryButton>
      </div>
    </div>
  );
}

function ConfidenceSelector({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <label className="mt-4 block">
      <span className="text-sm font-semibold text-slate-700">Confidence: {value}/5</span>
      <input
        className="mt-2 block w-full max-w-xs"
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function StudyInput({ placeholder }: { placeholder: string }) {
  return <textarea className="min-h-32 w-full rounded-lg border border-line p-3" placeholder={placeholder} />;
}

function SelectBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select className="mt-2 w-full rounded-lg border border-line px-3 py-2">{children}</select>
    </label>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`card-hover-magic rounded-xl border border-line bg-white/95 p-5 shadow-soft ${className}`}>{children}</section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-950">{value}</p>
    </Card>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="mb-3 mt-8 text-2xl font-bold text-slate-950">{title}</h2>;
}

function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-rose-600 hover:to-amber-600"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-pink-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50"
    >
      {children}
    </button>
  );
}

function ToggleButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
        active ? 'border-blue-700 bg-blue-700 text-white' : 'border-line bg-white text-slate-700 hover:border-blue-300'
      }`}
    >
      {children}
    </button>
  );
}

function FeedbackBanner({ result }: { result: MasteryResult }) {
  return (
    <div className={`mb-3 rounded-xl px-4 py-3 font-bold text-lg tracking-wide ${result === 'correct' ? 'animate-pop bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' : result === 'partial' ? 'animate-rise bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md' : 'animate-shake bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-md'}`}>
      {result === 'correct' ? '🎉 Correct! Lock that answer in! ⭐' : result === 'partial' ? '🙂 Partially correct — review the missing piece! 🔍' : '💪 Not yet! Use the expected answer, then retry later. 📖'}
    </div>
  );
}

function BakeryIllustration() {
  return (
    <div className="mb-6 rounded-2xl border border-pink-100 bg-gradient-to-r from-pink-50 via-amber-50 to-purple-50 px-6 py-5 shadow-sm animate-rise">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-pink-500">🧁 Mama's Little Bakery ERD</p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-800">Study smarter, not harder! 🍰</h2>
          <p className="mt-1 text-sm text-slate-500">41 entities • 46 rules • 6 domains</p>
        </div>
        {/* Inline SVG bakery illustration */}
        <div className="flex shrink-0 items-end gap-1 select-none" aria-hidden="true">
          {/* Cake with layers */}
          <svg width="90" height="80" viewBox="0 0 90 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Table */}
            <rect x="5" y="70" width="80" height="6" rx="2" fill="#d97706" opacity="0.5"/>
            {/* Bottom cake layer */}
            <rect x="10" y="52" width="70" height="18" rx="5" fill="#fbbf24"/>
            <rect x="10" y="52" width="70" height="5" rx="3" fill="#f59e0b"/>
            {/* Pink frosting drip bottom */}
            <path d="M14 57 Q20 62 26 57 Q32 62 38 57 Q44 62 50 57 Q56 62 62 57 Q68 62 74 57 Q78 60 76 57" stroke="#f9a8d4" strokeWidth="3" fill="none" strokeLinecap="round"/>
            {/* Middle cake layer */}
            <rect x="18" y="36" width="54" height="16" rx="5" fill="#fde68a"/>
            <rect x="18" y="36" width="54" height="5" rx="3" fill="#fbbf24"/>
            {/* Pink frosting drip middle */}
            <path d="M22 41 Q28 46 34 41 Q40 46 46 41 Q52 46 58 41 Q64 46 68 41" stroke="#f9a8d4" strokeWidth="3" fill="none" strokeLinecap="round"/>
            {/* Top cake layer */}
            <rect x="26" y="22" width="38" height="14" rx="5" fill="#fef3c7"/>
            <rect x="26" y="22" width="38" height="4" rx="3" fill="#fde68a"/>
            {/* Candles */}
            <rect x="34" y="12" width="5" height="10" rx="2" fill="#f472b6"/>
            <rect x="45" y="10" width="5" height="12" rx="2" fill="#a78bfa"/>
            <rect x="56" y="12" width="5" height="10" rx="2" fill="#34d399"/>
            {/* Flames */}
            <ellipse cx="36.5" cy="10" rx="3" ry="4" fill="#fbbf24" opacity="0.9"/>
            <ellipse cx="47.5" cy="8" rx="3" ry="4" fill="#fb923c" opacity="0.9"/>
            <ellipse cx="58.5" cy="10" rx="3" ry="4" fill="#fbbf24" opacity="0.9"/>
            {/* Cherry on top */}
            <circle cx="45" cy="20" r="3" fill="#ef4444"/>
            <line x1="45" y1="17" x2="43" y2="14" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round"/>
            {/* Sprinkles */}
            <rect x="20" y="43" width="5" height="2" rx="1" fill="#f472b6" transform="rotate(20 20 43)"/>
            <rect x="55" y="45" width="5" height="2" rx="1" fill="#60a5fa" transform="rotate(-15 55 45)"/>
            <rect x="35" y="60" width="5" height="2" rx="1" fill="#a78bfa" transform="rotate(10 35 60)"/>
            <rect x="62" y="60" width="5" height="2" rx="1" fill="#34d399" transform="rotate(-20 62 60)"/>
            <rect x="42" y="58" width="4" height="2" rx="1" fill="#fbbf24" transform="rotate(30 42 58)"/>
          </svg>
          {/* Floating decorative emojis */}
          <div className="mb-1 flex flex-col gap-1">
            <span className="text-2xl emoji-float" style={{animationDelay:'-0.5s'}}>⭐</span>
            <span className="text-xl emoji-float-delayed">✨</span>
          </div>
        </div>
      </div>
      {/* ERD memory tip */}
      <div className="mt-3 rounded-xl border border-pink-100 bg-white/70 px-4 py-2">
        <p className="text-sm font-semibold text-pink-600">🧠 Quick memory trick:</p>
        <p className="text-sm text-slate-600">Think of the ERD like layers of a cake — <strong>entities</strong> are the layers 🎂, <strong>relationships</strong> are the frosting connecting them 🍫, and <strong>FKs</strong> are the toothpicks holding it together! 📌</p>
      </div>
    </div>
  );
}

function domainEmoji(name: string) {
  if (name.toLowerCase().includes('customer') || name.toLowerCase().includes('sales')) return '🛍️';
  if (name.toLowerCase().includes('product') || name.toLowerCase().includes('market')) return '🍰';
  if (name.toLowerCase().includes('inventory') || name.toLowerCase().includes('supply')) return '📦';
  if (name.toLowerCase().includes('employee') || name.toLowerCase().includes('operation')) return '👥';
  if (name.toLowerCase().includes('catering') || name.toLowerCase().includes('delivery')) return '🚚';
  if (name.toLowerCase().includes('compliance') || name.toLowerCase().includes('regulatory')) return '📋';
  return '🏷️';
}

function ProgressBadge({ value }: { value: number }) {
  return <span className={`rounded-lg px-2 py-1 text-sm font-bold ${progressColor(value)}`}>{percent(value)}</span>;
}

function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-3 overflow-hidden rounded-lg bg-slate-100 ${className}`}>
      <div className={`h-full rounded-lg ${progressBarColor(value)}`} style={{ width: `${Math.max(4, value * 100)}%` }} />
    </div>
  );
}

function ReadinessRing({ value }: { value: number }) {
  const degrees = Math.round(value * 360);
  return (
    <div
      className="grid h-36 w-36 place-items-center rounded-full"
      style={{ background: `conic-gradient(#2563eb ${degrees}deg, #e2e8f0 ${degrees}deg)` }}
      aria-label={`Readiness ${percent(value)}`}
    >
      <div className="grid h-28 w-28 place-items-center rounded-full bg-white">
        <span className="text-2xl font-bold">{percent(value)}</span>
      </div>
    </div>
  );
}

function InfoBlock({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="rounded-lg border border-line bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <Code key={value}>{value}</Code>
        ))}
      </div>
    </div>
  );
}

function KeyValue({ label, values }: { label: string; values: string[] }) {
  return <InfoBlock label={label} values={values} />;
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{children}</span>;
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-white px-2 py-1 font-mono text-sm text-slate-900 ring-1 ring-line">{children}</code>;
}

function NotFound({ navigate }: { navigate: Navigate }) {
  return (
    <Page title="Page not found">
      <Card>
        <p className="text-slate-600">That route is not available.</p>
        <div className="mt-4">
          <PrimaryButton onClick={() => navigate('/')}>Go to Dashboard</PrimaryButton>
        </div>
      </Card>
    </Page>
  );
}

function entityQuestion(entity: Entity, mode: DrillMode) {
  if (mode === 'pk') return `What is the primary key of ${entity.name}?`;
  if (mode === 'fk') return `Which foreign keys are in ${entity.name}?`;
  if (mode === 'attributes') return `Which attributes belong to ${entity.name}?`;
  if (mode === 'domain') return `Which domain contains ${entity.name}?`;
  return `Describe ${entity.name} in one clear oral-exam answer.`;
}

function getEntityCorrectAnswers(entity: Entity, mode: Exclude<DrillMode, 'purpose'>) {
  if (mode === 'pk') return entity.primaryKey;
  if (mode === 'fk') return entity.foreignKeys.length ? entity.foreignKeys : ['none'];
  if (mode === 'attributes') return entity.attributes;
  return [entity.domainId];
}

function getEntityOptions(entity: Entity, mode: Exclude<DrillMode, 'purpose'>) {
  const correct = getEntityCorrectAnswers(entity, mode);
  if (mode === 'domain') return shuffle(unique([...correct, ...domains.map((domain) => domain.id)]));
  if (mode === 'pk') {
    const decoys = entities.flatMap((item) => item.primaryKey).filter((key) => !correct.includes(key));
    return shuffle(unique([...correct, ...decoys]).slice(0, Math.max(5, correct.length + 4)));
  }
  if (mode === 'fk') {
    const decoys = entities.flatMap((item) => item.foreignKeys).filter((key) => !correct.includes(key));
    const base = entity.foreignKeys.length ? correct : ['none'];
    return shuffle(unique([...base, ...decoys]).slice(0, 7));
  }
  const decoys = entities.flatMap((item) => item.attributes).filter((attribute) => !correct.includes(attribute));
  return shuffle(unique([...correct, ...decoys]).slice(0, Math.min(10, Math.max(6, correct.length + 4))));
}

function evaluateSelection(selected: string[], correct: string[]): MasteryResult {
  const selectedSet = new Set(selected);
  const correctSet = new Set(correct);
  const exact = selected.length === correct.length && correct.every((value) => selectedSet.has(value));
  if (exact) return 'correct';
  const overlap = correct.filter((value) => selectedSet.has(value)).length;
  const falsePositives = selected.filter((value) => !correctSet.has(value)).length;
  if (overlap > 0 && falsePositives <= 1) return 'partial';
  return 'incorrect';
}

function modelEntityAnswer(entity: Entity) {
  const pk = entity.primaryKey.join(', ');
  const fks = entity.foreignKeys.length ? ` It carries foreign keys ${entity.foreignKeys.join(', ')}.` : ' It does not carry foreign keys.';
  const attrs = entity.attributes.slice(0, 3).join(', ');
  const subtype = entity.subtypeOf ? ` It is a subtype of ${getEntityName(entity.subtypeOf)}.` : '';
  const bridge = entity.isAssociative ? ' It is an associative entity that resolves a many-to-many relationship.' : '';
  return `${entity.name} ${entity.description.toLowerCase()} Its primary key is ${pk}.${fks} Key attributes include ${attrs}.${subtype}${bridge}`;
}

function modelRelationshipAnswer(relationship: Relationship) {
  const fk = relationship.requiresAssociativeEntity
    ? `The many-to-many relationship is resolved by ${getEntityName(relationship.associativeEntityId)}, using ${relationship.fkField}.`
    : `The foreign key is ${relationship.fkField ?? 'not directly stored'} in ${getEntityName(relationship.fkTable)}.`;
  return `${relationship.ruleForward} ${relationship.ruleReverse} This is a ${relationship.cardinality} relationship. ${fk} ${relationship.oralCue}`;
}

function entityFollowUp(entity: Entity) {
  if (entity.isAssociative) {
    return `Why is ${entity.name} modeled as an associative entity instead of putting the foreign keys directly on one source table?`;
  }
  if (entity.foreignKeys.length > 0) {
    return `Pick one foreign key in ${entity.name} and explain the relationship that caused it to be placed there.`;
  }
  return `What makes ${entity.primaryKey.join(', ')} the unique identifier for ${entity.name}?`;
}

function relationshipFollowUp(relationship: Relationship) {
  if (relationship.requiresAssociativeEntity) {
    return `Why does this relationship need ${getEntityName(relationship.associativeEntityId)} instead of a direct foreign key?`;
  }
  return `Why does ${relationship.fkField ?? 'the key'} belong in ${getEntityName(relationship.fkTable)} for this relationship?`;
}

function itemLabel(id: string) {
  if (entityById[id]) return entityById[id].name;
  if (relationshipById[id]) return relationshipLabel(relationshipById[id]);
  return id;
}

function itemRoute(id: string) {
  if (entityById[id]) return `/study/entities/${id}`;
  if (relationshipById[id]) return `/study/relationships/${id}`;
  return '/study';
}

// New feature components

function QuickDrills({ progressStore }: { progressStore: ReturnType<typeof useProgressStore> }) {
  const [seconds, setSeconds] = useState(120);
  const [entityPool] = useState(() => randomFrom([entities, relationships]));
  const [current, setCurrent] = useState(() => entityPool === entities ? pickEntity(progressStore.progress.itemProgress) : pickRelationship(progressStore.progress.itemProgress));
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished) return undefined;
    const id = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          setFinished(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [finished]);

  function handleAnswer(result: MasteryResult) {
    if (result === 'correct') setCorrect((c) => c + 1);
    setAttempts((a) => a + 1);
    progressStore.recordAttempt(current.id, result, 3);
    setCurrent(entityPool === entities ? pickEntity(progressStore.progress.itemProgress) : pickRelationship(progressStore.progress.itemProgress));
  }

  const isEntity = entityPool === entities;
  const currentEntity = isEntity ? (current as Entity) : null;
  const currentRelationship = !isEntity ? (current as Relationship) : null;

  return (
    <Page title="Quick Drills" eyebrow="2-minute lightning round">
      <div className="mb-4 rounded-lg border border-line bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-500">TIME REMAINING</p>
          <p className={`text-4xl font-bold ${seconds <= 20 ? 'text-red-700' : 'text-slate-950'}`}>{formatTimer(seconds)}</p>
        </div>
        <p className="mt-3 text-sm text-slate-600">{attempts} attempted • {correct} correct</p>
      </div>

      {finished ? (
        <Card>
          <h2 className="text-2xl font-bold text-slate-950">Final score: {correct}/{attempts}</h2>
          <p className="mt-2 text-slate-600">Accuracy: {attempts === 0 ? '—' : percent(correct / attempts)}</p>
          <div className="mt-5 flex gap-2">
            <PrimaryButton onClick={() => location.reload()}>Try Again</PrimaryButton>
            <SecondaryButton onClick={() => location.pathname = '/practice'}>Back to Practice</SecondaryButton>
          </div>
        </Card>
      ) : (
        <Card>
          {currentEntity && (
            <div>
              <p className="text-sm font-semibold text-slate-500">ENTITY</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{currentEntity.name}</p>
              <p className="mt-1 text-slate-600">{currentEntity.description}</p>
              <div className="mt-4 flex gap-2">
                <PrimaryButton onClick={() => handleAnswer('correct')}>✓ Got it</PrimaryButton>
                <SecondaryButton onClick={() => handleAnswer('incorrect')}>✗ Missed</SecondaryButton>
              </div>
            </div>
          )}
          {currentRelationship && (
            <div>
              <p className="text-sm font-semibold text-slate-500">RELATIONSHIP</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{relationshipLabel(currentRelationship)}</p>
              <p className="mt-1 text-slate-600">Cardinality: {currentRelationship.cardinality}</p>
              <div className="mt-4 flex gap-2">
                <PrimaryButton onClick={() => handleAnswer('correct')}>✓ Got it</PrimaryButton>
                <SecondaryButton onClick={() => handleAnswer('incorrect')}>✗ Missed</SecondaryButton>
              </div>
            </div>
          )}
        </Card>
      )}
    </Page>
  );
}

function FreeRecallDrill({ progressStore }: { progressStore: ReturnType<typeof useProgressStore> }) {
  const [entity] = useState(() => pickEntity(progressStore.progress.itemProgress));
  const [mode] = useState<Exclude<DrillMode, 'purpose'>>(() => randomFrom(['pk', 'fk', 'attributes', 'domain'] as const));
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [confidence, setConfidence] = useState(3);

  const expected = getEntityCorrectAnswers(entity, mode).map((value) => (mode === 'domain' ? getDomainName(value) : value));

  function submit() {
    setSubmitted(true);
    const result = answer.toLowerCase().includes(expected[0].toLowerCase()) ? 'correct' : 'incorrect';
    progressStore.recordAttempt(entity.id, result, confidence);
    progressStore.recordWeakSpot(entity.id, entity.name, 'entity', result);
  }

  return (
    <Page title="Free Recall" eyebrow="Type your answer">
      <Card>
        <p className="text-sm font-semibold text-slate-500 uppercase">
          {mode === 'pk' && 'Primary Key'}
          {mode === 'fk' && 'Foreign Keys'}
          {mode === 'attributes' && 'Attributes'}
          {mode === 'domain' && 'Domain'}
        </p>
        <p className="mt-2 text-2xl font-bold text-slate-950">{entity.name}</p>
        <p className="mt-1 text-slate-600">{entity.description}</p>

        {!submitted && (
          <>
            <textarea
              className="mt-4 w-full rounded-lg border border-line p-3"
              placeholder="Type your answer..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={3}
            />
            <ConfidenceSelector value={confidence} onChange={setConfidence} />
            <div className="mt-4 flex gap-2">
              <PrimaryButton onClick={submit}>Submit</PrimaryButton>
            </div>
          </>
        )}

        {submitted && (
          <div className="mt-4 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
            <p className="font-bold text-blue-900">Expected: {expected.join(', ')}</p>
            <p className="mt-2 font-bold text-slate-950">Your answer: {answer || '(empty)'}</p>
          </div>
        )}
      </Card>
    </Page>
  );
}

function WeakSpotAnalytics({ navigate, progressStore }: { navigate: Navigate; progressStore: ReturnType<typeof useProgressStore> }) {
  const weakAnalytics = buildWeakSpotAnalytics(progressStore.progress.weakSpots);

  return (
    <Page title="Weak Spot Analysis" eyebrow="Error pattern breakdown">
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(weakAnalytics.byCategory).map(([category, spots]) => (
          spots.length > 0 && (
            <Card key={category}>
              <h2 className="text-lg font-bold text-slate-950 capitalize">{category}</h2>
              <div className="mt-3 space-y-2">
                {spots.slice(0, 5).map((spot) => (
                  <div key={spot.id} className="flex items-center justify-between rounded-lg border border-line p-2">
                    <span className="font-semibold text-slate-950">{spot.itemName}</span>
                    <span className="text-sm text-red-600">{spot.errorCount} errors</span>
                  </div>
                ))}
              </div>
            </Card>
          )
        ))}
      </div>

      <SectionHeader title="All weak spots" />
      <Card>
        <div className="space-y-2">
          {weakAnalytics.spots.map((spot) => (
            <div key={spot.id} className="flex items-center justify-between border-b border-line py-2 last:border-0">
              <div>
                <p className="font-semibold text-slate-950">{spot.itemName}</p>
                <p className="text-xs text-slate-600">{spot.category}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600">{spot.errorCount}</p>
                <p className="text-xs text-slate-500">errors</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Page>
  );
}

function MockOralReplays({ progressStore }: { progressStore: ReturnType<typeof useProgressStore> }) {
  return (
    <Page title="Mock Oral Replays" eyebrow="Review past sessions">
      <Card>
        <h2 className="text-xl font-bold text-slate-950">Recent sessions</h2>
        {progressStore.progress.mockOrals.length === 0 ? (
          <p className="mt-3 text-slate-600">No mock oral sessions recorded yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {progressStore.progress.mockOrals.map((session) => (
              <div key={session.id} className="rounded-lg border border-line p-3">
                <p className="font-bold text-slate-950">Score: {session.score}/{session.maxScore}</p>
                <p className="text-sm text-slate-600">{formatDate(session.startedAt)}</p>
                {session.durationSeconds && (
                  <p className="text-xs text-slate-500 mt-1">Duration: {Math.floor(session.durationSeconds / 60)} minutes</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </Page>
  );
}

// Utilities

function entityVisualPool(progress: ProgressState, weakOnly: boolean) {
  if (!weakOnly) return entities;
  const pool = weakEntities(progress);
  return pool.length > 0 ? pool : entities;
}

function relationshipVisualPool(progress: ProgressState, weakOnly: boolean) {
  if (!weakOnly) return relationships;
  const pool = weakRelationships(progress);
  return pool.length > 0 ? pool : relationships;
}

function weakEntities(progress: ProgressState) {
  return entities.filter((entity) => isWeakVisualItem(progress, entity.id));
}

function weakRelationships(progress: ProgressState) {
  return relationships.filter((relationship) => isWeakVisualItem(progress, relationship.id));
}

function isWeakVisualItem(progress: ProgressState, itemId: string) {
  const item = progress.itemProgress[itemId];
  return Boolean(item && item.attempts > 0 && (item.mastery < 0.55 || item.lastResult === 'incorrect'));
}

function scoreResult(score: number): MasteryResult {
  if (score >= 4) return 'correct';
  if (score >= 2) return 'partial';
  return 'incorrect';
}

function formatStudyTime(ms: number) {
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 1) return '<1m';
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function useRoute() {
  const [path, setPath] = useState(readRoutePath);
  useEffect(() => {
    const onRouteChange = () => setPath(readRoutePath());
    window.addEventListener('hashchange', onRouteChange);
    window.addEventListener('popstate', onRouteChange);
    return () => {
      window.removeEventListener('hashchange', onRouteChange);
      window.removeEventListener('popstate', onRouteChange);
    };
  }, []);
  return {
    path,
    navigate: (nextPath: string) => {
      const normalizedPath = normalizeRoutePath(nextPath);
      window.history.pushState({}, '', `${pageBasePath()}#${normalizedPath}`);
      setPath(normalizedPath);
      window.scrollTo({ top: 0 });
    },
  };
}

function readRoutePath() {
  const hashPath = normalizeRoutePath(window.location.hash.replace(/^#/, ''));
  if (hashPath !== '/') return hashPath;
  if (window.location.pathname !== '/' && !window.location.pathname.endsWith('/')) return normalizeRoutePath(window.location.pathname);
  return '/';
}

function normalizeRoutePath(path: string) {
  if (!path || path === '#') return '/';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return cleanPath.replace(/\/{2,}/g, '/');
}

function pageBasePath() {
  if (import.meta.env.BASE_URL !== './') return import.meta.env.BASE_URL;
  return window.location.pathname.endsWith('/') ? window.location.pathname : '/';
}

function isActivePath(current: string, item: string) {
  if (item === '/') return current === '/';
  return current === item || current.startsWith(`${item}/`);
}

function lastPathPart(path: string) {
  return path.split('/').filter(Boolean).at(-1) ?? '';
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

function progressColor(value: number) {
  if (value >= 0.75) return 'bg-green-100 text-green-800';
  if (value >= 0.4) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

function progressBarColor(value: number) {
  if (value >= 0.75) return 'bg-green-600';
  if (value >= 0.4) return 'bg-amber-500';
  return 'bg-red-600';
}

function resultFeedbackClass(result: MasteryResult) {
  if (result === 'correct') return 'border-green-300 bg-green-50 animate-correct-pulse';
  if (result === 'partial') return 'border-amber-300 bg-amber-50 animate-rise';
  return 'border-red-300 bg-red-50 animate-shake';
}
