import { CalendarEvent } from '../types';
import { storage } from '../lib/storage';

export const calendarService = {
  getAll: (): CalendarEvent[] => {
    return storage.getEvents();
  },

  getByDate: (date: string): CalendarEvent[] => {
    return storage.getEvents().filter(e => e.date === date);
  },

  create: (eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'created_by'>): CalendarEvent => {
    const activeUser = storage.getActiveUser();
    const newEvent: CalendarEvent = {
      ...eventData,
      id: 'evt-' + Date.now(),
      created_by: activeUser?.id || 'system',
      created_at: new Date().toISOString(),
    };
    storage.saveEvent(newEvent);
    storage.logAction('EVENT_CREATED', 'calendar', `Created event "${newEvent.title}" on ${newEvent.date}`, newEvent.id);
    return newEvent;
  },

  delete: (id: string) => {
    storage.deleteEvent(id);
  }
};
