export type SubmissionStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type DocType = 'kimlik' | 'ikametgah' | 'saglik_raporu' | 'diploma' | 'referans_mektubu' | 'diger';
export type HrRole = 'hr' | 'admin';
export type ApprovalAction = 'approved' | 'rejected' | 'note_added';

export interface PersonalInfo {
  full_name: string;
  tc_no: string;
  birth_date: string;
  birth_place: string;
  gender: 'male' | 'female' | 'other';
  marital_status: 'single' | 'married' | 'divorced' | 'widowed';
  education_level: 'ilkokul' | 'ortaokul' | 'lise' | 'onlisans' | 'lisans' | 'yukseklisans' | 'doktora';
  department: string;
  job_title: string;
  start_date: string;
}

export interface ContactInfo {
  phone: string;
  address: string;
  city: string;
  district: string;
  postal_code: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface BankInfo {
  bank_name: string;
  iban: string;
  account_holder: string;
}

export interface Employee {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  token: string;
  invited_by: string | null;
  token_used: boolean;
  created_at: string;
}

export interface OnboardingSubmission {
  id: string;
  employee_id: string;
  status: SubmissionStatus;
  personal_info: PersonalInfo | null;
  contact_info: ContactInfo | null;
  emergency_contact: EmergencyContact | null;
  bank_info: BankInfo | null;
  current_step: number;
  digital_consent: boolean;
  submitted_at: string | null;
  updated_at: string;
  employees?: Employee;
  documents?: Document[];
  approval_logs?: ApprovalLog[];
}

export interface Document {
  id: string;
  submission_id: string;
  doc_type: DocType;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string;
}

export interface ApprovalLog {
  id: string;
  submission_id: string;
  hr_user_id: string;
  action: ApprovalAction;
  note: string | null;
  created_at: string;
  hr_users?: HrUser;
}

export interface HrUser {
  id: string;
  email: string;
  full_name: string;
  role: HrRole;
  created_at: string;
}
