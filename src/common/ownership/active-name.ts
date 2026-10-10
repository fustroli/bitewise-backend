import { Column } from 'typeorm';

/**
 * `name` while the row is not soft-deleted, NULL afterwards. Paired with a
 * unique index on (user, activeName) it makes names unique per Owner among
 * non-deleted resources (MySQL treats NULLs as distinct). See ADR-0001.
 */
export function ActiveNameColumn(): PropertyDecorator {
  return Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    generatedType: 'STORED',
    asExpression: 'IF(`deleteTimeStamp` IS NULL, `name`, NULL)',
    select: false,
  });
}

// DuplicateEntryFilter derives the 409 message from this naming scheme.
export function activeNameIndexName(label: string): string {
  return `UQ_${label.replace(/ /g, '_')}_active_name`;
}
