import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtGuard } from '../../auth/guard/index.js';
import {
  CreateMealDto,
  MealResponseDto,
  UpdateMealDto,
  PaginatedMealResponseDto,
} from '../dto/index.js';
import { MealService } from '../service/index.js';
import { CurrentUser } from '../../auth/decorators/index.js';
import { User } from '../../user/entities/index.js';
import { serializeMeal } from '../../meal/serializers/index.js';
import { PaginationDto } from '../../../common/pagination/pagination.dto.js';

@ApiTags('meal')
@UseGuards(JwtGuard, ThrottlerGuard)
@Controller('meal')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @Get(':mealId')
  @ApiOkResponse({ type: MealResponseDto })
  async getOneMeal(
    @CurrentUser() user: User,
    @Param('mealId') mealId: number,
  ): Promise<MealResponseDto> {
    const meal = await this.mealService.getOne(mealId, user.id);
    return serializeMeal(meal);
  }

  @Get()
  @ApiOkResponse({ type: [PaginatedMealResponseDto] })
  async getAllMeal(
    @CurrentUser() user: User,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedMealResponseDto> {
    const mealsData = await this.mealService.getAll(user.id, paginationDto);
    const serializedMeals = mealsData.data.map((meal) => serializeMeal(meal));
    return { data: serializedMeals, count: mealsData.count };
  }

  @Post()
  @ApiOkResponse({ type: MealResponseDto })
  async createMeal(@Body() dto: CreateMealDto): Promise<MealResponseDto> {
    const meal = await this.mealService.createOne(dto);
    return serializeMeal(meal);
  }

  @Patch(':mealId')
  @ApiOkResponse({ type: MealResponseDto })
  async updateMeal(
    @CurrentUser() user: User,
    @Param('mealId') mealId: number,
    @Body() body: UpdateMealDto,
  ): Promise<MealResponseDto> {
    const meal = await this.mealService.updateOne(mealId, body, user.id);
    return serializeMeal(meal);
  }

  @Delete(':mealId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMeal(
    @CurrentUser() user: User,
    @Param('mealId') mealId: number,
  ): Promise<void> {
    return this.mealService.deleteOne(mealId, user.id);
  }
}
