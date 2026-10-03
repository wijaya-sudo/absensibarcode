import React, { useState } from 'react';
import { AttendanceRecord, Member } from '../types';
import { getTodayDateString } from '../utils/storage';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  UserCheck,
  PlusCircle,
  Trash2,
  LogIn,
  LogOut,
  X
} from 'lucide-react';

interface AttendanceLogProps {
  attendance: AttendanceRecord[];
  members: Member[];
  onDeleteRecord: (id: string) => void;
  onAddManualRecord: (record: AttendanceRecord) => void;
}

export const AttendanceLog: React.FC<AttendanceLogProps> = ({
  attendance,
  members,
  onDeleteRecord,
  onAddManualRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'today' | 'all'>('today');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Manual record form state
  const [manualMemberId, setManualMemberId] = useState(members[0]?.id || '');
  const [manualStatus, setManualStatus] = useState<'tepat_waktu' | 'terlambat' | 'izin' | 'sakit'>('tepat_waktu');
  const [manualTime, setManualTime] = useState('08:00');
  const [manualNotes, setManualNotes] = useState('Presensi manual (kartu tertinggal)');

  const todayStr = getTodayDateString();

  // Filter records
  const filteredRecords = attendance.filter((rec) => {
    const matchesSearch =
      rec.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.ktaNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.division.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = selectedDateFilter === 'all' ? true : rec.date === todayStr;
    const matchesStatus = selectedStatus === 'all' ? true : rec.status === selectedStatus;
    const matchesDivision = selectedDivision === 'all' ? true : rec.division === selectedDivision;

    return matchesSearch && matchesDate && matchesStatus && matchesDivision;
  });

  // Calculate statistics
  const todayRecords = attendance.filter((r) => r.date === todayStr);
  const totalPresentToday = todayRecords.length;
  const onTimeToday = todayRecords.filter((r) => r.status === 'tepat_waktu').length;
  const lateToday = todayRecords.filter((r) => r.status === 'terlambat').length;
  const totalMembers = members.length;
  const attendanceRate = totalMembers > 0 ? Math.round((totalPresentToday / totalMembers) * 100) : 0;

  // Export to CSV function
  const exportToCSV = () => {
    const headers = [
      'No. KTA',
      'Nama Anggota',
      'Jabatan',
      'Divisi',
      'Tanggal',
      'Jam Masuk',
      'Jam Pulang',
      'Durasi Kerja',
      'Status Kehadiran',
      'Metode Scan',
      'Keterangan',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.ktaNumber}"`,
      `"${r.memberName}"`,
      `"${r.role}"`,
      `"${r.division}"`,
      `"${r.date}"`,
      `"${r.checkInTime}"`,
      `"${r.checkOutTime || '-'}"`,
      `"${r.workingHours || '-'}"`,
      `"${r.status === 'tepat_waktu' ? 'Tepat Waktu' : r.status === 'terlambat' ? 'Terlambat' : r.status}"`,
      `"${r.method}"`,
      `"${r.notes || '-'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Rekap_Absensi_KTA_${selectedDateFilter === 'today' ? todayStr : 'Semua'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mem = members.find((m) => m.id === manualMemberId);
    if (!mem) return;

    const newRecord: AttendanceRecord = {
      id: `att-manual-${Date.now()}`,
      memberId: mem.id,
      ktaNumber: mem.ktaNumber,
      memberName: mem.name,
      role: mem.role,
      division: mem.division,
      avatar: mem.avatar,
      date: todayStr,
      checkInTime: `${manualTime}:00`,
      checkOutTime: null,
      status: manualStatus,
      method: 'manual',
      notes: manualNotes,
    };

    onAddManualRecord(newRecord);
    setIsManualModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Hadir Hari Ini</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {totalPresentToday}
            </span>
            <span className="text-xs text-slate-500">/ {totalMembers} Anggota</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">
            Tingkat kehadiran: {attendanceRate}%
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tepat Waktu</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
              {onTimeToday}
            </span>
            <span className="text-xs text-slate-500">presensi</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {totalPresentToday > 0
              ? `${Math.round((onTimeToday / totalPresentToday) * 100)}% dari total hadir`
              : 'Belum ada data'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Terlambat</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-700 tabular-nums">
              {lateToday}
            </span>
            <span className="text-xs text-slate-500">anggota</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Melewati toleransi jam masuk</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Belum Presensi</span>
            <AlertCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-700 tabular-nums">
              {Math.max(0, totalMembers - totalPresentToday)}
            </span>
            <span className="text-xs text-slate-500">anggota</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Belum memindai barcode KTA</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 md:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, KTA, divisi..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>

            {/* Date filter toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-700">
              <button
                onClick={() => setSelectedDateFilter('today')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  selectedDateFilter === 'today'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setSelectedDateFilter('all')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  selectedDateFilter === 'all'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                Semua Riwayat
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Input Manual</span>
            </button>

            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV (Excel)</span>
            </button>
          </div>
        </div>

        {/* Attendance Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Anggota & No. KTA</th>
                <th className="py-3 px-4">Divisi & Jabatan</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Jam Masuk</th>
                <th className="py-3 px-4">Jam Pulang</th>
                <th className="py-3 px-4">Status & Metode</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada catatan absensi yang sesuai filter
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.avatar}
                          alt={item.memberName}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{item.memberName}</div>
                          <div className="font-mono text-[10px] text-slate-500 font-bold">
                            {item.ktaNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{item.role}</div>
                      <div className="text-[11px] text-slate-500">{item.division}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <LogIn className="w-3 h-3 text-emerald-600" />
                        {item.checkInTime}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {item.checkOutTime ? (
                        <div>
                          <span className="inline-flex items-center gap-1 font-bold text-slate-900">
                            <LogOut className="w-3 h-3 text-indigo-600" />
                            {item.checkOutTime}
                          </span>
                          {item.workingHours && (
                            <span className="block text-[10px] text-slate-500">
                              ({item.workingHours})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Belum Pulang</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.status === 'tepat_waktu'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.status === 'tepat_waktu' ? 'Tepat Waktu' : 'Terlambat'}
                        </span>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {item.method === 'barcode_scan' ? 'Scan Barcode' : item.method}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate">
                      {item.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Hapus catatan absensi ${item.memberName}?`)) {
                            onDeleteRecord(item.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Attendance Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-900">
                Pencatatan Presensi Manual
              </h2>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Anggota *
                </label>
                <select
                  value={manualMemberId}
                  onChange={(e) => setManualMemberId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.ktaNumber}) - {m.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Presensi *
                  </label>
                  <input
                    type="time"
                    required
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value as unknown as typeof manualStatus)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="tepat_waktu">Tepat Waktu</option>
                    <option value="terlambat">Terlambat</option>
                    <option value="izin">Izin</option>
                    <option value="sakit">Sakit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan / Keterangan
                </label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Contoh: KTA fisik tertinggal di rumah"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
                >
                  Simpan Presensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
