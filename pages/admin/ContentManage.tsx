import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { ContentItem } from '../../types';

const ContentManage: React.FC = () => {
  const [type, setType] = useState<'notice' | 'campus' | 'program' | 'faq'>('notice');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!title || !body) return;
    
    await addDoc(collection(db, 'content'), {
        type,
        title,
        body,
        date: new Date().toISOString(),
        isVisible: true
    } as ContentItem);
    
    setTitle('');
    setBody('');
    alert(`${type.toUpperCase()} added successfully.`);
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-6 text-brand-900">Landing Page Management</h2>
      
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-bold mb-4">Add New Content</h3>
        <form onSubmit={handleAdd} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Content Type</label>
                <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value as any)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                >
                    <option value="notice">Notice</option>
                    <option value="campus">Campus</option>
                    <option value="program">Program</option>
                    <option value="faq">FAQ</option>
                </select>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Details/Body</label>
                <textarea 
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                    required
                />
            </div>

            <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700">
                Publish
            </button>
        </form>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4">Registration Field Management</h3>
        <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-500 text-sm">Toggle visibility of registration form fields here (Feature Placeholder).</p>
            <div className="mt-4 flex space-x-4">
                <label className="flex items-center space-x-2">
                    <input type="checkbox" checked readOnly className="rounded text-brand-600" />
                    <span>Show Bank Info</span>
                </label>
                <label className="flex items-center space-x-2">
                    <input type="checkbox" checked readOnly className="rounded text-brand-600" />
                    <span>Show Reference</span>
                </label>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ContentManage;