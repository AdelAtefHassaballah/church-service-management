import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { storage } from '../lib/storage';
import { isSupabaseConfigured } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Settings, Database, Save, RotateCcw, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SettingsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [settings, setSettings] = useState(() => storage.getSettings());
  const [saved, setSaved] = useState(false);

  const isAr = language === 'ar';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveSettings(settings);
    setSaved(true);
    confetti({ particleCount: 30, spread: 50 });
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClearCache = () => {
    if (confirm('Clear local browser cache? Your database data on Supabase remains intact.')) {
      storage.clearAll();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <span>{t('settings.title')}</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('settings.churchProfile')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('settings.churchName')}
                </label>
                <input
                  type="text"
                  value={settings.church_name}
                  onChange={e => setSettings({ ...settings, church_name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('settings.churchNameAr')}
                </label>
                <input
                  type="text"
                  value={settings.church_name_ar}
                  onChange={e => setSettings({ ...settings, church_name_ar: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('settings.weeklyDeadlineDay')}
                </label>
                <select
                  value={settings.weekly_deadline_day}
                  onChange={e => setSettings({ ...settings, weekly_deadline_day: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
                >
                  <option value="thursday">{t('settings.thursday')}</option>
                  <option value="friday">{t('settings.friday')}</option>
                  <option value="saturday">{t('settings.saturday')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('settings.weeklyDeadlineTime')}
                </label>
                <input
                  type="time"
                  value={settings.weekly_deadline_time}
                  onChange={e => setSettings({ ...settings, weekly_deadline_time: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="primary" type="submit" icon={<Save className="w-4 h-4" />}>
                {saved ? t('common.success') : t('settings.saveSettings')}
              </Button>
            </div>
          </form>
        </div>

        {/* Database and Cache Column */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('settings.databaseStatus')}
              </h3>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <Badge variant={isSupabaseConfigured ? 'success' : 'neutral'} size="sm">
                {isSupabaseConfigured ? 'Connected (Production)' : 'Local Storage Mode'}
              </Badge>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isSupabaseConfigured 
                  ? 'Connected live to your Supabase PostgreSQL database with Row Level Security.' 
                  : 'Operating in local offline storage mode. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect cloud database.'}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Clear Local Cache
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Purges cached sessions and local tokens on this browser.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Clear Cache
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
