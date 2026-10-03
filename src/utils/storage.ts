import { Member, AttendanceRecord, AttendanceSettings } from '../types';

export const DEFAULT_SETTINGS: AttendanceSettings = {
  organizationName: 'KOPERASI KONSUMEN PENDAMPING INDONESIA',
  organizationSubtext: 'Badan Hukum No: AHU-0004912.AH.01.26.TAHUN 2024',
  workStartTime: '08:00',
  lateThresholdMinutes: 15, // 08:15 WIB
  workEndTime: '17:00',
  enableSound: true,
  scanMode: 'auto',
};

export const DEFAULT_MEMBERS: Member[] = [
  {
    id: 'mem-001',
    ktaNumber: 'KTA-2026-001',
    name: 'Bambang Wijaya, S.E.',
    role: 'Koordinator Pendamping Koperasi',
    division: 'Divisi Pendampingan & Usaha',
    organization: 'Koperasi Konsumen Pendamping Indonesia',
    avatar: '/src/assets/images/avatar_member_male1_1790999236469.jpg',
    phone: '0812-3456-7890',
    email: 'wijaya@pendamping.kop.id',
    joinDate: '2023-01-15',
    status: 'aktif',
    bloodType: 'O',
    emergencyContact: '0813-8899-7711 (Istri)',
  },
  {
    id: 'mem-002',
    ktaNumber: 'KTA-2026-002',
    name: 'Siti Nurhaliza, S.Ak.',
    role: 'Staf Akuntansi & Keuangan',
    division: 'Divisi Keuangan & Pembukuan',
    organization: 'Koperasi Konsumen Pendamping Indonesia',
    avatar: '/src/assets/images/avatar_member_female1_1790999250975.jpg',
    phone: '0857-1122-3344',
    email: 'siti.akuntansi@pendamping.kop.id',
    joinDate: '2023-03-01',
    status: 'aktif',
    bloodType: 'A',
    emergencyContact: '0856-7788-9900 (Orang Tua)',
  },
  {
    id: 'mem-003',
    ktaNumber: 'KTA-2026-003',
    name: 'Dimas Pratama, S.Kom.',
    role: 'Staf IT & Tata Kelola Digital',
    division: 'Divisi Operasional & IT',
    organization: 'Koperasi Konsumen Pendamping Indonesia',
    avatar: '/src/assets/images/avatar_member_male2_1790999263071.jpg',
    phone: '0819-5566-7788',
    email: 'dimas.pratama@pendamping.kop.id',
    joinDate: '2023-06-10',
    status: 'aktif',
    bloodType: 'B',
    emergencyContact: '0819-2233-4455 (Saudara)',
  },
  {
    id: 'mem-004',
    ktaNumber: 'KTA-2026-004',
    name: 'Ratna Dewi Kusuma, M.M.',
    role: 'Manajer Pemberdayaan Usaha',
    division: 'Divisi Pendampingan & Usaha',
    organization: 'Koperasi Konsumen Pendamping Indonesia',
    avatar: '/src/assets/images/avatar_member_female1_1790999250975.jpg',
    phone: '0813-4433-2211',
    email: 'ratna.dewi@pendamping.kop.id',
    joinDate: '2022-11-20',
    status: 'aktif',
    bloodType: 'AB',
    emergencyContact: '0812-9988-7766 (Suami)',
  },
  {
    id: 'mem-005',
    ktaNumber: 'KTA-2026-005',
    name: 'Ahmad Fauzi Santoso',
    role: 'Pengawas Logistik & Inventaris',
    division: 'Divisi Operasional & IT',
    organization: 'Koperasi Konsumen Pendamping Indonesia',
    avatar: '/src/assets/images/avatar_member_male1_1790999236469.jpg',
    phone: '0821-6677-8899',
    email: 'ahmad.fauzi@pendamping.kop.id',
    joinDate: '2024-01-08',
    status: 'aktif',
    bloodType: 'O',
    emergencyContact: '0821-5544-3322 (Istri)',
  },
  {
    id: 'mem-006',
    ktaNumber: 'KTA-2026-006',
    name: 'Maya Putri Anggraini',
    role: 'Staf Layanan & Keanggotaan',
    division: 'Divisi Layanan Anggota',
    organization: 'Koperasi Konsumen Pendamping Indonesia',
    avatar: '/src/assets/images/avatar_member_female1_1790999250975.jpg',
    phone: '0878-1234-5678',
    email: 'maya.anggraini@pendamping.kop.id',
    joinDate: '2024-04-15',
    status: 'aktif',
    bloodType: 'A',
    emergencyContact: '0878-9900-1122 (Ibu)',
  },
];

