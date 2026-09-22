import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';

import { Exclude } from 'class-transformer';
import { Ingredient } from '../../ingredient/entities/index.js';
import { IsEmail } from 'class-validator';
import { Meal } from '../../meal/entities/index.js';
import { NotificationSettings } from './notifications.entity.js';
import { PersonalInformation } from './personal-information.entity.js';
import { SocialProfiles } from './social-profiles.entity.js';

@Entity()
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @IsEmail()
  @Column()
  email: string;

  @OneToMany(() => Ingredient, (ingredient) => ingredient.user)
  ingredients: Relation<Ingredient>[];

  @OneToMany(() => Meal, (meal) => meal.user)
  meals: Relation<Meal>[];

  @Exclude()
  @Column({ default: null })
  refreshToken: string | null;

  @OneToOne(() => PersonalInformation, { cascade: false, eager: true })
  @JoinColumn()
  personalInformation: Relation<PersonalInformation>;

  @OneToOne(() => SocialProfiles, { cascade: false, eager: true })
  @JoinColumn()
  socialProfiles: Relation<SocialProfiles>;

  @OneToOne(() => NotificationSettings, { cascade: false, eager: true })
  @JoinColumn()
  notificationSettings: Relation<NotificationSettings>;

  @Exclude()
  @Column({ nullable: true })
  hash: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  googleId: string;

  @CreateDateColumn()
  createTimeStamp: Date;

  @UpdateDateColumn()
  updateTimeStamp: Date;

  @DeleteDateColumn({ default: null })
  deleteTimeStamp: Date | null;
}
