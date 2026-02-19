/**
 * seed-admins.js
 * Run once to create Mordi & Shlomo as admins.
 * Usage: JWT_SECRET=xxx DB_URL=xxx node sql/seed-admins.js
 */
require('dotenv').config();
const { Pool }  = require('pg');
const bcrypt    = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ADMINS = [
  { name: 'מורדי דובקין',    email: 'mordi@dubkin.com',  password: process.env.MORDI_PASSWORD  || 'Change-Me-Mordi!1' },
  { name: 'שלמה',             email: 'shlomo@dubkin.com', password: process.env.SHLOMO_PASSWORD || 'Change-Me-Shlomo!1' },
];

async function run() {
  for (const admin of ADMINS) {
    const hash = await bcrypt.hash(admin.password, 12);
    await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = 'admin'`,
      [admin.name, admin.email, hash]
    );
    console.log(`✅  ${admin.name} (${admin.email}) — admin created/updated`);
    console.log(`    Password: ${admin.password}`);
    console.log(`    ⚠️  Change this after first login!\n`);
  }
  await pool.end();
}

run().catch(err => { console.error(err); process.exit(1); });
