import { useState } from 'react';
import { motion } from 'framer-motion';
import apiService from '../services/api';
import { useRole } from '../context/RoleContext';

export default function TranscriptionPage() {
  const { user } = useRole();
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      await apiService.youtube.transcribe(url, email);
      setStatus('success');
      setMessage('Transcription processing! Check your email shortly.');
      setUrl('');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setMessage(error.response?.data?.error?.message || 'Failed to request transcription.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl"
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-pink-600 mb-2">
              YouTube Transcription
            </h1>
            <p className="text-slate-400">
              Enter a video URL to get a full AI-powered transcription delivered to your inbox.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Video URL
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Recipient Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl font-bold text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Start Transcription'
              )}
            </button>

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200 text-center"
              >
                {message}
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-center"
              >
                {message}
              </motion.div>
            )}
          </form>
        </motion.div>
    </div>
  );
}
