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


    try {
      await db.raw(`ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0`);
      console.log('Added is_verified column');
    } catch (e) {

    }

    try {
      await db.raw(`ALTER TABLE users ADD COLUMN verification_code TEXT`);
      console.log('Added verification_code column');
    } catch (e) {

    }

    try {
      await db.raw(`ALTER TABLE users ADD COLUMN verification_expires_at DATETIME`);
      console.log('Added verification_expires_at column');
    } catch (e) {

    }


    try {
      await db.raw(`ALTER TABLE users ADD COLUMN is_oauth_user INTEGER DEFAULT 0`);
      console.log('Added is_oauth_user column');
    } catch (e) {

    }

    try {
      await db.raw(`ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
      console.log('Added updated_at column');
    } catch (e) {

    }

    try {
      await db.raw(`ALTER TABLE profiles ADD COLUMN background_url TEXT`);
      console.log('Added background_url column to profiles');
    } catch (e) {

    }

    try {
      await db.raw(`ALTER TABLE profiles ADD COLUMN phone_number TEXT`);
      console.log('Added phone_number column to profiles');
    } catch (e) {

    }


    try {
      await db.raw(`ALTER TABLE applications ADD COLUMN interview_offered INTEGER DEFAULT 0`);
      console.log('Added interview_offered column');
    } catch (e) {

    }

    try {
      await db.raw(`ALTER TABLE applications ADD COLUMN interview_completed INTEGER DEFAULT 0`);
      console.log('Added interview_completed column');
    } catch (e) {

    }

    try {
      await db.raw(`
        CREATE TABLE IF NOT EXISTS ollama_insights (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          insight_type TEXT CHECK(insight_type IN ('predictive', 'improvement_tips', 'career_paths', 'live_insights', 'skill_gap_analysis')) DEFAULT 'predictive',
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('Created ollama_insights table');
    } catch (e) {
      console.log('ollama_insights table already exists');
    }


    try {
      const tableInfo = await db.raw(`PRAGMA table_info(ollama_insights)`);
      const hasUniqueConstraint = await db.raw(`SELECT sql FROM sqlite_master WHERE type='table' AND name='ollama_insights'`);
      const sql = (hasUniqueConstraint[0] as any)?.sql || '';

      if (sql.includes('UNIQUE')) {
        console.log('Removing UNIQUE constraint from ollama_insights...');

        await db.raw(`
          CREATE TABLE ollama_insights_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            insight_type TEXT CHECK(insight_type IN ('predictive', 'improvement_tips', 'career_paths', 'live_insights', 'skill_gap_analysis')) DEFAULT 'predictive',
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
        await db.raw(`INSERT INTO ollama_insights_new SELECT * FROM ollama_insights`);
        await db.raw(`DROP TABLE ollama_insights`);
        await db.raw(`ALTER TABLE ollama_insights_new RENAME TO ollama_insights`);
        console.log('Successfully removed UNIQUE constraint from ollama_insights');
      }
    } catch (e: any) {
      console.log('Migration check for ollama_insights:', (e as any).message);

    }


    try {
      await db.raw(`CREATE INDEX IF NOT EXISTS idx_ollama_insights_user ON ollama_insights(user_id)`);
      console.log('Created ollama_insights index');
    } catch (e) {

    }


    try {
      await db.raw(`ALTER TABLE jobs ADD COLUMN external_id TEXT`);
      console.log('Added external_id column to jobs table');
    } catch (e) {

    }

    try {
      await db.raw(`ALTER TABLE jobs ADD COLUMN external_url TEXT`);
      console.log('Added external_url column to jobs table');
    } catch (e) {

    }


    const adminEmail = 'admin@pathforge.com';
    const adminPassword = 'admin123';
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