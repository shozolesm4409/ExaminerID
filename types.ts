export interface ExaminerData {
  id?: string;
  sl?: number;
  // Personal Info
  nickName: string;
  fullName: string;
  fullNameBn: string;
  fatherName: string;
  fatherOccupation: string;
  fatherDesignation: string;
  fatherMobile: string;
  motherName: string;
  motherOccupation: string;
  motherMobile: string;
  gender: string;
  religion: string;
  dob: string;
  bloodGroup: string;
  bloodDonate: string;
  nidNo: string;
  presentArea: string;
  homeDistrict: string;
  mobileNumber: string;
  alternateMobile: string;
  email: string;
  facebookId: string;
  teamsSkypeId: string;
  photoUrl: string;

  // Institution/Academic
  inst: string;
  dept: string;
  hscBatch: string;
  hscRoll: string;
  hscReg: string;
  hscBoard: string;
  hscGpa: string;
  collegeName: string;
  mediumHsc: string;
  admissionPosition: string;
  admissionUnit: string;
  udvashRoll: string;
  participatedPrograms: string;
  
  // Marks & Sets
  englishMarks: string; englishSet: string; englishDate: string;
  banglaMarks: string; banglaSet: string; banglaDate: string;
  physicsMarks: string; physicsSet: string; physicsDate: string;
  chemistryMarks: string; chemistrySet: string; chemistryDate: string;
  mathMarks: string; mathSet: string; mathDate: string;
  biologyMarks: string; biologySet: string; biologyDate: string;
  ictMarks: string; ictSet: string; ictDate: string;

  // Payment/Banking
  paymentMethod: string;
  mobileBankingNumber: string;
  mobileBankingOwner: string;
  mobileBankingConfirmedBy?: string;
  tinNumber: string;
  tinDateLink: string;

  // Examiner Specifics
  tPin: string; // T-PIN
  status: 'Pending' | 'Approved' | 'Rejected';
  rm: string; 
  remarkedBy: string;
  rm4Comment: string;
  runningProgram: string;
  previousProgram: string;
  physicallyCheckSubjects: string;
  onlineSubjectPermission: string;
  scriptCheckMethod: string; // Which way do you want to see scripts
  
  // Subjects
  subject1: string; subject2: string; subject3: string; subject4: string; subject5: string;
  versionInterested: string;
  selectedSubject?: string;
  
  // Logistics
  branch: string;
  formFillUpCampus: string;
  checkScriptsCampus: string;
  checkScriptsShift: string;
  reference: string;
  entryBy: string;
  formFillUpDate: string;
  trainingReport: string;
  trainingDate: string;
  idChecked: boolean;
  documentLink: string;
  
  oldId?: string;
  lastUpdateDate?: string;
}

export interface ContentItem {
  id?: string;
  title: string;
  body: string;
  date: string;
  type: 'notice' | 'program' | 'faq' | 'campus';
  isVisible: boolean;
}

export interface CampusInfo {
  id?: string;
  sl: number;
  isActive: boolean;
  cardHeading: string;
  phone1: string;
  phone2: string;
  popupHeading: string;
  address: string;
  mapIframe: string;
  whatsappTitle: string;
  whatsappNumber: string;
  category: string; // 'Inside Dhaka', 'Outside Dhaka', 'Online', etc.
}

export const ADMIN_EMAIL = "test.123@udvash.net";