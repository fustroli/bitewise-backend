import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../../user/service/index.js';
import { MealPlan, MealPlanMeal } from '../entities/index.js';
import { CreateMealPlanDto, UpdateMealPlanDto } from '../dto/index.js';
import { MealService } from '../../meal/service/index.js';
import { MEAL_PLAN_RELATIONS } from '../constants/index.js';
import { PaginationDto } from '../../../common/pagination/pagination.dto.js';
import { createQueryObject } from '../../../common/pagination/helpers/index.js';

@Injectable()
export class MealPlanService {
  constructor(
    @InjectRepository(MealPlan)
    private readonly repository: Repository<MealPlan>,
    private readonly userService: UserService,
    private readonly mealService: MealService,
  ) {}

  async getOne(mealPlanId: number, userId: number) {
    const mealPlan = await this.repository.findOne({
      where: { id: mealPlanId },
      relations: MEAL_PLAN_RELATIONS,
    });
    if (!mealPlan) {
      throw new NotFoundException(`No meal plan found with the provided ID.`);
    }

    await this.checkMealPlanOwner(mealPlan, userId);

    return mealPlan;
  }

  async getAll(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<{ data: MealPlan[]; count: number }> {
    const { order, take, skip } = createQueryObject(paginationDto);

    const [data, count] = await this.repository.findAndCount({
      where: { user: { id: userId } },
      relations: MEAL_PLAN_RELATIONS,
      take,
      skip,
      ...(order && { order }),
    });

    return {
      data,
      count,
    };
  }

  async createOne(data: CreateMealPlanDto): Promise<MealPlan> {
    const user = await this.userService.validateUser(data.userId);

    const meals = await this.mealService.findMealsByIds(user.id, data.mealIds);
    const mealPlan = this.repository.create({
      name: data.name,
      user: user,
    });

    mealPlan.mealPlanMeals = data.mealIds.map((mealId) => {
      const meal = meals.find((m) => m.id === mealId);
      if (!meal) {
        throw new NotFoundException(`Meal with ID ${mealId} not found.`);
      }
      const mealPlanMeal = new MealPlanMeal();
      mealPlanMeal.mealPlan = mealPlan;
      mealPlanMeal.meal = meal;
      return mealPlanMeal;
    });

    const savedMealPlan = await this.repository.save(mealPlan);

    return savedMealPlan;
  }

  async updateOne(
    id: number,
    data: UpdateMealPlanDto,
    userId: number,
  ): Promise<MealPlan> {
    const currentMealPlan = await this.getCurrentMealPlan(id);

    await this.checkMealPlanOwner(currentMealPlan, userId);

    const user = await this.userService.validateUser(data.userId);

    const meals = await this.mealService.findMealsByIds(user.id, data.mealIds);

    const mealPlanMeals = meals.map((meal) => {
      const mealPlanMeal = new MealPlanMeal();
      mealPlanMeal.mealPlan = currentMealPlan;
      mealPlanMeal.meal = meal;
      return mealPlanMeal;
    });
    const updatedMealPlan: MealPlan = {
      ...currentMealPlan,
      ...data,
      mealPlanMeals,
    };

    const savedMealPlan = await this.repository.save(updatedMealPlan);

    return savedMealPlan;
  }

  async deleteOne(id: number, userId: number): Promise<void> {
    try {
      const currentMealPlan = await this.getCurrentMealPlan(id);

      await this.checkMealPlanOwner(currentMealPlan, userId);
      await this.repository.softDelete(id);
    } catch (error) {
      throw error;
    }
  }

  async getCurrentMealPlan(id: number) {
    const currentMealPlan = await this.repository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!currentMealPlan) {
      throw new NotFoundException('No meal plan found with the provided id.');
    }

    return currentMealPlan;
  }

  private async checkMealPlanOwner(mealPlan: MealPlan, userId: number) {
    if (mealPlan.user.id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to access this meal plan.',
      );
    }
  }
}
