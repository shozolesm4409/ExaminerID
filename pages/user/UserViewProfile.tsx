import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { ExaminerData } from '../../types';
import { useNavigate } from 'react-router-dom';

const UserViewProfile: React.FC = () => {
  const [hscRoll, setHscRoll] = useState('');
  const [hscReg, setHscReg] = useState('');
  const [result, setResult] = useState<ExaminerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hscRoll.trim() || !hscReg.trim()) {
      setError('Please enter both HSC Roll and Registration Number.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const q = query(
        collection(db, 'examiners'),
        where('hscRoll', '==', hscRoll.trim()),
        where('hscReg', '==', hscReg.trim())
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setResult({ ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as ExaminerData);
      } else {
        setError('No profile found with these details. Please check your inputs.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Error searching: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const maskString = (str: string, type: 'mobile' | 'email' | 'reg') => {
    if (!str) return '';
    if (type === 'mobile') {
      // 0157***213
      if (str.length < 7) return str;
      return str.substring(0, 4) + '***' + str.substring(str.length - 3);
    }
    if (type === 'reg') {
      // 2010***046
      if (str.length < 8) return str;
      return str.substring(0, 4) + '***' + str.substring(str.length - 3);
    }
    if (type === 'email') {
      // mad***@gmail.com
      const parts = str.split('@');
      if (parts.length !== 2) return str;
      const name = parts[0];
      if (name.length < 3) return str;
      return name.substring(0, 3) + '***@' + parts[1];
    }
    return str;
  };

  const InfoRow = ({ label, value }: { label: string, value: any }) => (
    <tr className="border-b border-gray-200">
      <td className="py-2 px-4 font-medium text-gray-700 border-r border-gray-200 w-1/2 text-right">{label} :</td>
      <td className="py-2 px-4 text-gray-900 w-1/2 text-center">{value || ''}</td>
    </tr>
  );

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-cyan-600 mb-2">বি.দ্র.: আপনার তথ্য গুলো সঠিক আছে কিনা যাচাই করুন।</h2>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Examiner Registration Profile</h1>
      </div>

      {!result ? (
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex items-center">
              <label className="w-32 font-medium text-gray-700 text-right mr-4">HSC Roll No:</label>
              <input
                type="text"
                value={hscRoll}
                onChange={(e) => setHscRoll(e.target.value)}
                placeholder="Enter HSC Roll No..."
                className="flex-grow border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="flex items-center">
              <label className="w-32 font-medium text-gray-700 text-right mr-4">HSC Reg No:</label>
              <input
                type="text"
                value={hscReg}
                onChange={(e) => setHscReg(e.target.value)}
                placeholder="Enter HSC Reg No..."
                className="flex-grow border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            
            {error && <div className="text-red-600 text-center text-sm">{error}</div>}
            
            <div className="flex justify-center gap-4 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-600 text-white px-6 py-2 rounded font-bold hover:bg-brand-700 transition"
              >
                {loading ? 'Searching...' : 'Get Profile'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/profile/update')}
                className="bg-brand-600 text-white px-6 py-2 rounded font-bold hover:bg-brand-700 transition"
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 mt-8">
          <div className="bg-brand-600 text-white py-2 text-center font-bold">
            New Registration Info
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <table className="w-full">
              <tbody>
                <InfoRow label="Nick Name" value={result.nickName} />
                <InfoRow label="Mobile Number 1" value={maskString(result.mobileNumber, 'mobile')} />
                <InfoRow label="Mobile Number 2" value={maskString(result.alternateMobile, 'mobile')} />
                <InfoRow label="Nagad Number" value={maskString(result.mobileBankingNumber, 'mobile')} />
                <InfoRow label="Physically Campus" value={result.checkScriptsCampus} />
                <InfoRow label="HSC Roll" value={result.hscRoll} />
                <InfoRow label="HSC Board" value={result.hscBoard} />
                <InfoRow label="Admission Position" value={result.admissionPosition} />
                <InfoRow label="Father's Name" value={result.fatherName} />
                <InfoRow label="Father's Occupation" value={result.fatherOccupation} />
                <InfoRow label="Father's Designation" value={result.fatherDesignation} />
                <InfoRow label="Father'sMobile" value={maskString(result.fatherMobile, 'mobile')} />
                <InfoRow label="Religion" value={result.religion} />
                <InfoRow label="E-mail" value={maskString(result.email, 'email')} />
                <InfoRow label="NID No." value={result.nidNo} />
              </tbody>
            </table>
            <table className="w-full border-l border-gray-200">
              <tbody>
                <InfoRow label="Full Name" value={result.fullName} />
                <InfoRow label="Institute Name" value={result.inst} />
                <InfoRow label="Department Name" value={result.dept} />
                <InfoRow label="HSC Batch" value={result.hscBatch} />
                <InfoRow label="Gender" value={result.gender} />
                <InfoRow label="HSC Reg" value={maskString(result.hscReg, 'reg')} />
                <InfoRow label="HSC GPA" value={result.hscGpa} />
                <InfoRow label="Admission Unit" value={result.admissionUnit} />
                <InfoRow label="Mother's Name" value={result.motherName} />
                <InfoRow label="Mother's Occupation" value={result.motherOccupation} />
                <InfoRow label="Mother's Mobile" value={maskString(result.motherMobile, 'mobile')} />
                <InfoRow label="Home District" value={result.homeDistrict} />
                <InfoRow label="HSC Board" value={result.hscBoard} />
                <InfoRow label="Date of Birth" value={result.dob} />
                <InfoRow label="Registration Date" value={result.formFillUpDate} />
              </tbody>
            </table>
          </div>
          <div className="p-4 flex justify-center">
             <button
                onClick={() => setResult(null)}
                className="bg-gray-500 text-white px-6 py-2 rounded font-bold hover:bg-gray-600 transition"
              >
                Back to Search
              </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserViewProfile;
