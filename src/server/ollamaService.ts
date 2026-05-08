import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

let isOllamaAvailable = true;

async function callLLM(prompt: string, format?: "json"): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  const messages = [{ role: 'user', content: prompt }];

  if (groqKey) {
    console.log('⚡ Calling Groq Cloud API (fast)...');
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.1,
          response_format: format === 'json' ? { type: 'json_object' } : undefined
        })
      });
      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      }
      const errorData = await response.json().catch(() => ({}));
      console.warn(`Groq failed: ${response.statusText}`, errorData);
    } catch (e) {
      console.warn('Groq error:', e);
    }
  }

  if (openRouterKey) {
    console.log('🌐 Calling OpenRouter API (fallback)...');
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages,
          temperature: 0.1,
          response_format: format === 'json' ? { type: 'json_object' } : undefined
        })
      });
      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content;
      }
      const errorData = await response.json().catch(() => ({}));
      console.warn(`OpenRouter failed: ${response.statusText}`, errorData);
    } catch (e) {
      console.warn('OpenRouter error:', e);
    }
  }

  throw new Error('All AI providers failed or no API keys configured. Please add GROQ_API_KEY or OPENROUTER_API_KEY to .env');
}

export interface CareerInsight {
  type: 'prediction' | 'improvement' | 'insight' | 'path';
  title: string;
  description: string;
  actionItems?: string[];
  priority?: 'high' | 'medium' | 'low';
}

export interface CareerPathData {
  path_name: string;
  description: string;
  timeline_months: number;
  required_skills: string[];
  milestones: string[];
  resources: string[];
  estimated_salary_range: { min: number; max: number };
}

