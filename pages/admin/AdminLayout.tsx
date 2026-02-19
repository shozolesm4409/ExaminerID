import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login');
      }
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const isActive = (path: string) => location.pathname === path ? "bg-brand-800 text-white" : "text-gray-300 hover:bg-brand-800 hover:text-white";

  if (checkingAuth) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar - Fixed/Sticky */}
      <aside className="w-64 bg-brand-900 text-white hidden md:flex flex-col h-screen sticky top-0 overflow-y-auto shadow-xl">
        <div className="p-6 flex-shrink-0">
          <h2 className="text-2xl font-bold tracking-wider">Admin Panel</h2>
        </div>
        <nav className="mt-2 flex-grow space-y-1">
          <Link to="/admin/remarking" className={`block px-6 py-2 transition-colors ${isActive('/admin/remarking')}`}>Remarking</Link>
          <Link to="/admin/records" className={`block px-6 py-2 transition-colors ${isActive('/admin/records')}`}>Examiner Records</Link>
          
          <div className="my-2 border-t border-brand-800 opacity-50"></div>
          
          <Link to="/admin/view-profile" className={`block px-6 py-2 transition-colors ${isActive('/admin/view-profile')}`}>View Profile</Link>
          <Link to="/admin/update-profile" className={`block px-6 py-2 transition-colors ${isActive('/admin/update-profile')}`}>Update Profile</Link>
          
          <div className="my-2 border-t border-brand-800 opacity-50"></div>
          
          <Link to="/admin/generate-tpin" className={`block px-6 py-2 transition-colors ${isActive('/admin/generate-tpin')}`}>Generate T-Pin</Link>
          <Link to="/admin/upload" className={`block px-6 py-2 transition-colors ${isActive('/admin/upload')}`}>Excel Upload</Link>
          
          <div className="my-2 border-t border-brand-800 opacity-50"></div>
          
          <Link to="/admin/registration-manage" className={`block px-6 py-2 transition-colors ${isActive('/admin/registration-manage')}`}>Registration Manage</Link>
          <Link to="/admin/management" className={`block px-6 py-2 transition-colors ${isActive('/admin/management')}`}>Content Manage</Link>
        </nav>
        <div className="p-3 border-t border-brand-800 flex-shrink-0">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-x-hidden overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden mb-6 bg-brand-900 text-white p-4 rounded flex justify-between items-center shadow">
            <div>
              <h2 className="font-bold text-lg">Admin Panel</h2>
              <div className="flex flex-wrap gap-3 mt-2 text-xs">
                  <Link to="/admin/view-profile" className="underline hover:text-gray-300">View</Link>
                  <Link to="/admin/update-profile" className="underline hover:text-gray-300">Update</Link>
                  <Link to="/admin/generate-tpin" className="underline hover:text-gray-300">Gen T-Pin</Link>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-6 py-1 rounded ml-2 whitespace-nowrap shadow"
            >
              Sign Out
            </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;