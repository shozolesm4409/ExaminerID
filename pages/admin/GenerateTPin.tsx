import React, { useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ExaminerData } from '../../types';

interface SubjectCheck {
  name: string;
  key: keyof ExaminerData; // The key for marks in ExaminerData
  checked: boolean;
}

const GenerateTPin: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExaminerData | null>(null);
  const [error, setError] = useState('');
  const [generatedTPin, setGeneratedTPin] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  
  // State for success message (String)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // State for Confirmation Modal
  const [showConfirm, setShowConfirm] = useState(false);

  // Updated subject list to split Math into Mathematics and Higher Mathematics
  const subjectsToCheck = [
    { name: 'English', key: 'englishMarks' },
    { name: 'Bangla', key: 'banglaMarks' },
    { name: 'Physics', key: 'physicsMarks' },
    { name: 'Chemistry', key: 'chemistryMarks' },
    { name: 'Mathematics', key: 'mathMarks' },
    { name: 'Higher Mathematics', key: 'mathMarks' },
    { name: 'Biology', key: 'biologyMarks' },
    { name: 'ICT', key: 'ictMarks' },
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);
    setGeneratedTPin('');
    setSelectedSubjects([]);
    setSuccessMessage(null); 

    try {
      const term = searchTerm.trim();
      const fieldsToCheck = ['mobileNumber', 'alternateMobile', 'mobileBankingNumber'];
      let foundDoc: any = null;

      for (const field of fieldsToCheck) {
        const q = query(collection(db, 'examiners'), where(field, '==', term));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          foundDoc = snapshot.docs[0];
          break;
        }
      }

      if (foundDoc) {
        const data = { ...foundDoc.data(), id: foundDoc.id } as ExaminerData;

        // Check if T-PIN already exists
        if (data.tPin && data.tPin.trim() !== '') {
            setError(`This examiner already has a T-PIN assigned (${data.tPin}). You cannot regenerate it here.`);
            setLoading(false);
            return;
        }

        setResult(data);
        
        // Auto select subjects if marks >= 40 (Changed from 49 as per request)
        const autoSelected: string[] = [];
        subjectsToCheck.forEach(sub => {
            const markVal = data[sub.key as keyof ExaminerData];
            const mark = Number(markVal);
            // Check if it is a number and >= 40
            if (!isNaN(mark) && mark >= 40) {
                autoSelected.push(sub.name);
            }
        });
        setSelectedSubjects(autoSelected);

      } else {
        setError('No record found for the provided number.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Search failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (result) {
          setResult({ ...result, [e.target.name]: e.target.value });
      }
  };

  // Step 1: Triggered by Button - Validates and Opens Modal
  const handleGenerateClick = () => {
    if (!result || !result.id) return;
    
    // Generate T-PIN if not already entered manually
    let pinToUse = generatedTPin;
    if (!pinToUse) {
        // Format: 5 random digits (10000 - 99999)
        pinToUse = `${Math.floor(10000 + Math.random() * 90000)}`;
        setGeneratedTPin(pinToUse);
    }
    
    if (pinToUse.length !== 5) {
        alert("Please ensure T-PIN is 5 digits.");
        return;
    }

    setShowConfirm(true);
  };

  // Step 2: Triggered by Modal - Performs the Save
  const handleConfirmSave = async () => {
    setShowConfirm(false);

    if (!result || !result.id) return;
    
    const newTPin = generatedTPin;
    
    if (!newTPin || newTPin.length !== 5) {
        alert("Error: Invalid T-PIN. Please regenerate.");
        return;
    }

    setGenerating(true);

    try {
        // 1. Prepare Data for Update
        const { id, ...rest } = result;
        
        // Sanitize data: Remove undefined values by parsing JSON
        // Firestore updateDoc fails if any field is undefined
        const dataToSave = JSON.parse(JSON.stringify(rest));
        
        // Update Examiner Record with T-PIN AND any edited details
        await updateDoc(doc(db, 'examiners', result.id), {
            ...dataToSave,
            tPin: newTPin
        });

        // 2. Add to new database collection (tpin_registry) using the LATEST edited data
        const registryData = {
            examinerId: result.id,
            tPin: newTPin,
            nickName: result.nickName || '',
            inst: result.inst || '',
            dept: result.dept || '',
            hscBatch: result.hscBatch || '',
            mobileNumber: result.mobileNumber || '',
            alternateMobile: result.alternateMobile || '',
            mobileBankingNumber: result.mobileBankingNumber || '',
            paymentMethod: result.paymentMethod || '',
            tinNumber: result.tinNumber || '',
            email: result.email || '',
            versionInterested: result.versionInterested || '',
            fullName: result.fullName || '',
            fullNameBn: result.fullNameBn || '',
            religion: result.religion || '',
            gender: result.gender || '',
            dob: result.dob || '',
            collegeName: result.collegeName || '',
            fatherName: result.fatherName || '',
            motherName: result.motherName || '',
            nidNo: result.nidNo || '',
            presentArea: result.presentArea || '',
            homeDistrict: result.homeDistrict || '',
            qualifiedSubjects: selectedSubjects,
            generatedAt: new Date().toISOString(),
            generatedBy: 'Admin'
        };

        // Sanitize registry data as well just in case
        const sanitizedRegistryData = JSON.parse(JSON.stringify(registryData));
        
        await addDoc(collection(db, 'tpin_registry'), sanitizedRegistryData);

        // Set Success Message in UI
        const msg = `Success! Nick Name: ${result.nickName} T-PIN: ${newTPin}`;
        setSuccessMessage(msg);

        // Auto hide after 5 seconds
        setTimeout(() => {
            setSuccessMessage(null);
        }, 5000);

        // Reset search to prevent re-submission and close form
        setResult(null);
        setGeneratedTPin('');
        setSearchTerm('');
        
        // Scroll to top to see message
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err: any) {
        console.error("Error saving T-PIN:", err);
        alert("Error saving T-PIN to database. Please check console. " + err.message);
    } finally {
        setGenerating(false);
    }
  };

  // Editable Field Component
  const EditableField = ({ label, name, value, onChange }: { label: string, name: string, value: string | undefined, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="flex flex-col">
        <label className="text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
        <input 
            type="text"
            name={name}
            value={value || ''}
            onChange={onChange}
            className="p-2 border border-gray-300 rounded text-sm text-gray-700 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
        />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-10 relative">
      <h2 className="text-2xl font-bold mb-6 text-brand-900">Generate T-PIN</h2>

      {/* Success Message Body */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded relative mb-8 text-center font-bold text-lg shadow">
            {successMessage}
        </div>
      )}

      {/* Search Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-grow">
                <label className="block text-sm font-bold text-brand-800 mb-1">Search Examiner (Pending T-PIN)</label>
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Enter Mobile, Alternate, or Banking Number"
                    className="w-full border border-gray-300 bg-white rounded-md px-4 py-2 text-gray-900 placeholder-gray-500 focus:ring-brand-500 focus:border-brand-500 font-medium shadow-sm"
                />
            </div>
            <button 
                type="submit" 
                disabled={loading}
                className="bg-brand-600 text-white px-6 py-2 rounded-md font-bold hover:bg-brand-700 disabled:opacity-50"
            >
                {loading ? 'Searching...' : 'Search'}
            </button>
        </form>
        {error && <p className="text-red-600 mt-2 text-sm font-medium bg-red-50 p-2 rounded border border-red-200">{error}</p>}
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Examiner Details (Editable)</h3>
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold border border-yellow-200">
                    Ready for T-PIN
                </span>
            </div>

            <div className="p-6">
                {/* Image Section */}
                <div className="flex justify-center mb-8">
                    {result.photoUrl ? (
                        <div className="relative">
                            <img 
                                src={result.photoUrl} 
                                alt="Examiner" 
                                className="w-32 h-32 rounded-full object-cover border-4 border-brand-200 shadow-md" 
                            />
                            <div className="absolute bottom-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow">
                                Photo Found
                            </div>
                        </div>
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300 text-gray-400">
                            <span className="text-xs">No Photo</span>
                        </div>
                    )}
                </div>

                {/* Form Grid - Editable */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                    <EditableField label="Nick Name" name="nickName" value={result.nickName} onChange={handleInputChange} />
                    <EditableField label="Institute" name="inst" value={result.inst} onChange={handleInputChange} />
                    <EditableField label="Department" name="dept" value={result.dept} onChange={handleInputChange} />
                    <EditableField label="HSC Batch" name="hscBatch" value={result.hscBatch} onChange={handleInputChange} />
                    
                    <EditableField label="Mobile Number" name="mobileNumber" value={result.mobileNumber} onChange={handleInputChange} />
                    <EditableField label="Alternate Mobile" name="alternateMobile" value={result.alternateMobile} onChange={handleInputChange} />
                    <EditableField label="Banking Number" name="mobileBankingNumber" value={result.mobileBankingNumber} onChange={handleInputChange} />
                    <EditableField label="Payment Method" name="paymentMethod" value={result.paymentMethod} onChange={handleInputChange} />
                    
                    <EditableField label="TIN Number" name="tinNumber" value={result.tinNumber} onChange={handleInputChange} />
                    <EditableField label="E-mail" name="email" value={result.email} onChange={handleInputChange} />
                    <EditableField label="Version Interested" name="versionInterested" value={result.versionInterested} onChange={handleInputChange} />
                    <EditableField label="Date of Birth" name="dob" value={result.dob} onChange={handleInputChange} />

                    <EditableField label="Full Name" name="fullName" value={result.fullName} onChange={handleInputChange} />
                    <EditableField label="বাংলায় নাম" name="fullNameBn" value={result.fullNameBn} onChange={handleInputChange} />
                    <EditableField label="Religion" name="religion" value={result.religion} onChange={handleInputChange} />
                    <EditableField label="Gender" name="gender" value={result.gender} onChange={handleInputChange} />

                    <EditableField label="College Name" name="collegeName" value={result.collegeName} onChange={handleInputChange} />
                    <EditableField label="Father's Name" name="fatherName" value={result.fatherName} onChange={handleInputChange} />
                    <EditableField label="Mother's Name" name="motherName" value={result.motherName} onChange={handleInputChange} />
                    <EditableField label="NID No." name="nidNo" value={result.nidNo} onChange={handleInputChange} />
                    
                    <EditableField label="Present Area" name="presentArea" value={result.presentArea} onChange={handleInputChange} />
                    <EditableField label="Home District" name="homeDistrict" value={result.homeDistrict} onChange={handleInputChange} />
                </div>

                {/* Subject Auto-Selection */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-8">
                    <h4 className="font-bold text-brand-900 mb-3 text-sm uppercase">Qualified Subjects (Marks &ge; 40%)</h4>
                    <div className="flex flex-wrap gap-3">
                        {subjectsToCheck.map(sub => (
                            <label key={sub.name} className={`flex items-center space-x-2 px-3 py-2 rounded border cursor-pointer ${selectedSubjects.includes(sub.name) ? 'bg-white border-brand-500 shadow-sm' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedSubjects.includes(sub.name)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedSubjects([...selectedSubjects, sub.name]);
                                        } else {
                                            setSelectedSubjects(selectedSubjects.filter(s => s !== sub.name));
                                        }
                                    }}
                                    className="text-brand-600 rounded focus:ring-brand-500"
                                />
                                <span className={`text-sm font-medium ${selectedSubjects.includes(sub.name) ? 'text-brand-900' : 'text-gray-500'}`}>
                                    {sub.name} <span className="text-xs text-gray-400">({result[sub.key as keyof ExaminerData] || 0}%)</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Action Area */}
                <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="w-full md:w-auto flex-grow max-w-md">
                        <label className="block text-sm font-bold text-gray-700 mb-1">T-PIN (5 Digits)</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={generatedTPin}
                                onChange={(e) => setGeneratedTPin(e.target.value)}
                                placeholder="Click Generate or Enter"
                                maxLength={5}
                                className="flex-grow border border-gray-300 rounded px-3 py-2 font-mono text-lg font-bold text-center tracking-wider text-brand-900"
                            />
                        </div>
                    </div>
                    
                    <button 
                        type="button"
                        onClick={handleGenerateClick}
                        disabled={generating}
                        className="w-full md:w-auto bg-gradient-to-r from-brand-600 to-brand-800 text-white px-8 py-3 rounded shadow-lg font-bold hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {generating ? 'Saving...' : 'GENERATE & SAVE DATABASE'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Confirmation Modal Popup - High Z-Index to stay above other elements */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 transform scale-100 transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Confirm T-PIN Generation</h3>
            
            <div className="bg-blue-50 p-4 rounded border border-blue-100 mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 font-bold uppercase">Examiner:</span>
                    <span className="text-base text-brand-900 font-bold">{result?.nickName}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-bold uppercase">Assigned T-PIN:</span>
                    <span className="text-2xl text-green-600 font-mono font-bold tracking-widest bg-white px-2 rounded border border-green-200">{generatedTPin}</span>
                </div>
            </div>
            
            <div className="text-gray-600 text-sm mb-6 leading-relaxed">
                <p>Are you sure you want to save this T-PIN to the database?</p>
                <ul className="list-disc list-inside mt-2 ml-1 text-xs text-gray-500">
                    <li>Update the examiner's main record.</li>
                    <li>Add an entry to the T-PIN Registry.</li>
                </ul>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
                <button 
                    onClick={() => setShowConfirm(false)}
                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-bold text-sm transition focus:ring-2 focus:ring-gray-400"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleConfirmSave}
                    className="px-5 py-2.5 bg-brand-600 text-white rounded hover:bg-brand-700 font-bold text-sm shadow transition focus:ring-2 focus:ring-brand-500"
                >
                    Yes, Confirm & Save
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GenerateTPin;