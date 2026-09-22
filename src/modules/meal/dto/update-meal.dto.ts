import { PartialType } from '@nestjs/mapped-types';
import { CreateMealDto } from './create-meal.dto.js';

export class UpdateMealDto extends PartialType(CreateMealDto) {}
