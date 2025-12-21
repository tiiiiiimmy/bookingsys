const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const runMigrations = async () => {
  let connection;

  try {
    console.log('Starting database migrations...\n');

    connection = await pool.getConnection();

    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Execute SQL (MySQL supports multiple statements)
      await connection.query(sql);
      console.log(`✓ ${file} completed successfully\n`);
    }

    console.log('✓ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
  }
};

runMigrations();
