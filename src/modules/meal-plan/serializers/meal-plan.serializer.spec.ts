import { stubMeal } from '../../meal/entities/index.js';
import { serializeMeal } from '../../meal/serializers/index.js';
import { MealPlanMeal, stubMealPlan } from '../entities/index.js';
import { serializeMealPlan } from './meal-plan.serializer.js';

describe('serializeMealPlan', () => {
  it('maps the meal plan with its meals serialized', () => {
    const meal = stubMeal();
    const mealPlan = stubMealPlan();
    mealPlan.mealPlanMeals = [
      { id: 1, mealPlan, meal, position: 0 } as MealPlanMeal,
    ];

    expect(serializeMealPlan(mealPlan)).toEqual({
      id: mealPlan.id,
      name: mealPlan.name,
      meals: [serializeMeal(meal)],
    });
  });

  it('returns an empty meal list when the plan has none', () => {
    expect(serializeMealPlan(stubMealPlan()).meals).toEqual([]);
  });

  it('orders meals by position', () => {
    const mealPlan = stubMealPlan();
    const row = (mealId: number, position: number) =>
      ({
        id: mealId,
        mealPlan,
        meal: { ...stubMeal(), id: mealId },
        position,
      }) as MealPlanMeal;
    mealPlan.mealPlanMeals = [row(1, 1), row(2, 0)];

    expect(serializeMealPlan(mealPlan).meals.map((m) => m.id)).toEqual([2, 1]);
  });
});
