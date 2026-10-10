import { Column } from 'typeorm';

/**
 * `column` while the row is not soft-deleted, NULL afterwards. Paired with a
 * unique index it makes `column` unique among non-deleted rows (MySQL treats
 * NULLs as distinct). See ADR-0001.
 */
export function ActiveColumn(column: string): PropertyDecorator {
  return Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    generatedType: 'STORED',
    asExpression: `IF(\`deleteTimeStamp\` IS NULL, \`${column}\`, NULL)`,
    select: false,
  });
}

/**
 * `name` while the row is not soft-deleted. Paired with a unique index on
 * (user, activeName) it makes names unique per Owner.
 */
export function ActiveNameColumn(): PropertyDecorator {
  return ActiveColumn('name');
}

// DuplicateEntryFilter derives the 409 message from this naming scheme.
export function activeNameIndexName(label: string): string {
  return `UQ_${label.replace(/ /g, '_')}_active_name`;
}
