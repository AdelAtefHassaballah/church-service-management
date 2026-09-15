import React from 'react';
import { ChurchService, UserProfile } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { 
  Layers, 
  Calendar, 
  Clock, 
  MapPin, 
  UserCheck, 
  BookOpen, 
  Users, 
  BarChart3, 
  UserPlus, 
  Edit3, 
  Sparkles 
} from 'lucide-react';

interface ServiceCardProps {
  service: ChurchService;
  leaders: UserProfile[];
  servantCount: number;
  memberCount: number;
  onOpenDashboard: (service: ChurchService) => void;
  onOpenAssignments: (service: ChurchService) => void;
  onEdit: (service: ChurchService) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  leaders,
  servantCount,
  memberCount,
  onOpenDashboard,
  onOpenAssignments,
  onEdit,
}) => {
  const { t, language } = useLanguage();
  const { role } = useAuth();

  const color = service.color || '#2563eb';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
      
      {/* Top Banner Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-md"
              style={{ backgroundColor: color }}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {language === 'ar' ? service.name_ar : service.name}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'ar' ? service.name : service.name_ar}
              </p>
            </div>
          </div>

          <Badge variant={service.status === 'active' ? 'success' : 'neutral'} size="sm">
            {service.status === 'active' ? t('services.active') : t('services.disabled')}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
          {language === 'ar' 
            ? (service.description_ar || service.description || 'خدمة كنسية روحية ورعوية') 
            : (service.description || service.description_ar || 'Pastoral and spiritual church service')}
        </p>

        {/* Schedule and Location */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
          {service.day_of_week && (
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              <span className="capitalize">{service.day_of_week}</span>
            </div>
          )}
          {service.start_time && (
            <div className="flex items-center gap-1.5 truncate">
              <Clock className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              <span>{service.start_time} - {service.end_time || ''}</span>
            </div>
          )}
          {service.location && (
            <div className="flex items-center gap-1.5 col-span-2 truncate">
              <MapPin className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              <span className="truncate">{service.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Leaders Avatars & Stats */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
        
        {/* Leaders List */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {t('services.leader')}
          </span>
          <div className="flex items-center -space-x-2 rtl:space-x-reverse">
            {leaders.length === 0 ? (
              <span className="text-[11px] text-slate-400 italic">No leader assigned</span>
            ) : (
              leaders.map(ldr => (
                <img
                  key={ldr.id}
                  src={ldr.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                  alt={ldr.name}
                  title={language === 'ar' ? (ldr.name_ar || ldr.name) : ldr.name}
                  className="w-7 h-7 rounded-xl object-cover border-2 border-white dark:border-slate-900 shadow-sm"
                />
              ))
            )}
          </div>
        </div>

        {/* Servants & Members counts */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-center">
          <div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
              {servantCount}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">{t('services.servants')}</p>
          </div>
          <div className="border-l rtl:border-l-0 rtl:border-r border-slate-200 dark:border-slate-700">
            <p className="text-base font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-1">
              <Users className="w-3.5 h-3.5 text-sky-500" />
              {memberCount}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">{t('services.members')}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenDashboard(service)}
            icon={<BarChart3 className="w-3.5 h-3.5" />}
            className="w-full text-[11px]"
          >
            Dashboard
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenAssignments(service)}
            icon={<UserPlus className="w-3.5 h-3.5" />}
            className="w-full text-[11px]"
          >
            Assignments
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(service)}
            icon={<Edit3 className="w-3.5 h-3.5" />}
            className="w-full text-[11px]"
          >
            {t('common.edit')}
          </Button>
        </div>
      </div>
    </div>
  );
};
