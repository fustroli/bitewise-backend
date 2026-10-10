import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  connectTestDatabase,
  createTestDatabase,
  createUser,
} from '../../../test/int/test-database.js';
import { Ingredient } from '../../modules/ingredient/entities/index.js';
import { EUnit } from '../../modules/ingredient/enum/index.js';
import { User } from '../../modules/user/entities/index.js';
import { toConflict } from '../filters/index.js';
import {
  DEFAULT_PAGE_LIMIT,
  EOrderDirection,
  MAX_PAGE_LIMIT,
} from '../pagination/index.js';
import { OwnedRepository } from './owned-repository.js';

const MISSING_ID = 999_999;

// Ingredient stands in for any Owned resource.
const ingredient = (name: string) => ({
  name,
  protein: 1,
  totalFat: 1,
  saturatedFat: 0,
  totalCarbohydrates: 1,
  sugar: 0,
  dietaryFiber: 0,
  calories: 10,
  unit: EUnit.HUNDRED_GRAMS,
});

describe('OwnedRepository', () => {
  let dataSource: DataSource;
  let repository: Repository<Ingredient>;
  let ingredients: OwnedRepository<Ingredient>;
  let owner: User;
  let stranger: User;

  beforeAll(async () => {
    dataSource = await connectTestDatabase(await createTestDatabase());
    repository = dataSource.getRepository(Ingredient);
    ingredients = new OwnedRepository(repository, {
      label: 'ingredient',
      sortable: ['name', 'calories'],
    });
  });

  afterAll(() => dataSource.destroy());

  beforeEach(async () => {
    owner = await createUser(dataSource);
    stranger = await createUser(dataSource);
  });

  describe('findOwnedOrFail', () => {
    it('returns an owned resource', async () => {
      const { id } = await ingredients.createOwned(
        ingredient('Apple'),
        owner.id,
      );

      const found = await ingredients.findOwnedOrFail(id, owner.id);

      expect(found).toMatchObject({ id, name: 'Apple', userId: owner.id });
    });

    it('404s for a resource owned by someone else', async () => {
      const { id } = await ingredients.createOwned(
        ingredient('Apple'),
        stranger.id,
      );

      await expect(ingredients.findOwnedOrFail(id, owner.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('404s for a missing resource', async () => {
      await expect(
        ingredients.findOwnedOrFail(MISSING_ID, owner.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('404s for a soft-deleted resource', async () => {
      const { id } = await ingredients.createOwned(
        ingredient('Apple'),
        owner.id,
      );
      await ingredients.softDeleteOwned(id, owner.id);

      await expect(ingredients.findOwnedOrFail(id, owner.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findManyOwned', () => {
    it('returns all requested owned resources', async () => {
      const a = await ingredients.createOwned(ingredient('Apple'), owner.id);
      const b = await ingredients.createOwned(ingredient('Pear'), owner.id);

      const found = await ingredients.findManyOwned(
        [a.id, b.id, a.id],
        owner.id,
      );

      expect(found.map((i) => i.id).sort()).toEqual([a.id, b.id].sort());
    });

    it('404s if any id belongs to someone else', async () => {
      const mine = await ingredients.createOwned(ingredient('Apple'), owner.id);
      const theirs = await ingredients.createOwned(
        ingredient('Pear'),
        stranger.id,
      );

      await expect(
        ingredients.findManyOwned([mine.id, theirs.id], owner.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('404s if any id is missing', async () => {
      const mine = await ingredients.createOwned(ingredient('Apple'), owner.id);

      await expect(
        ingredients.findManyOwned([mine.id, MISSING_ID], owner.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listOwned', () => {
    it("lists only the owner's non-deleted resources", async () => {
      const kept = await ingredients.createOwned(ingredient('Apple'), owner.id);
      const deleted = await ingredients.createOwned(
        ingredient('Pear'),
        owner.id,
      );
      await ingredients.softDeleteOwned(deleted.id, owner.id);
      await ingredients.createOwned(ingredient('Plum'), stranger.id);

      const page = await ingredients.listOwned(owner.id, {});

      expect(page.count).toBe(1);
      expect(page.data.map((i) => i.id)).toEqual([kept.id]);
    });

    it('sorts by a whitelisted column', async () => {
      for (const name of ['Banana', 'Apple', 'Cherry']) {
        await ingredients.createOwned(ingredient(name), owner.id);
      }

      const page = await ingredients.listOwned(owner.id, {
        orderBy: 'name',
        orderDirection: EOrderDirection.DESC,
      });

      expect(page.data.map((i) => i.name)).toEqual([
        'Cherry',
        'Banana',
        'Apple',
      ]);
    });

    it('400s for a column outside the sort whitelist', async () => {
      await expect(
        ingredients.listOwned(owner.id, { orderBy: 'protein' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        ingredients.listOwned(owner.id, { orderBy: 'notAColumn' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('defaults to 20 per page and caps the limit at 100', async () => {
      await repository.save(
        Array.from({ length: MAX_PAGE_LIMIT + 1 }, (_, i) =>
          repository.create({
            ...ingredient(`Item ${i}`),
            user: { id: owner.id },
          }),
        ),
      );

      const byDefault = await ingredients.listOwned(owner.id, {});
      const capped = await ingredients.listOwned(owner.id, {
        limit: MAX_PAGE_LIMIT + 1,
      });

      expect(byDefault).toMatchObject({ count: MAX_PAGE_LIMIT + 1 });
      expect(byDefault.data).toHaveLength(DEFAULT_PAGE_LIMIT);
      expect(capped.data).toHaveLength(MAX_PAGE_LIMIT);
    });
  });

  describe('softDeleteOwned', () => {
    it("404s for someone else's resource and leaves it intact", async () => {
      const { id } = await ingredients.createOwned(
        ingredient('Apple'),
        stranger.id,
      );

      await expect(ingredients.softDeleteOwned(id, owner.id)).rejects.toThrow(
        NotFoundException,
      );
      await expect(
        ingredients.findOwnedOrFail(id, stranger.id),
      ).resolves.toBeDefined();
    });
  });

  describe('name uniqueness per Owner', () => {
    const conflictOf = (promise: Promise<unknown>) =>
      promise.then(
        () => null,
        (error) => toConflict(error),
      );

    it('409s on a duplicate active name for the same owner', async () => {
      await ingredients.createOwned(ingredient('Apple'), owner.id);

      const conflict = await conflictOf(
        ingredients.createOwned(ingredient('Apple'), owner.id),
      );

      expect(conflict).toBeInstanceOf(ConflictException);
      expect(conflict.message).toBe(
        'You already have an ingredient named Apple.',
      );
    });

    it('409s when renaming onto an existing active name', async () => {
      await ingredients.createOwned(ingredient('Apple'), owner.id);
      const pear = await ingredients.createOwned(ingredient('Pear'), owner.id);

      const conflict = await conflictOf(
        repository.save(repository.merge(pear, { name: 'Apple' })),
      );

      expect(conflict).toBeInstanceOf(ConflictException);
    });

    it('allows the same name for different owners', async () => {
      await ingredients.createOwned(ingredient('Apple'), owner.id);

      await expect(
        ingredients.createOwned(ingredient('Apple'), stranger.id),
      ).resolves.toBeDefined();
    });

    it('allows reusing the name of a soft-deleted resource', async () => {
      const first = await ingredients.createOwned(
        ingredient('Apple'),
        owner.id,
      );
      await ingredients.softDeleteOwned(first.id, owner.id);

      await expect(
        ingredients.createOwned(ingredient('Apple'), owner.id),
      ).resolves.toMatchObject({ name: 'Apple' });
    });
  });
});
