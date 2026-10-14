import { MealPlan } from '../entities/meal-plan.entity.js';
import { serializeMeal } from '../../meal/serializers/index.js';
import { MealPlanResponseDto } from '../dto/index.js';
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
