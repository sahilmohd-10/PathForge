import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import PageShell from '../components/PageShell';
import { Send, Loader2, Mic, MicOff, Video as VideoIcon, VideoOff, User, Sparkles, ChevronRight, Activity, Award, CheckCircle2, XCircle, Brain, MessageSquare, Zap, Target, Layout } from 'lucide-react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { motion, AnimatePresence } from 'framer-motion';
import TwilioShare from '../components/TwilioShare';

import { useSearchParams } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MockInterview = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId');
  const [jobId, setJobId] = useState<string | null>(initialJobId);
  const [jobRole, setJobRole] = useState(searchParams.get('role') || '');
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [scorecard, setScorecard] = useState<any>(null);
  const [flags, setFlags] = useState(0);
  const [warning, setWarning] = useState('');
  const [isLookingAway, setIsLookingAway] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);
  const lastFlagTimeRef = useRef<number>(0);
  
  useEffect(() => {
    // Pre-load voices to ensure they are available for speakText
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    if (isStarted && !scorecard) {
      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });
      faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      faceMesh.onResults((results) => {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
        const landmarks = results.multiFaceLandmarks[0];
        const leftIris = landmarks[468];
        const leftEyeInner = landmarks[133];
        const leftEyeOuter = landmarks[33];
        const leftEyeWidth = Math.abs(leftEyeInner.x - leftEyeOuter.x);
        const leftGazeRatio = (leftIris.x - Math.min(leftEyeInner.x, leftEyeOuter.x)) / leftEyeWidth;
        if (leftGazeRatio < 0.35 || leftGazeRatio > 0.65) {
          setIsLookingAway(true);
          const now = Date.now();
          if (now - lastFlagTimeRef.current > 5000) {
            setFlags(f => f + 1);
            setWarning('Maintain eye contact!');
            setTimeout(() => setWarning(''), 3000);
            lastFlagTimeRef.current = now;
          }
        } else {
          setIsLookingAway(false);
        }
      });
      faceMeshRef.current = faceMesh;
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(mediaStream => {
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          const runDetection = async () => {
            if (videoRef.current && isStarted && faceMeshRef.current && !scorecard) {
              try { await faceMesh.send({ image: videoRef.current }); } catch (e) {}
              requestAnimationFrame(runDetection);
            }
          };
          requestAnimationFrame(runDetection);
        }
      });
      return () => {
        if (stream) stream.getTracks().forEach(track => track.stop());
        if (faceMeshRef.current) faceMeshRef.current.close();
      };
    }
  }, [isStarted, scorecard]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsAiSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a high-quality female voice
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('samantha') || 
        v.name.toLowerCase().includes('zira') ||
        v.name.toLowerCase().includes('victoria') ||
        v.name.toLowerCase().includes('siri') ||
        v.name.toLowerCase().includes('karen') ||
        v.name.toLowerCase().includes('moira')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      utterance.rate = 1.0;
      utterance.pitch = 1.1; // Slightly higher pitch for a clearer female persona
      
      utterance.onend = () => { 
        setIsAiSpeaking(false); 
        // Small delay before listening to avoid hearing own voice
        setTimeout(startListening, 300);
      };
      
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        setIsAiSpeaking(false);
        startListening();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      startListening();
    }
  };

  const startInterview = () => {
    if (!jobRole) return;
    setIsStarted(true);
    const greeting = `Hello! I am Sarah. Let's begin the session for the ${jobRole} position. Could you introduce yourself?`;
    setMessages([{ role: 'assistant', content: greeting }]);
    speakText(greeting);
  };

  const endInterview = async () => {
    setIsFinishing(true);
    if (stream) stream.getTracks().forEach(track => track.stop());
    window.speechSynthesis.cancel();
    try {
      const transcript = messages.map(m => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n\n');
      const response = await axios.post('/api/ai/mock-interview', { userId: user?.id, jobRole, transcript, jobId });
      setScorecard(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFinishing(false);
    }
  };

  const sendMessage = async (currentInput: string = input) => {
    if (!currentInput.trim() || isGenerating) return;
    const finalInput = currentInput.trim();
    const newMessages = [...messages, { role: 'user' as const, content: finalInput }];
    setMessages(newMessages);
    setInput('');
    setIsGenerating(true);
    try {
      const response = await axios.post('/api/ai/mock-interview/next-question', {
        jobRole,
        transcript: newMessages.map(m => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n\n')
      });
      
      const { feedback, accuracyScore, idealAnswer, nextQuestion } = response.data;
      
      const assistantResponse = `[Accuracy: ${accuracyScore}%] ${feedback}\n\nIdeal Answer: ${idealAnswer}\n\nNext Question: ${nextQuestion}`;
      
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: assistantResponse,
      } as any]);
      
      speakText(`${feedback}. Your answer was about ${accuracyScore} percent correct. The ideal answer is: ${idealAnswer}. Now, ${nextQuestion}`);
    } catch (err) {
      console.error(err);
      const fallback = "Tell me more about your experience.";
      setMessages([...newMessages, { role: 'assistant', content: fallback }]);
      speakText(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  const silenceTimeoutRef = useRef<any>(null);
  const currentInputRef = useRef<string>('');

  // Keep ref in sync with input state for the timeout callback
  useEffect(() => {
    currentInputRef.current = input;
  }, [input]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      // Clear silence timeout on any speech activity
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      let fullTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        fullTranscript += event.results[i][0].transcript;
      }
        
      if (fullTranscript.trim()) {
        setInput(fullTranscript);
        currentInputRef.current = fullTranscript; // Update ref immediately
        
        // Start 3-second silence timer
        silenceTimeoutRef.current = setTimeout(() => {
          if (currentInputRef.current.trim() && !isGenerating) {
            console.log('Silence detected, auto-sending message:', currentInputRef.current);
            sendMessage(currentInputRef.current);
            // Stop listening to avoid capturing Sarah's voice or background noise
            try { recognition.stop(); } catch (e) {}
          }
        }, 3000);
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) {}
  };

  return (
    <PageShell title="Mock Interview" subtitle="Experience high-fidelity AI-driven technical evaluations">
      <div className="max-w-6xl mx-auto">
        {!isStarted && !scorecard && !isFinishing && (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-16 text-center">
            <div className="w-32 h-32 mx-auto mb-10 relative">
              <div className="absolute inset-0 bg-[#0081C9] rounded-full blur-2xl opacity-10 animate-pulse"></div>
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200" alt="Sarah" className="w-full h-full object-cover rounded-full border-4 border-white shadow-xl relative z-10" />
            </div>
            <h2 className="text-4xl font-black text-[#0f172a] mb-4">Sarah is Ready to Begin</h2>
            <p className="text-slate-500 font-bold max-w-md mx-auto mb-10">Analyze technical depth and communication precision in a professional AI environment.</p>
            <div className="max-w-md mx-auto space-y-4">
              <input type="text" placeholder="Target Role (e.g. AI Engineer)" className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#0081C9] outline-none transition-all font-bold text-center text-lg" value={jobRole} onChange={e => setJobRole(e.target.value)} />
              <button onClick={startInterview} disabled={!jobRole} className="w-full py-5 bg-[#0081C9] text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:bg-[#0070B0] transition-all">
                Start Interview
              </button>
            </div>
          </div>
        )}

        {isStarted && !scorecard && !isFinishing && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="relative bg-slate-950 rounded-[32px] overflow-hidden shadow-2xl aspect-video">
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div animate={{ scale: isAiSpeaking ? 1.05 : 1 }} className="relative">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800" className={`w-48 h-48 rounded-full object-cover border-4 transition-all duration-500 ${isAiSpeaking ? 'border-[#0081C9] shadow-[0_0_30px_rgba(0,129,201,0.5)]' : 'border-slate-800'}`} />
                  </motion.div>
                </div>
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
                  <button 
                    onClick={() => {
                      if (isListening) {
                        recognitionRef.current?.stop();
                        setIsListening(false);
                      } else {
                        startListening();
                      }
                    }} 
                    className={`p-4 rounded-xl transition-all ${isListening ? 'bg-indigo-600 text-white animate-pulse shadow-[0_0_20px_rgba(79,70,229,0.4)]' : (isMicOn ? 'bg-white/10 text-white' : 'bg-rose-500 text-white')}`}
                  >
                    {isListening ? <Mic size={20} /> : (isMicOn ? <Mic size={20} /> : <MicOff size={20} />)}
                  </button>
                  <button onClick={() => setIsVideoOn(!isVideoOn)} className={`p-4 rounded-xl ${isVideoOn ? 'bg-white/10 text-white' : 'bg-rose-500 text-white'}`}><VideoIcon size={20} /></button>
                  <button onClick={endInterview} className="px-6 py-4 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest">End Session</button>
                </div>
                <div className="absolute top-8 right-8 w-40 aspect-video bg-slate-900 rounded-xl overflow-hidden border border-white/10">
                  <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!isVideoOn ? 'opacity-0' : 'opacity-100'}`} />
                </div>
              </div>
              {warning && <div className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest p-4 rounded-2xl text-center shadow-lg">{warning}</div>}
            </div>
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col h-[500px] overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-900">Live Transcript</span>
                <span className="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded animate-pulse">LIVE</span>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{msg.role === 'assistant' ? 'Sarah' : 'You'}</span>
                    <div className={`p-4 rounded-2xl text-sm font-bold shadow-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#0081C9] text-white rounded-tr-none' : 'bg-slate-50 text-slate-900 rounded-tl-none border border-slate-100'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-slate-50">
                <div className="relative">
                  <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Speak or type..." className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none" />
                  <button onClick={() => sendMessage()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#0081C9] text-white rounded-lg"><Send size={18} /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isFinishing && (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-20 text-center flex flex-col items-center justify-center space-y-8">
            <div className="w-20 h-20 rounded-full border-4 border-[#0081C9]/20 border-t-[#0081C9] animate-spin"></div>
            <div>
              <h2 className="text-3xl font-black text-[#0f172a] mb-2">Analyzing Performance</h2>
              <p className="text-slate-500 font-bold">Synthesizing technical depth and communication metrics...</p>
            </div>
          </div>
        )}

        {scorecard && (
          <div className="space-y-10">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <Brain className="text-[#0081C9]" size={24} />
                <h3 className="text-2xl font-black text-[#0f172a]">Mock Interview Results</h3>
              </div>
              {user && (
                <TwilioShare 
                  userId={user.id} 
                  featureName="Interview Intelligence" 
                  summary={`Evaluation Score: ${scorecard.score}%. Feedback: ${scorecard.feedback?.substring(0, 100) || 'Analysis complete'}`} 
                />
              )}
            </div>

            {/* Main Evaluation Card (Image 6) */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="p-10 border-b border-slate-50 flex items-center gap-3">
                <Target className="text-[#0081C9]" size={20} />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Architected Evaluation</h4>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-5 p-12 bg-slate-50 border-r border-slate-100 flex flex-col items-center justify-center text-center">
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 border-4 border-slate-100">
                    <span className="text-5xl font-black text-[#0081C9]">{(scorecard.score / 10).toFixed(1)}</span>
                  </div>
                  <h4 className="text-xl font-black text-[#0f172a] mb-2">AI Evaluation</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PERFORMANCE SCORE</p>
                </div>
                <div className="lg:col-span-7 p-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h5 className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                      <CheckCircle2 size={16} /> Strengths
                    </h5>
                    <ul className="space-y-4">
                      {(scorecard.strengths || ['Technical Depth', 'Communication', 'Problem Solving']).map((s: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm font-bold text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-6">
                    <h5 className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-widest">
                      <XCircle size={16} /> Weaknesses
                    </h5>
                    <ul className="space-y-4">
                      {(scorecard.areas_for_improvement || scorecard.weaknesses || ['Speed', 'Complexity', 'Clarity']).map((s: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm font-bold text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <MetricBox label="TECHNICAL SKILLS" value="85%" icon={<Zap className="text-blue-500" />} />
              <MetricBox label="SOFT SKILLS" value="90%" icon={<MessageSquare className="text-emerald-500" />} />
              <MetricBox label="IMPACT" value="75%" icon={<Target className="text-indigo-500" />} />
            </div>

            <button onClick={() => { setScorecard(null); setIsStarted(false); setJobRole(''); setMessages([]); }} className="w-full py-5 bg-[#0F172A] text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all">
              Start New Evaluation Session
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
};

const MetricBox = ({ label, value, icon }: any) => (
  <div className="bg-white rounded-[32px] p-10 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-[#0081C9]/30 transition-all">
    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-50 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h4 className="text-3xl font-black text-[#0f172a] mb-2">{value}</h4>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
  </div>
);

export default MockInterview;
