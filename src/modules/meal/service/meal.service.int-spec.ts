import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  connectTestDatabase,
  createTestDatabase,
  createUser,
} from '../../../../test/int/test-database.js';
import { toConflict } from '../../../common/filters/index.js';
import { EOrderDirection } from '../../../common/pagination/index.js';
import { Ingredient } from '../../ingredient/entities/index.js';
import { EUnit } from '../../ingredient/enum/index.js';
import { User } from '../../user/entities/index.js';
import { Meal, MealIngredient } from '../entities/index.js';
import { MealService } from './meal.service.js';

const MISSING_ID = 999_999;
const NEW_QUANTITY = 30;

describe('MealService', () => {
  let dataSource: DataSource;
  let meals: MealService;
  let owner: User;
  let stranger: User;

  const createIngredient = (name: string, user: User) =>
    dataSource.getRepository(Ingredient).save({
      name,
      protein: 1,
      totalFat: 1,
      saturatedFat: 0,
      totalCarbohydrates: 1,
      sugar: 0,
      dietaryFiber: 0,
      calories: 10,
      price: 1,
      unit: EUnit.HUNDRED_GRAMS,
      user: { id: user.id },
    });

  const ingredientIdsOf = (meal: Meal) =>
    meal.mealIngredients.map((mi) => mi.ingredient.id).sort();

  const conflictOf = (promise: Promise<unknown>) =>
    promise.then(
      () => null,
      (error) => toConflict(error),
    );

  beforeAll(async () => {
    dataSource = await connectTestDatabase(await createTestDatabase());
    meals = new MealService(
      dataSource.getRepository(Meal),
      dataSource.getRepository(Ingredient),
      dataSource.getRepository(MealIngredient),
    );
  });

  afterAll(() => dataSource.destroy());

  beforeEach(async () => {
    owner = await createUser(dataSource);
    stranger = await createUser(dataSource);
  });

  describe('createOne', () => {
    it("creates a Meal from the Owner's Ingredients", async () => {
      const apple = await createIngredient('Apple', owner);
      const pear = await createIngredient('Pear', owner);

      const meal = await meals.createOne(
        {
          name: 'Fruit salad',
          mealIngredients: [
            { ingredientId: apple.id, quantity: 100 },
            { ingredientId: pear.id, quantity: 50 },
          ],
        },
        owner.id,
      );

      expect(meal).toMatchObject({ name: 'Fruit salad', userId: owner.id });
      expect(ingredientIdsOf(meal)).toEqual([apple.id, pear.id].sort());
    });

    it("404s for someone else's Ingredient", async () => {
      const theirs = await createIngredient('Apple', stranger);

      await expect(
        meals.createOne(
          {
            name: 'Fruit salad',
            mealIngredients: [{ ingredientId: theirs.id, quantity: 100 }],
          },
          owner.id,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('404s for a missing Ingredient', async () => {
      await expect(
        meals.createOne(
          {
            name: 'Fruit salad',
            mealIngredients: [{ ingredientId: MISSING_ID, quantity: 100 }],
          },
          owner.id,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('409s on a duplicate active name for the same Owner', async () => {
      const apple = await createIngredient('Apple', owner);
      const dto = {
        name: 'Fruit salad',
        mealIngredients: [{ ingredientId: apple.id, quantity: 100 }],
      };
      await meals.createOne(dto, owner.id);

      const conflict = await conflictOf(meals.createOne(dto, owner.id));

      expect(conflict).toBeInstanceOf(ConflictException);
      expect(conflict?.message).toBe(
        'You already have a meal named Fruit salad.',
      );
    });

    it('allows reusing the name of a soft-deleted Meal', async () => {
      const apple = await createIngredient('Apple', owner);
      const dto = {
        name: 'Fruit salad',
        mealIngredients: [{ ingredientId: apple.id, quantity: 100 }],
      };
      const first = await meals.createOne(dto, owner.id);
      await meals.deleteOne(first.id, owner.id);

      await expect(meals.createOne(dto, owner.id)).resolves.toMatchObject({
        name: 'Fruit salad',
      });
    });
  });

  describe('getOne / getAll', () => {
    it("404s for someone else's Meal", async () => {
      const apple = await createIngredient('Apple', stranger);
      const theirs = await meals.createOne(
        {
          name: 'Fruit salad',
          mealIngredients: [{ ingredientId: apple.id, quantity: 100 }],
        },
        stranger.id,
      );

      await expect(meals.getOne(theirs.id, owner.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("lists only the Owner's Meals, sorted by name", async () => {
      const apple = await createIngredient('Apple', owner);
      const names = ['Banana bowl', 'Apple pie'];
      for (const name of names) {
        await meals.createOne(
          { name, mealIngredients: [{ ingredientId: apple.id, quantity: 1 }] },
          owner.id,
        );
      }
      const plum = await createIngredient('Plum', stranger);
      await meals.createOne(
        {
          name: 'Plum cake',
          mealIngredients: [{ ingredientId: plum.id, quantity: 1 }],
        },
        stranger.id,
      );

      const page = await meals.getAll(owner.id, {
        orderBy: 'name',
        orderDirection: EOrderDirection.ASC,
      });

      expect(page.count).toBe(names.length);
      expect(page.data.map((m) => m.name)).toEqual([...names].sort());
      expect(page.data[0].mealIngredients[0].ingredient.name).toBe('Apple');
    });
  });

  describe('updateOne', () => {
    let meal: Meal;
    let apple: Ingredient;

    beforeEach(async () => {
      apple = await createIngredient('Apple', owner);
      meal = await meals.createOne(
        {
          name: 'Fruit salad',
          mealIngredients: [{ ingredientId: apple.id, quantity: 100 }],
        },
        owner.id,
      );
    });

    it('replaces the Meal ingredients when given', async () => {
      const pear = await createIngredient('Pear', owner);

      const updated = await meals.updateOne(
        meal.id,
        {
          mealIngredients: [{ ingredientId: pear.id, quantity: NEW_QUANTITY }],
        },
        owner.id,
      );

      expect(ingredientIdsOf(updated)).toEqual([pear.id]);
      expect(updated.mealIngredients[0].quantity).toBe(NEW_QUANTITY);
      expect(
        await dataSource
          .getRepository(MealIngredient)
          .countBy({ meal: { id: meal.id } }),
      ).toBe(1);
    });

    it('leaves the Meal ingredients unchanged when omitted', async () => {
      const updated = await meals.updateOne(
        meal.id,
        { name: 'Apple salad' },
        owner.id,
      );

      expect(updated.name).toBe('Apple salad');
      expect(ingredientIdsOf(updated)).toEqual([apple.id]);
    });

    it("404s when adding someone else's Ingredient", async () => {
      const theirs = await createIngredient('Pear', stranger);

      await expect(
        meals.updateOne(
          meal.id,
          { mealIngredients: [{ ingredientId: theirs.id, quantity: 1 }] },
          owner.id,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it("404s for someone else's Meal", async () => {
      await expect(
        meals.updateOne(meal.id, { name: 'Mine now' }, stranger.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteOne', () => {
    it("404s for someone else's Meal and leaves it intact", async () => {
      const apple = await createIngredient('Apple', owner);
      const meal = await meals.createOne(
        {
          name: 'Fruit salad',
          mealIngredients: [{ ingredientId: apple.id, quantity: 100 }],
        },
        owner.id,
      );

      await expect(meals.deleteOne(meal.id, stranger.id)).rejects.toThrow(
        NotFoundException,
      );
      await expect(meals.getOne(meal.id, owner.id)).resolves.toBeDefined();
    });
  });
});
