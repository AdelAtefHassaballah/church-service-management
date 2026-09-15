import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { storage } from '../lib/storage';
import { UserProfile } from '../types';
import { Badge } from '../components/common/Badge';
import { WhatsAppModal } from '../components/common/WhatsAppModal';
import { HeartHandshake, Phone, MessageSquare, Mail, ShieldCheck } from 'lucide-react';

export const ServantsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const profiles = storage.getProfiles();
  const groups = storage.getGroups();
  const [selectedServantForWhatsApp, setSelectedServantForWhatsApp] = useState<UserProfile | null>(null);

  const isAr = language === 'ar';

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <span>{t('nav.servants')}</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Directory of active priests, leaders, and servants
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((profile) => {
          const userGroups = groups.filter(g => profile.group_ids?.includes(g.id));

          return (
            <div
              key={profile.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                      alt={profile.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {isAr ? (profile.name_ar || profile.name) : profile.name}
                      </h3>
                      <Badge
                        variant={profile.role === 'admin' ? 'purple' : profile.role === 'leader' ? 'primary' : 'success'}
                        size="sm"
                        className="mt-0.5"
                      >
                        {t(`roles.${profile.role}`)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Groups list */}
                {userGroups.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {userGroups.map(g => (
                      <Badge key={g.id} variant="neutral" size="sm">
                        {isAr ? g.name_ar : g.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Contact numbers */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-mono font-medium" dir="ltr">{profile.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-medium truncate max-w-[180px]">{profile.email}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedServantForWhatsApp(profile)}
                  className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center gap-1 text-xs font-bold flex-1 justify-center"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* WhatsApp Modal */}
      {selectedServantForWhatsApp && (
        <WhatsAppModal
          isOpen={Boolean(selectedServantForWhatsApp)}
          onClose={() => setSelectedServantForWhatsApp(null)}
          recipientName={isAr ? (selectedServantForWhatsApp.name_ar || selectedServantForWhatsApp.name) : selectedServantForWhatsApp.name}
          recipientPhone={selectedServantForWhatsApp.whatsapp || selectedServantForWhatsApp.phone || ''}
          defaultTemplate="task_reminder"
        />
      )}
    </div>
  );
};
