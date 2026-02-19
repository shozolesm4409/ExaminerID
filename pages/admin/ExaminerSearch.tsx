import React, { useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ExaminerData } from '../../types';

// -- Helper Components Defined Outside --

const SectionTitle = ({ title }: { title: string }) => (
    <div className="col-span-full mt-8 mb-4 border-b border-gray-200 pb-2">
        <h3 className="text-lg font-bold text-brand-800 flex items-center uppercase tracking-wide">
            <span className="w-1.5 h-6 bg-brand-500 mr-2 rounded"></span>
            {title}
        </h3>
    </div>
);

interface FieldProps {
  label: string;
  name: string;
  data: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  options?: string[];
  className?: string;
  placeholder?: string;
}

const Field = ({ label, name, data, onChange, type = "text", options = [], className="col-span-1", placeholder="" }: FieldProps) => (
  <div className={className}>
    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-wider">{label}</label>
    {options.length > 0 ? (
      <select 
        name={name} 
        value={data[name] || ''} 
        onChange={onChange}
        className="w-full border border-gray-300 bg-white text-gray-900 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all shadow-sm"
      >
         <option value="">Select...</option>
         {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input 
        type={type} 
        name={name} 
        value={data[name] || ''} 
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-gray-300 bg-white text-gray-900 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all shadow-sm"
      />
    )}
  </div>
);

interface SubjectInputProps {
  subject: string;
  prefix: string;
  data: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SubjectInputGroup = ({ subject, prefix, data, onChange }: SubjectInputProps) => (
  <div className="border border-gray-200 p-3 rounded bg-white shadow-sm hover:shadow-md transition-shadow">
      <h5 className="font-bold text-sm mb-3 text-brand-800 border-b pb-1">{subject}</h5>
      <div className="grid grid-cols-3 gap-2">
          <div>
              <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Marks (%)</label>
              <input 
                  name={`${prefix}Marks`} 
                  value={data[`${prefix}Marks`] || ''} 
                  onChange={onChange}
                  className="w-full border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 text-xs text-center" 
              />
          </div>
          <div>
               <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Set</label>
               <input 
                  name={`${prefix}Set`} 
                  value={data[`${prefix}Set`] || ''} 
                  onChange={onChange}
                  className="w-full border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 text-xs text-center" 
              />
          </div>
          <div>
               <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Date</label>
               <input 
                  type="text" 
                  name={`${prefix}Date`} 
                  value={data[`${prefix}Date`] || ''} 
                  onChange={onChange}
                  className="w-full border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 text-xs" 
              />
          </div>
      </div>
  </div>
);

// -- Main Component --

const ExaminerSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [result, setResult] = useState<ExaminerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  
  // Success Message State (String)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;

    setLoading(true);
    setError('');
    setResult(null);
    setSuccessMessage(null);

    try {
      const fieldsToCheck = ['tPin', 'mobileNumber', 'alternateMobile', 'mobileBankingNumber', 'sl', 'email'];
      let foundDoc: any = null;

      // Check if searching by SL (number) or other fields
      const isNum = !isNaN(Number(term));

      for (const field of fieldsToCheck) {
        let q;
        if (field === 'sl' && isNum) {
             q = query(collection(db, 'examiners'), where(field, '==', Number(term)));
        } else {
             q = query(collection(db, 'examiners'), where(field, '==', term));
        }
        
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          foundDoc = snapshot.docs[0];
          break; 
        }
      }
      
      if (foundDoc) {
        setResult({ ...foundDoc.data(), id: foundDoc.id } as ExaminerData);
      } else {
        setError('No examiner found. Try T-PIN, Mobile, SL, Email or Banking Number.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error searching: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !result.id) return;

    setUpdating(true);
    setSuccessMessage(null);
    try {
      const docRef = doc(db, 'examiners', result.id);
      
      // Prepare data removing ID
      const { id, ...rest } = result;
      const dataToSave: any = { ...rest };

      // Ensure SL is a number if it exists
      if (dataToSave.sl) {
        const numSl = Number(dataToSave.sl);
        if (!isNaN(numSl)) {
            dataToSave.sl = numSl;
        }
      }

      // Add last updated date
      dataToSave.lastUpdateDate = new Date().toISOString().split('T')[0];

      await updateDoc(docRef, dataToSave);
      
      // Update local state to reflect changes (and formatted types)
      setResult({ ...result, ...dataToSave });
      
      // Set Success Message
      const msg = `Successfully Updated! Name: ${result.fullName} Nick Name: ${result.nickName} T-PIN: ${result.tPin || 'N/A'}`;
      setSuccessMessage(msg);

      // Auto hide after 5 seconds
      setTimeout(() => {
          setSuccessMessage(null);
      }, 5000);

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (err: any) {
      console.error(err);
      alert('Failed to update: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (result) {
      setResult({ ...result, [e.target.name]: e.target.value });
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'photoUrl' | 'documentLink') => {
    if (e.target.files && e.target.files[0] && result) {
        const file = e.target.files[0];
        if (file.size > 500 * 1024) { // 500KB limit
            alert("File too large. Please select a file under 500KB.");
            e.target.value = '';
            return;
        }
        try {
            const base64 = await convertToBase64(file);
            setResult({ ...result, [fieldName]: base64 });
        } catch (err) {
            console.error("File convert error", err);
            alert("Error processing file.");
        }
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-900">
            Update Examiner Profile
        </h2>
      </div>

      {/* Success Message Body - Single Row */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded relative mb-8 text-center font-bold text-lg shadow animate-fade-in-up">
            {successMessage}
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-100">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-grow">
            <label className="block text-sm font-bold text-gray-700 mb-2">Search Examiner</label>
            <div className="relative">
                <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                placeholder="Search by T-PIN, Mobile, SL, Email or Banking Number"
                className="w-full border-gray-300 bg-white text-gray-900 rounded-lg px-4 py-3 focus:ring-brand-500 focus:border-brand-500 text-lg shadow-sm"
                />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-brand-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-brand-700 shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            {loading ? 'Searching...' : 'Find Examiner'}
          </button>
        </form>
        {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded border border-red-200 flex items-center text-sm"><span className="font-bold mr-2">!</span> {error}</div>}
      </div>

      {/* Profile/Update Form */}
      {result && (
        <form onSubmit={handleUpdate} className="animate-fade-in-up">
          {/* Header Card */}
          <div className="bg-white rounded-t-xl shadow-lg border-b border-gray-200 overflow-hidden">
             <div className="bg-gradient-to-r from-brand-900 to-brand-700 h-24"></div>
             <div className="px-8 pb-4 flex flex-col md:flex-row items-end -mt-10 mb-2">
                <div className="relative mr-6">
                    {result.photoUrl ? (
                        <img src={result.photoUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-white" />
                    ) : (
                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-gray-200 flex items-center justify-center text-3xl text-gray-400">
                            User
                        </div>
                    )}
                </div>
                <div className="flex-grow pt-2 md:pt-0 text-center md:text-left">
                    <h1 className="text-2xl font-bold text-gray-900">{result.fullName}</h1>
                    <p className="text-gray-600 font-medium text-sm">Nick Name: {result.nickName} | T-PIN: {result.tPin || 'N/A'}</p>
                </div>
                <div className="mt-4 md:mt-0">
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider ${result.status === 'Approved' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                        {result.status}
                    </div>
                </div>
             </div>
          </div>

          {/* Main Content Grid */}
          <div className="bg-white rounded-b-xl shadow-lg p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
               
               {/* --- Office & Admin --- */}
               <div className="col-span-full bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-brand-900 mb-4 flex items-center uppercase tracking-wide text-sm border-b border-gray-300 pb-2">
                      Office Administration
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* SL Input Removed */}
                    <Field label="T-PIN" name="tPin" data={result} onChange={handleChange} />
                    <Field label="Status" name="status" options={['Pending', 'Approved', 'Rejected']} data={result} onChange={handleChange} />
                    <Field label="ID (Old)" name="oldId" data={result} onChange={handleChange} />
                    
                    <Field label="RM" name="rm" data={result} onChange={handleChange} />
                    <Field label="Remarked By" name="remarkedBy" data={result} onChange={handleChange} />
                    <Field label="RM 4 Comment" name="rm4Comment" data={result} onChange={handleChange} className="col-span-1 md:col-span-2" />

                    <Field label="Entry By" name="entryBy" data={result} onChange={handleChange} />
                    <Field label="Form Fill Up Date" name="formFillUpDate" type="text" data={result} onChange={handleChange} placeholder="YYYY-MM-DD" />
                    <Field label="ID Checked?" name="idChecked" options={['true', 'false']} data={result} onChange={handleChange} />
                    
                    <Field label="Training Report" name="trainingReport" data={result} onChange={handleChange} />
                    <Field label="Training Date" name="trainingDate" type="text" data={result} onChange={handleChange} placeholder="YYYY-MM-DD" />
                  </div>
               </div>

               {/* --- Internal Program Info --- */}
               <SectionTitle title="Programs & Permissions" />
               <Field label="Running Program" name="runningProgram" data={result} onChange={handleChange} />
               <Field label="Previous Program" name="previousProgram" data={result} onChange={handleChange} />
               <Field label="Selected Subject" name="selectedSubject" data={result} onChange={handleChange} />
               <div className="hidden lg:block"></div>
               
               <Field label="Physically Scripts Checking Subject" name="physicallyCheckSubjects" className="col-span-1 md:col-span-2" data={result} onChange={handleChange} />
               <Field label="Online Subject Permission" name="onlineSubjectPermission" className="col-span-1 md:col-span-2" data={result} onChange={handleChange} />

               {/* --- Personal Info --- */}
               <SectionTitle title="Personal Information" />
               <Field label="Nick Name" name="nickName" data={result} onChange={handleChange} />
               <Field label="Full Name (English)" name="fullName" data={result} onChange={handleChange} />
               <Field label="Full Name (Bangla)" name="fullNameBn" data={result} onChange={handleChange} />
               <Field label="Date of Birth" name="dob" type="text" data={result} onChange={handleChange} placeholder="YYYY-MM-DD" />
               
               <Field label="Gender" name="gender" options={['Male', 'Female', 'Other']} data={result} onChange={handleChange} />
               <Field label="Religion" name="religion" options={['Islam', 'Hinduism', 'Christianity', 'Buddhism', 'Other']} data={result} onChange={handleChange} />
               <Field label="Blood Group" name="bloodGroup" data={result} onChange={handleChange} />
               <Field label="Blood Donate?" name="bloodDonate" data={result} onChange={handleChange} />
               
               <Field label="NID Number" name="nidNo" className="col-span-1 md:col-span-2" data={result} onChange={handleChange} />
               <Field label="Present Area" name="presentArea" data={result} onChange={handleChange} />
               <Field label="Home District" name="homeDistrict" data={result} onChange={handleChange} />

               {/* --- Parents --- */}
               <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                   <div className="bg-gray-50 p-4 rounded border border-gray-100">
                       <h5 className="font-bold text-gray-700 border-b pb-1 mb-3 text-xs uppercase">Father's Information</h5>
                       <div className="space-y-3">
                           <Field label="Name" name="fatherName" data={result} onChange={handleChange} />
                           <Field label="Occupation" name="fatherOccupation" data={result} onChange={handleChange} />
                           <Field label="Designation" name="fatherDesignation" data={result} onChange={handleChange} />
                           <Field label="Mobile" name="fatherMobile" data={result} onChange={handleChange} />
                       </div>
                   </div>
                   <div className="bg-gray-50 p-4 rounded border border-gray-100">
                       <h5 className="font-bold text-gray-700 border-b pb-1 mb-3 text-xs uppercase">Mother's Information</h5>
                       <div className="space-y-3">
                           <Field label="Name" name="motherName" data={result} onChange={handleChange} />
                           <Field label="Occupation" name="motherOccupation" data={result} onChange={handleChange} />
                           <Field label="Mobile" name="motherMobile" data={result} onChange={handleChange} />
                       </div>
                   </div>
               </div>

               {/* --- Contact --- */}
               <SectionTitle title="Contact Details" />
               <Field label="Primary Mobile" name="mobileNumber" data={result} onChange={handleChange} />
               <Field label="Alternate Mobile" name="alternateMobile" data={result} onChange={handleChange} />
               <Field label="Email Address" name="email" className="col-span-1 md:col-span-2" data={result} onChange={handleChange} />
               <Field label="Facebook ID" name="facebookId" data={result} onChange={handleChange} />
               <Field label="Teams/Skype ID" name="teamsSkypeId" data={result} onChange={handleChange} />

               {/* --- Academic --- */}
               <SectionTitle title="Academic Information" />
               <Field label="Institution" name="inst" className="col-span-1 md:col-span-2" data={result} onChange={handleChange} />
               <Field label="Department" name="dept" data={result} onChange={handleChange} />
               <Field label="HSC Batch" name="hscBatch" data={result} onChange={handleChange} />
               
               <Field label="HSC Roll" name="hscRoll" data={result} onChange={handleChange} />
               <Field label="HSC Reg" name="hscReg" data={result} onChange={handleChange} />
               <Field label="HSC Board" name="hscBoard" data={result} onChange={handleChange} />
               <Field label="HSC GPA" name="hscGpa" data={result} onChange={handleChange} />
               
               <Field label="Admission Position" name="admissionPosition" data={result} onChange={handleChange} />
               <Field label="Admission Unit" name="admissionUnit" data={result} onChange={handleChange} />
               <Field label="Udvash Roll/Reg" name="udvashRoll" data={result} onChange={handleChange} />
               <Field label="Participated Programs" name="participatedPrograms" data={result} onChange={handleChange} />

               <Field label="College Name" name="collegeName" className="col-span-1 md:col-span-2" data={result} onChange={handleChange} />
               <Field label="Medium (HSC)" name="mediumHsc" data={result} onChange={handleChange} />
               <Field label="Reference" name="reference" data={result} onChange={handleChange} />

               {/* --- Script Preferences --- */}
               <SectionTitle title="Script Checking Preferences" />
               <Field label="Checking Method" name="scriptCheckMethod" options={['Online', 'Physical', 'Both']} data={result} onChange={handleChange} />
               <Field label="Preferred Shift" name="checkScriptsShift" className="col-span-1 md:col-span-2" data={result} onChange={handleChange} />
               <Field label="Physical Campus" name="checkScriptsCampus" data={result} onChange={handleChange} />
               
               <Field label="Assigned Branch" name="branch" data={result} onChange={handleChange} />
               <Field label="Form Fill Campus" name="formFillUpCampus" data={result} onChange={handleChange} />
               <Field label="Version Interested" name="versionInterested" data={result} onChange={handleChange} />

               {/* Subject Priorities */}
               <div className="col-span-full bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-2">
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Subject Priorities (1-5)</label>
                   <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        <input name="subject1" value={result.subject1 || ''} onChange={handleChange} className="border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 text-sm" placeholder="Priority 1" />
                        <input name="subject2" value={result.subject2 || ''} onChange={handleChange} className="border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 text-sm" placeholder="Priority 2" />
                        <input name="subject3" value={result.subject3 || ''} onChange={handleChange} className="border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 text-sm" placeholder="Priority 3" />
                        <input name="subject4" value={result.subject4 || ''} onChange={handleChange} className="border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 text-sm" placeholder="Priority 4" />
                        <input name="subject5" value={result.subject5 || ''} onChange={handleChange} className="border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 text-sm" placeholder="Priority 5" />
                   </div>
               </div>

               {/* --- Marks --- */}
               <SectionTitle title="Subject Proficiency & Marks" />
               <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <SubjectInputGroup subject="English" prefix="english" data={result} onChange={handleChange} />
                  <SubjectInputGroup subject="Bangla" prefix="bangla" data={result} onChange={handleChange} />
                  <SubjectInputGroup subject="Physics" prefix="physics" data={result} onChange={handleChange} />
                  <SubjectInputGroup subject="Chemistry" prefix="chemistry" data={result} onChange={handleChange} />
                  <SubjectInputGroup subject="Math" prefix="math" data={result} onChange={handleChange} />
                  <SubjectInputGroup subject="Biology" prefix="biology" data={result} onChange={handleChange} />
                  <SubjectInputGroup subject="ICT" prefix="ict" data={result} onChange={handleChange} />
               </div>

               {/* --- Financial --- */}
               <SectionTitle title="Financial Information" />
               <Field label="Payment Method" name="paymentMethod" options={['Bkash', 'Rocket', 'Nagad', 'Bank']} data={result} onChange={handleChange} />
               <Field label="Banking Number" name="mobileBankingNumber" data={result} onChange={handleChange} />
               <Field label="Account Owner" name="mobileBankingOwner" data={result} onChange={handleChange} />
               <Field label="Confirmed By" name="mobileBankingConfirmedBy" data={result} onChange={handleChange} />
               <Field label="TIN Number" name="tinNumber" data={result} onChange={handleChange} />
               <Field label="TIN Link/Date" name="tinDateLink" className="col-span-1 md:col-span-2" data={result} onChange={handleChange} />

               {/* --- Files --- */}
               <SectionTitle title="Documents & Files" />
               <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Photo</label>
                      <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'photoUrl')} 
                            className="w-full text-xs text-gray-500 mb-2"
                      />
                      <input name="photoUrl" value={result.photoUrl || ''} onChange={handleChange} className="w-full border border-gray-300 bg-white text-gray-900 rounded px-3 py-2 text-sm" placeholder="Paste URL directly if preferred" />
                      {result.photoUrl && (
                        <div className="mt-2">
                            <span className="text-xs text-green-600 font-bold mr-2">✓ Has Value</span>
                            <a href={result.photoUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">View Image</a>
                        </div>
                      )}
                  </div>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Document</label>
                      <input 
                            type="file" 
                            accept=".pdf,.doc,.docx,image/*"
                            onChange={(e) => handleFileChange(e, 'documentLink')} 
                            className="w-full text-xs text-gray-500 mb-2"
                      />
                      <input name="documentLink" value={result.documentLink || ''} onChange={handleChange} className="w-full border border-gray-300 bg-white text-gray-900 rounded px-3 py-2 text-sm" placeholder="Paste URL directly if preferred" />
                      {result.documentLink && (
                         <div className="mt-2">
                             <span className="text-xs text-green-600 font-bold mr-2">✓ Has Value</span>
                             <a href={result.documentLink} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">Open Document</a>
                         </div>
                      )}
                  </div>
               </div>

            </div>

            <div className="mt-8 flex justify-end sticky bottom-4">
                <button 
                type="submit" 
                disabled={updating}
                className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold hover:bg-green-700 shadow-xl transform transition hover:-translate-y-1 flex items-center text-lg"
                >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                {updating ? 'Saving Changes...' : 'Update Examiner Data'}
                </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default ExaminerSearch;