import React, { useState } from 'react';
import { ArrowRight, UserCircle2, XCircle, HelpCircle, RefreshCw, ChevronLeft, Check, Mail } from 'lucide-react';

interface LoginScreenProps {
  mode: 'full' | 'partial';
  savedUsername?: string;
  onLogin: (username: string) => void;
  onSwitchAccount: () => void;
  onForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  mode,
  savedUsername,
  onLogin,
  onSwitchAccount,
  onForgotPassword
}) => {
  // View State
  const [view, setView] = useState<'login' | 'forgot' | 'success'>('login');

  // Login Form State
  const [username, setUsername] = useState(savedUsername || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recovery Form State
  const [recoveryEmail, setRecoveryEmail] = useState('');

  // --- Handlers ---

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'full' && !username.trim()) return;
    if (!password.trim()) return;

    setIsSubmitting(true);
    
    // Simulate network validation
    setTimeout(() => {
      if (password.length > 0) {
        onLogin(username);
      } else {
        setError(true);
        setIsSubmitting(false);
        setPassword('');
        setTimeout(() => setError(false), 500); 
      }
    }, 800);
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
      setError(false);
      setPassword('');
      setRecoveryEmail('');
  };

  // --- Render Helpers ---

  const renderAvatar = () => (
    <div className="mb-6 relative group transition-all duration-500">
      <div className="w-24 h-24 rounded-full overflow-hidden shadow-2xl border border-white/20 relative">
         {view === 'success' ? (
             <div className="w-full h-full bg-green-500/80 flex items-center justify-center backdrop-blur-md">
                 <Check size={40} className="text-white" />
             </div>
         ) : view === 'forgot' ? (
             <div className="w-full h-full bg-orange-500/80 flex items-center justify-center backdrop-blur-md">
                 <HelpCircle size={40} className="text-white" />
             </div>
         ) : (
            <>
                <img 
                    src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=300&auto=format&fit=crop" 
                    className="w-full h-full object-cover opacity-80"
                    alt="User Avatar"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <span className="text-white font-bold text-2xl drop-shadow-md">
                        {(username || 'User').charAt(0).toUpperCase()}
                    </span>
                </div>
            </>
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-48 bg-white/20 hover:bg-white/30 text-white placeholder-white/70 text-center rounded-full py-1.5 px-4 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all border border-transparent focus:border-white/20 backdrop-blur-md"
                autoFocus
                />
            )}
            </div>

            {/* Password */}
            <div className="relative w-48 group">
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                className="w-full bg-white/20 hover:bg-white/30 text-white placeholder-white/50 text-center rounded-full py-1.5 px-8 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all border border-transparent focus:border-white/20 backdrop-blur-md"
                autoFocus={mode === 'partial'}
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
                        <span className="text-[10px] text-white font-medium">Switch User</span>
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
      `}</style>
    </div>
  );
};