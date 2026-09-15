import React from 'react';
import { Task, TaskPriority, TaskStatus, UserProfile } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  ArrowRight,
  MoreVertical,
  Check
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  servant?: UserProfile;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onViewDetails?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  servant,
  onStatusChange,
  onViewDetails,
}) => {
  const { t, language } = useLanguage();
  const { user, role } = useAuth();
  const isAr = language === 'ar';

  const priorityColors: Record<TaskPriority, 'danger' | 'warning' | 'primary' | 'neutral'> = {
    urgent: 'danger',
    high: 'warning',
    medium: 'primary',
    low: 'neutral',
  };

  const isCompleted = task.status === 'completed';
  const isOverdue = task.status === 'overdue' || (!isCompleted && new Date(task.due_date) < new Date());

  return (
    <div className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 hover:shadow-md flex flex-col justify-between group ${
      isCompleted 
        ? 'border-emerald-200 dark:border-emerald-950/80 bg-emerald-50/20 dark:bg-emerald-950/10' 
        : isOverdue 
        ? 'border-rose-200 dark:border-rose-950/80 bg-rose-50/10' 
        : 'border-slate-200/80 dark:border-slate-800'
    }`}>
      <div>
        {/* Top Priority and Due Date */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant={priorityColors[task.priority]} size="sm">
            {t(`tasks.${task.priority}`)}
          </Badge>

          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <Calendar className="w-3.5 h-3.5" />
            <span className={isOverdue && !isCompleted ? 'text-rose-600 font-bold' : ''}>
              {task.due_date}
            </span>
          </div>
        </div>

        {/* Task Title */}
        <h4 className={`text-sm font-bold mt-2.5 line-clamp-2 ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
          {isAr ? (task.title_ar || task.title) : task.title}
        </h4>

        {/* Description snippet */}
        {task.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Footer Servant Info and Quick Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={servant?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
            alt={servant?.name}
            className="w-7 h-7 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
          />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
            {servant ? (isAr ? (servant.name_ar || servant.name) : servant.name) : 'Servant'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {task.status !== 'completed' && (
            <button
              onClick={() => onStatusChange(task.id, 'completed')}
              className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
              title={t('tasks.markCompleted')}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}

          {task.status === 'pending' && (
            <button
              onClick={() => onStatusChange(task.id, 'in_progress')}
              className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
              title={t('tasks.markInProgress')}
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          )}

          {isCompleted && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
