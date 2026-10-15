import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MAX_IDS, MAX_SEARCH_LENGTH, PaginationDto } from './pagination.dto.js';

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

  describe('ids', () => {
    it('is optional', async () => {
      expect(toDto({}).ids).toBeUndefined();
    });

    it('parses a comma-separated list', async () => {
      const dto = toDto({ ids: '1,2,3' });

      expect(dto.ids).toEqual([1, 2, 3]);
      expect(await validate(dto)).toHaveLength(0);
    });

    it('parses repeated params', async () => {
      const dto = toDto({ ids: ['1', '2'] });

      expect(dto.ids).toEqual([1, 2]);
      expect(await validate(dto)).toHaveLength(0);
    });

    it(`rejects more than ${MAX_IDS} ids`, async () => {
      const tooMany = Array.from({ length: MAX_IDS + 1 }, (_, i) => i + 1);
      const errors = await validate(toDto({ ids: tooMany.join(',') }));

      expect(errors[0].property).toBe('ids');
    });

    it.each(['a', '1,b', '', '1,,2', '1.5', '0', '-1'])(
      'rejects invalid ids %p',
      async (ids) => {
        const errors = await validate(toDto({ ids }));

        expect(errors[0].property).toBe('ids');
      },
    );
  });
});
