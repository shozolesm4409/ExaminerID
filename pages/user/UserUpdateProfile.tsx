import React, { useState } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ExaminerData } from '../../types';
import { useNavigate } from 'react-router-dom';

const InputRow = ({ label, name, value, type = "text", onChange }: { label: string, name: string, value: any, type?: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <tr className="border-b border-gray-200">
    <td className="py-2 px-4 font-medium text-gray-700 border-r border-gray-200 w-1/3 text-right align-middle">{label} :</td>
    <td className="py-2 px-4 w-2/3">
      <input 
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
      />
    </td>
  </tr>
);

const UserUpdateProfile: React.FC = () => {
  const [hscRoll, setHscRoll] = useState('');
  const [hscReg, setHscReg] = useState('');
  const [result, setResult] = useState<ExaminerData | null>(null);
  const [formData, setFormData] = useState<Partial<ExaminerData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hscRoll.trim() || !hscReg.trim()) {
      setError('Please enter both HSC Roll and Registration Number.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setResult(null);

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
        setFormData(data); // Initialize form data with current data
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitUpdate = async () => {
    if (!result || !result.id) return;
    
    setLoading(true);
    try {
      // Create update request
      await addDoc(collection(db, 'updateRequests'), {
        examinerId: result.id,
        originalData: result,
        updatedData: formData,
        status: 'pending',
        timestamp: new Date().toISOString(),
        hscRoll: result.hscRoll,
        hscReg: result.hscReg,
        nickName: result.nickName,
        mobileNumber: result.mobileNumber
      });

      setSuccess('Update request submitted successfully! An admin will review your changes.');
      setResult(null); // Clear result to show success message clearly
      setHscRoll('');
      setHscReg('');
    } catch (err: any) {
      console.error(err);
      setError('Failed to submit update request: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-cyan-600 mb-2">Update Your Information</h2>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Examiner Profile Update</h1>
      </div>

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 text-center">
            <p>{success}</p>
        </div>
      )}

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
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 mt-8">
          <div className="bg-brand-600 text-white py-2 text-center font-bold">
            Update Registration Info
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <table className="w-full">
              <tbody>
                <InputRow label="Nick Name" name="nickName" value={formData.nickName} onChange={handleChange} />
                <InputRow label="Mobile Number 1" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} />
                <InputRow label="Mobile Number 2" name="alternateMobile" value={formData.alternateMobile} onChange={handleChange} />
                <InputRow label="Nagad Number" name="mobileBankingNumber" value={formData.mobileBankingNumber} onChange={handleChange} />
                <InputRow label="Physically Campus" name="checkScriptsCampus" value={formData.checkScriptsCampus} onChange={handleChange} />
                <InputRow label="HSC Roll" name="hscRoll" value={formData.hscRoll} onChange={handleChange} />
                <InputRow label="HSC Board" name="hscBoard" value={formData.hscBoard} onChange={handleChange} />
                <InputRow label="Admission Position" name="admissionPosition" value={formData.admissionPosition} onChange={handleChange} />
                <InputRow label="Father's Name" name="fatherName" value={formData.fatherName} onChange={handleChange} />
                <InputRow label="Father's Occupation" name="fatherOccupation" value={formData.fatherOccupation} onChange={handleChange} />
                <InputRow label="Father's Designation" name="fatherDesignation" value={formData.fatherDesignation} onChange={handleChange} />
                <InputRow label="Father's Mobile" name="fatherMobile" value={formData.fatherMobile} onChange={handleChange} />
                <InputRow label="Religion" name="religion" value={formData.religion} onChange={handleChange} />
                <InputRow label="E-mail" name="email" value={formData.email} onChange={handleChange} />
                <InputRow label="NID No." name="nidNo" value={formData.nidNo} onChange={handleChange} />
              </tbody>
            </table>
            <table className="w-full border-l border-gray-200">
              <tbody>
                <InputRow label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} />
                <InputRow label="Institute Name" name="inst" value={formData.inst} onChange={handleChange} />
                <InputRow label="Department Name" name="dept" value={formData.dept} onChange={handleChange} />
                <InputRow label="HSC Batch" name="hscBatch" value={formData.hscBatch} onChange={handleChange} />
                <InputRow label="Gender" name="gender" value={formData.gender} onChange={handleChange} />
                <InputRow label="HSC Reg" name="hscReg" value={formData.hscReg} onChange={handleChange} />
                <InputRow label="HSC GPA" name="hscGpa" value={formData.hscGpa} onChange={handleChange} />
                <InputRow label="Admission Unit" name="admissionUnit" value={formData.admissionUnit} onChange={handleChange} />
                <InputRow label="Mother's Name" name="motherName" value={formData.motherName} onChange={handleChange} />
                <InputRow label="Mother's Occupation" name="motherOccupation" value={formData.motherOccupation} onChange={handleChange} />
                <InputRow label="Mother's Mobile" name="motherMobile" value={formData.motherMobile} onChange={handleChange} />
                <InputRow label="Home District" name="homeDistrict" value={formData.homeDistrict} onChange={handleChange} />
                <InputRow label="HSC Board" name="hscBoard" value={formData.hscBoard} onChange={handleChange} />
                <InputRow label="Date of Birth" name="dob" value={formData.dob} type="date" onChange={handleChange} />
                <InputRow label="Registration Date" name="formFillUpDate" value={formData.formFillUpDate} type="date" onChange={handleChange} />
              </tbody>
            </table>
          </div>
          <div className="p-4 flex justify-center gap-4 bg-gray-50 border-t border-gray-200">
             <button
                onClick={() => setResult(null)}
                className="bg-gray-500 text-white px-6 py-2 rounded font-bold hover:bg-gray-600 transition"
              >
                Cancel
              </button>
             <button
                onClick={handleSubmitUpdate}
                disabled={loading}
                className="bg-brand-600 text-white px-6 py-2 rounded font-bold hover:bg-brand-700 transition"
              >
                {loading ? 'Submitting...' : 'Submit Update Request'}
              </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserUpdateProfile;
