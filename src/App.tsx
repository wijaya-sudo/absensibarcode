import React, { useState, useEffect } from 'react';
import { Member, AttendanceRecord, AttendanceSettings } from './types';
import { StorageService } from './utils/storage';
import { Scanner } from './components/Scanner';
import { AttendanceLog } from './components/AttendanceLog';
import { MemberManagement } from './components/MemberManagement';
import { KtaCardPreview } from './components/KtaCardPreview';
import { SettingsModal } from './components/SettingsModal';
import {
  Barcode,
  CalendarCheck2,
  Users,
  Settings,
  CreditCard,
  QrCode,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'attendance' | 'members'>('scanner');
  const [members, setMembers] = useState<Member[]>(() => StorageService.getMembers());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => StorageService.getAttendance());
  const [settings, setSettings] = useState<AttendanceSettings>(() => StorageService.getSettings());

  // Modal states
  const [selectedMemberForKta, setSelectedMemberForKta] = useState<Member | null>(null);
  const [isKtaModalOpen, setIsKtaModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [quickScanCandidate, setQuickScanCandidate] = useState<string | null>(null);

  // Sync state changes with localStorage
  useEffect(() => {
    StorageService.saveMembers(members);
  }, [members]);

  useEffect(() => {
    StorageService.saveAttendance(attendance);
  }, [attendance]);

  useEffect(() => {
    StorageService.saveSettings(settings);
  }, [settings]);

  // Handlers for attendance
  const handleAttendanceRecorded = (newRecord: AttendanceRecord) => {
    setAttendance((prev) => {
      const existingIdx = prev.findIndex(
        (r) => r.memberId === newRecord.memberId && r.date === newRecord.date
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = newRecord;
        return copy;
      }
      return [newRecord, ...prev];
    });
  };

  const handleDeleteRecord = (id: string) => {
    setAttendance((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddManualRecord = (record: AttendanceRecord) => {
    setAttendance((prev) => [record, ...prev]);
  };

  // Handlers for members
  const handleAddMember = (newMember: Member) => {
    setMembers((prev) => [newMember, ...prev]);
  };

  const handleUpdateMember = (updatedMember: Member) => {
    setMembers((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
  };

  const handleDeleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleOpenKtaModal = (member: Member) => {
    setSelectedMemberForKta(member);
    setIsKtaModalOpen(true);
  };

  const handleQuickScanFromKta = (ktaNumber: string) => {
    setActiveTab('scanner');
    setQuickScanCandidate(ktaNumber);
  };

  const handleResetData = () => {
    StorageService.resetAllData();
    setMembers(StorageService.getMembers());
    setAttendance(StorageService.getAttendance());
    setSettings(StorageService.getSettings());
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Contract: Zone 1 (Wordmark), Zone 2 (4 clean links), Zone 3 (1-2 primary actions) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200 shadow-2xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 block leading-none">
                SIKTA Absensi
              </span>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                Sistem Barcode KTA
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'scanner'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Barcode className="w-3.5 h-3.5" />
              <span>Pemindai Barcode</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'attendance'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CalendarCheck2 className="w-3.5 h-3.5" />
              <span>Rekap Absensi</span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'members'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Anggota & KTA</span>
            </button>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (members.length > 0) {
                  handleOpenKtaModal(members[0]);
                }
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="Pratinjau Kartu Tanda Anggota"
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span>Contoh KTA</span>
            </button>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Pengaturan Absensi"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'scanner' && (
          <Scanner
            members={members}
            attendance={attendance}
            settings={settings}
            externalScanTrigger={quickScanCandidate}
            onClearExternalScan={() => setQuickScanCandidate(null)}
            onAttendanceRecorded={handleAttendanceRecorded}
            onOpenKtaModal={handleOpenKtaModal}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceLog
            attendance={attendance}
            members={members}
            onDeleteRecord={handleDeleteRecord}
            onAddManualRecord={handleAddManualRecord}
          />
        )}

        {activeTab === 'members' && (
          <MemberManagement
            members={members}
            settings={settings}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            onSelectMemberForKta={handleOpenKtaModal}
            onQuickScanMember={handleQuickScanFromKta}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">{settings.organizationName}</span>
            <span>·</span>
            <span>Sistem Presensi KTA Barcode & QR Code</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Standar Kartu ISO CR-80</span>
            <span>·</span>
            <span>Code128 Barcode Engine</span>
          </div>
        </div>
      </footer>

      {/* KTA Card Modal */}
      {selectedMemberForKta && (
        <KtaCardPreview
          member={selectedMemberForKta}
          settings={settings}
          isOpen={isKtaModalOpen}
          onClose={() => setIsKtaModalOpen(false)}
          onQuickScan={handleQuickScanFromKta}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        settings={settings}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        onResetData={handleResetData}
      />
    </div>
  );
}
