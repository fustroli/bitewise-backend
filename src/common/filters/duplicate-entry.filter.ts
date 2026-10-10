import { ArgumentsHost, Catch, ConflictException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';

const DUPLICATE_ENTRY = /Duplicate entry '(.*)' for key '(?:[^.']+\.)?([^']+)'/;
const ACTIVE_NAME_INDEX = /^UQ_(\w+)_active_name$/;

/**
 * Maps a MySQL ER_DUP_ENTRY to a 409 Conflict; null for any other error.
 * Active-name indexes get a message naming the resource and the clashing name.
 */
export function toConflict(error: unknown): ConflictException | null {
  if (!(error instanceof QueryFailedError)) return null;
  const driverError = error.driverError as { code?: string; message?: string };
  if (driverError?.code !== 'ER_DUP_ENTRY') return null;

  const [, entry, index] = DUPLICATE_ENTRY.exec(driverError.message) ?? [];
  const label = ACTIVE_NAME_INDEX.exec(index ?? '')?.[1]?.replace(/_/g, ' ');

  if (!label) return new ConflictException('This resource already exists.');

  // The entry is "<ownerId>-<name>"
  const name = entry.slice(entry.indexOf('-') + 1);
  const article = /^[aeiou]/i.test(label) ? 'an' : 'a';
  return new ConflictException(
    `You already have ${article} ${label} named ${name}.`,
  );
}

@Catch(QueryFailedError)
export class DuplicateEntryFilter extends BaseExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    super.catch(toConflict(exception) ?? exception, host);
  }
}
