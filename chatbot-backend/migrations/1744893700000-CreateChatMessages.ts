import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateChatMessages1744893700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for message roles
    await queryRunner.query(`
      CREATE TYPE "chat_message_role_enum" AS ENUM (
        'user',
        'assistant',
        'system'
      )
    `);

    // Create chat_messages table
    await queryRunner.createTable(
      new Table({
        name: 'chat_messages',
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
            name: 'role',
            type: 'chat_message_role_enum',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'sessionId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
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
      'chat_messages',
      new TableIndex({
        name: 'IDX_CHAT_MESSAGES_USER_CREATED',
        columnNames: ['userId', 'createdAt'],
      }),
    );

    await queryRunner.createIndex(
      'chat_messages',
      new TableIndex({
        name: 'IDX_CHAT_MESSAGES_SESSION',
        columnNames: ['sessionId'],
      }),
    );

    // Add foreign key to users table
    await queryRunner.createForeignKey(
      'chat_messages',
      new TableForeignKey({
        name: 'FK_CHAT_MESSAGES_USER',
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('chat_messages', 'FK_CHAT_MESSAGES_USER');

    // Drop indexes
    await queryRunner.dropIndex('chat_messages', 'IDX_CHAT_MESSAGES_USER_CREATED');
    await queryRunner.dropIndex('chat_messages', 'IDX_CHAT_MESSAGES_SESSION');

    // Drop table
    await queryRunner.dropTable('chat_messages');

    // Drop enum type
    await queryRunner.query(`DROP TYPE "chat_message_role_enum"`);
  }
}
