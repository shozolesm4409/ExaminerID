import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { ExaminerData } from '../../types';

// -- Helpers --

// WhatsApp Icon Component
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-500 fill-current ml-2 cursor-pointer hover:scale-110 transition-transform" title="Contact on WhatsApp">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.932.513 1.745.709 2.799.709 3.181 0 5.768-2.587 5.768-5.766.001-3.182-2.585-5.769-5.766-5.769zm9.554 6.106c0-4.973-4.46-8.71-9.608-8.71-5.273 0-9.508 4.054-9.508 8.946 0 1.692.493 3.23 1.259 4.605l-1.616 5.877 6.088-1.587c1.172.636 2.455.911 3.779.911 5.273 0 9.508-4.054 9.508-8.946l-.001-1.102z" />
  </svg>
);

const ViewProfile: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [result, setResult] = useState<ExaminerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const fieldsToCheck = ['tPin', 'mobileNumber', 'alternateMobile', 'mobileBankingNumber', 'sl', 'email'];
      let foundDoc: any = null;

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

  // Logic for Assessments Report
  // English > 59 (Green), Others > 49 (Green)
  const getSubjectStatus = (subject: string, marks: string) => {
    if (!marks || marks.trim() === '') return { status: 'No Exam', color: 'text-red-600', isAllow: false };
    
    const num = Number(marks);
    if (isNaN(num)) return { status: 'Invalid', color: 'text-gray-500', isAllow: false };

    // Condition Logic
    const threshold = subject === 'English' ? 59 : 49;
    
    if (num > threshold) {
        return { status: 'Allow', color: 'text-green-600', isAllow: true };
    } else {
        return { status: 'Not Allow', color: 'text-red-600', isAllow: false };
    }
  };

  // Helper to render a table row
  const renderRow = (subject: string, marks: string, set: string, date: string) => {
    const { status, color, isAllow } = getSubjectStatus(subject, marks);
    
    // Formatting: e.g., "44% (G)"
    const markDisplay = marks ? `${marks}% ${set ? `(${set})` : ''}` : '';

    return (
      <tr className="border-b border-gray-200 hover:bg-gray-50 text-sm">
        <td className="py-2 px-4 font-bold text-gray-700">{subject} (%)</td>
        <td className={`py-2 px-4 text-center font-bold ${color}`}>
            {markDisplay}
        </td>
        <td className="py-2 px-4 text-center text-gray-600">{date || ''}</td>
        <td className={`py-2 px-4 text-center font-bold ${color}`}>
           {status}
        </td>
      </tr>
    );
  };

  // Helper for Subject Choice Display
  const getSubjectChoice = (data: ExaminerData) => {
     const subs = [data.subject1, data.subject2, data.subject3, data.subject4, data.subject5].filter(Boolean);
     return subs.length > 0 ? subs.join(', ') : 'N/A';
  };

  return (
    <div className="max-w-5xl mx-auto pb-10 px-4">
      <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">Examiner Portal</h2>

      {/* Search Bar */}
      <div className="flex justify-center mb-8">
        <form onSubmit={handleSearch} className="flex w-full max-w-lg shadow-sm">
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Search by T-Pin, Mobile..."
            className="flex-grow border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-r hover:bg-blue-700 transition flex items-center justify-center"
          >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
        </form>
      </div>
      
      {error && <div className="text-center text-red-600 font-bold mb-4">{error}</div>}
      {loading && <div className="text-center text-gray-500 mb-4">Searching...</div>}

      {result && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
            
            {/* Header Blue Bar */}
            <div className="bg-brand-900 text-white px-6 py-3 flex justify-between items-center">
                <h3 className="font-bold text-lg">Examiner Quick Info</h3>
                <div className="flex gap-4 text-sm font-bold text-yellow-400">
                    <span>T-Pin: <span className="text-white">{result.tPin || 'N/A'}</span></span>
                    <span>RM: <span className="text-white">{result.rm || 'N/A'}</span></span>
                </div>
            </div>

            {/* Quick Info Grid with Photo */}
            <div className="p-6 flex flex-col md:flex-row gap-6">
                
                {/* Info Text Area */}
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    {/* Left Col */}
                    <div className="space-y-2">
                        <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">Nick Name:</span>
                            <span className="col-span-2 text-gray-900 font-medium">{result.nickName}</span>
                        </div>
                        <div className="grid grid-cols-3 items-center">
                            <span className="font-bold text-gray-700">Mobile 1:</span>
                            <span className="col-span-2 text-gray-900 flex items-center">
                                {result.mobileNumber} <WhatsAppIcon />
                            </span>
                        </div>
                        <div className="grid grid-cols-3 items-center">
                            <span className="font-bold text-gray-700">Mobile 2:</span>
                            <span className="col-span-2 text-gray-900 flex items-center">
                                {result.alternateMobile || 'N/A'} {result.alternateMobile && <WhatsAppIcon />}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 items-center">
                            <span className="font-bold text-gray-700">Nagad Number:</span>
                            <span className="col-span-2 text-gray-900 flex items-center">
                                {result.mobileBankingNumber || 'N/A'} {result.mobileBankingNumber && <WhatsAppIcon />}
                            </span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">Training Report:</span>
                            <span className="col-span-2 text-gray-900">{result.trainingReport || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Right Col */}
                    <div className="space-y-2">
                        <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">Full Name:</span>
                            <span className="col-span-2 text-gray-900">{result.fullName}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">Institute:</span>
                            <span className="col-span-2 text-gray-900">{result.inst}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">Department:</span>
                            <span className="col-span-2 text-gray-900">{result.dept}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">HSC Batch:</span>
                            <span className="col-span-2 text-gray-900">{result.hscBatch}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">Physically Campus:</span>
                            <span className="col-span-2 text-gray-900">{result.checkScriptsCampus || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Photo Section (Right Side) */}
                <div className="flex-shrink-0 flex justify-center md:justify-start">
                    {result.photoUrl ? (
                         <a href={result.photoUrl} target="_blank" rel="noreferrer" className="block border-4 border-gray-200 shadow-sm hover:shadow-md transition">
                             <img src={result.photoUrl} alt="Examiner" className="w-32 h-36 object-cover bg-white" />
                         </a>
                    ) : (
                         <div className="w-32 h-36 border-4 border-gray-200 shadow-sm bg-gray-100 flex items-center justify-center text-gray-400">
                             <span className="text-xs font-bold">No Photo</span>
                         </div>
                    )}
                </div>
            </div>

            {/* Assessments Report Section */}
            <div className="px-6 py-2">
                <div className="border-l-4 border-brand-800 bg-gray-100 px-3 py-2 mb-3">
                    <h4 className="font-bold text-gray-700 text-sm">Assessments Report</h4>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-slate-600 text-white text-sm">
                                <th className="py-2 px-4 text-left border-r border-gray-500 w-1/4">Subjects</th>
                                <th className="py-2 px-4 text-center border-r border-gray-500 w-1/4">% & Set</th>
                                <th className="py-2 px-4 text-center border-r border-gray-500 w-1/4">Date</th>
                                <th className="py-2 px-4 text-center w-1/4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderRow("English", result.englishMarks, result.englishSet, result.englishDate)}
                            {renderRow("Bangla", result.banglaMarks, result.banglaSet, result.banglaDate)}
                            {renderRow("Physics", result.physicsMarks, result.physicsSet, result.physicsDate)}
                            {renderRow("Chemistry", result.chemistryMarks, result.chemistrySet, result.chemistryDate)}
                            {renderRow("Math", result.mathMarks, result.mathSet, result.mathDate)}
                            {renderRow("Biology", result.biologyMarks, result.biologySet, result.biologyDate)}
                            {renderRow("ICT", result.ictMarks, result.ictSet, result.ictDate)}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Personal Information Section */}
            <div className="p-6">
                <div className="border-l-4 border-brand-800 bg-gray-100 px-3 py-2 mb-4">
                    <h4 className="font-bold text-gray-700 text-sm">Personal Information</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-sm">
                    {/* Left Col */}
                    <div className="space-y-2">
                         <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">Father's Name:</span>
                            <span className="col-span-2 text-gray-900">{result.fatherName}</span>
                         </div>
                         <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">Religion:</span>
                            <span className="col-span-2 text-gray-900">{result.religion}</span>
                         </div>
                         <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">Date of Birth:</span>
                            <span className="col-span-2 text-gray-900">{result.dob}</span>
                         </div>
                         <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">Teams ID:</span>
                            <span className="col-span-2 text-gray-900">{result.teamsSkypeId || '-'}</span>
                         </div>
                         <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">E-mail:</span>
                            <span className="col-span-2 text-blue-800 underline">{result.email}</span>
                         </div>
                         <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">Home District:</span>
                            <span className="col-span-2 text-gray-900">{result.homeDistrict}</span>
                         </div>
                         <div className="grid grid-cols-3">
                            <span className="font-bold text-blue-600">Subjects Choice:</span>
                            <span className="col-span-2 text-blue-600 font-medium">{getSubjectChoice(result)}</span>
                         </div>
                         <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">Version Interested:</span>
                            <span className="col-span-2 text-gray-900">{result.versionInterested || '-'}</span>
                         </div>
                         <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">Running Program:</span>
                            <span className="col-span-2 text-gray-900">{result.runningProgram || '-'}</span>
                         </div>
                    </div>

                    {/* Right Col */}
                    <div className="space-y-2">
                         <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">Mother's Name:</span>
                            <span className="col-span-2 text-gray-900">{result.motherName}</span>
                         </div>
                         <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">Gender:</span>
                            <span className="col-span-2 text-gray-900">{result.gender}</span>
                         </div>
                         <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">HSC Roll:</span>
                            <span className="col-span-2 text-gray-900">{result.hscRoll}</span>
                         </div>
                         <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">HSC Reg:</span>
                            <span className="col-span-2 text-gray-900">{result.hscReg}</span>
                         </div>
                         <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">HSC Board:</span>
                            <span className="col-span-2 text-gray-900">{result.hscBoard}</span>
                         </div>
                         <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">Reg. Date:</span>
                            <span className="col-span-2 text-gray-900">{result.formFillUpDate}</span>
                         </div>
                         <div className="grid grid-cols-3">
                            <span className="font-bold text-green-700">Selected Sub:</span>
                            <span className="col-span-2 text-green-700 font-bold">{result.selectedSubject || '-'}</span>
                         </div>
                         <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">ID Checked?:</span>
                            <span className="col-span-2 text-gray-900">{result.idChecked ? 'Yes' : 'No'}</span>
                         </div>
                         <div className="grid grid-cols-3">
                            <span className="font-bold text-gray-700">Previous Program:</span>
                            <span className="col-span-2 text-gray-900">{result.previousProgram || '-'}</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* Documents & Files Section (Only Doc/TIN) */}
            {(result.documentLink || (result.tinDateLink && result.tinDateLink.startsWith('http'))) && (
                <div className="p-6 border-t border-gray-200">
                    <div className="border-l-4 border-brand-800 bg-gray-100 px-3 py-2 mb-4">
                        <h4 className="font-bold text-gray-700 text-sm">Documents & Files</h4>
                    </div>
                    <div className="flex flex-wrap gap-8 items-start">
                        
                        {result.documentLink && (
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">CV / Document</span>
                                <a 
                                    href={result.documentLink} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white hover:shadow-md transition text-gray-700"
                                >
                                    <div className="bg-red-100 p-2 rounded text-red-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm">View Document</span>
                                        <span className="text-xs text-gray-400">Click to open</span>
                                    </div>
                                </a>
                            </div>
                        )}

                        {result.tinDateLink && result.tinDateLink.startsWith('http') && (
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">TIN Certificate</span>
                                <a 
                                    href={result.tinDateLink} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white hover:shadow-md transition text-gray-700"
                                >
                                    <div className="bg-blue-100 p-2 rounded text-blue-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm">View TIN</span>
                                        <span className="text-xs text-gray-400">Click to open</span>
                                    </div>
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ViewProfile;