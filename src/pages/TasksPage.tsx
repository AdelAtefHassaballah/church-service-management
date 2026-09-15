import React, { useState } from 'react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { storage } from '../lib/storage';
import { taskService } from '../services/taskService';
import { TaskCard } from '../components/tasks/TaskCard';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { CheckSquare, Plus, Filter, Search } from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { role, user } = useAuth();
  const services = storage.getServices();
  const profiles = storage.getProfiles();
  const servants = profiles.filter(p => p.role === 'servant');

  const [tasks, setTasks] = useState<Task[]>(() => storage.getTasks());
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const isAr = language === 'ar';
  const canCreate = role === 'super_admin' || role === 'admin' || role === 'leader';

  const refreshTasks = async () => {
    const list = await taskService.getAll();
    setTasks(list);
  };

  React.useEffect(() => {
    refreshTasks();
  }, []);

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await taskService.updateStatus(taskId, status);
    refreshTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذه المهمة؟' : 'Delete this task?')) {
      await taskService.delete(taskId);
      refreshTasks();
    }
  };

  let filteredTasks = tasks.filter(t => {
    if (role === 'servant' && t.assigned_to !== user?.id) {
      // Servants see primarily their own tasks
      return false;
    }
    if (selectedService !== 'all' && t.service_id !== selectedService) return false;
    if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
    if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;
    if (selectedUser !== 'all' && t.assigned_to !== selectedUser) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q) || (t.title_ar && t.title_ar.includes(q));
      const matchDesc = t.description && t.description.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Header & Create Button */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span>{t('tasks.title')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('tasks.subtitle')} ({filteredTasks.length} {isAr ? 'مهمة' : 'tasks'})
          </p>
        </div>

        {canCreate && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            {t('tasks.createTask')}
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-2.5 left-3 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Service Filter */}
        <select
          value={selectedService}
          onChange={e => setSelectedService(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
        >
          <option value="all">All Services / Ministries</option>
          {services.map(s => (
            <option key={s.id} value={s.id}>
              {isAr ? s.name_ar : s.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
        >
          <option value="all">{t('common.all')} Statuses</option>
          <option value="pending">{t('tasks.pending')}</option>
          <option value="in_progress">{t('tasks.inProgress')}</option>
          <option value="completed">{t('tasks.completed')}</option>
          <option value="cancelled">Cancelled</option>
          <option value="overdue">{t('tasks.overdue')}</option>
        </select>

        {/* Priority Filter */}
        <select
          value={selectedPriority}
          onChange={e => setSelectedPriority(e.target.value)}
          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
        >
          <option value="all">{t('common.all')} Priorities</option>
          <option value="urgent">{t('tasks.urgent')}</option>
          <option value="high">{t('tasks.high')}</option>
          <option value="medium">{t('tasks.medium')}</option>
          <option value="low">{t('tasks.low')}</option>
        </select>

        {/* Assigned User Filter */}
        {role !== 'servant' && (
          <select
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
          >
            <option value="all">All Assigned Users</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {isAr ? (p.name_ar || p.name) : p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800">
          <EmptyState
            icon={<CheckSquare className="w-8 h-8 text-slate-400" />}
            title="No tasks found."
            description="No pastoral tasks created yet or matching the filters."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              servant={profiles.find(s => s.id === task.assigned_to)}
              onStatusChange={handleStatusChange}
              onDelete={canCreate ? handleDeleteTask : undefined}
            />
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={refreshTasks}
      />
    </div>
  );
};


