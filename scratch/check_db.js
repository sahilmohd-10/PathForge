import knex from 'knex';
import path from 'path';

const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: path.join(process.cwd(), 'database.sqlite'),
  },
  useNullAsDefault: true,
});

async function check() {
  const info = await db.raw('PRAGMA table_info(resume_data)');
  console.log(JSON.stringify(info, null, 2));
  process.exit(0);
}

check();
