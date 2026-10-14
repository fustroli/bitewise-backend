import { Column } from 'typeorm';
import { ECalorieTarget, EMacroPlan } from '../enum/index.js';

// Embedded in User. Only the kind of target; the frontend derives kcal from Body stats.
export class Targets {
  // NULL: maintenance
  @Column({ type: 'enum', enum: ECalorieTarget, nullable: true })
  calorieTarget: ECalorieTarget | null;

  // NULL: balanced
  @Column({ type: 'enum', enum: EMacroPlan, nullable: true })
  macroPlan: EMacroPlan | null;
}
