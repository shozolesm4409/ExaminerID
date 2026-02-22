import React, { useState, useEffect } from 'react';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ExaminerData } from '../types';
import { useNavigate } from 'react-router-dom';

// -- Helper Components Defined Outside to Prevent Re-render Issues --

const SectionHeader = ({ title }: { title: string }) => (
  <div className="col-span-full mt-8 mb-4">
    <h3 className="text-xl font-bold text-brand-800 border-b pb-2">{title}</h3>
  </div>
);

interface InputProps {
  label: string;
  name: string;
  data: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  required?: boolean;
  options?: string[];
}

const InputField = ({ label, name, data, onChange, type = "text", required = false, options = [] }: InputProps) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
    {options.length > 0 ? (
      <select 
        name={name} 
        onChange={onChange}
        value={data[name] || ''}
        className="border border-gray-300 bg-white text-gray-900 rounded px-3 py-2 focus:ring-brand-500 focus:border-brand-500"
      >
        <option value="">Select...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : (
      <input 
        type={type} 
        name={name} 
        onChange={onChange} 
        value={data[name] || ''}
        className="border border-gray-300 bg-white text-gray-900 rounded px-3 py-2 focus:ring-brand-500 focus:border-brand-500"
        required={required}
      />
    )}
  </div>
);

const SUBJECT_OPTIONS = ["Bangla", "English", "BGS", "Religion", "Physics", "Chemistry", "Math", "Biology", "Statistics", "ICT"];
const CAMPUS_OPTIONS = ["Farmgate", "Motijheel", "Cantonment", "Bakshibazar Campus (Only for female)", "Chawkbazar(ctg)", "Khulna", "Rajshahi", "Mymensingh", "Online"];
const BOARD_OPTIONS = ["Dhaka", "Barisal", "Chittagong", "Comilla", "Jessore", "Mymensingh", "Rajshahi", "Sylhet", "Dinajpur", "Technical", "Madrasah"];
const DISTRICT_OPTIONS = [
  "Bagerhat", "Bandarban", "Barguna", "Barisal", "Bhola", "Bogra", "Brahmanbaria", "Chandpur", "Chapainawabganj", "Chittagong", "Chuadanga", "Comilla", "Cox's Bazar", "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj", "Habiganj", "Jamalpur", "Jessore", "Jhalokati", "Jhenaidah", "Joypurhat", "Khagrachhari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur", "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi", "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh", "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur", "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet", "Tangail", "Thakurgaon"
];

