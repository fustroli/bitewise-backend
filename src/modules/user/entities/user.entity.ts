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
import { BodyStats } from './body-stats.embedded.js';
import { PersonalInformation } from './personal-information.embedded.js';
import { SocialProfiles } from './social-profiles.embedded.js';
import { ActiveColumn } from '../../../common/ownership/index.js';

// DuplicateEntryFilter has a 409 message for each of these index names
@Entity()
// Sign-in email is unique among non-deleted Users (ADR-0001)
@Index('UQ_user_active_email', ['activeEmail'], { unique: true })
// One Google identity per non-deleted User; also indexes the social sign-in lookup
@Index('UQ_user_active_google_id', ['activeGoogleId'], { unique: true })
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

  // Proven by an Email verification link or a provider-verified Google email
  @Column({ default: false })
  emailVerified: boolean;

  @OneToMany(() => Ingredient, (ingredient) => ingredient.user)
  ingredients: Relation<Ingredient>[];

  @OneToMany(() => Meal, (meal) => meal.user)
  meals: Relation<Meal>[];

  @Column(() => PersonalInformation)
  personalInformation: PersonalInformation;

  @Column(() => SocialProfiles)
  socialProfiles: SocialProfiles;

  @Column(() => BodyStats)
  bodyStats: BodyStats;

  // bcrypt hash; null for a User who can only sign in with Google
  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true })
  hash: string | null;

  // Object key in the FileStore; the response's avatarUrl is built from it
  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true })
  avatarKey: string | null;

  @Exclude()
  @Column({ nullable: true })
  googleId: string;

  @Exclude()
  @ActiveColumn('googleId')
  activeGoogleId?: string | null;

  @CreateDateColumn()
  createTimeStamp: Date;

  @UpdateDateColumn()
  updateTimeStamp: Date;

  @DeleteDateColumn({ default: null })
  deleteTimeStamp: Date | null;
}
