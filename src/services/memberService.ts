import { Member, MemberNote } from '../types';
import { storage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const memberService = {
  fetchAll: async (): Promise<Member[]> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('full_name', { ascending: true });

        if (!error && data) {
          const mapped: Member[] = data.map((row: any) => ({
            id: row.id,
            church_id: row.church_id || 'church-1',
            service_ids: Array.isArray(row.service_ids) ? row.service_ids : [],
            group_id: row.group_id || undefined,
            full_name: row.full_name,
            arabic_name: row.arabic_name,
            photo_url: row.photo_url || undefined,
            date_of_birth: row.date_of_birth || undefined,
            gender: row.gender || 'male',
            phone: row.phone,
            whatsapp: row.whatsapp,
            email: row.email || undefined,
            address: row.address || undefined,
            emergency_contact_name: row.emergency_contact_name || undefined,
            emergency_contact_phone: row.emergency_contact_phone || undefined,
            join_date: row.join_date || new Date().toISOString().split('T')[0],
            baptism_date: row.baptism_date || undefined,
            confession_father: row.confession_father || undefined,
            assigned_servant_id: row.assigned_servant_id || undefined,
            status: row.status || 'active',
            notes: row.notes || undefined,
            qr_code: row.qr_code || `KHEDMA-${row.id.toUpperCase()}`,
            created_at: row.created_at || new Date().toISOString(),
            updated_at: row.updated_at || undefined,
          }));
          storage.saveMembers(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase member fetch error:', err);
      }
    }
    return storage.getMembers();
  },

  getAll: (): Member[] => {
    return storage.getMembers();
  },

  getById: (id: string): Member | undefined => {
    return storage.getMemberById(id);
  },

  search: (query: string, groupId?: string, servantId?: string, status?: string): Member[] => {
    let members = storage.getMembers();
    const q = query.toLowerCase().trim();

    if (q) {
      members = members.filter(
        m =>
          m.full_name.toLowerCase().includes(q) ||
          m.arabic_name.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          m.whatsapp.includes(q) ||
          m.qr_code.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q)
      );
    }

    if (groupId && groupId !== 'all') {
      members = members.filter(m => m.group_id === groupId);
    }

    if (servantId && servantId !== 'all') {
      members = members.filter(m => m.assigned_servant_id === servantId);
    }

    if (status && status !== 'all') {
      members = members.filter(m => m.status === status);
    }

    return members;
  },

  create: (memberData: Omit<Member, 'id' | 'qr_code' | 'created_at'>): Member => {
    const randomId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'mbr-' + Math.floor(1000 + Math.random() * 9000);
    const newMember: Member = {
      ...memberData,
      id: randomId,
      service_ids: memberData.service_ids || [],
      qr_code: `KHEDMA-${randomId.toUpperCase()}`,
      created_at: new Date().toISOString(),
    };
    storage.saveMember(newMember);
    storage.logAction('MEMBER_CREATED', 'member', `Added new member: ${newMember.full_name} (${newMember.arabic_name})`, newMember.id);

    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('members')
        .insert({
          id: newMember.id,
          church_id: newMember.church_id && newMember.church_id.length === 36 ? newMember.church_id : null,
          service_ids: newMember.service_ids || [],
          group_id: newMember.group_id || null,
          full_name: newMember.full_name,
          arabic_name: newMember.arabic_name,
          photo_url: newMember.photo_url || null,
          date_of_birth: newMember.date_of_birth || null,
          gender: newMember.gender,
          phone: newMember.phone,
          whatsapp: newMember.whatsapp,
          email: newMember.email || null,
          address: newMember.address || null,
          emergency_contact_name: newMember.emergency_contact_name || null,
          emergency_contact_phone: newMember.emergency_contact_phone || null,
          join_date: newMember.join_date || new Date().toISOString().split('T')[0],
          baptism_date: newMember.baptism_date || null,
          confession_father: newMember.confession_father || null,
          assigned_servant_id: newMember.assigned_servant_id && newMember.assigned_servant_id.length === 36 ? newMember.assigned_servant_id : null,
          status: newMember.status,
          notes: newMember.notes || null,
          qr_code: newMember.qr_code,
          created_at: newMember.created_at,
        })
        .then(({ error }) => {
          if (error) console.warn('Remote Supabase member insert error:', error.message);
        });
    }

    return newMember;
  },

  update: (id: string, updates: Partial<Member>): Member | null => {
    const existing = storage.getMemberById(id);
    if (!existing) return null;
    const updated: Member = {
      ...existing,
      ...updates,
      service_ids: updates.service_ids || existing.service_ids || [],
      updated_at: new Date().toISOString(),
    };
    storage.saveMember(updated);
    storage.logAction('MEMBER_UPDATED', 'member', `Updated details for ${updated.full_name}`, updated.id);

    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('members')
        .update({
          full_name: updated.full_name,
          arabic_name: updated.arabic_name,
          photo_url: updated.photo_url || null,
          date_of_birth: updated.date_of_birth || null,
          gender: updated.gender,
          phone: updated.phone,
          whatsapp: updated.whatsapp,
          email: updated.email || null,
          address: updated.address || null,
          emergency_contact_name: updated.emergency_contact_name || null,
          emergency_contact_phone: updated.emergency_contact_phone || null,
          confession_father: updated.confession_father || null,
          assigned_servant_id: updated.assigned_servant_id && updated.assigned_servant_id.length === 36 ? updated.assigned_servant_id : null,
          service_ids: updated.service_ids || [],
          status: updated.status,
          notes: updated.notes || null,
          qr_code: updated.qr_code,
          updated_at: updated.updated_at,
        })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('Remote Supabase member update error:', error.message);
        });
    }

    return updated;
  },

  delete: (id: string) => {
    const existing = storage.getMemberById(id);
    if (existing) {
      storage.deleteMember(id);
      storage.logAction('MEMBER_DELETED', 'member', `Deleted member: ${existing.full_name}`, id);

      if (isSupabaseConfigured() && supabase) {
        supabase
          .from('members')
          .delete()
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.warn('Remote Supabase member delete error:', error.message);
          });
      }
    }
  },

  regenerateQR: (id: string): string => {
    const existing = storage.getMemberById(id);
    if (!existing) return '';
    const newQR = `KHEDMA-${id.toUpperCase()}-${Date.now().toString().slice(-4)}`;
    existing.qr_code = newQR;
    storage.saveMember(existing);
    storage.logAction('MEMBER_QR_REGENERATED', 'member', `Regenerated QR badge for ${existing.full_name}`, id);

    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('members')
        .update({ qr_code: newQR, updated_at: new Date().toISOString() })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('Remote Supabase member qr update error:', error.message);
        });
    }

    return newQR;
  }
};

