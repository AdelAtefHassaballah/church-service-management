import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserProfile, Role, UserStatus } from '../types';
import { userService } from '../services/userService';
import { UserListTable } from '../components/users/UserListTable';
import { AddServantModal } from '../components/users/AddServantModal';
import { EditUserModal } from '../components/users/EditUserModal';
import { EditPermissionsModal } from '../components/users/EditPermissionsModal';
import { PrintableQRCard } from '../components/qr/PrintableQRCard';
import { Button } from '../components/common/Button';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  BookOpen, 
  UserX, 
  UserPlus, 
  Search, 
  Sparkles,
  ShieldAlert,
  Layers,
  Crown
} from 'lucide-react';

export const UsersManagementPage: React.FC = () => {
  const { user: currentUser, role: currentRole } = useAuth();
  const { t, language } = useLanguage();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'admin' | 'leader' | 'servant' | 'disabled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddServantOpen, setIsAddServantOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [permissionUser, setPermissionUser] = useState<UserProfile | null>(null);
  const [qrModalUser, setQrModalUser] = useState<UserProfile | null>(null);

  const loadUsers = async () => {
    // Show cached immediately, then sync remote database
    setUsers(userService.getAll());
    const remoteList = await userService.fetchAll();
    setUsers(remoteList);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users based on tab & search query
  const filteredUsers = users.filter((u) => {
    // Tab filter
    if (activeTab === 'disabled' && u.status !== 'disabled') return false;
    if (activeTab === 'admin' && u.role !== 'admin' && u.role !== 'super_admin') return false;
    if (activeTab === 'leader' && u.role !== 'leader') return false;
    if (activeTab === 'servant' && u.role !== 'servant') return false;

    // Search query filter
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.name_ar && u.name_ar.includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q))
    );
  });

  // Action handlers
  const handleToggleStatus = (u: UserProfile) => {
    const isCurrentlyDisabled = u.status === 'disabled';
    const confirmMsg = isCurrentlyDisabled 
      ? t('users.enableConfirm') 
      : t('users.disableConfirm');

    if (window.confirm(confirmMsg)) {
      if (isCurrentlyDisabled) {
        userService.enableUser(u.id);
      } else {
        userService.disableUser(u.id);
      }
      loadUsers();
    }
  };

  const handleDeleteUser = (u: UserProfile) => {
    if (window.confirm(t('users.deleteConfirm'))) {
      userService.delete(u.id);
      loadUsers();
    }
  };

  const handleSaveUser = (updated: UserProfile) => {
    userService.update(updated.id, updated);
    loadUsers();
  };

  // Quick stats
  const totalUsers = users.length;
  const activeLeaders = users.filter(u => u.role === 'leader' && u.status === 'active').length;
  const activeServants = users.filter(u => u.role === 'servant' && u.status === 'active').length;
  const disabledAccounts = users.filter(u => u.status === 'disabled').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-primary-600 flex items-center justify-center text-white font-bold shadow-md shadow-amber-500/20">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                {t('users.title')}
              </h2>
              <span className="text-[10px] bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                Super Admin Master Control
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('users.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsAddServantOpen(true)}
          >
            {t('users.addServant')}
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{totalUsers}</p>
            <p className="text-[11px] text-slate-400 font-medium">{t('users.allUsers')}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{activeLeaders}</p>
            <p className="text-[11px] text-slate-400 font-medium">{t('users.leaders')}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{activeServants}</p>
            <p className="text-[11px] text-slate-400 font-medium">{t('users.servants')}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{disabledAccounts}</p>
            <p className="text-[11px] text-slate-400 font-medium">{t('users.disabledAccounts')}</p>
          </div>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-x-auto">
          {[
            { key: 'all', label: t('users.allUsers') },
            { key: 'admin', label: t('users.admins') },
            { key: 'leader', label: t('users.leaders') },
            { key: 'servant', label: t('users.servants') },
            { key: 'disabled', label: `${t('users.disabledAccounts')} (${disabledAccounts})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <UserListTable
        users={filteredUsers}
        onEditUser={(u) => setEditingUser(u)}
        onEditPermissions={(u) => setPermissionUser(u)}
        onToggleStatus={handleToggleStatus}
        onDeleteUser={handleDeleteUser}
        onViewQR={(u) => setQrModalUser(u)}
      />

      {/* Add Servant Modal */}
      <AddServantModal
        isOpen={isAddServantOpen}
        onClose={() => setIsAddServantOpen(false)}
        onSuccess={loadUsers}
      />

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveUser}
      />

      {/* Granular Permissions Modal */}
      <EditPermissionsModal
        user={permissionUser}
        isOpen={!!permissionUser}
        onClose={() => setPermissionUser(null)}
        onSuccess={loadUsers}
      />

      {/* View/Print QR Modal */}
      {qrModalUser && (
        <PrintableQRCard
          person={{
            id: qrModalUser.id,
            name: qrModalUser.name,
            name_ar: qrModalUser.name_ar,
            avatar_url: qrModalUser.avatar_url,
            entity_type: 'servant',
            qr_code: qrModalUser.qr_code,
            service_names: qrModalUser.service_ids || ['General Service'],
            phone: qrModalUser.phone,
          }}
          isOpen={!!qrModalUser}
          onClose={() => setQrModalUser(null)}
        />
      )}
    </div>
  );
};
