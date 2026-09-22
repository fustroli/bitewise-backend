import { MealIngredientResponseDto, MealResponseDto } from '../dto/index.js';
import { Meal } from '../entities/meal.entity.js';
import { MealIngredient } from '../entities/index.js';

export function serializeMeal(meal: Meal): MealResponseDto {
  return {
    id: meal?.id,
    name: meal?.name,
    mealIngredients: meal?.mealIngredients?.map((mealIngredient) =>
      serializeMealIngredient(mealIngredient),
    ),
  };
}

export function serializeMealIngredient(
  mealIngredient: MealIngredient,
): MealIngredientResponseDto {
  return {
    id: mealIngredient?.id,
    ingredientId: mealIngredient?.ingredient?.id,
    ingredientName: mealIngredient?.ingredient?.name,
    quantity: mealIngredient?.quantity,
    protein: mealIngredient?.ingredient?.protein,
    totalFat: mealIngredient?.ingredient?.totalFat,
    saturatedFat: mealIngredient?.ingredient?.saturatedFat,
    totalCarbohydrates: mealIngredient?.ingredient?.totalCarbohydrates,
    sugar: mealIngredient?.ingredient?.sugar,
    dietaryFiber: mealIngredient?.ingredient?.dietaryFiber,
    calories: mealIngredient?.ingredient?.calories,
    price: mealIngredient?.ingredient?.price,
    unit: mealIngredient?.ingredient?.unit,
  };
}
