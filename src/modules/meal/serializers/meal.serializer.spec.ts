import { stubMeal } from '../entities/index.js';
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
});
