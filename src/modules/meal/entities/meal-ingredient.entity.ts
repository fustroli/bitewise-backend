import {
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { Meal } from './meal.entity.js';
import { Ingredient } from '../../ingredient/entities/index.js';
import { decimalTransformer } from '../../../common/transformers/index.js';

// An Ingredient appears at most once per Meal
@Entity()
@Index('UQ_meal_ingredient_meal_ingredient', ['meal', 'ingredient'], {
  unique: true,
})
export class MealIngredient {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // Rows dropped from Meal.mealIngredients on save are deleted, not nullified
  @ManyToOne(() => Meal, (meal) => meal.mealIngredients, {
    orphanedRowAction: 'delete',
  })
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
