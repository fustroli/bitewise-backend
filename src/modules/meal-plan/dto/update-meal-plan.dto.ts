import { PartialType } from '@nestjs/mapped-types';
import { CreateMealPlanDto } from './create-meal-plan.dto.js';

export class UpdateMealPlanDto extends PartialType(CreateMealPlanDto) {}
