import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Repository } from 'typeorm';
import {
  CreateMealDto,
  IngredientQuantityDto,
  UpdateMealDto,
} from '../dto/index.js';
import { Meal, MealIngredient } from '../entities/index.js';
import { Ingredient } from '../../ingredient/entities/index.js';
import { MEAL_RELATIONS } from '../constants/index.js';
import { IPaginated, PaginationDto } from '../../../common/pagination/index.js';
import { OwnedRepository } from '../../../common/ownership/index.js';

@Injectable()
export class MealService {
  private readonly meals: OwnedRepository<Meal>;
  private readonly ingredients: OwnedRepository<Ingredient>;

  constructor(
    @InjectRepository(Meal)
    private readonly repository: Repository<Meal>,
    @InjectRepository(Ingredient)
    ingredientRepository: Repository<Ingredient>,
    @InjectRepository(MealIngredient)
    private readonly mealIngredientRepository: Repository<MealIngredient>,
  ) {
    this.meals = new OwnedRepository(repository, {
      label: 'meal',
      relations: MEAL_RELATIONS,
      sortable: ['name', 'createTimeStamp', 'updateTimeStamp'],
    });
    this.ingredients = new OwnedRepository(ingredientRepository, {
      label: 'ingredient',
      sortable: [],
    });
  }

  getOne(mealId: number, userId: number): Promise<Meal> {
    return this.meals.findOwnedOrFail(mealId, userId);
  }

  getAll(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<IPaginated<Meal>> {
    return this.meals.listOwned(userId, paginationDto);
  }

  async createOne(data: CreateMealDto, userId: number): Promise<Meal> {
    const mealIngredients = await this.toMealIngredients(
      data.mealIngredients,
      userId,
    );

    return this.meals.createOwned({ name: data.name, mealIngredients }, userId);
  }

  async updateOne(
    id: number,
    data: UpdateMealDto,
    userId: number,
  ): Promise<Meal> {
    const meal = await this.meals.findOwnedOrFail(id, userId, {});

    if (data.name !== undefined) meal.name = data.name;

    if (data.mealIngredients) {
      const mealIngredients = await this.toMealIngredients(
        data.mealIngredients,
        userId,
      );
      await this.mealIngredientRepository.delete({ meal: { id } });
      meal.mealIngredients = mealIngredients as MealIngredient[];
    }

    await this.repository.save(meal);

    return this.meals.findOwnedOrFail(id, userId);
  }

  deleteOne(id: number, userId: number): Promise<void> {
    return this.meals.softDeleteOwned(id, userId);
  }

  async findMealsByIds(userId: number, ids: number[]): Promise<Meal[]> {
    return this.repository.find({
      where: { id: In(ids), user: { id: userId } },
      relations: MEAL_RELATIONS,
    });
  }

  // Only the Owner's own Ingredients may be used; any other id is a 404
  private async toMealIngredients(
    items: IngredientQuantityDto[],
    userId: number,
  ): Promise<DeepPartial<MealIngredient>[]> {
    await this.ingredients.findManyOwned(
      items.map((item) => item.ingredientId),
      userId,
    );

    return items.map(({ ingredientId, quantity }) => ({
      ingredient: { id: ingredientId },
      quantity,
    }));
  }
}
