import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, Role, UserStatus } from '../../types';
import { serviceService } from '../../services/serviceService';
import { userService } from '../../services/userService';
import { Button } from '../common/Button';
import { 
  X, 
  Save, 
  User, 
  ShieldCheck, 
  Phone, 
  Mail, 
  KeyRound,
  Send,
  Lock,
  Layers, 
  CheckCircle2, 
  AlertCircle,
  UserX 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface EditUserModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: UserProfile) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  const { t, language } = useLanguage();
  const { role: currentRole } = useAuth();
  const services = serviceService.getAll();
  const isAr = language === 'ar';

  if (!isOpen || !user) return null;

  const [name, setName] = useState(user.name);
  const [nameAr, setNameAr] = useState(user.name_ar || '');
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || '');
  const [whatsapp, setWhatsapp] = useState(user.whatsapp || '');
  const [address, setAddress] = useState(user.address || '');
  const [bio, setBio] = useState(user.bio || '');
  const [role, setRole] = useState<Role>(user.role);
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [selectedServices, setSelectedServices] = useState<string[]>(user.service_ids || []);

  // Admin Auth states
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  const toggleService = (srvId: string) => {
    if (selectedServices.includes(srvId)) {
      setSelectedServices(selectedServices.filter(id => id !== srvId));
    } else {
      setSelectedServices([...selectedServices, srvId]);
    }
  };

  const handleSendResetEmail = async () => {
    setIsSendingReset(true);
    setResetMessage(null);
    try {
      const res = await userService.sendPasswordResetEmail(email);
      setResetMessage({ text: res.message || 'Reset link sent!', isError: !res.success });
    } catch (err: any) {
      setResetMessage({ text: err.message || 'Failed to send reset link', isError: true });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleAdminResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setResetMessage({ text: isAr ? 'يجب أن تتكون كلمة المرور من ٨ أحرف على الأقل' : 'Password must be at least 8 characters', isError: true });
      return;
    }

    setIsSettingPassword(true);
    setResetMessage(null);
    try {
      const res = await userService.adminResetPassword(user.id, newPassword);
      setResetMessage({ text: res.message || 'Password updated successfully!', isError: !res.success });
      if (res.success) setNewPassword('');
    } catch (err: any) {
      setResetMessage({ text: err.message || 'Failed to update password', isError: true });
    } finally {
      setIsSettingPassword(false);
    }
  };

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const updated: UserProfile = {
        ...user,
        name,
        name_ar: nameAr,
        email,
        phone,
        whatsapp,
        address,
        bio,
        role,
        status,
        service_ids: selectedServices,
        updated_at: new Date().toISOString(),
      };

      const saved = await userService.updateUser(user.id, updated);
      if (saved) {
        onSave(saved);
      }
      confetti({ particleCount: 30, spread: 50 });
      onClose();
    } catch (err: any) {
      console.error('Update user error:', err);
      setError(err?.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuperAdmin = currentRole === 'super_admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
              alt={user.name}
              className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
            />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('users.editUser')}
              </h3>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {resetMessage && (
          <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            resetMessage.isError
              ? 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
          }`}>
            {resetMessage.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{resetMessage.text}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold text-center flex items-center gap-2 justify-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('members.arabicName')}
              </label>
              <input
                type="text"
                value={nameAr}
                onChange={e => setNameAr(e.target.value)}
                dir="rtl"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth.email')} *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={!isSuperAdmin}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono disabled:opacity-60"
              />
              {isSuperAdmin && (
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {isAr ? 'تغيير البريد الإلكتروني يحدث بيانات تسجيل الدخول مباشرة.' : 'Changing email modifies login credentials immediately.'}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('users.roleCol')} *
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as Role)}
                disabled={!isSuperAdmin}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
              >
                <option value="super_admin">{t('roles.super_admin')}</option>
                <option value="admin">{t('roles.admin')}</option>
                <option value="leader">{t('roles.leader')}</option>
                <option value="servant">{t('roles.servant')}</option>
                <option value="member">{t('roles.member')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('members.phone')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
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
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                dir="ltr"
              />
            </div>
          </div>

          {/* Super Admin Password Management Section */}
          {isSuperAdmin && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <KeyRound className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span>{isAr ? 'إدارة كلمة المرور وحساب المستخدم (Super Admin)' : 'Password & Authentication Management (Super Admin)'}</span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSendResetEmail}
                  isLoading={isSendingReset}
                  icon={<Send className="w-3.5 h-3.5 text-primary-600" />}
                >
                  {isAr ? 'إرسال رابط إعادة تعيين كلمة المرور' : 'Send Password Reset Link'}
                </Button>

                <span className="text-xs text-slate-400 self-center">{isAr ? 'أو' : 'or'}</span>

                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="password"
                    placeholder={isAr ? 'تعيين كلمة مرور جديدة مباشرة (٨ أحرف min)' : 'New password (min 8 chars)'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none font-mono"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAdminResetPassword}
                    isLoading={isSettingPassword}
                    icon={<Lock className="w-3.5 h-3.5" />}
                  >
                    {isAr ? 'تحديث' : 'Set'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Service Assignments */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('users.assignServices')}
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
                      {isAr ? (srv.name_ar || srv.name) : srv.name}
                    </span>
                    <span className={`w-3 h-3 rounded-full border ${isSelected ? 'bg-primary-600 border-primary-600' : 'border-slate-300'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Status Toggle */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('users.statusCol')}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="edit-status"
                  value="active"
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-emerald-600">{t('users.active')}</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="edit-status"
                  value="disabled"
                  checked={status === 'disabled'}
                  onChange={() => setStatus('disabled')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-rose-600">{t('users.disabled')}</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="edit-status"
                  value="pending"
                  checked={status === 'pending'}
                  onChange={() => setStatus('pending')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-amber-600">{t('users.pending')}</span>
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
