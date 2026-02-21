import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, writeBatch, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { ExaminerData } from '../../types';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';

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

  // View Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewModalContent, setViewModalContent] = useState<string | null>(null);
  const [viewModalType, setViewModalType] = useState<'image' | 'doc'>('image');

  // Confirmation Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [examinerToApprove, setExaminerToApprove] = useState<ExaminerData | null>(null);
  const [approving, setApproving] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Approve All Modal State
  const [approveAllModalOpen, setApproveAllModalOpen] = useState(false);
  const [isApprovingAll, setIsApprovingAll] = useState(false);

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

  const openViewModal = (content: string, type: 'image' | 'doc') => {
      setViewModalContent(content);
      setViewModalType(type);
      setViewModalOpen(true);
  };

  // Handle Input Change for Inline Editing
  const handleInputChange = (id: string, field: keyof ExaminerData, value: string) => {
    setPending(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Step 1: Click Approve -> Validates and Opens Modal
  const handleApproveClick = (data: ExaminerData) => {
    if(!data.id) return;
    setNotification(null);

    // Check if RM is provided
    if (!data.rm || data.rm.trim() === '') {
        const msg = "Action Required: The 'Rm' field is empty. Please enter a value in the Rm column before approving.";
        setNotification({ type: 'warning', message: msg });
        alert(msg); 
        return;
    }

    // Set data for modal and open it
    setExaminerToApprove(data);
    setConfirmModalOpen(true);
  };

  // Step 2: Confirm in Modal -> Executes Database Transfer
  const executeApproval = async () => {
    if (!examinerToApprove || !examinerToApprove.id) return;
    
    setApproving(true);
    const data = examinerToApprove;
    
    try {
        // Determine Status
        let targetStatus = data.status;
        if (targetStatus === 'Pending' || !targetStatus) {
            targetStatus = 'Approved';
        }

        const currentUserEmail = auth.currentUser?.email || 'shozolesm4409@gmail.com';

        // 0. Auto-Generate SL (Serial Number) based on Examiner Records
        // Robust Method: Fetch all examiners and find the numerical max
        // This avoids issues where Firestore sorts strings "9" > "62"
        let newSl = 1;
        try {
            const querySnapshot = await getDocs(collection(db, 'examiners'));
            let maxSl = 0;
            
            querySnapshot.forEach((doc) => {
                const d = doc.data();
                const slVal = Number(d.sl);
                if (!isNaN(slVal) && slVal > maxSl) {
                    maxSl = slVal;
                }
            });
            
            newSl = maxSl + 1;
            console.log(`Calculated Max SL: ${maxSl}, Assigning New SL: ${newSl}`);
        } catch (slError: any) {
            console.error("SL Generation Error:", slError);
            alert("Warning: Could not calculate SL from existing records. Defaulting to 1. Error: " + slError.message);
        }

        // 1. Create new doc reference in 'examiners'
        const newDocRef = doc(db, 'examiners', data.id);
        
        // 2. Prepare data
        const { id, ...rest } = data;
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
        setConfirmModalOpen(false);
        setExaminerToApprove(null);
        
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err: any) {
        console.error("Approval error:", err);
        setNotification({ type: 'error', message: "Database Transfer Failed: " + err.message });
    } finally {
        setApproving(false);
    }
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'applications', itemToDelete));
      setPending(prev => prev.filter(item => item.id !== itemToDelete));
      setNotification({ type: 'success', message: "Application deleted successfully." });
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error: any) {
      console.error("Error deleting document: ", error);
      setNotification({ type: 'error', message: "Failed to delete application: " + error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApproveAll = async () => {
    // Validate that all pending items have RM value
    const invalidItems = pending.filter(item => !item.rm || item.rm.trim() === '');
    if (invalidItems.length > 0) {
        const msg = `Action Required: ${invalidItems.length} application(s) have empty 'Rm' field. Please enter values for all items before approving all.`;
        setNotification({ type: 'warning', message: msg });
        alert(msg);
        return;
    }
    setApproveAllModalOpen(true);
  };

  const confirmApproveAll = async () => {
    setIsApprovingAll(true);
    setNotification(null);
    
    try {
        const currentUserEmail = auth.currentUser?.email || 'shozolesm4409@gmail.com';
        
        // 1. Get current max SL
        let currentMaxSl = 0;
        try {
            const querySnapshot = await getDocs(collection(db, 'examiners'));
            querySnapshot.forEach((doc) => {
                const d = doc.data();
                const slVal = Number(d.sl);
                if (!isNaN(slVal) && slVal > currentMaxSl) {
                    currentMaxSl = slVal;
                }
            });
        } catch (slError: any) {
            console.error("SL Generation Error:", slError);
            alert("Warning: Could not calculate SL from existing records. Starting from 1.");
        }

        // 2. Process in batches (Firestore limit is 500 ops per batch)
        const batchSize = 450; // Safe margin
        const chunks = [];
        for (let i = 0; i < pending.length; i += batchSize) {
            chunks.push(pending.slice(i, i + batchSize));
        }

        let processedCount = 0;
        let nextSl = currentMaxSl + 1;

        for (const chunk of chunks) {
            const batch = writeBatch(db);
            
            chunk.forEach((data) => {
                if (!data.id) return;

                // Determine Status
                let targetStatus = data.status;
                if (targetStatus === 'Pending' || !targetStatus) {
                    targetStatus = 'Approved';
                }

                // Prepare new data
                const newDocRef = doc(db, 'examiners', data.id);
                const { id, ...rest } = data;
                const sanitizedData = JSON.parse(JSON.stringify(rest));

                const finalData = { 
                    ...sanitizedData, 
                    status: targetStatus,
                    rm: data.rm,
                    remarkedBy: currentUserEmail, 
                    sl: nextSl, 
                    lastUpdateDate: new Date().toISOString().split('T')[0],
                    approvedAt: new Date().toISOString()
                };

                batch.set(newDocRef, finalData);
                batch.delete(doc(db, 'applications', data.id));
                
                nextSl++;
                processedCount++;
            });

            await batch.commit();
        }

        // 3. Update UI
        setNotification({ 
            type: 'success', 
            message: `Success! Approved ${processedCount} applications. Added to Examiner Records.` 
        });
        setPending([]);
        setApproveAllModalOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err: any) {
        console.error("Approve All Error:", err);
        setNotification({ type: 'error', message: "Bulk Approval Failed: " + err.message });
    } finally {
        setIsApprovingAll(false);
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

      {/* File View Modal */}
      <ViewModal 
        isOpen={viewModalOpen} 
        content={viewModalContent} 
        type={viewModalType} 
        onClose={() => setViewModalOpen(false)} 
      />

      {/* Confirmation Modal */}
      {confirmModalOpen && examinerToApprove && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 transform scale-100 transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Confirm Transfer</h3>
            
            <div className="bg-blue-50 p-4 rounded border border-blue-100 mb-6 space-y-2">
                <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-600">Examiner:</span>
                    <span className="text-sm font-bold text-brand-900">{examinerToApprove.nickName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-600">Status:</span>
                    <span className={`text-sm font-bold px-2 rounded ${examinerToApprove.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {examinerToApprove.status === 'Pending' ? 'Approved' : examinerToApprove.status || 'Approved'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-600">RM:</span>
                    <span className="text-sm font-bold text-gray-800">{examinerToApprove.rm}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm font-bold text-gray-600">Remarked By:</span>
                    <span className="text-sm text-gray-800 truncate max-w-[150px]" title={auth.currentUser?.email || 'Admin'}>{auth.currentUser?.email || 'Admin'}</span>
                </div>
            </div>
            
            <p className="text-gray-500 text-sm mb-6">
                Are you sure you want to move this application to the permanent <b>Examiner Records</b>? This action creates a new Serial Number (SL).
            </p>
            
            <div className="flex justify-end gap-3 pt-2">
                <button 
                    onClick={() => setConfirmModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-bold text-sm transition"
                    disabled={approving}
                >
                    Cancel
                </button>
                <button 
                    onClick={executeApproval}
                    disabled={approving}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold text-sm shadow transition flex items-center"
                >
                    {approving ? (
                        <>
                         <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         Processing...
                        </>
                    ) : 'Yes, Confirm Transfer'}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        title="Delete Application"
        message="Are you sure you want to permanently delete this application? This action cannot be undone."
      />

      {/* Approve All Confirmation Modal */}
      {approveAllModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 transform scale-100 transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Confirm Bulk Approval</h3>
            
            <div className="bg-yellow-50 p-4 rounded border border-yellow-100 mb-6">
                <p className="text-yellow-800 font-bold mb-2">Warning: You are about to approve {pending.length} applications.</p>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                    <li>All {pending.length} applications will be moved to Examiner Records.</li>
                    <li>New Serial Numbers (SL) will be generated for each.</li>
                    <li>This action cannot be easily undone.</li>
                </ul>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
                <button 
                    onClick={() => setApproveAllModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-bold text-sm transition"
                    disabled={isApprovingAll}
                >
                    Cancel
                </button>
                <button 
                    onClick={confirmApproveAll}
                    disabled={isApprovingAll}
                    className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 font-bold text-sm shadow transition flex items-center"
                >
                    {isApprovingAll ? (
                        <>
                         <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                         Processing...
                        </>
                    ) : 'Yes, Approve All'}
                </button>
            </div>
          </div>
        </div>
      )}

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
                    <td className="px-3 py-2 whitespace-nowrap border-r border-gray-100 sticky left-0 bg-white z-10 shadow-sm border-b flex gap-2">
                        <button 
                            onClick={() => handleApproveClick(item)} 
                            className="bg-green-600 text-white px-3 py-1.5 rounded shadow hover:bg-green-700 text-xs font-bold flex-grow transition transform active:scale-95"
                        >
                            Approve
                        </button>
                        <button
                            onClick={() => handleDelete(item.id!)}
                            className="bg-red-100 text-red-600 p-1.5 rounded hover:bg-red-200 transition"
                            title="Delete"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
                                              onClick={() => openViewModal(val, 'image')}
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
                                              onClick={() => openViewModal(val, 'doc')}
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
      
      {/* Approve All Button Footer */}
      {pending.length > 0 && (
        <div className="mt-4 flex justify-center pb-8">
            <button 
                onClick={handleApproveAll}
                className="bg-brand-600 text-white px-4 py-2 rounded shadow hover:bg-brand-700 font-bold text-sm transition transform hover:scale-105 flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Approve All ({pending.length})
            </button>
        </div>
      )}
    </div>
  );
};

export default Remarking;