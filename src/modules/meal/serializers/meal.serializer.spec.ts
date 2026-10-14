import { stubMeal, stubMealIngredient } from '../entities/index.js';
import { serializeMeal } from './meal.serializer.js';

describe('serializeMeal', () => {
  it('flattens each meal ingredient with its ingredient name and nutrition', () => {
    const meal = stubMeal();
    const [mealIngredient] = meal.mealIngredients;
    const ingredient = mealIngredient.ingredient;

    expect(serializeMeal(meal)).toEqual({
      id: meal.id,
      name: meal.name,
      mealIngredients: [
        {
          id: mealIngredient.id,
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          quantity: mealIngredient.quantity,
          protein: ingredient.protein,
          totalFat: ingredient.totalFat,
          saturatedFat: ingredient.saturatedFat,
          totalCarbohydrates: ingredient.totalCarbohydrates,
          sugar: ingredient.sugar,
          dietaryFiber: ingredient.dietaryFiber,
          calories: ingredient.calories,
          unit: ingredient.unit,
        },
      ],
    });
  });

  it('orders meal ingredients by position, then id', () => {
    const meal = stubMeal();
    const row = (id: number, position: number) => ({
      ...stubMealIngredient(),
      id,
      position,
    });
    meal.mealIngredients = [row(1, 2), row(2, 0), row(4, 1), row(3, 1)];

    expect(serializeMeal(meal).mealIngredients?.map((mi) => mi.id)).toEqual([
      2, 3, 4, 1,
    ]);
  });
});
