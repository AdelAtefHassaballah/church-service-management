import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Role, UserStatus, Permission, ChurchService } from '../../types';
import { userService } from '../../services/userService';
import { serviceService } from '../../services/serviceService';
import { storage } from '../../lib/storage';
import { DEFAULT_ROLE_PERMISSIONS } from '../../lib/permissions';
import { Button } from '../common/Button';
import { 
  X, 
  UserPlus, 
  Sparkles, 
  Upload, 
  Camera, 
  ShieldCheck, 
  KeyRound, 
  Layers, 
  Phone, 
  Mail, 
  User, 
  Calendar 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddServantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddServantModal: React.FC<AddServantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t, language } = useLanguage();
  const { user: currentUser } = useAuth();
  const services = serviceService.getAll();

  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>(() => {
    return services.length > 0 ? [services[0].id] : [];
  });
  const [role, setRole] = useState<Role>('servant');
  const [status, setStatus] = useState<UserStatus>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (services.length > 0 && selectedServices.length === 0) {
      setSelectedServices([services[0].id]);
    }
  }, [services]);

  if (!isOpen) return null;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError(language === 'ar' ? 'حجم الصورة يجب ألا يتجاوز 2 ميجابايت' : 'Image must be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setAvatarUrl(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleService = (srvId: string) => {
    if (selectedServices.includes(srvId)) {
      setSelectedServices(selectedServices.filter(id => id !== srvId));
    } else {
      setSelectedServices([...selectedServices, srvId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validate English Name
    const cleanName = name.trim();
    if (!cleanName) {
      setError(language === 'ar' ? 'يرجى إدخال اسم الخادم بالإنجليزية' : 'Please enter full name (English)');
      return;
    }

    // 2. Validate Arabic Name
    const cleanNameAr = nameAr.trim();
    if (!cleanNameAr) {
      setError(language === 'ar' ? 'يرجى إدخال اسم الخادم باللغة العربية' : 'Please enter Arabic name');
      return;
    }

    // 3. Validate Email
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError(language === 'ar' ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError(language === 'ar' ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Please enter a valid email address');
      return;
    }

    // 4. Duplicate Email check (Local cache)
    const existingProfiles = storage.getProfiles();
    if (existingProfiles.some(p => p.email.toLowerCase() === cleanEmail)) {
      setError(language === 'ar' ? 'يوجد خادم مسجل بهذا البريد الإلكتروني بالفعل' : 'A user with this email already exists');
      return;
    }

    // 5. Validate Phone (if provided)
    const cleanPhone = phone.trim();
    if (cleanPhone && !/^[+0-9\s\-()]{7,20}$/.test(cleanPhone)) {
      setError(language === 'ar' ? 'رقم الهاتف غير صحيح (أرقام فقط)' : 'Invalid phone number format');
      return;
    }

    // 6. Validate Service Selection
    if (selectedServices.length === 0) {
      setError(language === 'ar' ? 'يرجى اختيار خدمة واحدة على الأقل' : 'Please select at least one church service');
      return;
    }

    setIsSubmitting(true);
    try {
      const initialPermissions: Permission[] = DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.servant;

      const newServant = await userService.create({
        name: cleanName,
        name_ar: cleanNameAr,
        email: cleanEmail,
        phone: cleanPhone || '+201000000000',
        whatsapp: whatsapp.trim() || cleanPhone || '+201000000000',
        date_of_birth: dateOfBirth || undefined,
        gender,
        address: address.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar_url: avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80`,
        service_ids: selectedServices,
        role,
        status,
        permissions: initialPermissions,
      });

      // Also assign servant to selected church services
      selectedServices.forEach(srvId => {
        serviceService.assignServant(srvId, newServant.id);
      });

      confetti({ particleCount: 40, spread: 60 });
      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create servant');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-sky-400 flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('users.addServant')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create profile, generate secure QR badge, and assign services
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

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Avatar Upload preview */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <div className="relative">
              <img
                src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                alt="Servant avatar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-500/50 shadow-sm"
              />
              <label className="absolute -bottom-2 -right-2 p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl cursor-pointer shadow-md transition-transform hover:scale-105">
                <Camera className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {t('members.photo')}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Upload a clear portrait (JPG, PNG, WebP up to 2MB).
              </p>
            </div>
          </div>

          {/* Personal Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('members.fullName')} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Peter George"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('members.arabicName')} *
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={e => setNameAr(e.target.value)}
                placeholder="مثال: بيتر جورج"
                dir="rtl"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth.email')} (Login Account) *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="peter@church.org"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('members.phone')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+20 123 456 7890"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('members.whatsapp')}
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="+20 123 456 7890"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('members.dob')}
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={e => setDateOfBirth(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('members.gender')}
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as 'male' | 'female')}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="male">{t('members.male')}</option>
                <option value="female">{t('members.female')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('users.roleCol')}
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as Role)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="servant">{t('roles.servant')}</option>
                <option value="leader">{t('roles.leader')}</option>
                <option value="admin">{t('roles.admin')}</option>
              </select>
            </div>
          </div>

          {/* Service Assignments (Many-to-Many) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('users.assignServices')} (Multi-Service Assignment)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {services.map(srv => {
                const isSelected = selectedServices.includes(srv.id);
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => toggleService(srv.id)}
                    className={`p-2.5 rounded-xl border text-start flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-primary-50 dark:bg-primary-950/60 border-primary-400 dark:border-primary-600 text-primary-900 dark:text-primary-100 font-bold'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs truncate">
                      {language === 'ar' ? srv.name_ar : srv.name}
                    </span>
                    <span className={`w-3 h-3 rounded-full border ${isSelected ? 'bg-primary-600 border-primary-600' : 'border-slate-300'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Status */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('users.statusCol')}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span>{t('users.active')}</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="pending"
                  checked={status === 'pending'}
                  onChange={() => setStatus('pending')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span>{t('users.pending')}</span>
              </label>
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
              isLoading={isSubmitting}
              icon={<UserPlus className="w-4 h-4" />}
            >
              {t('users.addServant')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
