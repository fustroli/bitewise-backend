import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1791708071108 implements MigrationInterface {
  name = 'InitialSchema1791708071108';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // typeorm_metadata rows are keyed by database name, which differs per environment
    const database = await queryRunner.getCurrentDatabase();
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`activeEmail\` varchar(255) AS (IF(\`deleteTimeStamp\` IS NULL, \`email\`, NULL)) STORED NULL, \`hash\` varchar(255) NULL, \`avatarUrl\` varchar(255) NULL, \`googleId\` varchar(255) NULL, \`facebookId\` varchar(255) NULL, \`createTimeStamp\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateTimeStamp\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleteTimeStamp\` datetime(6) NULL, \`personalInformationUsername\` varchar(255) NULL, \`personalInformationFirstname\` varchar(255) NULL, \`personalInformationLastname\` varchar(255) NULL, \`personalInformationPhonenumber\` varchar(255) NULL, \`personalInformationDateofbirth\` date NULL, \`socialProfilesFacebook\` varchar(255) NULL, \`socialProfilesTwitter\` varchar(255) NULL, \`socialProfilesInstagram\` varchar(255) NULL, \`socialProfilesLinkedin\` varchar(255) NULL, \`bodyStatsSex\` enum ('MALE', 'FEMALE') NULL, \`bodyStatsHeightcm\` smallint UNSIGNED NULL, \`bodyStatsWeightkg\` decimal(4,1) NULL, \`bodyStatsActivitylevel\` enum ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE', 'EXTRA_ACTIVE') NULL, \`bodyStatsNeckcm\` decimal(4,1) NULL, \`bodyStatsWaistcm\` decimal(4,1) NULL, \`bodyStatsHipcm\` decimal(4,1) NULL, \`notificationSettingsDefaultemailaddress\` varchar(255) NULL, \`notificationSettingsCommunicationemail\` tinyint NOT NULL DEFAULT 0, \`notificationSettingsMarketingemail\` tinyint NOT NULL DEFAULT 0, \`notificationSettingsSecurityemail\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`UQ_user_user_name\` (\`personalInformationUsername\`), UNIQUE INDEX \`UQ_user_active_email\` (\`activeEmail\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `INSERT INTO \`typeorm_metadata\`(\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`) VALUES (DEFAULT, ?, ?, ?, ?, ?)`,
      [
        database,
        'user',
        'GENERATED_COLUMN',
        'activeEmail',
        'IF(`deleteTimeStamp` IS NULL, `email`, NULL)',
      ],
    );
    await queryRunner.query(
      `CREATE TABLE \`meal_ingredient\` (\`id\` int NOT NULL AUTO_INCREMENT, \`quantity\` decimal(10,2) NOT NULL, \`mealId\` int NULL, \`ingredientId\` int NULL, UNIQUE INDEX \`UQ_meal_ingredient_meal_ingredient\` (\`mealId\`, \`ingredientId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`meal_plan_meal\` (\`id\` int NOT NULL AUTO_INCREMENT, \`mealPlanId\` int NULL, \`mealId\` int NULL, UNIQUE INDEX \`UQ_meal_plan_meal_meal_plan_meal\` (\`mealPlanId\`, \`mealId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`meal_plan\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`activeName\` varchar(255) AS (IF(\`deleteTimeStamp\` IS NULL, \`name\`, NULL)) STORED NULL, \`createTimeStamp\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateTimeStamp\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleteTimeStamp\` datetime(6) NULL, \`userId\` int NULL, UNIQUE INDEX \`UQ_meal_plan_active_name\` (\`userId\`, \`activeName\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `INSERT INTO \`typeorm_metadata\`(\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`) VALUES (DEFAULT, ?, ?, ?, ?, ?)`,
      [
        database,
        'meal_plan',
        'GENERATED_COLUMN',
        'activeName',
        'IF(`deleteTimeStamp` IS NULL, `name`, NULL)',
      ],
    );
    await queryRunner.query(
      `CREATE TABLE \`meal\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`activeName\` varchar(255) AS (IF(\`deleteTimeStamp\` IS NULL, \`name\`, NULL)) STORED NULL, \`createTimeStamp\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateTimeStamp\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleteTimeStamp\` datetime(6) NULL, \`userId\` int NULL, UNIQUE INDEX \`UQ_meal_active_name\` (\`userId\`, \`activeName\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `INSERT INTO \`typeorm_metadata\`(\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`) VALUES (DEFAULT, ?, ?, ?, ?, ?)`,
      [
        database,
        'meal',
        'GENERATED_COLUMN',
        'activeName',
        'IF(`deleteTimeStamp` IS NULL, `name`, NULL)',
      ],
    );
    await queryRunner.query(
      `CREATE TABLE \`ingredient\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`activeName\` varchar(255) AS (IF(\`deleteTimeStamp\` IS NULL, \`name\`, NULL)) STORED NULL, \`protein\` decimal(10,1) NOT NULL, \`totalFat\` decimal(10,1) NOT NULL, \`saturatedFat\` decimal(10,1) NOT NULL, \`totalCarbohydrates\` decimal(10,1) NOT NULL, \`sugar\` decimal(10,1) NOT NULL, \`dietaryFiber\` decimal(10,1) NOT NULL, \`calories\` decimal(10,1) NOT NULL, \`unit\` enum ('100g', 'piece') NOT NULL, \`createTimeStamp\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateTimeStamp\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleteTimeStamp\` datetime(6) NULL, \`userId\` int NULL, UNIQUE INDEX \`UQ_ingredient_active_name\` (\`userId\`, \`activeName\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `INSERT INTO \`typeorm_metadata\`(\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`) VALUES (DEFAULT, ?, ?, ?, ?, ?)`,
      [
        database,
        'ingredient',
        'GENERATED_COLUMN',
        'activeName',
        'IF(`deleteTimeStamp` IS NULL, `name`, NULL)',
      ],
    );
    await queryRunner.query(
      `CREATE TABLE \`session\` (\`id\` char(36) NOT NULL, \`refreshTokenHash\` char(64) NOT NULL, \`expiresAt\` datetime NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`lastUsedAt\` datetime NOT NULL, \`userId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meal_ingredient\` ADD CONSTRAINT \`FK_89cc943d236c66c6a19d84401cc\` FOREIGN KEY (\`mealId\`) REFERENCES \`meal\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meal_ingredient\` ADD CONSTRAINT \`FK_e2693d28fe730d0681b99c77419\` FOREIGN KEY (\`ingredientId\`) REFERENCES \`ingredient\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meal_plan_meal\` ADD CONSTRAINT \`FK_f94d441ece7925c3c8e719a52c0\` FOREIGN KEY (\`mealPlanId\`) REFERENCES \`meal_plan\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meal_plan_meal\` ADD CONSTRAINT \`FK_149bf5a03049161f4c4c2c8155e\` FOREIGN KEY (\`mealId\`) REFERENCES \`meal\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meal_plan\` ADD CONSTRAINT \`FK_cf47a5b93b35567b36ed000a3ca\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`meal\` ADD CONSTRAINT \`FK_419ad998c5e3b37a7cce0f872f5\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ingredient\` ADD CONSTRAINT \`FK_d621784b59b05016938180fb3bb\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`session\` ADD CONSTRAINT \`FK_3d2f174ef04fb312fdebd0ddc53\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // typeorm_metadata rows are keyed by database name, which differs per environment
    const database = await queryRunner.getCurrentDatabase();
    await queryRunner.query(
      `ALTER TABLE \`session\` DROP FOREIGN KEY \`FK_3d2f174ef04fb312fdebd0ddc53\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ingredient\` DROP FOREIGN KEY \`FK_d621784b59b05016938180fb3bb\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meal\` DROP FOREIGN KEY \`FK_419ad998c5e3b37a7cce0f872f5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meal_plan\` DROP FOREIGN KEY \`FK_cf47a5b93b35567b36ed000a3ca\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meal_plan_meal\` DROP FOREIGN KEY \`FK_149bf5a03049161f4c4c2c8155e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meal_plan_meal\` DROP FOREIGN KEY \`FK_f94d441ece7925c3c8e719a52c0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meal_ingredient\` DROP FOREIGN KEY \`FK_e2693d28fe730d0681b99c77419\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`meal_ingredient\` DROP FOREIGN KEY \`FK_89cc943d236c66c6a19d84401cc\``,
    );
    await queryRunner.query(`DROP TABLE \`session\``);
    await queryRunner.query(
      `DELETE FROM \`typeorm_metadata\` WHERE \`type\` = ? AND \`name\` = ? AND \`schema\` = ? AND \`table\` = ?`,
      ['GENERATED_COLUMN', 'activeName', database, 'ingredient'],
    );
    await queryRunner.query(
      `DROP INDEX \`UQ_ingredient_active_name\` ON \`ingredient\``,
    );
    await queryRunner.query(`DROP TABLE \`ingredient\``);
    await queryRunner.query(
      `DELETE FROM \`typeorm_metadata\` WHERE \`type\` = ? AND \`name\` = ? AND \`schema\` = ? AND \`table\` = ?`,
      ['GENERATED_COLUMN', 'activeName', database, 'meal'],
    );
    await queryRunner.query(`DROP INDEX \`UQ_meal_active_name\` ON \`meal\``);
    await queryRunner.query(`DROP TABLE \`meal\``);
    await queryRunner.query(
      `DELETE FROM \`typeorm_metadata\` WHERE \`type\` = ? AND \`name\` = ? AND \`schema\` = ? AND \`table\` = ?`,
      ['GENERATED_COLUMN', 'activeName', database, 'meal_plan'],
    );
    await queryRunner.query(
      `DROP INDEX \`UQ_meal_plan_active_name\` ON \`meal_plan\``,
    );
    await queryRunner.query(`DROP TABLE \`meal_plan\``);
    await queryRunner.query(
      `DROP INDEX \`UQ_meal_plan_meal_meal_plan_meal\` ON \`meal_plan_meal\``,
    );
    await queryRunner.query(`DROP TABLE \`meal_plan_meal\``);
    await queryRunner.query(
      `DROP INDEX \`UQ_meal_ingredient_meal_ingredient\` ON \`meal_ingredient\``,
    );
    await queryRunner.query(`DROP TABLE \`meal_ingredient\``);
    await queryRunner.query(
      `DELETE FROM \`typeorm_metadata\` WHERE \`type\` = ? AND \`name\` = ? AND \`schema\` = ? AND \`table\` = ?`,
      ['GENERATED_COLUMN', 'activeEmail', database, 'user'],
    );
    await queryRunner.query(`DROP INDEX \`UQ_user_active_email\` ON \`user\``);
    await queryRunner.query(`DROP INDEX \`UQ_user_user_name\` ON \`user\``);
    await queryRunner.query(`DROP TABLE \`user\``);
  }
}
