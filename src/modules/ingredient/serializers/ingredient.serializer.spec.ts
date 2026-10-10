import { stubIngredient } from '../entities/index.js';
import { serializeIngredient } from './ingredient.serializer.js';

describe('serializeIngredient', () => {
  it('maps the ingredient fields', () => {
    const ingredient = stubIngredient();

    expect(serializeIngredient(ingredient)).toEqual({
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
    });
  });

  it('does not expose the owner', () => {
    expect(serializeIngredient(stubIngredient())).not.toHaveProperty('user');
  });
});
