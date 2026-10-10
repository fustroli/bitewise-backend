import { stubMeal } from '../../meal/entities/index.js';
import { serializeMeal } from '../../meal/serializers/index.js';
import { MealPlanMeal, stubMealPlan } from '../entities/index.js';
import { serializeMealPlan } from './meal-plan.serializer.js';

describe('serializeMealPlan', () => {
  it('maps the meal plan with its meals serialized', () => {
    const meal = stubMeal();
    const mealPlan = stubMealPlan();
    mealPlan.mealPlanMeals = [{ id: 1, mealPlan, meal } as MealPlanMeal];

    expect(serializeMealPlan(mealPlan)).toEqual({
      id: mealPlan.id,
      name: mealPlan.name,
      meals: [serializeMeal(meal)],
    });
  });

  it('returns an empty meal list when the plan has none', () => {
    expect(serializeMealPlan(stubMealPlan()).meals).toEqual([]);
  });
});
