import { Task, TaskPriority, TaskStatus } from '../types';
import { storage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateUUID, sanitizeUUID } from '../lib/uuid';
import { churchService } from './churchService';

export const taskService = {
  getAll: async (): Promise<Task[]> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const activeChurchId = await churchService.getActiveChurchId();
          const formatted: Task[] = data.map((d: any) => ({
            id: d.id,
            church_id: sanitizeUUID(d.church_id) || activeChurchId,
            service_id: sanitizeUUID(d.service_id) || undefined,
            group_id: d.group_id || undefined,
            title: d.title,
            title_ar: d.title_ar || undefined,
            description: d.description || undefined,
            assigned_to: d.assigned_to,
            created_by: sanitizeUUID(d.created_by) || undefined,
            priority: d.priority || 'medium',
            status: d.status || 'pending',
            due_date: d.due_date,
            due_time: d.due_time || undefined,
            notes: d.notes || undefined,
            related_member_id: sanitizeUUID(d.related_member_id) || undefined,
            attachments: Array.isArray(d.attachments) ? d.attachments : [],
            created_at: d.created_at || new Date().toISOString(),
            updated_at: d.updated_at || undefined,
          }));

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

  create: async (taskData: Omit<Task, 'id' | 'created_at'>): Promise<Task> => {
    const activeUser = storage.getActiveUser();
    const taskId = generateUUID();
    let churchId = sanitizeUUID(taskData.church_id);
    if (!churchId) {
      churchId = await churchService.getActiveChurchId();
    }
    const newTask: Task = {
      ...taskData,
      id: taskId,
      church_id: churchId,
      created_by: sanitizeUUID(taskData.created_by) || sanitizeUUID(activeUser?.id) || undefined,
      comments_count: 0,
      created_at: new Date().toISOString(),
    };

    // Save to local storage immediately
    storage.saveTask(newTask);
    storage.logAction('TASK_CREATED', 'task', `Created task "${newTask.title}"`, newTask.id);

    // Trigger in-app notification for assigned user
    storage.addNotification({
      id: generateUUID(),
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
      const sanitizedAssignedTo = sanitizeUUID(newTask.assigned_to);
      if (sanitizedAssignedTo) {
        try {
          const { data, error } = await supabase
            .from('tasks')
            .insert({
              id: newTask.id,
              church_id: sanitizeUUID(newTask.church_id),
              title: newTask.title,
              title_ar: newTask.title_ar || null,
              description: newTask.description || null,
              service_id: sanitizeUUID(newTask.service_id),
              group_id: newTask.group_id || null,
              assigned_to: sanitizedAssignedTo,
              created_by: sanitizeUUID(newTask.created_by),
              priority: newTask.priority || 'medium',
              status: newTask.status || 'pending',
              due_date: newTask.due_date,
              due_time: newTask.due_time || null,
              notes: newTask.notes || null,
              related_member_id: sanitizeUUID(newTask.related_member_id),
              attachments: newTask.attachments || [],
              created_at: newTask.created_at,
            })
            .select()
            .single();

          if (!error && data) {
            const saved: Task = { ...newTask, id: data.id };
            storage.saveTask(saved);
            return saved;
          }
        } catch (err) {
          console.error('Supabase task insert error:', err);
        }
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

    if (isSupabaseConfigured() && supabase && sanitizeUUID(taskId)) {
      try {
        const payload: any = {
          updated_at: updatedTask.updated_at,
        };
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.title_ar !== undefined) payload.title_ar = updates.title_ar || null;
        if (updates.description !== undefined) payload.description = updates.description || null;
        if (updates.service_id !== undefined) payload.service_id = sanitizeUUID(updates.service_id);
        if (updates.group_id !== undefined) payload.group_id = updates.group_id || null;
        if (updates.assigned_to !== undefined) payload.assigned_to = sanitizeUUID(updates.assigned_to) || updatedTask.assigned_to;
        if (updates.priority !== undefined) payload.priority = updates.priority;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.due_date !== undefined) payload.due_date = updates.due_date;
        if (updates.due_time !== undefined) payload.due_time = updates.due_time || null;
        if (updates.notes !== undefined) payload.notes = updates.notes || null;
        if (updates.related_member_id !== undefined) payload.related_member_id = sanitizeUUID(updates.related_member_id);
        if (updates.attachments !== undefined) payload.attachments = updates.attachments || [];

        await supabase
          .from('tasks')
          .update(payload)
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

    if (isSupabaseConfigured() && supabase && sanitizeUUID(taskId)) {
      try {
        await supabase.from('tasks').delete().eq('id', taskId);
      } catch (err) {
        console.error('Supabase task delete error:', err);
      }
    }
  }
};
