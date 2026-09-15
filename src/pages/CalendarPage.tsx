import React, { useState } from 'react';
import { CalendarEvent, EventType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { storage } from '../lib/storage';
import { calendarService } from '../services/calendarService';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { 
  CalendarDays, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  Calendar as CalendarIcon,
  Save,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CalendarPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { role, user } = useAuth();
  const servants = storage.getProfiles().filter(p => p.role === 'servant');
  const groups = storage.getGroups();

  const [events, setEvents] = useState<CalendarEvent[]>(() => storage.getEvents());
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New Event Form State
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [eventType, setEventType] = useState<EventType>('church_service');
  const [date, setDate] = useState('2026-09-18');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('11:30');
  const [location, setLocation] = useState('Main Sanctuary');
  const [description, setDescription] = useState('');

  const isAr = language === 'ar';
  const canAdd = role === 'admin' || role === 'leader';

  const eventTypeColors: Record<EventType, 'primary' | 'success' | 'warning' | 'purple' | 'gold'> = {
    church_service: 'gold',
    meeting: 'primary',
    lesson: 'success',
    activity: 'purple',
    visit: 'warning',
    task_deadline: 'warning',
    special_event: 'gold',
  };

  const refreshEvents = () => {
    setEvents(storage.getEvents());
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    calendarService.create({
      church_id: 'church-1',
      title,
      title_ar: titleAr || title,
      event_type: eventType,
      date,
      start_time: startTime,
      end_time: endTime,
      location,
      description,
      assigned_servant_ids: servants.map(s => s.id),
    });

    confetti({ particleCount: 40, spread: 60 });
    refreshEvents();
    setIsAddOpen(false);
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm('Delete this event?')) {
      calendarService.delete(id);
      refreshEvents();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span>{t('calendar.title')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('calendar.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canAdd && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              {t('calendar.addEvent')}
            </Button>
          )}
        </div>
      </div>

      {/* Events Agenda Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <Badge variant={eventTypeColors[event.event_type] || 'primary'} size="sm">
                  {t(`calendar.${event.event_type}`) || event.event_type}
                </Badge>

                <div className="flex items-center gap-1 text-xs font-mono font-bold text-primary-600 dark:text-primary-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{event.start_time} - {event.end_time}</span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-3">
                {isAr ? (event.title_ar || event.title) : event.title}
              </h3>

              {event.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {event.description}
                </p>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2 text-slate-500">
                  <CalendarIcon className="w-3.5 h-3.5 text-primary-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{event.date}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>

            {canAdd && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('common.delete')}</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Event Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
            <CalendarDays className="w-5 h-5" />
            <span>{t('calendar.addEvent')}</span>
          </div>
        }
        subtitle={t('calendar.subtitle')}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateEvent} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('calendar.eventTitle')} (English) *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Prep Stage Spiritual Revival Meeting"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('calendar.eventTitle')} (العربية)
            </label>
            <input
              type="text"
              value={titleAr}
              onChange={e => setTitleAr(e.target.value)}
              placeholder="مثال: اجتماع النهضة الروحية لإعدادي"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('calendar.eventType')}
              </label>
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value as EventType)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                <option value="church_service">{t('calendar.churchService')}</option>
                <option value="meeting">{t('calendar.meeting')}</option>
                <option value="lesson">{t('calendar.lesson')}</option>
                <option value="activity">{t('calendar.activity')}</option>
                <option value="visit">{t('calendar.visit')}</option>
                <option value="special_event">{t('calendar.specialEvent')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('calendar.startTime')}
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('calendar.endTime')}
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('calendar.location')}
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Main Church Sanctuary"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsAddOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit" icon={<Save className="w-4 h-4" />}>
              {t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
