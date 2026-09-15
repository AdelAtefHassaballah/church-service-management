import React, { useState } from 'react';
import { UserProfile, Role, UserStatus } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { 
  ShieldCheck, 
  UserCheck, 
  BookOpen, 
  Users, 
  Crown,
  MoreVertical, 
  ShieldAlert, 
  KeyRound, 
  UserX, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Layers,
  Sparkles,
  QrCode
} from 'lucide-react';

interface UserListTableProps {
  users: UserProfile[];
  onEditUser: (user: UserProfile) => void;
  onEditPermissions: (user: UserProfile) => void;
  onToggleStatus: (user: UserProfile) => void;
  onDeleteUser: (user: UserProfile) => void;
  onViewQR: (user: UserProfile) => void;
}

export const UserListTable: React.FC<UserListTableProps> = ({
  users,
  onEditUser,
  onEditPermissions,
  onToggleStatus,
  onDeleteUser,
  onViewQR,
}) => {
  const { t, language } = useLanguage();
  const { user: currentUser } = useAuth();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-sm">
            <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            {t('roles.super_admin')}
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            {t('roles.admin')}
          </span>
        );
      case 'leader':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            {t('roles.leader')}
          </span>
        );
      case 'servant':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            {t('roles.servant')}
          </span>
        );
      case 'member':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            {t('roles.member')}
          </span>
        );
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm">{t('users.active')}</Badge>;
      case 'disabled':
        return <Badge variant="danger" size="sm">{t('users.disabled')}</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm">{t('users.pending')}</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-start text-xs">
        <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3.5 text-start">{t('users.userCol')}</th>
            <th className="px-4 py-3.5 text-start">{t('users.roleCol')}</th>
            <th className="px-4 py-3.5 text-start">{t('users.servicesCol')}</th>
            <th className="px-4 py-3.5 text-start">{t('users.statusCol')}</th>
            <th className="px-4 py-3.5 text-center">{t('permissions.title')}</th>
            <th className="px-4 py-3.5 text-end">{t('users.actionsCol')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                {t('common.noData')}
              </td>
            </tr>
          ) : (
            users.map((u) => {
              const isSelf = currentUser?.id === u.id;
              const isSuperAdmin = u.role === 'super_admin';

              return (
                <tr 
                  key={u.id}
                  className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                    u.status === 'disabled' ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/40' : ''
                  }`}
                >
                  {/* User info */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                          alt={u.name}
                          className={`w-9 h-9 rounded-xl object-cover border ${
                            isSuperAdmin 
                              ? 'border-amber-400 ring-2 ring-amber-300 dark:ring-amber-500' 
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        />
                        {isSuperAdmin && (
                          <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white rounded-full p-0.5 shadow-sm">
                            <Crown className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {language === 'ar' ? (u.name_ar || u.name) : u.name}
                          </p>
                          {isSelf && (
                            <span className="text-[10px] bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-bold px-1.5 py-0.2 rounded-md">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                        {u.phone && (
                          <p className="text-[10px] text-slate-500 font-mono" dir="ltr">{u.phone}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {getRoleBadge(u.role)}
                  </td>

                  {/* Assigned Services */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {u.service_ids && u.service_ids.length > 0 ? (
                        u.service_ids.map(sid => (
                          <span 
                            key={sid}
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            <Layers className="w-2.5 h-2.5 text-primary-500" />
                            {sid.replace('srv-', '')}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No services</span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {getStatusBadge(u.status)}
                  </td>

                  {/* Granular Permissions Button */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    {isSuperAdmin ? (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3" /> Full Master Access
                      </span>
                    ) : (
                      <button
                        onClick={() => onEditPermissions(u)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-950/60 dark:text-primary-300 dark:hover:bg-primary-900/60 border border-primary-200 dark:border-primary-800 transition-colors shadow-sm"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>{u.permissions?.length || 0} permissions</span>
                      </button>
                    )}
                  </td>

                  {/* Actions Dropdown */}
                  <td className="px-4 py-3.5 text-end whitespace-nowrap relative">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onViewQR(u)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={t('qrSystem.viewQR')}
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditUser(u)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={t('users.editUser')}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {!isSuperAdmin && !isSelf && (
                        <button
                          onClick={() => onToggleStatus(u)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.status === 'disabled'
                              ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          }`}
                          title={u.status === 'disabled' ? t('users.enableAccount') : t('users.disableAccount')}
                        >
                          {u.status === 'disabled' ? <CheckCircle2 className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        </button>
                      )}

                      {!isSuperAdmin && !isSelf && (
                        <button
                          onClick={() => onDeleteUser(u)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title={t('users.deleteUser')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
