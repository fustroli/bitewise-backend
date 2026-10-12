import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameUserAvatarUrlToAvatarKey1791750000000 implements MigrationInterface {
  name = 'RenameUserAvatarUrlToAvatarKey1791750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` RENAME COLUMN \`avatarUrl\` TO \`avatarKey\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` RENAME COLUMN \`avatarKey\` TO \`avatarUrl\``,
    );
  }
}
