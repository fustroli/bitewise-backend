import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompositionPosition1792300000000 implements MigrationInterface {
  name = 'AddCompositionPosition1792300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meal_ingredient\` ADD \`position\` int NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meal_plan_meal\` ADD \`position\` int NOT NULL DEFAULT '0'`,
    );
    // Backfill the order clients saw until now: the unique (parent, member)
    // index returned rows sorted by the member id
    await queryRunner.query(
      `UPDATE \`meal_ingredient\` mi JOIN (SELECT \`id\`, ROW_NUMBER() OVER (PARTITION BY \`mealId\` ORDER BY \`ingredientId\`) - 1 AS \`position\` FROM \`meal_ingredient\`) ranked ON ranked.\`id\` = mi.\`id\` SET mi.\`position\` = ranked.\`position\``,
    );
    await queryRunner.query(
      `UPDATE \`meal_plan_meal\` mpm JOIN (SELECT \`id\`, ROW_NUMBER() OVER (PARTITION BY \`mealPlanId\` ORDER BY \`mealId\`) - 1 AS \`position\` FROM \`meal_plan_meal\`) ranked ON ranked.\`id\` = mpm.\`id\` SET mpm.\`position\` = ranked.\`position\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`meal_plan_meal\` DROP COLUMN \`position\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meal_ingredient\` DROP COLUMN \`position\``,
    );
  }
}
