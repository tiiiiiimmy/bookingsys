const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
require('dotenv').config();

const runSeeds = async () => {
  let connection;

  try {
    console.log('Starting database seeding...\n');

    connection = await pool.getConnection();

    // Run SQL seed files
    const seedsDir = path.join(__dirname, 'seeds');
    const seedFiles = fs
      .readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of seedFiles) {
      console.log(`Running seed: ${file}`);
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      await connection.query(sql);
      console.log(`✓ ${file} completed successfully\n`);
    }

    // Create initial admin user
    console.log('Creating initial admin user...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@massage.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'User';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // Insert admin (MySQL syntax)
    await connection.query(
      `INSERT INTO admins (email, password_hash, first_name, last_name, is_active)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         first_name = VALUES(first_name),
         last_name = VALUES(last_name),
         is_active = VALUES(is_active)`,
      [adminEmail, passwordHash, adminFirstName, adminLastName, true]
    );

    console.log(`✓ Admin user created successfully`);
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log(`  ⚠️  Please change the password after first login!\n`);

    console.log('✓ All seeds completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    process.exit(1);
  } finally {
    if (connection) connection.release();
  }
};

runSeeds();
