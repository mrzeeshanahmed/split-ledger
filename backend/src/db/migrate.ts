import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from './index.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

interface Migration {
  id: number;
  name: string;
  applied_at: Date;
}

const createMigrationsTable = async (): Promise<void> => {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
};

const getAppliedMigrations = async (): Promise<string[]> => {
  const result = await query<Migration>('SELECT name FROM migrations ORDER BY id');
  return result.rows.map((m) => m.name);
};

const getMigrationFiles = async (): Promise<string[]> => {
  try {
    const files = await fs.readdir(MIGRATIONS_DIR);
    return files
      .filter((f) => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

const parseMigrationFile = (content: string): { up: string; down: string | null } => {
  const downDelimiter = '-- DOWN';
  const downIndex = content.indexOf(downDelimiter);

  if (downIndex === -1) {
    return { up: content.trim(), down: null };
  }

  const up = content.substring(0, downIndex).trim();
  const down = content.substring(downIndex + downDelimiter.length).trim();

  return { up, down: down || null };
};

const applyMigration = async (name: string, sql: string): Promise<void> => {
  await query('BEGIN');
  try {
    await query(sql);
    await query('INSERT INTO migrations (name) VALUES ($1)', [name]);
    await query('COMMIT');
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

const revertMigration = async (name: string, sql: string): Promise<void> => {
  await query('BEGIN');
  try {
    await query(sql);
    await query('DELETE FROM migrations WHERE name = $1', [name]);
    await query('COMMIT');
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

const migrateUp = async (): Promise<void> => {
  await createMigrationsTable();

  const applied = await getAppliedMigrations();
  const files = await getMigrationFiles();
  const pending = files.filter((f) => !applied.includes(f));

  if (pending.length === 0) {
    logger.info({ message: 'No pending migrations' });
    return;
  }

  for (const file of pending) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const { up } = parseMigrationFile(content);

    logger.info({ message: `Applying migration: ${file}` });
    await applyMigration(file, up);
    logger.info({ message: `Applied migration: ${file}` });
  }

  logger.info({ message: `Migrations complete. Applied ${pending.length} migration(s).` });
};

const migrateDown = async (): Promise<void> => {
  await createMigrationsTable();

  const applied = await getAppliedMigrations();

  if (applied.length === 0) {
    logger.info({ message: 'No migrations to revert' });
    return;
  }

  const lastMigration = applied[applied.length - 1];
  const filePath = path.join(MIGRATIONS_DIR, lastMigration);
  const content = await fs.readFile(filePath, 'utf-8');
  const { down } = parseMigrationFile(content);

  if (!down) {
    throw new Error(`Migration ${lastMigration} does not have a down migration`);
  }

  logger.info({ message: `Reverting migration: ${lastMigration}` });
  await revertMigration(lastMigration, down);
  logger.info({ message: `Reverted migration: ${lastMigration}` });
};

const createMigration = async (name: string): Promise<void> => {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const filename = `${timestamp}_${name}.sql`;
  const filePath = path.join(MIGRATIONS_DIR, filename);

  const template = `-- Migration: ${name}
-- Created at: ${new Date().toISOString()}

-- UP
\n
-- DOWN
\n`;

  await fs.mkdir(MIGRATIONS_DIR, { recursive: true });
  await fs.writeFile(filePath, template);

  logger.info({ message: `Created migration: ${filename}` });
};

const main = async (): Promise<void> => {
  const command = process.argv[2];
  const arg = process.argv[3];

  try {
    switch (command) {
      case 'up':
        await migrateUp();
        break;
      case 'down':
        await migrateDown();
        break;
      case 'create':
        if (!arg) {
          console.error('Usage: migrate.ts create <migration_name>');
          process.exit(1);
        }
        await createMigration(arg);
        break;
      default:
        console.error('Usage: migrate.ts [up|down|create <name>]');
        process.exit(1);
    }
  } finally {
    await pool.end();
  }
};

main().catch((error) => {
  logger.error({
    message: 'Migration failed',
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  process.exit(1);
});
