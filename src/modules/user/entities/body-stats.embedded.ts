import { Column } from 'typeorm';
import { EActivityLevel, ESex } from '../enum/index.js';
import { nullableDecimalTransformer } from '../../../common/transformers/index.js';

// Embedded in User. Metric, current values only; NULL when unset.
export class BodyStats {
  @Column({ type: 'enum', enum: ESex, nullable: true })
  sex: ESex | null;

  @Column({ type: 'smallint', unsigned: true, nullable: true })
  heightCm: number | null;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: true,
    transformer: nullableDecimalTransformer,
  })
  weightKg: number | null;

  @Column({ type: 'enum', enum: EActivityLevel, nullable: true })
  activityLevel: EActivityLevel | null;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: true,
    transformer: nullableDecimalTransformer,
  })
  neckCm: number | null;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: true,
    transformer: nullableDecimalTransformer,
  })
  waistCm: number | null;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: true,
    transformer: nullableDecimalTransformer,
  })
  hipCm: number | null;
}
