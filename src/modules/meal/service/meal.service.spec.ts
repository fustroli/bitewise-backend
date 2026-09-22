import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateMealDto, UpdateMealDto } from '../dto/index.js';
import { Ingredient, stubIngredient } from '../../ingredient/entities/index.js';
import { Meal, MealIngredient, stubMeal } from '../entities/index.js';

import { MealService } from './index.js';
import { Repository } from 'typeorm';
import { Test } from '@nestjs/testing';
import { User } from '../../user/entities/index.js';
import { UserService } from '../../user/service/index.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { serializeMeal } from '../serializers/meal.serializer.js';

const mealStub = stubMeal();
const mealStubs = [mealStub];

const mealResponseStub = serializeMeal(mealStub);
const mealResponseStubs = [mealResponseStub];

const ingredientStub = stubIngredient();

describe('MealService', () => {
  let service: MealService;
  let repository: Repository<Meal>;
  let userRepository: Repository<User>;
  let ingredientRepository: Repository<Ingredient>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MealService,
        UserService,
        {
          provide: getRepositoryToken(Meal),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
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
      ],
    }).compile();
    service = moduleRef.get<MealService>(MealService);
    repository = moduleRef.get<Repository<Meal>>(getRepositoryToken(Meal));
    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    ingredientRepository = moduleRef.get<Repository<Ingredient>>(
      getRepositoryToken(Ingredient),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all meals for a given user', async () => {
      const userId = mealStub.userId;
      jest.spyOn(repository, 'find').mockResolvedValue(mealStubs);

      const result = await service.getAll(userId);

      expect(result).toEqual(mealResponseStubs);
      expect(repository.find).toHaveBeenCalled();
    });

    it('should return an empty array if no meals are found for the wrong user', async () => {
      const wrongUserId = 123;
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.getAll(wrongUserId);

      expect(result).toEqual([]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { user: { id: wrongUserId } },
        relations: ['mealIngredients'],
      });
    });
  });

  describe('getOne', () => {
    it('should return a meal for a valid meal ID', async () => {
      const mealId = mealStub.id;
      jest.spyOn(repository, 'findOne').mockResolvedValue(mealStub);

      const result = await service.getOne(mealId);

      expect(result).toEqual(serializeMeal(mealStub));
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: mealId },
        relations: ['mealIngredients'],
      });
    });

    it('should throw a NotFoundException for an invalid meal ID', async () => {
      const invalidMealId = 999;
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.getOne(invalidMealId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getOne(invalidMealId)).rejects.toThrow(
        `No meal found with the provided ID.`,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: invalidMealId },
        relations: ['mealIngredients'],
      });
    });
  });

  describe('createOne', () => {
    const newStub: CreateMealDto = {
      ...mealStub,
      mealIngredients: [
        ...mealStub.mealIngredients.map((el, i) => ({
          ...el,
          ingredientId: i + 1,
        })),
      ],
    };

    it('should create a new meal', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mealStub.user);
      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mealStub);
      jest.spyOn(repository, 'create').mockReturnValue(mealStub);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mealStub,
        mealIngredients: [
          { id: 1, ingredient: ingredientStub, meal: mealStub, quantity: 5 },
        ],
      });

      jest
        .spyOn(ingredientRepository, 'findOne')
        .mockResolvedValue(ingredientStub);

      const result = await service.createOne(newStub);

      expect(result).toEqual(mealResponseStub);
      expect(repository.save).toHaveBeenCalledWith(mealStub);
    });

    it('should throw a NotFoundException if user does not exist', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createOne(newStub)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw a ConflictException if meal with the same name already exists', async () => {
      const user = mealStub.user;
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(repository, 'findOne').mockResolvedValue(mealStub);

      await expect(service.createOne(newStub)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateOne', () => {
    const updateStub: UpdateMealDto = {
      ...mealStub,
      mealIngredients: [
        ...mealStub.mealIngredients.map((el, i) => ({
          ...el,
          ingredientId: i + 1,
        })),
      ],
    };
    //TODO:
    // it('should update an existing meal', async () => {
    //   const updatedMeal = {
    //     ...mealStub,
    //     name: 'Updated Meal',
    //     mealIngredients: [
    //       ...mealStub.mealIngredients.map((el, i) => ({
    //         ...el,
    //         ingredientId: i + 1,
    //       })),
    //     ],
    //   };

    //   jest
    //     .spyOn(repository, 'findOne')
    //     .mockResolvedValue(mealStub)
    //     .mockResolvedValueOnce(mealStub)
    //     .mockResolvedValueOnce(null);

    //   jest.spyOn(repository, 'save').mockResolvedValue(updatedMeal);

    //   const result = await service.updateOne(mealStub.userId, updatedMeal);
    //   expect(repository.findOne).toHaveBeenCalledTimes(2);
    //   expect(result).toEqual({
    //     ...mealResponseStub,
    //     name: 'Updated Meal',
    //   });
    //   expect(repository.save).toHaveBeenCalledWith(updatedMeal);
    // });

    it('should throw a NotFoundException if meal does not exist', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.updateOne(mealStub.id, updateStub)).rejects.toThrow(
        NotFoundException,
      );
    });
    //TODO:
    // it('should throw a ConflictException if another meal with the same name already exists', async () => {
    //   jest.spyOn(repository, 'findOne').mockResolvedValue(mealStub);

    //   await expect(service.updateOne(mealStub.id, updateStub)).rejects.toThrow(
    //     ConflictException,
    //   );
    // });
  });

  describe('deleteOne', () => {
    it('should delete an existing meal', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mealStub);
      jest.spyOn(repository, 'softDelete').mockResolvedValue(undefined);
      await service.deleteOne(mealStub.id);
      expect(repository.softDelete).toHaveBeenCalledWith(mealStub.id);
    });
    it('should throw a NotFoundException if meal does not exist', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      await expect(service.deleteOne(mealStub.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
