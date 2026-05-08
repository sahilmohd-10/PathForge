import React, { useState } from 'react';
import { Loader2, FileText, CheckCircle, RefreshCcw } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TwilioShare from './TwilioShare';

interface CoverLetterGeneratorProps {
  jobId?: string | number;
  jobDescription: string;
  companyName: string;
  jobTitle: string;
  onGenerated?: (coverLetter: string) => void;
}

export const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({
  jobId,
  jobDescription,
  companyName,
  jobTitle,
  onGenerated
}) => {
  const { user } = useAuth();
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState('Professional');
  const [error, setError] = useState('');

  const generateLetter = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/ai/cover-letter', {
        userId: user.id,
        jobId,
        jobDescription,
        company: companyName,
        role: jobTitle,
        tone: tone // Note: Tone support can be added to backend prompt
      });
      
      setCoverLetter(response.data.coverLetter);
      if (onGenerated) onGenerated(response.data.coverLetter);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate cover letter.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="text-primary-600" />
          AI Cover Letter
        </h3>
        {coverLetter && (
          <span className="flex items-center text-emerald-600 text-sm font-semibold gap-1">
            <CheckCircle size={16} /> Generated
          </span>
        )}
      </div>

      {!coverLetter && !loading && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate a personalized cover letter based on your resume and this job's requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <select 
              value={tone} 
              onChange={(e) => setTone(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="Professional">Professional</option>
              <option value="Enthusiastic">Enthusiastic</option>
              <option value="Confident">Confident</option>
            </select>
            <button 
              onClick={generateLetter}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
            >
              Generate Letter
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="animate-spin text-primary-600 h-8 w-8 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 animate-pulse">Drafting your perfect cover letter...</p>
        </div>
      )}

      {error && (
        <div className="text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {coverLetter && !loading && (
        <div className="space-y-4">
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            className="w-full h-64 p-4 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 outline-none resize-y"
          />
          <div className="flex justify-between items-center">
            {user && (
              <TwilioShare 
                userId={user.id} 
                featureName="Strategic Coverage Synthesis" 
                summary={`Cover Letter generated for ${jobTitle} at ${companyName}. Optimized for ATS filtering.`} 
              />
            )}
            <button 
              onClick={generateLetter}
              className="text-gray-500 hover:text-primary-600 font-semibold flex items-center gap-2 text-sm transition"
            >
              <RefreshCcw size={16} /> Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
