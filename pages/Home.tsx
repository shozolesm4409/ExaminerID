import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ContentItem } from '../types';

const Home: React.FC = () => {
  const [notices, setNotices] = useState<ContentItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const q = query(
          collection(db, 'content'), 
          where('type', '==', 'notice'), 
          where('isVisible', '==', true)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => d.data() as ContentItem);
        // Sort by date descending
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setNotices(data.slice(0, 5));
      } catch (err: any) {
        console.error("Error fetching notices:", err);
        if (err.code === 'permission-denied' || err.code === 'unavailable') {
            setError("Data access restricted. If you are the admin, please check Firestore Security Rules or enable Authentication in Firebase Console.");
        } else {
            setError("Unable to load notices. Please check your connection.");
        }
      }
    };
    fetchNotices();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="bg-brand-600 text-white py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Examiner Portal</h1>
        <p className="text-xl mb-8">Streamlining the script checking and management process.</p>
        <a href="#/registration" className="bg-white text-brand-600 px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition">
          Register as Examiner
        </a>
      </div>

      {/* Quick Info Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-brand-500">
          <h3 className="font-bold text-lg mb-2">Examiner Profile</h3>
          <p className="text-gray-600 text-sm">View and update your personal and academic information.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500">
          <h3 className="font-bold text-lg mb-2">Payments</h3>
          <p className="text-gray-600 text-sm">Check payment history and apply for new payments.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-yellow-500">
          <h3 className="font-bold text-lg mb-2">Programs</h3>
          <p className="text-gray-600 text-sm">See current running programs and script distribution.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-red-500">
          <h3 className="font-bold text-lg mb-2">Notice Board</h3>
          <p className="text-gray-600 text-sm">Stay updated with latest instructions and deadlines.</p>
        </div>
      </div>

      {/* Recent Notices */}
      <div className="bg-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-brand-900 border-b-2 border-brand-200 pb-2">Latest Notices</h2>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-red-700">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            {notices.length > 0 ? notices.map((notice, idx) => (
              <div key={idx} className="bg-white p-4 rounded shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h4 className="font-bold text-lg text-gray-800">{notice.title}</h4>
                  <p className="text-sm text-gray-500">{new Date(notice.date).toLocaleDateString()}</p>
                </div>
                <button className="text-brand-600 hover:underline text-sm mt-2 md:mt-0">Read More</button>
              </div>
            )) : !error && <p className="text-gray-500 italic">No recent notices found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;