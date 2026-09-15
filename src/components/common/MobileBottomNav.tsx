import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  QrCode, 
  UserCheck, 
  CheckSquare, 
  BookOpenCheck 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface MobileBottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPath,
  onNavigate,
}) => {
  const { t } = useLanguage();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around shadow-lg safe-bottom">
      <button
        onClick={() => onNavigate('/')}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-colors ${
          currentPath === '/'
            ? 'text-primary-600 dark:text-primary-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>{t('nav.dashboard')}</span>
      </button>

      <button
        onClick={() => onNavigate('/members')}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-colors ${
          currentPath === '/members'
            ? 'text-primary-600 dark:text-primary-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Users className="w-5 h-5" />
        <span>{t('nav.members')}</span>
      </button>

      {/* Prominent Center QR Scanner Button */}
      <button
        onClick={() => onNavigate('/qr-scanner')}
        className="flex flex-col items-center -mt-6 group"
      >
        <div className="w-13 h-13 p-3.5 bg-gradient-to-tr from-primary-700 to-primary-500 text-white rounded-2xl shadow-lg shadow-primary-600/30 group-active:scale-95 transition-transform flex items-center justify-center border-2 border-white dark:border-slate-900">
          <QrCode className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 mt-1">
          {t('nav.qrScanner')}
        </span>
      </button>

      <button
        onClick={() => onNavigate('/attendance')}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-colors ${
          currentPath === '/attendance'
            ? 'text-primary-600 dark:text-primary-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <UserCheck className="w-5 h-5" />
        <span>{t('nav.attendance')}</span>
      </button>

      <button
        onClick={() => onNavigate('/lessons')}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-colors ${
          currentPath === '/lessons'
            ? 'text-primary-600 dark:text-primary-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <BookOpenCheck className="w-5 h-5" />
        <span>{t('nav.lessons')}</span>
      </button>
    </div>
  );
};
