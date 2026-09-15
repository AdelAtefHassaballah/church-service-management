import { CalendarEvent } from '../types';
import { storage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
          data.forEach((evt: any) => storage.saveEvent(evt));
          return data as CalendarEvent[];
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

  create: async (eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'created_by'>): Promise<CalendarEvent> => {
    const activeUser = storage.getActiveUser();
    const newEvent: CalendarEvent = {
      ...eventData,
      id: 'evt-' + Date.now(),
      created_by: activeUser?.id || 'system',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('calendar_events')
          .insert({
            church_id: newEvent.church_id || 'church-1',
            service_id: newEvent.service_id || null,
            title: newEvent.title,
            title_ar: newEvent.title_ar,
            description: newEvent.description,
            event_type: newEvent.event_type,
            date: newEvent.date,
            start_time: newEvent.start_time,
            end_time: newEvent.end_time,
            location: newEvent.location,
            visibility: newEvent.visibility || 'all',
            organizer: newEvent.organizer || null,
            reminder: newEvent.reminder || null,
            assigned_servant_ids: newEvent.assigned_servant_ids || [],
            created_by: newEvent.created_by
          })
          .select()
          .single();

        if (!error && data) {
          storage.saveEvent(data as CalendarEvent);
          storage.logAction('EVENT_CREATED', 'calendar', `Created event "${newEvent.title}" on ${newEvent.date}`, data.id);
          return data as CalendarEvent;
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
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('calendar_events')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          storage.saveEvent(data as CalendarEvent);
          storage.logAction('EVENT_UPDATED', 'calendar', `Updated event "${data.title}"`, id);
          return data as CalendarEvent;
        }
      } catch (err) {
        console.warn('Supabase event update error, fallback local:', err);
      }
    }

    const existing = storage.getEvents().find(e => e.id === id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    storage.saveEvent(updated);
    storage.logAction('EVENT_UPDATED', 'calendar', `Updated event "${updated.title}"`, id);
    return updated;
  },

  delete: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured() && supabase) {
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
