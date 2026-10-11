export const decimalTransformer = {
  to: (value: number): string => (value ? value.toString() : '0'),
  from: (value: string): number => (value ? parseFloat(value) : 0),
};

// For nullable columns: NULL stays null instead of becoming 0
export const nullableDecimalTransformer = {
  to: (value?: number | null) => (value == null ? value : value.toString()),
  from: (value: string | null): number | null =>
    value == null ? null : parseFloat(value),
};
