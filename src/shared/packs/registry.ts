import type { SubjectPack } from './types';
import { genericPack } from './generic';
import { englishPack } from './english';

const packs: Record<string, SubjectPack> = {
  generic: genericPack,
  english: englishPack
};

export function getSubjectPack(id: string): SubjectPack {
  const pack = packs[id];
  if (!pack) {
    // Graceful fallback to generic if a pack is removed or missing
    return genericPack;
  }
  return pack;
}

export function getAllPacks(): SubjectPack[] {
  return Object.values(packs);
}
