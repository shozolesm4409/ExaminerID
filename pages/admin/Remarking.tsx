import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, writeBatch, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ExaminerData } from '../../types';

// Modal Component for Viewing Files
const ViewModal = ({ isOpen, content, type, onClose }: { isOpen: boolean, content: string | null, type: 'image' | 'doc', onClose: () => void }) => {
  if (!isOpen || !content) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden relative animate-fade-in-up">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
           <h3 className="font-bold text-lg text-gray-800 uppercase">{type === 'image' ? 'Photo Viewer' : 'Document Viewer'}</h3>
           <button onClick={onClose} className="text-gray-500 hover:text-red-600 transition p-1">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
        <div className="p-4 overflow-auto flex-grow flex items-center justify-center bg-gray-100">
           {type === 'image' ? (
              <img src={content} alt="View" className="max-w-full max-h-full object-contain rounded shadow" />
           ) : (
             <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center">
                 <iframe src={content} className="w-full h-full flex-grow border rounded bg-white" title="Document"></iframe>
                 <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500 mb-2">If document doesn't load, use direct link:</p>
                    <a href={content} target="_blank" rel="noreferrer" className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700 text-sm">Open in New Tab</a>
                 </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

const Remarking: React.FC = () => {
  const [pending, setPending] = useState<ExaminerData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Notification State
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'image' | 'doc'>('image');

  // Fetch from the temporary 'applications' collection
  const fetchPending = async () => {
    setLoading(true);
    try {
        const q = query(collection(db, 'applications'));
        const snapshot = await getDocs(q);
        setPending(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ExaminerData)));
    } catch (e) {
        console.error(e);
        setNotification({ type: 'error', message: "Error fetching pending applications." });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const openModal = (content: string, type: 'image' | 'doc') => {
      setModalContent(content);
      setModalType(type);
      setModalOpen(true);
  };

  // Handle Input Change for Inline Editing
  const handleInputChange = (id: string, field: keyof ExaminerData, value: string) => {
    setPending(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Move data from 'applications' to 'examiners' collection
  const handleApprove = async (data: ExaminerData) => {
    if(!data.id) return;

    // Reset previous notifications
    setNotification(null);

    // 1. Determine Status
    // If user hasn't selected a status (still Pending), assume they mean 'Approved' by clicking the button.
    let targetStatus = data.status;
    if (targetStatus === 'Pending' || !targetStatus) {
        targetStatus = 'Approved';
    }

    // 2. Check if RM is provided
    if (!data.rm || data.rm.trim() === '') {
        const msg = "Action Required: The 'Rm' field is empty. Please enter a value in the Rm column before approving.";
        setNotification({ type: 'warning', message: msg });
        alert(msg); 
        return;
    }

    // Auto-assign Admin Email to 'remarkedBy'
    const currentUserEmail = auth.currentUser?.email || 'shozolesm4409@gmail.com';

    // Confirmation
    const confirmMsg = `Confirm Transfer?\n\nStatus: ${targetStatus}\nRM: ${data.rm}\nAdmin: ${currentUserEmail}`;
    if(!window.confirm(confirmMsg)) {
        return;
    }

    try {
        // 0. Auto-Generate SL (Serial Number) based on Examiner Records
        let newSl = 1;
        
        try {
            // This query requires an Index in Firestore.
            const slQuery = query(collection(db, 'examiners'), orderBy('sl', 'desc'), limit(1));
            const slSnap = await getDocs(slQuery);
            
            if (!slSnap.empty) {
                const lastData = slSnap.docs[0].data();
                const lastSl = Number(lastData.sl);
                if (!isNaN(lastSl)) {
                     newSl = lastSl + 1;
                }
            }
        } catch (slError: any) {
            console.error("SL Generation Error:", slError);
            if (slError.message.includes('index')) {
                // Show critical error with instructions
                const link = slError.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0];
                const msg = "SYSTEM ERROR: Firestore Index Missing. You must create an index to generate Serial Numbers (SL). Check the console (F12) for the link.";
                
                setNotification({ 
                    type: 'error', 
                    message: `MISSING INDEX: The database cannot sort by SL. Open Console (F12) and click the link generated by Firebase to fix this. \n\nTechnical Error: ${slError.message}` 
                });
                
                if (link) {
                    console.log("%c CLICK HERE TO CREATE INDEX: ", "background: red; color: white; font-size: 20px", link);
                    window.open(link, '_blank'); // Try to open automatically
                }
                
                alert("DATABASE ERROR: Missing Index. Look at the top of the page for details.");
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return; // STOP execution to prevent corrupt data
            } else {
                console.warn("SL Error (Non-Index):", slError);
                // Fallback? No, safer to alert.
                alert("Error calculating SL: " + slError.message);
                return;
            }
        }

        // 1. Create new doc reference in 'examiners'
        const newDocRef = doc(db, 'examiners', data.id);
        
        // 2. Prepare data
        const { id, ...rest } = data;
        
        // Sanitize - Ensure no undefined values
        const sanitizedData = JSON.parse(JSON.stringify(rest));

        const finalData = { 
            ...sanitizedData, 
            status: targetStatus,
            rm: data.rm,
            remarkedBy: currentUserEmail, 
            sl: newSl, 
            lastUpdateDate: new Date().toISOString().split('T')[0],
            approvedAt: new Date().toISOString()
        };

        // 3. Perform atomic operation: Write to examiners, Delete from applications
        const batch = writeBatch(db);
        batch.set(newDocRef, finalData);
        batch.delete(doc(db, 'applications', data.id));
        
        await batch.commit();

        // 4. Update UI
        setNotification({ 
            type: 'success', 
            message: `Success! Examiner transferred to Records. Assigned SL: ${newSl}.` 
        });
        setPending(prev => prev.filter(p => p.id !== data.id));
        
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err: any) {
        console.error("Approval error:", err);
        const failMsg = "Database Transfer Failed: " + err.message;
        setNotification({ type: 'error', message: failMsg });
        alert(failMsg); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Columns for the table
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

  if (loading) return <div className="p-8">Loading Pending Applications...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <h2 className="text-2xl font-bold mb-6 text-brand-900 flex-shrink-0">Remarking ({pending.length} Pending Applications)</h2>
      
      {/* In-Body Alert Notification */}
      {notification && (
        <div className={`mb-4 px-4 py-3 rounded border flex items-start shadow-md animate-fade-in-up 
            ${notification.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : 
              notification.type === 'warning' ? 'bg-yellow-100 border-yellow-400 text-yellow-800' :
              'bg-red-100 border-red-400 text-red-800'}`}>
            <span className="font-bold text-xl mr-2">
                {notification.type === 'success' ? '✓' : notification.type === 'warning' ? '!' : '⚠'}
            </span>
            <div className="flex-grow">
                <p className="font-bold capitalize">{notification.type}</p>
                <p className="text-sm whitespace-pre-wrap">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="ml-4 font-bold text-lg hover:opacity-50">×</button>
        </div>
      )}

      <ViewModal 
        isOpen={modalOpen} 
        content={modalContent} 
        type={modalType} 
        onClose={() => setModalOpen(false)} 
      />

      <div className="bg-white rounded-lg shadow w-full border border-gray-200 flex-grow overflow-hidden flex flex-col">
        <div className="overflow-auto max-h-[75vh]" style={{ maxWidth: '100%' }}>
            <table className="min-w-max divide-y divide-gray-200 text-xs relative">
            <thead className="bg-brand-50 sticky top-0 z-20 shadow-sm">
                <tr>
                <th className="px-3 py-3 text-left font-bold text-gray-800 uppercase tracking-wider border-b border-r border-gray-200 sticky left-0 bg-brand-50 z-30 min-w-[100px]">
                    Action
                </th>
                {columns.map((col, idx) => (
                    <th key={idx} className="px-3 py-3 text-left font-bold text-brand-800 uppercase tracking-wider whitespace-nowrap border-b border-r border-gray-200 last:border-r-0 bg-brand-50 min-w-[150px]">
                        {col.label}
                    </th>
                ))}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {pending.map((item, rowIdx) => (
                <tr key={item.id || rowIdx} className="hover:bg-yellow-50 transition duration-150">
                    <td className="px-3 py-2 whitespace-nowrap border-r border-gray-100 sticky left-0 bg-white z-10 shadow-sm border-b">
                        <button 
                            onClick={() => handleApprove(item)} 
                            className="bg-green-600 text-white px-3 py-1.5 rounded shadow hover:bg-green-700 text-xs font-bold w-full transition transform active:scale-95"
                        >
                            Approve & Save
                        </button>
                    </td>
                    {columns.map((col, colIdx) => {
                        const val = (item as any)[col.key];
                        const isPhoto = col.key === 'photoUrl';
                        const isDoc = col.key === 'documentLink';
                        const isStatus = col.key === 'status';

                        return (
                            <td key={colIdx} className="px-1 py-1 whitespace-nowrap border-r border-gray-100 last:border-r-0 border-b">
                                {isStatus ? (
                                    <select
                                        value={val || 'Pending'}
                                        onChange={(e) => handleInputChange(item.id!, 'status', e.target.value)}
                                        className={`w-full text-xs border bg-white text-gray-900 rounded px-1 py-1 focus:border-brand-500 focus:outline-none cursor-pointer font-bold ${val === 'Approved' ? 'border-green-500 text-green-700 bg-green-50' : val === 'Rejected' ? 'border-red-500 text-red-700 bg-red-50' : 'border-gray-300'}`}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Approved">Approve</option>
                                        <option value="Rejected">Reject</option>
                                    </select>
                                ) : isPhoto ? (
                                    <div className="flex justify-center">
                                        {val ? (
                                            <button 
                                              onClick={() => openModal(val, 'image')}
                                              className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs hover:bg-blue-200 font-medium flex items-center"
                                            >
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                View Photo
                                            </button>
                                        ) : <span className="text-gray-400">-</span>}
                                    </div>
                                ) : isDoc ? (
                                    <div className="flex justify-center">
                                        {val ? (
                                           <button 
                                              onClick={() => openModal(val, 'doc')}
                                              className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs hover:bg-purple-200 font-medium flex items-center"
                                            >
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                View Doc
                                            </button>
                                        ) : <span className="text-gray-400">-</span>}
                                    </div>
                                ) : (
                                    <input 
                                        type="text" 
                                        value={val || ''} 
                                        onChange={(e) => handleInputChange(item.id!, col.key as keyof ExaminerData, e.target.value)}
                                        className={`w-full text-xs border border-transparent hover:border-gray-300 focus:border-brand-500 rounded px-2 py-1 bg-transparent hover:bg-white focus:bg-white focus:outline-none transition-colors text-gray-900 ${col.key === 'rm' ? 'bg-yellow-50 border-yellow-200 font-bold' : ''}`}
                                        placeholder={col.key === 'rm' ? 'Required' : ''}
                                    />
                                )}
                            </td>
                        );
                    })}
                </tr>
                ))}
                {pending.length === 0 && (
                    <tr>
                        <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-gray-500">
                            No pending applications found in the queue.
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

export default Remarking;
