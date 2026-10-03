import React, { useState, useEffect, useRef } from 'react';
import { Member, AttendanceRecord, AttendanceSettings, ScanFeedback } from '../types';
import { soundManager } from '../utils/audio';
import { getTodayDateString, getCurrentTimeString, calculateWorkingHours } from '../utils/storage';
import confetti from 'canvas-confetti';
import {
  Camera,
  CameraOff,
  Barcode,
  Keyboard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Volume2,
  VolumeX,
  UserCheck,
  LogOut,
  LogIn
} from 'lucide-react';

interface ScannerProps {
  members: Member[];
  attendance: AttendanceRecord[];
  settings: AttendanceSettings;
  externalScanTrigger?: string | null;
  onClearExternalScan?: () => void;
  onAttendanceRecorded: (record: AttendanceRecord) => void;
  onOpenKtaModal: (member: Member) => void;
}

export const Scanner: React.FC<ScannerProps> = ({
  members,
  attendance,
  settings,
  externalScanTrigger,
  onClearExternalScan,
  onAttendanceRecorded,
  onOpenKtaModal,
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [scanMode, setScanMode] = useState<'auto' | 'masuk_only' | 'pulang_only'>(settings.scanMode);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.enableSound);
  const [lastFeedback, setLastFeedback] = useState<ScanFeedback | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(getCurrentTimeString());

  // Watch for externalScanTrigger (e.g. from KTA modal or member management)
  useEffect(() => {
    if (externalScanTrigger) {
      processKtaCode(externalScanTrigger, 'barcode_scan');
      if (onClearExternalScan) {
        onClearExternalScan();
      }
    }
  }, [externalScanTrigger]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Hardware barcode scanner buffer (rapid keystrokes ending in Enter)
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  // Update digital clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hardware Barcode Scanner listener (captures rapid input from USB/BT barcode guns)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is focused on an input element other than body or our quick input, don't hijack
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'INPUT' && target !== inputRef.current) {
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= 3) {
          const scannedCode = barcodeBufferRef.current.trim();
          barcodeBufferRef.current = '';
          processKtaCode(scannedCode, 'barcode_scan');
        }
      } else if (e.key.length === 1) {
        // If keys arrive in quick succession (< 60ms) it's almost certainly a hardware barcode reader
        if (timeDiff > 120 && barcodeBufferRef.current.length > 0) {
          barcodeBufferRef.current = ''; // reset on human pause
        }
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [members, attendance, scanMode, soundEnabled, settings]);

  // Camera stream handler
  useEffect(() => {
    if (!cameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      return;
    }

    let isSubscribed = true;

    async function startCamera() {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (!isSubscribed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Start frame analysis loop
        startFrameDetection();
      } catch (err: unknown) {
        console.error('Camera access error:', err);
        setCameraError(
          'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser atau gunakan barcode gun / input manual.'
        );
        setCameraActive(false);
      }
    }

    startCamera();

    return () => {
      isSubscribed = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [cameraActive]);

  // Frame detection using native BarcodeDetector if available
  const startFrameDetection = () => {
    if (!('BarcodeDetector' in window)) {
      // Browser doesn't support native BarcodeDetector; fallback guide is active
      return;
    }

    try {
      // @ts-expect-error - BarcodeDetector is a modern web standard
      const detector = new window.BarcodeDetector({
        formats: ['code_128', 'code_39', 'qr_code', 'ean_13'],
      });

      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue;
            if (rawValue) {
              // Parse out potential prefix if QR contains "KTA_VERIFY:KTA-2026-001:..."
              let code = rawValue;
              if (rawValue.startsWith('KTA_VERIFY:')) {
                const parts = rawValue.split(':');
                if (parts[1]) code = parts[1];
              }
              processKtaCode(code, 'barcode_scan');
            }
          }
        } catch {
          // ignore detection frame drops
        }
      }, 400);
    } catch (e) {
      console.warn('BarcodeDetector initialization skipped:', e);
    }
  };

  // Main attendance processor
  const processKtaCode = (rawCode: string, method: 'barcode_scan' | 'qr_scan' | 'manual') => {
    const cleanedCode = rawCode.trim().toUpperCase();
    if (!cleanedCode) return;

    // Find member by KTA number (or email/id fallback)
    const member = members.find(
      (m) =>
        m.ktaNumber.toUpperCase() === cleanedCode ||
        m.ktaNumber.toUpperCase() === `KTA-${cleanedCode}` ||
        m.id.toLowerCase() === cleanedCode.toLowerCase()
    );

    const now = new Date();
    const today = getTodayDateString();
    const currentTimeStr = getCurrentTimeString();

    if (!member) {
      soundManager.playWarningBeep(soundEnabled);
      setLastFeedback({
        type: 'error',
        message: `KTA tidak terdaftar: "${rawCode}". Pastikan kartu telah terdaftar di database anggota.`,
        timestamp: currentTimeStr,
      });
      return;
    }

    // Check existing attendance for today
    const existingRecord = attendance.find(
      (att) => att.memberId === member.id && att.date === today
    );

    // Determine action: Masuk or Pulang
    let actionType: 'masuk' | 'pulang' = 'masuk';
    if (scanMode === 'masuk_only') {
      actionType = 'masuk';
    } else if (scanMode === 'pulang_only') {
      actionType = 'pulang';
    } else {
      // Auto mode:
      if (!existingRecord) {
        actionType = 'masuk';
      } else if (existingRecord && !existingRecord.checkOutTime) {
        actionType = 'pulang';
      } else {
        // Already checked out today
        soundManager.playWarningBeep(soundEnabled);
        setLastFeedback({
          type: 'warning',
          member,
          record: existingRecord,
          message: `${member.name} sudah melakukan absensi masuk & pulang hari ini.`,
          timestamp: currentTimeStr,
        });
        return;
      }
    }

    if (actionType === 'masuk') {
      if (existingRecord) {
        soundManager.playWarningBeep(soundEnabled);
        setLastFeedback({
          type: 'warning',
          member,
          record: existingRecord,
          message: `${member.name} sudah tercatat hadir masuk pada jam ${existingRecord.checkInTime}.`,
          timestamp: currentTimeStr,
        });
        return;
      }

      // Check punctuality against settings
      const [startHour, startMin] = settings.workStartTime.split(':').map(Number);
      const thresholdMinutes = (startHour * 60) + startMin + (settings.lateThresholdMinutes || 0);

      const [currentHour, currentMin] = currentTimeStr.split(':').map(Number);
      const currentTotalMinutes = (currentHour * 60) + currentMin;

      const isLate = currentTotalMinutes > thresholdMinutes;
      const status = isLate ? 'terlambat' : 'tepat_waktu';

      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        memberId: member.id,
        ktaNumber: member.ktaNumber,
        memberName: member.name,
        role: member.role,
        division: member.division,
        avatar: member.avatar,
        date: today,
        checkInTime: currentTimeStr,
        checkOutTime: null,
        status,
        method,
        notes: isLate
          ? `Terlambat ${currentTotalMinutes - thresholdMinutes} menit dari jadwal`
          : 'Presensi KTA tepat waktu',
      };

      onAttendanceRecorded(newRecord);
      soundManager.playBarcodeBeep(soundEnabled);

      if (!isLate) {
        // Pleasant confetti burst
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b'],
        });
      }

      setLastFeedback({
        type: 'success',
        action: 'masuk',
        member,
        record: newRecord,
        message: `Presensi Masuk Berhasil: ${member.name} (${status === 'tepat_waktu' ? 'Tepat Waktu' : 'Terlambat'})`,
        timestamp: currentTimeStr,
      });
    } else {
      // Pulang (Clock out)
      if (!existingRecord) {
        soundManager.playWarningBeep(soundEnabled);
        setLastFeedback({
          type: 'warning',
          member,
          message: `${member.name} belum tercatat absen masuk hari ini. Silakan catat presensi masuk terlebih dahulu.`,
          timestamp: currentTimeStr,
        });
        return;
      }

      if (existingRecord.checkOutTime) {
        soundManager.playWarningBeep(soundEnabled);
        setLastFeedback({
          type: 'warning',
          member,
          record: existingRecord,
          message: `${member.name} sudah melakukan absensi pulang pada jam ${existingRecord.checkOutTime}.`,
          timestamp: currentTimeStr,
        });
        return;
      }

      const workingHours = calculateWorkingHours(existingRecord.checkInTime, currentTimeStr);
      const updatedRecord: AttendanceRecord = {
        ...existingRecord,
        checkOutTime: currentTimeStr,
        workingHours,
        notes: `${existingRecord.notes || ''} · Pulang jam ${currentTimeStr} (Total: ${workingHours})`.trim(),
      };

      onAttendanceRecorded(updatedRecord);
      soundManager.playClockOutBeep(soundEnabled);

      setLastFeedback({
        type: 'success',
        action: 'pulang',
        member,
        record: updatedRecord,
        message: `Presensi Pulang Berhasil: ${member.name}. Total durasi kerja: ${workingHours}`,
        timestamp: currentTimeStr,
      });
    }

    setManualInput('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      processKtaCode(manualInput.trim(), 'manual');
    }
  };

  // Recent attendance entries for today
  const todayRecords = attendance
    .filter((r) => r.date === getTodayDateString())
    .sort((a, b) => b.checkInTime.localeCompare(a.checkInTime));

  return (
    <div className="space-y-6">
      {/* Real-time Status Banner & Mode Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white shadow-xs">
            <Barcode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Mesin Pemindai KTA Barcode
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Siap Memindai
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mendukung Barcode Gun (USB/Bluetooth), Kamera Webcam, dan Input Cepat
            </p>
          </div>
        </div>

        {/* Live Clock & Mode Switcher */}
        <div className="flex items-center gap-3">
          {/* Digital Clock */}
          <div className="text-right px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="block text-[10px] uppercase font-semibold text-slate-500">
              WAKTU SERVER
            </span>
            <span className="font-mono text-base font-bold text-slate-900 tabular-nums">
              {currentTime} <span className="text-xs font-normal text-slate-500">WIB</span>
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}
            title={soundEnabled ? 'Suara Pemindai Aktif' : 'Suara Dimatikan'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Scanner Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scanner Viewport & Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden">
            {/* Mode selection buttons */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700 text-xs">
                <button
                  onClick={() => setScanMode('auto')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    scanMode === 'auto'
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Otomatis (Masuk/Pulang)
                </button>
                <button
                  onClick={() => setScanMode('masuk_only')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    scanMode === 'masuk_only'
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Hanya Masuk
                </button>
                <button
                  onClick={() => setScanMode('pulang_only')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    scanMode === 'pulang_only'
                      ? 'bg-amber-400 text-slate-950 font-semibold shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Hanya Pulang
                </button>
              </div>

              {/* Camera activate button */}
              <button
                onClick={() => setCameraActive(!cameraActive)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  cameraActive
                    ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                }`}
              >
                {cameraActive ? (
                  <>
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Tutup Kamera</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Buka Kamera Scan</span>
                  </>
                )}
              </button>
            </div>

            {/* Video / Visual Laser Scanner Viewport */}
            <div className="relative aspect-16/10 rounded-xl bg-slate-950 border-2 border-slate-700/80 overflow-hidden flex flex-col items-center justify-center">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Laser Scan Guide Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    {/* Viewfinder Target Box */}
                    <div className="w-64 h-36 border-2 border-emerald-400/90 rounded-xl relative shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                      {/* Corner Target Accents */}
                      <span className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400" />
                      <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400" />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400" />

                      {/* Moving Red/Emerald Laser Line */}
                      <div className="absolute inset-x-2 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-bounce" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded mt-3 backdrop-blur-xs">
                      Arahkan barcode atau QR pada KTA ke dalam kotak
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center max-w-sm">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-emerald-400 mb-3 border border-slate-700">
                    <Barcode className="w-9 h-9" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    Scanner Barcode Siap Menerima Scan
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Arahkan barcode scanner fisik (USB/Wireless) ke KTA, atau aktifkan kamera webcam di atas.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                    <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mode Hardware Scanner selalu aktif di latar belakang</span>
                  </div>
                </div>
              )}

              {/* Hidden canvas for video processing */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {cameraError && (
              <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Manual input & barcode gun input fallback */}
            <form onSubmit={handleManualSubmit} className="mt-4">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Ketik / Tempel Kode KTA Manual (Atau Scan langsung dengan Barcode Gun):
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Contoh: KTA-2026-001"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualInput.trim()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-lg transition-colors shadow-xs"
                >
                  Proses Absen
                </button>
              </div>
            </form>
          </div>

          {/* Quick Simulation Bar for Easy Testing */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Simulasi Scan Cepat KTA (Klik untuk uji coba scan langsung)
              </span>
              <span className="text-[11px] text-slate-400">{members.length} Anggota Siap</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {members.slice(0, 6).map((m) => {
                const isTodayAttended = attendance.some(
                  (a) => a.memberId === m.id && a.date === getTodayDateString()
                );
                return (
                  <button
                    key={m.id}
                    onClick={() => processKtaCode(m.ktaNumber, 'barcode_scan')}
                    className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group"
                  >
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-slate-900 truncate group-hover:text-emerald-700">
                        {m.name.split(' ')[0]} {m.name.split(' ')[1] || ''}
                      </div>
                      <div className="font-mono text-[9px] text-slate-500 truncate">
                        {m.ktaNumber}
                      </div>
                    </div>
                    {isTodayAttended && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Sudah Absen" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Scan Result Feedback & Today's Live Attendance Feed (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Latest Scan Live Result Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Hasil Scan Terakhir
            </h2>

            {lastFeedback ? (
              <div
                className={`p-4 rounded-xl border transition-all ${
                  lastFeedback.type === 'success'
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : lastFeedback.type === 'warning'
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-rose-50/70 border-rose-200'
                }`}
              >
                {lastFeedback.member ? (
                  <div className="flex items-start gap-3.5">
                    <img
                      src={lastFeedback.member.avatar}
                      alt={lastFeedback.member.name}
                      className="w-14 h-16 rounded-lg object-cover border-2 border-white shadow-sm shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-700 font-bold border border-slate-200">
                          {lastFeedback.member.ktaNumber}
                        </span>
                        {lastFeedback.action === 'masuk' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                            <LogIn className="w-3 h-3" /> MASUK
                          </span>
                        ) : lastFeedback.action === 'pulang' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded">
                            <LogOut className="w-3 h-3" /> PULANG
                          </span>
                        ) : null}
                      </div>

                      <div className="text-sm font-bold text-slate-900 mt-1 truncate">
                        {lastFeedback.member.name}
                      </div>
                      <div className="text-xs text-slate-600 truncate">
                        {lastFeedback.member.role}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {lastFeedback.member.division}
                      </div>

                      <div className="mt-2 text-xs font-semibold text-slate-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Pukul {lastFeedback.timestamp} WIB</span>
                        {lastFeedback.record?.workingHours && (
                          <span className="text-indigo-600 font-mono text-[11px] ml-1">
                            (Durasi: {lastFeedback.record.workingHours})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-xs text-rose-700 font-medium">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                    <span>{lastFeedback.message}</span>
                  </div>
                )}

                {/* Subtext description */}
                {lastFeedback.member && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
                    <span>{lastFeedback.message}</span>
                    <button
                      onClick={() => onOpenKtaModal(lastFeedback.member!)}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold text-[11px] hover:underline"
                    >
                      Lihat Kartu KTA →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <Barcode className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">
                  Belum ada data scan pada sesi ini
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Scan barcode kartu KTA untuk memunculkan profil dan absensi
                </p>
              </div>
            )}
          </div>

          {/* Today's Live Attendance Feed */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Aktivitas Presensi Hari Ini
                </h3>
                <span className="text-xs text-slate-400">
                  {todayRecords.length} Anggota telah melakukan absensi
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {todayRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada catatan presensi hari ini
                </div>
              ) : (
                todayRecords.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.avatar}
                        alt={item.memberName}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {item.memberName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          {item.ktaNumber} · {item.division.split(' ')[0]}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs font-bold text-slate-800 tabular-nums">
                        {item.checkInTime}
                        {item.checkOutTime && (
                          <span className="text-slate-400 font-normal"> - {item.checkOutTime}</span>
                        )}
                      </div>
                      <span
                        className={`text-[9px] font-medium px-1.5 py-0.2 rounded inline-block ${
                          item.status === 'tepat_waktu'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {item.status === 'tepat_waktu' ? 'Tepat Waktu' : 'Terlambat'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
