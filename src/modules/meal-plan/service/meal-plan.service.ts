import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { MealPlan, MealPlanMeal } from '../entities/index.js';
import { CreateMealPlanDto, UpdateMealPlanDto } from '../dto/index.js';
import { Meal } from '../../meal/entities/index.js';
import { MEAL_PLAN_RELATIONS } from '../constants/index.js';
import { IPaginated, PaginationDto } from '../../../common/pagination/index.js';
import { OwnedRepository } from '../../../common/ownership/index.js';

// Owner-scoped repositories bound to one EntityManager (a transaction's, or the default)
function ownedIn(manager: EntityManager) {
  return {
    mealPlans: new OwnedRepository(manager.getRepository(MealPlan), {
      label: 'meal plan',
      relations: MEAL_PLAN_RELATIONS,
      // avoid one 4-level join multiplying rows per page
      relationLoadStrategy: 'query',
      sortable: ['name', 'createTimeStamp', 'updateTimeStamp'],
    }),
    meals: new OwnedRepository(manager.getRepository(Meal), {
      label: 'meal',
      sortable: [],
    }),
  };
}

@Injectable()
export class MealPlanService {
  private readonly mealPlans: OwnedRepository<MealPlan>;

  constructor(
    @InjectRepository(MealPlan)
    private readonly repository: Repository<MealPlan>,
  ) {
    this.mealPlans = ownedIn(repository.manager).mealPlans;
  }

  getOne(mealPlanId: number, userId: number): Promise<MealPlan> {
    return this.mealPlans.findOwnedOrFail(mealPlanId, userId);
  }

  getAll(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<IPaginated<MealPlan>> {
    return this.mealPlans.listOwned(userId, paginationDto);
  }

  createOne(data: CreateMealPlanDto, userId: number): Promise<MealPlan> {
    return this.repository.manager.transaction(async (manager) => {
      const { mealPlans, meals } = ownedIn(manager);
      const mealPlanMeals = await this.compose(
        manager,
        meals,
        [],
        data.mealIds,
        userId,
      );

      return mealPlans.createOwned({ name: data.name, mealPlanMeals }, userId);
    });
  }

  updateOne(
    id: number,
    data: UpdateMealPlanDto,
    userId: number,
  ): Promise<MealPlan> {
    return this.repository.manager.transaction(async (manager) => {
      const { mealPlans, meals } = ownedIn(manager);
      const mealPlan = await mealPlans.findOwnedOrFail(id, userId, {
        mealPlanMeals: { meal: true },
      });

      if (data.name !== undefined) mealPlan.name = data.name;
      if (data.mealIds)
        mealPlan.mealPlanMeals = await this.compose(
          manager,
          meals,
          mealPlan.mealPlanMeals,
          data.mealIds,
          userId,
        );

      await manager.save(mealPlan);
      return mealPlans.findOwnedOrFail(id, userId);
    });
  }

  deleteOne(id: number, userId: number): Promise<void> {
    return this.mealPlans.softDeleteOwned(id, userId);
  }

  /**
   * The Meal plan's new set of Meals: distinct, owned Meals (any other id is
   * a 404), positioned in the given order. Rows for Meals already in the plan
   * are reused; rows left out are deleted on save (orphanedRowAction).
   */
  private async compose(
    manager: EntityManager,
    meals: OwnedRepository<Meal>,
    current: MealPlanMeal[],
    mealIds: number[],
    userId: number,
  ): Promise<MealPlanMeal[]> {
    if (new Set(mealIds).size !== mealIds.length)
      throw new BadRequestException(
        'Each meal may appear only once in a meal plan',
      );

    await meals.findManyOwned(mealIds, userId);

    const existing = new Map(
      current.map((row) => [row.meal?.id, row] as const),
    );
    return mealIds.map((mealId, position) =>
      Object.assign(
        existing.get(mealId) ??
          manager.create(MealPlanMeal, { meal: { id: mealId } }),
        { position },
      ),
    );
  }
}
