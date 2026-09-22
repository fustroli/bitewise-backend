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

import { MealPlanMeal } from './meal-plan-meal.entity.js';
import { User } from '../../user/entities/index.js';

@Entity()
export class MealPlan {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @OneToMany(() => MealPlanMeal, (mealPlanMeal) => mealPlanMeal.mealPlan, {
    cascade: true,
  })
  mealPlanMeals: Relation<MealPlanMeal>[];

  @Column()
  name: string;

  @ManyToOne(() => User, (user) => user.meals)
  @JoinColumn()
  user: Relation<User>;

  @RelationId((mealPlan: MealPlan) => mealPlan.user)
  userId: number;

  @CreateDateColumn()
  createTimeStamp: Date;

  @UpdateDateColumn()
  updateTimeStamp: Date;

  @DeleteDateColumn({ default: null })
  deleteTimeStamp: Date | null;
}
