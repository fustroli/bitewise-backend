import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OwnedRepository } from '../../../common/ownership/index.js';
import { Ingredient } from '../../ingredient/entities/index.js';
import { Meal } from '../../meal/entities/index.js';
import { MealPlan } from '../../meal-plan/entities/index.js';
import { StatisticsResponseDto } from '../dto/index.js';

/** Dashboard counts of a User's Owned resources. */
@Injectable()
export class StatisticsService {
  private readonly ingredients: OwnedRepository<Ingredient>;
  private readonly meals: OwnedRepository<Meal>;
  private readonly mealPlans: OwnedRepository<MealPlan>;

  constructor(
    @InjectRepository(Ingredient) ingredients: Repository<Ingredient>,
    @InjectRepository(Meal) meals: Repository<Meal>,
    @InjectRepository(MealPlan) mealPlans: Repository<MealPlan>,
  ) {
    // count-only: nothing here is listed, so nothing is sortable
    this.ingredients = new OwnedRepository(ingredients, {
      label: 'ingredient',
      sortable: [],
    });
    this.meals = new OwnedRepository(meals, { label: 'meal', sortable: [] });
    this.mealPlans = new OwnedRepository(mealPlans, {
      label: 'meal plan',
      sortable: [],
    });
  }

  async getStatistics(userId: number): Promise<StatisticsResponseDto> {
    const [ingredients, meals, mealPlans] = await Promise.all([
      this.ingredients.countOwned(userId),
      this.meals.countOwned(userId),
      this.mealPlans.countOwned(userId),
    ]);

    return { ingredients, meals, mealPlans };
  }
}
