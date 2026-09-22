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
import { JwtGuard } from '../../auth/guard/index.js';
import { ThrottlerGuard } from '@nestjs/throttler';
import { IngredientService } from '../service/index.js';
import {
  CreateIngredientDto,
  IngredientResponseDto,
  UpdateIngredientDto,
  PaginatedIngredientDto,
} from '../dto/index.js';
import { CurrentUser } from '../../auth/decorators/index.js';
import { User } from '../../user/entities/index.js';
import { plainToClass } from 'class-transformer';
import { PaginationDto } from '../../../common/pagination/pagination.dto.js';

@ApiTags('ingredient')
@UseGuards(JwtGuard, ThrottlerGuard)
@Controller('ingredient')
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @Get()
  @ApiOkResponse({ type: PaginatedIngredientDto })
  getAllIngredient(
    @CurrentUser() user: User,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedIngredientDto> {
    return this.ingredientService.getAll(user.id, paginationDto);
  }

  @Post()
  @ApiOkResponse({ type: IngredientResponseDto })
  async createIngredient(
    @Body() dto: CreateIngredientDto,
  ): Promise<IngredientResponseDto> {
    const ingredient = await this.ingredientService.createOne(dto);
    return plainToClass(IngredientResponseDto, ingredient);
  }

  @Patch(':ingredientId')
  @ApiOkResponse({ type: IngredientResponseDto })
  async updateIngredient(
    @Param('ingredientId') ingredientId: number,
    @Body() body: UpdateIngredientDto,
    @CurrentUser() user: User,
  ): Promise<IngredientResponseDto> {
    const ingredient = await this.ingredientService.updateOne(
      ingredientId,
      body,
      user.id,
    );
    return plainToClass(IngredientResponseDto, ingredient);
  }

  @Delete(':ingredientId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteIngredient(
    @Param('ingredientId') ingredientId: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.ingredientService.deleteOne(ingredientId, user.id);
  }
}
