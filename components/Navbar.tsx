import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import { auth } from '../firebase';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [user, setUser] = useState<firebase.User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut().then(() => {
        setIsMobileMenuOpen(false);
        navigate('/login');
    });
  };

  return (
    <nav className="sticky top-0 z-50 text-white">
      <div className="absolute inset-0 bg-brand-900/95 backdrop-blur-md shadow-lg border-b border-white/10 -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-colors">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">EXAM PORTAL</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/" className="hover:bg-white/10 px-3 py-2 rounded-md transition-colors text-sm font-medium">Home</Link>
            
            {/* Profile Dropdown */}
            <div className="relative group">
              <button onClick={() => setProfileOpen(!profileOpen)} className="hover:bg-white/10 px-3 py-2 rounded-md flex items-center transition-colors text-sm font-medium">
                Profile
                <svg className={`ml-1 w-4 h-4 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className={`absolute left-0 mt-2 w-56 bg-white text-gray-800 rounded-xl shadow-2xl py-2 border border-gray-100 transform transition-all duration-200 origin-top-left ${profileOpen || 'group-hover:opacity-100 group-hover:scale-100 opacity-0 scale-95 pointer-events-none group-hover:pointer-events-auto'}`}>
                <div className="px-4 py-2 border-b border-gray-100 mb-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Account</p>
                </div>
                <Link to="/profile/view" className="block px-4 py-2 hover:bg-brand-50 hover:text-brand-700 transition-colors text-sm">View Profile</Link>
                <Link to="/profile/update" className="block px-4 py-2 hover:bg-brand-50 hover:text-brand-700 transition-colors text-sm">Update Profile</Link>
                <Link to="/profile/result" className="block px-4 py-2 hover:bg-brand-50 hover:text-brand-700 transition-colors text-sm">View Result</Link>
              </div>
            </div>

            <Link to="/campus" className="hover:bg-white/10 px-3 py-2 rounded-md transition-colors text-sm font-medium">Campus</Link>

            {/* Payment Dropdown */}
            <div className="relative group">
              <button onClick={() => setPaymentOpen(!paymentOpen)} className="hover:bg-white/10 px-3 py-2 rounded-md flex items-center transition-colors text-sm font-medium">
                Payment
                <svg className={`ml-1 w-4 h-4 transition-transform duration-200 ${paymentOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className={`absolute left-0 mt-2 w-56 bg-white text-gray-800 rounded-xl shadow-2xl py-2 border border-gray-100 transform transition-all duration-200 origin-top-left ${paymentOpen || 'group-hover:opacity-100 group-hover:scale-100 opacity-0 scale-95 pointer-events-none group-hover:pointer-events-auto'}`}>
                <div className="px-4 py-2 border-b border-gray-100 mb-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Finance</p>
                </div>
                <Link to="/payment/list" className="block px-4 py-2 hover:bg-brand-50 hover:text-brand-700 transition-colors text-sm">Payment List</Link>
                <Link to="/payment/apply" className="block px-4 py-2 hover:bg-brand-50 hover:text-brand-700 transition-colors text-sm">Online Payment Apply</Link>
              </div>
            </div>
            <Link to="/notice" className="hover:bg-white/10 px-3 py-2 rounded-md transition-colors text-sm font-medium">Notice</Link>
            <Link to="/faq" className="hover:bg-white/10 px-3 py-2 rounded-md transition-colors text-sm font-medium">FAQ's</Link>
            <Link to="/registration" className="ml-2 bg-yellow-500 hover:bg-yellow-400 text-brand-900 font-bold px-5 py-2 rounded-full shadow-lg hover:shadow-yellow-500/20 transition-all transform hover:-translate-y-0.5 text-sm">Registration</Link>
            
            {user ? (
               <div className="relative group ml-4">
                 <Link to="/admin" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors block ring-2 ring-transparent hover:ring-white/30">
                    <span className="sr-only">User</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                 </Link>
                 <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-xl shadow-2xl py-2 border border-gray-100 transform transition-all duration-200 origin-top-right hidden group-hover:block">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Signed in as</p>
                      <p className="text-sm font-bold text-brand-900 truncate">{user.email}</p>
                    </div>
                    <Link to="/admin" className="block px-4 py-2 hover:bg-brand-50 hover:text-brand-700 transition-colors text-sm">Dashboard</Link>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors text-sm font-medium">Sign Out</button>
                 </div>
               </div>
            ) : (
                <Link to="/login" className="ml-4 text-sm font-medium text-gray-300 hover:text-white transition-colors">Admin Login</Link>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Sidebar */}
      <div className={`fixed inset-0 z-50 flex md:hidden ${isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} 
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Sidebar */}
        <div className={`relative bg-white w-72 h-full shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          
          {/* Header */}
          <div className="p-4 bg-brand-900 text-white flex justify-between items-center shadow-md">
            <span className="text-xl font-bold tracking-wider">EXAM PORTAL</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 hover:bg-brand-700 rounded-full transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Links */}
          <div className="flex-grow overflow-y-auto py-4">
            <div className="flex flex-col space-y-1">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-brand-700 font-medium transition border-l-4 border-transparent hover:border-brand-700">Home</Link>
              
              <div className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">Profile</div>
              <Link to="/profile/view" onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 hover:text-brand-700 transition pl-8">View Profile</Link>
              <Link to="/profile/update" onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 hover:text-brand-700 transition pl-8">Update Profile</Link>
              <Link to="/profile/result" onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 hover:text-brand-700 transition pl-8">Result</Link>
              
              <div className="my-2 border-t border-gray-100"></div>
              
              <Link to="/campus" onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-brand-700 font-medium transition border-l-4 border-transparent hover:border-brand-700">Campus</Link>
              
              <div className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">Payment</div>
              <Link to="/payment/list" onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 hover:text-brand-700 transition pl-8">Payment List</Link>
              <Link to="/payment/apply" onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 hover:text-brand-700 transition pl-8">Online Payment Apply</Link>
              
              <div className="my-2 border-t border-gray-100"></div>

              <Link to="/notice" onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-brand-700 font-medium transition border-l-4 border-transparent hover:border-brand-700">Notice</Link>
              <Link to="/faq" onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-brand-700 font-medium transition border-l-4 border-transparent hover:border-brand-700">FAQ's</Link>
              
              <div className="px-6 py-4 mt-2">
                <Link to="/registration" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 rounded shadow transition transform hover:scale-105">
                  Registration
                </Link>
              </div>
            </div>
          </div>

          {/* Footer / User Section */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            {user ? (
              <div>
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg">
                    {user.email ? user.email[0].toUpperCase() : 'A'}
                  </div>
                  <div className="ml-3 overflow-hidden">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                    <p className="text-xs text-gray-500">Admin</p>
                  </div>
                </div>
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center mb-2 px-4 py-2 bg-brand-700 text-white rounded hover:bg-brand-800 transition text-sm font-medium">Dashboard</Link>
                <button onClick={handleLogout} className="block w-full text-center px-4 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50 transition text-sm font-medium">Sign Out</button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center px-4 py-2 bg-brand-700 text-white rounded hover:bg-brand-800 transition font-medium">
                Admin Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;