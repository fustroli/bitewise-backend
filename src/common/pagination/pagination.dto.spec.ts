import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MAX_SEARCH_LENGTH, PaginationDto } from './pagination.dto.js';

describe('PaginationDto', () => {
  const toDto = (query: Record<string, unknown>) =>
    plainToInstance(PaginationDto, query);

  describe('search', () => {
    it('is optional', async () => {
      expect(await validate(toDto({}))).toHaveLength(0);
    });

    it('is trimmed', async () => {
      const dto = toDto({ search: '  apple pie  ' });

      expect(dto.search).toBe('apple pie');
      expect(await validate(dto)).toHaveLength(0);
    });

    it(`accepts ${MAX_SEARCH_LENGTH} chars after trimming`, async () => {
      const dto = toDto({ search: ` ${'a'.repeat(MAX_SEARCH_LENGTH)} ` });

      expect(await validate(dto)).toHaveLength(0);
    });

    it(`rejects more than ${MAX_SEARCH_LENGTH} chars`, async () => {
      const errors = await validate(
        toDto({ search: 'a'.repeat(MAX_SEARCH_LENGTH + 1) }),
      );

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('search');
    });
  });
});
