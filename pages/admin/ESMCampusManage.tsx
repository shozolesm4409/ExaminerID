import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { CampusInfo } from '../../types';

const ESMCampusManage: React.FC = () => {
  const [campuses, setCampuses] = useState<CampusInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<CampusInfo | null>(null);
  const [viewMapCampus, setViewMapCampus] = useState<CampusInfo | null>(null);
  const [formData, setFormData] = useState<Partial<CampusInfo>>({
    isActive: true,
    sl: 0,
    cardHeading: '',
    phone1: '',
    phone2: '',
    popupHeading: '',
    address: '',
    mapIframe: '',
    whatsappTitle: '',
    whatsappNumber: '',
    category: 'Inside Dhaka'
  });

  const categories = [
    "ঢাকার ভিতরের ক্যাম্পাস সমূহ",
    "ঢাকার বাহিরের ক্যাম্পাস সমূহ",
    "অনলাইনে খাতা মূল্যায়নের জন্য"
  ];

  useEffect(() => {
    fetchCampuses();
  }, []);

  const fetchCampuses = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'campuses'), orderBy('sl', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CampusInfo));
      setCampuses(data);
    } catch (error) {
      console.error("Error fetching campuses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const openModal = (campus?: CampusInfo) => {
    if (campus) {
      setEditingCampus(campus);
      setFormData(campus);
    } else {
      setEditingCampus(null);
      setFormData({
        isActive: true,
        sl: campuses.length + 1,
        cardHeading: '',
        phone1: '',
        phone2: '',
        popupHeading: '',
        address: '',
        mapIframe: '',
        whatsappTitle: '',
        whatsappNumber: '',
        category: categories[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCampus && editingCampus.id) {
        await updateDoc(doc(db, 'campuses', editingCampus.id), formData);
        alert("Campus updated successfully!");
      } else {
        await addDoc(collection(db, 'campuses'), formData);
        alert("Campus added successfully!");
      }
      setIsModalOpen(false);
      fetchCampuses();
    } catch (error) {
      console.error("Error saving campus:", error);
      alert("Failed to save campus.");
    }
  };

  const toggleActive = async (campus: CampusInfo) => {
    if (!campus.id) return;
    try {
      await updateDoc(doc(db, 'campuses', campus.id), { isActive: !campus.isActive });
      // Optimistic update
      setCampuses(prev => prev.map(c => c.id === campus.id ? { ...c, isActive: !c.isActive } : c));
    } catch (error) {
      console.error("Error toggling active status:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">ESM Campus Page Info</h2>
        <button 
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Campus
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto max-h-[75vh]">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-bold border-r border-blue-500">Action</th>
                <th className="px-4 py-3 text-center font-bold border-r border-blue-500">Active</th>
                <th className="px-4 py-3 text-center font-bold border-r border-blue-500">SL</th>
                <th className="px-4 py-3 text-left font-bold border-r border-blue-500">Card Heading</th>
                <th className="px-4 py-3 text-left font-bold border-r border-blue-500">Phone-1</th>
                <th className="px-4 py-3 text-left font-bold border-r border-blue-500">Phone-2</th>
                <th className="px-4 py-3 text-left font-bold border-r border-blue-500">Popup Heading</th>
                <th className="px-4 py-3 text-left font-bold border-r border-blue-500">Address</th>
                <th className="px-4 py-3 text-center font-bold border-r border-blue-500">Map</th>
                <th className="px-4 py-3 text-left font-bold border-r border-blue-500">Whatsapp Title</th>
                <th className="px-4 py-3 text-left font-bold">Whatsapp Number</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={11} className="text-center py-4">Loading...</td></tr>
              ) : campuses.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-4">No campuses found.</td></tr>
              ) : (
                campuses.map((campus) => (
                  <tr key={campus.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-r border-gray-200">
                      <button 
                        onClick={() => openModal(campus)}
                        className="bg-teal-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1 hover:bg-teal-700"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Edit
                      </button>
                    </td>
                    <td className="px-4 py-2 text-center border-r border-gray-200">
                      <input 
                        type="checkbox" 
                        checked={campus.isActive} 
                        onChange={() => toggleActive(campus)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-2 text-center border-r border-gray-200">{campus.sl}</td>
                    <td className="px-4 py-2 border-r border-gray-200 font-medium">{campus.cardHeading}</td>
                    <td className="px-4 py-2 border-r border-gray-200">{campus.phone1}</td>
                    <td className="px-4 py-2 border-r border-gray-200">{campus.phone2}</td>
                    <td className="px-4 py-2 border-r border-gray-200">{campus.popupHeading}</td>
                    <td className="px-4 py-2 border-r border-gray-200 max-w-xs truncate" title={campus.address}>{campus.address}</td>
                    <td className="px-4 py-2 text-center border-r border-gray-200">
                      {campus.mapIframe && (
                        <button 
                          onClick={() => setViewMapCampus(campus)}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                        >
                          ViewMap
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200">{campus.whatsappTitle}</td>
                    <td className="px-4 py-2">{campus.whatsappNumber}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center sticky top-0">
              <h3 className="text-xl font-bold">{editingCampus ? 'Edit Campus' : 'Add New Campus'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category (Group)</label>
                <select 
                  name="category" 
                  value={formData.category} 
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SL (Serial)</label>
                <input 
                  type="number" 
                  name="sl" 
                  value={formData.sl} 
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Heading</label>
                <input 
                  type="text" 
                  name="cardHeading" 
                  value={formData.cardHeading} 
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number 1</label>
                <input 
                  type="text" 
                  name="phone1" 
                  value={formData.phone1} 
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number 2</label>
                <input 
                  type="text" 
                  name="phone2" 
                  value={formData.phone2} 
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Popup Heading</label>
                <input 
                  type="text" 
                  name="popupHeading" 
                  value={formData.popupHeading} 
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Whatsapp Title</label>
                <input 
                  type="text" 
                  name="whatsappTitle" 
                  value={formData.whatsappTitle} 
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Whatsapp Number</label>
                <input 
                  type="text" 
                  name="whatsappNumber" 
                  value={formData.whatsappNumber} 
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea 
                  name="address" 
                  value={formData.address} 
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Map Iframe (Embed Code)</label>
                <textarea 
                  name="mapIframe" 
                  value={formData.mapIframe} 
                  onChange={handleInputChange}
                  rows={3}
                  placeholder='<iframe src="..." ...></iframe>'
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">Paste the full iframe code from Google Maps.</p>
              </div>

              <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                <input 
                  type="checkbox" 
                  name="isActive" 
                  checked={formData.isActive} 
                  onChange={handleCheckboxChange}
                  id="isActiveModal"
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="isActiveModal" className="text-sm font-medium text-gray-700">Active</label>
              </div>

              <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                >
                  {editingCampus ? 'Update Campus' : 'Save Campus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Map View Modal */}
      {viewMapCampus && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden relative animate-fade-in-up">
            <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-bold">{viewMapCampus.cardHeading} - Map</h3>
              <button 
                onClick={() => setViewMapCampus(null)}
                className="text-white hover:text-gray-200 p-1 rounded-full hover:bg-blue-700 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-grow bg-gray-100 p-2">
              {viewMapCampus.mapIframe.trim().startsWith('<') ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: viewMapCampus.mapIframe.replace(/width="[^"]*"/, 'width="100%"').replace(/height="[^"]*"/, 'height="100%"') }} 
                  className="w-full h-full"
                />
              ) : (
                <iframe 
                  src={viewMapCampus.mapIframe} 
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
          </div>
        </div>
      )}
    </div>
  );
};

export default ESMCampusManage;
