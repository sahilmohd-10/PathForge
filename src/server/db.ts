import knex from 'knex';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'database.sqlite');

const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
});

export async function initDb() {
  try {
    console.log('Reading schema.sql...');
    const schema = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf8');
    const statements = schema.split(';').filter(s => s.trim());
    
    console.log(`Executing ${statements.length} schema statements...`);
    for (const statement of statements) {
      await db.raw(statement);
    }

    // Add verification columns if they don't exist (for existing databases)
    try {
      await db.raw(`ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0`);
      console.log('Added is_verified column');
    } catch (e) {
      // Column already exists
    }
    
    try {
      await db.raw(`ALTER TABLE users ADD COLUMN verification_code TEXT`);
      console.log('Added verification_code column');
    } catch (e) {
      // Column already exists
    }
    
    try {
      await db.raw(`ALTER TABLE users ADD COLUMN verification_expires_at DATETIME`);
      console.log('Added verification_expires_at column');
    } catch (e) {
      // Column already exists
    }

    // Add OAuth tracking columns if they don't exist
    try {
      await db.raw(`ALTER TABLE users ADD COLUMN is_oauth_user INTEGER DEFAULT 0`);
      console.log('Added is_oauth_user column');
    } catch (e) {
      // Column already exists
    }

    try {
      await db.raw(`ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
      console.log('Added updated_at column');
    } catch (e) {
      // Column already exists
    }

    try {
      await db.raw(`ALTER TABLE profiles ADD COLUMN background_url TEXT`);
      console.log('Added background_url column to profiles');
    } catch (e) {
      // Column already exists
    }

    // Create gemini_insights table if it doesn't exist
    try {
      await db.raw(`
        CREATE TABLE IF NOT EXISTS gemini_insights (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          insight_type TEXT CHECK(insight_type IN ('predictive', 'improvement_tips', 'career_paths', 'live_insights', 'skill_gap_analysis')) DEFAULT 'predictive',
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('Created gemini_insights table');
    } catch (e) {
      console.log('gemini_insights table already exists');
    }

    // Migrate gemini_insights table to remove UNIQUE constraint if needed
    try {
      const tableInfo = await db.raw(`PRAGMA table_info(gemini_insights)`);
      const hasUniqueConstraint = await db.raw(`SELECT sql FROM sqlite_master WHERE type='table' AND name='gemini_insights'`);
      const sql = (hasUniqueConstraint[0] as any)?.sql || '';
      
      if (sql.includes('UNIQUE')) {
        console.log('Removing UNIQUE constraint from gemini_insights...');
        // SQLite doesn't support removing constraints, so we need to recreate the table
        await db.raw(`
          CREATE TABLE gemini_insights_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            insight_type TEXT CHECK(insight_type IN ('predictive', 'improvement_tips', 'career_paths', 'live_insights', 'skill_gap_analysis')) DEFAULT 'predictive',
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
        await db.raw(`INSERT INTO gemini_insights_new SELECT * FROM gemini_insights`);
        await db.raw(`DROP TABLE gemini_insights`);
        await db.raw(`ALTER TABLE gemini_insights_new RENAME TO gemini_insights`);
        console.log('Successfully removed UNIQUE constraint from gemini_insights');
      }
    } catch (e: any) {
      console.log('Migration check for gemini_insights:', (e as any).message);
      // This is not critical, continue anyway
    }

    // Create index for gemini_insights
    try {
      await db.raw(`CREATE INDEX IF NOT EXISTS idx_gemini_insights_user ON gemini_insights(user_id)`);
      console.log('Created gemini_insights index');
    } catch (e) {
      // Index already exists
    }

    // Add external_id and external_url columns to jobs table for Adzuna integration
    try {
      await db.raw(`ALTER TABLE jobs ADD COLUMN external_id TEXT`);
      console.log('Added external_id column to jobs table');
    } catch (e) {
      // Column already exists
    }

    try {
      await db.raw(`ALTER TABLE jobs ADD COLUMN external_url TEXT`);
      console.log('Added external_url column to jobs table');
    } catch (e) {
      // Column already exists
    }

    // Seed default admin
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin12345';
    const adminExists = await db('users').where({ email: adminEmail }).first();
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    if (!adminExists) {
      console.log('Seeding default admin user...');
      await db('users').insert({
        email: adminEmail,
        password: hashedPassword,
        full_name: 'System Admin',
        role: 'admin',
        is_verified: 1
      });
    } else {
      console.log('Updating default admin password...');
      await db('users').where({ email: adminEmail }).update({ password: hashedPassword, is_verified: 1 });
    }
    
    // Seed initial skills if empty
    console.log('Checking skills count...');
    const skillsCount = await db('skills').count('id as count').first();
    if (skillsCount && (skillsCount as any).count === 0) {
      console.log('Seeding initial skills...');
      const defaultSkills = [
        { name: 'JavaScript', category: 'Programming' },
        { name: 'TypeScript', category: 'Programming' },
        { name: 'React', category: 'Frontend' },
        { name: 'Node.js', category: 'Backend' },
        { name: 'Python', category: 'Programming' },
        { name: 'SQL', category: 'Database' },
        { name: 'Project Management', category: 'Soft Skills' },
        { name: 'UI/UX Design', category: 'Design' },
        { name: 'Machine Learning', category: 'AI' },
        { name: 'DevOps', category: 'Infrastructure' }
      ];
      await db('skills').insert(defaultSkills);
      console.log('Database initialized successfully.');
    }
  } catch (error) {
    console.error('DATABASE INITIALIZATION FAILED:', error);
    throw error;
  }
}

export default db;
