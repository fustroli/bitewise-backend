import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateIngredientDto, UpdateIngredientDto } from '../dto/index.js';
import { Ingredient } from '../entities/index.js';
import { Meal } from '../../meal/entities/index.js';
import { Repository } from 'typeorm';
import { IPaginated, PaginationDto } from '../../../common/pagination/index.js';
import { OwnedRepository } from '../../../common/ownership/index.js';

@Injectable()
export class IngredientService {
  private readonly ingredients: OwnedRepository<Ingredient>;

  constructor(
    @InjectRepository(Ingredient)
    private readonly repository: Repository<Ingredient>,
  ) {
    this.ingredients = new OwnedRepository(repository, {
      label: 'ingredient',
      sortable: [
        'name',
        'protein',
        'totalFat',
        'saturatedFat',
        'totalCarbohydrates',
        'sugar',
        'dietaryFiber',
        'calories',
        'unit',
        'createTimeStamp',
        'updateTimeStamp',
      ],
    });
  }

  getAll(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<IPaginated<Ingredient>> {
    return this.ingredients.listOwned(userId, paginationDto);
  }

  createOne(data: CreateIngredientDto, userId: number): Promise<Ingredient> {
    return this.ingredients.createOwned(data, userId);
  }

  async updateOne(
    id: number,
    data: UpdateIngredientDto,
    userId: number,
  ): Promise<Ingredient> {
    const ingredient = await this.ingredients.findOwnedOrFail(id, userId);

    return this.repository.save(this.repository.merge(ingredient, data));
  }

  /** 409 while any Meal uses the Ingredient. */
  deleteOne(id: number, userId: number): Promise<void> {
    return this.repository.manager.transaction(async (manager) => {
      await this.ingredients.findOwnedOrFail(id, userId);

      const meals = await manager.find(Meal, {
        where: { mealIngredients: { ingredient: { id } } },
        select: { id: true, name: true },
      });
      if (meals.length)
        throw new ConflictException(
          `This ingredient is used in meals: ${meals.map((m) => m.name).join(', ')}.`,
        );

      await manager.softDelete(Ingredient, id);
    });
  }
}
