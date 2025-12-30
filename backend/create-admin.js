require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./src/config/database');

async function createAdmin() {
  try {
    const email = 'admin@massage.com';
    const password = 'admin123';
    const firstName = 'Admin';
    const lastName = 'User';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert admin
    const [result] = await pool.query(
      `INSERT INTO admins (email, password_hash, first_name, last_name, is_active)
       VALUES (?, ?, ?, ?, TRUE)`,
      [email.toLowerCase(), passwordHash, firstName, lastName]
    );

    console.log('✓ Admin created successfully');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  ID: ${result.insertId}`);

    process.exit(0);
  } catch (error) {
    console.error('✗ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();
