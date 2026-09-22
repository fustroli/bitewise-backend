import { Meal, MealIngredient, stubMeal } from '../entities/index.js';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { CreateMealDto } from '../dto/index.js';
import { Ingredient } from '../../ingredient/entities/index.js';
import { MealController } from './meal.controller.js';
import { MealService } from '../service/index.js';
import { Repository } from 'typeorm';
import { Test } from '@nestjs/testing';
import { User } from '../../user/entities/index.js';
import { UserService } from '../../user/service/index.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { serializeMeal } from '../serializers/meal.serializer.js';

const mealStub = stubMeal();
const mealResponseStub = serializeMeal(mealStub);
const mealResponseStubs = [mealResponseStub];

describe('MealController', () => {
  let controller: MealController;
  let service: MealService;
  let repository: Repository<Meal>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot()],
      controllers: [MealController],
      providers: [
        MealService,
        UserService,
        {
          provide: getRepositoryToken(Meal),
          useValue: jest.fn(),
        },
        {
          provide: getRepositoryToken(Ingredient),
          useValue: jest.fn(),
        },
        {
          provide: getRepositoryToken(MealIngredient),
          useValue: jest.fn(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: jest.fn(),
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true }) // Mock the ThrottlerGuard
      .compile();

    service = moduleRef.get<MealService>(MealService);
    controller = moduleRef.get<MealController>(MealController);
    repository = moduleRef.get<Repository<Meal>>(getRepositoryToken(Meal));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMeals', () => {
    it('should return an array of meals', async () => {
      jest.spyOn(service, 'getAll').mockResolvedValue(mealResponseStubs);
      const result = await controller.getAllMeal(mealStub.userId);

      expect(result).toEqual(mealResponseStubs);
    });
  });

  describe('getOneMeal', () => {
    it('should return a meal', async () => {
      jest.spyOn(service, 'getOne').mockResolvedValue(mealResponseStub);
      const result = await controller.getOneMeal(mealStub.userId);

      expect(result).toEqual(mealResponseStub);
    });
  });

  describe('createMeal', () => {
    it('should create a new meal', async () => {
      jest.spyOn(service, 'createOne').mockResolvedValue(mealResponseStub);

      const newStub: CreateMealDto = {
        ...mealStub,
        mealIngredients: [
          ...mealStub.mealIngredients.map((el, i) => ({
            ...el,
            ingredientId: i + 1,
          })),
        ],
      };
      const result = await controller.createMeal(newStub);

      expect(result).toEqual(mealResponseStub);
    });
  });

  describe('updateMeal', () => {
    it('should update an existing meal', async () => {
      jest.spyOn(service, 'updateOne').mockResolvedValue(mealResponseStub);

      const newStub: CreateMealDto = {
        ...mealStub,
        mealIngredients: [
          ...mealStub.mealIngredients.map((el, i) => ({
            ...el,
            ingredientId: i,
          })),
        ],
      };

      const result = await controller.updateMeal(mealStub.id, newStub);

      expect(result).toEqual(mealResponseStub);
    });
  });

  describe('deleteMeal', () => {
    it('should delete an existing meal', async () => {
      jest.spyOn(service, 'deleteOne').mockResolvedValue(undefined);

      const result = await controller.deleteMeal(mealStub.id);

      expect(result).toBeUndefined();
    });
  });
});
