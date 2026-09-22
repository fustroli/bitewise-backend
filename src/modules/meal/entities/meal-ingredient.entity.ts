import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Meal } from './meal.entity.js';
import { Ingredient } from '../../ingredient/entities/index.js';
import { decimalTransformer } from '../../../common/transformers/index.js';

@Entity()
export class MealIngredient {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Meal, (meal) => meal.mealIngredients)
  @JoinColumn({ name: 'mealId' })
  meal: Relation<Meal>;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.mealIngredients)
  @JoinColumn({ name: 'ingredientId' })
  ingredient: Relation<Ingredient>;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  quantity: number;
}
