import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateIngredientDto,
  PaginatedIngredientDto,
  UpdateIngredientDto,
} from '../dto/index.js';
import { Ingredient } from '../entities/index.js';
import { Repository } from 'typeorm';
import { UserService } from '../../user/service/index.js';
import { PaginationDto } from '../../../common/pagination/pagination.dto.js';
import { createQueryObject } from '../../../common/pagination/helpers/index.js';

@Injectable()
export class IngredientService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly repository: Repository<Ingredient>,
    private readonly userService: UserService,
  ) {}

  async getAll(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedIngredientDto> {
    const { order, take, skip } = createQueryObject(paginationDto);

    const [data, count] = await this.repository.findAndCount({
      where: { user: { id: userId } },
      take,
      skip,
      ...(order && { order }),
    });

    return {
      data,
      count,
    };
  }

  async createOne(data: CreateIngredientDto): Promise<Ingredient> {
    const user = await this.userService.validateUser(data.userId);

    await this.checkIfIngredientExists(data);

    const ingredient = this.repository.create({ ...data, user });

    const savedIngredient = await this.repository.save(ingredient);

    return savedIngredient;
  }

  async updateOne(
    id: number,
    data: UpdateIngredientDto,
    userId: number,
  ): Promise<Ingredient> {
    const currentIngredient = await this.getCurrentIngredient(id);

    await this.checkIngredientOwner(currentIngredient, userId);

    if (currentIngredient.name !== data.name) {
      await this.checkIfIngredientExists({
        ...data,
        userId: currentIngredient.userId,
      } as CreateIngredientDto);
    }

    const updatedIngredient = {
      ...currentIngredient,
      ...data,
    };

    const savedIngredient = this.repository.save(updatedIngredient);
    return savedIngredient;
  }

  async deleteOne(id: number, userId: number) {
    try {
      const ingredient = await this.getCurrentIngredient(id);

      await this.checkIngredientOwner(ingredient, userId);

      await this.repository.softDelete(id);
    } catch (error) {
      throw error;
    }
  }

  async checkIfIngredientExists(data: CreateIngredientDto) {
    const existingIngredient = await this.repository.findOne({
      where: {
        name: data.name,
        user: { id: data.userId },
      },
    });

    if (existingIngredient) {
      throw new ConflictException(
        `You already have a meal with the same name.`,
      );
    }
    return existingIngredient;
  }

  async getCurrentIngredient(id: number) {
    const currentIngredient = await this.repository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!currentIngredient) {
      throw new NotFoundException('No ingredient found with the provided id.');
    }

    return currentIngredient;
  }

  private async checkIngredientOwner(ingredient: Ingredient, userId: number) {
    if (ingredient.user.id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to access this ingredient.',
      );
    }
  }
}
