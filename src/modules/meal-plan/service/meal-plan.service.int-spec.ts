import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  connectTestDatabase,
  createTestDatabase,
  createUser,
} from '../../../../test/int/test-database.js';
import { toConflict } from '../../../common/filters/index.js';
import { EOrderDirection } from '../../../common/pagination/index.js';
import { Meal } from '../../meal/entities/index.js';
import { User } from '../../user/entities/index.js';
import { MealPlan, MealPlanMeal } from '../entities/index.js';
import { MealPlanService } from './meal-plan.service.js';

const MISSING_ID = 999_999;

describe('MealPlanService', () => {
  let dataSource: DataSource;
  let mealPlans: MealPlanService;
  let owner: User;
  let stranger: User;

  // Meals without Meal ingredients are enough to exercise Meal plans
  const createMeal = (name: string, user: User) =>
    dataSource.getRepository(Meal).save({ name, user: { id: user.id } });

  const mealIdsOf = (mealPlan: MealPlan) =>
    mealPlan.mealPlanMeals.map((mpm) => mpm.meal.id).sort();

  const conflictOf = (promise: Promise<unknown>) =>
    promise.then(
      () => null,
      (error) => toConflict(error),
    );

  beforeAll(async () => {
    dataSource = await connectTestDatabase(await createTestDatabase());
    mealPlans = new MealPlanService(
      dataSource.getRepository(MealPlan),
      dataSource.getRepository(Meal),
      dataSource.getRepository(MealPlanMeal),
    );
  });

  afterAll(() => dataSource.destroy());

  beforeEach(async () => {
    owner = await createUser(dataSource);
    stranger = await createUser(dataSource);
  });

  describe('createOne', () => {
    it("creates a Meal plan from the Owner's Meals", async () => {
      const oats = await createMeal('Oats', owner);
      const salad = await createMeal('Salad', owner);

      const mealPlan = await mealPlans.createOne(
        { name: 'Monday', mealIds: [oats.id, salad.id] },
        owner.id,
      );

      expect(mealPlan).toMatchObject({ name: 'Monday', userId: owner.id });
      expect(mealIdsOf(mealPlan)).toEqual([oats.id, salad.id].sort());
    });

    it("404s for someone else's Meal", async () => {
      const theirs = await createMeal('Oats', stranger);

      await expect(
        mealPlans.createOne({ name: 'Monday', mealIds: [theirs.id] }, owner.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('404s for a missing Meal', async () => {
      await expect(
        mealPlans.createOne(
          { name: 'Monday', mealIds: [MISSING_ID] },
          owner.id,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('409s on a duplicate active name for the same Owner', async () => {
      const oats = await createMeal('Oats', owner);
      const dto = { name: 'Monday', mealIds: [oats.id] };
      await mealPlans.createOne(dto, owner.id);

      const conflict = await conflictOf(mealPlans.createOne(dto, owner.id));

      expect(conflict).toBeInstanceOf(ConflictException);
      expect(conflict?.message).toBe(
        'You already have a meal plan named Monday.',
      );
    });

    it('allows reusing the name of a soft-deleted Meal plan', async () => {
      const oats = await createMeal('Oats', owner);
      const dto = { name: 'Monday', mealIds: [oats.id] };
      const first = await mealPlans.createOne(dto, owner.id);
      await mealPlans.deleteOne(first.id, owner.id);

      await expect(mealPlans.createOne(dto, owner.id)).resolves.toMatchObject({
        name: 'Monday',
      });
    });
  });

  describe('getOne / getAll', () => {
    it("404s for someone else's Meal plan", async () => {
      const oats = await createMeal('Oats', stranger);
      const theirs = await mealPlans.createOne(
        { name: 'Monday', mealIds: [oats.id] },
        stranger.id,
      );

      await expect(mealPlans.getOne(theirs.id, owner.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("lists only the Owner's Meal plans, sorted by name", async () => {
      const oats = await createMeal('Oats', owner);
      const names = ['Tuesday', 'Monday'];
      for (const name of names) {
        await mealPlans.createOne({ name, mealIds: [oats.id] }, owner.id);
      }
      const theirOats = await createMeal('Oats', stranger);
      await mealPlans.createOne(
        { name: 'Sunday', mealIds: [theirOats.id] },
        stranger.id,
      );

      const page = await mealPlans.getAll(owner.id, {
        orderBy: 'name',
        orderDirection: EOrderDirection.ASC,
      });

      expect(page.count).toBe(names.length);
      expect(page.data.map((mp) => mp.name)).toEqual([...names].sort());
      expect(page.data[0].mealPlanMeals[0].meal.name).toBe('Oats');
    });
  });

  describe('updateOne', () => {
    let mealPlan: MealPlan;
    let oats: Meal;

    beforeEach(async () => {
      oats = await createMeal('Oats', owner);
      mealPlan = await mealPlans.createOne(
        { name: 'Monday', mealIds: [oats.id] },
        owner.id,
      );
    });

    it('replaces the Meals when given, leaving no orphan rows', async () => {
      const salad = await createMeal('Salad', owner);

      const updated = await mealPlans.updateOne(
        mealPlan.id,
        { mealIds: [salad.id] },
        owner.id,
      );

      expect(mealIdsOf(updated)).toEqual([salad.id]);
      const rows = await dataSource.getRepository(MealPlanMeal).find({
        relations: { mealPlan: true },
        where: { meal: { id: oats.id } },
      });
      expect(rows).toEqual([]);
    });

    it('leaves the Meals unchanged when omitted', async () => {
      const updated = await mealPlans.updateOne(
        mealPlan.id,
        { name: 'Mon' },
        owner.id,
      );

      expect(updated.name).toBe('Mon');
      expect(mealIdsOf(updated)).toEqual([oats.id]);
    });

    it("404s when adding someone else's Meal (no longer silently dropped)", async () => {
      const theirs = await createMeal('Salad', stranger);

      await expect(
        mealPlans.updateOne(
          mealPlan.id,
          { mealIds: [oats.id, theirs.id] },
          owner.id,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(mealIdsOf(await mealPlans.getOne(mealPlan.id, owner.id))).toEqual([
        oats.id,
      ]);
    });

    it("404s for someone else's Meal plan", async () => {
      await expect(
        mealPlans.updateOne(mealPlan.id, { name: 'Mine now' }, stranger.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteOne', () => {
    it("404s for someone else's Meal plan and leaves it intact", async () => {
      const oats = await createMeal('Oats', owner);
      const mealPlan = await mealPlans.createOne(
        { name: 'Monday', mealIds: [oats.id] },
        owner.id,
      );

      await expect(
        mealPlans.deleteOne(mealPlan.id, stranger.id),
      ).rejects.toThrow(NotFoundException);
      await expect(
        mealPlans.getOne(mealPlan.id, owner.id),
      ).resolves.toBeDefined();
    });
  });
});
