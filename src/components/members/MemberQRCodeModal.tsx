import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Member, ServiceGroup } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useLanguage } from '../../context/LanguageContext';
import { Download, Printer, RefreshCw, QrCode, Sparkles } from 'lucide-react';
import { memberService } from '../../services/memberService';

interface MemberQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  group?: ServiceGroup;
  onRegenerated?: (newQR: string) => void;
}

export const MemberQRCodeModal: React.FC<MemberQRCodeModalProps> = ({
  isOpen,
  onClose,
  member,
  group,
  onRegenerated,
}) => {
  const { t, language } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const isAr = language === 'ar';

  if (!member) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const svgElement = document.getElementById(`qr-svg-${member.id}`);
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(img, 20, 20, 360, 360);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `QR_${member.full_name.replace(/\s+/g, '_')}.png`;
        link.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
  };

  const handleRegenerate = () => {
    if (confirm('Regenerate new QR code for this member?')) {
      const newQR = memberService.regenerateQR(member.id);
      if (onRegenerated) onRegenerated(newQR);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <QrCode className="w-5 h-5" />
          <span>{t('members.qrCode')}</span>
        </div>
      }
      subtitle={t('members.subtitle')}
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Printable Card Badge */}
        <div
          ref={cardRef}
          className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-primary-950 text-white shadow-xl text-center border-2 border-primary-500/30 flex flex-col items-center relative overflow-hidden"
        >
          {/* Subtle church cross watermark */}
          <span className="absolute top-2 right-4 text-4xl text-white/5 font-serif select-none pointer-events-none">
            ✝
          </span>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-primary-300">
              {isAr ? 'كنيسة الشهيد مارمرقس ومارجرجس' : 'St. Mark & St. George Church'}
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-white">
            {isAr ? member.arabic_name : member.full_name}
          </h3>
          <p className="text-xs text-primary-200 mt-0.5 font-medium">
            {isAr ? member.full_name : member.arabic_name}
          </p>

          {group && (
            <span className="mt-2 inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-primary-600/50 text-primary-100 border border-primary-400/30">
              {isAr ? group.name_ar : group.name}
            </span>
          )}

          {/* QR Code Container */}
          <div className="mt-5 p-4 bg-white rounded-2xl shadow-md">
            <QRCodeSVG
              id={`qr-svg-${member.id}`}
              value={member.qr_code}
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>

          <p className="mt-4 text-xs font-mono font-bold tracking-widest text-primary-300" dir="ltr">
            {member.qr_code}
          </p>

          <p className="text-[10px] text-slate-400 mt-1">
            {isAr ? 'استخدم هذا الكود لتسجيل الحضور السريع عند الدخول' : 'Scan badge for instant attendance verification'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            icon={<Download className="w-4 h-4" />}
          >
            {t('members.downloadQR')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            icon={<Printer className="w-4 h-4" />}
          >
            {t('members.printQR')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRegenerate}
            icon={<RefreshCw className="w-4 h-4" />}
            className="col-span-2 sm:col-span-1"
          >
            {t('members.regenerateQR')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
