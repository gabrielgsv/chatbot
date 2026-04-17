import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateTelemetryEvents1744893600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for event types
    await queryRunner.query(`
      CREATE TYPE "telemetry_event_type_enum" AS ENUM (
        'typing_start',
        'typing_end',
        'typing_pause',
        'message_edit',
        'message_clear',
        'scroll_velocity',
        'click_heatmap',
        'time_on_page',
        'tab_switch',
        'device_info',
        'connection_quality',
        'session_start',
        'session_end',
        'message_sent',
        'message_received'
      )
    `);

    // Create telemetry_events table
    await queryRunner.createTable(
      new Table({
        name: 'telemetry_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'eventType',
            type: 'telemetry_event_type_enum',
          },
          {
            name: 'timestamp',
            type: 'timestamptz',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'sessionId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'pageUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Add indexes
    await queryRunner.createIndex(
      'telemetry_events',
      new TableIndex({
        name: 'IDX_TELEMETRY_USER_EVENT_TYPE',
        columnNames: ['userId', 'eventType'],
      }),
    );

    await queryRunner.createIndex(
      'telemetry_events',
      new TableIndex({
        name: 'IDX_TELEMETRY_USER_TIMESTAMP',
        columnNames: ['userId', 'timestamp'],
      }),
    );

    await queryRunner.createIndex(
      'telemetry_events',
      new TableIndex({
        name: 'IDX_TELEMETRY_SESSION_ID',
        columnNames: ['sessionId'],
      }),
    );

    // Add foreign key to users table
    await queryRunner.createForeignKey(
      'telemetry_events',
      new TableForeignKey({
        name: 'FK_TELEMETRY_USER',
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('telemetry_events', 'FK_TELEMETRY_USER');

    // Drop indexes
    await queryRunner.dropIndex('telemetry_events', 'IDX_TELEMETRY_USER_EVENT_TYPE');
    await queryRunner.dropIndex('telemetry_events', 'IDX_TELEMETRY_USER_TIMESTAMP');
    await queryRunner.dropIndex('telemetry_events', 'IDX_TELEMETRY_SESSION_ID');

    // Drop table
    await queryRunner.dropTable('telemetry_events');

    // Drop enum type
    await queryRunner.query(`DROP TYPE "telemetry_event_type_enum"`);
  }
}
