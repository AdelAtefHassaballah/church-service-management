import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Member, UserProfile, ChurchService } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../lib/storage';
import { qrService } from '../../services/qrService';
import { attendanceService } from '../../services/attendanceService';
import { servantAttendanceService } from '../../services/servantAttendanceService';
import { serviceService } from '../../services/serviceService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  AlertTriangle, 
  QrCode, 
  Sparkles, 
  UserCheck, 
  RefreshCw,
  Zap,
  BookOpen,
  User,
  ShieldAlert,
  Layers,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QRScannerViewProps {
  onScanSuccess?: (entity: Member | UserProfile) => void;
}

export const QRScannerView: React.FC<QRScannerViewProps> = ({ onScanSuccess }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  const services = serviceService.getAll();
  const members = storage.getMembers();
  const users = storage.getProfiles();

  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || 'srv-prep');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<{
    entityType: 'member' | 'servant';
    person: Member | UserProfile;
    serviceMismatch?: boolean;
    qrToken: string;
  } | null>(null);

  const [scanResult, setScanResult] = useState<{
    status: 'success' | 'duplicate' | 'error' | 'mismatch';
    message: string;
    details?: string;
  } | null>(null);

  const [continuousMode, setContinuousMode] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isAr = language === 'ar';
  const today = new Date().toISOString().split('T')[0];

  const handleProcessQRCode = async (qrText: string) => {
    const trimmed = qrText.trim();
    const parsed = qrService.parseQR(trimmed);

    if (!parsed) {
      setScanResult({
        status: 'error',
        message: t('qrScanner.invalidQR'),
        details: trimmed,
      });
      return;
    }

    if (parsed.entityType === 'member') {
      const member = members.find(m => m.id === parsed.entityId || m.qr_code === trimmed);
      if (!member) {
        setScanResult({
          status: 'error',
          message: t('qrScanner.invalidQR'),
        });
        return;
      }

      // Check service enrollment
      const belongsToService = qrService.verifyServiceEnrollment(member.id, selectedServiceId, 'member');

      if (!belongsToService) {
        setLastScanned({
          entityType: 'member',
          person: member,
          serviceMismatch: true,
          qrToken: trimmed,
        });
        setScanResult({
          status: 'mismatch',
          message: `${isAr ? member.arabic_name : member.full_name}`,
          details: t('qrSystem.serviceMismatchWarning'),
        });
        return;
      }

      // Record member attendance
      recordMemberAttendance(member);
    } else {
      // Servant scanned!
      const servant = users.find(u => u.id === parsed.entityId || u.qr_code === trimmed);
      if (!servant) {
        setScanResult({
          status: 'error',
          message: t('qrScanner.invalidQR'),
        });
        return;
      }

      // Record servant check-in
      recordServantAttendance(servant);
    }
  };

  const recordMemberAttendance = (member: Member) => {
    const existing = storage.getAttendance().find(
      r => r.member_id === member.id && r.date === today
    );

    setLastScanned({
      entityType: 'member',
      person: member,
      qrToken: member.qr_code,
    });

    if (existing && existing.status === 'present') {
      setScanResult({
        status: 'duplicate',
        message: `${isAr ? member.arabic_name : member.full_name}`,
        details: t('qrScanner.alreadyMarked'),
      });
    } else {
      attendanceService.saveRecord(
        member.id,
        member.group_id || 'grp-1',
        today,
        'present',
        user?.id || 'admin',
        'qr_scan',
        'Marked via Universal QR Scanner'
      );

      setScanResult({
        status: 'success',
        message: `${isAr ? member.arabic_name : member.full_name}`,
        details: `${t('attendance.present')} ✓ (${t('qrSystem.memberCheckedIn')})`,
      });

      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      if (onScanSuccess) onScanSuccess(member);
    }
  };

  const recordServantAttendance = (servant: UserProfile) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    servantAttendanceService.saveRecord({
      church_id: 'church-1',
      service_id: selectedServiceId,
      servant_id: servant.id,
      date: today,
      status: 'present',
      check_in_time: nowTime,
      recorded_by: user?.id || 'admin',
      method: 'qr_scan',
      notes: 'Checked in via Universal QR Badge',
    });

    setLastScanned({
      entityType: 'servant',
      person: servant,
      qrToken: servant.qr_code,
    });

    setScanResult({
      status: 'success',
      message: `${isAr ? (servant.name_ar || servant.name) : servant.name}`,
      details: `${t('qrSystem.servantCheckedIn')} (${nowTime})`,
    });

    confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
    if (onScanSuccess) onScanSuccess(servant);
  };

  const handleEnrollAndMark = () => {
    if (!lastScanned || lastScanned.entityType !== 'member') return;
    const member = lastScanned.person as Member;
    serviceService.assignMember(selectedServiceId, member.id);
    recordMemberAttendance(member);
  };

  const handleMarkAnyway = () => {
    if (!lastScanned || lastScanned.entityType !== 'member') return;
    const member = lastScanned.person as Member;
    recordMemberAttendance(member);
  };

  const startCamera = async () => {
    setCameraError(null);
    setScanResult(null);

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-container');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleProcessQRCode(decodedText);
          if (!continuousMode) {
            stopCamera();
          }
        },
        () => {}
      );

      setIsScanning(true);
    } catch (err: any) {
      console.warn('Camera start issue:', err);
      setCameraError(err?.message || 'Unable to access camera. Please check browser permissions.');
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Scanner Control Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span>{t('qrScanner.title')}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('qrSystem.scannerSubtitle')}
          </p>
        </div>

        {/* Selected Service Scope */}
        <div className="flex items-center gap-2.5">
          <select
            value={selectedServiceId}
            onChange={e => setSelectedServiceId(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {language === 'ar' ? s.name_ar : s.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              checked={continuousMode}
              onChange={e => setContinuousMode(e.target.checked)}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="hidden sm:inline">{t('qrScanner.continuousMode')}</span>
          </label>

          {isScanning ? (
            <Button
              variant="danger"
              size="sm"
              onClick={stopCamera}
              icon={<CameraOff className="w-4 h-4" />}
            >
              {t('qrScanner.stopScanning')}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={startCamera}
              icon={<Camera className="w-4 h-4" />}
            >
              {t('qrScanner.startScanning')}
            </Button>
          )}
        </div>
      </div>

      {/* Main Viewfinder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Camera Scanner Container */}
        <div className="lg:col-span-7 bg-slate-950 rounded-3xl p-4 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden shadow-xl border border-slate-800">
          <div
            id="qr-reader-container"
            className="w-full max-w-[320px] rounded-2xl overflow-hidden aspect-square"
          />

          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-primary-950/60 text-primary-400 border border-primary-800/50 flex items-center justify-center shadow-lg shadow-primary-900/40">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{t('qrScanner.title')}</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">{t('qrScanner.cameraPermission')}</p>
              </div>
              <Button variant="primary" size="md" onClick={startCamera} icon={<Camera className="w-4 h-4" />}>
                {t('qrScanner.startScanning')}
              </Button>
            </div>
          )}

          {cameraError && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>

        {/* Right: Instant Result Card & Quick Demo Simulation */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Result Alert Card */}
          {scanResult ? (
            <div className={`p-5 rounded-3xl border shadow-lg animate-scaleUp ${
              scanResult.status === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                : scanResult.status === 'duplicate'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                : scanResult.status === 'mismatch'
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-100'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
            }`}>
              <div className="flex items-start gap-3">
                {scanResult.status === 'success' ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-7 h-7 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-extrabold truncate">{scanResult.message}</h4>
                    {lastScanned && (
                      <Badge variant={lastScanned.entityType === 'servant' ? 'success' : 'primary'} size="sm">
                        {lastScanned.entityType === 'servant' ? 'Servant' : 'Member'}
                      </Badge>
                    )}
                  </div>
                  {scanResult.details && (
                    <p className="text-xs mt-1 font-medium opacity-90">{scanResult.details}</p>
                  )}

                  {/* Requirement #22: Service Mismatch Options */}
                  {scanResult.status === 'mismatch' && (
                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={handleEnrollAndMark}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-sm"
                      >
                        {t('qrSystem.addToServiceAndMark')}
                      </button>
                      <button
                        onClick={handleMarkAnyway}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 text-xs font-bold transition-colors"
                      >
                        {t('qrSystem.markAnyway')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center py-8">
              <QrCode className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {isAr ? 'في انتظار مسح كود المخدوم أو الخادم...' : 'Awaiting Member or Servant Badge...'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {isAr ? 'وجه الكاميرا نحو باركود كارنيه المخدوم أو الخادم' : 'Point camera toward attendee QR card'}
              </p>
            </div>
          )}

          {/* Manual Token Scan/Search (For Handheld USB Barcode Scanners or Manual Fallback) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                {isAr ? 'إدخال الباركود يدوياً أو عبر ماسح USB' : 'Manual Badge / USB Scanner Entry'}
              </h5>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAr ? 'إذا كنت تستخدم ماسحاً خارجياً أو تريد البحث برمز الكارنيه:' : 'Type or scan badge token code directly:'}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = (e.currentTarget.elements.namedItem('manualToken') as HTMLInputElement).value;
                if (input.trim()) {
                  handleProcessQRCode(input.trim());
                  (e.currentTarget.elements.namedItem('manualToken') as HTMLInputElement).value = '';
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                name="manualToken"
                placeholder="e.g. member:xxx or servant:xxx"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button variant="primary" size="sm" type="submit">
                {isAr ? 'تسجيل' : 'Submit'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
