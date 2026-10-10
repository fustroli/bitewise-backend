import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { toConflict } from './duplicate-entry.filter.js';

const queryError = (driverError: object) =>
  new QueryFailedError('INSERT ...', [], driverError as Error);

const duplicate = (key: string, entry = '1-Apple') =>
  queryError({
    code: 'ER_DUP_ENTRY',
    message: `Duplicate entry '${entry}' for key '${key}'`,
  });

describe('toConflict', () => {
  it('names the resource and the clashing name for an active-name index', () => {
    const conflict = toConflict(
      duplicate('ingredient.UQ_ingredient_active_name'),
    );

    expect(conflict).toBeInstanceOf(ConflictException);
    expect(conflict.message).toBe(
      'You already have an ingredient named Apple.',
    );
  });

  it('handles multi-word labels and names containing dashes', () => {
    const conflict = toConflict(
      duplicate('meal_plan.UQ_meal_plan_active_name', '7-Low-carb week'),
    );

    expect(conflict.message).toBe(
      'You already have a meal plan named Low-carb week.',
    );
  });

  it('gives a generic 409 for other unique indexes', () => {
    expect(toConflict(duplicate('user.IDX_email'))?.message).toBe(
      'This resource already exists.',
    );
  });

  it('ignores other database errors', () => {
    expect(toConflict(queryError({ code: 'ER_NO_SUCH_TABLE' }))).toBeNull();
  });

  it('ignores non-database errors', () => {
    expect(toConflict(new Error('boom'))).toBeNull();
  });
});
