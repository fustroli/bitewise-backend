import { validate } from 'class-validator';
import { MAX_LENGTH } from '../../../utils/constants.js';
import { stubMealPlan } from '../entities/index.js';
import { CreateMealPlanDto } from './create-meal-plan.dto.js';

describe('CreateMealPlanDto', () => {
  let dto: CreateMealPlanDto;

  beforeEach(() => {
    const stub = stubMealPlan();
    dto = Object.assign(new CreateMealPlanDto(), stub);
  });

  it('should validate a valid DTO', async () => {
    dto = Object.assign(new CreateMealPlanDto(), {
      name: 'Breakfast Meal Plan',
      mealIds: [1, 2],
    });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should fail if name length is below minimum', async () => {
    dto = Object.assign(new CreateMealPlanDto(), {
      name: 'A',
      mealIds: [1],
    });

    const errors = await validate(dto);
    expect(errors[0].constraints).toHaveProperty('isLength');
  });

  it('should accept a name of maximum length', async () => {
    dto = Object.assign(new CreateMealPlanDto(), {
      name: 'A'.repeat(MAX_LENGTH),
      mealIds: [1],
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if name length exceeds maximum', async () => {
    dto = Object.assign(new CreateMealPlanDto(), {
      name: 'A'.repeat(MAX_LENGTH + 1),
      mealIds: [1],
    });

    const errors = await validate(dto);
    expect(errors[0].constraints).toHaveProperty('isLength');
  });

  it('should fail if the meals array is empty', async () => {
    dto = Object.assign(new CreateMealPlanDto(), dto, {
      meals: [],
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints.arrayMinSize).toBeDefined();
  });

  it('should fail if a meal appears twice', async () => {
    dto = Object.assign(new CreateMealPlanDto(), {
      name: 'Monday',
      mealIds: [1, 1],
    });

    const errors = await validate(dto);
    expect(errors[0].constraints.arrayUnique).toBeDefined();
  });

  it('should fail if a meal id is not an integer', async () => {
    dto = Object.assign(new CreateMealPlanDto(), {
      name: 'Monday',
      mealIds: ['1'],
    });

    const errors = await validate(dto);
    expect(errors[0].constraints.isInt).toBeDefined();
  });
});
