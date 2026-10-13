import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailChange1792000000000 implements MigrationInterface {
  name = 'AddEmailChange1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`email_verification_token\` ADD \`newEmail\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`email_verification_token\` ADD \`sessionId\` char(36) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`email_verification_token\` DROP COLUMN \`sessionId\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`email_verification_token\` DROP COLUMN \`newEmail\``,
    );
  }
}
