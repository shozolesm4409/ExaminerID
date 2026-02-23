import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

interface FAQ {
  id?: string;
  question: string;
  answer: string;
  category: string;
  createdAt?: any;
}

const FaqManage: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Script Evulations');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({ question: '', answer: '' });

  const categories = [
    "Script Evulations",
    "Teacher Department",
    "Materials Development",
    "Q&A Department"
  ];

  const categoryColors: Record<string, string> = {
    "Script Evulations": "bg-green-500",
    "Teacher Department": "bg-purple-600",
    "Materials Development": "bg-orange-500",
    "Q&A Department": "bg-red-600"
  };

  useEffect(() => {
    fetchFaqs();
  }, [selectedCategory]);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'faqs'), 
        where('category', '==', selectedCategory)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FAQ));
      // Client-side sort by createdAt if needed, or just rely on insertion order if no timestamp
      setFaqs(data);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({ question: faq.question, answer: faq.answer });
    } else {
      setEditingFaq(null);
      setFormData({ question: '', answer: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFaq && editingFaq.id) {
        await updateDoc(doc(db, 'faqs', editingFaq.id), {
          question: formData.question,
          answer: formData.answer,
          category: selectedCategory
        });
        alert("FAQ updated successfully!");
      } else {
        await addDoc(collection(db, 'faqs'), {
          question: formData.question,
          answer: formData.answer,
          category: selectedCategory,
          createdAt: new Date()
        });
        alert("FAQ added successfully!");
      }
      setIsModalOpen(false);
      fetchFaqs();
    } catch (error) {
      console.error("Error saving FAQ:", error);
      alert("Failed to save FAQ.");
    }
  };

  const handleDeleteClick = (id: string) => {
    setFaqToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!faqToDelete) return;
    try {
      await deleteDoc(doc(db, 'faqs', faqToDelete));
      setFaqs(prev => prev.filter(f => f.id !== faqToDelete));
      // alert("FAQ deleted successfully!"); // Optional: remove alert if modal feedback is enough
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      alert("Failed to delete FAQ.");
    } finally {
      setDeleteModalOpen(false);
      setFaqToDelete(null);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Frequently Asked Questions Page Info</h2>
      
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded text-white font-medium flex items-center gap-2 transition transform hover:scale-105 ${selectedCategory === cat ? categoryColors[cat] : 'bg-gray-400'}`}
          >
            {/* Icons based on category name could be added here */}
            {cat === "Script Evulations" && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            {cat === "Teacher Department" && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>}
            {cat === "Materials Development" && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
            {cat === "Q&A Department" && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
            {cat}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-700">{selectedCategory}</h3>
        <button 
          onClick={() => openModal()}
          className="bg-[#0078D7] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 font-bold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add FAQs
        </button>
      </div>

      <div className="bg-white rounded shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#0078D7] text-white">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-bold uppercase tracking-wider w-1/3 border-r border-blue-400">প্রশ্ন</th>
              <th className="px-6 py-3 text-left text-sm font-bold uppercase tracking-wider w-1/2 border-r border-blue-400">উত্তর</th>
              <th className="px-6 py-3 text-center text-sm font-bold uppercase tracking-wider w-1/6">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : faqs.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">No FAQs found for this category.</td></tr>
            ) : (
              faqs.map((faq) => (
                <tr key={faq.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{faq.question}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">{faq.answer}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button 
                      onClick={() => openModal(faq)}
                      className="bg-[#0078D7] text-white px-3 py-1 rounded text-xs hover:bg-blue-700 mr-2 inline-flex items-center justify-center"
                      title="Update"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(faq.id!)}
                      className="text-red-600 hover:text-red-900 text-xs font-bold inline-flex items-center justify-center"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
            <div className="bg-[#0078D7] text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-center w-full">
                {editingFaq ? `Edit FAQ to ${selectedCategory}` : `Add FAQ to ${selectedCategory}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-gray-200 absolute right-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2 text-center">প্রশ্ন</label>
                <textarea 
                  value={formData.question}
                  onChange={(e) => setFormData({...formData, question: e.target.value})}
                  className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                  placeholder="এখানে প্রশ্ন লিখুন..."
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2 text-center">উত্তর</label>
                <textarea 
                  value={formData.answer}
                  onChange={(e) => setFormData({...formData, answer: e.target.value})}
                  className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                  placeholder="এখানে উত্তর লিখুন..."
                  required
                />
              </div>

              <div className="flex justify-center pt-4">
                <button 
                  type="submit" 
                  className="px-8 py-2 bg-[#0078D7] text-white rounded hover:bg-blue-700 font-bold text-lg shadow"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Confirm Delete</h3>
              <button onClick={() => setDeleteModalOpen(false)} className="text-white hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Are you sure?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Do you really want to delete this FAQ? This process cannot be undone.
              </p>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
              <button
                type="button"
                onClick={confirmDelete}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaqManage;
