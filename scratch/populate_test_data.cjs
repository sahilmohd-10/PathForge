const knex = require('knex');
const path = require('path');
const dbPath = path.join(process.cwd(), 'database.sqlite');

const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
});

async function populate() {
  try {
    const studentIds = [7, 8];
    const recruiterId = 4;

    // Add some jobs if they don't exist
    const jobsCount = await db('jobs').count('id as count').first();
    if (jobsCount.count < 5) {
      await db('jobs').insert([
        {
          title: 'Full Stack Engineer',
          company: 'Nexus Tech',
          description: 'Looking for a React/Node expert.',
          requirements: 'React, Node, SQL',
          location: 'San Francisco, CA',
          salary_range: '$120k - $160k',
          type: 'Full-time',
          posted_by: recruiterId
        },
        {
          title: 'Data Scientist',
          company: 'Insight AI',
          description: 'ML and Python expert needed.',
          requirements: 'Python, PyTorch, Scikit-learn',
          location: 'Remote',
          salary_range: '$130k - $170k',
          type: 'Full-time',
          posted_by: recruiterId
        },
        {
          title: 'UI Designer',
          company: 'Creative Studio',
          description: 'Figma and UI/UX expert.',
          requirements: 'Figma, Adobe XD',
          location: 'New York, NY',
          salary_range: '$90k - $120k',
          type: 'Contract',
          posted_by: recruiterId
        }
      ]);
    }

    const jobs = await db('jobs').select('id');
    
    for (const studentId of studentIds) {
      // Update profile
      await db('profiles').where({ user_id: studentId }).update({
        bio: 'Aspiring software engineer with a passion for AI and web development.',
        target_career: 'Software Engineer',
        location: 'Bengaluru, India',
        experience_years: 1,
        job_readiness_score: 85
      });

      // Add skills
      const skills = await db('skills').select('id').limit(5);
      for (const skill of skills) {
        const exists = await db('user_skills').where({ user_id: studentId, skill_id: skill.id }).first();
        if (!exists) {
          await db('user_skills').insert({
            user_id: studentId,
            skill_id: skill.id,
            proficiency_level: 'Intermediate'
          });
        }
      }

      // Add applications
      const appsCount = await db('applications').where({ user_id: studentId }).count('id as count').first();
      if (appsCount.count === 0) {
        await db('applications').insert([
          {
            job_id: jobs[0].id,
            user_id: studentId,
            status: 'applied',
            applied_at: new Date().toISOString()
          },
          {
            job_id: jobs[1].id,
            user_id: studentId,
            status: 'shortlisted',
            applied_at: new Date().toISOString()
          }
        ]);
      }
    }

    console.log('Database populated with random/test values for existing students.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

populate();
