import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { CampusInfo } from '../../types';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const Faq: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [campuses, setCampuses] = useState<CampusInfo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Help-Line State
  const [selectedWhatsappTitle, setSelectedWhatsappTitle] = useState('');
  const [message, setMessage] = useState('');

  // FAQ Modal State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryFaqs, setCategoryFaqs] = useState<FAQ[]>([]);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  const categories = [
    { name: "Script Evulations FAQs", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { name: "Teacher Department FAQs", icon: "M12 14l9-5-9-5-9 5 9 5z" },
    { name: "Materials Development FAQs", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { name: "Q&A Department FAQs", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Campuses for Help-Line
        const campusSnapshot = await getDocs(collection(db, 'campuses'));
        const campusData = campusSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CampusInfo));
        setCampuses(campusData);

        // Fetch All FAQs
        const faqSnapshot = await getDocs(collection(db, 'faqs'));
        const faqData = faqSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FAQ));
        setFaqs(faqData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    // Map button name to DB category name (remove " FAQs" suffix)
    const dbCategory = categoryName.replace(' FAQs', '');
    const filtered = faqs.filter(f => f.category === dbCategory);
    setCategoryFaqs(filtered);
    setSelectedCategory(categoryName);
    setExpandedFaqId(null);
  };

  const handleSendMessage = () => {
    if (!selectedWhatsappTitle) {
      alert("Please select a campus first.");
      return;
    }
    // Find a campus with the selected title
    const campus = campuses.find(c => c.whatsappTitle === selectedWhatsappTitle);
    
    if (campus && campus.whatsappNumber) {
      const encodedMessage = encodeURIComponent(message);
      const url = `https://wa.me/${campus.whatsappNumber}?text=${encodedMessage}`;
      window.open(url, '_blank');
    } else {
      alert("This campus does not have a WhatsApp number configured.");
    }
  };

  // Get unique whatsapp titles
  const uniqueWhatsappTitles = Array.from(new Set(
    campuses
      .filter(c => c.whatsappTitle)
      .map(c => c.whatsappTitle)
  )).sort();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-[#005a5a] mb-8">Frequently Asked Questions</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => handleCategoryClick(cat.name)}
              className="bg-[#0078D7] text-white p-6 rounded-lg shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1 flex flex-col items-center justify-center h-32"
            >
              <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cat.icon} />
              </svg>
              <span className="font-bold text-center">{cat.name}</span>
            </button>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-8 shadow-inner max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Help-Line ESM</h2>
          
          <div className="flex flex-col items-center space-y-4">
            <select
              value={selectedWhatsappTitle}
              onChange={(e) => setSelectedWhatsappTitle(e.target.value)}
              className="w-full max-w-md border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Campus --</option>
              {uniqueWhatsappTitles.map((title, index) => (
                <option key={index} value={title}>
                  {title}
                </option>
              ))}
            </select>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here."
              className="w-full max-w-md border border-gray-300 rounded p-4 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex gap-4">
              <button
                onClick={handleSendMessage}
                className="bg-[#25D366] text-white px-6 py-2 rounded font-bold flex items-center gap-2 hover:bg-green-600 transition shadow"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                Send
              </button>
              <button className="bg-[#8B0000] text-white px-6 py-2 rounded font-bold flex items-center gap-2 hover:bg-red-800 transition shadow">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                Note
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
            <div className="bg-white p-4 border-b flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-xl font-bold text-[#0078D7]">{selectedCategory}</h3>
              <button 
                onClick={() => setSelectedCategory(null)}
                className="text-red-500 hover:text-red-700 font-bold text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-gray-50 flex-grow">
              {categoryFaqs.length === 0 ? (
                <p className="text-center text-gray-500">No FAQs found for this category.</p>
              ) : (
                <div className="space-y-4">
                  {categoryFaqs.map((faq) => (
                    <div key={faq.id} className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
                      <div 
                        className="bg-gray-100 px-4 py-3 font-bold text-gray-800 border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors flex justify-between items-center"
                        onClick={() => setExpandedFaqId(expandedFaqId === faq.id ? null : faq.id)}
                      >
                        <span>{faq.question}</span>
                        <svg 
                          className={`w-5 h-5 transform transition-transform ${expandedFaqId === faq.id ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {expandedFaqId === faq.id && (
                        <div className="px-4 py-3 text-gray-700 bg-white animate-fade-in-down">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faq;
