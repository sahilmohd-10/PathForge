import db from '../src/server/db.ts';
import bcrypt from 'bcryptjs';

async function updateAdmin() {
  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const email = 'admin@pathforge.com';
    
    // Check if user exists by email
    const user = await db('users').where({ email }).first();
    
    if (user) {
      await db('users').where({ id: user.id }).update({
        password: adminPassword,
        role: 'admin',
        is_verified: 1
      });
      console.log(`✅ User ${email} updated to Admin role.`);
    } else {
      await db('users').insert({
        email,
        password: adminPassword,
        full_name: 'Admin User',
        role: 'admin',
        is_verified: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      console.log(`✅ Admin user ${email} created.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to update admin:', error);
    process.exit(1);
  }
}

updateAdmin();
