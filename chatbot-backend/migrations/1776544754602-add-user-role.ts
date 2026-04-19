import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRole1776544754602 implements MigrationInterface {
    name = 'AddUserRole1776544754602'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for role
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`);
        
        // Add role column with default 'user'
        await queryRunner.query(`ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'user'`);
        
        // NOTE: Run 'bun run db:seed' to create the admin user with properly hashed password
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove admin user
        await queryRunner.query(`DELETE FROM users WHERE email = 'admin@handtalk.com'`);
        
        // Drop role column
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        
        // Drop enum type
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }
}
