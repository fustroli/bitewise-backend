import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateIngredientDto, UpdateIngredientDto } from '../dto/index.js';
import { Ingredient } from '../entities/index.js';
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
        'price',
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

  deleteOne(id: number, userId: number): Promise<void> {
    return this.ingredients.softDeleteOwned(id, userId);
  }
}
