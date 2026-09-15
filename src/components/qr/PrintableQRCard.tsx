import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../common/Button';
import { 
  X, 
  Printer, 
  Download, 
  Sparkles, 
  ShieldCheck, 
  UserCheck, 
  BookOpen,
  Cross
} from 'lucide-react';

export interface PrintablePersonData {
  id: string;
  name: string;
  name_ar?: string;
  avatar_url?: string;
  entity_type: 'member' | 'servant';
  qr_code: string;
  service_names: string[];
  phone?: string;
}

interface PrintableQRCardProps {
  person: PrintablePersonData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableQRCard: React.FC<PrintableQRCardProps> = ({
  person,
  isOpen,
  onClose,
}) => {
  const { t, language } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !person) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSVG = () => {
    const svgElement = document.getElementById('qr-svg-badge');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `QR_${person.name.replace(/\s+/g, '_')}_Badge.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const isServant = person.entity_type === 'servant';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-6">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {t('qrSystem.printCard')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Badge Preview Card */}
        <div 
          ref={cardRef}
          id="printable-badge-card"
          className="relative bg-gradient-to-b from-slate-900 via-primary-950 to-slate-950 text-white rounded-3xl p-6 border-2 border-primary-500/40 shadow-xl space-y-5 text-center overflow-hidden"
        >
          {/* Subtle watermark Cross background */}
          <div className="absolute top-2 right-2 text-primary-500/10 text-9xl font-bold select-none pointer-events-none">
            ✝
          </div>

          {/* Header Banner */}
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <div className="flex items-center gap-2 text-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-sky-400 flex items-center justify-center font-bold text-base shadow-sm">
                ✝
              </div>
              <div>
                <p className="text-xs font-extrabold tracking-tight">Khedma Hub</p>
                <p className="text-[10px] text-primary-200">Church Service Ministry</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              isServant ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
            }`}>
              {isServant ? 'Servant Badge' : 'Member Pass'}
            </span>
          </div>

          {/* Person Avatar & Names */}
          <div className="flex flex-col items-center space-y-2">
            <img
              src={person.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={person.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shadow-md ring-4 ring-primary-500/20"
            />
            <div>
              <h4 className="text-base font-extrabold tracking-tight text-white">
                {person.name}
              </h4>
              {person.name_ar && (
                <p className="text-xs text-primary-200 font-bold" dir="rtl">
                  {person.name_ar}
                </p>
              )}
            </div>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-3.5 rounded-2xl inline-block mx-auto shadow-md">
            <QRCodeSVG
              id="qr-svg-badge"
              value={person.qr_code}
              size={140}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* Service & Token Details */}
          <div className="pt-2 border-t border-white/10 space-y-1">
            <p className="text-xs text-slate-300 font-medium truncate">
              {person.service_names?.join(' • ') || 'Church Service'}
            </p>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">
              {person.qr_code}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleDownloadSVG}
          >
            {t('qrSystem.downloadQR')}
          </Button>
          <Button
            variant="gold"
            icon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            {t('qrSystem.printCard')}
          </Button>
        </div>
      </div>
    </div>
  );
};
