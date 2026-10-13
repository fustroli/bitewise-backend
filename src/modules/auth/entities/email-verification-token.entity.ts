import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';

import { ETokenPurpose } from '../enum/index.js';
import { User } from '../../user/entities/index.js';

/**
 * A single-use link token mailed to a User. Only its hash is stored. See
 * **Email verification** in CONTEXT.md.
 */
@Entity()
@Index('UQ_email_verification_token_hash', ['tokenHash'], { unique: true })
// The expired-token cleanup deletes by expiresAt
@Index('IDX_email_verification_token_expires_at', ['expiresAt'])
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  user: Relation<User>;

  @Column({ type: 'varchar', length: 32 })
  purpose: ETokenPurpose;

  // SHA-256 (hex) of the token in the link
  @Column({ type: 'char', length: 64 })
  tokenHash: string;

  @Column()
  expiresAt: Date;

  @Column({ type: 'datetime', nullable: true })
  usedAt: Date | null;

  // EMAIL_CHANGE only: the address being changed to
  @Column({ type: 'varchar', length: 255, nullable: true })
  newEmail: string | null;

  // EMAIL_CHANGE only: the requesting Session, kept when the change is confirmed
  @Column({ type: 'char', length: 36, nullable: true })
  sessionId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
