import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  QrCode, 
  BookOpenCheck, 
  CheckSquare, 
  CalendarDays, 
  UserX, 
  BarChart3, 
  FileSpreadsheet, 
  Layers, 
  ShieldAlert, 
  Settings, 
  HeartHandshake,
  Crown,
  KeyRound,
  ShieldCheck,
  UserCog,
  Sparkles,
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpen,
  onCloseMobile,
}) => {
  const { role, user } = useAuth();
  const { t, language } = useLanguage();

  const handleNav = (path: string) => {
    onNavigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  const navItems = [
    { 
      path: '/', 
      label: t('nav.dashboard'), 
      icon: <LayoutDashboard className="w-4 h-4" />, 
      roles: ['super_admin', 'admin', 'leader', 'servant'] 
    },
    { 
      path: '/users', 
      label: t('nav.usersManagement'), 
      icon: <UserCog className="w-4 h-4" />, 
      roles: ['super_admin', 'admin'],
      highlight: true
    },
    { 
      path: '/services', 
      label: t('nav.services'), 
      icon: <Layers className="w-4 h-4" />, 
      roles: ['super_admin', 'admin', 'leader'] 
    },
    { 
      path: '/members', 
      label: t('nav.members'), 
      icon: <Users className="w-4 h-4" />, 
      roles: ['super_admin', 'admin', 'leader', 'servant'] 
    },
    { 
      path: '/attendance', 
      label: t('nav.attendance'), 
      icon: <UserCheck className="w-4 h-4" />, 
      roles: ['super_admin', 'admin', 'leader', 'servant'] 
    },
    { 
      path: '/servant-attendance', 
      label: t('nav.servantAttendance'), 
      icon: <HeartHandshake className="w-4 h-4" />, 
      roles: ['super_admin', 'admin', 'leader'] 
    },
    { 
      path: '/qr-scanner', 
      label: t('nav.qrScanner'), 
      icon: <QrCode className="w-4 h-4" />, 
      roles: ['super_admin', 'admin', 'leader', 'servant'] 
    },
    { 
      path: '/qr-codes', 
      label: t('nav.qrManagement'), 
      icon: <CreditCard className="w-4 h-4" />, 
      roles: ['super_admin', 'admin', 'leader'] 
    },
    { 
      path: '/lessons', 
      label: t('nav.lessons'), 
      icon: <BookOpenCheck className="w-4 h-4" />, 
      roles: ['super_admin', 'admin', 'leader', 'servant'] 
    },
    { 
      path: '/tasks', 
      label: t('nav.tasks'), 
      icon: <CheckSquare className="w-4 h-4" />, 
      roles: ['super_admin', 'admin', 'leader', 'servant'] 
    },
    { 
      path: '/calendar', 
      label: t('nav.calendar'), 
      icon: <CalendarDays className="w-4 h-4" />, 
      roles: ['super_admin', 'admin', 'leader', 'servant'] 
    },
    { 
      path: '/absent', 
      label: t('nav.absentMembers'), 
      icon: <UserX className="w-4 h-4" />, 
      roles: ['super_admin', 'admin', 'leader'] 
    },
    { 
      path: '/analytics', 
      label: t('nav.analytics'), 
      icon: <BarChart3 className="w-4 h-4" />, 
      roles: ['super_admin', 'admin', 'leader'] 
    },
    { 
      path: '/reports', 
      label: t('nav.reports'), 
      icon: <FileSpreadsheet className="w-4 h-4" />, 
      roles: ['super_admin', 'admin', 'leader'] 
    },
    { 
      path: '/audit-logs', 
      label: t('nav.auditLogs'), 
      icon: <ShieldAlert className="w-4 h-4" />, 
      roles: ['super_admin', 'admin'] 
    },
    { 
      path: '/settings', 
      label: t('nav.settings'), 
      icon: <Settings className="w-4 h-4" />, 
      roles: ['super_admin', 'admin'] 
    },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 z-40 w-64 bg-white dark:bg-slate-900 border-r rtl:border-r-0 rtl:border-l border-slate-200/80 dark:border-slate-800/80 flex flex-col transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 rtl:translate-x-full rtl:lg:translate-x-0'
        }`}
      >
        {/* Top Church Identity Banner */}
        <div className="h-16 px-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm ${
              role === 'super_admin' ? 'bg-gradient-to-tr from-amber-500 to-primary-600' : 'bg-gradient-to-tr from-primary-600 to-sky-400'
            }`}>
              {role === 'super_admin' ? '👑' : '✝'}
            </div>
            <div className="leading-tight">
              <span className="font-bold text-sm text-slate-900 dark:text-white block">
                {language === 'ar' ? 'منظومة الخدمة' : 'Khedma Service'}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                role === 'super_admin' ? 'text-amber-600 dark:text-amber-400' : 'text-primary-600 dark:text-primary-400'
              }`}>
                {role === 'super_admin' ? 'Super Admin Mode' : `${role} Mode`}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {language === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'}
          </div>

          {filteredItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/25 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className={`shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                }`}>
                  {item.icon}
                </span>
                <span className="truncate text-start flex-1">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Servant Card */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => handleNav('/profile')}
            className="w-full p-3 rounded-2xl bg-gradient-to-br from-primary-950 to-slate-900 text-white shadow-sm flex items-center gap-3 text-start hover:ring-2 hover:ring-primary-500/50 transition-all group"
          >
            <div className="relative shrink-0">
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                alt={user?.name}
                className="w-9 h-9 rounded-xl object-cover border border-white/20"
              />
              {role === 'super_admin' && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5">
                  <Crown className="w-2 h-2" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate group-hover:text-primary-300 transition-colors">
                {language === 'ar' ? (user?.name_ar || user?.name) : user?.name}
              </p>
              <p className="text-[10px] text-primary-200 truncate capitalize font-medium">
                {role === 'super_admin' ? 'Super Admin' : role}
              </p>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
