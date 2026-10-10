import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  connectTestDatabase,
  createTestDatabase,
  createUser,
} from '../../../../test/int/test-database.js';
import { Meal, MealIngredient } from '../../meal/entities/index.js';
import { User } from '../../user/entities/index.js';
import { Ingredient } from '../entities/index.js';
import { EUnit } from '../enum/index.js';
import { IngredientService } from './ingredient.service.js';

describe('IngredientService', () => {
  let dataSource: DataSource;
  let ingredients: IngredientService;
  let owner: User;
  let stranger: User;

  const createIngredient = (name: string, user: User) =>
    ingredients.createOne(
      {
        name,
        protein: 1,
        totalFat: 1,
        saturatedFat: 0,
        totalCarbohydrates: 1,
        sugar: 0,
        dietaryFiber: 0,
        calories: 10,
        unit: EUnit.HUNDRED_GRAMS,
      },
      user.id,
    );

  const createMeal = (name: string, ingredient: Ingredient) =>
    dataSource.getRepository(Meal).save({
      name,
      user: { id: owner.id },
      mealIngredients: [
        { ingredient: { id: ingredient.id }, quantity: 1 } as MealIngredient,
      ],
    });

  beforeAll(async () => {
    dataSource = await connectTestDatabase(await createTestDatabase());
    ingredients = new IngredientService(dataSource.getRepository(Ingredient));
  });

  afterAll(() => dataSource.destroy());

  beforeEach(async () => {
    owner = await createUser(dataSource);
    stranger = await createUser(dataSource);
  });

  describe('deleteOne', () => {
    it('deletes an Ingredient no Meal uses', async () => {
      const apple = await createIngredient('Apple', owner);

      await ingredients.deleteOne(apple.id, owner.id);

      expect(
        await dataSource.getRepository(Ingredient).findOneBy({ id: apple.id }),
      ).toBeNull();
    });

    it('409s while Meals use the Ingredient, naming them', async () => {
      const apple = await createIngredient('Apple', owner);
      await createMeal('Fruit salad', apple);
      await createMeal('Apple pie', apple);

      const error = await ingredients.deleteOne(apple.id, owner.id).then(
        () => null,
        (e: unknown) => e,
      );

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as Error).message).toMatch(
        /^This ingredient is used in meals: (Fruit salad, Apple pie|Apple pie, Fruit salad)\.$/,
      );
      expect(
        await dataSource.getRepository(Ingredient).findOneBy({ id: apple.id }),
      ).not.toBeNull();
    });

    it('allows deleting once the Meals using it are deleted', async () => {
      const apple = await createIngredient('Apple', owner);
      const meal = await createMeal('Fruit salad', apple);
      await dataSource.getRepository(Meal).softDelete(meal.id);

      await expect(
        ingredients.deleteOne(apple.id, owner.id),
      ).resolves.toBeUndefined();
    });

    it("404s for someone else's Ingredient", async () => {
      const apple = await createIngredient('Apple', stranger);

      await expect(ingredients.deleteOne(apple.id, owner.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
