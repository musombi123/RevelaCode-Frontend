import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import LegalDocs from './LegalDocs';

export default function StartModal({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLegal, setShowLegal] = useState(false);

  const { guestMode } = useAuth(); // ✅ NEW
  const baseUrl = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!contact || !password || (!isLogin && (!fullName || !confirmPassword))) {
      setError('⚠ All fields are required.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('❌ Passwords do not match.');
      return;
    }

    const endpoint = isLogin ? '/api/login' : '/api/register';
    const payload = {
      username: contact,
      password,
      ...(isLogin ? {} : { full_name: fullName }),
    };

    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ ${isLogin ? 'Login' : 'Registration'} successful!`);
        setTimeout(onClose, 1500);
      } else {
        setError(data.message || '❌ Failed to login/register.');
      }
    } catch (err) {
      console.error('❌ Server error:', err);
      setError('❌ Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestClick = () => {
    guestMode();           // ✅ sets guest state and localStorage
    onClose();             // ✅ close modal
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-500 text-xl hover:text-red-500">✖</button>

        <h2 className="text-xl font-bold mb-4 text-center text-indigo-600 dark:text-indigo-300">
          {isLogin ? '🔐 Login to RevelaCode' : '📝 Create an Account'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2 border rounded"
            />
          )}

          <input
            type="text"
            placeholder="Email or Phone"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full p-2 border rounded"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
          />

          {!isLogin && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border rounded"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
          >
            {loading ? '🔄 Processing...' : isLogin ? 'Login' : 'Register'}
          </button>

          {message && <p className="text-green-600 text-sm">{message}</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>

        {/* Switch login/register */}
        <div className="text-center text-sm mt-3 text-gray-600 dark:text-gray-400">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => setIsLogin(false)} className="text-blue-600 underline">Register</button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => setIsLogin(true)} className="text-blue-600 underline">Login</button>
            </>
          )}
        </div>

        {/* ✅ GUEST MODE BUTTON */}
        <div className="text-center mt-4">
          <button
            onClick={handleGuestClick}
            className="text-gray-700 dark:text-gray-300 text-sm underline"
          >
            👀 Continue as Guest
          </button>
        </div>

        {/* Terms */}
        <div className="text-center mt-2 text-xs text-gray-400">
          By continuing, you agree to our{' '}
          <button onClick={() => setShowLegal(true)} className="underline hover:text-blue-600">
            terms and policy
          </button>
        </div>

        {/* Legal Modal */}
        {showLegal && <LegalDocs onClose={() => setShowLegal(false)} />}
      </div>
    </div>
  );
}
