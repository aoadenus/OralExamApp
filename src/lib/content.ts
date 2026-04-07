import domainsData from '../data/domains.json';
import entitiesData from '../data/entities.json';
import relationshipsData from '../data/relationships.json';
import associativeData from '../data/associative-entities.json';
import oralQuestionsData from '../data/oral-questions.json';
import subtypesData from '../data/subtypes.json';
import erdHotspotsData from '../data/erd-hotspots.json';
import type {
  AssociativeEntity,
  Domain,
  Entity,
  ErdHotspot,
  OralQuestion,
  Relationship,
  SubtypeRelationship,
} from '../types';

export const domains = domainsData as Domain[];
export const entities = entitiesData as Entity[];
export const relationships = relationshipsData as Relationship[];
export const associativeEntities = associativeData as AssociativeEntity[];
export const oralQuestions = oralQuestionsData as OralQuestion[];
export const subtypes = subtypesData as SubtypeRelationship[];
export const erdHotspots = erdHotspotsData as ErdHotspot[];

export const entityById = indexById(entities);
export const domainById = indexById(domains);
export const relationshipById = indexById(relationships);
export const associativeById = indexById(associativeEntities);
export const oralQuestionById = indexById(oralQuestions);
export const erdHotspotByEntityId = Object.fromEntries(
  erdHotspots.map((hotspot) => [hotspot.entityId, hotspot]),
) as Record<string, ErdHotspot>;

export function indexById<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

export function getEntityName(id: string | null | undefined) {
  if (!id) return 'None';
  return entityById[id]?.name ?? associativeById[id]?.name ?? id;
}

export function getDomainName(id: string | undefined) {
  if (!id) return 'Unassigned';
  return domainById[id]?.name ?? id;
}

export function relationshipsForDomain(domainId: string) {
  return relationships.filter((relationship) => relationship.domainId === domainId);
}

export function entitiesForDomain(domainId: string) {
  return entities.filter((entity) => entity.domainId === domainId);
}

export function relationshipLabel(relationship: Relationship) {
  return `${getEntityName(relationship.entityA)} to ${getEntityName(relationship.entityB)}`;
}
