import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Meal } from '../../meal/entities/index.js';
import { MealPlan } from '../../meal-plan/entities/index.js';

// A Meal appears at most once per Meal plan
@Entity()
@Index('UQ_meal_plan_meal_meal_plan_meal', ['mealPlan', 'meal'], {
  unique: true,
})
export class MealPlanMeal {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // Rows dropped from MealPlan.mealPlanMeals on save are deleted, not nullified
  @ManyToOne(() => MealPlan, (mealPlan) => mealPlan.mealPlanMeals, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'mealPlanId' })
  mealPlan: Relation<MealPlan>;

  @ManyToOne(() => Meal, (meal) => meal.mealPlanMeals)
  @JoinColumn({ name: 'mealId' })
  meal: Relation<Meal>;

  // 0-based place in the Meal plan's Meals, as last sent by the client
  @Column({ default: 0 })
  position: number;
}
