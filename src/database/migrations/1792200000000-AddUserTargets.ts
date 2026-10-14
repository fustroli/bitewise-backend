import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTargets1792200000000 implements MigrationInterface {
  name = 'AddUserTargets1792200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`targetsCalorietarget\` enum ('maintenance', 'lose_mild', 'lose_normal', 'lose_fast', 'gain_mild', 'gain_normal', 'gain_fast') NULL, ADD \`targetsMacroplan\` enum ('balanced', 'low_fat', 'low_carb', 'high_protein') NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP COLUMN \`targetsMacroplan\`, DROP COLUMN \`targetsCalorietarget\``,
    );
  }
}
