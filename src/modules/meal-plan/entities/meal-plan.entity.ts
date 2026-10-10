import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
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
import {
  ActiveNameColumn,
  activeNameIndexName,
} from '../../../common/ownership/index.js';

@Entity()
@Index(activeNameIndexName('meal plan'), ['user', 'activeName'], {
  unique: true,
})
export class MealPlan {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @OneToMany(() => MealPlanMeal, (mealPlanMeal) => mealPlanMeal.mealPlan, {
    cascade: true,
  })
  mealPlanMeals: Relation<MealPlanMeal>[];

  @Column()
  name: string;

  @ActiveNameColumn()
  activeName?: string | null;

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
