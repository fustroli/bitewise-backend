import { validate } from 'class-validator';
import { stubIngredient } from '../entities/index.js';
import { CreateIngredientDto } from './create-ingredient.dto.js';

describe('CreateIngredientDto', () => {
  let dto: CreateIngredientDto;

  beforeEach(() => {
    const stub = stubIngredient();
    dto = Object.assign(new CreateIngredientDto(), stub);
  });

  it('should validate a valid DTO', async () => {
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if name is empty', async () => {
    dto = Object.assign(new CreateIngredientDto(), dto, { name: '' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('should fail if protein is negative', async () => {
    dto = Object.assign(new CreateIngredientDto(), dto, { protein: -14 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('protein');
  });

  it('should fail if totalFat is less than saturatedFat', async () => {
    dto = Object.assign(new CreateIngredientDto(), dto, {
      totalFat: 1,
      saturatedFat: 2,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('IsBiggerThanSaturatedFat');
  });

  it('should fail if calories are negative', async () => {
    dto = Object.assign(new CreateIngredientDto(), dto, {
      calories: -10,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('calories');
  });

  it('should fail if name length is below minimum', async () => {
    dto = Object.assign(new CreateIngredientDto(), dto, {
      name: 'A',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isLength');
  });

  it('should fail if name length exceeds maximum', async () => {
    dto = Object.assign(new CreateIngredientDto(), dto, {
      name: 'A'.repeat(101),
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isLength');
  });

  it('should fail if userId is not provided', async () => {
    dto = Object.assign(new CreateIngredientDto(), dto, {
      userId: null,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('userId');
  });

  it('should fail if price is negative', async () => {
    dto = Object.assign(new CreateIngredientDto(), dto, {
      price: -10,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('price');
  });

  it('should fail if unit is not a proper enum value', async () => {
    dto = Object.assign(new CreateIngredientDto(), dto, {
      unit: '200g',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('unit');
  });

  it('should fail if price is negative', async () => {
    dto = Object.assign(new CreateIngredientDto(), dto, { price: -14 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('price');
  });
});
