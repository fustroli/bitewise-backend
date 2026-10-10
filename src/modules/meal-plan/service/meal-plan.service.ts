import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { MealPlan, MealPlanMeal } from '../entities/index.js';
import { CreateMealPlanDto, UpdateMealPlanDto } from '../dto/index.js';
import { Meal } from '../../meal/entities/index.js';
import { MEAL_PLAN_RELATIONS } from '../constants/index.js';
import { IPaginated, PaginationDto } from '../../../common/pagination/index.js';
import { OwnedRepository } from '../../../common/ownership/index.js';

@Injectable()
export class MealPlanService {
  private readonly mealPlans: OwnedRepository<MealPlan>;
  private readonly meals: OwnedRepository<Meal>;

  constructor(
    @InjectRepository(MealPlan)
    private readonly repository: Repository<MealPlan>,
    @InjectRepository(Meal)
    mealRepository: Repository<Meal>,
    @InjectRepository(MealPlanMeal)
    private readonly mealPlanMealRepository: Repository<MealPlanMeal>,
  ) {
    this.mealPlans = new OwnedRepository(repository, {
      label: 'meal plan',
      relations: MEAL_PLAN_RELATIONS,
      sortable: ['name', 'createTimeStamp', 'updateTimeStamp'],
    });
    this.meals = new OwnedRepository(mealRepository, {
      label: 'meal',
      sortable: [],
    });
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

  async createOne(data: CreateMealPlanDto, userId: number): Promise<MealPlan> {
    const mealPlanMeals = await this.toMealPlanMeals(data.mealIds, userId);

    return this.mealPlans.createOwned(
      { name: data.name, mealPlanMeals },
      userId,
    );
  }

  async updateOne(
    id: number,
    data: UpdateMealPlanDto,
    userId: number,
  ): Promise<MealPlan> {
    const mealPlan = await this.mealPlans.findOwnedOrFail(id, userId, {});

    if (data.name !== undefined) mealPlan.name = data.name;

    if (data.mealIds) {
      const mealPlanMeals = await this.toMealPlanMeals(data.mealIds, userId);
      await this.mealPlanMealRepository.delete({ mealPlan: { id } });
      mealPlan.mealPlanMeals = mealPlanMeals as MealPlanMeal[];
    }

    await this.repository.save(mealPlan);

    return this.mealPlans.findOwnedOrFail(id, userId);
  }

  deleteOne(id: number, userId: number): Promise<void> {
    return this.mealPlans.softDeleteOwned(id, userId);
  }

  // Only the Owner's own Meals may be planned; any other id is a 404
  private async toMealPlanMeals(
    mealIds: number[],
    userId: number,
  ): Promise<DeepPartial<MealPlanMeal>[]> {
    await this.meals.findManyOwned(mealIds, userId);

    return mealIds.map((mealId) => ({ meal: { id: mealId } }));
  }
}
