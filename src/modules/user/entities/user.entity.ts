import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';

import { Exclude } from 'class-transformer';
import { Ingredient } from '../../ingredient/entities/index.js';
import { IsEmail } from 'class-validator';
import { Meal } from '../../meal/entities/index.js';
import { NotificationSettings } from './notification-settings.embedded.js';
import { PersonalInformation } from './personal-information.embedded.js';
import { SocialProfiles } from './social-profiles.embedded.js';
import { ActiveColumn } from '../../../common/ownership/index.js';

// DuplicateEntryFilter has a 409 message for each of these index names
@Entity()
// Sign-in email is unique among non-deleted Users (ADR-0001)
@Index('UQ_user_active_email', ['activeEmail'], { unique: true })
// Case-insensitive via the default collation; NULLs never collide
@Index('UQ_user_user_name', ['personalInformation.userName'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @IsEmail()
  @Column()
  email: string;

  @Exclude()
  @ActiveColumn('email')
  activeEmail?: string | null;

  @OneToMany(() => Ingredient, (ingredient) => ingredient.user)
  ingredients: Relation<Ingredient>[];

  @OneToMany(() => Meal, (meal) => meal.user)
  meals: Relation<Meal>[];

  @Column(() => PersonalInformation)
  personalInformation: PersonalInformation;

  @Column(() => SocialProfiles)
  socialProfiles: SocialProfiles;

  @Column(() => NotificationSettings)
  notificationSettings: NotificationSettings;

  @Exclude()
  @Column({ nullable: true })
  hash: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatarUrl: string | null;

  @Exclude()
  @Column({ nullable: true })
  googleId: string;

  @Exclude()
  @Column({ nullable: true })
  facebookId: string;

  @CreateDateColumn()
  createTimeStamp: Date;

  @UpdateDateColumn()
  updateTimeStamp: Date;

  @DeleteDateColumn({ default: null })
  deleteTimeStamp: Date | null;
}
