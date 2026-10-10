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
  CreateMealPlanDto,
  MealPlanResponseDto,
  PaginatedMealPlanResponseDto,
  UpdateMealPlanDto,
} from '../dto/index.js';
import { MealPlanService } from '../service/index.js';
import { CurrentUser } from '../../auth/decorators/index.js';
import { User } from '../../user/entities/index.js';
import { serializeMealPlan } from '../serializers/index.js';
import {
  mapPaginated,
  PaginationDto,
} from '../../../common/pagination/index.js';

@ApiTags('meal-plan')
@UseGuards(JwtGuard, ThrottlerGuard)
@Controller('meal-plan')
export class MealPlanController {
  constructor(private readonly mealPlanService: MealPlanService) {}

  @Get(':mealPlanId')
  @ApiOkResponse({ type: MealPlanResponseDto })
  async getOneMealPlan(
    @Param('mealPlanId') mealPlanId: number,
    @CurrentUser() user: User,
  ) {
    const mealPlan = await this.mealPlanService.getOne(mealPlanId, user.id);
    return serializeMealPlan(mealPlan);
  }

  @Get()
  @ApiOkResponse({ type: PaginatedMealPlanResponseDto })
  async getAllMealPlan(
    @CurrentUser() user: User,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedMealPlanResponseDto> {
    const page = await this.mealPlanService.getAll(user.id, paginationDto);
    return mapPaginated(page, serializeMealPlan);
  }

  @Post()
  @ApiOkResponse({ type: MealPlanResponseDto })
  async createMealPlan(
    @Body() dto: CreateMealPlanDto,
    @CurrentUser() user: User,
  ) {
    const mealPlan = await this.mealPlanService.createOne(dto, user.id);
    return serializeMealPlan(mealPlan);
  }

  @Patch(':mealPlanId')
  @ApiOkResponse({ type: MealPlanResponseDto })
  async updateMealPlan(
    @Param('mealPlanId') mealPlanId: number,
    @Body() body: UpdateMealPlanDto,
    @CurrentUser() user: User,
  ) {
    const mealPlan = await this.mealPlanService.updateOne(
      mealPlanId,
      body,
      user.id,
    );
    return serializeMealPlan(mealPlan);
  }

  @Delete(':mealPlanId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMealPlan(
    @Param('mealPlanId') mealPlanId: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.mealPlanService.deleteOne(mealPlanId, user.id);
  }
}
