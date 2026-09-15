import { UserProfile, Role, Permission, UserStatus } from '../types';
import { storage } from '../lib/storage';
import { DEFAULT_ROLE_PERMISSIONS } from '../lib/permissions';

const getAll = (): UserProfile[] => {
  return storage.getProfiles();
};

const getById = (id: string): UserProfile | undefined => {
  return storage.getProfileById(id);
};

const createServant = (data: {
  name: string;
  name_ar?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  role?: Role;
  service_ids: string[];
  group_ids?: string[];
  date_of_birth?: string;
  gender?: 'male' | 'female';
  address?: string;
  bio?: string;
  avatar_url?: string;
  permissions?: Permission[];
  status?: UserStatus;
}): UserProfile => {
  const newId = 'usr-servant-' + Date.now();
  const targetRole = data.role || 'servant';
  const initialPerms = data.permissions || DEFAULT_ROLE_PERMISSIONS[targetRole] || [];

  const newProfile: UserProfile = {
    id: newId,
    email: data.email,
    name: data.name,
    name_ar: data.name_ar || data.name,
    role: targetRole,
    avatar_url: data.avatar_url || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    phone: data.phone || '+201000000000',
    whatsapp: data.whatsapp || data.phone || '+201000000000',
    address: data.address || '',
    bio: data.bio || '',
    date_of_birth: data.date_of_birth,
    gender: data.gender || 'male',
    church_id: 'church-1',
    service_ids: data.service_ids || [],
    group_ids: data.group_ids || [],
    permissions: initialPerms,
    status: data.status || 'active',
    qr_code: `servant:${newId}`,
    created_at: new Date().toISOString(),
  };

  storage.saveProfile(newProfile);

  // Save corresponding QR record
  storage.saveQRCode({
    id: 'qr-' + newId,
    entity_type: 'servant',
    entity_id: newId,
    token: `servant:${newId}`,
    status: 'active',
    service_ids: data.service_ids || [],
    created_at: new Date().toISOString(),
  });

  // Update service mappings in storage
  const services = storage.getServices();
  for (const srvId of data.service_ids) {
    const srv = services.find(s => s.id === srvId);
    if (srv && !srv.servant_ids.includes(newId)) {
      srv.servant_ids.push(newId);
      storage.saveService(srv);
    }
  }

  storage.logAction(
    'SERVANT_CREATED',
    'user',
    `Super Admin created servant profile for ${newProfile.name} (${newProfile.name_ar})`,
    newProfile.id
  );

  return newProfile;
};

const updateUser = (id: string, updates: Partial<UserProfile>): UserProfile | null => {
  const existing = storage.getProfileById(id);
  if (!existing) return null;
  const prevRole = existing.role;

  const updated: UserProfile = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  storage.saveProfile(updated);

  if (updates.role && updates.role !== prevRole) {
    storage.logAction(
      'ROLE_CHANGED',
      'user',
      `Role changed for ${updated.name} from ${prevRole} to ${updates.role}`,
      id,
      prevRole,
      updates.role
    );
  } else {
    storage.logAction(
      'USER_UPDATED',
      'user',
      `Updated account profile details for ${updated.name}`,
      id
    );
  }

  return updated;
};

const updatePermissions = (id: string, permissions: Permission[]): void => {
  const existing = storage.getProfileById(id);
  if (!existing) return;

  existing.permissions = permissions;
  storage.saveProfile(existing);
  storage.logAction(
    'PERMISSIONS_UPDATED',
    'user',
    `Updated granular permissions for ${existing.name} (${permissions.length} perms)`,
    id
  );
};

const disableAccount = (id: string): void => {
  const user = storage.getProfileById(id);
  if (!user) return;
  user.status = 'disabled';
  storage.saveProfile(user);
  storage.logAction(
    'ACCOUNT_DISABLED',
    'user',
    `Super Admin disabled login access for ${user.name} (all historical data preserved)`,
    id,
    'active',
    'disabled'
  );
};

const enableAccount = (id: string): void => {
  const user = storage.getProfileById(id);
  if (!user) return;
  user.status = 'active';
  storage.saveProfile(user);
  storage.logAction(
    'ACCOUNT_ENABLED',
    'user',
    `Super Admin re-activated login access for ${user.name}`,
    id,
    'disabled',
    'active'
  );
};

const deleteUser = (id: string): void => {
  const user = storage.getProfileById(id);
  if (user) {
    storage.deleteProfile(id);
    storage.logAction('USER_DELETED', 'user', `Permanently deleted user ${user.name}`, id);
  }
};

export const userService = {
  getAll,
  getById,
  createServant,
  create: createServant,
  updateUser,
  update: updateUser,
  updatePermissions,
  disableAccount,
  disableUser: disableAccount,
  enableAccount,
  enableUser: enableAccount,
  deleteUser,
  delete: deleteUser,
};
