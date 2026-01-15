import React, { useState } from 'react';
import { ArrowRight, UserCircle2, XCircle, HelpCircle, RefreshCw, Check, Mail, AlertCircle, User } from 'lucide-react';
import { authService } from '../../services/api';

interface LoginScreenProps {
  mode: 'full' | 'partial';
  savedUsername?: string;
  onLogin: (user: { username: string; avatar?: string }) => void;
  onSwitchAccount: () => void;
  onForgotPassword: () => void;
  userAvatar?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  mode,
  savedUsername,
  onLogin,
  onSwitchAccount,
  onForgotPassword,
  userAvatar
}) => {
  // View State
  const [view, setView] = useState<'login' | 'forgot' | 'success'>('login');

  // Login Form State
  const [username, setUsername] = useState(savedUsername || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recovery Form State
  const [recoveryEmail, setRecoveryEmail] = useState('');

  // --- Handlers ---

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'full' && !username.trim()) return;
    if (!password.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authService.login(username, password);

      if (response.success && response.user) {
        onLogin({
            username: response.user.username,
            avatar: response.user.avatar
        });
      } else {
        setError(response.message || 'Invalid credentials');
        setPassword('');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!recoveryEmail.trim()) return;
      
      setIsSubmitting(true);
      setTimeout(() => {
          setIsSubmitting(false);
          setView('success');
          onForgotPassword(); // Trigger the parent action (e.g., sending email logic)
      }, 1500);
  };

  const resetView = () => {
      setView('login');
      setError(null);
      setPassword('');
      setRecoveryEmail('');
  };

  // --- Render Helpers ---

  const renderAvatar = () => (
    <div className="mb-6 relative group transition-all duration-500">
      <div className="w-24 h-24 rounded-full overflow-hidden shadow-2xl border border-white/20 relative flex items-center justify-center bg-white/5 backdrop-blur-md">
         {view === 'success' ? (
             <div className="w-full h-full bg-green-500/80 flex items-center justify-center backdrop-blur-md">
                 <Check size={40} className="text-white" />
             </div>
         ) : view === 'forgot' ? (
             <div className="w-full h-full bg-orange-500/80 flex items-center justify-center backdrop-blur-md">
                 <HelpCircle size={40} className="text-white" />
             </div>
         ) : (mode === 'partial' && userAvatar) ? (
            <img 
                src={userAvatar} 
                className="w-full h-full object-cover"
                alt="User Avatar"
            />
         ) : (
            <User size={48} className="text-white/80" />
         )}
      </div>
    </div>
  );

  return (
    <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-black/20 backdrop-blur-md transition-all duration-500">
      
      {/* Dynamic Avatar */}
      {renderAvatar()}

      {/* --- VIEW: LOGIN --- */}
      {view === 'login' && (
        <form onSubmit={handleLoginSubmit} className={`flex flex-col items-center w-full max-w-xs gap-3 ${error ? 'animate-shake' : ''}`}>
            
            {/* Username */}
            <div className="text-center mb-1">
            {mode === 'partial' ? (
                <h2 className="text-xl font-semibold text-white tracking-wide drop-shadow-md">{username}</h2>
            ) : (
                <input
                type="text"
                name="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                placeholder="Username"
                className="w-48 bg-white/20 hover:bg-white/30 text-white placeholder-white/70 text-center rounded-full py-1.5 px-4 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all border border-transparent focus:border-white/20 backdrop-blur-md"
                autoFocus
                autoComplete="username"
                />
            )}
            </div>

            {/* Password */}
            <div className="relative w-48 group">
            <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="Enter Password"
                className={`w-full bg-white/20 hover:bg-white/30 text-white placeholder-white/50 text-center rounded-full py-1.5 px-8 focus:outline-none focus:ring-2 transition-all border backdrop-blur-md ${error ? 'border-red-400/50 focus:ring-red-400/50' : 'border-transparent focus:ring-white/40 focus:border-white/20'}`}
                autoFocus={mode === 'partial'}
                autoComplete="current-password"
            />
            
            <button 
                type="submit"
                disabled={!password || isSubmitting}
                className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/80 hover:bg-white/20 transition-all ${!password ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                {isSubmitting ? (
                <RefreshCw size={14} className="animate-spin" />
                ) : (
                <ArrowRight size={14} className="ml-0.5" />
                )}
            </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-1.5 text-red-200 bg-red-900/40 px-3 py-1 rounded-md backdrop-blur-sm animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={12} />
                    <span className="text-xs font-medium">{error}</span>
                </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex flex-col items-center gap-4">
                <button 
                    type="button" 
                    onClick={() => setView('forgot')}
                    className="text-xs text-white/70 hover:text-white transition-colors font-light"
                >
                    Forgot Password?
                </button>

                {mode === 'partial' && (
                    <button
                        type="button"
                        onClick={onSwitchAccount}
                        className="flex flex-col items-center gap-1 group mt-4 opacity-70 hover:opacity-100 transition-opacity"
                    >
                        <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center bg-black/20 group-hover:bg-white/20 transition-colors backdrop-blur-sm">
                            <XCircle size={16} className="text-white" />
                        </div>
                        <span className="text-xs text-white font-medium">Switch User</span>
                    </button>
                )}
            </div>
        </form>
      )}

      {/* --- VIEW: FORGOT PASSWORD --- */}
      {view === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="flex flex-col items-center w-full max-w-xs gap-4 animate-fade-in">
             <div className="text-center mb-2">
                <h2 className="text-lg font-semibold text-white tracking-wide drop-shadow-md">Account Recovery</h2>
                <p className="text-xs text-white/70 mt-1">Enter your email to reset password</p>
             </div>

             <div className="relative w-56">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
                    <Mail size={14} />
                </div>
                <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white/20 hover:bg-white/30 text-white placeholder-white/50 rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition-all border border-transparent focus:border-white/20 backdrop-blur-md"
                    autoFocus
                />
             </div>

             <div className="flex items-center gap-4 mt-2">
                 <button 
                    type="button"
                    onClick={resetView}
                    className="px-4 py-1.5 rounded-full text-white/80 hover:bg-white/10 text-xs transition-colors"
                 >
                    Cancel
                 </button>
                 <button 
                    type="submit"
                    disabled={!recoveryEmail || isSubmitting}
                    className="px-6 py-1.5 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white rounded-full text-xs font-medium backdrop-blur-md transition-all flex items-center gap-2"
                 >
                    {isSubmitting ? 'Sending...' : 'Send Link'}
                    {isSubmitting && <RefreshCw size={12} className="animate-spin"/>}
                 </button>
             </div>
          </form>
      )}

      {/* --- VIEW: SUCCESS --- */}
      {view === 'success' && (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white tracking-wide drop-shadow-md">Check your email</h2>
                <p className="text-sm text-white/80 mt-2 max-w-[200px] leading-relaxed">
                    We've sent a recovery link to 
                    <br/><span className="font-medium">{recoveryEmail}</span>
                </p>
             </div>
             
             <button 
                onClick={resetView}
                className="mt-4 px-8 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full text-sm font-medium backdrop-blur-md transition-all"
             >
                Back to Login
             </button>
          </div>
      )}
      
      {/* Bottom Legal/Info */}
      <div className="absolute bottom-8 flex flex-col items-center">
         <p className="text-white/40 text-[10px] font-medium tracking-widest uppercase">MateOS</p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        .animate-fade-in {
            animation: fadeIn 0.3s ease-out forwards;
        }

        /* FIX: Override Browser Autofill Styles 
           Uses transition hack to delay the background color change indefinitely, 
           keeping the input transparent.
        */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-text-fill-color: white !important;
            transition: background-color 5000s ease-in-out 0s;
            caret-color: white;
        }
      `}</style>
    </div>
  );
};