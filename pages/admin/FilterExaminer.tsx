import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { ExaminerData } from '../../types';

// --- Types ---

interface SubjectSetting {
  id: number;
  name: string;
  percent: number; // The "Persen" field
}

// --- Components ---

// Multi-Select Dropdown Component
interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const toggleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-xs font-bold text-gray-700 mb-1">{label}</label>
      <div 
        className="w-full border border-gray-300 rounded px-3 py-2 bg-white cursor-pointer flex justify-between items-center text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {selected.length === 0 
            ? 'Select...' 
            : selected.length === options.length 
              ? 'All Selected' 
              : `${selected.length} Selected`}
        </span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
          <div 
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-sm border-b border-gray-200 font-bold text-brand-700 sticky top-0 bg-white z-10"
            onClick={toggleSelectAll}
          >
            <input 
              type="checkbox" 
              checked={options.length > 0 && selected.length === options.length} 
              readOnly 
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            <span>Select All</span>
          </div>
          {options.map((option, idx) => (
            <div 
              key={idx} 
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-sm"
              onClick={() => toggleOption(option)}
            >
              <input 
                type="checkbox" 
                checked={selected.includes(option)} 
                readOnly 
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span>{option === '' ? '(Blank)' : option}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

const FilterExaminer: React.FC = () => {
  const [records, setRecords] = useState<ExaminerData[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ExaminerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  // Filter States
  const [filterTPin, setFilterTPin] = useState<string[]>([]);
  const [filterInst, setFilterInst] = useState<string[]>([]);
  const [filterDept, setFilterDept] = useState<string[]>([]);
  const [filterHscBatch, setFilterHscBatch] = useState<string[]>([]);
  const [filterRm, setFilterRm] = useState<string[]>([]);
  const [filterCampus, setFilterCampus] = useState<string[]>([]);
  const [filterSelectedSubject, setFilterSelectedSubject] = useState<string[]>([]);
  const [filterTrainingReport, setFilterTrainingReport] = useState<string[]>([]);

  // Subject Settings State
  const [subjectSettings, setSubjectSettings] = useState<SubjectSetting[]>([
    { id: 1, name: 'English', percent: 60 },
    { id: 2, name: 'Bangla', percent: 50 },
    { id: 3, name: 'Physics', percent: 50 },
    { id: 4, name: 'Chemistry', percent: 50 },
    { id: 5, name: 'Math', percent: 50 },
    { id: 6, name: 'Biology', percent: 50 },
    { id: 7, name: 'ICT', percent: 50 },
  ]);
  const [selectedSubjectCheckboxes, setSelectedSubjectCheckboxes] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [editPercentValue, setEditPercentValue] = useState<number>(0);

  // Download Popup State
  const [isDownloadPopupOpen, setIsDownloadPopupOpen] = useState(false);
  const [selectedDownloadColumns, setSelectedDownloadColumns] = useState<string[]>([]);

  // Options for dropdowns (derived from data)
  const [optionsTPin, setOptionsTPin] = useState<string[]>([]);
  const [optionsInst, setOptionsInst] = useState<string[]>([]);
  const [optionsDept, setOptionsDept] = useState<string[]>([]);
  const [optionsHscBatch, setOptionsHscBatch] = useState<string[]>([]);
  const [optionsRm, setOptionsRm] = useState<string[]>([]);
  const [optionsCampus, setOptionsCampus] = useState<string[]>([]);
  const [optionsSelectedSubject, setOptionsSelectedSubject] = useState<string[]>([]);
  const [optionsTrainingReport, setOptionsTrainingReport] = useState<string[]>([]);

  // Columns Definition (Copied from ExaminerRecord.tsx)
  const allColumns: { label: string; key: keyof ExaminerData | string }[] = [
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

  // Initialize selected columns with all columns
  useEffect(() => {
    setSelectedDownloadColumns(allColumns.map(c => c.label));
  }, []);

  // Fetch Data
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const q = query(collection(db, 'examiners'), where('status', '==', 'Approved'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ExaminerData));
        
        // Sort by SL
        data.sort((a, b) => (Number(a.sl) || 999999) - (Number(b.sl) || 999999));
        
        setRecords(data);
        // setFilteredRecords(data); // Don't show initially

        // Extract Options
        const extractOptions = (key: keyof ExaminerData) => {
          const values = new Set(data.map(item => (item[key] || '').toString().trim()));
          return Array.from(values).sort();
        };

        setOptionsTPin(extractOptions('tPin'));
        setOptionsInst(extractOptions('inst'));
        setOptionsDept(extractOptions('dept'));
        setOptionsHscBatch(extractOptions('hscBatch'));
        setOptionsRm(extractOptions('rm'));
        setOptionsCampus(extractOptions('checkScriptsCampus'));
        setOptionsSelectedSubject(extractOptions('selectedSubject'));
        setOptionsTrainingReport(extractOptions('trainingReport'));

      } catch (error) {
        console.error("Error fetching records:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  // Filter Logic (Extracted to be callable)
  const runFilter = () => {
    let result = records;

    const applyFilter = (filterValues: string[], key: keyof ExaminerData) => {
      if (filterValues.length > 0) {
        result = result.filter(item => {
          const val = (item[key] || '').toString().trim();
          return filterValues.includes(val);
        });
      }
    };

    applyFilter(filterTPin, 'tPin');
    applyFilter(filterInst, 'inst');
    applyFilter(filterDept, 'dept');
    applyFilter(filterHscBatch, 'hscBatch');
    applyFilter(filterRm, 'rm');
    applyFilter(filterCampus, 'checkScriptsCampus');
    applyFilter(filterSelectedSubject, 'selectedSubject');
    applyFilter(filterTrainingReport, 'trainingReport');

    if (selectedSubjectCheckboxes.length > 0) {
        result = result.filter(item => {
            return selectedSubjectCheckboxes.some(subjectName => {
                // Find setting for this subject
                const setting = subjectSettings.find(s => s.name === subjectName);
                const threshold = setting ? setting.percent : 0;

                // Map subject name to key
                const keyMap: {[key: string]: keyof ExaminerData} = {
                    'English': 'englishMarks',
                    'Bangla': 'banglaMarks',
                    'Physics': 'physicsMarks',
                    'Chemistry': 'chemistryMarks',
                    'Math': 'mathMarks',
                    'Biology': 'biologyMarks',
                    'ICT': 'ictMarks'
                };
                const key = keyMap[subjectName];
                const marks = item[key];

                // Check if marks exist and are greater than threshold
                if (marks) {
                    const numMarks = Number(marks);
                    return !isNaN(numMarks) && numMarks > threshold;
                }
                return false;
            });
        });
    }

    setFilteredRecords(result);
  };

  // Handle Search
  const handleSearch = () => {
    setHasSearched(true);
    runFilter();
  };

  // Re-run filter if filters change AND we have already searched
  useEffect(() => {
    if (hasSearched) {
      runFilter();
    }
  }, [
    records, 
    filterTPin, filterInst, filterDept, filterHscBatch, filterRm, 
    filterCampus, filterSelectedSubject, filterTrainingReport,
    selectedSubjectCheckboxes
  ]);

  // Handle Subject Settings Edit
  const handleEditSubject = (setting: SubjectSetting) => {
    setEditingSubjectId(setting.id);
    setEditPercentValue(setting.percent);
  };

  const handleSaveSubject = (id: number) => {
    setSubjectSettings(prev => prev.map(s => s.id === id ? { ...s, percent: editPercentValue } : s));
    setEditingSubjectId(null);
  };

  // Handle Download
  const handleDownload = () => {
    // Filter columns based on selection
    const columnsToExport = allColumns.filter(c => selectedDownloadColumns.includes(c.label));
    
    const headerRow = columnsToExport.map(c => c.label).join(",");
    const rows = filteredRecords.map(r => 
      columnsToExport.map(c => {
        let val = (r as any)[c.key] || '';
        // Escape quotes
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      }).join(",")
    ).join("\n");
    
    const csvContent = "data:text/csv;charset=utf-8," + encodeURI(headerRow + "\n" + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "filtered_examiners.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsDownloadPopupOpen(false);
  };

  // --- Render Helpers ---

  const renderSettingsPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Subject Settings</h3>
          <button onClick={() => setIsSettingsOpen(false)} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <table className="w-full text-sm border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-center">SL</th>
              <th className="border p-2 text-left">Subject Name</th>
              <th className="border p-2 text-center">Persen</th>
              <th className="border p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {subjectSettings.map((setting, idx) => (
              <tr key={setting.id}>
                <td className="border p-2 text-center">{idx + 1}</td>
                <td className="border p-2">{setting.name}</td>
                <td className="border p-2 text-center">
                  {editingSubjectId === setting.id ? (
                    <div className="flex items-center justify-center">
                      <input 
                        type="number" 
                        value={editPercentValue} 
                        onChange={(e) => setEditPercentValue(Number(e.target.value))}
                        className="w-16 border border-gray-300 rounded px-1 py-1 text-center"
                      />
                      <span className="ml-1">%</span>
                    </div>
                  ) : (
                    `${setting.percent}%`
                  )}
                </td>
                <td className="border p-2 text-center">
                  {editingSubjectId === setting.id ? (
                    <button 
                      onClick={() => handleSaveSubject(setting.id)}
                      className="text-white bg-green-600 hover:bg-green-700 text-xs px-3 py-1 rounded"
                    >
                      Save
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleEditSubject(setting)}
                      className="text-blue-600 hover:text-blue-800 text-xs px-3 py-1 border border-blue-600 rounded hover:bg-blue-50"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDownloadPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-lg font-bold">Select Columns to Download</h3>
          <button onClick={() => setIsDownloadPopupOpen(false)} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto mb-4 border p-4 rounded bg-gray-50">
          <div className="flex items-center mb-4 pb-2 border-b">
            <label className="flex items-center gap-2 font-bold cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedDownloadColumns.length === allColumns.length}
                onChange={(e) => {
                  if (e.target.checked) setSelectedDownloadColumns(allColumns.map(c => c.label));
                  else setSelectedDownloadColumns([]);
                }}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              Select All
            </label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allColumns.map((col, idx) => (
              <label key={idx} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded">
                <input 
                  type="checkbox" 
                  checked={selectedDownloadColumns.includes(col.label)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedDownloadColumns([...selectedDownloadColumns, col.label]);
                    else setSelectedDownloadColumns(selectedDownloadColumns.filter(l => l !== col.label));
                  }}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="truncate" title={col.label}>{col.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 flex-shrink-0">
          <button 
            onClick={() => setIsDownloadPopupOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleDownload}
            className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700"
          >
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold text-brand-900 mb-6">Filter Examiner</h2>

      {/* Filters Grid */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MultiSelect label="T-Pin" options={optionsTPin} selected={filterTPin} onChange={setFilterTPin} />
          <MultiSelect label="Inst." options={optionsInst} selected={filterInst} onChange={setFilterInst} />
          <MultiSelect label="Dept." options={optionsDept} selected={filterDept} onChange={setFilterDept} />
          <MultiSelect label="HSC Batch" options={optionsHscBatch} selected={filterHscBatch} onChange={setFilterHscBatch} />
          <MultiSelect label="Rm" options={optionsRm} selected={filterRm} onChange={setFilterRm} />
          <MultiSelect label="Campus (Physically Check)" options={optionsCampus} selected={filterCampus} onChange={setFilterCampus} />
          <MultiSelect label="Selected Subject" options={optionsSelectedSubject} selected={filterSelectedSubject} onChange={setFilterSelectedSubject} />
          <MultiSelect label="Training Report" options={optionsTrainingReport} selected={filterTrainingReport} onChange={setFilterTrainingReport} />
        </div>

        {/* Subject Checkboxes with Settings */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-bold text-gray-700">Filter by Subject Marks:</label>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="text-gray-500 hover:text-brand-600 transition-colors p-1 rounded hover:bg-gray-100"
              title="Subject Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <div className="flex flex-wrap gap-4 mb-4">
            {subjectSettings.map(subject => (
              <label key={subject.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded text-brand-600 focus:ring-brand-500"
                  checked={selectedSubjectCheckboxes.includes(subject.name)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSubjectCheckboxes([...selectedSubjectCheckboxes, subject.name]);
                    } else {
                      setSelectedSubjectCheckboxes(selectedSubjectCheckboxes.filter(s => s !== subject.name));
                    }
                  }}
                />
                {subject.name}
              </label>
            ))}
          </div>

          {/* Search Button */}
          <div className="flex justify-start">
            <button 
                onClick={handleSearch}
                className="bg-brand-600 text-white px-6 py-2 rounded hover:bg-brand-700 shadow flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Search
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {hasSearched && (
        <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
            <div className="overflow-auto max-h-[75vh]">
            <table className="min-w-full divide-y divide-gray-200 text-xs relative">
                <thead className="bg-brand-50 sticky top-0 z-20">
                <tr>
                    <th className="px-3 py-3 text-left font-bold text-brand-800 uppercase tracking-wider">SL</th>
                    <th className="px-3 py-3 text-left font-bold text-brand-800 uppercase tracking-wider">T-Pin</th>
                    <th className="px-3 py-3 text-left font-bold text-brand-800 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-3 text-left font-bold text-brand-800 uppercase tracking-wider">Inst.</th>
                    <th className="px-3 py-3 text-left font-bold text-brand-800 uppercase tracking-wider">Dept.</th>
                    <th className="px-3 py-3 text-left font-bold text-brand-800 uppercase tracking-wider">Batch</th>
                    <th className="px-3 py-3 text-left font-bold text-brand-800 uppercase tracking-wider">Mobile</th>
                    <th className="px-3 py-3 text-left font-bold text-brand-800 uppercase tracking-wider">Selected Sub</th>
                    <th className="px-3 py-3 text-left font-bold text-brand-800 uppercase tracking-wider">Campus</th>
                    {selectedSubjectCheckboxes.map(subject => (
                        <th key={subject} className="px-3 py-3 text-left font-bold text-brand-800 uppercase tracking-wider">
                            {subject}(%)
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                    <tr><td colSpan={9 + selectedSubjectCheckboxes.length} className="px-6 py-4 text-center">Loading...</td></tr>
                ) : filteredRecords.length === 0 ? (
                    <tr><td colSpan={9 + selectedSubjectCheckboxes.length} className="px-6 py-4 text-center text-gray-500">No records found matching filters.</td></tr>
                ) : (
                    filteredRecords.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">{item.sl}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.tPin}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.nickName}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.inst}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.dept}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.hscBatch}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.mobileNumber}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.selectedSubject}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{item.checkScriptsCampus}</td>
                        {selectedSubjectCheckboxes.map(subject => {
                            const keyMap: {[key: string]: keyof ExaminerData} = {
                                'English': 'englishMarks',
                                'Bangla': 'banglaMarks',
                                'Physics': 'physicsMarks',
                                'Chemistry': 'chemistryMarks',
                                'Math': 'mathMarks',
                                'Biology': 'biologyMarks',
                                'ICT': 'ictMarks'
                            };
                            const key = keyMap[subject];
                            const val = item[key];
                            
                            // Determine color based on settings
                            let colorClass = "text-gray-700";
                            const setting = subjectSettings.find(s => s.name === subject);
                            
                            if (val && setting) {
                                const numVal = Number(val);
                                if (!isNaN(numVal)) {
                                    if (numVal > setting.percent) {
                                        colorClass = "text-green-600 font-bold";
                                    } else {
                                        colorClass = "text-red-600 font-bold";
                                    }
                                }
                            }

                            return (
                                <td key={subject} className={`px-3 py-2 whitespace-nowrap text-center font-medium ${colorClass}`}>
                                    {val || '-'}
                                </td>
                            );
                        })}
                    </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-500">Showing {filteredRecords.length} of {records.length} records</span>
                <button 
                    onClick={() => setIsDownloadPopupOpen(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow text-xs flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download
                </button>
            </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && renderSettingsPopup()}
      
      {/* Download Modal */}
      {isDownloadPopupOpen && renderDownloadPopup()}
    </div>
  );
};

export default FilterExaminer;
