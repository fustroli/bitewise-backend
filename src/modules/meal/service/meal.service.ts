import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateMealDto,
  IngredientQuantityDto,
  UpdateMealDto,
} from '../dto/index.js';
import { Meal, MealIngredient } from '../entities/index.js';
import { In, Repository } from 'typeorm';
import { Ingredient } from '../../ingredient/entities/index.js';
import { UserService } from '../../user/service/index.js';
import { MEAL_RELATIONS } from '../constants/index.js';
import { PaginationDto } from '../../../common/pagination/pagination.dto.js';
import { createQueryObject } from '../../../common/pagination/helpers/index.js';

@Injectable()
export class MealService {
  constructor(
    @InjectRepository(Meal)
    private readonly repository: Repository<Meal>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(MealIngredient)
    private readonly mealIngredientRepository: Repository<MealIngredient>,
    private readonly userService: UserService,
  ) {}

  async getOne(mealId: number, userId: number): Promise<Meal> {
    const meal = await this.repository.findOne({
      where: { id: mealId },
      relations: MEAL_RELATIONS,
    });

    if (!meal) {
      throw new NotFoundException(`No meal found with the provided ID.`);
    }

    await this.checkMealOwner(meal, userId);

    return meal;
  }

  async getAll(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<{ data: Meal[]; count: number }> {
    const { order, take, skip } = createQueryObject(paginationDto);

    const [data, count] = await this.repository.findAndCount({
      where: { user: { id: userId } },
      relations: MEAL_RELATIONS,
      take,
      skip,
      ...(order && { order }),
    });

    return {
      data,
      count,
    };
  }

  async createOne(data: CreateMealDto): Promise<Meal> {
    const user = await this.userService.validateUser(data.userId);

    await this.checkIfMealExists(data);

    const meal = this.repository.create({
      name: data.name,
      user: user,
      mealIngredients: [],
    });

    for (const mealIngredientDto of data.mealIngredients) {
      await this.addMealIngredient(meal, mealIngredientDto);
    }

    const savedMeal = await this.repository.save(meal);

    return savedMeal;
  }

  async updateOne(
    id: number,
    data: UpdateMealDto,
    userId: number,
  ): Promise<Meal> {
    const currentMeal = await this.getCurrentMeal(id);

    await this.checkMealOwner(currentMeal, userId);

    const updatedMeal: Meal = {
      ...currentMeal,
      ...data,
      mealIngredients: [],
    };

    const existingMealIngredients = await this.mealIngredientRepository.find({
      where: { meal: { id: currentMeal.id } },
    });

    for (const mealIngredient of existingMealIngredients) {
      await this.mealIngredientRepository.remove(mealIngredient);
    }

    for (const mealIngredientDto of data.mealIngredients) {
      await this.addMealIngredient(updatedMeal, mealIngredientDto);
    }

    const savedMeal = await this.repository.save(updatedMeal);

    return savedMeal;
  }

  async deleteOne(id: number, userId: number) {
    try {
      const currentMeal = await this.getCurrentMeal(id);

      await this.checkMealOwner(currentMeal, userId);

      await this.repository.softDelete(id);
    } catch (error) {
      throw error;
    }
  }

  async checkIfMealExists(data: CreateMealDto) {
    const existingMeal = await this.repository.findOne({
      where: {
        name: data.name,
        user: { id: data.userId },
      },
    });

    if (existingMeal) {
      throw new ConflictException(
        `You already have a meal with the same name.`,
      );
    }
    return existingMeal;
  }

  async addMealIngredient(
    meal: Meal,
    mealIngredientDto: IngredientQuantityDto,
  ): Promise<void> {
    const ingredient = await this.ingredientRepository.findOne({
      where: { id: mealIngredientDto.ingredientId },
    });

    if (!ingredient) {
      throw new NotFoundException(
        `Ingredient with id ${mealIngredientDto.ingredientId} not found`,
      );
    }

    const mealIngredient = new MealIngredient();
    mealIngredient.meal = meal;
    mealIngredient.ingredient = ingredient;
    mealIngredient.quantity = mealIngredientDto.quantity;

    meal.mealIngredients.push(mealIngredient);
  }

  async getCurrentMeal(id: number) {
    const currentMeal = await this.repository.findOne({
      where: { id },
      relations: { user: true, mealIngredients: true },
    });
    if (!currentMeal) {
      throw new NotFoundException('No meal found with the provided id.');
    }

    return currentMeal;
  }

  async findMealsByIds(userId: number, ids: number[]): Promise<Meal[]> {
    const meals = await this.repository.find({
      where: {
        id: In(ids),
        user: { id: userId },
      },
      relations: MEAL_RELATIONS,
    });

    return meals;
  }

  private async checkMealOwner(meal: Meal, userId: number) {
    if (meal.user.id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to access this meal.',
      );
    }
  }
}
