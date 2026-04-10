import { buildChecklistRubric, gradeTextAnswer } from './grading';
import type { MasteryResult, SqlRequirement } from '../types';

export interface ChecklistAnswerGrade {
  score: number;
  maxScore: number;
  weightedScore: number;
  matched: string[];
  missed: string[];
  percentage: number;
  result: MasteryResult;
}

export interface SqlOralScoreSummary {
  executionScore: number;
  easyScore: number;
  hardScore: number;
  deliveryScore: number;
  total: number;
  verdict: 'strong' | 'shaky' | 'needs-work';
  coachNote: string;
}

export const executionCheckLabels = [
  'AWS connection shown',
  'Correct functionality selected',
  'Current script ready to run',
  'Result understood in plain English',
  'Related table could be opened if asked',
] as const;

export const deliveryCheckLabels = [
  'Concise',
  'Confident',
  'Not rambling',
  'Used table and column names correctly',
  'Ended with clear interpretation',
] as const;

const clauseMeaningMap: Record<string, string> = {
  SELECT: 'Defines the columns and expressions that the query returns.',
  FROM: 'Sets the base rows the rest of the query builds on.',
  JOIN: 'Reconnects normalized tables so the output has the needed context.',
  WHERE: 'Filters raw rows before grouping or aggregation happens.',
  GROUP: 'Creates the reporting grain for aggregate calculations.',
  HAVING: 'Filters groups after aggregate values exist.',
  ORDER: 'Sorts the finished result so the most useful rows appear first.',
  LIMIT: 'Keeps only the first N rows after sorting.',
  CASE: 'Turns conditions into readable labels or conditional output values.',
  WITH: 'Splits a complex query into named intermediate steps.',
  UNION: 'Stacks compatible result sets into one output.',
};

const clauseAskMap: Record<string, string> = {
  SELECT: 'What does one output row represent here?',
  FROM: 'Why is this the right base table for this functionality?',
  JOIN: 'Why does this query need these tables connected together?',
  WHERE: 'What business rule is this filter enforcing?',
  GROUP: 'Why does this query need grouping instead of raw rows?',
  HAVING: 'Why is HAVING needed instead of WHERE here?',
  ORDER: 'Why is this the right sort order for explaining the result?',
  LIMIT: 'Why is top-N useful here?',
  CASE: 'Why is CASE used instead of a simple filter?',
  WITH: 'Why is the query easier or safer as a CTE?',
  UNION: 'Why are two result sets being combined?',
};

const clauseStrongAnswerMap: Record<string, string> = {
  SELECT: 'Name the columns and then say what one returned row means for the bakery.',
  FROM: 'Start with the base table and explain why it holds the primary business event.',
  JOIN: 'Tie each join back to the missing information it contributes.',
  WHERE: 'Translate the filter into a bakery rule, not just SQL syntax.',
  GROUP: 'Explain the reporting grain created by the grouping.',
  HAVING: 'State that aggregate values only exist after grouping.',
  ORDER: 'Explain why the sort makes the report easier to act on.',
  LIMIT: 'Explain that the professor only wants the top slice after ranking.',
  CASE: 'Explain the bucket or label being created and why it helps interpretation.',
  WITH: 'Explain how the named step makes the comparison or logic readable.',
  UNION: 'Explain what each half returns and why they belong in one result.',
};

export function gradeChecklistAnswer(answer: string, checklist: string[], weight = 1, rubricId = 'sql-checklist'): ChecklistAnswerGrade {
  const grade = gradeTextAnswer(answer, buildChecklistRubric(rubricId, rubricId, checklist));
  return {
    score: grade.score,
    maxScore: grade.maxScore,
    weightedScore: grade.score * weight,
    matched: grade.matchedCriteria,
    missed: grade.missedCriteria,
    percentage: grade.percentage,
    result: grade.result,
  };
}

export function gradeManualChecklist(checked: Record<string, boolean>, checklist: string[], weight = 1): ChecklistAnswerGrade {
  const matched = checklist.filter((item) => checked[item]);
  const missed = checklist.filter((item) => !checked[item]);
  const maxScore = checklist.length;
  const score = matched.length;
  const percentage = maxScore === 0 ? 0 : score / maxScore;
  return {
    score,
    maxScore,
    weightedScore: score * weight,
    matched,
    missed,
    percentage,
    result: masteryFromRatio(percentage),
  };
}

