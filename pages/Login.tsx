import React, { useState } from 'react';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { ADMIN_EMAIL } from '../types';

const Login: React.FC = () => {
  const [email, setEmail] = useState(ADMIN_EMAIL); // Default to admin email for convenience
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const cleanEmail = email.trim();

    try {
      await auth.signInWithEmailAndPassword(cleanEmail, password);
      // If successful, navigate based on email
      navigate(cleanEmail === ADMIN_EMAIL ? '/admin' : '/');
    } catch (loginErr: any) {
      console.error("Login failed:", loginErr);

      // Handle specific login errors
      if (loginErr.code === 'auth/wrong-password') {
        setError("Incorrect password.");
        setLoading(false);
        return;
      }
      
      if (loginErr.code === 'auth/invalid-credential') {
         setError("Invalid email or password.");
         setLoading(false);
         return;
      }
      
      if (loginErr.code === 'auth/too-many-requests') {
        setError("Too many failed attempts. Please try again later.");
        setLoading(false);
        return;
      }

      // Only try to create if the user was NOT FOUND and it is the admin email
      if (loginErr.code === 'auth/user-not-found' && cleanEmail === ADMIN_EMAIL) {
        try {
          await auth.createUserWithEmailAndPassword(cleanEmail, password);
          // If creation successful, they are now logged in
          navigate('/admin');
        } catch (createErr: any) {
          if (createErr.code === 'auth/weak-password') {
            setError("Password should be at least 6 characters.");
          } else {
            setError("Failed to create admin account: " + createErr.message);
          }
          setLoading(false);
        }
      } else {
        // For other errors or non-admin emails
        if (loginErr.code === 'auth/user-not-found') {
            setError("User not found.");
        } else {
            setError("Login failed: " + loginErr.message);
        }
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-brand-900">Admin Login</h2>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:ring-brand-500 focus:border-brand-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2 focus:ring-brand-500 focus:border-brand-500"
              required
              placeholder="Enter password"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-600 text-white py-2 rounded hover:bg-brand-700 transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-xs text-gray-400">
           <p>Only authorized administrators can access this panel.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;