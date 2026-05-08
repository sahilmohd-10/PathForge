import express from 'express';
import db from '../db.ts';
import { fetchAdzunaJobs, searchAdzunaJobs } from '../adzunaService.ts';
import type { ProcessedJob } from '../adzunaService.ts';

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const source = (req.query.source as string) || 'db';
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 50);
    const country = (req.query.country as string) || 'us';
    const category = (req.query.category as string) || undefined;

    if (source === 'adzuna') {
      const adzunaData = await fetchAdzunaJobs(country, category, page, limit);
      return res.json({
        source: 'adzuna',
        page,
        limit,
        country,
        total: adzunaData.count,
        jobs: adzunaData.results
      });
    } else if (source === 'all') {
      const adzunaData = await fetchAdzunaJobs(country, category, page, limit).catch(() => ({ results: [], count: 0 }));
      const dbJobs = await db('jobs').select('*').orderBy('created_at', 'desc').limit(limit).offset((page - 1) * limit);

      const formattedDbJobs = dbJobs.map(job => ({
        id: job.id.toString(),
        title: job.title,
        company: job.company,
        description: job.description,
        location: job.location,
        salary_range: job.salary_range,
        requirements: job.requirements,
        created_at: job.created_at,
        is_local: true,
        posted_by: job.posted_by,
        external_url: job.external_url || null
      }));

      return res.json({
        source: 'all',
        page,
        limit,
        country,
        total: adzunaData.count + dbJobs.length,
        jobs: [...formattedDbJobs, ...adzunaData.results]
      });
    } else {
      const jobs = await db('jobs').select('*').orderBy('created_at', 'desc').limit(limit).offset((page - 1) * limit);
      const total = await db('jobs').count('* as count').first();

      res.json({
        source: 'db',
        page,
        limit,
        total: total?.count || 0,
        jobs: jobs.map(j => ({ ...j, is_local: true }))
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { title, company, description, requirements, location, salary_range, salaryRange, type, posted_by, postedBy } = req.body;
  try {
    const [id] = await db('jobs').insert({
      title,
      company,
      description,
      requirements: typeof requirements === 'string' ? requirements : JSON.stringify(requirements),
      location,
      salary_range: salary_range || salaryRange,
      type,
      posted_by: posted_by || postedBy,
      status: 'open'
    });
    res.status(201).json({ id, message: 'Job posted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/search', async (req, res) => {
  try {
    const keywords = req.query.keywords as string;
    const country = (req.query.country as string) || 'us';
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 50);

    if (!keywords) {
      return res.status(400).json({ error: 'Keywords parameter is required' });
    }

    let adzunaData: { results: ProcessedJob[], count: number } = { results: [], count: 0 };
    try {
      adzunaData = await searchAdzunaJobs(country, keywords, page, limit);
    } catch (e) {
      console.error('Adzuna search failed, continuing with local jobs', e);
    }


    const dbJobs = await db('jobs')
      .where(function() {
        this.where('title', 'like', `%${keywords}%`)
            .orWhere('company', 'like', `%${keywords}%`)
      })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    const formattedDbJobs = dbJobs.map(job => ({
      id: job.id.toString(),
      title: job.title,
      company: job.company,
      description: job.description,
      location: job.location,
      salary_range: job.salary_range,
      requirements: job.requirements,
      created_at: job.created_at,
      is_local: true,
      posted_by: job.posted_by,
      external_url: null
    }));

    res.json({
      source: 'all',
      keywords,
      country,
      page,
      limit,
      total: adzunaData.count + dbJobs.length,
      jobs: [...formattedDbJobs, ...adzunaData.results]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/sync-to-db', async (req, res) => {
  try {
    const { jobs } = req.body;

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({ error: 'Jobs array is required and must not be empty' });
    }


    const formattedJobs = jobs.map((job: ProcessedJob) => ({
      title: job.title,
      company: job.company,
      description: job.description,
      requirements: job.requirements,
      location: job.location,
      salary_range: job.salary_range,
      type: job.type,
      posted_by: null,
      status: 'open',
      external_id: job.external_id,
      external_url: job.external_url
    }));

    const ids = await db('jobs').insert(formattedJobs).returning('id');

    res.status(201).json({
      message: `Successfully synced ${ids.length} jobs to database`,
      count: ids.length,
      ids
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/recruiter/:userId', async (req, res) => {
  try {
    const jobs = await db('jobs').where({ posted_by: req.params.userId }).orderBy('created_at', 'desc');
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/applications/recruiter/:userId', async (req, res) => {
  try {
    const applications = await db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .join('users', 'applications.user_id', 'users.id')
      .leftJoin('resume_data', 'applications.user_id', 'resume_data.user_id')
      .leftJoin('profiles', 'applications.user_id', 'profiles.user_id')
      .leftJoin('mock_interviews', function() {
        this.on('applications.user_id', '=', 'mock_interviews.user_id')
          .andOn('applications.job_id', '=', 'mock_interviews.job_id');
      })
      .where('jobs.posted_by', req.params.userId)
      .select(
        'applications.*',
        'jobs.title as job_title',
        'users.full_name as student_name',
        'users.email as student_email',
        'resume_data.raw_text as resume_text',
        'resume_data.extracted_json as resume_json',
        'resume_data.resume_url',
        'profiles.bio as student_bio',
        'profiles.experience_years',
        'mock_interviews.feedback_score as interview_score',
        'mock_interviews.feedback_details as interview_details',
        'applications.interview_offered',
        'applications.interview_completed'
      )
      .orderBy('applied_at', 'desc');
    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/applications/:id/interview-results', async (req, res) => {
  try {
    const application = await db('applications').where({ id: req.params.id }).first();
    if (!application) return res.status(404).json({ error: 'Application not found' });
    
    const results = await db('mock_interviews')
      .where({ user_id: application.user_id, job_id: application.job_id })
      .orderBy('created_at', 'desc')
      .first();
      
    res.json(results || null);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/applications/:id/request-interview', async (req, res) => {
  try {
    const application = await db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('applications.id', req.params.id)
      .select('applications.*', 'jobs.title as job_title', 'jobs.posted_by')
      .first();

    if (!application) return res.status(404).json({ error: 'Application not found' });

    await db('applications').where({ id: req.params.id }).update({ interview_offered: 1 });

    const interviewRequestMsg = `Hello! We've reviewed your application for the ${application.job_title} position and would like to invite you to a Mock Interview on our platform to evaluate your technical skills. Please go to the Mock Interview section and select this job role to begin.`;

    await db('messages').insert({
      sender_id: application.posted_by,
      receiver_id: application.user_id,
      content: interviewRequestMsg,
      context_type: 'application',
      context_id: application.id,
      is_read: false
    });

    await db('notifications').insert({
      user_id: application.user_id,
      title: 'Interview Requested',
      message: `A recruiter has requested a mock interview for the ${application.job_title} role.`,
      type: 'info'
    });

    res.json({ message: 'Interview requested and candidate notified' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/applications/:id/shortlist', async (req, res) => {
  const { message } = req.body;
  try {
    const application = await db('applications').where({ id: req.params.id }).first();
    if (!application) return res.status(404).json({ error: 'Application not found' });

    await db('applications').where({ id: req.params.id }).update({ status: 'shortlisted' });


    const job = await db('jobs').where({ id: application.job_id }).first();
    const user = await db('users').where({ id: application.user_id }).first();
    const defaultMessage = `Congratulations! You have been shortlisted for the ${job.title} position at ${job.company}.`;

    await db('messages').insert({
      sender_id: job.posted_by,
      receiver_id: application.user_id,
      content: message || defaultMessage,
      is_read: false
    });


    await db('messages').insert({
      sender_id: job.posted_by,
      receiver_id: job.posted_by,
      content: `You shortlisted ${user.full_name} for the ${job.title} role and notified the candidate.`,
      is_read: false
    });

    res.json({ message: 'Candidate shortlisted and notified' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { userId } = req.body;
  try {
    const job = await db('jobs').where({ id: req.params.id }).first();
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.posted_by !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this job' });
    }



    await db('applications').where({ job_id: req.params.id }).del();
    await db('jobs').where({ id: req.params.id }).del();

    res.json({ message: 'Job deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/applications/student/:userId', async (req, res) => {
  try {
    const applications = await db('applications')
      .join('jobs', 'applications.job_id', 'jobs.id')
      .where('applications.user_id', req.params.userId)
      .select(
        'applications.*',
        'jobs.title as job_title',
        'jobs.company as company_name',
        'jobs.location as job_location',
        'jobs.external_url',
        'applications.interview_offered',
        'applications.interview_completed'
      )
      .orderBy('applied_at', 'desc');
    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:jobId/apply', async (req, res) => {
  const { userId } = req.body;
  try {
    const existing = await db('applications').where({ job_id: req.params.jobId, user_id: userId }).first();
    if (existing) {
      return res.status(400).json({ error: 'You have already applied to this job.' });
    }

    let job = await db('jobs').where({ id: req.params.jobId }).first();
    
    // Fallback to check external_id if local id doesn't match
    if (!job) {
      job = await db('jobs').where({ external_id: req.params.jobId }).first();
    }

    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    // Use the actual internal database ID for the application record
    const internalJobId = job.id;

    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({ error: 'Applicant not found.' });
    }

    await db('applications').insert({
      job_id: internalJobId,
      user_id: userId,
      status: 'applied'
    });

    await db('messages').insert({
      sender_id: userId,
      receiver_id: job.posted_by,
      content: `${user.full_name} (${user.email}) has applied for the ${job.title} role.
Please review the application and respond accordingly.`,
      is_read: false
    });

    res.json({ message: 'Application submitted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;