import React, { useState, useEffect, useMemo } from 'react';
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
  Calendar as CalendarIcon,
  Save,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Eye,
  CalendarRange,
  List,
  Grid
} from 'lucide-react';
import confetti from 'canvas-confetti';

type ViewMode = 'month' | 'week' | 'day' | 'agenda';

export const CalendarPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { role, user } = useAuth();
  const isAr = language === 'ar';

  const services = storage.getServices();
  const servants = storage.getProfiles().filter(p => p.role === 'servant');

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState<CalendarEvent | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [eventType, setEventType] = useState<EventType>('church_service');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('11:30');
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState<'all' | 'service_members' | 'servants_only' | 'leaders_only'>('all');
  const [organizer, setOrganizer] = useState('');
  const [reminder, setReminder] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const canManage = role === 'super_admin' || role === 'admin' || role === 'leader';

  const eventTypeColors: Record<EventType, 'primary' | 'success' | 'warning' | 'purple' | 'gold'> = {
    church_service: 'gold',
    meeting: 'primary',
    lesson: 'success',
    activity: 'purple',
    visit: 'warning',
    task_deadline: 'warning',
    special_event: 'gold',
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await calendarService.getAll();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
      setEvents(storage.getEvents());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      // Service filter
      if (selectedServiceId !== 'all') {
        if (e.service_id && e.service_id !== selectedServiceId) return false;
      }
      // Event type filter
      if (selectedEventType !== 'all') {
        if (e.event_type !== selectedEventType) return false;
      }
      // Visibility filter
      if (role === 'member') {
        if (e.visibility === 'servants_only' || e.visibility === 'leaders_only') return false;
      } else if (role === 'servant') {
        if (e.visibility === 'leaders_only') return false;
      }
      return true;
    });
  }, [events, selectedServiceId, selectedEventType, role]);

  // Date navigation helpers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else if (viewMode === 'day') {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else if (viewMode === 'day') {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const openAddModal = (initialDate?: string) => {
    setEditingEvent(null);
    setTitle('');
    setTitleAr('');
    setServiceId(services[0]?.id || '');
    setEventType('church_service');
    setDate(initialDate || new Date().toISOString().split('T')[0]);
    setStartTime('08:00');
    setEndTime('11:30');
    setLocation('Main Sanctuary');
    setVisibility('all');
    setOrganizer(user?.name || '');
    setReminder('1_day_before');
    setDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setTitleAr(event.title_ar || '');
    setServiceId(event.service_id || services[0]?.id || '');
    setEventType(event.event_type);
    setDate(event.date);
    setStartTime(event.start_time || '08:00');
    setEndTime(event.end_time || '11:30');
    setLocation(event.location || '');
    setVisibility(event.visibility || 'all');
    setOrganizer(event.organizer || '');
    setReminder(event.reminder || '');
    setDescription(event.description || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError(isAr ? 'يرجى إدخال عنوان الفعالية' : 'Please enter event title');
      return;
    }
    if (!date) {
      setFormError(isAr ? 'يرجى تحديد التاريخ' : 'Please select a date');
      return;
    }

    try {
      if (editingEvent) {
        await calendarService.update(editingEvent.id, {
          title,
          title_ar: titleAr || title,
          service_id: serviceId || undefined,
          event_type: eventType,
          date,
          start_time: startTime,
          end_time: endTime,
          location,
          visibility,
          organizer,
          reminder,
          description,
        });
      } else {
        await calendarService.create({
          church_id: 'church-1',
          service_id: serviceId || undefined,
          title,
          title_ar: titleAr || title,
          event_type: eventType,
          date,
          start_time: startTime,
          end_time: endTime,
          location,
          visibility,
          organizer,
          reminder,
          description,
          assigned_servant_ids: servants.map(s => s.id),
        });
        confetti({ particleCount: 35, spread: 60 });
      }

      await loadEvents();
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save event');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذه الفعالية؟' : 'Are you sure you want to delete this event?')) {
      await calendarService.delete(id);
      await loadEvents();
      setSelectedEventDetail(null);
    }
  };

  // Month View Days Computation
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = firstDay.getDay(); // 0 = Sunday
    const totalDays = lastDay.getDate();

    const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Previous month padding
    const prevLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = prevDate.toISOString().split('T')[0];
      days.push({ dateStr, dayNumber: d, isCurrentMonth: false, isToday: false });
    }

    // Current month days
    const todayStr = new Date().toISOString().split('T')[0];
    for (let d = 1; d <= totalDays; d++) {
      const curDate = new Date(year, month, d);
      const dateStr = curDate.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });
    }

    // Next month padding to fill complete grid (multiples of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = nextDate.toISOString().split('T')[0];
      days.push({ dateStr, dayNumber: i, isCurrentMonth: false, isToday: false });
    }

    return days;
  }, [currentDate]);

  // Week View Days Computation
  const weekData = useMemo(() => {
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay(); // Sunday
    const days: { dateStr: string; dayNumber: number; dayName: string; isToday: boolean }[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.setDate(first + i));
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'short' });
      days.push({
        dateStr,
        dayNumber: d.getDate(),
        dayName,
        isToday: dateStr === todayStr
      });
    }
    return days;
  }, [currentDate, isAr]);

  const weekdayNames = isAr 
    ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const monthYearTitle = currentDate.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-4">
      {/* Top Header & Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span>{t('calendar.title')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('calendar.subtitle')}
          </p>
        </div>

        {/* View Mode Switcher + Navigation + Add Button */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          {/* Navigation Controls */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              {isAr ? 'اليوم' : 'Today'}
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 dark:text-slate-100 min-w-[120px] text-center">
              {monthYearTitle}
            </span>
          </div>

          {/* View Modes Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>{isAr ? 'شهر' : 'Month'}</span>
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>{isAr ? 'أسبوع' : 'Week'}</span>
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{isAr ? 'يوم' : 'Day'}</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{isAr ? 'جدول' : 'Agenda'}</span>
            </button>
          </div>

          {/* Add Event Button */}
          {canManage && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => openAddModal()}
              icon={<Plus className="w-4 h-4" />}
            >
              {t('calendar.addEvent')}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5 text-primary-500" />
            <span>{isAr ? 'تصفية حسب:' : 'Filter by:'}</span>
          </div>

          {/* Service filter */}
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
          >
            <option value="all">{isAr ? 'جميع الخدمات / القطاعات' : 'All Ministries / Services'}</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {isAr ? (s.name_ar || s.name) : s.name}
              </option>
            ))}
          </select>

          {/* Event type filter */}
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
          >
            <option value="all">{isAr ? 'جميع أنواع الفعاليات' : 'All Event Types'}</option>
            <option value="church_service">{t('calendar.church_service') || 'Church Service'}</option>
            <option value="meeting">{t('calendar.meeting') || 'Meeting'}</option>
            <option value="lesson">{t('calendar.lesson') || 'Lesson'}</option>
            <option value="activity">{t('calendar.activity') || 'Activity'}</option>
            <option value="visit">{t('calendar.visit') || 'Visit'}</option>
            <option value="special_event">{t('calendar.special_event') || 'Special Event'}</option>
          </select>
        </div>

        <div className="text-slate-400 font-medium">
          {filteredEvents.length} {isAr ? 'فعالية مجدولة' : 'events scheduled'}
        </div>
      </div>

      {/* VIEW MODE RENDERING */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium animate-pulse">
          {isAr ? 'جاري تحميل جدول الفعاليات...' : 'Loading calendar events...'}
        </div>
      ) : (
        <>
          {/* 1. MONTH VIEW */}
          {viewMode === 'month' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Day Header Row */}
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
                {weekdayNames.map((name, i) => (
                  <div key={i} className="py-2.5 text-center text-xs font-bold text-slate-600 dark:text-slate-300">
                    {name}
                  </div>
                ))}
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
                {monthData.map((day, idx) => {
                  const dayEvents = filteredEvents.filter(e => e.date === day.dateStr);

                  return (
                    <div
                      key={idx}
                      onClick={() => canManage && openAddModal(day.dateStr)}
                      className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                        day.isCurrentMonth ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-950/30 opacity-60'
                      } hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                            day.isToday
                              ? 'bg-primary-600 text-white shadow-sm'
                              : day.isCurrentMonth
                              ? 'text-slate-800 dark:text-slate-200'
                              : 'text-slate-400 dark:text-slate-600'
                          }`}
                        >
                          {day.dayNumber}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-bold text-slate-400">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Event Pills */}
                      <div className="space-y-1 mt-1.5">
                        {dayEvents.slice(0, 3).map(e => (
                          <div
                            key={e.id}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setSelectedEventDetail(e);
                            }}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold truncate flex items-center justify-between gap-1 shadow-2xs transition-all hover:scale-[1.02] cursor-pointer bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-100 dark:border-primary-900"
                          >
                            <span className="truncate">{isAr ? (e.title_ar || e.title) : e.title}</span>
                            <span className="text-[9px] opacity-75 font-mono">{e.start_time}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] font-bold text-slate-500 text-center">
                            +{dayEvents.length - 3} {isAr ? 'المزيد' : 'more'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. WEEK VIEW */}
          {viewMode === 'week' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {weekData.map((d, idx) => {
                  const dayEvents = filteredEvents.filter(e => e.date === d.dateStr);

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border flex flex-col justify-between ${
                        d.isToday
                          ? 'border-primary-500/50 bg-primary-50/20 dark:bg-primary-950/20 shadow-sm'
                          : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            {d.dayName}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            d.isToday ? 'bg-primary-600 text-white' : 'text-slate-800 dark:text-slate-200'
                          }`}>
                            {d.dayNumber}
                          </span>
                        </div>

                        <div className="mt-2.5 space-y-2">
                          {dayEvents.length === 0 ? (
                            <p className="text-[11px] text-slate-400 py-3 text-center italic">
                              {isAr ? 'لا توجد فعاليات' : 'No events'}
                            </p>
                          ) : (
                            dayEvents.map(e => (
                              <div
                                key={e.id}
                                onClick={() => setSelectedEventDetail(e)}
                                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-sm cursor-pointer transition-all space-y-1"
                              >
                                <Badge variant={eventTypeColors[e.event_type] || 'primary'} size="sm">
                                  {e.event_type}
                                </Badge>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                                  {isAr ? (e.title_ar || e.title) : e.title}
                                </h4>
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                  <Clock className="w-3 h-3 text-primary-500" />
                                  <span>{e.start_time} - {e.end_time}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {canManage && (
                        <button
                          onClick={() => openAddModal(d.dateStr)}
                          className="mt-3 py-1.5 w-full text-center text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/50 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{isAr ? 'إضافة' : 'Add'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. DAY VIEW */}
          {viewMode === 'day' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {currentDate.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {filteredEvents.filter(e => e.date === currentDate.toISOString().split('T')[0]).length} {isAr ? 'فعاليات في هذا اليوم' : 'events on this day'}
                  </span>
                </div>

                {canManage && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openAddModal(currentDate.toISOString().split('T')[0])}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    {t('calendar.addEvent')}
                  </Button>
                )}
              </div>

              {/* Day events list */}
              {(() => {
                const dayEvents = filteredEvents.filter(e => e.date === currentDate.toISOString().split('T')[0]);
                if (dayEvents.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <CalendarDays className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
                      <p className="text-sm font-semibold">{isAr ? 'لا توجد فعاليات مجدولة لهذا اليوم' : 'No events scheduled for this day'}</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {dayEvents.map(e => (
                      <div
                        key={e.id}
                        className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-sm transition-all"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Badge variant={eventTypeColors[e.event_type] || 'primary'} size="sm">
                              {e.event_type}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs font-mono font-bold text-primary-600 dark:text-primary-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{e.start_time} - {e.end_time}</span>
                            </div>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {isAr ? (e.title_ar || e.title) : e.title}
                          </h4>

                          {e.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                              {e.description}
                            </p>
                          )}

                          {e.location && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" />
                              <span>{e.location}</span>
                            </div>
                          )}
                        </div>

                        {canManage && (
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(e)}
                              icon={<Edit2 className="w-3.5 h-3.5" />}
                            >
                              {isAr ? 'تعديل' : 'Edit'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEvent(e.id)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                              icon={<Trash2 className="w-3.5 h-3.5" />}
                            >
                              {t('common.delete')}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 4. AGENDA / LIST VIEW */}
          {viewMode === 'agenda' && (
            <div className="space-y-4">
              {filteredEvents.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                  <CalendarDays className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'لا توجد فعاليات مجدولة' : 'No events scheduled.'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {isAr ? 'استخدم زر "إضافة فعالية" لجدولة موعد جديد.' : 'Use the "+ Add Event" button to schedule a new event.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEvents.map((event) => (
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
                          {event.service_id && (
                            <div className="flex items-center gap-2 text-slate-500">
                              <Layers className="w-3.5 h-3.5 text-emerald-500" />
                              <span>
                                {(() => {
                                  const s = services.find(x => x.id === event.service_id);
                                  return s ? (isAr ? s.name_ar || s.name : s.name) : event.service_id;
                                })()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {canManage && (
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <button
                            onClick={() => openEditModal(event)}
                            className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 font-semibold transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'تعديل' : 'Edit'}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 font-semibold transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t('common.delete')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ADD / EDIT EVENT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
            <CalendarDays className="w-5 h-5" />
            <span>{editingEvent ? (isAr ? 'تعديل الفعالية' : 'Edit Event') : t('calendar.addEvent')}</span>
          </div>
        }
        subtitle={isAr ? 'إدارة فعاليات واجتماعات الخدمة' : 'Manage church service activities and events'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEvent} className="space-y-3.5">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {formError}
            </div>
          )}

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'الخدمة / القطاع المرتبط' : 'Ministry / Service'}
              </label>
              <select
                value={serviceId}
                onChange={e => setServiceId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                <option value="">{isAr ? 'عام لكافة الخدمات' : 'General / All Services'}</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {isAr ? (s.name_ar || s.name) : s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('calendar.eventType')}
              </label>
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value as EventType)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                <option value="church_service">{t('calendar.church_service') || 'Church Service'}</option>
                <option value="meeting">{t('calendar.meeting') || 'Meeting'}</option>
                <option value="lesson">{t('calendar.lesson') || 'Lesson'}</option>
                <option value="activity">{t('calendar.activity') || 'Activity'}</option>
                <option value="visit">{t('calendar.visit') || 'Visit'}</option>
                <option value="special_event">{t('calendar.special_event') || 'Special Event'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'التاريخ *' : 'Date *'}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('calendar.location')}
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Main Sanctuary"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'مستوى الرؤية' : 'Visibility'}
              </label>
              <select
                value={visibility}
                onChange={e => setVisibility(e.target.value as any)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                <option value="all">{isAr ? 'الجميع (المخدومين والخُدام)' : 'Public / All Members & Servants'}</option>
                <option value="service_members">{isAr ? 'أعضاء الخدمة فقط' : 'Service Members Only'}</option>
                <option value="servants_only">{isAr ? 'الخُدام فقط' : 'Servants Only'}</option>
                <option value="leaders_only">{isAr ? 'الأمناء والقادة فقط' : 'Leaders & Admins Only'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isAr ? 'الوصف والتفاصيل' : 'Description'}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={isAr ? 'أدخل ملاحظات وتفاصيل الفعالية...' : 'Enter event details...'}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit" icon={<Save className="w-4 h-4" />}>
              {editingEvent ? (isAr ? 'حفظ التعديلات' : 'Update Event') : t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EVENT DETAIL VIEW MODAL */}
      <Modal
        isOpen={!!selectedEventDetail}
        onClose={() => setSelectedEventDetail(null)}
        title={
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span>{isAr ? (selectedEventDetail?.title_ar || selectedEventDetail?.title) : selectedEventDetail?.title}</span>
          </div>
        }
        subtitle={selectedEventDetail?.date}
        maxWidth="md"
      >
        {selectedEventDetail && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant={eventTypeColors[selectedEventDetail.event_type] || 'primary'}>
                {selectedEventDetail.event_type}
              </Badge>
              <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                {selectedEventDetail.start_time} - {selectedEventDetail.end_time}
              </span>
            </div>

            {selectedEventDetail.description && (
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                {selectedEventDetail.description}
              </p>
            )}

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {selectedEventDetail.location && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>{selectedEventDetail.location}</span>
                </div>
              )}
              {selectedEventDetail.service_id && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <span>
                    {(() => {
                      const s = services.find(x => x.id === selectedEventDetail.service_id);
                      return s ? (isAr ? s.name_ar || s.name : s.name) : selectedEventDetail.service_id;
                    })()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-500">
                <Eye className="w-4 h-4 text-primary-500" />
                <span>Visibility: {selectedEventDetail.visibility || 'all'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              {canManage && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const evt = selectedEventDetail;
                      setSelectedEventDetail(null);
                      openEditModal(evt);
                    }}
                    icon={<Edit2 className="w-3.5 h-3.5" />}
                  >
                    {isAr ? 'تعديل' : 'Edit'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEvent(selectedEventDetail.id)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={() => setSelectedEventDetail(null)}>
                {isAr ? 'إغلاق' : 'Close'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
