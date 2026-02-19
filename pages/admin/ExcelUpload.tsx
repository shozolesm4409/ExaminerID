import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ExaminerData } from '../../types';

// Map Excel Header Strings to ExaminerData keys
const COLUMN_MAP: { [key: string]: keyof ExaminerData } = {
  "SL": "sl",
  "Nick Name": "nickName",
  "Status": "status",
  "T-PIN": "tPin",
  "Inst.": "inst",
  "Dept.": "dept",
  "HSC Batch": "hscBatch",
  "Rm": "rm",
  "Remarked By": "remarkedBy",
  "Mobile Number": "mobileNumber",
  "Alternate": "alternateMobile",
  "Mobile Banking Number": "mobileBankingNumber",
  "Payment Method": "paymentMethod",
  "Mobile Banking Account Owner": "mobileBankingOwner",
  "Mobile Banking Number Confirmed By": "mobileBankingConfirmedBy",
  "Running Program": "runningProgram",
  "Previous Program": "previousProgram",
  "Physically Scripts Checking Subject": "physicallyCheckSubjects",
  "Online Subject Permission": "onlineSubjectPermission",
  "TIN Given Date / TIN PDF Link": "tinDateLink",
  "TIN Number": "tinNumber",
  "E-mail": "email",
  "Teams/Skype ID": "teamsSkypeId",
  "Facebook ID": "facebookId",
  "ID (Old)": "oldId",
  "Admission Position": "admissionPosition",
  "Admission Unit": "admissionUnit",
  "HSC Roll": "hscRoll",
  "HSC Reg.": "hscReg",
  "HSC Board": "hscBoard",
  "HSC GPA": "hscGpa",
  "Medium of education upto HSC Level": "mediumHsc",
  "Which way do you want to see the scripts?": "scriptCheckMethod",
  "Subject 1": "subject1",
  "Subject 2": "subject2",
  "Subject 3": "subject3",
  "Subject 4": "subject4",
  "Subject 5": "subject5",
  "Version Interested": "versionInterested",
  "Udvash Unmesh Roll / Registration": "udvashRoll",
  "Participated Programmes in  Udvash Unmesh": "participatedPrograms",
  "Branch": "branch",
  "Full Name": "fullName",
  "বাংলায় সম্পূর্ণ নাম": "fullNameBn",
  "Religion": "religion",
  "Gender": "gender",
  "Date of Birth": "dob",
  "Blood Donate": "bloodDonate",
  "Blood Group": "bloodGroup",
  "Last DateDate": "lastUpdateDate",
  "College Name": "collegeName",
  "Father's Name": "fatherName",
  "Father's Occupation": "fatherOccupation",
  "Father's Designation": "fatherDesignation",
  "Father's Mobile": "fatherMobile",
  "Mother's Name": "motherName",
  "Mother's Occupation": "motherOccupation",
  "Mother's Mobile": "motherMobile",
  "NID No.": "nidNo",
  "Present Area": "presentArea",
  "Home District": "homeDistrict",
  "English(%)": "englishMarks",
  "English Set": "englishSet",
  "English Exam Date": "englishDate",
  "Bangla(%)": "banglaMarks",
  "Bangla Set": "banglaSet",
  "Bangla Exam Date": "banglaDate",
  "Physics(%)": "physicsMarks",
  "Physics Set": "physicsSet",
  "Physics Exam Date": "physicsDate",
  "Chemistry (%)": "chemistryMarks",
  "Chemistry  Set": "chemistrySet",
  "Chemistry Exam Date": "chemistryDate",
  "Math (%)": "mathMarks",
  "Math  Set": "mathSet",
  "Math Exam Date": "mathDate",
  "Biology (%)": "biologyMarks",
  "Biology Set": "biologySet",
  "Biology Exam Date": "biologyDate",
  "ICT(%)": "ictMarks",
  "ICT Set": "ictSet",
  "ICT Exam Date": "ictDate",
  "Training Report": "trainingReport",
  "Training Date": "trainingDate",
  "Form Fill Up Campus": "formFillUpCampus",
  "ID Checked?": "idChecked",
  "Entry By": "entryBy",
  "Form Fill Up Date": "formFillUpDate",
  "In Which Campus You Want To Check Scripts physically?": "checkScriptsCampus",
  "In which Shift do you want to check the scripts?\n(Maximum 2 Shifts can be selected)\nOnly write the name of the Shift (No need to write the timing of the Shift)": "checkScriptsShift",
  "Reference": "reference",
  "Selected Subject": "selectedSubject",
  "RM 4 Comment": "rm4Comment",
  "Photo": "photoUrl",
  "Docoment": "documentLink"
};

const ExcelUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [targetCollection, setTargetCollection] = useState<'examiners' | 'applications'>('examiners');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processUpload = async () => {
    if (!file) return;
    setLoading(true);
    setProgress("Reading file...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Parse to JSON with header row 1
      const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);
      
      if (jsonData.length === 0) {
        alert("No data found in file.");
        setLoading(false);
        return;
      }

      setProgress(`Processing ${jsonData.length} records...`);

      const examiners: ExaminerData[] = jsonData.map((row: any) => {
        const examiner: any = {};
        
        // Map fields
        Object.keys(COLUMN_MAP).forEach(excelHeader => {
          const dbKey = COLUMN_MAP[excelHeader];
          // Try exact match, otherwise try trimmed match for safety (remove newlines from excel header key in map vs file)
          let val = row[excelHeader];
          
          if (val === undefined) {
             // Fallback lookup: find a key in row that equals trimmed excelHeader
             // Normalize keys by removing newlines and extra spaces
             const normalize = (str: string) => str.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
             const targetKey = normalize(excelHeader);
             
             const rowKey = Object.keys(row).find(k => normalize(k) === targetKey);
             if (rowKey) val = row[rowKey];
          }

          if (val !== undefined) {
             // Basic type conversion
             if (dbKey === 'idChecked') {
                examiner[dbKey] = String(val).toLowerCase() === 'yes' || String(val) === 'true';
             } else if (dbKey === 'sl') {
                // Parse SL as number
                const numSl = Number(val);
                examiner[dbKey] = isNaN(numSl) ? 0 : numSl;
             } else {
                examiner[dbKey] = String(val);
             }
          }
        });

        // Default 'Approved' if status is missing in upload AND uploading to Approved DB? 
        // If uploading to Applications (Remarking), default status should probably be Pending if missing.
        if (!examiner.status) {
             examiner.status = targetCollection === 'examiners' ? 'Approved' : 'Pending';
        }
        
        if (!examiner.mobileNumber) examiner.mobileNumber = '';

        return examiner as ExaminerData;
      });

      // Upload in batches (Firestore limit 500)
      const batchSize = 400; // safe margin
      const totalBatches = Math.ceil(examiners.length / batchSize);
      
      for (let i = 0; i < totalBatches; i++) {
        setProgress(`Uploading batch ${i + 1} of ${totalBatches}...`);
        const batch = writeBatch(db);
        const chunk = examiners.slice(i * batchSize, (i + 1) * batchSize);
        
        chunk.forEach(ex => {
            const docRef = doc(collection(db, targetCollection));
            // Add timestamp
            batch.set(docRef, { ...ex, timestamp: new Date() });
        });
        
        await batch.commit();
      }

      setProgress("Upload Complete!");
      alert(`Successfully uploaded ${examiners.length} records to ${targetCollection === 'examiners' ? 'Examiner Records' : 'Remarking Queue'}.`);
      setFile(null);
    } catch (err: any) {
      console.error(err);
      alert("Error processing file: " + err.message);
      setProgress("Error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-brand-900">Excel Data Upload</h2>
      
      <div className="bg-white p-8 rounded shadow-md">
        <div className="mb-6">
            <h3 className="font-bold text-lg mb-2">Instructions</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Upload an .xlsx or .xls file.</li>
                <li>Ensure the first row contains headers matching the database schema.</li>
                <li>Large files will be processed in batches.</li>
            </ul>
        </div>
        
        <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Target Destination</label>
            <div className="flex gap-4">
                <label className="flex items-center space-x-2 border p-3 rounded-lg w-full cursor-pointer hover:bg-gray-50 has[:checked]:border-brand-500 has[:checked]:bg-brand-50">
                    <input 
                        type="radio" 
                        name="target" 
                        checked={targetCollection === 'examiners'} 
                        onChange={() => setTargetCollection('examiners')}
                        className="text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                        <span className="block font-bold text-gray-800">Examiner Records (Approved)</span>
                        <span className="text-xs text-gray-500">Uploads directly to main database.</span>
                    </div>
                </label>
                <label className="flex items-center space-x-2 border p-3 rounded-lg w-full cursor-pointer hover:bg-gray-50 has[:checked]:border-brand-500 has[:checked]:bg-brand-50">
                    <input 
                        type="radio" 
                        name="target" 
                        checked={targetCollection === 'applications'} 
                        onChange={() => setTargetCollection('applications')}
                        className="text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                        <span className="block font-bold text-gray-800">Remarking (Pending)</span>
                        <span className="text-xs text-gray-500">Uploads to waiting queue for review.</span>
                    </div>
                </label>
            </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:bg-gray-50 transition">
            <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-brand-50 file:text-brand-700
                  hover:file:bg-brand-100
                "
            />
            {file && <p className="mt-4 font-bold text-brand-800">Selected: {file.name}</p>}
        </div>

        {progress && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded text-center font-medium">
                {progress}
            </div>
        )}

        <div className="mt-6">
            <button 
                onClick={processUpload} 
                disabled={!file || loading}
                className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Processing..." : `Upload to ${targetCollection === 'examiners' ? 'Records' : 'Remarking'}`}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelUpload;