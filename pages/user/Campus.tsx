import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { CampusInfo } from '../../types';

const Campus: React.FC = () => {
  const [campuses, setCampuses] = useState<CampusInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampus, setSelectedCampus] = useState<CampusInfo | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState('');

  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        const q = query(
          collection(db, 'campuses'), 
          where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as CampusInfo))
          .sort((a, b) => a.sl - b.sl);
        setCampuses(data);
      } catch (error) {
        console.error("Error fetching campuses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampuses();
  }, []);

  // Group campuses by category
  const groupedCampuses = campuses.reduce((acc, campus) => {
    const category = campus.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(campus);
    return acc;
  }, {} as Record<string, CampusInfo[]>);

  // Define category order if needed, or just use Object.keys
  const categoryOrder = [
    "ঢাকার ভিতরের ক্যাম্পাস সমূহ",
    "ঢাকার বাহিরের ক্যাম্পাস সমূহ",
    "অনলাইনে খাতা মূল্যায়নের জন্য"
  ];

  // Get all categories, ensuring the specific order comes first, then others
  const sortedCategories = [
    ...categoryOrder.filter(c => groupedCampuses[c]),
    ...Object.keys(groupedCampuses).filter(c => !categoryOrder.includes(c))
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-purple-800 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-white mb-8">উদ্ভাস (ESM) এর সকল ক্যাম্পাস সমূহ:</h1>

        {sortedCategories.map(category => (
          <div key={category} className="mb-10">
            <h2 className="text-xl font-bold text-center text-white mb-6 border-b border-purple-600 pb-2 inline-block px-8 mx-auto block w-max">
              {category}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {groupedCampuses[category].map(campus => (
                <div key={campus.id} className="bg-white rounded-lg shadow-lg overflow-hidden relative">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-sm">
                        {campus.cardHeading}
                      </div>
                      <button 
                        onClick={() => setSelectedCampus(campus)}
                        className="text-red-500 hover:text-red-600 transition transform hover:scale-110"
                        title="View Map & Details"
                      >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-2 text-sm">
                      {campus.phone1 && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="bg-green-500 text-white p-1 rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.3-1.1-.5-2.3-.5-3.5 0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2 0 11 9 20 20 20 1.1 0 2-.9 2-2v-1.9c0-1.1-.9-2-2-2z"/></svg>
                          </span>
                          <a href={`tel:${campus.phone1}`} className="hover:text-blue-600">{campus.phone1}</a>
                        </div>
                      )}
                      {campus.phone2 && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="bg-green-500 text-white p-1 rounded-full">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.3-1.1-.5-2.3-.5-3.5 0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2 0 11 9 20 20 20 1.1 0 2-.9 2-2v-1.9c0-1.1-.9-2-2-2z"/></svg>
                          </span>
                          <a href={`tel:${campus.phone2}`} className="hover:text-blue-600">{campus.phone2}</a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Popup Modal */}
      {selectedCampus && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative animate-fade-in-up">
            <button 
              onClick={() => setSelectedCampus(null)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>

            <div className="p-6">
              <h3 className="text-2xl font-bold text-blue-600 mb-4 pr-10">{selectedCampus.popupHeading || selectedCampus.cardHeading}</h3>
              
              <div className="flex items-start gap-3 mb-4 text-gray-700">
                <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <p className="text-lg">{selectedCampus.address}</p>
              </div>

              <div className="flex flex-wrap gap-4 mb-6">
                {selectedCampus.phone1 && (
                  <div className="flex items-center gap-2">
                    <span className="bg-green-500 text-white p-1.5 rounded-full">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.3-1.1-.5-2.3-.5-3.5 0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2 0 11 9 20 20 20 1.1 0 2-.9 2-2v-1.9c0-1.1-.9-2-2-2z"/></svg>
                    </span>
                    <a href={`tel:${selectedCampus.phone1}`} className="text-lg font-bold text-gray-800 hover:text-blue-600">{selectedCampus.phone1}</a>
                  </div>
                )}
                {selectedCampus.phone2 && (
                  <div className="flex items-center gap-2">
                    <span className="bg-green-500 text-white p-1.5 rounded-full">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.3-1.1-.5-2.3-.5-3.5 0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2 0 11 9 20 20 20 1.1 0 2-.9 2-2v-1.9c0-1.1-.9-2-2-2z"/></svg>
                    </span>
                    <a href={`tel:${selectedCampus.phone2}`} className="text-lg font-bold text-gray-800 hover:text-blue-600">{selectedCampus.phone2}</a>
                  </div>
                )}
              </div>

              {selectedCampus.mapIframe && (
                <div className="w-full h-64 md:h-80 bg-gray-100 rounded-lg overflow-hidden border border-gray-300 mb-6">
                  {selectedCampus.mapIframe.trim().startsWith('<') ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: selectedCampus.mapIframe.replace(/width="[^"]*"/, 'width="100%"').replace(/height="[^"]*"/, 'height="100%"') }} 
                      className="w-full h-full"
                    />
                  ) : (
                    <iframe 
                      src={selectedCampus.mapIframe} 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0 }} 
                      allowFullScreen 
                      loading="lazy" 
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Campus Map"
                    ></iframe>
                  )}
                </div>
              )}

              {/* WhatsApp Help-line Section */}
              {selectedCampus.whatsappNumber && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="text-center mb-4">
                    <span className="bg-[#0078D7] text-white px-6 py-2 rounded font-bold text-xl inline-block shadow-md">
                      {selectedCampus.whatsappTitle || 'Help-line'}
                    </span>
                  </h4>
                  
                  <div className="max-w-2xl mx-auto">
                    <textarea
                      value={whatsappMessage}
                      onChange={(e) => setWhatsappMessage(e.target.value)}
                      placeholder="আপনার বার্তা লিখুন"
                      className="w-full border border-gray-300 rounded-lg p-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 resize-y"
                    ></textarea>
                    
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => {
                          const message = encodeURIComponent(whatsappMessage);
                          const url = `https://wa.me/${selectedCampus.whatsappNumber}?text=${message}`;
                          window.open(url, '_blank');
                        }}
                        className="bg-[#0078D7] text-white px-12 py-2 rounded-lg font-bold text-lg hover:bg-blue-700 transition shadow-md"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campus;
