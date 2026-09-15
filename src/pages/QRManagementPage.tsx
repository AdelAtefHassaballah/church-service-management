import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { QRCodeRecord, Member, UserProfile } from '../types';
import { qrService } from '../services/qrService';
import { memberService } from '../services/memberService';
import { userService } from '../services/userService';
import { serviceService } from '../services/serviceService';
import { QRCodeManagementTable } from '../components/qr/QRCodeManagementTable';
import { PrintableQRCard, PrintablePersonData } from '../components/qr/PrintableQRCard';
import { Button } from '../components/common/Button';
import { 
  QrCode, 
  Printer, 
  Search, 
  User, 
  BookOpen, 
  Sparkles,
  Layers,
  RefreshCw
} from 'lucide-react';

export const QRManagementPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { role } = useAuth();

  const [filterType, setFilterType] = useState<'all' | 'member' | 'servant'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<Array<{
    qr: QRCodeRecord;
    personName: string;
    personNameAr?: string;
    avatarUrl?: string;
    serviceNames: string[];
  }>>([]);

  const loadData = () => {
    const allQRs = qrService.getAll();
    const members = memberService.getAll();
    const users = userService.getAll();
    const services = serviceService.getAll();

    const serviceMap = new Map<string, string>();
    services.forEach(s => serviceMap.set(s.id, language === 'ar' ? s.name_ar : s.name));

    const combined = allQRs.map(qr => {
      let personName = 'Unknown';
      let personNameAr: string | undefined;
      let avatarUrl: string | undefined;
      let srvNames: string[] = [];

      if (qr.entity_type === 'member') {
        const m = members.find(mem => mem.id === qr.entity_id);
        if (m) {
          personName = m.full_name;
          personNameAr = m.arabic_name;
          avatarUrl = m.photo_url;
          srvNames = m.service_ids?.map(id => serviceMap.get(id) || id) || [];
        }
      } else {
        const u = users.find(usr => usr.id === qr.entity_id);
        if (u) {
          personName = u.name;
          personNameAr = u.name_ar;
          avatarUrl = u.avatar_url;
          srvNames = u.service_ids?.map(id => serviceMap.get(id) || id) || [];
        }
      }

      return {
        qr,
        personName,
        personNameAr,
        avatarUrl,
        serviceNames: srvNames.length > 0 ? srvNames : ['General Service'],
      };
    });

    setRecords(combined);
  };

  useEffect(() => {
    loadData();
  }, [language]);

  const filteredRecords = records.filter(r => {
    if (filterType !== 'all' && r.qr.entity_type !== filterType) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.personName.toLowerCase().includes(q) ||
      (r.personNameAr && r.personNameAr.includes(q)) ||
      r.qr.token.toLowerCase().includes(q)
    );
  });

  const memberQRCount = records.filter(r => r.qr.entity_type === 'member').length;
  const servantQRCount = records.filter(r => r.qr.entity_type === 'servant').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-primary-600 flex items-center justify-center text-white font-bold shadow-md shadow-sky-500/20">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              {t('qrSystem.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('qrSystem.subtitle')}
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={loadData}
        >
          Refresh All
        </Button>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{records.length}</p>
            <p className="text-[11px] text-slate-400 font-medium">Total QR Cards</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{memberQRCount}</p>
            <p className="text-[11px] text-slate-400 font-medium">{t('qrSystem.memberType')}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{servantQRCount}</p>
            <p className="text-[11px] text-slate-400 font-medium">{t('qrSystem.servantType')}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          {[
            { key: 'all', label: t('common.all') },
            { key: 'member', label: `${t('qrSystem.memberType')} (${memberQRCount})` },
            { key: 'servant', label: `${t('qrSystem.servantType')} (${servantQRCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === tab.key
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <QRCodeManagementTable
        records={filteredRecords}
        onRefresh={loadData}
      />
    </div>
  );
};
