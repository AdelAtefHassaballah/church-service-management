import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { PrintableQRCard } from '../components/qr/PrintableQRCard';
import { 
  User, 
  Save, 
  Phone, 
  Mail, 
  Lock, 
  Camera, 
  Sparkles, 
  Crown, 
  QrCode, 
  ShieldCheck, 
  Layers,
  KeyRound
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, changePassword, role } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'personal' | 'account' | 'qr'>('personal');
  const [name, setName] = useState(user?.name || '');
  const [nameAr, setNameAr] = useState(user?.name_ar || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [address, setAddress] = useState(user?.address || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [saved, setSaved] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image must be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          const newUrl = uploadEvent.target.result as string;
          setAvatarUrl(newUrl);
          updateProfile({ avatar_url: newUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      name_ar: nameAr,
      phone,
      whatsapp,
      address,
      bio,
      avatar_url: avatarUrl,
    });
    setSaved(true);
    confetti({ particleCount: 30, spread: 50 });
    setTimeout(() => setSaved(false), 2500);
  };

  const isSuperAdmin = role === 'super_admin';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Top Banner Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=140&auto=format&fit=crop&q=80'}
              alt={user?.name}
              className={`w-16 h-16 rounded-2xl object-cover border-2 shadow-sm ${
                isSuperAdmin 
                  ? 'border-amber-400 ring-2 ring-amber-300 dark:ring-amber-500' 
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            <label className="absolute -bottom-1 -right-1 p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl cursor-pointer shadow-md transition-transform hover:scale-110">
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
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? (user?.name_ar || user?.name) : user?.name}
              </h2>
              {isSuperAdmin && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                  <Crown className="w-2.5 h-2.5 text-amber-600" />
                  Super Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            <p className="text-[11px] text-primary-600 dark:text-primary-400 font-bold capitalize mt-0.5">
              {role} Role • Status: {user?.status || 'Active'}
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<QrCode className="w-4 h-4" />}
          onClick={() => setIsQRModalOpen(true)}
        >
          {t('qrSystem.viewQR')}
        </Button>
      </div>

      {/* Profile Section Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'personal'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          1. Personal Profile (Church Facing)
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'account'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          2. Account & Security
        </button>
      </div>

      {/* TAB 1: Personal Profile */}
      {activeTab === 'personal' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Personal Information
            </h3>
            <p className="text-xs text-slate-400">
              Information visible to leaders and servants in your church service
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name (English)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Arabic Name
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
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none font-mono"
                  dir="ltr"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Address / Residence Area
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. Heliopolis, Cairo"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  About / Pastoral Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Brief notes regarding your service history..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" type="submit" icon={<Save className="w-4 h-4" />}>
                {saved ? t('common.success') : t('common.save')}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Account Profile */}
      {activeTab === 'account' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Account Credentials & Security
            </h3>
            <p className="text-xs text-slate-400">
              System access credentials, assigned services, and active permissions
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Login Email
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 font-mono opacity-80"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned System Role
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.role}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold capitalize opacity-80"
                />
              </div>
            </div>

            {/* Assigned Services */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Assigned Church Services
              </label>
              <div className="flex flex-wrap gap-2">
                {user?.service_ids?.map(sid => (
                  <span
                    key={sid}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    <Layers className="w-3 h-3 text-primary-500" />
                    {sid}
                  </span>
                ))}
              </div>
            </div>

            {/* Permissions List */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Active Permissions ({isSuperAdmin ? 'Full Master Override' : `${user?.permissions?.length || 0} granted`})
              </label>
              {isSuperAdmin ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold">
                  👑 As Super Admin, you have unconditional master permissions across all church records, settings, and services.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  {user?.permissions?.map(p => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>

              {/* Change Password Section */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary-600" />
                  Change Account Password
                </h4>
                {passwordMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium ${
                      passwordMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {passwordMsg.text}
                  </div>
                )}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newPassword || newPassword.length < 8) {
                      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters long.' });
                      return;
                    }
                    const res = await changePassword(newPassword);
                    if (res.success) {
                      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
                      setNewPassword('');
                    } else {
                      setPasswordMsg({ type: 'error', text: res.error || 'Failed to update password.' });
                    }
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New strong password (min 8 chars)"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    type="submit"
                    icon={<KeyRound className="w-4 h-4" />}
                  >
                    Update Password
                  </Button>
                </form>
              </div>
          </div>
        </div>
      )}

      {/* QR Modal Card */}
      {user && (
        <PrintableQRCard
          person={{
            id: user.id,
            name: user.name,
            name_ar: user.name_ar,
            avatar_url: user.avatar_url,
            entity_type: user.role === 'member' ? 'member' : 'servant',
            qr_code: user.qr_code,
            service_names: user.service_ids || ['Church Service'],
            phone: user.phone,
          }}
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
        />
      )}
    </div>
  );
};
