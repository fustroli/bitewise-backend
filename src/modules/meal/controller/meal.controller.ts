import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateMealDto,
  MealResponseDto,
  UpdateMealDto,
  PaginatedMealResponseDto,
} from '../dto/index.js';
import { MealService } from '../service/index.js';
import { CurrentUser } from '../../auth/decorators/index.js';
import { IAuthenticatedUser } from '../../auth/interfaces/index.js';
import { serializeMeal } from '../../meal/serializers/index.js';
import {
  mapPaginated,
  PaginationDto,
} from '../../../common/pagination/index.js';

@ApiTags('meal')
@Controller('meal')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @Get(':mealId')
  @ApiOkResponse({ type: MealResponseDto })
  async getOneMeal(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('mealId', ParseIntPipe) mealId: number,
  ): Promise<MealResponseDto> {
    const meal = await this.mealService.getOne(mealId, user.userId);
    return serializeMeal(meal);
  }

  @Get()
  @ApiOkResponse({ type: PaginatedMealResponseDto })
  async getAllMeal(
    @CurrentUser() user: IAuthenticatedUser,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedMealResponseDto> {
    const page = await this.mealService.getAll(user.userId, paginationDto);
    return mapPaginated(page, serializeMeal);
  }

  @Post()
  @ApiOkResponse({ type: MealResponseDto })
  async createMeal(
    @Body() dto: CreateMealDto,
    @CurrentUser() user: IAuthenticatedUser,
  ): Promise<MealResponseDto> {
    const meal = await this.mealService.createOne(dto, user.userId);
    return serializeMeal(meal);
  }

  @Patch(':mealId')
  @ApiOkResponse({ type: MealResponseDto })
  async updateMeal(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('mealId', ParseIntPipe) mealId: number,
    @Body() body: UpdateMealDto,
  ): Promise<MealResponseDto> {
    const meal = await this.mealService.updateOne(mealId, body, user.userId);
    return serializeMeal(meal);
  }

  @Delete(':mealId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMeal(
    @CurrentUser() user: IAuthenticatedUser,
    @Param('mealId', ParseIntPipe) mealId: number,
  ): Promise<void> {
    return this.mealService.deleteOne(mealId, user.userId);
  }
}
