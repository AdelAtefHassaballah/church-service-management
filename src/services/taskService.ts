import { Task, TaskPriority, TaskStatus } from '../types';
import { storage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const taskService = {
  getAll: async (): Promise<Task[]> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          const formatted: Task[] = data.map(d => ({
            id: d.id,
            church_id: d.church_id || 'church-1',
            service_id: d.service_id,
            group_id: d.group_id,
            title: d.title,
            title_ar: d.title_ar,
            description: d.description,
            assigned_to: d.assigned_to,
            created_by: d.created_by,
            priority: d.priority,
            status: d.status,
            due_date: d.due_date,
            due_time: d.due_time,
            notes: d.notes,
            related_member_id: d.related_member_id,
            attachments: d.attachments || [],
            created_at: d.created_at,
            updated_at: d.updated_at,
          }));
          // Sync local storage cache
          for (const t of formatted) {
            storage.saveTask(t);
          }
          return formatted;
        }
      } catch (err) {
        console.warn('Failed to fetch tasks from Supabase, falling back to storage:', err);
      }
    }
    return storage.getTasks();
  },

  getByServant: (servantId: string): Task[] => {
    return storage.getTasks().filter(t => t.assigned_to === servantId);
  },

  create: async (taskData: Omit<Task, 'id' | 'created_at' | 'created_by'>): Promise<Task> => {
    const activeUser = storage.getActiveUser();
    const taskId = 'tsk-' + Date.now();
    const newTask: Task = {
      ...taskData,
      id: taskId,
      created_by: activeUser?.id || 'system',
      comments_count: 0,
      created_at: new Date().toISOString(),
    };

    // Save to local storage immediately
    storage.saveTask(newTask);
    storage.logAction('TASK_CREATED', 'task', `Created task "${newTask.title}"`, newTask.id);

    // Trigger in-app notification for assigned user
    storage.addNotification({
      id: 'notif-' + Date.now(),
      user_id: newTask.assigned_to,
      title: 'New Task Assigned',
      title_ar: 'تم إسناد مهمة جديدة لك',
      message: `${activeUser?.name || 'Leader'} assigned you: "${newTask.title}"`,
      message_ar: `قام ${activeUser?.name || 'المشرف'} بإسناد مهمة: "${newTask.title_ar || newTask.title}"`,
      type: 'task_assigned',
      link: '/tasks',
      read: false,
      created_at: new Date().toISOString(),
    });

    // Write to Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('tasks').insert({
          title: newTask.title,
          title_ar: newTask.title_ar,
          description: newTask.description,
          service_id: newTask.service_id || null,
          group_id: newTask.group_id || null,
          assigned_to: newTask.assigned_to,
          created_by: activeUser?.id || null,
          priority: newTask.priority,
          status: newTask.status,
          due_date: newTask.due_date,
          due_time: newTask.due_time || null,
          notes: newTask.notes || null,
          related_member_id: newTask.related_member_id || null,
          attachments: newTask.attachments || [],
        });
      } catch (err) {
        console.error('Supabase task insert error:', err);
      }
    }

    return newTask;
  },

  update: async (taskId: string, updates: Partial<Task>): Promise<Task | null> => {
    const tasks = storage.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;

    const updatedTask: Task = {
      ...task,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    storage.saveTask(updatedTask);
    storage.logAction('TASK_UPDATED', 'task', `Updated task "${updatedTask.title}"`, taskId);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('tasks')
          .update({
            title: updatedTask.title,
            title_ar: updatedTask.title_ar,
            description: updatedTask.description,
            service_id: updatedTask.service_id || null,
            assigned_to: updatedTask.assigned_to,
            priority: updatedTask.priority,
            status: updatedTask.status,
            due_date: updatedTask.due_date,
            due_time: updatedTask.due_time || null,
            notes: updatedTask.notes || null,
            updated_at: updatedTask.updated_at,
          })
          .eq('id', taskId);
      } catch (err) {
        console.error('Supabase task update error:', err);
      }
    }

    return updatedTask;
  },

  updateStatus: async (taskId: string, status: TaskStatus): Promise<Task | null> => {
    return taskService.update(taskId, { status });
  },

  delete: async (taskId: string): Promise<void> => {
    storage.deleteTask(taskId);
    storage.logAction('TASK_DELETED', 'task', `Deleted task ${taskId}`, taskId);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('tasks').delete().eq('id', taskId);
      } catch (err) {
        console.error('Supabase task delete error:', err);
      }
    }
  }
};
