import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  CreateMealDto,
  IngredientQuantityDto,
  UpdateMealDto,
} from '../dto/index.js';
import { Meal, MealIngredient } from '../entities/index.js';
import { Ingredient } from '../../ingredient/entities/index.js';
import { MealPlan } from '../../meal-plan/entities/index.js';
import { MEAL_RELATIONS } from '../constants/index.js';
import { IPaginated, PaginationDto } from '../../../common/pagination/index.js';
import { OwnedRepository } from '../../../common/ownership/index.js';

// Owner-scoped repositories bound to one EntityManager (a transaction's, or the default)
function ownedIn(manager: EntityManager) {
  return {
    meals: new OwnedRepository(manager.getRepository(Meal), {
      label: 'meal',
      relations: MEAL_RELATIONS,
      sortable: ['name', 'createTimeStamp', 'updateTimeStamp'],
    }),
    ingredients: new OwnedRepository(manager.getRepository(Ingredient), {
      label: 'ingredient',
      sortable: [],
    }),
  };
}

@Injectable()
export class MealService {
  private readonly meals: OwnedRepository<Meal>;

  constructor(
    @InjectRepository(Meal)
    private readonly repository: Repository<Meal>,
  ) {
    this.meals = ownedIn(repository.manager).meals;
  }

  getOne(mealId: number, userId: number): Promise<Meal> {
    return this.meals.findOwnedOrFail(mealId, userId);
  }

  getAll(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<IPaginated<Meal>> {
    return this.meals.listOwned(userId, paginationDto);
  }

  createOne(data: CreateMealDto, userId: number): Promise<Meal> {
    return this.repository.manager.transaction(async (manager) => {
      const { meals, ingredients } = ownedIn(manager);
      const mealIngredients = await this.compose(
        manager,
        ingredients,
        [],
        data.mealIngredients,
        userId,
      );

      return meals.createOwned({ name: data.name, mealIngredients }, userId);
    });
  }

  updateOne(id: number, data: UpdateMealDto, userId: number): Promise<Meal> {
    return this.repository.manager.transaction(async (manager) => {
      const { meals, ingredients } = ownedIn(manager);
      const meal = await meals.findOwnedOrFail(id, userId, {
        mealIngredients: { ingredient: true },
      });

      if (data.name !== undefined) meal.name = data.name;
      if (data.mealIngredients)
        meal.mealIngredients = await this.compose(
          manager,
          ingredients,
          meal.mealIngredients,
          data.mealIngredients,
          userId,
        );

      await manager.save(meal);
      return meals.findOwnedOrFail(id, userId);
    });
  }

  /** 409 while any Meal plan contains the Meal. */
  deleteOne(id: number, userId: number): Promise<void> {
    return this.repository.manager.transaction(async (manager) => {
      await ownedIn(manager).meals.findOwnedOrFail(id, userId, {});

      const mealPlans = await manager.find(MealPlan, {
        where: { mealPlanMeals: { meal: { id } } },
        select: { id: true, name: true },
      });
      if (mealPlans.length)
        throw new ConflictException(
          `This meal is in meal plans: ${mealPlans.map((p) => p.name).join(', ')}.`,
        );

      await manager.softDelete(Meal, id);
    });
  }

  /**
   * The Meal's new set of Meal ingredients: distinct, owned Ingredients
   * (any other id is a 404), positioned in the given order. Rows for
   * Ingredients already in the Meal are reused; rows left out are deleted on
   * save (orphanedRowAction).
   */
  private async compose(
    manager: EntityManager,
    ingredients: OwnedRepository<Ingredient>,
    current: MealIngredient[],
    items: IngredientQuantityDto[],
    userId: number,
  ): Promise<MealIngredient[]> {
    const ids = items.map((item) => item.ingredientId);
    if (new Set(ids).size !== ids.length)
      throw new BadRequestException(
        'Each ingredient may appear only once in a meal',
      );

    await ingredients.findManyOwned(ids, userId);

    const existing = new Map(
      current.map((row) => [row.ingredient?.id, row] as const),
    );
    return items.map(({ ingredientId, quantity }, position) =>
      Object.assign(
        existing.get(ingredientId) ??
          manager.create(MealIngredient, { ingredient: { id: ingredientId } }),
        { quantity, position },
      ),
    );
  }
}
