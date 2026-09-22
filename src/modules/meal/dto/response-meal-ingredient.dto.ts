import { EUnit } from '../../ingredient/enum/index.js';

export class MealIngredientResponseDto {
  id: number;
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  protein: number;
  totalFat: number;
  saturatedFat: number;
  totalCarbohydrates: number;
  sugar: number;
  dietaryFiber: number;
  calories: number;
  price: number;
  unit: EUnit;
}
