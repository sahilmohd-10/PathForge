import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, MessageSquare, ShieldCheck, Phone } from 'lucide-react';
import PageShell from '../components/PageShell';

interface Mentor {
  id: number;
  full_name: string;
  role: string;
  bio: string;
  avatar: string;
  phone: string;
}

const Network = () => {
  const { user } = useAuth();
  const mentors: Mentor[] = [
    { id: 1, full_name: 'Mohd Sahil', role: 'CSE Student at SMVDU', bio: 'Mentor focused on interview coaching and Data Analysis.', avatar: 'MS', phone: '6386241847' },
    { id: 2, full_name: 'Prakhar', role: 'CSE Student at SMVDU', bio: 'Mentor for career planning and resume optimization.', avatar: 'P', phone: '7006786719' },
    { id: 3, full_name: 'Vishal Kharwar', role: 'CSE Student at SMVDU', bio: 'Mentor specializing in web development and algorithm practice.', avatar: 'VK', phone: '6387760119' }
  ];

  return (
    <PageShell
      title="Mentor Network"
      subtitle="Connect with CSE students and mentors from SMVDU. Reach out directly by phone or message."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Array.isArray(mentors) && mentors.map((mentor: Mentor) => (
          <div key={mentor.id} className="card-base card-hover p-8 text-center border border-gray-100 dark:border-neon-teal/20">
            <div className="h-20 w-20 bg-primary-100 dark:bg-neon-teal/20 rounded-full flex items-center justify-center text-primary-700 dark:text-neon-cyan text-2xl font-bold mx-auto mb-4 transition-colors duration-300">
              {mentor.avatar}
            </div>
            <div className="flex items-center justify-center mb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-neon-cyan">{mentor.full_name}</h3>
              <ShieldCheck className="h-5 w-5 text-primary-500 dark:text-neon-cyan ml-1" />
            </div>
            <p className="text-primary-600 dark:text-neon-cyan font-semibold text-sm mb-4 uppercase tracking-wider transition-colors duration-300">{mentor.role}</p>
            <p className="text-gray-500 dark:text-neon-light/70 text-sm mb-8 transition-colors duration-300">{mentor.bio}</p>
            
            <div className="flex gap-3">
              <a
                href={`tel:+91${mentor.phone}`}
                className="btn-primary flex-1 py-3"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Mentor
              </a>
              <a
                href={`sms:+91${mentor.phone}`}
                className="btn-secondary py-3 px-4 flex items-center gap-2 justify-center"
              >
                <MessageSquare className="h-5 w-5" />
                SMS
              </a>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
};

export default Network;

