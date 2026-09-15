import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ChurchService, ServiceType, UserProfile } from '../../types';
import { userService } from '../../services/userService';
import { Button } from '../common/Button';
import { 
  X, 
  Save, 
  Layers, 
  Clock, 
  MapPin, 
  Calendar, 
  Palette, 
  Check, 
  Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddEditServiceModalProps {
  service: ChurchService | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ChurchService>) => void;
}

const COLOR_PRESETS = [
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#059669', // Emerald
  '#d97706', // Amber
  '#e11d48', // Rose
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
];

export const AddEditServiceModal: React.FC<AddEditServiceModalProps> = ({
  service,
  isOpen,
  onClose,
  onSave,
}) => {
  const { t, language } = useLanguage();
  const allUsers = userService.getAll();
  const potentialLeaders = allUsers.filter(u => u.role === 'leader' || u.role === 'admin' || u.role === 'super_admin');
  const potentialServants = allUsers.filter(u => u.role === 'servant');

  if (!isOpen) return null;

  const isEditing = !!service;

  const [name, setName] = useState(service?.name || '');
  const [nameAr, setNameAr] = useState(service?.name_ar || '');
  const [description, setDescription] = useState(service?.description || '');
  const [descriptionAr, setDescriptionArAr] = useState(service?.description_ar || '');
  const [serviceType, setServiceType] = useState<ServiceType>(service?.service_type || 'preparatory');
  const [location, setLocation] = useState(service?.location || 'Church Main Building');
  const [dayOfWeek, setDayOfWeek] = useState(service?.day_of_week || 'friday');
  const [startTime, setStartTime] = useState(service?.start_time || '18:00');
  const [endTime, setEndTime] = useState(service?.end_time || '20:00');
  const [leaderIds, setLeaderIds] = useState<string[]>(service?.leader_ids || []);
  const [servantIds, setServantIds] = useState<string[]>(service?.servant_ids || []);
  const [color, setColor] = useState(service?.color || '#2563eb');
  const [notes, setNotes] = useState(service?.notes || '');
  const [status, setStatus] = useState<'active' | 'disabled'>(service?.status || 'active');

  const toggleLeader = (id: string) => {
    if (leaderIds.includes(id)) {
      setLeaderIds(leaderIds.filter(i => i !== id));
    } else {
      setLeaderIds([...leaderIds, id]);
    }
  };

  const toggleServant = (id: string) => {
    if (servantIds.includes(id)) {
      setServantIds(servantIds.filter(i => i !== id));
    } else {
      setServantIds([...servantIds, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nameAr.trim()) return;

    onSave({
      name: name.trim(),
      name_ar: nameAr.trim(),
      description: description.trim(),
      description_ar: descriptionAr.trim(),
      service_type: serviceType,
      location: location.trim(),
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      leader_ids: leaderIds,
      servant_ids: servantIds,
      color,
      notes: notes.trim(),
      status,
    });

    confetti({ particleCount: 30, spread: 50 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-md"
              style={{ backgroundColor: color }}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isEditing ? t('common.edit') : t('services.addService')}
              </h3>
              <p className="text-xs text-slate-400">
                Configure ministry area details, meeting times, and leadership
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('services.serviceName')} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Preparatory Service"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('services.serviceNameAr')} *
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={e => setNameAr(e.target.value)}
                placeholder="مثال: خدمة مرحلة إعدادي"
                dir="rtl"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('services.serviceType')}
              </label>
              <select
                value={serviceType}
                onChange={e => setServiceType(e.target.value as ServiceType)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="sunday_school">Sunday School (مدارس الأحد)</option>
                <option value="preparatory">Preparatory Service (إعدادي)</option>
                <option value="secondary">Secondary Service (ثانوي)</option>
                <option value="youth">Youth Service (شباب وخريجين)</option>
                <option value="children">Children Service (ابتدائي)</option>
                <option value="university">University Service (جامعيين)</option>
                <option value="choir">Choir Service (كورال)</option>
                <option value="bible_study">Bible Study (دراسة كتاب)</option>
                <option value="adults">Adults Service (عام / عامة)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('services.location')}
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="St. George Hall, 2nd Floor"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('services.dayOfWeek')}
              </label>
              <select
                value={dayOfWeek}
                onChange={e => setDayOfWeek(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="sunday">Sunday (الأحد)</option>
                <option value="monday">Monday (الاثنين)</option>
                <option value="tuesday">Tuesday (الثلاثاء)</option>
                <option value="wednesday">Wednesday (الأربعاء)</option>
                <option value="thursday">Thursday (الخميس)</option>
                <option value="friday">Friday (الجمعة)</option>
                <option value="saturday">Saturday (السبت)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('services.startTime')}
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('services.endTime')}
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Color theme preset picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Service Color Theme
            </label>
            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-xl flex items-center justify-center transition-transform hover:scale-110 shadow-sm"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Leaders Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t('services.leader')} (Assign Stage Leaders)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {potentialLeaders.map(ldr => {
                const isSelected = leaderIds.includes(ldr.id);
                return (
                  <button
                    key={ldr.id}
                    type="button"
                    onClick={() => toggleLeader(ldr.id)}
                    className={`p-2 rounded-xl border text-start flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-primary-50 dark:bg-primary-950/60 border-primary-500 text-primary-900 dark:text-primary-100 font-bold'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <img
                      src={ldr.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80'}
                      alt={ldr.name}
                      className="w-6 h-6 rounded-lg object-cover"
                    />
                    <span className="text-xs truncate">
                      {language === 'ar' ? (ldr.name_ar || ldr.name) : ldr.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              type="submit"
              icon={<Save className="w-4 h-4" />}
            >
              {t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