// Helper to get today's date formatted as YYYY-MM-DD
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function calculateWorkingHours(checkIn: string, checkOut: string): string {
  try {
    const [h1, m1, s1] = checkIn.split(':').map(Number);
    const [h2, m2, s2] = checkOut.split(':').map(Number);
    const startSec = (h1 * 3600) + (m1 * 60) + (s1 || 0);
    const endSec = (h2 * 3600) + (m2 * 60) + (s2 || 0);
    const diffSec = Math.max(0, endSec - startSec);
    const hours = Math.floor(diffSec / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    return `${hours} jam ${minutes} mnt`;
  } catch {
    return '-';
  }
}

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-today-001',
    memberId: 'mem-001',
    ktaNumber: 'KTA-2026-001',
    memberName: 'Bambang Wijaya, S.E.',
    role: 'Koordinator Pendamping Koperasi',
    division: 'Divisi Pendampingan & Usaha',
    avatar: '/src/assets/images/avatar_member_male1_1790999236469.jpg',
    date: getTodayDateString(),
    checkInTime: '07:48:12',
    checkOutTime: null,
    status: 'tepat_waktu',
    method: 'barcode_scan',
    notes: 'Hadir tepat waktu melalui Barcode Scanner',
  },
  {
    id: 'att-today-002',
    memberId: 'mem-002',
    ktaNumber: 'KTA-2026-002',
    memberName: 'Siti Nurhaliza, S.Ak.',
    role: 'Staf Akuntansi & Keuangan',
    division: 'Divisi Keuangan & Pembukuan',
    avatar: '/src/assets/images/avatar_member_female1_1790999250975.jpg',
    date: getTodayDateString(),
    checkInTime: '08:04:30',
    checkOutTime: null,
    status: 'tepat_waktu',
    method: 'barcode_scan',
    notes: 'Presensi scan KTA fisik',
  },
  {
    id: 'att-today-003',
    memberId: 'mem-003',
    ktaNumber: 'KTA-2026-003',
    memberName: 'Dimas Pratama, S.Kom.',
    role: 'Staf IT & Tata Kelola Digital',
    division: 'Divisi Operasional & IT',
    avatar: '/src/assets/images/avatar_member_male2_1790999263071.jpg',
    date: getTodayDateString(),
    checkInTime: '08:22:15',
    checkOutTime: null,
    status: 'terlambat',
    method: 'barcode_scan',
    notes: 'Terlambat 7 menit dari toleransi 08:15',
  }
];

const STORAGE_KEYS = {
  MEMBERS: 'sikta_members_v1',
  ATTENDANCE: 'sikta_attendance_v1',
  SETTINGS: 'sikta_settings_v1',
};

export const StorageService = {
  getMembers(): Member[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      return data ? JSON.parse(data) : DEFAULT_MEMBERS;
    } catch {
      return DEFAULT_MEMBERS;
    }
  },

  saveMembers(members: Member[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    } catch (e) {
      console.error('Error saving members:', e);
    }
  },

  getAttendance(): AttendanceRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      return data ? JSON.parse(data) : INITIAL_ATTENDANCE;
    } catch {
      return INITIAL_ATTENDANCE;
    }
  },

  saveAttendance(records: AttendanceRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving attendance:', e);
    }
  },

  getSettings(): AttendanceSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AttendanceSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  },

  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }
};
