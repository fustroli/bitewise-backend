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
import { IngredientService } from '../service/index.js';
import {
  CreateIngredientDto,
  IngredientResponseDto,
  UpdateIngredientDto,
  PaginatedIngredientDto,
} from '../dto/index.js';
import { CurrentUser } from '../../auth/decorators/index.js';
import { IAuthenticatedUser } from '../../auth/interfaces/index.js';
import {
  mapPaginated,
  PaginationDto,
} from '../../../common/pagination/index.js';
import { serializeIngredient } from '../serializers/index.js';

@ApiTags('ingredient')
@Controller('ingredient')
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @Get()
  @ApiOkResponse({ type: PaginatedIngredientDto })
  async getAllIngredient(
    @CurrentUser() user: IAuthenticatedUser,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedIngredientDto> {
    const page = await this.ingredientService.getAll(
      user.userId,
      paginationDto,
    );
    return mapPaginated(page, serializeIngredient);
  }

  @Post()
  @ApiOkResponse({ type: IngredientResponseDto })
  async createIngredient(
    @Body() dto: CreateIngredientDto,
    @CurrentUser() user: IAuthenticatedUser,
  ): Promise<IngredientResponseDto> {
    const ingredient = await this.ingredientService.createOne(dto, user.userId);
    return serializeIngredient(ingredient);
  }

  @Patch(':ingredientId')
  @ApiOkResponse({ type: IngredientResponseDto })
  async updateIngredient(
    @Param('ingredientId', ParseIntPipe) ingredientId: number,
    @Body() body: UpdateIngredientDto,
    @CurrentUser() user: IAuthenticatedUser,
  ): Promise<IngredientResponseDto> {
    const ingredient = await this.ingredientService.updateOne(
      ingredientId,
      body,
      user.userId,
    );
    return serializeIngredient(ingredient);
  }

  @Delete(':ingredientId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteIngredient(
    @Param('ingredientId', ParseIntPipe) ingredientId: number,
    @CurrentUser() user: IAuthenticatedUser,
  ): Promise<void> {
    return this.ingredientService.deleteOne(ingredientId, user.userId);
  }
}
