import { DataSource } from 'typeorm';
import {
  connectTestDatabase,
  createTestDatabase,
  createUser,
} from '../../../../test/int/test-database.js';
import { Ingredient } from '../../ingredient/entities/index.js';
import { EUnit } from '../../ingredient/enum/index.js';
import { Meal } from '../../meal/entities/index.js';
import { MealPlan } from '../../meal-plan/entities/index.js';
import { User } from '../entities/index.js';
import { StatisticsService } from './statistics.service.js';

describe('StatisticsService', () => {
  let dataSource: DataSource;
  let statistics: StatisticsService;
  let owner: User;
  let stranger: User;

  // each saves one row per name for `ownerId`, returning the ids
  const createIngredients = async (ownerId: number, ...names: string[]) =>
    (
      await dataSource.getRepository(Ingredient).save(
        names.map((name) => ({
          name,
          protein: 1,
          totalFat: 1,
          saturatedFat: 0,
          totalCarbohydrates: 1,
          sugar: 0,
          dietaryFiber: 0,
          calories: 10,
          unit: EUnit.HUNDRED_GRAMS,
          user: { id: ownerId },
        })),
      )
    ).map(({ id }) => id);
  const createMeals = async (ownerId: number, ...names: string[]) =>
    (
      await dataSource
        .getRepository(Meal)
        .save(names.map((name) => ({ name, user: { id: ownerId } })))
    ).map(({ id }) => id);
  const createMealPlans = async (ownerId: number, ...names: string[]) =>
    (
      await dataSource
        .getRepository(MealPlan)
        .save(names.map((name) => ({ name, user: { id: ownerId } })))
    ).map(({ id }) => id);

  beforeAll(async () => {
    dataSource = await connectTestDatabase(await createTestDatabase());
    statistics = new StatisticsService(
      dataSource.getRepository(Ingredient),
      dataSource.getRepository(Meal),
      dataSource.getRepository(MealPlan),
    );
  });

  afterAll(() => dataSource.destroy());

  beforeEach(async () => {
    owner = await createUser(dataSource);
    stranger = await createUser(dataSource);
  });

  it('returns zeros for a User with nothing', async () => {
    await expect(statistics.getStatistics(owner.id)).resolves.toEqual({
      ingredients: 0,
      meals: 0,
      mealPlans: 0,
    });
  });

  it("counts the User's resources", async () => {
    await createIngredients(owner.id, 'Apple', 'Pear', 'Plum');
    await createMeals(owner.id, 'Breakfast', 'Lunch');
    await createMealPlans(owner.id, 'Week 1');

    await expect(statistics.getStatistics(owner.id)).resolves.toEqual({
      ingredients: 3,
      meals: 2,
      mealPlans: 1,
    });
  });

  it("does not count another User's resources", async () => {
    await createIngredients(owner.id, 'Apple');
    await createIngredients(stranger.id, 'Apple', 'Pear');
    await createMeals(stranger.id, 'Breakfast');
    await createMealPlans(stranger.id, 'Week 1');

    await expect(statistics.getStatistics(owner.id)).resolves.toEqual({
      ingredients: 1,
      meals: 0,
      mealPlans: 0,
    });
  });

  it('does not count soft-deleted resources', async () => {
    const [, deletedIngredient] = await createIngredients(
      owner.id,
      'Apple',
      'Pear',
    );
    const [deletedMeal] = await createMeals(owner.id, 'Breakfast', 'Lunch');
    const [deletedMealPlan] = await createMealPlans(owner.id, 'Week 1');
    await dataSource.getRepository(Ingredient).softDelete(deletedIngredient);
    await dataSource.getRepository(Meal).softDelete(deletedMeal);
    await dataSource.getRepository(MealPlan).softDelete(deletedMealPlan);

    await expect(statistics.getStatistics(owner.id)).resolves.toEqual({
      ingredients: 1,
      meals: 1,
      mealPlans: 0,
    });
  });
});
