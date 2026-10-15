import { MealPlan } from '../entities/meal-plan.entity.js';
import { serializeMeal } from '../../meal/serializers/index.js';
import { MealPlanOptionDto, MealPlanResponseDto } from '../dto/index.js';
import { byPosition } from '../../../common/ordering/index.js';

export function serializeMealPlan(mealPlan: MealPlan): MealPlanResponseDto {
  return {
    id: mealPlan?.id,
    name: mealPlan?.name,
    meals:
      mealPlan?.mealPlanMeals
        ?.toSorted(byPosition)
        .map((mealPlanMeal) => serializeMeal(mealPlanMeal.meal)) || [],
  };
}

export function serializeMealPlanOption(mealPlan: MealPlan): MealPlanOptionDto {
  return {
    id: mealPlan.id,
    name: mealPlan.name,
    mealIds: mealPlan.mealPlanMeals
      .toSorted(byPosition)
      .map((mealPlanMeal) => mealPlanMeal.meal.id),
  };
}
