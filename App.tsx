import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import { auth } from './firebase';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Registration from './pages/Registration';
import Login from './pages/Login';
import Campus from './pages/user/Campus';
import AdminLayout from './pages/admin/AdminLayout';
import Remarking from './pages/admin/Remarking';
import ExaminerRecord from './pages/admin/ExaminerRecord';
import ContentManage from './pages/admin/ContentManage';
import RegistrationManage from './pages/admin/RegistrationManage';
import ESMCampusManage from './pages/admin/ESMCampusManage';
import ExaminerSearch from './pages/admin/ExaminerSearch';
import ViewProfile from './pages/admin/ViewProfile';
import ExcelUpload from './pages/admin/ExcelUpload';
import GenerateTPin from './pages/admin/GenerateTPin';
import FilterExaminer from './pages/admin/FilterExaminer';
import UserViewProfile from './pages/user/UserViewProfile';
import UserUpdateProfile from './pages/user/UserUpdateProfile';
import UserResult from './pages/user/UserResult';
import UpdateProfileRequest from './pages/admin/UpdateProfileRequest';

// Layout for public pages
const PublicLayout = () => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);

// Placeholders for secondary pages
const Placeholder = ({ title }: { title: string }) => (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        <p className="mt-4 text-gray-600">This section is currently being updated by the admin.</p>
    </div>
);

const App: React.FC = () => {
  // We track auth state here to ensure the app is aware of login/logout
  const [user, setUser] = useState<firebase.User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/campus" element={<Campus />} />
          <Route path="/program" element={<Placeholder title="Programs" />} />
          <Route path="/notice" element={<Placeholder title="Notices" />} />
          <Route path="/faq" element={<Placeholder title="Frequently Asked Questions" />} />
          <Route path="/profile/view" element={<UserViewProfile />} />
          <Route path="/profile/update" element={<UserUpdateProfile />} />
          <Route path="/profile/result" element={<UserResult />} />
          <Route path="/payment/list" element={<Placeholder title="Payment History" />} />
          <Route path="/payment/apply" element={<Placeholder title="Apply for Payment" />} />
          <Route path="/login" element={<Login />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          {/* Default to Remarking page */}
          <Route index element={<Remarking />} />
          <Route path="remarking" element={<Remarking />} />
          <Route path="records" element={<ExaminerRecord />} />
          <Route path="management" element={<ContentManage />} />
          <Route path="registration-manage" element={<RegistrationManage />} />
          <Route path="esm-campus" element={<ESMCampusManage />} />
          
          {/* View Profile (Read Only) */}
          <Route path="view-profile" element={<ViewProfile />} />
          
          {/* Update Profile (Editable) */}
          <Route path="update-profile" element={<ExaminerSearch />} />
          
          {/* Legacy route for safety, points to update */}
          <Route path="search" element={<ExaminerSearch />} />

          <Route path="generate-tpin" element={<GenerateTPin />} />
          <Route path="upload" element={<ExcelUpload />} />
          <Route path="filter-examiner" element={<FilterExaminer />} />
          <Route path="update-profile-request" element={<UpdateProfileRequest />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;