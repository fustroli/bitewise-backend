import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerification1791903793794 implements MigrationInterface {
  name = 'AddEmailVerification1791903793794';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`email_verification_token\` (\`id\` int NOT NULL AUTO_INCREMENT, \`purpose\` varchar(32) NOT NULL, \`tokenHash\` char(64) NOT NULL, \`expiresAt\` datetime NOT NULL, \`usedAt\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`userId\` int NOT NULL, INDEX \`IDX_email_verification_token_expires_at\` (\`expiresAt\`), UNIQUE INDEX \`UQ_email_verification_token_hash\` (\`tokenHash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`emailVerified\` tinyint NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE \`email_verification_token\` ADD CONSTRAINT \`FK_77b04d285509a2e6f5f44598be4\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`email_verification_token\` DROP FOREIGN KEY \`FK_77b04d285509a2e6f5f44598be4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP COLUMN \`emailVerified\``,
    );
    await queryRunner.query(
      `DROP INDEX \`UQ_email_verification_token_hash\` ON \`email_verification_token\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_email_verification_token_expires_at\` ON \`email_verification_token\``,
    );
    await queryRunner.query(`DROP TABLE \`email_verification_token\``);
  }
}
