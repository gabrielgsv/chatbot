import { MigrationInterface, QueryRunner } from "typeorm";

export class Telemetry1776544754600 implements MigrationInterface {
    name = 'Telemetry1776544754600'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "name" character varying, "phone" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."chat_messages_role_enum" AS ENUM('user', 'assistant', 'system')`);
        await queryRunner.query(`CREATE TABLE "chat_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "role" "public"."chat_messages_role_enum" NOT NULL, "content" text NOT NULL, "sessionId" character varying, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_40c55ee0e571e268b0d3cd37d10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a82476a8acdd6cd6936378cb72" ON "chat_messages" ("sessionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_57e7ca830e61203898e7404155" ON "chat_messages" ("userId", "createdAt") `);
        await queryRunner.query(`CREATE TYPE "public"."telemetry_events_eventtype_enum" AS ENUM('user_data', 'user_message', 'bot_response', 'user_location', 'return_rate', 'message_interval', 'feedback', 'response_time', 'language')`);
        await queryRunner.query(`CREATE TABLE "telemetry_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "eventType" "public"."telemetry_events_eventtype_enum" NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "metadata" jsonb, "sessionId" character varying, "pageUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_17996ee1fa9a5ce42e7ffaa8c68" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7e68ea347d4b358bd8bbae847a" ON "telemetry_events" ("sessionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c5f1830385cf544d0839e20b6d" ON "telemetry_events" ("userId", "timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_198e7cd36556e0167ef66f3378" ON "telemetry_events" ("userId", "eventType") `);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_43d968962b9e24e1e3517c0fbff" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "telemetry_events" ADD CONSTRAINT "FK_7f2c13bde4aec24fa23351c0123" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "telemetry_events" DROP CONSTRAINT "FK_7f2c13bde4aec24fa23351c0123"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_43d968962b9e24e1e3517c0fbff"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_198e7cd36556e0167ef66f3378"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c5f1830385cf544d0839e20b6d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7e68ea347d4b358bd8bbae847a"`);
        await queryRunner.query(`DROP TABLE "telemetry_events"`);
        await queryRunner.query(`DROP TYPE "public"."telemetry_events_eventtype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_57e7ca830e61203898e7404155"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a82476a8acdd6cd6936378cb72"`);
        await queryRunner.query(`DROP TABLE "chat_messages"`);
        await queryRunner.query(`DROP TYPE "public"."chat_messages_role_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
