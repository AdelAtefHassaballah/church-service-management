import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { storage } from '../lib/storage';
import { ShieldAlert, History, Activity } from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const AuditLogsPage: React.FC = () => {
  const { t } = useLanguage();
  const logs = storage.getAuditLogs();

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span>{t('nav.auditLogs')}</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          System activity trail and pastoral record modifications (Admin Only)
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {logs.map((log) => (
            <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" size="sm">
                    {log.action}
                  </Badge>
                  <span className="font-bold text-slate-900 dark:text-white">{log.user_name}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{log.details}</p>
              </div>

              <span className="text-[11px] text-slate-400 font-mono shrink-0">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
