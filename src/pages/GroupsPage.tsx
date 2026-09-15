import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { storage } from '../lib/storage';
import { Badge } from '../components/common/Badge';
import { Layers, Users, HeartHandshake } from 'lucide-react';

export const GroupsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const groups = storage.getGroups();
  const members = storage.getMembers();
  const servants = storage.getProfiles().filter(p => p.role === 'servant');
  const leaders = storage.getProfiles().filter(p => p.role === 'leader');

  const isAr = language === 'ar';

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <span>{t('nav.groups')}</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Service stage groups, leaders, and servants hierarchy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group) => {
          const groupMembers = members.filter(m => m.group_id === group.id);
          const groupServants = servants.filter(s => group.servant_ids.includes(s.id));
          const groupLeaders = leaders.filter(l => group.leader_ids.includes(l.id));

          return (
            <div
              key={group.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isAr ? group.name_ar : group.name}
                  </h3>
                  <Badge variant="primary" size="sm">
                    {groupMembers.length} {t('members.title')}
                  </Badge>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {group.description}
                </p>

                {/* Assigned Leaders & Servants */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold">{t('roles.leader')}:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {groupLeaders.map(l => (
                        <span key={l.id} className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium">
                          {isAr ? (l.name_ar || l.name) : l.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold">{t('roles.servant')}s:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {groupServants.map(s => (
                        <span key={s.id} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                          {isAr ? (s.name_ar || s.name) : s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
