import React, { useState, FormEvent, useEffect } from 'react';
import backendApi from '../services/backendApi';

type AuthView = 'login' | 'register' | 'forgotPassword' | 'forgotPasswordSuccess';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, username: string) => void;
  onRegisterSuccess: (token: string, username: string) => void;
  initialView?: 'login' | 'register';
}

const CloseIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess, onRegisterSuccess, initialView = 'login' }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState<AuthView>(initialView);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  const handleLogin = async () => {
    const response = await backendApi.auth.login({ email, password });
    onLoginSuccess(response.data.token, response.data.user.username);
    console.log('AuthModal: Calling onLoginSuccess with token and username:', response.data.token, response.data.user.username);
  };

  const handleRegister = async () => {
    const response = await backendApi.auth.register({ email, password, username });
    onRegisterSuccess(response.data.token, response.data.user.username);
  };

  const handleForgotPassword = async () => {
    await backendApi.auth.forgotPassword(email);
    setView('forgotPasswordSuccess');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (view === 'register' && /\s/.test(username)) {
      setError("Username cannot contain spaces.");
      return;
    }

    setLoading(true);

    try {
      if (view === 'register') {
        await handleRegister();
      } else if (view === 'login') {
        await handleLogin();
      } else if (view === 'forgotPassword') {
        await handleForgotPassword();
      }

      if (view !== 'forgotPassword') {
        // Clear fields and close on success, except for forgot password
        setEmail('');
        setUsername('');
        setPassword('');
        onClose();
      }
    } catch (err: any) {
      console.error('Authentication error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setView('login');
    setError('');
    onClose();
  };

  const getTitle = () => {
    if (view === 'register') return 'Register';
    if (view === 'forgotPassword') return 'Forgot Password';
    if (view === 'forgotPasswordSuccess') return 'Check Your Email';
    return 'Login';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={handleClose}></div>
      
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl shadow-xl transform transition-all">
        <header className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">{getTitle()}</h2>
          <button onClick={handleClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
            <CloseIcon />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6">
          {view === 'forgotPasswordSuccess' ? (
            <div className="text-center">
              <p>If an account with that email exists, we've sent a link to reset your password.</p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-4 w-full p-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition"
              >
                Close
              </button>
            </div>
          ) : view === 'forgotPassword' ? (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Enter your email address and we'll send you a link to reset your password.</p>
              <div className="mb-4">
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Email"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full p-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition disabled:bg-blue-300"
                  disabled={loading || !email}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
              <div className="mt-4 text-center">
                <button type="button" onClick={() => setView('login')} className="text-blue-500 text-sm hover:underline">
                  Back to Login
                </button>
              </div>
            </>
          ) : (
            <>
              {view === 'register' && (
                <div className="mb-4">
                  <label htmlFor="username" className="sr-only">Username</label>
                  <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Username" required />
                </div>
              )}
              <div className="mb-4">
                <label htmlFor="email" className="sr-only">Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Email" required />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="sr-only">Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Password" required />
              </div>
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
              <div className="mt-6">
                <button type="submit" className="w-full p-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition disabled:bg-blue-300" disabled={loading || (!email || !password || (view === 'register' && !username))}>
                  {loading ? 'Loading...' : (view === 'register' ? 'Register' : 'Login')}
                </button>
              </div>
              <div className="mt-4 text-center">
                <button type="button" onClick={() => setView(view === 'login' ? 'register' : 'login')} className="text-blue-500 text-sm hover:underline">
                  {view === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
                </button>
              </div>
              {view === 'login' && (
                <div className="mt-2 text-center">
                  <button type="button" onClick={() => setView('forgotPassword')} className="text-blue-500 text-sm hover:underline">
                    Forgot Password?
                  </button>
                </div>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
