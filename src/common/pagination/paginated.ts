export interface IPaginated<T> {
  data: T[];
  count: number;
}

export function mapPaginated<T, R>(
  page: IPaginated<T>,
  fn: (item: T) => R,
): IPaginated<R> {
  return { data: page.data.map((item) => fn(item)), count: page.count };
}