// -- Main Component --

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ExaminerData>>({
    status: 'Pending',
    formFillUpDate: new Date().toISOString().split('T')[0],
  });

  // Dynamic Configuration State
  const [config, setConfig] = useState({
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

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'settings', 'registrationConfig');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (e) {
        console.error("Failed to load registration config", e);
      }
    };
    fetchConfig();
  }, []);
  
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'doc') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 400 * 1024) {
        alert("File size is too large! Please upload a file smaller than 400KB.");
        e.target.value = ''; 
        return;
      }

      try {
        const base64String = await convertToBase64(file);
        if (type === 'photo') {
            setFormData(prev => ({ ...prev, photoUrl: base64String }));
        } else {
            setFormData(prev => ({ ...prev, documentLink: base64String }));
        }
      } catch (err) {
        console.error("Error converting file", err);
        alert("Error processing file.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await addDoc(collection(db, 'applications'), {
        ...formData,
        timestamp: new Date()
      });
      
      alert("Registration Successful! Your application is pending approval.");
      navigate('/');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'permission-denied') {
        alert("Submission failed: Database permission denied. Please check Firestore rules.");
      } else {
        alert("Error submitting form: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-10">
        <h1 className="text-3xl font-bold text-center mb-2 text-brand-900">Examiner Registration Form</h1>
        <p className="text-center text-gray-500 mb-10">Please fill out all required information accurately.</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Core Info - Always Visible */}
          <SectionHeader title="Basic Information" />
          <InputField label="Nick Name" name="nickName" data={formData} onChange={handleChange} required />
          <InputField label="Full Name" name="fullName" data={formData} onChange={handleChange} required />
          <InputField label="বাংলায় সম্পূর্ণ নাম" name="fullNameBn" data={formData} onChange={handleChange} />
          <InputField label="Mobile Number" name="mobileNumber" data={formData} onChange={handleChange} required />
          <InputField label="E-mail" name="email" type="email" data={formData} onChange={handleChange} required />
          
          {/* Parent Info */}
          {config.showParentInfo && (
            <>
              <SectionHeader title="Parents Information" />
              <InputField label="Father's Name" name="fatherName" data={formData} onChange={handleChange} required />
              <InputField label="Father's Occupation" name="fatherOccupation" data={formData} onChange={handleChange} />
              <InputField label="Father's Designation" name="fatherDesignation" data={formData} onChange={handleChange} />
              <InputField label="Father's Mobile" name="fatherMobile" data={formData} onChange={handleChange} />
              <InputField label="Mother's Name" name="motherName" data={formData} onChange={handleChange} required />
              <InputField label="Mother's Occupation" name="motherOccupation" data={formData} onChange={handleChange} />
              <InputField label="Mother's Mobile" name="motherMobile" data={formData} onChange={handleChange} />
            </>
          )}

          {/* Personal Details */}
          {config.showPersonalDetails && (
            <>
              <SectionHeader title="Personal Details" />
              <InputField label="Date of Birth" name="dob" type="date" data={formData} onChange={handleChange} required />
              <InputField label="Gender" name="gender" options={['Male', 'Female', 'Other']} data={formData} onChange={handleChange} required />
              <InputField label="Religion" name="religion" options={['Islam', 'Hinduism', 'Christianity', 'Buddhism', 'Other']} data={formData} onChange={handleChange} />
              <InputField label="Blood Group" name="bloodGroup" options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} data={formData} onChange={handleChange} />
              <InputField label="Donate Blood?" name="bloodDonate" options={['Yes', 'No']} data={formData} onChange={handleChange} />
              <InputField label="NID No." name="nidNo" data={formData} onChange={handleChange} required />
            </>
          )}

          {/* Extended Contact */}
          {config.showContactDetails && (
            <>
              <SectionHeader title="Contact Information" />
              <InputField label="Alternate Mobile" name="alternateMobile" data={formData} onChange={handleChange} />
              <InputField label="Facebook ID (Link)" name="facebookId" data={formData} onChange={handleChange} />
              <InputField label="Teams/Skype ID" name="teamsSkypeId" data={formData} onChange={handleChange} />
              <InputField label="Present Area" name="presentArea" data={formData} onChange={handleChange} />
              <InputField label="Home District" name="homeDistrict" options={DISTRICT_OPTIONS} data={formData} onChange={handleChange} />
            </>
          )}

          {/* Academic Info */}
          {config.showAcademicInfo && (
            <>
              <SectionHeader title="Academic Information" />
              <InputField label="Institute (University)" name="inst" data={formData} onChange={handleChange} required />
              <InputField label="Department" name="dept" data={formData} onChange={handleChange} required />
              <InputField label="HSC Batch" name="hscBatch" data={formData} onChange={handleChange} required />
              <InputField label="HSC Roll" name="hscRoll" data={formData} onChange={handleChange} />
              <InputField label="HSC Reg" name="hscReg" data={formData} onChange={handleChange} />
              <InputField label="HSC Board" name="hscBoard" options={BOARD_OPTIONS} data={formData} onChange={handleChange} />
              <InputField label="HSC GPA" name="hscGpa" data={formData} onChange={handleChange} />
              <InputField label="College Name" name="collegeName" data={formData} onChange={handleChange} />
              <InputField label="Medium upto HSC" name="mediumHsc" options={['Bangla', 'English']} data={formData} onChange={handleChange} />
              <InputField label="Admission Position" name="admissionPosition" data={formData} onChange={handleChange} />
              <InputField label="Admission Unit" name="admissionUnit" data={formData} onChange={handleChange} />
              <InputField label="Udvash/Unmesh Roll" name="udvashRoll" data={formData} onChange={handleChange} />
              <InputField label="Participated Programs" name="participatedPrograms" data={formData} onChange={handleChange} />
            </>
          )}

          {/* Subject Proficiency - Conditional */}
          {config.showSubjectMarks && (
            <>
              <SectionHeader title="Subject Marks & Proficiency" />
              <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded bg-gray-50">
                 <h4 className="col-span-full font-bold text-sm text-brand-800">English</h4>
                 <InputField label="Marks (%)" name="englishMarks" data={formData} onChange={handleChange} /> <InputField label="Set" name="englishSet" data={formData} onChange={handleChange} /> <InputField label="Exam Date" name="englishDate" type="date" data={formData} onChange={handleChange} />
                 <h4 className="col-span-full font-bold text-sm text-brand-800 border-t pt-2">Bangla</h4>
                 <InputField label="Marks (%)" name="banglaMarks" data={formData} onChange={handleChange} /> <InputField label="Set" name="banglaSet" data={formData} onChange={handleChange} /> <InputField label="Exam Date" name="banglaDate" type="date" data={formData} onChange={handleChange} />
                 <h4 className="col-span-full font-bold text-sm text-brand-800 border-t pt-2">Physics</h4>
                 <InputField label="Marks (%)" name="physicsMarks" data={formData} onChange={handleChange} /> <InputField label="Set" name="physicsSet" data={formData} onChange={handleChange} /> <InputField label="Exam Date" name="physicsDate" type="date" data={formData} onChange={handleChange} />
                 <h4 className="col-span-full font-bold text-sm text-brand-800 border-t pt-2">Chemistry</h4>
                 <InputField label="Marks (%)" name="chemistryMarks" data={formData} onChange={handleChange} /> <InputField label="Set" name="chemistrySet" data={formData} onChange={handleChange} /> <InputField label="Exam Date" name="chemistryDate" type="date" data={formData} onChange={handleChange} />
                 <h4 className="col-span-full font-bold text-sm text-brand-800 border-t pt-2">Mathematics</h4>
                 <InputField label="Marks (%)" name="mathMarks" data={formData} onChange={handleChange} /> <InputField label="Set" name="mathSet" data={formData} onChange={handleChange} /> <InputField label="Exam Date" name="mathDate" type="date" data={formData} onChange={handleChange} />
                 <h4 className="col-span-full font-bold text-sm text-brand-800 border-t pt-2">Biology</h4>
                 <InputField label="Marks (%)" name="biologyMarks" data={formData} onChange={handleChange} /> <InputField label="Set" name="biologySet" data={formData} onChange={handleChange} /> <InputField label="Exam Date" name="biologyDate" type="date" data={formData} onChange={handleChange} />
                 <h4 className="col-span-full font-bold text-sm text-brand-800 border-t pt-2">ICT</h4>
                 <InputField label="Marks (%)" name="ictMarks" data={formData} onChange={handleChange} /> <InputField label="Set" name="ictSet" data={formData} onChange={handleChange} /> <InputField label="Exam Date" name="ictDate" type="date" data={formData} onChange={handleChange} />
              </div>
            </>
          )}

          {/* Script Checking Preferences */}
          {config.showScriptPrefs && (
            <>
                <SectionHeader title="Script Checking Preferences" />
                <InputField label="Preferred Way" name="scriptCheckMethod" options={['Online', 'Physical', 'Both']} data={formData} onChange={handleChange} required />
                <InputField label="Subject Pref 1" name="subject1" options={SUBJECT_OPTIONS} data={formData} onChange={handleChange} />
                <InputField label="Subject Pref 2" name="subject2" options={SUBJECT_OPTIONS} data={formData} onChange={handleChange} />
                <InputField label="Subject Pref 3" name="subject3" options={SUBJECT_OPTIONS} data={formData} onChange={handleChange} />
                <InputField label="Subject Pref 4" name="subject4" options={SUBJECT_OPTIONS} data={formData} onChange={handleChange} />
                <InputField label="Subject Pref 5" name="subject5" options={SUBJECT_OPTIONS} data={formData} onChange={handleChange} />
                <InputField label="Version Interested" name="versionInterested" options={['Bangla', 'English', 'Both']} data={formData} onChange={handleChange} />
                <InputField label="Physical Check Campus" name="checkScriptsCampus" options={CAMPUS_OPTIONS} data={formData} onChange={handleChange} />
                <InputField label="Preferred Shift (Max 2)" name="checkScriptsShift" data={formData} onChange={handleChange} />
            </>
          )}
          
          {/* Payment Info */}
          {config.showFinancialInfo && (
            <>
              <SectionHeader title="Financial Information" />
              <InputField label="Payment Method" name="paymentMethod" options={['Bkash', 'Rocket', 'Nagad', 'Bank']} data={formData} onChange={handleChange} required />
              <InputField label="Mobile Banking No." name="mobileBankingNumber" data={formData} onChange={handleChange} />
              <InputField label="Account Owner" name="mobileBankingOwner" data={formData} onChange={handleChange} />
              <InputField label="TIN Number" name="tinNumber" data={formData} onChange={handleChange} />
              <InputField label="TIN PDF Link/Date" name="tinDateLink" data={formData} onChange={handleChange} />
            </>
          )}

          {/* Misc */}
          <SectionHeader title="Miscellaneous" />
          {config.showReference && <InputField label="Reference" name="reference" data={formData} onChange={handleChange} />}
          <InputField label="Form Fill-up Campus" name="formFillUpCampus" options={CAMPUS_OPTIONS} data={formData} onChange={handleChange} />
          
          {/* File Uploads */}
          {config.showUploads && (
            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
              <div className="flex flex-col">
                  <label className="text-sm font-bold text-brand-900 mb-2">Photo</label>
                  <div className="p-4 bg-gray-50 border rounded-md">
                    <label className="text-sm text-gray-700 mb-1 block">Option 1: Upload File (Max 400KB)</label>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'photo')} 
                        className="border border-gray-300 rounded px-2 py-1 bg-white w-full text-sm mb-3"
                    />
                    {formData.photoUrl && formData.photoUrl.startsWith('data:') && <p className="text-xs text-green-600 mb-2">✓ File selected</p>}
                    
                    <label className="text-sm text-gray-700 mb-1 block">Option 2: Paste Link</label>
                    <input 
                        type="text"
                        name="photoUrl"
                        placeholder="https://example.com/photo.jpg"
                        onChange={handleChange}
                        value={formData.photoUrl && !formData.photoUrl.startsWith('data:') ? formData.photoUrl : ''}
                        className="border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 w-full text-sm"
                    />
                  </div>
              </div>

              <div className="flex flex-col">
                  <label className="text-sm font-bold text-brand-900 mb-2">Document (CV/Certificate)</label>
                  <div className="p-4 bg-gray-50 border rounded-md">
                    <label className="text-sm text-gray-700 mb-1 block">Option 1: Upload File (Max 400KB)</label>
                    <input 
                        type="file" 
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={(e) => handleFileChange(e, 'doc')} 
                        className="border border-gray-300 rounded px-2 py-1 bg-white w-full text-sm mb-3"
                    />
                    {formData.documentLink && formData.documentLink.startsWith('data:') && <p className="text-xs text-green-600 mb-2">✓ File selected</p>}

                    <label className="text-sm text-gray-700 mb-1 block">Option 2: Paste Drive Link</label>
                    <input 
                        type="text"
                        name="documentLink"
                        placeholder="https://drive.google.com/..."
                        onChange={handleChange}
                        value={formData.documentLink && !formData.documentLink.startsWith('data:') ? formData.documentLink : ''}
                        className="border border-gray-300 bg-white text-gray-900 rounded px-2 py-1 w-full text-sm"
                    />
                  </div>
              </div>
            </div>
          )}
          
          <div className="col-span-full mt-8">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-600 text-white font-bold py-4 rounded hover:bg-brand-700 transition disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Registration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registration;