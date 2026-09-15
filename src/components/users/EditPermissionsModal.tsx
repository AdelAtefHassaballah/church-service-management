import React, { useState, useEffect } from 'react';
import { UserProfile, Permission } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useLanguage } from '../../context/LanguageContext';
import { PERMISSION_GROUPS, DEFAULT_ROLE_PERMISSIONS } from '../../lib/permissions';
import { userService } from '../../services/userService';
import { ShieldCheck, Check, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EditPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSuccess?: () => void;
}

export const EditPermissionsModal: React.FC<EditPermissionsModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const { t, language } = useLanguage();
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const isAr = language === 'ar';

  useEffect(() => {
    if (user) {
      setSelectedPermissions(user.permissions || DEFAULT_ROLE_PERMISSIONS[user.role] || []);
    }
  }, [user, isOpen]);

  if (!user) return null;

  const isSuperAdmin = user.role === 'super_admin';

  const handleTogglePermission = (key: Permission) => {
    if (isSuperAdmin) return;
    setSelectedPermissions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    if (isSuperAdmin) return;
    const allKeys: Permission[] = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key));
    setSelectedPermissions(Array.from(new Set(allKeys)));
  };

  const handleDeselectAll = () => {
    if (isSuperAdmin) return;
    setSelectedPermissions([]);
  };

  const handleSave = () => {
    userService.updatePermissions(user.id, selectedPermissions);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <ShieldCheck className="w-5 h-5" />
          <span>{t('permissions.title')}</span>
        </div>
      }
      subtitle={`${isAr ? (user.name_ar || user.name) : user.name} (${user.role.toUpperCase()})`}
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Super Admin Full Master Access Banner */}
        {isSuperAdmin ? (
          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-purple-800 dark:text-purple-300">Master Owner Account</h4>
              <p className="mt-0.5 leading-relaxed">{t('permissions.overrideNotice')}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {selectedPermissions.length} permissions active
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-primary-600 hover:underline font-semibold"
              >
                {t('permissions.selectAll')}
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs text-slate-500 hover:underline font-semibold"
              >
                {t('permissions.deselectAll')}
              </button>
            </div>
          </div>
        )}

        {/* Grouped Permissions Checkboxes */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {PERMISSION_GROUPS.map((group) => (
            <div
              key={group.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
            >
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 text-primary-600 dark:text-primary-400">
                <span>{isAr ? group.label_ar : group.label_en}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {group.permissions.map((perm) => {
                  const isChecked = isSuperAdmin || selectedPermissions.includes(perm.key);

                  return (
                    <label
                      key={perm.key}
                      className={`p-3 rounded-xl border text-start flex items-start gap-3 transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-primary-50/60 dark:bg-primary-950/30 border-primary-300 dark:border-primary-800/60'
                          : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isSuperAdmin}
                        onChange={() => handleTogglePermission(perm.key)}
                        className="mt-0.5 rounded text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                          {isAr ? perm.label_ar : perm.label_en}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          {isAr ? perm.description_ar : perm.description_en}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          {!isSuperAdmin && (
            <Button variant="primary" onClick={handleSave} icon={<Check className="w-4 h-4" />}>
              {t('permissions.savePermissions')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
