import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserActiveGoogleId1791730000000 implements MigrationInterface {
  name = 'AddUserActiveGoogleId1791730000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // typeorm_metadata rows are keyed by database name, which differs per environment
    const database = await queryRunner.getCurrentDatabase();
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`activeGoogleId\` varchar(255) AS (IF(\`deleteTimeStamp\` IS NULL, \`googleId\`, NULL)) STORED NULL`,
    );
    await queryRunner.query(
      `INSERT INTO \`typeorm_metadata\`(\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`) VALUES (DEFAULT, ?, ?, ?, ?, ?)`,
      [
        database,
        'user',
        'GENERATED_COLUMN',
        'activeGoogleId',
        'IF(`deleteTimeStamp` IS NULL, `googleId`, NULL)',
      ],
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`UQ_user_active_google_id\` ON \`user\` (\`activeGoogleId\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const database = await queryRunner.getCurrentDatabase();
    await queryRunner.query(
      `DROP INDEX \`UQ_user_active_google_id\` ON \`user\``,
    );
    await queryRunner.query(
      `DELETE FROM \`typeorm_metadata\` WHERE \`type\` = ? AND \`name\` = ? AND \`schema\` = ? AND \`table\` = ?`,
      ['GENERATED_COLUMN', 'activeGoogleId', database, 'user'],
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP COLUMN \`activeGoogleId\``,
    );
  }
}
