import { getEntityName } from './content';
import type { Entity, MasteryResult, OralQuestion, Relationship, SubtypeRelationship } from '../types';

export interface GradeCriterion {
  id: string;
  label: string;
  terms: string[];
  minMatches?: number;
}

export interface GradeResult {
  score: number;
  maxScore: number;
  percentage: number;
  result: MasteryResult;
  matchedCriteria: string[];
  missedCriteria: string[];
  feedback: string;
}

export interface TextAnswerRubric {
  id: string;
  label: string;
  criteria: GradeCriterion[];
}

const stopWords = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'can',
  'each',
  'for',
  'from',
  'has',
  'have',
  'in',
  'is',
  'it',
  'many',
  'may',
  'must',
  'of',
  'one',
  'or',
  'the',
  'this',
  'through',
  'to',
  'with',
]);

export function gradeTextAnswer(answer: string, rubric: TextAnswerRubric): GradeResult {
  const normalizedAnswer = normalizeForGrading(answer);
  const compactAnswer = normalizedAnswer.replace(/\s+/g, '');
  const matchedCriteria: string[] = [];
  const missedCriteria: string[] = [];

  rubric.criteria.forEach((criterion) => {
    const terms = unique(criterion.terms.flatMap(termVariants).map(normalizeForGrading).filter(Boolean));
    const matchedTerms = terms.filter((term) => normalizedAnswer.includes(term) || compactAnswer.includes(term.replace(/\s+/g, '')));
    const minMatches = criterion.minMatches ?? 1;
    if (matchedTerms.length >= Math.min(minMatches, Math.max(terms.length, 1))) {
      matchedCriteria.push(criterion.label);
    } else {
      missedCriteria.push(criterion.label);
    }
  });

  const maxScore = Math.max(rubric.criteria.length, 1);
  const score = matchedCriteria.length;
  const percentage = score / maxScore;
  const result = percentage >= 0.75 ? 'correct' : percentage >= 0.45 ? 'partial' : 'incorrect';
  return {
    score,
    maxScore,
    percentage,
    result,
    matchedCriteria,
    missedCriteria,
    feedback: feedbackForResult(result, score, maxScore),
  };
}

export function buildEntityRubric(entity: Entity): TextAnswerRubric {
  return {
    id: `entity-${entity.id}`,
    label: `${entity.name} oral answer`,
    criteria: [
      {
        id: 'purpose',
        label: `Explains the purpose of ${entity.name}`,
        terms: importantTerms(`${entity.name} ${entity.description}`),
        minMatches: 2,
      },
      ...entity.primaryKey.map((key) => ({
        id: `pk-${key}`,
        label: `Mentions primary key ${key}`,
        terms: [key, key.replace(/_/g, ' ')],
      })),
      ...(entity.foreignKeys.length
        ? entity.foreignKeys.map((key) => ({
            id: `fk-${key}`,
            label: `Mentions foreign key ${key}`,
            terms: [key, key.replace(/_/g, ' ')],
          }))
        : [{ id: 'no-fk', label: 'Mentions that there are no foreign keys', terms: ['no foreign keys', 'none'] }]),
      {
        id: 'attributes',
        label: 'Mentions at least two relevant attributes',
        terms: entity.attributes,
        minMatches: Math.min(2, Math.max(entity.attributes.length, 1)),
      },
    ],
  };
}

export function buildRelationshipRubric(relationship: Relationship): TextAnswerRubric {
  const fkOrBridge = relationship.requiresAssociativeEntity
    ? relationship.associativeEntityId ?? relationship.fkTable ?? ''
    : relationship.fkTable ?? '';
  return {
    id: `relationship-${relationship.id}`,
    label: `${getEntityName(relationship.entityA)} and ${getEntityName(relationship.entityB)} business rules`,
    criteria: [
      {
        id: 'entity-a',
        label: `Mentions ${getEntityName(relationship.entityA)}`,
        terms: [getEntityName(relationship.entityA), relationship.entityA],
      },
      {
        id: 'entity-b',
        label: `Mentions ${getEntityName(relationship.entityB)}`,
        terms: [getEntityName(relationship.entityB), relationship.entityB],
      },
      {
        id: 'forward-rule',
        label: 'States the forward business rule',
        terms: importantTerms(relationship.ruleForward),
        minMatches: 2,
      },
      {
        id: 'reverse-rule',
        label: 'States the reverse business rule',
        terms: importantTerms(relationship.ruleReverse),
        minMatches: 2,
      },
      {
        id: 'cardinality',
        label: `Identifies cardinality ${relationship.cardinality}`,
        terms: [relationship.cardinality, relationship.type, relationship.cardinality.replace(':', ' to ')],
      },
      {
        id: 'fk-table',
        label: relationship.requiresAssociativeEntity
          ? `Identifies bridge table ${getEntityName(fkOrBridge)}`
          : `Identifies FK table ${getEntityName(fkOrBridge)}`,
        terms: [getEntityName(fkOrBridge), fkOrBridge],
      },
      {
        id: 'fk-field',
        label: `Mentions FK field ${relationship.fkField ?? 'none'}`,
        terms: relationship.fkField ? relationship.fkField.split(',').map((field) => field.trim()) : ['none', 'no foreign key'],
      },
      {
        id: 'justification',
        label: 'Justifies FK or bridge placement',
        terms: importantTerms(relationship.oralCue),
        minMatches: 2,
      },
    ],
  };
}

