import React, { useState } from 'react';
import { AttendanceSettings } from '../types';
import {
  Settings,
  X,
  Building2,
  Clock,
  Volume2,
  RotateCcw,
  CheckCircle,
  FileDown
} from 'lucide-react';

interface SettingsModalProps {
  settings: AttendanceSettings;
  isOpen: boolean;
  onClose: () => void;
  onSaveSettings: (settings: AttendanceSettings) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSaveSettings,
  onResetData,
}) => {
  const [formData, setFormData] = useState<AttendanceSettings>({ ...settings });
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-semibold text-slate-900">
              Pengaturan Sistem & Absensi KTA
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              Nama Organisasi / Koperasi / Lembaga
            </label>
            <input
              type="text"
              required
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Legalitas / Keterangan Kartu KTA
            </label>
            <input
              type="text"
              value={formData.organizationSubtext}
              onChange={(e) => setFormData({ ...formData, organizationSubtext: e.target.value })}
              placeholder="Nomor Badan Hukum / SK Pendirian"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" /> Jam Masuk Kerja
              </label>
              <input
                type="time"
                value={formData.workStartTime}
                onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Toleransi Terlambat (Menit)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={formData.lateThresholdMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, lateThresholdMinutes: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jam Pulang Kerja
              </label>
              <input
                type="time"
                value={formData.workEndTime}
                onChange={(e) => setFormData({ ...formData, workEndTime: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mode Awal Pemindai
              </label>
              <select
                value={formData.scanMode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scanMode: e.target.value as 'auto' | 'masuk_only' | 'pulang_only',
                  })
                }
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="auto">Otomatis (Masuk & Pulang)</option>
                <option value="masuk_only">Hanya Masuk</option>
                <option value="pulang_only">Hanya Pulang</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enableSound}
                onChange={(e) => setFormData({ ...formData, enableSound: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4"
              />
              <span className="font-medium">
                Aktifkan bunyi beep pemindai barcode saat KTA terdeteksi
              </span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    'Kembalikan seluruh data anggota & absensi ke data awal? Perubahan lokal akan direset.'
                  )
                ) {
                  onResetData();
                  onClose();
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data Demo</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs inline-flex items-center gap-1.5"
              >
                {savedNotice && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{savedNotice ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
