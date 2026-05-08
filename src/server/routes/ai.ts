import express from 'express';
import { aiService } from '../aiService.ts';
import db from '../db.ts';
import multer from 'multer';
import { twilioService } from '../twilioService.ts';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze-resume', async (req: any, res) => {
  const { userId, resumeText } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });
  if (!resumeText) return res.status(400).json({ error: 'No resume text provided' });

  try {
    const { ollamaService } = await import('../ollamaService.ts');
    const parsed = await ollamaService.parseResumeText(resumeText);
    
    // Map Llama 3 output to the expected format
    const analysis = {
      skills: parsed.skills || [],
      tools: parsed.tools || [],
      experience: parsed.experience_summary ? [parsed.experience_summary] : [],
      predicted_role: parsed.target_career || 'Technology Professional',
      resume_score: parsed.resume_score || 75,
      suggestions: [parsed.bio || 'Improve your resume descriptions.'],
      resume_breakdown: []
    };

    const careerMetrics = aiService.fallbackCareerAnalysis({
      skills: analysis.skills,
      experience: analysis.experience,
      personalInfo: { currentRole: parsed.current_role || '' }
    });

    await db('resume_data').insert({
      user_id: userId,
      raw_text: resumeText,
      extracted_json: JSON.stringify(analysis),
      resume_score: analysis.resume_score,
      suggestions: JSON.stringify(analysis.suggestions)
    }).onConflict('user_id').merge();

    await db('profiles').where({ user_id: userId }).update({
      job_readiness_score: analysis.resume_score
    });

    const existingCareerScore = await db('career_scores')
      .where({ user_id: userId, career_path: 'Resume Review' })
      .first();

    if (existingCareerScore) {
      await db('career_scores')
        .where({ id: existingCareerScore.id })
        .update({
          career_path: 'Resume Review',
          confidence_score: analysis.resume_score,
          market_fit_score: careerMetrics.market_fit_score,
          growth_potential: careerMetrics.growth_potential,
          churn_risk: careerMetrics.churn_risk,
          salary_min: careerMetrics.salary_prediction.min,
          salary_max: careerMetrics.salary_prediction.max,
          reasoning: JSON.stringify(careerMetrics.predictive_insights),
          created_at: new Date().toISOString()
        });
    } else {
      await db('career_scores').insert({
        user_id: userId,
        career_path: 'Resume Review',
        confidence_score: analysis.resume_score,
        market_fit_score: careerMetrics.market_fit_score,
        growth_potential: careerMetrics.growth_potential,
        churn_risk: careerMetrics.churn_risk,
        salary_min: careerMetrics.salary_prediction.min,
        salary_max: careerMetrics.salary_prediction.max,
        reasoning: JSON.stringify(careerMetrics.predictive_insights)
      });
    }

    // if (userId) {
    //   const summary = `Score: ${analysis.resume_score}%. Target: ${analysis.predicted_role}. Key Gap: ${analysis.suggestions[0]?.substring(0, 50)}...`;
    //   await twilioService.notifyUserFeatureUsage(userId, 'Career Identity Analysis', summary);
    // }

    res.json({ ...analysis, ...careerMetrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/career-guidance', async (req, res) => {
  const { userId, interests } = req.body;
  try {
    const resume = await db('resume_data').where({ user_id: userId }).first();
    const skills = await db('user_skills')
      .join('skills', 'user_skills.skill_id', 'skills.id')
      .where({ user_id: userId })
      .select('skills.name');

    const { ollamaService } = await import('../ollamaService.ts');
    const guidance = await ollamaService.generateCareerPaths({
      skills: skills.map(s => s.name),
      personalInfo: { careerGoal: (interests || []).join(', ') }
    }, resume?.raw_text || '');

    const formattedGuidance = guidance.map(p => ({
      career_path: p.path_name,
      confidence_score: 85,
      reasoning: p.description,
      required_skills: p.required_skills
    }));

    for (const path of formattedGuidance) {
      await db('career_scores').insert({
        user_id: userId,
        career_path: path.career_path,
        confidence_score: path.confidence_score,
        reasoning: path.reasoning
      });
    }

    // if (userId) {
    //   const pathNames = formattedGuidance.map(p => p.career_path).join(', ');
    //   const summary = `Architected paths for: ${pathNames}. primary logic: ${formattedGuidance[0].reasoning.substring(0, 40)}...`;
    //   await twilioService.notifyUserFeatureUsage(userId, 'Pathway Architect', summary);
    // }

    res.json(formattedGuidance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ml-analysis', async (req: any, res) => {
  const { userId, resumeText, profileData } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  try {
    const { ollamaService } = await import('../ollamaService.ts');
    const ollamaAnalysis = await ollamaService.generateComprehensiveAnalysis(profileData, profileData.careerGoal || 'Technology Professional');
    
    const mlAnalysis = {
        predicted_role: profileData.careerGoal || 'Technology Professional',
        market_fit_score: ollamaAnalysis.resume_score || 80,
        growth_potential: 85,
        churn_risk: 15,
        skill_match_score: 80,
        salary_prediction: { min: 60000, max: 120000, currency: 'USD' },
        top_matching_industries: ollamaAnalysis.eligible_positions.map((p: any) => ({ industry: p.position, match_percentage: 80 })),
        resume_breakdown: ollamaAnalysis.profile_breakdown || [],
        required_skills: [],
        missing_skills: [],
        ml_graph_data: [
          { name: 'Skill Match', value: 80 },
          { name: 'Market Fit', value: ollamaAnalysis.resume_score || 80 }
        ],
        predictive_insights: ollamaAnalysis.areas_of_improvement || []
    };

    // if (userId) {
    //   const summary = `Predictive Analysis complete. Market Fit: ${mlAnalysis.market_fit_score}%. Top Path: ${mlAnalysis.predicted_role}. Analysis synced with ML core.`;
    //   await twilioService.notifyUserFeatureUsage(userId, 'Predictive Talent Analytics', summary);
    // }

    res.json(mlAnalysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/unified-analysis', async (req: any, res) => {
  const { userId, resumeText, profileData } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  try {

    const { ollamaService } = await import('../ollamaService.ts');
    const { mlService } = await import('../mlService.ts');
    
    // 1. Get ML Model Predictions (Random Forest)
    const mlPredictions = await mlService.predict(profileData);
    
    // 2. Get LLM Analysis for qualitative data
    const parsed = await ollamaService.parseResumeText(resumeText);
    const analysis = {
      skills: parsed.skills || [],
      resume_score: parsed.resume_score || 75,
      suggestions: [parsed.bio || 'Improve descriptions'],
      predicted_role: mlPredictions.predicted_role || parsed.target_career || 'Technology Professional'
    };

    const mlAnalysis = {
      predicted_role: mlPredictions.predicted_role || parsed.target_career || 'Technology Professional',
      resume_breakdown: []
    };
    const predictedRole = mlAnalysis.predicted_role;

    const ollamaAnalysis = await ollamaService.generateComprehensiveAnalysis(profileData, predictedRole);

    const unifiedResults = {
      resumeScore: ollamaAnalysis.resume_score || analysis.resume_score,
      overallImprovements: ollamaAnalysis.areas_of_improvement && ollamaAnalysis.areas_of_improvement.length > 0
        ? ollamaAnalysis.areas_of_improvement
        : analysis.suggestions,
      mlPredictions: {
        ...mlAnalysis,
        market_fit_score: mlPredictions.confidence ? Math.round(mlPredictions.confidence * 100) : (ollamaAnalysis.market_fit_score || 85),
        growth_potential: mlPredictions.growth_potential || ollamaAnalysis.growth_potential || 85,
        churn_risk: ollamaAnalysis.churn_risk || 15,
        skill_match_score: mlPredictions.confidence ? Math.round(mlPredictions.confidence * 100) : (ollamaAnalysis.skill_match_score || 85),
        salary_prediction: mlPredictions.predicted_salary_range 
          ? { min: parseInt(mlPredictions.predicted_salary_range.split('-')[0].replace(/\D/g, '')), max: parseInt(mlPredictions.predicted_salary_range.split('-')[1].replace(/\D/g, '')), currency: 'USD' }
          : (ollamaAnalysis.salary_prediction || { min: 60000, max: 120000, currency: 'USD' }),
        resume_breakdown: ollamaAnalysis.profile_breakdown && ollamaAnalysis.profile_breakdown.length > 0
          ? ollamaAnalysis.profile_breakdown
          : mlAnalysis.resume_breakdown
      },
      predictedRole: predictedRole,
      skillGaps: ollamaAnalysis.skill_gaps || [],
      recommendedCourses: ollamaAnalysis.recommended_courses || [],
      eligiblePositions: ollamaAnalysis.eligible_positions || [],
      jobDescription: ollamaAnalysis.job_description || 'No description available.',
    };

    // if (userId) {
    //   const summary = `Readiness: ${unifiedResults.resumeScore}%. Target: ${unifiedResults.predictedRole}. Market Fit: ${unifiedResults.mlPredictions.market_fit_score}%.`;
    //   await twilioService.notifyUserFeatureUsage(userId, 'Unified Talent Profiling', summary);
    // }

    res.json(unifiedResults);
  } catch (error: any) {
    console.error('Unified analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete unified analysis' });
  }
});


router.post('/upload-resume', upload.single('resume'), async (req: any, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });
  if (!req.file) return res.status(400).json({ error: 'No resume file provided' });

  const parsedUserId = parseInt(userId, 10);
  if (isNaN(parsedUserId)) return res.status(400).json({ error: 'Invalid User ID' });

  try {
    const userExists = await db('users').where({ id: parsedUserId }).first();
    if (!userExists) {
      return res.status(401).json({ error: 'User not found in database. Please log out and log in again.' });
    }
    let resumeText = '';

    if (req.file.mimetype === 'application/pdf') {
      try {
        console.log('📄 Parsing PDF resume using PDFParse class...');
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data: req.file.buffer });
        const textResult = await parser.getText();
        resumeText = textResult.text;
        console.log('✅ PDF parsed successfully, text length:', resumeText.length);
      } catch (pdfErr: any) {
        console.error('❌ PDF parsing failed:', pdfErr);
        return res.status(500).json({ error: 'Failed to extract text from PDF' });
      }
    } else if (req.file.mimetype === 'text/plain') {
      resumeText = req.file.buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Please upload PDF or TXT.' });
    }

    if (!resumeText.trim()) {
      console.warn('⚠️ Resume text extraction yielded empty string.');
      return res.status(400).json({ error: 'Resume file appears to be empty or contains no readable text.' });
    }

    const { ollamaService } = await import('../ollamaService.ts');
    console.log(`🧠 Sending ${resumeText.length} characters of resume text to AI for parsing...`);
    const parsed = await ollamaService.parseResumeText(resumeText);
    console.log('✅ AI parsing completed successfully.');

    let resumeUrl = '';
    if (req.file) {
      const fileName = `resume_${parsedUserId}_${Date.now()}${path.extname(req.file.originalname)}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, req.file.buffer);
      resumeUrl = `/uploads/${fileName}`;
    }

    await db('resume_data').insert({
      user_id: parsedUserId,
      raw_text: resumeText,
      extracted_json: JSON.stringify(parsed),
      resume_score: parsed.resume_score || 0,
      suggestions: parsed.career_goal || '',
      resume_url: resumeUrl,
      updated_at: new Date()
    }).onConflict('user_id').merge();


    const profileUpdate: any = {};
    if (parsed.bio) profileUpdate.bio = parsed.bio;
    if (parsed.target_career) profileUpdate.target_career = parsed.target_career;
    if (parsed.education) profileUpdate.education = parsed.education;
    if (parsed.experience_years !== undefined) profileUpdate.experience_years = parsed.experience_years;
    if (parsed.location) profileUpdate.location = parsed.location;
    if (parsed.website) profileUpdate.website = parsed.website;
    if (parsed.resume_score) profileUpdate.job_readiness_score = parsed.resume_score;

    if (Object.keys(profileUpdate).length > 0) {
      await db('profiles').where({ user_id: parsedUserId }).update(profileUpdate);
    }


    if (parsed.skills && Array.isArray(parsed.skills) && parsed.skills.length > 0) {
      for (const skillName of parsed.skills) {
        if (!skillName || typeof skillName !== 'string') continue;
        const trimmed = skillName.trim();
        if (!trimmed) continue;


        let skill = await db('skills').where({ name: trimmed }).first();
        if (!skill) {
          const [id] = await db('skills').insert({ name: trimmed, category: 'Parsed from Resume' });
          skill = { id };
        }


        const existing = await db('user_skills').where({ user_id: parsedUserId, skill_id: skill.id }).first();
        if (!existing) {
          await db('user_skills').insert({ user_id: parsedUserId, skill_id: skill.id, proficiency_level: 50 });
        }
      }
    }

    res.json({
      message: 'Resume processed successfully and profile updated',
      parsed
    });
  } catch (error: any) {
    console.error('Resume upload/parse error:', error);
    res.status(500).json({ error: error.message || 'Failed to process resume' });
  }
});

router.post('/learning-roadmap', async (req: any, res) => {
  const { targetRole, currentSkills, userId } = req.body;
  try {
    const { ollamaService } = await import('../ollamaService.ts');
    const roadmapData = await ollamaService.generateLearningRoadmap(targetRole, currentSkills);
    
    // Save to DB
    if (userId) {
      await db('learning_roadmaps').insert({
        user_id: userId,
        target_role: targetRole,
        roadmap_json: JSON.stringify(roadmapData),
        status: 'in_progress'
      });
      // await twilioService.notifyUserFeatureUsage(userId, 'Career Acceleration Engine', `Strategic Role: ${targetRole}. Vector Roadmap complete with ${roadmapData.roadmap?.length || 0} specialized milestones.`);
    }
    
    res.json(roadmapData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/mock-interview', async (req: any, res) => {
  const { jobRole, transcript, userId, jobId } = req.body;
  try {
    const { ollamaService } = await import('../ollamaService.ts');
    const feedback = await ollamaService.generateMockInterviewFeedback(jobRole, transcript);
    
    if (userId) {
      await db('mock_interviews').insert({
        user_id: userId,
        job_id: jobId || null,
        job_role: jobRole,
        transcript: transcript,
        feedback_score: feedback.score,
        feedback_details: JSON.stringify(feedback)
      });
      if (jobId) await db('applications').where({ user_id: userId, job_id: jobId }).update({ interview_completed: 1 });
    // if (userId) {
    //   const summary = `Evaluation Score: ${feedback.score}%. Summary Insight: ${feedback.feedback.substring(0, 70)}...`;
    //   await twilioService.notifyUserFeatureUsage(userId, 'Interview Intelligence', summary);
    // }
    }
    
    res.json(feedback);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/mock-interview/next-question', async (req: any, res) => {
  const { jobRole, transcript } = req.body;
  try {
    const { ollamaService } = await import('../ollamaService.ts');
    const questionData = await ollamaService.generateNextInterviewQuestion(jobRole, transcript);
    res.json(questionData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cover-letter', async (req: any, res) => {
  const { userId, jobDescription, company, role, jobId } = req.body;
  try {
    const resume = await db('resume_data').where({ user_id: userId }).first();
    const resumeData = resume?.extracted_json ? JSON.parse(resume.extracted_json) : {};
    
    const { ollamaService } = await import('../ollamaService.ts');
    const coverLetter = await ollamaService.generateCoverLetter(resumeData, jobDescription, company, role);
    
    if (jobId) {
      // Create or update application with cover letter
      const existing = await db('applications').where({ job_id: jobId, user_id: userId }).first();
      if (existing) {
        await db('applications').where({ id: existing.id }).update({ cover_letter: coverLetter });
      } else {
        await db('applications').insert({
          job_id: jobId,
          user_id: userId,
          status: 'applied',
          cover_letter: coverLetter
        });
      }
    }
    
    // if (userId) {
    //   const summary = `Strategic Coverage Synthesis generated for ${role} at ${company}. Draft optimized for AI filtering systems.`;
    //   await twilioService.notifyUserFeatureUsage(userId, 'Strategic Coverage Synthesis', summary);
    // }

    res.json({ coverLetter });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/portfolio-evaluation', async (req: any, res) => {
  const { userId, githubUrl, portfolioUrl } = req.body;
  try {
    const profile = await db('profiles').where({ user_id: userId }).first() || {};
    
    // Fetch user skills to provide to the LLM
    const userSkills = await db('user_skills')
      .join('skills', 'user_skills.skill_id', 'skills.id')
      .where({ 'user_skills.user_id': userId })
      .select('skills.name');
      
    profile.skills = userSkills.map((s: any) => s.name);
    
    const { githubService } = await import('../githubService.ts');
    const githubData = await githubService.parseGithubProfile(githubUrl);
    
    const { ollamaService } = await import('../ollamaService.ts');
    const evaluation = await ollamaService.evaluatePortfolio(githubUrl, portfolioUrl, profile, githubData);
    
    await db('portfolio_evaluations').insert({
      user_id: userId,
      github_url: githubUrl,
      portfolio_url: portfolioUrl,
      score: evaluation.score,
      feedback: JSON.stringify(evaluation)
    }).onConflict('user_id').merge();
    
    // const summary = `Digital Asset Score: ${evaluation.score}%. Verified Repos: ${githubData.public_repos}. Feedback: ${evaluation.top_feedback?.substring(0, 50) || 'Optimization complete'}...`;
    // await twilioService.notifyUserFeatureUsage(userId, 'Digital Asset Validation', summary);

    res.json({
      ...evaluation,
      githubData
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

router.post('/resume-analyzer', async (req: any, res) => {
  const { userId, targetRole } = req.body;
  try {
    const resume = await db('resume_data').where({ user_id: userId }).first();
    if (!resume || !resume.raw_text) {
      return res.status(404).json({ error: 'No resume found. Please upload a resume in the Career Engine first.' });
    }
    
    const { ollamaService } = await import('../ollamaService.ts');
    const analysis = await ollamaService.analyzeResumeATS(resume.raw_text, targetRole);
    
    // if (userId) {
    //   const summary = `Match Score (${targetRole}): ${analysis.ats_score}%. Logic: ${analysis.overall_feedback.substring(0, 60)}...`;
    //   await twilioService.notifyUserFeatureUsage(userId, 'Algorithmic ATS Validation', summary);
    // }

    res.json(analysis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/send-summary-sms', async (req: any, res) => {
  const { userId, featureName, summary } = req.body;
  if (!userId || !featureName || !summary) {
    return res.status(400).json({ error: 'User ID, Feature Name, and Summary are required' });
  }

  try {
    await twilioService.notifyUserFeatureUsage(userId, featureName, summary);
    res.json({ success: true, message: 'SMS sent successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;