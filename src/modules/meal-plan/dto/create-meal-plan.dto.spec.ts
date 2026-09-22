import { validate } from 'class-validator';
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
      userId: stubMealPlan().userId,
      mealIds: [1, 2],
    });

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should fail if the meals array is empty', async () => {
    dto = Object.assign(new CreateMealPlanDto(), dto, {
      meals: [],
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints.arrayMinSize).toBeDefined();
  });
});
