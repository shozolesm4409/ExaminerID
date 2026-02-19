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
    <nav className="bg-brand-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold tracking-wider">EXAM PORTAL</Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="hover:bg-brand-600 px-3 py-2 rounded-md">Home</Link>
            
            {/* Profile Dropdown */}
            <div className="relative group">
              <button onClick={() => setProfileOpen(!profileOpen)} className="hover:bg-brand-600 px-3 py-2 rounded-md flex items-center">
                Profile
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className={`absolute left-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg py-1 ${profileOpen || 'group-hover:block hidden'}`}>
                <Link to="/profile/view" className="block px-4 py-2 hover:bg-gray-100">View Profile</Link>
                <Link to="/profile/update" className="block px-4 py-2 hover:bg-gray-100">Update Profile</Link>
              </div>
            </div>

            <Link to="/campus" className="hover:bg-brand-600 px-3 py-2 rounded-md">Campus</Link>

            {/* Payment Dropdown */}
            <div className="relative group">
              <button onClick={() => setPaymentOpen(!paymentOpen)} className="hover:bg-brand-600 px-3 py-2 rounded-md flex items-center">
                Payment
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className={`absolute left-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg py-1 ${paymentOpen || 'group-hover:block hidden'}`}>
                <Link to="/payment/list" className="block px-4 py-2 hover:bg-gray-100">Payment List</Link>
                <Link to="/payment/apply" className="block px-4 py-2 hover:bg-gray-100">Online Payment Apply</Link>
              </div>
            </div>

            <Link to="/program" className="hover:bg-brand-600 px-3 py-2 rounded-md">Program</Link>
            <Link to="/notice" className="hover:bg-brand-600 px-3 py-2 rounded-md">Notice</Link>
            <Link to="/faq" className="hover:bg-brand-600 px-3 py-2 rounded-md">FAQ's</Link>
            <Link to="/registration" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-md">Registration</Link>
            
            {user ? (
               <div className="relative group ml-4">
                 <button className="bg-brand-700 p-2 rounded-full hover:bg-brand-600 transition">
                    <span className="sr-only">User</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                 </button>
                 <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg py-1 hidden group-hover:block">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b">Signed in as Admin</div>
                    <Link to="/admin" className="block px-4 py-2 hover:bg-gray-100">Dashboard</Link>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">Sign Out</button>
                 </div>
               </div>
            ) : (
                <Link to="/login" className="ml-4 hover:text-yellow-400">Admin Login</Link>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-brand-800">
            <Link to="/" className="block px-4 py-2 hover:bg-brand-700">Home</Link>
            <Link to="/profile/view" className="block px-4 py-2 hover:bg-brand-700">Profile</Link>
            <Link to="/campus" className="block px-4 py-2 hover:bg-brand-700">Campus</Link>
            <Link to="/payment/list" className="block px-4 py-2 hover:bg-brand-700">Payment</Link>
            <Link to="/program" className="block px-4 py-2 hover:bg-brand-700">Program</Link>
            <Link to="/notice" className="block px-4 py-2 hover:bg-brand-700">Notice</Link>
            <Link to="/registration" className="block px-4 py-2 bg-yellow-500 text-black">Registration</Link>
            <div className="border-t border-brand-700 mt-2 pt-2">
              {user ? (
                <>
                  <Link to="/admin" className="block px-4 py-2 hover:bg-brand-700 text-yellow-300 font-bold">Admin Dashboard</Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-brand-700 text-red-300 font-bold">Sign Out</button>
                </>
              ) : (
                <Link to="/login" className="block px-4 py-2 hover:bg-brand-700">Admin Login</Link>
              )}
            </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;