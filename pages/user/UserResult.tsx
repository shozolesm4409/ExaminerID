import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { ExaminerData } from '../../types';

const UserResult: React.FC = () => {
  const [hscRoll, setHscRoll] = useState('');
  const [hscReg, setHscReg] = useState('');
  const [result, setResult] = useState<ExaminerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasAllow, setHasAllow] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hscRoll.trim() || !hscReg.trim()) {
      setError('Please enter both HSC Roll and Registration Number.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setHasAllow(false);

    try {
      const q = query(
        collection(db, 'examiners'),
        where('hscRoll', '==', hscRoll.trim()),
        where('hscReg', '==', hscReg.trim())
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as ExaminerData;
        setResult(data);
        checkIfAllowed(data);
      } else {
        setError('No result found with these details. Please check your inputs.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error searching: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkIfAllowed = (data: ExaminerData) => {
    const subjects = [
      { name: 'English', marks: data.englishMarks },
      { name: 'Bangla', marks: data.banglaMarks },
      { name: 'Physics', marks: data.physicsMarks },
      { name: 'Chemistry', marks: data.chemistryMarks },
      { name: 'Math', marks: data.mathMarks },
      { name: 'Biology', marks: data.biologyMarks },
      { name: 'ICT', marks: data.ictMarks },
    ];

    let isAllowed = false;
    subjects.forEach(sub => {
      const status = getSubjectStatus(sub.name, sub.marks);
      if (status.isAllow) {
        isAllowed = true;
      }
    });
    setHasAllow(isAllowed);
  };

  const getSubjectStatus = (subject: string, marks: string) => {
    if (!marks || marks.trim() === '') return { status: 'No Exam', color: 'text-gray-500', isAllow: false, icon: null };
    
    const num = Number(marks);
    if (isNaN(num)) return { status: 'Invalid', color: 'text-gray-500', isAllow: false, icon: null };

    // Condition Logic
    const threshold = subject === 'English' ? 59 : 49;
    
    if (num > threshold) {
        return { 
          status: 'Allow', 
          color: 'text-blue-900 font-bold', 
          isAllow: true,
          icon: (
            <svg className="w-5 h-5 text-blue-600 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        };
    } else {
        return { 
          status: 'Not Allow', 
          color: 'text-red-600 font-bold', 
          isAllow: false,
          icon: (
            <svg className="w-5 h-5 text-red-600 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        };
    }
  };

  const renderRow = (subject: string, marks: string, set: string, date: string) => {
    const { status, color, icon } = getSubjectStatus(subject, marks);
    
    let markDisplay = 'No Exam';
    if (marks) {
        markDisplay = `${marks}%, Set- ${set || 'N/A'}`;
    }

    return (
      <tr className="border-b border-gray-200 hover:bg-gray-50 text-sm">
        <td className="py-2 px-4 font-bold text-gray-700 text-center">{subject} (%)</td>
        <td className="py-2 px-4 text-center font-bold text-gray-800">
            {markDisplay}
        </td>
        <td className="py-2 px-4 text-center text-gray-800 font-bold">{date || ''}</td>
        <td className={`py-2 px-4 text-center ${color}`}>
           {icon} {status === 'No Exam' ? '' : status}
        </td>
      </tr>
    );
  };

  const InfoItem = ({ label, value, isCheckbox = false }: { label: string, value: any, isCheckbox?: boolean }) => (
    <div className="flex border-b border-gray-200 last:border-b-0">
      <div className="w-1/2 bg-gray-50 p-2 font-bold text-gray-700 text-right pr-4 border-r border-gray-200 flex items-center justify-end">
        {label}:
      </div>
      <div className="w-1/2 p-2 font-bold text-gray-900 pl-4 flex items-center">
        {isCheckbox ? (
          <div className="flex items-center">
             <div className={`w-5 h-5 border-2 border-blue-600 rounded flex items-center justify-center mr-2 ${value ? 'bg-blue-600' : 'bg-white'}`}>
                {value && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
             </div>
             {value ? 'Complete' : 'Incomplete'}
          </div>
        ) : (
          value || ''
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-purple-700 mb-2">বি.দ্র.: মূল্যায়ন পরীক্ষা দেওয়ার পর ১ সপ্তাহের মধ্যে ফলাফল আপডেট করা হয়।</h2>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Assessment Test Result</h1>
      </div>

      {!result ? (
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex items-center">
              <label className="w-32 font-medium text-gray-700 text-right mr-4">HSC Roll No:</label>
              <div className="flex-grow relative">
                <input
                    type="text"
                    value={hscRoll}
                    onChange={(e) => setHscRoll(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {hscRoll && <span className="absolute right-3 top-2 text-green-500">✔</span>}
              </div>
            </div>
            <div className="flex items-center">
              <label className="w-32 font-medium text-gray-700 text-right mr-4">HSC Reg No:</label>
              <div className="flex-grow relative">
                <input
                    type="text"
                    value={hscReg}
                    onChange={(e) => setHscReg(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {hscReg && <span className="absolute right-3 top-2 text-green-500">✔</span>}
              </div>
            </div>
            
            {error && <div className="text-red-600 text-center text-sm">{error}</div>}
            
            <div className="flex justify-center mt-6">
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-600 text-white px-8 py-2 rounded font-bold hover:bg-brand-700 transition w-full md:w-auto"
              >
                {loading ? 'Searching...' : 'Get Results'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 mt-8">
          {/* Header */}
          <div className="bg-brand-600 text-white py-2 text-center font-bold">
            Examiner Quick Info T-Pin -{result.tPin}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-200">
             <div className="border-r border-gray-200">
                <InfoItem label="Nick Name" value={`${result.nickName} (${result.tPin})`} />
                <InfoItem label="Mobile 1" value={result.mobileNumber} />
                <InfoItem label="Mobile 2" value={result.alternateMobile} />
                <InfoItem label="Nagad Number" value={result.mobileBankingNumber} />
                <InfoItem label="Religion" value={result.religion} />
                <InfoItem label="Father's Name" value={result.fatherName} />
                <InfoItem label="Training Report" value={result.trainingReport === 'Complete' || result.trainingReport === 'Yes'} isCheckbox={true} />
             </div>
             <div>
                <InfoItem label="Full Name" value={result.fullName} />
                <InfoItem label="Institute" value={result.inst} />
                <InfoItem label="Department" value={result.dept} />
                <InfoItem label="HSC Batch" value={result.hscBatch} />
                <InfoItem label="Gender" value={result.gender} />
                <InfoItem label="Mother's Name" value={result.motherName} />
                <InfoItem label="Physically Campus" value={result.checkScriptsCampus} />
             </div>
          </div>

          {/* Assessments Report Header */}
          <div className="bg-brand-600 text-white py-2 text-center font-bold mt-4">
            Assessments Report
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gray-100 text-gray-800 text-sm border-b border-gray-200">
                        <th className="py-2 px-4 text-center w-1/4">Subjects</th>
                        <th className="py-2 px-4 text-center w-1/4">% & Set</th>
                        <th className="py-2 px-4 text-center w-1/4">Date</th>
                        <th className="py-2 px-4 text-center w-1/4">Remark</th>
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

          {/* Footer Message */}
          {hasAllow && (
            <div className="bg-brand-600 text-white py-3 px-4 text-center font-bold text-sm md:text-base">
                Vacancy থাকা সাপেক্ষে আপনার সাথে যোগাযোগ করা হবে। তথ্য সংশোধন করার প্রয়োজন হলে নিচে দেয়া WhatsApp নম্বরে যোগাযোগ করুন।
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserResult;
