import { Column } from 'typeorm';

// Embedded in User
export class SocialProfiles {
  @Column({ type: 'varchar', length: 255, nullable: true })
  facebook: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  twitter: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  instagram: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  linkedin: string | null;
}
