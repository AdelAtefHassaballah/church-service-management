import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  Bell, 
  Moon, 
  Sun, 
  Languages, 
  Crown,
  ShieldCheck, 
  UserCheck, 
  BookOpen, 
  Users,
  Menu, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { Role } from '../../types';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [showNotifs, setShowNotifs] = useState(false);

  const roleLabels: Record<Role, { title: string; color: string; icon: React.ReactNode }> = {
    super_admin: { 
      title: t('roles.super_admin'), 
      color: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border-amber-300 dark:border-amber-700', 
      icon: <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> 
    },
    admin: { 
      title: t('roles.admin'), 
      color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800', 
      icon: <ShieldCheck className="w-3.5 h-3.5" /> 
    },
    leader: { 
      title: t('roles.leader'), 
      color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800', 
      icon: <UserCheck className="w-3.5 h-3.5" /> 
    },
    servant: { 
      title: t('roles.servant'), 
      color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', 
      icon: <BookOpen className="w-3.5 h-3.5" /> 
    },
    member: { 
      title: t('roles.member'), 
      color: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700', 
      icon: <Users className="w-3.5 h-3.5" /> 
    },
  };

  const currentRoleObj = roleLabels[role] || roleLabels.servant;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left side: Mobile menu toggle + church badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-700 to-primary-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20 font-bold text-lg">
            ✝
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {language === 'ar' ? 'منظومة خدمة الكنيسة' : 'Khedma Hub'}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {language === 'ar' ? 'كنيسة مارمرقس ومارجرجس' : 'St. Mark & St. George Service'}
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Controls (Role Indicator, Language, Theme, Notifications, Profile) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Verified User Role Badge (Read-Only) */}
        <div 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm ${currentRoleObj.color}`}
          title={`Active Role: ${currentRoleObj.title}`}
        >
          {currentRoleObj.icon}
          <span className="hidden md:inline">{currentRoleObj.title}</span>
        </div>

        {/* Language switcher button */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
          title="Switch Language (العربية / English)"
        >
          <Languages className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          <span>{language === 'en' ? 'العربية' : 'EN'}</span>
        </button>

        {/* Theme mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 rtl:-right-auto rtl:-left-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-scaleUp">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{t('common.notifications')}</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-[11px] text-primary-600 hover:underline font-medium"
                  >
                    {t('common.markAllRead')}
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">{t('common.noNotifications')}</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 text-start hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer ${
                        !n.read ? 'bg-primary-50/40 dark:bg-primary-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {language === 'ar' ? n.title_ar : n.title}
                        </p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {language === 'ar' ? n.message_ar : n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile avatar / Sign out */}
        <div className="flex items-center gap-2 pl-2 rtl:pl-0 rtl:pr-2 border-l rtl:border-l-0 rtl:border-r border-slate-200 dark:border-slate-800">
          <div className="relative">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
              alt={user?.name}
              className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
            />
            {role === 'super_admin' && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5">
                <Crown className="w-2 h-2" />
              </span>
            )}
          </div>
          <div className="hidden lg:block text-start">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">
              {language === 'ar' ? (user?.name_ar || user?.name) : user?.name}
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5 capitalize">
              {role === 'super_admin' ? 'Super Admin' : role}
            </p>
          </div>

          <button
            onClick={() => logout()}
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
            title={t('nav.logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
