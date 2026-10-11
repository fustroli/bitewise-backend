import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSessionExpiresAtIndex1791740000000 implements MigrationInterface {
  name = 'AddSessionExpiresAtIndex1791740000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX \`IDX_session_expires_at\` ON \`session\` (\`expiresAt\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_session_expires_at\` ON \`session\``,
    );
  }
}
