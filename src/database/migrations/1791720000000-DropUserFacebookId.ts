import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUserFacebookId1791720000000 implements MigrationInterface {
  name = 'DropUserFacebookId1791720000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`facebookId\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`facebookId\` varchar(255) NULL`,
    );
  }
}
