export interface Member {
  id: string;
  ktaNumber: string;
  name: string;
  role: string;
  division: string;
  organization: string;
  avatar: string;
  phone: string;
  email: string;
  joinDate: string;
  status: 'aktif' | 'cuti' | 'nonaktif';
  bloodType?: string;
  emergencyContact?: string;
}

export type AttendanceStatus = 'tepat_waktu' | 'terlambat' | 'izin' | 'sakit' | 'tugas_luar';
export type ScanType = 'masuk' | 'pulang';
export type ScanMethod = 'barcode_scan' | 'qr_scan' | 'manual';

export interface AttendanceRecord {
  id: string;
  memberId: string;
  ktaNumber: string;
  memberName: string;
  role: string;
  division: string;
  avatar: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm:ss
  checkOutTime: string | null; // HH:mm:ss
  status: AttendanceStatus;
  notes?: string;
  method: ScanMethod;
  workingHours?: string;
}

export interface AttendanceSettings {
  organizationName: string;
  organizationSubtext: string;
  workStartTime: string; // e.g. "08:00"
  lateThresholdMinutes: number; // e.g. 15 -> 08:15
  workEndTime: string; // e.g. "17:00"
  enableSound: boolean;
  scanMode: 'auto' | 'masuk_only' | 'pulang_only';
}

export interface ScanFeedback {
  type: 'success' | 'warning' | 'error';
  member?: Member;
  record?: AttendanceRecord;
  action?: 'masuk' | 'pulang';
  message: string;
  timestamp: string;
}
