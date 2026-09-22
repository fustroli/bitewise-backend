import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateMealPlanDto, UpdateMealPlanDto } from '../dto/index.js';
import { Ingredient, stubIngredient } from '../../ingredient/entities/index.js';
import { Meal, MealIngredient, stubMeal } from '../../meal/entities/index.js';
import { MealPlan, stubMealPlan } from '../entities/index.js';

import { MealPlanService } from './index.js';
import { MealService } from '../../meal/service/index.js';
import { Repository } from 'typeorm';
import { Test } from '@nestjs/testing';
import { User } from '../../user/entities/index.js';
import { UserService } from '../../user/service/index.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { serializeMealPlan } from '../serializers/meal-plan.serializer.js';

const mealPlanStub = stubMealPlan();
const mealPlanStubs = [mealPlanStub];

const mealPlanResponseStub = serializeMealPlan(mealPlanStub);
const mealPlanResponseStubs = [mealPlanResponseStub];

const ingredientStub = stubIngredient();
const mealStub = stubMeal();

describe('MealPlanService', () => {
  let service: MealPlanService;
  let repository: Repository<MealPlan>;
  let userRepository: Repository<User>;
  let ingredientRepository: Repository<Ingredient>;
  let mealRepository: Repository<Meal>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MealPlanService,
        UserService,
        MealService,
        {
          provide: getRepositoryToken(MealPlan),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
            findMealsByIds: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Ingredient),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(MealIngredient),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Meal),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();
    service = moduleRef.get<MealPlanService>(MealPlanService);
    repository = moduleRef.get<Repository<MealPlan>>(
      getRepositoryToken(MealPlan),
    );
    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    mealRepository = moduleRef.get<Repository<Meal>>(getRepositoryToken(Meal));
    ingredientRepository = moduleRef.get<Repository<Ingredient>>(
      getRepositoryToken(Ingredient),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all mealPlans for a given user', async () => {
      const userId = mealPlanStub.userId;
      jest.spyOn(repository, 'find').mockResolvedValue(mealPlanStubs);

      const result = await service.getAll(userId);

      expect(result).toEqual(mealPlanResponseStubs);
      expect(repository.find).toHaveBeenCalled();
    });

    it('should return an empty array if no mealPlans are found for the wrong user', async () => {
      const wrongUserId = 123;
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.getAll(wrongUserId);

      expect(result).toEqual([]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { user: { id: wrongUserId } },
        relations: ['meals', 'meals.mealIngredients'],
      });
    });
  });

  describe('getOne', () => {
    it('should return a meal plan for a valid meal plan ID', async () => {
      const mealPlanId = mealPlanStub.id;
      jest.spyOn(repository, 'findOne').mockResolvedValue(mealPlanStub);

      const result = await service.getOne(mealPlanId);

      expect(result).toEqual(serializeMealPlan(mealPlanStub));
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mealPlanId },
        relations: ['meals', 'meals.mealIngredients'],
      });
    });

    it('should throw a NotFoundException for an invalid meal plan ID', async () => {
      const invalidMealPlanId = 999;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.getOne(invalidMealPlanId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getOne(invalidMealPlanId)).rejects.toThrow(
        `No meal plan found with the provided ID.`,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: invalidMealPlanId },
        relations: ['meals', 'meals.mealIngredients'],
      });
    });
  });

  describe('createOne', () => {
    const newStub: CreateMealPlanDto = {
      ...mealPlanStub,
      mealIds: [1],
    };

    it('should create a new mealPlan', async () => {
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(mealPlanStub.user);
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mealPlanStub);
      jest.spyOn(mealRepository, 'find').mockResolvedValue([stubMeal()]);
      jest.spyOn(repository, 'create').mockReturnValue(mealPlanStub);
      jest.spyOn(repository, 'save').mockResolvedValue(mealPlanStub);
      jest
        .spyOn(ingredientRepository, 'findOne')
        .mockResolvedValue(ingredientStub);

      const result = await service.createOne(newStub);

      expect(result).toEqual(mealPlanResponseStub);
      expect(repository.save).toHaveBeenCalledWith(mealPlanStub);
    });

    it('should throw a NotFoundException if user does not exist', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createOne(newStub)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateOne', () => {
    const updatedMealPlan: MealPlan = {
      ...mealPlanStub,
      meals: [mealStub],
    };
    // it('should update an existing mealPlan', async () => {
    //   jest
    //     .spyOn(userRepository, 'findOne')
    //     .mockResolvedValue(mealPlanStub.user);

    //   jest
    //     .spyOn(repository, 'findOne')
    //     .mockResolvedValueOnce(mealPlanStub)
    //     .mockResolvedValueOnce(null);

    //   jest.spyOn(repository, 'save').mockResolvedValue(updatedMealPlan);

    //   const result = await service.updateOne(
    //     mealPlanStub.userId,
    //     updatedMealPlan,
    //   );

    //   expect(repository.findOne).toHaveBeenCalledTimes(1);
    //   expect(repository.findOne).toHaveBeenCalledWith({
    //     where: { id: mealPlanStub.id, userId: mealPlanStub.userId },
    //   });
    //   expect(repository.save).toHaveBeenCalledWith(updatedMealPlan);
    //   expect(result).toEqual({
    //     ...mealPlanResponseStub,
    //   });
    // });

    it('should throw a NotFoundException if mealPlan does not exist', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateOne(mealPlanStub.id, updatedMealPlan),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteOne', () => {
    it('should delete an existing mealPlan', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mealPlanStub);
      jest.spyOn(repository, 'softDelete').mockResolvedValue(undefined);
      await service.deleteOne(mealPlanStub.id);
      expect(repository.softDelete).toHaveBeenCalledWith(mealPlanStub.id);
    });
    it('should throw a NotFoundException if mealPlan does not exist', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      await expect(service.deleteOne(mealPlanStub.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
