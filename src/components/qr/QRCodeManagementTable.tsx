import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { QRCodeRecord } from '../../types';
import { qrService } from '../../services/qrService';
import { PrintableQRCard, PrintablePersonData } from './PrintableQRCard';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { 
  QrCode, 
  Printer, 
  Download, 
  RefreshCw, 
  Eye, 
  ShieldAlert, 
  Layers, 
  User, 
  BookOpen, 
  CheckCircle2, 
  Slash 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QRCodeManagementTableProps {
  records: Array<{
    qr: QRCodeRecord;
    personName: string;
    personNameAr?: string;
    avatarUrl?: string;
    serviceNames: string[];
  }>;
  onRefresh: () => void;
}

export const QRCodeManagementTable: React.FC<QRCodeManagementTableProps> = ({
  records,
  onRefresh,
}) => {
  const { t, language } = useLanguage();
  const { hasPermission, role } = useAuth();
  const [selectedPerson, setSelectedPerson] = useState<PrintablePersonData | null>(null);

  const handleRegenerate = async (qr: QRCodeRecord, personName: string) => {
    if (window.confirm(t('qrSystem.regenerateConfirm'))) {
      await qrService.regenerateQR(qr.entity_type, qr.entity_id);
      confetti({ particleCount: 30, spread: 50 });
      onRefresh();
    }
  };

  const handleToggleQR = async (qr: QRCodeRecord) => {
    if (qr.status === 'active') {
      await qrService.disableQR(qr.id);
    } else {
      await qrService.enableQR(qr.id);
    }
    onRefresh();
  };

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-start text-xs">
          <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3.5 text-start">{t('qrSystem.personCol')}</th>
              <th className="px-4 py-3.5 text-start">{t('qrSystem.typeCol')}</th>
              <th className="px-4 py-3.5 text-start">{t('qrSystem.serviceCol')}</th>
              <th className="px-4 py-3.5 text-start">Secure QR Payload Token</th>
              <th className="px-4 py-3.5 text-start">{t('qrSystem.statusCol')}</th>
              <th className="px-4 py-3.5 text-end">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              records.map(({ qr, personName, personNameAr, avatarUrl, serviceNames }) => {
                const isServant = qr.entity_type === 'servant';

                return (
                  <tr key={qr.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Person */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                          alt={personName}
                          className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {language === 'ar' ? (personNameAr || personName) : personName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">{qr.entity_id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Entity Type */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {isServant ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <BookOpen className="w-3 h-3 text-emerald-600" />
                          {t('qrSystem.servantType')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          <User className="w-3 h-3 text-sky-600" />
                          {t('qrSystem.memberType')}
                        </span>
                      )}
                    </td>

                    {/* Services */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {serviceNames.map(s => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            <Layers className="w-2.5 h-2.5 text-primary-500" />
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Token payload */}
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {qr.token}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {qr.status === 'active' ? (
                        <Badge variant="success" size="sm">{t('users.active')}</Badge>
                      ) : (
                        <Badge variant="danger" size="sm">{t('users.disabled')}</Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-end whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPerson({
                            id: qr.entity_id,
                            name: personName,
                            name_ar: personNameAr,
                            avatar_url: avatarUrl,
                            entity_type: qr.entity_type === 'member' ? 'member' : 'servant',
                            qr_code: qr.token,
                            service_names: serviceNames,
                          })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/60 dark:hover:bg-primary-900/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t('qrSystem.viewQR')}</span>
                        </button>

                        <button
                          onClick={() => handleRegenerate(qr, personName)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title={t('qrSystem.regenerateQR')}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleQR(qr)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            qr.status === 'active'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title={qr.status === 'active' ? t('qrSystem.disableQR') : t('users.enableAccount')}
                        >
                          {qr.status === 'active' ? <Slash className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Printable QR Card Modal */}
      <PrintableQRCard
        person={selectedPerson}
        isOpen={!!selectedPerson}
        onClose={() => setSelectedPerson(null)}
      />
    </>
  );
};
