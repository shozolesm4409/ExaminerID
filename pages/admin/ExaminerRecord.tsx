import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { ExaminerData } from '../../types';

const ExaminerRecord: React.FC = () => {
  const [records, setRecords] = useState<ExaminerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const q = query(collection(db, 'examiners'), where('status', '==', 'Approved'));
        const snapshot = await getDocs(q);
        const fetchedData = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ExaminerData));
        
        // Sort by SL (ascending)
        // Ensure SL is treated as number for correct sorting (1, 2, 10 instead of 1, 10, 2)
        fetchedData.sort((a, b) => {
            const slA = Number(a.sl) || 999999;
            const slB = Number(b.sl) || 999999;
            return slA - slB;
        });

        setRecords(fetchedData);
      } catch (error) {
        console.error("Error fetching records:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  // Define columns mapping: Header Label -> Data Key
  const columns: { label: string; key: keyof ExaminerData | string }[] = [
    { label: "SL", key: "sl" },
    { label: "Nick Name", key: "nickName" },
    { label: "Status", key: "status" },
    { label: "T-PIN", key: "tPin" },
    { label: "Inst.", key: "inst" },
    { label: "Dept.", key: "dept" },
    { label: "HSC Batch", key: "hscBatch" },
    { label: "Rm", key: "rm" },
    { label: "Remarked By", key: "remarkedBy" },
    { label: "Mobile Number", key: "mobileNumber" },
    { label: "Alternate", key: "alternateMobile" },
    { label: "Mobile Banking Number", key: "mobileBankingNumber" },
    { label: "Payment Method", key: "paymentMethod" },
    { label: "Mobile Banking Account Owner", key: "mobileBankingOwner" },
    { label: "Mobile Banking Number Confirmed By", key: "mobileBankingConfirmedBy" },
    { label: "Running Program", key: "runningProgram" },
    { label: "Previous Program", key: "previousProgram" },
    { label: "Physically Scripts Checking Subject", key: "physicallyCheckSubjects" },
    { label: "Online Subject Permission", key: "onlineSubjectPermission" },
    { label: "TIN Given Date / TIN PDF Link", key: "tinDateLink" },
    { label: "TIN Number", key: "tinNumber" },
    { label: "E-mail", key: "email" },
    { label: "Teams/Skype ID", key: "teamsSkypeId" },
    { label: "Facebook ID", key: "facebookId" },
    { label: "ID (Old)", key: "oldId" },
    { label: "Admission Position", key: "admissionPosition" },
    { label: "Admission Unit", key: "admissionUnit" },
    { label: "HSC Roll", key: "hscRoll" },
    { label: "HSC Reg.", key: "hscReg" },
    { label: "HSC Board", key: "hscBoard" },
    { label: "HSC GPA", key: "hscGpa" },
    { label: "Medium of education upto HSC Level", key: "mediumHsc" },
    { label: "Which way do you want to see the scripts?", key: "scriptCheckMethod" },
    { label: "Subject 1", key: "subject1" },
    { label: "Subject 2", key: "subject2" },
    { label: "Subject 3", key: "subject3" },
    { label: "Subject 4", key: "subject4" },
    { label: "Subject 5", key: "subject5" },
    { label: "Version Interested", key: "versionInterested" },
    { label: "Udvash Unmesh Roll / Registration", key: "udvashRoll" },
    { label: "Participated Programmes in  Udvash Unmesh", key: "participatedPrograms" },
    { label: "Branch", key: "branch" },
    { label: "Full Name", key: "fullName" },
    { label: "বাংলায় সম্পূর্ণ নাম", key: "fullNameBn" },
    { label: "Religion", key: "religion" },
    { label: "Gender", key: "gender" },
    { label: "Date of Birth", key: "dob" },
    { label: "Blood Donate", key: "bloodDonate" },
    { label: "Blood Group", key: "bloodGroup" },
    { label: "Last DateDate", key: "lastUpdateDate" },
    { label: "College Name", key: "collegeName" },
    { label: "Father's Name", key: "fatherName" },
    { label: "Father's Occupation", key: "fatherOccupation" },
    { label: "Father's Designation", key: "fatherDesignation" },
    { label: "Father's Mobile", key: "fatherMobile" },
    { label: "Mother's Name", key: "motherName" },
    { label: "Mother's Occupation", key: "motherOccupation" },
    { label: "Mother's Mobile", key: "motherMobile" },
    { label: "NID No.", key: "nidNo" },
    { label: "Present Area", key: "presentArea" },
    { label: "Home District", key: "homeDistrict" },
    { label: "English(%)", key: "englishMarks" },
    { label: "English Set", key: "englishSet" },
    { label: "English Exam Date", key: "englishDate" },
    { label: "Bangla(%)", key: "banglaMarks" },
    { label: "Bangla Set", key: "banglaSet" },
    { label: "Bangla Exam Date", key: "banglaDate" },
    { label: "Physics(%)", key: "physicsMarks" },
    { label: "Physics Set", key: "physicsSet" },
    { label: "Physics Exam Date", key: "physicsDate" },
    { label: "Chemistry (%)", key: "chemistryMarks" },
    { label: "Chemistry  Set", key: "chemistrySet" },
    { label: "Chemistry Exam Date", key: "chemistryDate" },
    { label: "Math (%)", key: "mathMarks" },
    { label: "Math  Set", key: "mathSet" },
    { label: "Math Exam Date", key: "mathDate" },
    { label: "Biology (%)", key: "biologyMarks" },
    { label: "Biology Set", key: "biologySet" },
    { label: "Biology Exam Date", key: "biologyDate" },
    { label: "ICT(%)", key: "ictMarks" },
    { label: "ICT Set", key: "ictSet" },
    { label: "ICT Exam Date", key: "ictDate" },
    { label: "Training Report", key: "trainingReport" },
    { label: "Training Date", key: "trainingDate" },
    { label: "Form Fill Up Campus", key: "formFillUpCampus" },
    { label: "ID Checked?", key: "idChecked" },
    { label: "Entry By", key: "entryBy" },
    { label: "Form Fill Up Date", key: "formFillUpDate" },
    { label: "In Which Campus You Want To Check Scripts physically?", key: "checkScriptsCampus" },
    { label: "Shift (Max 2)", key: "checkScriptsShift" },
    { label: "Reference", key: "reference" },
    { label: "Selected Subject", key: "selectedSubject" },
    { label: "RM 4 Comment", key: "rm4Comment" },
    { label: "Photo", key: "photoUrl" },
    { label: "Docoment", key: "documentLink" },
  ];

  const exportToCSV = () => {
    // Basic CSV export logic
    const headerRow = columns.map(c => c.label).join(",");
    const rows = records.map(r => 
      columns.map(c => `"${(r as any)[c.key] || ''}"`).join(",")
    ).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURI(headerRow + "\n" + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "examiner_records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8">Loading Records...</div>;

  return (
    <div className="w-full flex flex-col h-[calc(100vh-100px)]">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
            <h2 className="text-2xl font-bold text-brand-900">Examiner Records ({records.length})</h2>
            <button onClick={exportToCSV} className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700 shadow">Export CSV</button>
        </div>
      
      {/* Container with horizontal and vertical scroll */}
      <div className="bg-white rounded-lg shadow w-full border border-gray-200 flex-grow overflow-hidden flex flex-col">
        <div className="overflow-auto max-h-[75vh]" style={{ maxWidth: '100%' }}>
            <table className="min-w-max divide-y divide-gray-200 text-xs relative">
            <thead className="bg-brand-50 sticky top-0 z-20 shadow-sm">
                <tr>
                {columns.map((col, idx) => (
                    <th key={idx} className="px-3 py-3 text-left font-bold text-brand-800 uppercase tracking-wider whitespace-nowrap border-b border-r border-gray-200 last:border-r-0 bg-brand-50">
                        {col.label}
                    </th>
                ))}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {records.map((item, rowIdx) => (
                <tr key={item.id || rowIdx} className="hover:bg-yellow-50 transition duration-150">
                    {columns.map((col, colIdx) => {
                        const val = (item as any)[col.key];
                        return (
                            <td key={colIdx} className="px-3 py-2 whitespace-nowrap border-r border-gray-100 last:border-r-0">
                                {col.key === 'photoUrl' && val ? (
                                    <img src={val} alt="User" className="w-8 h-8 rounded-full object-cover" />
                                ) : col.key === 'documentLink' && val ? (
                                    <a href={val} target="_blank" rel="noreferrer" className="text-blue-600 underline">View</a>
                                ) : col.key === 'sl' ? (
                                    item.sl || rowIdx + 1
                                ) : (
                                    <span className="text-gray-700">{val || '-'}</span>
                                )}
                            </td>
                        );
                    })}
                </tr>
                ))}
                {records.length === 0 && (
                    <tr>
                        <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                            No approved records found.
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default ExaminerRecord;