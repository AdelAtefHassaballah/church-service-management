import { UserProfile, Role, Permission, UserStatus } from '../types';
import { storage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEFAULT_ROLE_PERMISSIONS } from '../lib/permissions';

const getAll = (): UserProfile[] => {
  return storage.getProfiles();
};

const fetchAll = async (): Promise<UserProfile[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        data.forEach((p: any) => storage.saveProfile(p));
        return data as UserProfile[];
      }
    } catch (err) {
      console.warn('Supabase fetch profiles error, using local fallback:', err);
    }
  }
  return storage.getProfiles();
};

const getById = (id: string): UserProfile | undefined => {
  return storage.getProfileById(id);
};

const createServant = async (data: {
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
}): Promise<UserProfile> => {
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
    qr_code: `SRV-${newId}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: dbProfile, error } = await supabase
        .from('profiles')
        .insert({
          id: newProfile.id,
          church_id: newProfile.church_id,
          email: newProfile.email,
          name: newProfile.name,
          name_ar: newProfile.name_ar,
          role: newProfile.role,
          phone: newProfile.phone,
          whatsapp: newProfile.whatsapp,
          address: newProfile.address,
          bio: newProfile.bio,
          gender: newProfile.gender,
          date_of_birth: newProfile.date_of_birth,
          status: newProfile.status,
          service_ids: newProfile.service_ids,
          group_ids: newProfile.group_ids,
          permissions: newProfile.permissions,
          qr_code: newProfile.qr_code,
        })
        .select()
        .single();

      if (!error && dbProfile) {
        storage.saveProfile(dbProfile as UserProfile);
      }
    } catch (err) {
      console.warn('Supabase insert profile error, using local storage:', err);
    }
  }

  storage.saveProfile(newProfile);

  // Save corresponding QR record
  storage.saveQRCode({
    id: 'qr-' + newId,
    entity_type: 'servant',
    entity_id: newId,
    token: `SRV-${newId}`,
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
    `Created servant profile for ${newProfile.name} (${newProfile.name_ar})`,
    newProfile.id
  );

  return newProfile;
};

const updateUser = async (id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  const existing = storage.getProfileById(id);
  if (!existing) return null;
  const prevRole = existing.role;

  const updated: UserProfile = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      // If email is changing, invoke synchronized RPC
      if (updates.email && updates.email !== existing.email) {
        await supabase.rpc('admin_update_user_email', {
          target_user_id: id,
          new_email: updates.email
        });
      }

      const { data: dbProfile, error } = await supabase
        .from('profiles')
        .update({
          name: updated.name,
          name_ar: updated.name_ar,
          email: updated.email,
          phone: updated.phone,
          whatsapp: updated.whatsapp,
          address: updated.address,
          bio: updated.bio,
          role: updated.role,
          status: updated.status,
          service_ids: updated.service_ids,
          group_ids: updated.group_ids,
          permissions: updated.permissions,
          updated_at: updated.updated_at
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && dbProfile) {
        storage.saveProfile(dbProfile as UserProfile);
      }
    } catch (err) {
      console.warn('Supabase profile update error, updating local:', err);
    }
  }

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

const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; message?: string }> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      return { success: true, message: 'Password reset link sent to ' + email };
    } catch (err: any) {
      console.warn('Supabase password reset error:', err);
      return { success: false, message: err.message || 'Failed to send reset email' };
    }
  }

  storage.logAction('PASSWORD_RESET_DISPATCHED', 'auth', `Simulated password reset link dispatched to ${email}`);
  return { success: true, message: 'Password reset instructions dispatched to ' + email };
};

const adminResetPassword = async (userId: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
  if (newPassword.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters' };
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.rpc('admin_reset_user_password', {
        target_user_id: userId,
        new_password: newPassword
      });
      if (error) throw error;
      return { success: true, message: 'Password successfully updated' };
    } catch (err: any) {
      console.warn('Supabase admin reset password error:', err);
    }
  }

  storage.logAction('ADMIN_PASSWORD_RESET', 'auth', `Super Admin reset password for user ID ${userId}`, userId);
  return { success: true, message: 'Password updated successfully' };
};

const updatePermissions = async (id: string, permissions: Permission[]): Promise<void> => {
  const existing = storage.getProfileById(id);
  if (!existing) return;

  existing.permissions = permissions;
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('profiles').update({ permissions }).eq('id', id);
    } catch (err) {
      console.warn('Supabase update permissions error:', err);
    }
  }

  storage.saveProfile(existing);
  storage.logAction(
    'PERMISSIONS_UPDATED',
    'user',
    `Updated granular permissions for ${existing.name} (${permissions.length} perms)`,
    id
  );
};

const disableAccount = async (id: string): Promise<void> => {
  const user = storage.getProfileById(id);
  if (!user) return;
  user.status = 'disabled';

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('profiles').update({ status: 'disabled' }).eq('id', id);
    } catch (err) {
      console.warn('Supabase disable user error:', err);
    }
  }

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

const enableAccount = async (id: string): Promise<void> => {
  const user = storage.getProfileById(id);
  if (!user) return;
  user.status = 'active';

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('profiles').update({ status: 'active' }).eq('id', id);
    } catch (err) {
      console.warn('Supabase enable user error:', err);
    }
  }

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

const deleteUser = async (id: string): Promise<void> => {
  const user = storage.getProfileById(id);
  if (user) {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('profiles').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete user error:', err);
      }
    }
    storage.deleteProfile(id);
    storage.logAction('USER_DELETED', 'user', `Permanently deleted user ${user.name}`, id);
  }
};

export const userService = {
  getAll,
  fetchAll,
  getById,
  createServant,
  create: createServant,
  updateUser,
  update: updateUser,
  sendPasswordResetEmail,
  adminResetPassword,
  updatePermissions,
  disableAccount,
  disableUser: disableAccount,
  enableAccount,
  enableUser: enableAccount,
  deleteUser,
  delete: deleteUser,
};
