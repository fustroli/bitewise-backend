import { MealPlan } from '../entities/meal-plan.entity.js';
import { serializeMeal } from '../../meal/serializers/index.js';
import { MealPlanResponseDto } from '../dto/index.js';

export function serializeMealPlan(mealPlan: MealPlan): MealPlanResponseDto {
  return {
    id: mealPlan?.id,
    name: mealPlan?.name,
    meals:
      mealPlan?.mealPlanMeals?.map((mealPlanMeal) =>
        serializeMeal(mealPlanMeal.meal),
      ) || [],
  };
}
