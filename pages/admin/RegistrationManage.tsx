import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface RegistrationConfig {
  showSubjectMarks: boolean;
  showFinancialInfo: boolean;
  showReference: boolean;
  showUploads: boolean;
  showAcademicInfo: boolean;
  showParentInfo: boolean; // New
  showPersonalDetails: boolean; // New (Religion, Gender, Blood)
  showContactDetails: boolean; // New (Alt mobile, social, area)
  showScriptPrefs: boolean; // New (Method, Campus, Shift)
}

const RegistrationManage: React.FC = () => {
  const [config, setConfig] = useState<RegistrationConfig>({
    showSubjectMarks: false,
    showFinancialInfo: true,
    showReference: true,
    showUploads: true,
    showAcademicInfo: true,
    showParentInfo: true,
    showPersonalDetails: true,
    showContactDetails: true,
    showScriptPrefs: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'settings', 'registrationConfig');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          // Merge with default to handle missing keys in existing docs
          setConfig(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Error fetching config:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleToggle = (key: keyof RegistrationConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'registrationConfig'), config);
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading configuration...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-brand-900">Registration Form Management</h2>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <p className="mb-6 text-gray-600">Toggle the visibility of specific sections on the public Registration Form.</p>
        
        <div className="space-y-4">
          <ToggleItem 
            label="Parents Information (Father/Mother Name, Occu, Mobile)" 
            checked={config.showParentInfo} 
            onChange={() => handleToggle('showParentInfo')} 
          />
          <ToggleItem 
            label="Personal Details (Religion, Gender, Blood, NID)" 
            checked={config.showPersonalDetails} 
            onChange={() => handleToggle('showPersonalDetails')} 
          />
          <ToggleItem 
            label="Extended Contact (Alt Mobile, Social IDs, Area)" 
            checked={config.showContactDetails} 
            onChange={() => handleToggle('showContactDetails')} 
          />
           <ToggleItem 
            label="Academic Information (Institute, Batch, Results)" 
            checked={config.showAcademicInfo} 
            onChange={() => handleToggle('showAcademicInfo')} 
          />
           <ToggleItem 
            label="Subject Marks & Proficiency (Marks, Sets, Dates)" 
            checked={config.showSubjectMarks} 
            onChange={() => handleToggle('showSubjectMarks')} 
          />
          <ToggleItem 
            label="Script Checking Preferences (Method, Campus, Shift)" 
            checked={config.showScriptPrefs} 
            onChange={() => handleToggle('showScriptPrefs')} 
          />
          <ToggleItem 
            label="Financial Information (Bank/Bkash, TIN)" 
            checked={config.showFinancialInfo} 
            onChange={() => handleToggle('showFinancialInfo')} 
          />
           <ToggleItem 
            label="File Uploads (Photo & Documents)" 
            checked={config.showUploads} 
            onChange={() => handleToggle('showUploads')} 
          />
          <ToggleItem 
            label="Reference Field" 
            checked={config.showReference} 
            onChange={() => handleToggle('showReference')} 
          />
        </div>

        <div className="mt-8 pt-4 border-t">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-brand-600 text-white px-6 py-2 rounded shadow hover:bg-brand-700 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ToggleItem = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
  <div className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
    <span className="font-medium text-gray-800">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
      <span className="ml-3 text-sm font-medium text-gray-900">{checked ? 'ON' : 'OFF'}</span>
    </label>
  </div>
);

export default RegistrationManage;