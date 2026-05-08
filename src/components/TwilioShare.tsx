import React, { useState } from 'react';
import { Send, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface TwilioShareProps {
  userId: number;
  featureName: string;
  summary: string;
}

const TwilioShare: React.FC<TwilioShareProps> = ({ userId, featureName, summary }) => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendMessage = async () => {
    if (!userId) {
      toast.error('User not logged in');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/ai/send-summary-sms', {
        userId,
        featureName,
        summary
      });
      setSent(true);
      toast.success('Summary sent via SMS!');
      setTimeout(() => setSent(false), 5000);
    } catch (error: any) {
      console.error('Failed to send SMS:', error);
      toast.error(error.response?.data?.error || 'Failed to send SMS. Check your phone number in profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSendMessage}
      disabled={loading || sent}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg ${
        sent 
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 cursor-default' 
          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100'
      }`}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={16} />
      ) : sent ? (
        <CheckCircle size={16} />
      ) : (
        <Send size={16} />
      )}
      {loading ? 'Sending...' : sent ? 'Sent Successfully' : 'Send to Phone'}
    </button>
  );
};

export default TwilioShare;
