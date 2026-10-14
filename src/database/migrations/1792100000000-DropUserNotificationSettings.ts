import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUserNotificationSettings1792100000000 implements MigrationInterface {
  name = 'DropUserNotificationSettings1792100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP COLUMN \`notificationSettingsDefaultemailaddress\`, DROP COLUMN \`notificationSettingsCommunicationemail\`, DROP COLUMN \`notificationSettingsMarketingemail\`, DROP COLUMN \`notificationSettingsSecurityemail\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD \`notificationSettingsDefaultemailaddress\` varchar(255) NULL, ADD \`notificationSettingsCommunicationemail\` tinyint NOT NULL DEFAULT 0, ADD \`notificationSettingsMarketingemail\` tinyint NOT NULL DEFAULT 0, ADD \`notificationSettingsSecurityemail\` tinyint NOT NULL DEFAULT 1`,
    );
  }
}
