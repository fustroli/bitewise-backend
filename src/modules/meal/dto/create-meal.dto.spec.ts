import { validate } from 'class-validator';
import { stubMeal } from '../entities/index.js';
import { CreateMealDto } from './create-meal.dto.js';
import { plainToInstance } from 'class-transformer';

describe('CreateMealDto', () => {
  let dto: CreateMealDto;

  beforeEach(() => {
    const stub = stubMeal();
    dto = Object.assign(new CreateMealDto(), stub);
  });

  it('should validate a valid DTO', async () => {
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should fail if name is empty', async () => {
    dto = Object.assign(new CreateMealDto(), dto, { name: '' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('should fail if name length is below minimum', async () => {
    dto = Object.assign(new CreateMealDto(), dto, {
      name: 'A',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isLength');
  });

  it('should fail if name length exceeds maximum', async () => {
    dto = Object.assign(new CreateMealDto(), dto, {
      name: 'A'.repeat(101),
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isLength');
  });

  it('should fail if the mealIngredients array is empty', async () => {
    dto = Object.assign(new CreateMealDto(), dto, {
      mealIngredients: [],
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints.arrayMinSize).toBeDefined();
  });

  it('should fail if any mealIngredient is invalid', async () => {
    dto = plainToInstance(CreateMealDto, {
      ...stubMeal(),
      mealIngredients: [
        { ingredientId: 1, quantity: 200 },
        { ingredientId: null, quantity: null },
      ],
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toBeUndefined();
    expect(errors[0].children.length).toBeGreaterThan(0);
  });
});
