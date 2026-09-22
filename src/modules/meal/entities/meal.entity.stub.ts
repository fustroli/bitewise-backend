import { Meal, MealIngredient } from '../entities/index.js';

import { stubIngredient } from '../../ingredient/entities/index.js';
import { stubUser } from '../../user/entities/index.js';

export function stubMeal(): Meal {
  return {
    id: 1,
    name: 'Fruit Salad',
    mealIngredients: [stubMealIngredient()],
    mealPlanMeals: [],
    user: stubUser(),
    userId: stubUser().id,
    createTimeStamp: new Date(),
    updateTimeStamp: new Date(),
    deleteTimeStamp: null,
  };
}

export function stubMealIngredient(): MealIngredient {
  return {
    id: 1,
    meal: { id: 1 } as Meal,
    ingredient: stubIngredient(),
    quantity: 5,
  };
}
