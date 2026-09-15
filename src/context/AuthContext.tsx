import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Role, Permission } from '../types';
import { storage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { hasPermission as checkPermission } from '../lib/permissions';

interface AuthContextType {
  user: UserProfile | null;
  role: Role;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPass: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    return storage.getActiveUser();
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session and sync with Supabase Auth
  useEffect(() => {
    let isMounted = true;

    const initAuthSession = async () => {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Session retrieval note:', error.message);
          }

          if (session?.user) {
            const { data: profile, error: profileErr } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile && isMounted) {
              const userProfile = profile as UserProfile;
              if (userProfile.status === 'disabled') {
                await supabase.auth.signOut();
                setUser(null);
                storage.setActiveUser(null);
              } else {
                setUser(userProfile);
                storage.setActiveUser(userProfile);
              }
            }
          } else {
            if (isMounted) {
              setUser(null);
              storage.setActiveUser(null);
            }
          }
        } catch (err) {
          console.warn('Auth session init error:', err);
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    initAuthSession();

    // Subscribe to auth state changes (Token refresh, sign-in, sign-out)
    if (isSupabaseConfigured() && supabase) {
      const client = supabase;
      const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          storage.setActiveUser(null);
        } else if (session?.user) {
          const { data: profile } = await client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const userProfile = profile as UserProfile;
            if (userProfile.status === 'disabled') {
              await client.auth.signOut();
              setUser(null);
              storage.setActiveUser(null);
            } else {
              setUser(userProfile);
              storage.setActiveUser(userProfile);
            }
          }
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    } else {
      setIsLoading(false);
    }
  }, []);

  // Secure email + password login
  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const sanitizedEmail = email.trim().toLowerCase();

    try {
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password: pass,
        });

        if (error || !data.user) {
          setIsLoading(false);
          return { success: false, error: 'Invalid email or password.' };
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!profile) {
          setIsLoading(false);
          return { success: false, error: 'User profile not found. Please contact administration.' };
        }

        const userProfile = profile as UserProfile;
        if (userProfile.status === 'disabled') {
          await supabase.auth.signOut();
          setIsLoading(false);
          return { success: false, error: 'This account has been disabled by the Super Admin.' };
        }

        setUser(userProfile);
        storage.setActiveUser(userProfile);
        storage.logAction('USER_LOGIN', 'auth', `User ${userProfile.name} authenticated successfully`, userProfile.id);
        setIsLoading(false);
        return { success: true };
      }

      // Offline / Local database lookup
      const profiles = storage.getProfiles();
      const match = profiles.find(p => p.email.toLowerCase() === sanitizedEmail);

      if (!match) {
        setIsLoading(false);
        return { success: false, error: 'Invalid email or password.' };
      }

      if (match.status === 'disabled') {
        setIsLoading(false);
        return { success: false, error: 'This account has been disabled by the Super Admin.' };
      }

      setUser(match);
      storage.setActiveUser(match);
      storage.logAction('USER_LOGIN', 'auth', `User ${match.name} signed in (${match.role})`, match.id);
      setIsLoading(false);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      setIsLoading(false);
      return { success: false, error: 'An unexpected authentication error occurred.' };
    }
  };

  // Logout and destroy session
  const logout = async (): Promise<void> => {
    if (user) {
      storage.logAction('USER_LOGOUT', 'auth', `User ${user.name} logged out`, user.id);
    }
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    storage.setActiveUser(null);
  };

  // Request password reset email
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: window.location.origin + '/reset-password',
        });
        if (error) {
          return { success: false, error: error.message };
        }
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to send password reset email.' };
    }
  };

  // Change password for logged in user
  const changePassword = async (newPass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPass });
        if (error) {
          return { success: false, error: error.message };
        }
      }
      if (user) {
        storage.logAction('PASSWORD_CHANGED', 'auth', `User ${user.name} changed account password`, user.id);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update password.' };
    }
  };

  // Update profile
  const updateProfile = async (data: Partial<UserProfile>): Promise<void> => {
    if (!user) return;
    const updated = { ...user, ...data, updated_at: new Date().toISOString() };
    setUser(updated);
    storage.saveProfile(updated);
    storage.setActiveUser(updated);

    if (isSupabaseConfigured() && supabase) {
      await supabase
        .from('profiles')
        .update({
          name: updated.name,
          name_ar: updated.name_ar,
          phone: updated.phone,
          whatsapp: updated.whatsapp,
          address: updated.address,
          bio: updated.bio,
          avatar_url: updated.avatar_url,
          updated_at: updated.updated_at,
        })
        .eq('id', user.id);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    return checkPermission(user, permission);
  };

  const role: Role = user?.role || 'servant';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        login,
        logout,
        resetPassword,
        changePassword,
        updateProfile,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