export const ollamaService = {
  async generatePredictiveInsights(profileData: any, resumeText: string): Promise<string> {
    const prompt = `You are an AI career advisor. Analyze this profile and generate 3-4 specific, data-driven predictive insights about career growth and recommended learning resources.

Profile:
- Current Role: ${profileData.personalInfo?.currentRole || 'Not specified'}
- Career Goal: ${profileData.personalInfo?.careerGoal || 'Not specified'}
- Experience Level: ${profileData.experienceLevel || 'Fresher'}
- Education: ${profileData.educationLevel || 'Not specified'}
- Skills: ${profileData.skills?.join(', ') || 'Not specified'}
- Tools: ${profileData.tools?.join(', ') || 'Not specified'}

Generate insights based on current market trends. Return ONLY valid JSON (no markdown):
{
  "insights": [
    {
      "title": "Specific insight title",
      "description": "Detailed analysis about market trends or career opportunities",
      "prediction": "Concrete prediction based on market demand",
      "confidence_percentage": 85
    }
  ],
  "recommended_courses": [
    {
      "name": "Course Name",
      "platform": "Coursera/Udemy/LinkedIn Learning/edX",
      "duration": "4-8 weeks",
      "level": "Beginner/Intermediate/Advanced",
      "relevance": "How this helps achieve career goal",
      "estimated_cost": "$0-$500"
    }
  ]
}`;

    const text = await callLLM(prompt);
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return JSON.stringify(parsed);
    } else {
      return JSON.stringify(JSON.parse(text));
    }
  },

  async generateImprovementTips(profileData: any, resumeText: string): Promise<string> {
    const prompt = `You are a career improvement coach. Analyze this profile and generate 5 specific, actionable improvement tips to advance their career.

Profile:
- Current Role: ${profileData.personalInfo?.currentRole || 'Not specified'}
- Skills: ${profileData.skills?.join(', ') || 'Not specified'}
- Experience Level: ${profileData.experienceLevel || 'Fresher'}
- Missing Skills: ${profileData.missingSkills?.join(', ') || 'None identified'}

Generate practical, personalized tips. Return ONLY valid JSON (no markdown):
{
  "improvement_tips": [
    {
      "area": "Specific improvement area",
      "tip": "Concrete, actionable improvement",
      "priority": "high/medium/low",
      "timeline": "When to implement",
      "expected_impact": "How this helps career"
    }
  ]
}`;

    const text = await callLLM(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return JSON.stringify(parsed);
    } else {
      return JSON.stringify(JSON.parse(text));
    }
  },

  async *generateLiveCareerInsights(userId: string, profileData: any, resumeText: string) {
    const prompt = `Generate 5-7 live career market insights based on this profile:

Current Role: ${profileData.personalInfo?.currentRole || 'Not specified'}
Career Goal: ${profileData.personalInfo?.careerGoal || 'Not specified'}
Skills: ${profileData.skills?.join(', ') || 'Not specified'}

Output exactly the specified number of JSON objects (one per line, no markdown):
{"insight_type": "market_trend", "title": "Title", "description": "Description"}
{"insight_type": "opportunity", "title": "Title", "description": "Description"}
{"insight_type": "salary_trend", "title": "Title", "description": "Description"}`;

    const text = await callLLM(prompt);
    
    const jsonLines = text.split('\n');
    for (const ln of jsonLines) {
        const t = ln.trim();
        if (t.startsWith('{') && t.endsWith('}')) {
            try {
                yield JSON.parse(t);
            } catch(e) {}
        }
    }
  },

  async generateCareerPaths(profileData: any, resumeText: string): Promise<CareerPathData[]> {
    const prompt = `You are a career development advisor. Generate 3 personalized career paths based on this profile:

Current Role: ${profileData.personalInfo?.currentRole || 'Not specified'}
Career Goal: ${profileData.personalInfo?.careerGoal || 'Not specified'}
Skills: ${profileData.skills?.join(', ') || 'Not specified'}
Experience Level: ${profileData.experienceLevel || 'Fresher'}

Create realistic, actionable career paths. Return ONLY valid JSON (no markdown):
{
  "career_paths": [
    {
      "path_name": "Specific Career Path Name",
      "description": "Detailed description of this path",
      "timeline_months": 24,
      "required_skills": ["Skill 1", "Skill 2", "Skill 3"],
      "milestones": ["Month 6 milestone", "Month 12 milestone", "Month 24 milestone"],
      "resources": ["Specific courses/books/resources"],
      "estimated_salary_range": {"min": 60000, "max": 120000}
    }
  ]
}`;

    const text = await callLLM(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      const parsed = JSON.parse(text);
      return parsed.career_paths || [];
    }
    const data = JSON.parse(jsonMatch[0]);
    return data.career_paths || [];
  },

  async analyzeSkillGaps(profileData: any): Promise<string> {
    const prompt = `You are a skills assessment expert. Analyze this profile and identify skill gaps, current strengths, and create a learning roadmap.

Current Skills: ${profileData.skills?.join(', ') || 'None specified'}
Target Role: ${profileData.personalInfo?.careerGoal || 'Not specified'}
Experience Level: ${profileData.experienceLevel || 'Fresher'}

Provide a comprehensive skill gap analysis. Return ONLY valid JSON (no markdown):
{
  "skill_gap_analysis": {
    "current_strengths": ["Skill 1", "Skill 2"],
    "critical_gaps": ["Most important missing skills"],
    "nice_to_have": ["Optional skills for advancement"],
    "learning_roadmap": [
      {
        "phase": "Phase name with timeline",
        "skills": ["Skills to develop in this phase"],
        "resources": ["Specific courses/books/resources"],
        "expected_outcome": "What learner should achieve"
      }
    ]
  }
}`;

    const text = await callLLM(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return JSON.stringify(parsed);
    } else {
      return JSON.stringify(JSON.parse(text));
    }
  },

  async generateComprehensiveAnalysis(profileData: any, predictedRole: string): Promise<any> {
    const prompt = `You are a career development advisor. Create a unified career analysis for the following profile.

Profile Details:
- Current Role: ${profileData.personalInfo?.currentRole || 'Not specified'}
- Career Goal: ${profileData.personalInfo?.careerGoal || 'Not specified'}
- Experience Summary: ${profileData.experience || 'Not specified'}
- Experience Level: ${profileData.experienceLevel || 'Fresher'}
- Target Highest Education: ${profileData.educationLevel || 'Not specified'}
- Semester: ${profileData.semester || 'N/A'}
- Skills: ${profileData.skills?.join(', ') || 'Not specified'}
- Tools: ${profileData.tools?.join(', ') || 'Not specified'}
- ML Predicted Career Path: ${predictedRole}

Provide a highly accurate and critical comprehensive analysis. You MUST return exactly:
- 5 actionable areas of improvement
- 5 items in the profile breakdown
- 5 specific skill gaps
- 8 recommended online courses with AUTHENTIC, WORKING URLs (e.g., Coursera, Udemy, edX, or official documentation)
- 10 eligible job positions

Return ONLY valid JSON (no markdown):
{
  "resume_score": 85,
  "areas_of_improvement": [
    "Actionable improvement tip 1",
    "Actionable improvement tip 2",
    "Actionable improvement tip 3",
    "Actionable improvement tip 4",
    "Actionable improvement tip 5"
  ],
  "profile_breakdown": [
    {"name": "Top Skill 1", "value": 85},
    {"name": "Top Skill 2", "value": 70},
    {"name": "Top Skill 3", "value": 90},
    {"name": "Top Skill 4", "value": 80},
    {"name": "Top Skill 5", "value": 75}
  ],
  "skill_gaps": [
    {
      "missing_skill": "Name of missing skill 1",
      "topics_to_cover": ["Topic 1", "Topic 2", "Topic 3"]
    }
  ],
  "recommended_courses": [
    {
      "name": "Course Name",
      "platform": "Coursera/Udemy",
      "duration": "8 weeks",
      "link": "https://www.coursera.org/learn/specific-course-slug"
    }
  ],
  "eligible_positions": [
    {
      "position": "Job Title 1",
      "other_skills_required": ["Skill 1", "Skill 2"]
    }
  ],
  "job_description": "A 3-5 sentence description of what the daily responsibilities are for the ML Predicted Career Path.",
  "market_fit_score": 85,
  "growth_potential": 90,
  "churn_risk": 15,
  "skill_match_score": 80,
  "salary_prediction": {
    "min": 60000,
    "max": 120000,
    "currency": "USD"
  }
}`;

    const text = await callLLM(prompt, "json");
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      return JSON.parse(text);
    }
  },

  async parseResumeText(resumeText: string): Promise<any> {
    const safeText = resumeText.substring(0, 3000);
    const prompt = `You are a resume parser. Extract structured information from the following resume text.

Resume Text:
---
${safeText}
---

Extract and return ONLY valid JSON (no markdown, no code fences):
{
  "full_name": "Candidate's full name",
  "email": "Email if found or empty string",
  "phone": "Phone if found or empty string",
  "location": "City, State/Country if found or empty string",
  "bio": "A 2-3 sentence professional summary based on the resume",
  "target_career": "The most likely target career/role based on experience and skills",
  "education": "Highest education qualification (e.g. B.Tech CSE, MCA, etc.)",
  "experience_years": 0,
  "skills": ["skill1", "skill2", "skill3"],
  "tools": ["tool1", "tool2"],
  "experience_summary": "A concise summary of work experience",
  "career_goal": "Inferred career goal based on resume trajectory",
  "current_role": "Current or most recent job title",
  "education_level": "B.Tech CSE or BCA or M.Tech or MCA or B.Sc IT or Self-taught + Certifications",
  "experience_level": "Fresher or 1-3 years or 3-5 years or 5+ years",
  "website": "Portfolio or LinkedIn URL if found or empty string",
  "resume_score": 85
}`;

    const text = await callLLM(prompt, "json");
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      return JSON.parse(text);
    }
  },

  async generateLearningRoadmap(targetRole: string, currentSkills: string[]): Promise<any> {
    const prompt = `You are an elite technical career coach creating a personalized, high-density learning roadmap.
User Target Role: ${targetRole}
Current Skills: ${currentSkills.join(', ')}

First, identify the critical skill gaps between their current skills and the target role. Then, formulate a comprehensive, structured step-by-step roadmap (provide at least 10-12 detailed steps) designed to close these gaps and reach senior-level mastery in the position. 

Constraints:
1. Do NOT use weeks or timelines; focus on technical milestones.
2. Each step's "description" MUST be a detailed technical paragraph (3-5 sentences) covering specific architectures, patterns, and deep-dive concepts.
3. Provide at least 2-3 high-quality resources per step.
4. The roadmap should progress from fundamental missing gaps to advanced system design and optimization.

Return ONLY a valid JSON object matching this exact structure:
{
  "roadmap": [
    {
      "step": 1,
      "focus": "Deep-dive focus area",
      "description": "Exhaustive technical details, specific sub-topics, and industry standards to master in this step.",
      "mini_project": "A high-complexity, portfolio-worthy project to validate these skills",
      "resources": [
        {
          "name": "Authoritative course/documentation name",
          "url": "https://actual-working-link.com"
        }
      ]
    }
  ]
}`;
    const text = await callLLM(prompt, "json");
    const jsonMatch = text.match(/[\{\[][\s\S]*[\}\]]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
  },

  async generateCoverLetter(resumeData: any, jobDescription: string, company: string, role: string): Promise<string> {
    const prompt = `You are an elite career advisor and professional copywriter.
Task: Write a highly tailored, persuasive, and professional cover letter.
Company: ${company}
Role: ${role}
Job Description: ${jobDescription}
Candidate Profile: ${JSON.stringify(resumeData)}

Guidelines:
- Start with a strong hook expressing enthusiasm for the company.
- Map the candidate's exact past experiences to the job requirements.
- Keep it concise, engaging, and confident (avoid cliché phrases).
- Output ONLY the raw text of the cover letter. Do not include markdown blocks or any introductory text.`;
    return await callLLM(prompt);
  },

  async generateNextInterviewQuestion(jobRole: string, transcript: string): Promise<any> {
    const prompt = `You are an elite technical interviewer hiring for a ${jobRole} position.
Analyze the following interview transcript. Focus specifically on the LAST response from the Candidate.

Transcript:
---
${transcript || '(Interview just started)'}
---

Your task:
1. Evaluate if the Candidate's LAST answer was technically correct and sufficient.
2. Provide a short verdict (e.g., "That's exactly right!" or "Actually, that's not quite correct.").
3. Calculate an 'accuracyScore' between 0 and 100 based on the technical correctness and completeness of the LAST response.
4. Provide the CORRECT answer or a more complete explanation in VERY EASY, simple language that a beginner can understand. This is the 'idealAnswer'.
5. Formulate the NEXT highly specific technical or scenario-based question for the ${jobRole} position.

Return ONLY a valid JSON object matching this structure:
{
  "isCorrect": true/false,
  "accuracyScore": 85,
  "feedback": "Short right/wrong message",
  "idealAnswer": "The perfectly correct answer explained simply",
  "nextQuestion": "The next technical question for the candidate"
}`;
    const text = await callLLM(prompt, "json");
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
  },

  async generateMockInterviewFeedback(jobRole: string, transcript: string): Promise<any> {
    const prompt = `You are a strict, senior technical interviewer at a top-tier tech company.
Job Role: ${jobRole}
Interview Transcript:
---
${transcript}
---

Evaluate the candidate's responses. Check for technical accuracy, clarity of thought, problem-solving skills, and communication.
Return ONLY a valid JSON object matching this exact structure:
{
  "score": 85,
  "feedback": "A comprehensive paragraph evaluating their strengths and technical accuracy.",
  "areas_for_improvement": ["Specific technical gap", "Communication tip"]
}`;
    const text = await callLLM(prompt, "json");
    const jsonMatch = text.match(/[\{\[][\s\S]*[\}\]]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
  },

  async evaluatePortfolio(githubUrl: string, portfolioUrl: string, profileData: any, githubData?: any): Promise<any> {
    const prompt = `You are an elite Technical Hiring Manager and a CTO with 20+ years of experience in high-growth tech companies. You are conducting a high-stakes audit of a candidate's digital engineering footprint.

CONTEXT:
- Candidate Name: ${profileData?.personalInfo?.fullName || 'Candidate'}
- Declared Skills: ${profileData?.skills ? profileData.skills.join(', ') : 'Unknown'}
- GitHub URL: ${githubUrl || 'Not provided'}
- Portfolio URL: ${portfolioUrl || 'Not provided'}

${githubData ? `INTERNAL SYSTEM REPOSITORY AUDIT (Deeply Parsed):
${JSON.stringify(githubData, null, 2)}` : 'NOTE: No direct GitHub data could be fetched. Evaluate based on the URL presence and stated skills.'}

YOUR TASK:
1. TECHNICAL AUDIT: Analyze the projects for technical complexity, stack relevance, and 'Proof of Work'. Distinguish between tutorial-based code and original engineering.
2. GAP ANALYSIS: Compare their declared skills against their actual repositories. Is there evidence they can actually use the tools they claim? Find the "Skill vs. Code" discrepancy.
3. RECRUITABILITY SCORE: Assign a score (0-100) based on how quickly a Tier-1 tech company (like Google, Stripe, or OpenAI) would hire them based on this public evidence.
4. ACTIONABLE ROADMAP: Provide brutal but constructive feedback. Suggest high-impact projects that would solve their specific "Proof of Work" gaps.

OUTPUT REQUIREMENTS:
- Return ONLY a valid JSON object.
- Use professional, punchy, and highly technical language.

{
  "score": 85,
  "feedback": "A high-level executive summary of their engineering presence (3-4 sentences).",
  "technical_depth_analysis": "Specific analysis of their code complexity, architectural choices, and repository hygiene based on the parsed data.",
  "projects": [
    {
      "name": "Project Name",
      "overview": "A brief overview of what the project does and its engineering significance.",
      "tools_used": ["React", "TypeScript", "TailwindCSS"],
      "impact": "The technical complexity or user impact of this specific repo."
    }
  ],
  "proof_of_work_status": "Briefly state if their GitHub proves their skills or if it looks like 'Tutorial Hell'.",
  "strengths": ["Identify 3 specific, evidence-based engineering strengths"],
  "weaknesses": ["Identify 3 critical gaps in their public presence or technical evidence"],
  "project_ideas": [
    {
      "title": "Project Title",
      "description": "A high-complexity project idea that directly addresses a skill gap found in their audit.",
      "stack": "Recommended technologies",
      "difficulty": "Intermediate/Advanced"
    }
  ],
  "portfolio_tips": ["3 specific tips to improve their READMEs, commit history, or portfolio site"]
}`;
    const text = await callLLM(prompt, "json");
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
  },

  async analyzeResumeATS(resumeText: string, targetRole: string): Promise<any> {
    const prompt = `You are an expert ATS (Applicant Tracking System) algorithm and a Senior Tech Recruiter.
Target Role: ${targetRole || 'Software Engineer'}
Resume Text:
---
${resumeText}
---

Your task: Perform a strict ATS parse and human recruiter review of this resume for the target role.
1. Calculate an accurate ATS Match Score (0-100) based on keyword matching, formatting readability, and impact.
2. Identify 3 specific bullet points or formatting issues that hurt the score.
3. Provide 3 exact action items to fix the resume.
4. List keywords that are completely missing.

Return ONLY a valid JSON object exactly like this:
{
  "ats_score": <Insert an accurate integer between 0 and 100 based on the match>,
  "overall_feedback": "A paragraph explaining why the score isn't higher.",
  "critical_mistakes": ["Mistake 1", "Mistake 2", "Mistake 3"],
  "actionable_improvements": ["Fix 1", "Fix 2", "Fix 3"],
  "missing_keywords": ["Keyword 1", "Keyword 2"]
}`;
    const text = await callLLM(prompt, "json");
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
  }
};

export { isOllamaAvailable };