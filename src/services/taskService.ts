import { Task, TaskPriority, TaskStatus } from '../types';
import { storage } from '../lib/storage';

export const taskService = {
  getAll: (): Task[] => {
    return storage.getTasks();
  },

  getByServant: (servantId: string): Task[] => {
    return storage.getTasks().filter(t => t.assigned_to === servantId);
  },

  create: (taskData: Omit<Task, 'id' | 'created_at' | 'created_by'>): Task => {
    const activeUser = storage.getActiveUser();
    const newTask: Task = {
      ...taskData,
      id: 'tsk-' + Date.now(),
      created_by: activeUser?.id || 'system',
      comments_count: 0,
      created_at: new Date().toISOString(),
    };
    storage.saveTask(newTask);
    storage.logAction('TASK_CREATED', 'task', `Created task "${newTask.title}" for servant`, newTask.id);

    // Also trigger in-app notification for assigned servant
    const assignee = storage.getProfiles().find(p => p.id === newTask.assigned_to);
    storage.addNotification({
      id: 'notif-' + Date.now(),
      user_id: newTask.assigned_to,
      title: 'New Task Assigned',
      title_ar: 'تم إسناد مهمة جديدة لك',
      message: `${activeUser?.name || 'Leader'} assigned you: "${newTask.title}"`,
      message_ar: `قام ${activeUser?.name || 'الخادم المسؤول'} بإسناد مهمة: "${newTask.title_ar || newTask.title}"`,
      type: 'task_assigned',
      link: '/tasks',
      read: false,
      created_at: new Date().toISOString(),
    });

    return newTask;
  },

  updateStatus: (taskId: string, status: TaskStatus): Task | null => {
    const tasks = storage.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;
    task.status = status;
    task.updated_at = new Date().toISOString();
    storage.saveTask(task);
    storage.logAction('TASK_STATUS_UPDATED', 'task', `Updated task status to ${status} for "${task.title}"`, taskId);
    return task;
  },

  delete: (taskId: string) => {
    storage.deleteTask(taskId);
    storage.logAction('TASK_DELETED', 'task', `Deleted task ${taskId}`, taskId);
  }
};
