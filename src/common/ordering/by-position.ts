export interface IPositioned {
  id: number;
  position: number;
}

/**
 * Sort comparator for join rows that keep a client-chosen order. Relations
 * load in no particular order, so readers sort; id breaks ties.
 */
export function byPosition(a: IPositioned, b: IPositioned): number {
  return a.position - b.position || a.id - b.id;
}
