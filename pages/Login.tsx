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
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="bg-white rounded border border-gray-300 shadow-sm w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 py-4 text-center">
          <h2 className="text-xl text-gray-700 font-normal">Log in</h2>
        </div>
        
        {/* Body */}
        <div className="p-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
              <label className="text-right text-gray-800 font-bold text-sm">User Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                required
              />
            </div>
            
            <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
              <label className="text-right text-gray-800 font-bold text-sm">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                required
              />
            </div>

            <div className="grid grid-cols-[100px_1fr] gap-4">
              <div></div> {/* Spacer */}
              <div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-[#337AB7] text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 font-medium text-sm shadow-sm"
                >
                  {loading ? 'Logging in...' : 'Log in'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;