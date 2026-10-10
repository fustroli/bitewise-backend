import { IngredientResponseDto } from '../dto/index.js';
import { Ingredient } from '../entities/index.js';

export function serializeIngredient(
  ingredient: Ingredient,
): IngredientResponseDto {
  return {
    id: ingredient.id,
    name: ingredient.name,
    protein: ingredient.protein,
    totalFat: ingredient.totalFat,
    saturatedFat: ingredient.saturatedFat,
    totalCarbohydrates: ingredient.totalCarbohydrates,
    sugar: ingredient.sugar,
    dietaryFiber: ingredient.dietaryFiber,
    calories: ingredient.calories,
    price: ingredient.price,
    unit: ingredient.unit,
    userId: ingredient.userId,
    createTimeStamp: ingredient.createTimeStamp,
    updateTimeStamp: ingredient.updateTimeStamp,
    deleteTimeStamp: ingredient.deleteTimeStamp,
  };
}
