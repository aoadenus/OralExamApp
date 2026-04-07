import { associativeEntities, entities, relationships } from './content';
import type { Entity, ItemProgress, Relationship } from '../types';

export function pickEntity(itemProgress: Record<string, ItemProgress>, pool = entities) {
  return weightedPick(pool, (entity) => entityPriority(entity, itemProgress));
}

export function pickRelationship(itemProgress: Record<string, ItemProgress>, pool = relationships) {
  return weightedPick(pool, (relationship) => relationshipPriority(relationship, itemProgress));
}

export function pickAssociativeEntity(itemProgress: Record<string, ItemProgress>) {
  return weightedPick(associativeEntities, (entity) => entityPriority({ id: entity.id, isAssociative: true } as Entity, itemProgress));
}

export function relationshipPriority(relationship: Relationship, itemProgress: Record<string, ItemProgress>) {
  const progress = itemProgress[relationship.id];
  const mastery = progress?.mastery ?? 0;
  const missedRecently = progress?.lastResult === 'incorrect' ? 0.2 : 0;
  const bridgeBoost = relationship.requiresAssociativeEntity ? 0.1 : 0;
  const recencyWeight = progress?.lastSeenAt ? 0.05 : 0.2;
  return (1 - mastery) * 0.45 + recencyWeight + missedRecently + bridgeBoost + Math.random() * 0.05;
}

function entityPriority(entity: Entity, itemProgress: Record<string, ItemProgress>) {
  const progress = itemProgress[entity.id];
  const mastery = progress?.mastery ?? 0;
  const missedRecently = progress?.lastResult === 'incorrect' ? 0.2 : 0;
  const bridgeBoost = entity.isAssociative ? 0.1 : 0;
  const recencyWeight = progress?.lastSeenAt ? 0.05 : 0.2;
  return (1 - mastery) * 0.45 + recencyWeight + missedRecently + bridgeBoost + Math.random() * 0.05;
}

function weightedPick<T>(items: T[], getWeight: (item: T) => number): T {
  const weights = items.map((item) => Math.max(0.01, getWeight(item)));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = Math.random() * total;
  for (let index = 0; index < items.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return items[index];
  }
  return items[0];
}
