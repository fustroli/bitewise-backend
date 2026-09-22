import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Meal } from '../../meal/entities/index.js';
import { MealPlan } from '../../meal-plan/entities/index.js';

@Entity()
export class MealPlanMeal {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => MealPlan, (mealPlan) => mealPlan.mealPlanMeals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'mealPlanId' })
  mealPlan: Relation<MealPlan>;

  @ManyToOne(() => Meal, (meal) => meal.mealPlanMeals)
  @JoinColumn({ name: 'mealId' })
  meal: Relation<Meal>;
}
