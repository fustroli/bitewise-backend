import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';

import { MealIngredient } from '../../meal/entities/meal-ingredient.entity.js';
import { MealPlanMeal } from '../../meal-plan/entities/index.js';
import { User } from '../../user/entities/index.js';

@Entity()
export class Meal {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  name: string;

  @OneToMany(() => MealIngredient, (mealIngredient) => mealIngredient.meal, {
    cascade: true,
  })
  mealIngredients: Relation<MealIngredient>[];

  @OneToMany(() => MealPlanMeal, (mealPlanMeal) => mealPlanMeal.meal)
  mealPlanMeals: Relation<MealPlanMeal>[];

  @ManyToOne(() => User, (user) => user.meals)
  @JoinColumn()
  user: Relation<User>;

  @RelationId((meal: Meal) => meal.user)
  userId: number;

  @CreateDateColumn()
  createTimeStamp: Date;

  @UpdateDateColumn()
  updateTimeStamp: Date;

  @DeleteDateColumn({ default: null })
  deleteTimeStamp: Date | null;
}
