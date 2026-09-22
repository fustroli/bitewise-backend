import { EUnit } from '../enum/index.js';
import { Ingredient } from '../entities/index.js';
import { stubUser } from '../../user/entities/index.js';

export function stubIngredient(override: Partial<Ingredient> = {}): Ingredient {
  return {
    id: 1,
    name: 'Apple',
    protein: 0.3,
    totalFat: 0.2,
    saturatedFat: 0.03,
    totalCarbohydrates: 25,
    sugar: 19,
    dietaryFiber: 4.4,
    calories: 95,
    mealIngredients: [],
    user: stubUser(),
    userId: stubUser().id,
    price: 15,
    unit: EUnit.HUNDRED_GRAMS,
    createTimeStamp: new Date(),
    updateTimeStamp: new Date(),
    deleteTimeStamp: null,
    ...override,
  };
}
