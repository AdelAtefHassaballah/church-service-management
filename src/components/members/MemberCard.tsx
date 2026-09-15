import React from 'react';
import { Member, ServiceGroup, UserProfile } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Badge } from '../common/Badge';
import { 
  Phone, 
  MessageSquare, 
  QrCode, 
  MoreVertical, 
  User, 
  ShieldAlert, 
  Eye, 
  Edit, 
  Trash2 
} from 'lucide-react';

interface MemberCardProps {
  member: Member;
  group?: ServiceGroup;
  servant?: UserProfile;
  onView: (member: Member) => void;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
  onShowQR: (member: Member) => void;
  onSendWhatsApp: (member: Member) => void;
  canEdit?: boolean;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  group,
  servant,
  onView,
  onEdit,
  onDelete,
  onShowQR,
  onSendWhatsApp,
  canEdit = true,
}) => {
  const { language, t } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top Header with Avatar, Names, and Quick Action */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              {member.photo_url ? (
                <img
                  src={member.photo_url}
                  alt={member.full_name}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-500 to-sky-400 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {member.full_name.charAt(0)}
                </div>
              )}
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
              }`} />
            </div>

            <div className="min-w-0">
              <h4 
                onClick={() => onView(member)}
                className="text-sm font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-primary-600 transition-colors"
              >
                {isAr ? member.arabic_name : member.full_name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {isAr ? member.full_name : member.arabic_name}
              </p>
            </div>
          </div>

          <button
            onClick={() => onShowQR(member)}
            className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors"
            title={t('members.viewQR')}
          >
            <QrCode className="w-5 h-5" />
          </button>
        </div>

        {/* Group and Servant Badges */}
        <div className="mt-3 flex flex-wrap gap-1.5 items-center">
          {group && (
            <Badge variant="primary" size="sm">
              {isAr ? group.name_ar : group.name}
            </Badge>
          )}
          {servant && (
            <Badge variant="neutral" size="sm">
              {isAr ? (servant.name_ar || servant.name) : servant.name}
            </Badge>
          )}
        </div>

        {/* Contact details */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{t('members.phone')}:</span>
            <span className="font-mono text-slate-700 dark:text-slate-200" dir="ltr">{member.phone}</span>
          </div>
          {member.confession_father && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{t('members.confessionFather')}:</span>
              <span className="truncate max-w-[140px]">{member.confession_father}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSendWhatsApp(member)}
            className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
            title="WhatsApp"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <a
            href={`tel:${member.phone}`}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            title="Call"
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(member)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors"
          >
            {t('common.view')}
          </button>
          {canEdit && (
            <>
              <button
                onClick={() => onEdit(member)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={t('common.edit')}
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(member)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title={t('common.delete')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
