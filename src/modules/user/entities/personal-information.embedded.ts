import { Column } from 'typeorm';

// Embedded in User. NULL (not '') when unset: userName is unique.
export class PersonalInformation {
  @Column({ type: 'varchar', length: 255, nullable: true })
  userName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: string | null;
}
