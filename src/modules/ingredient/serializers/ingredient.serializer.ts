import { IngredientOptionDto, IngredientResponseDto } from '../dto/index.js';
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
    unit: ingredient.unit,
    userId: ingredient.userId,
    createTimeStamp: ingredient.createTimeStamp,
    updateTimeStamp: ingredient.updateTimeStamp,
    deleteTimeStamp: ingredient.deleteTimeStamp,
  };
}

export function serializeIngredientOption({
  id,
  name,
  unit,
}: Ingredient): IngredientOptionDto {
  return { id, name, unit };
}
