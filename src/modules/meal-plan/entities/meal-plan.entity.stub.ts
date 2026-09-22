import { MealPlan } from './index.js';
import { stubUser } from '../../user/entities/index.js';

export function stubMealPlan(): MealPlan {
  return {
    id: 1,
    mealPlanMeals: [],
    user: stubUser(),
    name: 'Breakfast Meal Plan',
    userId: stubUser().id,
    createTimeStamp: new Date(),
    updateTimeStamp: new Date(),
    deleteTimeStamp: null,
  };
}
