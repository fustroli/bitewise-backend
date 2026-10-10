import { Column } from 'typeorm';

// Embedded in User
export class NotificationSettings {
  // NULL: notifications go to the sign-in email
  @Column({ type: 'varchar', length: 255, nullable: true })
  defaultEmailAddress: string | null;

  @Column({ default: false })
  communicationEmail: boolean;

  @Column({ default: false })
  marketingEmail: boolean;

  @Column({ default: true })
  securityEmail: boolean;
}
