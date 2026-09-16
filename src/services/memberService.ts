import { Member, MemberNote, NoteVisibility } from '../types';
import { storage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateUUID, sanitizeUUID, DEFAULT_CHURCH_ID } from '../lib/uuid';

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
            church_id: sanitizeUUID(row.church_id) || DEFAULT_CHURCH_ID,
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
            assigned_servant_id: sanitizeUUID(row.assigned_servant_id) || undefined,
            status: row.status || 'active',
            notes: row.notes || undefined,
            qr_code: row.qr_code || `member:${row.id}`,
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
    const newId = generateUUID();
    const newMember: Member = {
      ...memberData,
      id: newId,
      church_id: sanitizeUUID(memberData.church_id) || DEFAULT_CHURCH_ID,
      service_ids: memberData.service_ids || [],
      qr_code: `member:${newId}`,
      created_at: new Date().toISOString(),
    };
    storage.saveMember(newMember);
    storage.logAction('MEMBER_CREATED', 'member', `Added new member: ${newMember.full_name} (${newMember.arabic_name})`, newMember.id);

    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('members')
        .insert({
          id: newMember.id,
          church_id: sanitizeUUID(newMember.church_id),
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
          assigned_servant_id: sanitizeUUID(newMember.assigned_servant_id),
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
          join_date: updated.join_date || null,
          baptism_date: updated.baptism_date || null,
          confession_father: updated.confession_father || null,
          assigned_servant_id: sanitizeUUID(updated.assigned_servant_id),
          service_ids: updated.service_ids || [],
          group_id: updated.group_id || null,
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
    const newQR = `member:${id}`;
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
  },

  // Member Pastoral Care Notes (public.member_notes)
  fetchNotes: async (memberId: string): Promise<MemberNote[]> => {
    if (isSupabaseConfigured() && supabase && sanitizeUUID(memberId)) {
      try {
        const { data, error } = await supabase
          .from('member_notes')
          .select('*')
          .eq('member_id', memberId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const notes: MemberNote[] = data.map((n: any) => ({
            id: n.id,
            member_id: n.member_id,
            author_id: n.author_id,
            content: n.content,
            visibility: n.visibility || 'all_leaders_servants',
            follow_up_date: n.follow_up_date || undefined,
            created_at: n.created_at,
          }));
          storage.saveMemberNotes(notes);
          return notes;
        }
      } catch (err) {
        console.warn('Supabase fetch member notes error:', err);
      }
    }
    return storage.getMemberNotes(memberId);
  },

  addNote: async (data: {
    member_id: string;
    author_id: string;
    content: string;
    visibility?: NoteVisibility;
    follow_up_date?: string;
  }): Promise<MemberNote> => {
    const noteId = generateUUID();
    const newNote: MemberNote = {
      id: noteId,
      member_id: data.member_id,
      author_id: data.author_id,
      content: data.content.trim(),
      visibility: data.visibility || 'all_leaders_servants',
      follow_up_date: data.follow_up_date,
      created_at: new Date().toISOString(),
    };

    storage.saveMemberNote(newNote);
    storage.logAction('MEMBER_NOTE_ADDED', 'member', `Added care note for member ID ${data.member_id}`, data.member_id);

    if (isSupabaseConfigured() && supabase) {
      const sanitizedMemberId = sanitizeUUID(data.member_id);
      const sanitizedAuthorId = sanitizeUUID(data.author_id);
      if (sanitizedMemberId && sanitizedAuthorId) {
        supabase
          .from('member_notes')
          .insert({
            id: newNote.id,
            member_id: sanitizedMemberId,
            author_id: sanitizedAuthorId,
            content: newNote.content,
            visibility: newNote.visibility,
            follow_up_date: newNote.follow_up_date || null,
            created_at: newNote.created_at,
          })
          .then(({ error }) => {
            if (error) console.warn('Supabase member_notes insert error:', error.message);
          });
      }
    }

    return newNote;
  },

  deleteNote: async (noteId: string): Promise<void> => {
    storage.deleteMemberNote(noteId);
    if (isSupabaseConfigured() && supabase && sanitizeUUID(noteId)) {
      supabase
        .from('member_notes')
        .delete()
        .eq('id', noteId)
        .then(({ error }) => {
          if (error) console.warn('Supabase member_notes delete error:', error.message);
        });
    }
  }
};