export function buildSqlOralScore({
  executionChecks,
  easyGrade,
  hardGrade,
  deliveryChecks,
}: {
  executionChecks: Record<string, boolean>;
  easyGrade: ChecklistAnswerGrade;
  hardGrade: ChecklistAnswerGrade;
  deliveryChecks: Record<string, boolean>;
}): SqlOralScoreSummary {
  const executionScore = scoreChecks(executionChecks);
  const deliveryScore = scoreChecks(deliveryChecks);
  const easyScore = easyGrade.score;
  const hardScore = hardGrade.weightedScore;
  const total = executionScore + easyScore + hardScore + deliveryScore;
  const verdict = verdictFromTotal(total);
  return {
    executionScore,
    easyScore,
    hardScore,
    deliveryScore,
    total,
    verdict,
    coachNote: buildCoachNote({ executionScore, easyGrade, hardGrade, deliveryScore, total }),
  };
}

export function verdictFromTotal(total: number): 'strong' | 'shaky' | 'needs-work' {
  if (total >= 20) return 'strong';
  if (total >= 13) return 'shaky';
  return 'needs-work';
}

export function highlightSql(sql: string) {
  let html = sql.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const keywords = [
    'SELECT',
    'FROM',
    'WHERE',
    'JOIN',
    'LEFT JOIN',
    'RIGHT JOIN',
    'INNER JOIN',
    'CROSS JOIN',
    'ON',
    'AND',
    'OR',
    'NOT',
    'IN',
    'AS',
    'GROUP BY',
    'ORDER BY',
    'HAVING',
    'LIMIT',
    'UNION',
    'UNION ALL',
    'CASE',
    'WHEN',
    'THEN',
    'ELSE',
    'END',
    'IS NULL',
    'IS NOT NULL',
    'BETWEEN',
    'WITH',
    'DISTINCT',
    'DESC',
    'ASC',
  ];
  const functions = ['COUNT', 'SUM', 'AVG', 'ROUND', 'MAX', 'MIN', 'DATE_TRUNC', 'EXTRACT', 'STRING_AGG', 'COALESCE', 'CURRENT_DATE', 'INTERVAL'];
  html = html.replace(/(--[^\n]*)/g, '<span class="sql-cm">$1</span>');
  html = html.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="sql-str">$1</span>');
  html = html.replace(new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi'), '<span class="sql-kw">$1</span>');
  html = html.replace(new RegExp(`\\b(${functions.join('|')})\\b`, 'gi'), '<span class="sql-fn">$1</span>');
  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="sql-num">$1</span>');
  return html;
}

export function clauseMeaning(clause: string) {
  return clauseMeaningMap[normalizeClauseKey(clause)] ?? 'Explain what this clause changes in the final result.';
}

export function clauseLikelyQuestion(clause: string, requirement: SqlRequirement) {
  const normalized = normalizeClauseKey(clause);
  if (normalized === 'HAVING' && requirement.hardQuestion) return requirement.hardQuestion;
  if (normalized === 'JOIN' && requirement.hardQuestion?.toLowerCase().includes('table')) return requirement.hardQuestion;
  return clauseAskMap[normalized] ?? `Why is ${clause} important in ${requirement.title}?`;
}

export function clauseStrongAnswer(clause: string) {
  return clauseStrongAnswerMap[normalizeClauseKey(clause)] ?? 'Tie the clause to the business question and what would break without it.';
}

function buildCoachNote({
  executionScore,
  easyGrade,
  hardGrade,
  deliveryScore,
  total,
}: {
  executionScore: number;
  easyGrade: ChecklistAnswerGrade;
  hardGrade: ChecklistAnswerGrade;
  deliveryScore: number;
  total: number;
}) {
  if (total >= 20) return 'Strong run. Repeat it once more under time pressure and keep the explanation this direct.';
  if (executionScore <= 2) return 'Tighten the AWS and script-run ritual first so the oral starts with easy points.';
  if (hardGrade.weightedScore <= 4) {
    const missed = hardGrade.missed.slice(0, 2).join('; ');
    return missed
      ? `Your hard answer stayed too general. Rehearse these points next: ${missed}.`
      : 'Your hard answer needs more query-specific cause-and-effect.';
  }
  if (deliveryScore <= 2) return 'The SQL logic is there. Shorten the answer and end with one clear business interpretation.';
  if (easyGrade.score <= 2) return 'Clean up the concept definition first, then tie it back to this specific script.';
  return 'You are close. Keep naming the business question, the table path, and the clause reason in that order.';
}

function scoreChecks(checks: Record<string, boolean>) {
  return Object.values(checks).filter(Boolean).length;
}

function masteryFromRatio(percentage: number): MasteryResult {
  if (percentage >= 0.75) return 'correct';
  if (percentage >= 0.45) return 'partial';
  return 'incorrect';
}

function normalizeClauseKey(clause: string) {
  const upper = clause.toUpperCase();
  if (upper.includes('GROUP')) return 'GROUP';
  if (upper.includes('ORDER')) return 'ORDER';
  if (upper.includes('WITH')) return 'WITH';
  if (upper.includes('UNION')) return 'UNION';
  if (upper.includes('CASE')) return 'CASE';
  return upper.split(/\s+/)[0] ?? upper;
}
