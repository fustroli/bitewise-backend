import { Ingredient, stubIngredient } from '../entities/index.js';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { IngredientController } from './ingredient.controller.js';
import { IngredientService } from '../service/index.js';
import { Repository } from 'typeorm';
import { Test } from '@nestjs/testing';
import { User } from '../../user/entities/index.js';
import { UserService } from '../../user/service/index.js';
import { getRepositoryToken } from '@nestjs/typeorm';

const ingredientResponseStub = stubIngredient();
const ingredientResponseStubs = [ingredientResponseStub];

const ingredientStub = stubIngredient();

describe('IngredientController', () => {
  let controller: IngredientController;
  let service: IngredientService;
  let repository: Repository<Ingredient>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot()],
      controllers: [IngredientController],
      providers: [
        IngredientService,
        UserService,
        {
          provide: getRepositoryToken(Ingredient),
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

    service = moduleRef.get<IngredientService>(IngredientService);
    controller = moduleRef.get<IngredientController>(IngredientController);
    repository = moduleRef.get<Repository<Ingredient>>(
      getRepositoryToken(Ingredient),
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getIngredients', () => {
    it('should return an array of ingredients', async () => {
      jest.spyOn(service, 'getAll').mockResolvedValue(ingredientResponseStubs);
      const result = await controller.getAllIngredient(ingredientStub.userId);

      expect(result).toEqual(ingredientResponseStubs);
    });
  });

  describe('createIngredient', () => {
    it('should create a new ingredient', async () => {
      jest
        .spyOn(service, 'createOne')
        .mockResolvedValue(ingredientResponseStub);

      const result = await controller.createIngredient(ingredientStub);

      expect(result).toEqual(ingredientResponseStub);
    });
  });

  describe('updateIngredient', () => {
    it('should update an existing ingredient', async () => {
      jest
        .spyOn(service, 'updateOne')
        .mockResolvedValue(ingredientResponseStub);
      const result = await controller.updateIngredient(
        ingredientStub.id,
        ingredientStub,
      );

      expect(result).toEqual(ingredientResponseStub);
    });
  });

  describe('deleteIngredient', () => {
    it('should delete an existing ingredient', async () => {
      jest.spyOn(service, 'deleteOne').mockResolvedValue(undefined);

      const result = await controller.deleteIngredient(ingredientStub.id);

      expect(result).toBeUndefined();
    });
  });
});
