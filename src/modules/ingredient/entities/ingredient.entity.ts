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

import { EUnit } from '../enum/index.js';
import { MealIngredient } from '../../meal/entities/index.js';
import { User } from '../../user/entities/index.js';
import { decimalTransformer } from '../../../common/transformers/index.js';

@Entity()
export class Ingredient {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: decimalTransformer,
  })
  protein: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: decimalTransformer,
  })
  totalFat: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: decimalTransformer,
  })
  saturatedFat: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: decimalTransformer,
  })
  totalCarbohydrates: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: decimalTransformer,
  })
  sugar: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: decimalTransformer,
  })
  dietaryFiber: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: decimalTransformer,
  })
  calories: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  price: number;

  @Column({ type: 'enum', enum: EUnit, enumName: 'EUnit' })
  unit: EUnit;

  @OneToMany(
    () => MealIngredient,
    (mealIngredient) => mealIngredient.ingredient,
  )
  mealIngredients: Relation<MealIngredient>[];

  @ManyToOne(() => User, (user) => user.ingredients)
  @JoinColumn()
  user: Relation<User>;

  @RelationId((ingredient: Ingredient) => ingredient.user)
  userId: number;

  @CreateDateColumn()
  createTimeStamp: Date;

  @UpdateDateColumn()
  updateTimeStamp: Date;

  @DeleteDateColumn({ default: null })
  deleteTimeStamp: Date | null;
}
