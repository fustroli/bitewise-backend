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
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateMealPlanDto,
  MealPlanResponseDto,
  PaginatedMealPlanResponseDto,
  UpdateMealPlanDto,
} from '../dto/index.js';
import { MealPlanService } from '../service/index.js';
import { CurrentUser } from '../../auth/decorators/index.js';
import { IAuthenticatedUser } from '../../auth/interfaces/index.js';
import { serializeMealPlan } from '../serializers/index.js';
import {
  mapPaginated,
  PaginationDto,
} from '../../../common/pagination/index.js';

@ApiTags('meal-plan')
@Controller('meal-plan')
export class MealPlanController {
  constructor(private readonly mealPlanService: MealPlanService) {}

  @Get(':mealPlanId')
  @ApiOkResponse({ type: MealPlanResponseDto })
  async getOneMealPlan(
    @Param('mealPlanId') mealPlanId: number,
    @CurrentUser() user: IAuthenticatedUser,
  ) {
    const mealPlan = await this.mealPlanService.getOne(mealPlanId, user.userId);
    return serializeMealPlan(mealPlan);
  }

  @Get()
  @ApiOkResponse({ type: PaginatedMealPlanResponseDto })
  async getAllMealPlan(
    @CurrentUser() user: IAuthenticatedUser,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedMealPlanResponseDto> {
    const page = await this.mealPlanService.getAll(user.userId, paginationDto);
    return mapPaginated(page, serializeMealPlan);
  }

  @Post()
  @ApiOkResponse({ type: MealPlanResponseDto })
  async createMealPlan(
    @Body() dto: CreateMealPlanDto,
    @CurrentUser() user: IAuthenticatedUser,
  ) {
    const mealPlan = await this.mealPlanService.createOne(dto, user.userId);
    return serializeMealPlan(mealPlan);
  }

  @Patch(':mealPlanId')
  @ApiOkResponse({ type: MealPlanResponseDto })
  async updateMealPlan(
    @Param('mealPlanId') mealPlanId: number,
    @Body() body: UpdateMealPlanDto,
    @CurrentUser() user: IAuthenticatedUser,
  ) {
    const mealPlan = await this.mealPlanService.updateOne(
      mealPlanId,
      body,
      user.userId,
    );
    return serializeMealPlan(mealPlan);
  }

  @Delete(':mealPlanId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMealPlan(
    @Param('mealPlanId') mealPlanId: number,
    @CurrentUser() user: IAuthenticatedUser,
  ): Promise<void> {
    return this.mealPlanService.deleteOne(mealPlanId, user.userId);
  }
}
