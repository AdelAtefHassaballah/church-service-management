import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { sanitizeUUID, DEFAULT_CHURCH_ID } from '../lib/uuid';
import { storage } from '../lib/storage';

export interface Church {
  id: string;
  name: string;
  name_ar: string;
  location?: string;
  created_at?: string;
}

let cachedChurchId: string | null = null;

export const churchService = {
  /**
   * Fetch all churches from Supabase or cache
   */
  fetchAll: async (): Promise<Church[]> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('churches')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          cachedChurchId = data[0].id;
          return data as Church[];
        }

        // If churches table is empty in production, automatically provision baseline church
        if (!error && (!data || data.length === 0)) {
          console.info('⚡ Provisioning baseline church organization in database...');
          const { data: newChurch, error: insertErr } = await supabase
            .from('churches')
            .insert({
              id: DEFAULT_CHURCH_ID,
              name: 'St. Mark & St. George Coptic Orthodox Church',
              name_ar: 'كنيسة الشهيد العظيم مارمرقس والشهيد مارجرجس',
              location: 'Diocese of Church Service',
            })
            .select()
            .single();

          if (!insertErr && newChurch) {
            cachedChurchId = newChurch.id;
            return [newChurch as Church];
          }
        }
      } catch (err) {
        console.warn('Supabase fetch churches exception:', err);
      }
    }

    return [{
      id: DEFAULT_CHURCH_ID,
      name: 'St. Mark & St. George Coptic Orthodox Church',
      name_ar: 'كنيسة الشهيد العظيم مارمرقس والشهيد مارجرجس',
      location: 'Diocese of Church Service',
    }];
  },

  /**
   * Dynamically resolves the active church UUID for the current context.
   * Checks:
   * 1. In-memory cache
   * 2. Authenticated user's profile church_id
   * 3. Loaded church services church_id
   * 4. Live Supabase churches query with auto-provisioning
   */
  getActiveChurchId: async (): Promise<string> => {
    // 1. Check in-memory cache
    if (cachedChurchId && sanitizeUUID(cachedChurchId)) {
      return cachedChurchId;
    }

    // 2. Check active user profile
    const activeUser = storage.getActiveUser();
    if (activeUser?.church_id && sanitizeUUID(activeUser.church_id)) {
      cachedChurchId = activeUser.church_id;
      return cachedChurchId;
    }

    // 3. Check loaded church services
    const services = storage.getServices();
    if (services.length > 0 && services[0].church_id && sanitizeUUID(services[0].church_id)) {
      cachedChurchId = services[0].church_id;
      return cachedChurchId;
    }

    // 4. Query database
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('churches')
          .select('id')
          .limit(1);

        if (!error && data && data.length > 0 && data[0].id) {
          const resolvedId = String(data[0].id);
          cachedChurchId = resolvedId;
          return resolvedId;
        }

        // Auto-provision default church in Supabase if table is empty
        const { data: created, error: createError } = await supabase
          .from('churches')
          .insert({
            id: DEFAULT_CHURCH_ID,
            name: 'St. Mark & St. George Coptic Orthodox Church',
            name_ar: 'كنيسة الشهيد العظيم مارمرقس والشهيد مارجرجس',
            location: 'Diocese of Church Service',
          })
          .select('id')
          .single();

        if (!createError && created?.id) {
          const resolvedId = String(created.id);
          cachedChurchId = resolvedId;
          return resolvedId;
        }
      } catch (err) {
        console.warn('Supabase getActiveChurchId exception:', err);
      }
    }

    cachedChurchId = DEFAULT_CHURCH_ID;
    return cachedChurchId;
  },

  /**
   * Reset cache (useful when switching users / churches)
   */
  clearCache: () => {
    cachedChurchId = null;
  }
};
