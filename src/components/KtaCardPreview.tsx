import React, { useState } from 'react';
import { Member, AttendanceSettings } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import { QRCodeRenderer } from './QRCodeRenderer';
import { Printer, RotateCcw, X, ShieldCheck, Check, Sparkles } from 'lucide-react';

interface KtaCardPreviewProps {
  member: Member;
  settings: AttendanceSettings;
  isOpen: boolean;
  onClose: () => void;
  onQuickScan?: (ktaNumber: string) => void;
}

export const KtaCardPreview: React.FC<KtaCardPreviewProps> = ({
  member,
  settings,
  isOpen,
  onClose,
  onQuickScan,
}) => {
  const [activeSide, setActiveSide] = useState<'both' | 'front' | 'back'>('both');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyKta = () => {
    navigator.clipboard.writeText(member.ktaNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 no-print">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Kartu Tanda Anggota (KTA) Barcode
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Format standar ID Card CR-80 (85.6 mm × 53.98 mm) siap cetak dan scan
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-200/70 p-1 rounded-lg text-xs font-medium text-slate-700">
              <button
                onClick={() => setActiveSide('both')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeSide === 'both' ? 'bg-white shadow-xs text-slate-900' : 'hover:text-slate-900'
                }`}
              >
                Depan & Belakang
              </button>
              <button
                onClick={() => setActiveSide('front')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeSide === 'front' ? 'bg-white shadow-xs text-slate-900' : 'hover:text-slate-900'
                }`}
              >
                Depan
              </button>
              <button
                onClick={() => setActiveSide('back')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeSide === 'back' ? 'bg-white shadow-xs text-slate-900' : 'hover:text-slate-900'
                }`}
              >
                Belakang
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Interactive Container */}
        <div className="p-6 md:p-8 bg-slate-100 flex flex-col items-center">
          <div id="kta-print-area" className="flex flex-wrap items-center justify-center gap-6">
            {/* FRONT SIDE */}
            {(activeSide === 'both' || activeSide === 'front') && (
              <div className="w-[380px] h-[240px] bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl shadow-xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-700 select-none">
                {/* Decorative background guilloche / watermarks */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />

                {/* Card Header */}
                <div className="relative z-10 flex items-start justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/src/assets/images/kta_emblem_logo_1790999224177.jpg"
                      alt="Logo KTA"
                      className="w-9 h-9 rounded-full object-cover border border-amber-400/50 shadow-xs"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">
                        KARTU TANDA ANGGOTA
                      </div>
                      <div className="text-xs font-bold tracking-tight text-white line-clamp-1">
                        {settings.organizationName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-wider text-emerald-400 font-semibold flex items-center justify-end gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>RESMI</span>
                    </div>
                  </div>
                </div>

                {/* Card Middle: Photo + Info + Chip */}
                <div className="relative z-10 flex items-center gap-3.5 my-1">
                  {/* Photo with frame */}
                  <div className="relative shrink-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-16 h-20 object-cover rounded-lg border-2 border-amber-400/80 shadow-md bg-slate-800"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 text-[8px] font-bold px-1 rounded-sm shadow-xs">
                      {member.bloodType || 'A'}
                    </div>
                  </div>

                  {/* Member Details */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="text-sm font-bold text-white tracking-tight truncate">
                      {member.name}
                    </div>
                    <div className="text-[11px] text-amber-300 font-medium truncate mt-0.5">
                      {member.role}
                    </div>
                    <div className="text-[10px] text-slate-300 truncate">
                      {member.division}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400">
                      <div>
                        <span className="block text-[8px] text-slate-400 uppercase">NO. KTA</span>
                        <span className="font-mono text-white font-bold tracking-wide">
                          {member.ktaNumber}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 uppercase">BERLAKU</span>
                        <span className="font-mono text-slate-200">SEUMUR HIDUP</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Real High-Contrast Barcode */}
                <div className="relative z-10 bg-white rounded-md px-2 py-1 flex items-center justify-center shadow-xs">
                  <BarcodeRenderer
                    value={member.ktaNumber}
                    width={1.4}
                    height={28}
                    displayValue={false}
                    margin={0}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* BACK SIDE */}
            {(activeSide === 'both' || activeSide === 'back') && (
              <div className="w-[380px] h-[240px] bg-slate-900 text-slate-100 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden border border-slate-700 select-none">
                {/* Magnetic Stripe */}
                <div className="w-full h-9 bg-neutral-950 border-y border-neutral-800 mt-3" />

                {/* Back Content */}
                <div className="px-4 py-2 flex items-start gap-3 flex-1">
                  {/* Terms & Conditions */}
                  <div className="flex-1 text-[9px] text-slate-300 space-y-1 leading-tight">
                    <p className="font-semibold text-slate-200 uppercase tracking-wider text-[8px]">
                      Ketentuan Kartu Tanda Anggota:
                    </p>
                    <ol className="list-decimal pl-3 space-y-0.5 text-slate-400">
                      <li>Kartu ini adalah tanda pengenal resmi anggota koperasi/lembaga.</li>
                      <li>Wajib dibawa saat jam kerja dan absensi kehadiran.</li>
                      <li>Jika kartu hilang atau rusak, segera hubungi bagian tata usaha.</li>
                    </ol>

                    <div className="pt-2 text-[8px] text-slate-400 border-t border-slate-800">
                      <div>Kontak Darurat: {member.emergencyContact || '0812-3456-7890'}</div>
                      <div className="truncate text-slate-500">{settings.organizationSubtext}</div>
                    </div>
                  </div>

                  {/* QR Code for verification */}
                  <div className="shrink-0 flex flex-col items-center bg-white p-1.5 rounded-lg shadow-sm">
                    <QRCodeRenderer
                      value={`KTA_VERIFY:${member.ktaNumber}:${member.name}`}
                      size={72}
                    />
                    <span className="text-[7px] text-slate-700 font-mono font-bold mt-0.5">
                      VERIFIKASI
                    </span>
                  </div>
                </div>

                {/* Official Signature Area */}
                <div className="px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[8px] text-slate-400 bg-slate-950/50">
                  <div>
                    <span>Diterbitkan: </span>
                    <span className="font-mono text-slate-300">{member.joinDate}</span>
                  </div>
                  <div className="text-right">
                    <span className="italic text-slate-400 font-serif">Pengurus Koperasi</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyKta}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
              <span>{copied ? 'Tersalin!' : `Salin No. KTA (${member.ktaNumber})`}</span>
            </button>
            {onQuickScan && (
              <button
                onClick={() => {
                  onQuickScan(member.ktaNumber);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulasi Absen dengan KTA Ini</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kartu KTA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
