import React, { useState, FormEvent } from 'react';
import backendApi from '../services/backendApi';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, username: string) => void;
  onRegisterSuccess: (token: string, username: string) => void;
}

const CloseIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess, onRegisterSuccess }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        const response = await backendApi.auth.register({ email, password, username });
        onRegisterSuccess(response.data.token, response.data.user.username);
      } else {
        const response = await backendApi.auth.login({ email, password });
        onLoginSuccess(response.data.token, response.data.user.username);
 console.log('AuthModal: Calling onLoginSuccess with token and username:', response.data.token, response.data.user.username);
      }
      // Clear fields and close on success
      setEmail('');
      setUsername('');
      setPassword('');
      onClose();
    } catch (err: any) {
      console.error('Authentication error:', err.response?.data || err.message);
      // Check if there's a specific message from the backend, otherwise show a generic error.
      // Use optional chaining for safe access to err.response.data.message
      setError(
        err.response?.data?.message || 'An unexpected error occurred.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setIsRegistering(false);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={handleClose}></div>
      
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl shadow-xl transform transition-all">
        <header className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">{isRegistering ? 'Register' : 'Login'}</h2>
          <button onClick={handleClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
            <CloseIcon />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6">
          {isRegistering && (
            <div className="mb-4">
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Username"
                required
              />
            </div>
          )}
          
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
          
          <div className="mb-4">
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Password"
              required
            />
          </div>
          
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

          <div className="mt-6">
            <button
              type="submit"
              className="w-full p-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition disabled:bg-blue-300"
              disabled={loading || (!email || !password || (isRegistering && !username))}
            >
              {loading ? 'Loading...' : (isRegistering ? 'Register' : 'Login')}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-blue-500 text-sm hover:underline"
            >
              {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
