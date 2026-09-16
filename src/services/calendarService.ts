import { CalendarEvent } from '../types';
import { storage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateUUID, sanitizeUUID, DEFAULT_CHURCH_ID } from '../lib/uuid';

export const calendarService = {
  getAll: async (): Promise<CalendarEvent[]> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('calendar_events')
          .select('*')
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (!error && data) {
          const mapped: CalendarEvent[] = data.map((evt: any) => ({
            id: evt.id,
            church_id: sanitizeUUID(evt.church_id) || DEFAULT_CHURCH_ID,
            service_id: sanitizeUUID(evt.service_id) || undefined,
            group_id: evt.group_id || undefined,
            title: evt.title,
            title_ar: evt.title_ar || undefined,
            description: evt.description || undefined,
            event_type: evt.event_type || 'church_service',
            date: evt.date,
            start_time: evt.start_time || '08:00',
            end_time: evt.end_time || '11:30',
            location: evt.location || undefined,
            organizer: evt.organizer || undefined,
            visibility: evt.visibility || 'all',
            reminder: evt.reminder || undefined,
            attachments: Array.isArray(evt.attachments) ? evt.attachments : [],
            created_by: sanitizeUUID(evt.created_by) || undefined,
            assigned_servant_ids: Array.isArray(evt.assigned_servant_ids) ? evt.assigned_servant_ids : [],
            related_member_ids: Array.isArray(evt.related_member_ids) ? evt.related_member_ids : [],
            created_at: evt.created_at || new Date().toISOString(),
          }));
          mapped.forEach((evt) => storage.saveEvent(evt));
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase calendar fetch error, using local storage:', err);
      }
    }
    return storage.getEvents();
  },

  getByService: async (serviceId: string): Promise<CalendarEvent[]> => {
    const all = await calendarService.getAll();
    if (!serviceId || serviceId === 'all') return all;
    return all.filter(e => !e.service_id || e.service_id === serviceId);
  },

  getByDate: async (date: string): Promise<CalendarEvent[]> => {
    const all = await calendarService.getAll();
    return all.filter(e => e.date === date);
  },

  create: async (eventData: Omit<CalendarEvent, 'id' | 'created_at'>): Promise<CalendarEvent> => {
    const activeUser = storage.getActiveUser();
    const newId = generateUUID();
    const newEvent: CalendarEvent = {
      ...eventData,
      id: newId,
      church_id: DEFAULT_CHURCH_ID,
      created_by: sanitizeUUID(eventData.created_by) || sanitizeUUID(activeUser?.id) || undefined,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('calendar_events')
          .insert({
            id: newEvent.id,
            church_id: DEFAULT_CHURCH_ID,
            service_id: sanitizeUUID(newEvent.service_id),
            group_id: newEvent.group_id || null,
            title: newEvent.title,
            title_ar: newEvent.title_ar || null,
            description: newEvent.description || null,
            event_type: newEvent.event_type || 'church_service',
            date: newEvent.date,
            start_time: newEvent.start_time,
            end_time: newEvent.end_time,
            location: newEvent.location || null,
            organizer: newEvent.organizer || null,
            visibility: newEvent.visibility || 'all',
            reminder: newEvent.reminder || null,
            attachments: newEvent.attachments || [],
            created_by: sanitizeUUID(newEvent.created_by),
            assigned_servant_ids: newEvent.assigned_servant_ids || [],
            related_member_ids: newEvent.related_member_ids || [],
            created_at: newEvent.created_at,
          })
          .select()
          .single();

        if (!error && data) {
          const saved: CalendarEvent = {
            ...newEvent,
            id: data.id,
          };
          storage.saveEvent(saved);
          storage.logAction('EVENT_CREATED', 'calendar', `Created event "${saved.title}" on ${saved.date}`, saved.id);
          return saved;
        }
      } catch (err) {
        console.warn('Supabase event create error, saving locally:', err);
      }
    }

    storage.saveEvent(newEvent);
    storage.logAction('EVENT_CREATED', 'calendar', `Created event "${newEvent.title}" on ${newEvent.date}`, newEvent.id);
    return newEvent;
  },

  update: async (id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> => {
    const existing = storage.getEvents().find(e => e.id === id);
    if (!existing) return null;
    const updated: CalendarEvent = { ...existing, ...updates };

    if (isSupabaseConfigured() && supabase && sanitizeUUID(id)) {
      try {
        const payload: any = {};
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.title_ar !== undefined) payload.title_ar = updates.title_ar || null;
        if (updates.description !== undefined) payload.description = updates.description || null;
        if (updates.service_id !== undefined) payload.service_id = sanitizeUUID(updates.service_id);
        if (updates.group_id !== undefined) payload.group_id = updates.group_id || null;
        if (updates.event_type !== undefined) payload.event_type = updates.event_type;
        if (updates.date !== undefined) payload.date = updates.date;
        if (updates.start_time !== undefined) payload.start_time = updates.start_time;
        if (updates.end_time !== undefined) payload.end_time = updates.end_time;
        if (updates.location !== undefined) payload.location = updates.location || null;
        if (updates.organizer !== undefined) payload.organizer = updates.organizer || null;
        if (updates.visibility !== undefined) payload.visibility = updates.visibility || 'all';
        if (updates.reminder !== undefined) payload.reminder = updates.reminder || null;
        if (updates.attachments !== undefined) payload.attachments = updates.attachments || [];
        if (updates.assigned_servant_ids !== undefined) payload.assigned_servant_ids = updates.assigned_servant_ids || [];
        if (updates.related_member_ids !== undefined) payload.related_member_ids = updates.related_member_ids || [];

        const { data, error } = await supabase
          .from('calendar_events')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          const saved: CalendarEvent = { ...updated, ...data };
          storage.saveEvent(saved);
          storage.logAction('EVENT_UPDATED', 'calendar', `Updated event "${saved.title}"`, id);
          return saved;
        }
      } catch (err) {
        console.warn('Supabase event update error, fallback local:', err);
      }
    }

    storage.saveEvent(updated);
    storage.logAction('EVENT_UPDATED', 'calendar', `Updated event "${updated.title}"`, id);
    return updated;
  },

  delete: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured() && supabase && sanitizeUUID(id)) {
      try {
        const { error } = await supabase
          .from('calendar_events')
          .delete()
          .eq('id', id);
        if (error) {
          console.warn('Supabase delete event error:', error);
        }
      } catch (err) {
        console.warn('Supabase delete event error:', err);
      }
    }
    storage.deleteEvent(id);
    storage.logAction('EVENT_DELETED', 'calendar', `Deleted event ${id}`, id);
    return true;
  }
};