export function buildSubtypeRubric(subtype: SubtypeRelationship): TextAnswerRubric {
  return {
    id: `subtype-${subtype.id}`,
    label: `${getEntityName(subtype.subtypeId)} subtype answer`,
    criteria: [
      {
        id: 'subtype',
        label: `Identifies subtype ${getEntityName(subtype.subtypeId)}`,
        terms: [getEntityName(subtype.subtypeId), subtype.subtypeId],
      },
      {
        id: 'supertype',
        label: `Identifies supertype ${getEntityName(subtype.supertypeId)}`,
        terms: [getEntityName(subtype.supertypeId), subtype.supertypeId],
      },
      ...subtype.primaryKey.map((key) => ({
        id: `key-${key}`,
        label: `Mentions shared key ${key}`,
        terms: [key, key.replace(/_/g, ' ')],
      })),
      {
        id: 'meaning',
        label: 'Explains the subtype meaning',
        terms: importantTerms(subtype.description),
        minMatches: 2,
      },
      {
        id: 'not-every-supertype',
        label: 'Explains that not every supertype row needs a subtype row',
        terms: ['not every', 'not all', 'optional', 'specializes', 'subtype'],
        minMatches: 1,
      },
    ],
  };
}

export function buildOralQuestionRubric(question: OralQuestion, entity?: Entity, relationship?: Relationship): TextAnswerRubric {
  const base =
    question.type === 'relationship' && relationship
      ? buildRelationshipRubric(relationship)
      : entity
        ? buildEntityRubric(entity)
        : {
            id: question.id,
            label: question.prompt,
            criteria: [],
          };

  const checklistCriteria = question.expectedChecklist.map((item, index) => ({
    id: `checklist-${index}`,
    label: item,
    terms: importantTerms(item),
    minMatches: 1,
  }));

  return {
    ...base,
    id: question.id,
    label: question.prompt,
    criteria: mergeCriteria([...base.criteria, ...checklistCriteria]),
  };
}

export function buildChecklistRubric(id: string, label: string, checklist: string[]): TextAnswerRubric {
  return {
    id,
    label,
    criteria: checklist.map((item, index) => ({
      id: `${id}-item-${index}`,
      label: item,
      terms: importantTerms(item),
      minMatches: 1,
    })),
  };
}

export function gradeToFivePointScore(grade: GradeResult) {
  return Math.round(grade.percentage * 5);
}

function feedbackForResult(result: MasteryResult, score: number, maxScore: number) {
  if (result === 'correct') return `Strong answer: ${score}/${maxScore} rubric points matched.`;
  if (result === 'partial') return `Partial answer: ${score}/${maxScore} rubric points matched. Review the missed items before moving on.`;
  return `Needs review: ${score}/${maxScore} rubric points matched. Study the model answer, then retry this item.`;
}

function importantTerms(text: string) {
  return unique(
    normalizeForGrading(text)
      .split(' ')
      .filter((term) => term.length >= 3 && !stopWords.has(term)),
  ).slice(0, 10);
}

function termVariants(term: string) {
  return unique([term, term.replace(/_/g, ' '), term.replace(/_/g, ''), term.replace(/-/g, ' ')]);
}

function normalizeForGrading(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[_-]/g, ' ')
    .replace(/[^a-z0-9:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mergeCriteria(criteria: GradeCriterion[]) {
  const seen = new Set<string>();
  return criteria.filter((criterion) => {
    const key = `${criterion.label}-${criterion.terms.join('|')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return criterion.terms.length > 0;
  });
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}
