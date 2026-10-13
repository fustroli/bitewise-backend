import { MigrationInterface, QueryRunner } from 'typeorm';

// Data only. Can't collide: activeEmail is already unique case-insensitively
// (utf8mb4_0900_ai_ci) and follows email, being generated.
export class LowercaseUserEmails1791990000000 implements MigrationInterface {
  name = 'LowercaseUserEmails1791990000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE \`user\` SET \`email\` = LOWER(\`email\`), \`notificationSettingsDefaultemailaddress\` = LOWER(\`notificationSettingsDefaultemailaddress\`)`,
    );
  }

  // The original casing is lost
  public async down(): Promise<void> {}
}
