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
        } else if (error) {
          console.warn('Supabase member fetch error:', error.message);
        }
      } catch (err) {
        console.warn('Supabase member fetch exception:', err);
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

  create: async (memberData: Omit<Member, 'id' | 'qr_code' | 'created_at'>): Promise<Member> => {
    const newId = generateUUID();
    const churchId = sanitizeUUID(memberData.church_id) || DEFAULT_CHURCH_ID;
    const assignedServantId = sanitizeUUID(memberData.assigned_servant_id);
    const serviceIds = memberData.service_ids && memberData.service_ids.length > 0 
      ? memberData.service_ids 
      : [];

    const newMember: Member = {
      ...memberData,
      id: newId,
      church_id: churchId,
      service_ids: serviceIds,
      assigned_servant_id: assignedServantId || undefined,
      qr_code: `member:${newId}`,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const payload: any = {
        id: newMember.id,
        church_id: sanitizeUUID(newMember.church_id),
        service_ids: newMember.service_ids || [],
        group_id: newMember.group_id || null,
        full_name: newMember.full_name.trim(),
        arabic_name: newMember.arabic_name.trim(),
        photo_url: newMember.photo_url || null,
        date_of_birth: newMember.date_of_birth || null,
        gender: newMember.gender,
        phone: newMember.phone.trim(),
        whatsapp: newMember.whatsapp.trim(),
        email: newMember.email ? newMember.email.trim().toLowerCase() : null,
        address: newMember.address ? newMember.address.trim() : null,
        emergency_contact_name: newMember.emergency_contact_name ? newMember.emergency_contact_name.trim() : null,
        emergency_contact_phone: newMember.emergency_contact_phone ? newMember.emergency_contact_phone.trim() : null,
        join_date: newMember.join_date || new Date().toISOString().split('T')[0],
        baptism_date: newMember.baptism_date || null,
        confession_father: newMember.confession_father ? newMember.confession_father.trim() : null,
        assigned_servant_id: assignedServantId || null,
        status: newMember.status,
        notes: newMember.notes ? newMember.notes.trim() : null,
        qr_code: newMember.qr_code,
        created_at: newMember.created_at,
      };

      const { data, error } = await supabase
        .from('members')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Supabase member insert error:', error);
        throw new Error(error.message || 'Failed to create member in database.');
      }

      // Sync QR codes table
      try {
        await supabase.from('qr_codes').upsert({
          entity_type: 'member',
          entity_id: newMember.id,
          token: newMember.qr_code,
          status: 'active',
          service_ids: newMember.service_ids || [],
          created_at: newMember.created_at,
        }, { onConflict: 'token' });
      } catch (qrErr) {
        console.warn('Supabase qr_codes sync error for member:', qrErr);
      }

      // Sync service_members junction table
      if (newMember.service_ids && newMember.service_ids.length > 0) {
        const srvInserts = newMember.service_ids
          .map(sid => sanitizeUUID(sid))
          .filter(Boolean)
          .map(sid => ({
            service_id: sid,
            member_id: newMember.id,
          }));
        if (srvInserts.length > 0) {
          try {
            await supabase.from('service_members').upsert(srvInserts, { onConflict: 'service_id,member_id' });
          } catch (srvErr) {
            console.warn('Supabase service_members sync error:', srvErr);
          }
        }
      }

      // Sync member_servant_assignments if servant assigned
      if (assignedServantId && newMember.service_ids && newMember.service_ids.length > 0) {
        const careInserts = newMember.service_ids
          .map(sid => sanitizeUUID(sid))
          .filter(Boolean)
          .map(sid => ({
            service_id: sid,
            servant_id: assignedServantId,
            member_id: newMember.id,
          }));
        if (careInserts.length > 0) {
          try {
            await supabase.from('member_servant_assignments').upsert(careInserts, { onConflict: 'service_id,servant_id,member_id' });
          } catch (careErr) {
            console.warn('Supabase member_servant_assignments sync error:', careErr);
          }
        }
      }

      const insertedMember: Member = data ? { ...newMember, ...data } : newMember;
      storage.saveMember(insertedMember);
      storage.logAction('MEMBER_CREATED', 'member', `Added new member: ${insertedMember.full_name} (${insertedMember.arabic_name})`, insertedMember.id);
      return insertedMember;
    }

    storage.saveMember(newMember);
    storage.logAction('MEMBER_CREATED', 'member', `Added new member: ${newMember.full_name} (${newMember.arabic_name}) (Local)`, newMember.id);
    return newMember;
  },

  update: async (id: string, updates: Partial<Member>): Promise<Member | null> => {
    const existing = storage.getMemberById(id);
    if (!existing) return null;

    const assignedServantId = updates.assigned_servant_id !== undefined 
      ? sanitizeUUID(updates.assigned_servant_id)
      : sanitizeUUID(existing.assigned_servant_id);

    const updated: Member = {
      ...existing,
      ...updates,
      assigned_servant_id: assignedServantId || undefined,
      service_ids: updates.service_ids || existing.service_ids || [],
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const payload: any = {
        full_name: updated.full_name.trim(),
        arabic_name: updated.arabic_name.trim(),
        photo_url: updated.photo_url || null,
        date_of_birth: updated.date_of_birth || null,
        gender: updated.gender,
        phone: updated.phone.trim(),
        whatsapp: updated.whatsapp.trim(),
        email: updated.email ? updated.email.trim().toLowerCase() : null,
        address: updated.address ? updated.address.trim() : null,
        emergency_contact_name: updated.emergency_contact_name ? updated.emergency_contact_name.trim() : null,
        emergency_contact_phone: updated.emergency_contact_phone ? updated.emergency_contact_phone.trim() : null,
        join_date: updated.join_date || null,
        baptism_date: updated.baptism_date || null,
        confession_father: updated.confession_father ? updated.confession_father.trim() : null,
        assigned_servant_id: assignedServantId || null,
        service_ids: updated.service_ids || [],
        group_id: updated.group_id || null,
        status: updated.status,
        notes: updated.notes ? updated.notes.trim() : null,
        qr_code: updated.qr_code,
        updated_at: updated.updated_at,
      };

      const { data, error } = await supabase
        .from('members')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase member update error:', error);
        throw new Error(error.message || 'Failed to update member in database.');
      }

      // Sync service_members junction table
      if (updated.service_ids && updated.service_ids.length > 0) {
        const srvInserts = updated.service_ids
          .map(sid => sanitizeUUID(sid))
          .filter(Boolean)
          .map(sid => ({
            service_id: sid,
            member_id: updated.id,
          }));
        if (srvInserts.length > 0) {
          try {
            await supabase.from('service_members').upsert(srvInserts, { onConflict: 'service_id,member_id' });
          } catch (srvErr) {
            console.warn('Supabase service_members update sync error:', srvErr);
          }
        }
      }

      const finalMember: Member = data ? { ...updated, ...data } : updated;
      storage.saveMember(finalMember);
      storage.logAction('MEMBER_UPDATED', 'member', `Updated details for ${finalMember.full_name}`, finalMember.id);
      return finalMember;
    }

    storage.saveMember(updated);
    storage.logAction('MEMBER_UPDATED', 'member', `Updated details for ${updated.full_name} (Local)`, updated.id);
    return updated;
  },

  delete: async (id: string): Promise<void> => {
    const existing = storage.getMemberById(id);
    if (!existing) return;

    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase member delete error:', error);
        throw new Error(error.message || 'Failed to delete member from database.');
      }
    }

    storage.deleteMember(id);
    storage.logAction('MEMBER_DELETED', 'member', `Deleted member: ${existing.full_name}`, id);
  },

  regenerateQR: async (id: string): Promise<string> => {
    const existing = storage.getMemberById(id);
    if (!existing) return '';
    const newQR = `member:${id}`;
    existing.qr_code = newQR;
    existing.updated_at = new Date().toISOString();

    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('members')
        .update({ qr_code: newQR, updated_at: existing.updated_at })
        .eq('id', id);

      if (error) {
        console.error('Supabase member QR update error:', error);
        throw new Error(error.message || 'Failed to regenerate QR in database.');
      }

      await supabase.from('qr_codes').upsert({
        entity_type: 'member',
        entity_id: existing.id,
        token: newQR,
        status: 'active',
        service_ids: existing.service_ids || [],
      }, { onConflict: 'token' });
    }

    storage.saveMember(existing);
    storage.logAction('MEMBER_QR_REGENERATED', 'member', `Regenerated QR badge for ${existing.full_name}`, id);
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
    const sanitizedMemberId = sanitizeUUID(data.member_id);
    const sanitizedAuthorId = sanitizeUUID(data.author_id);

    const newNote: MemberNote = {
      id: noteId,
      member_id: data.member_id,
      author_id: data.author_id,
      content: data.content.trim(),
      visibility: data.visibility || 'all_leaders_servants',
      follow_up_date: data.follow_up_date,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase && sanitizedMemberId && sanitizedAuthorId) {
      const { data: dbNote, error } = await supabase
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
        .select()
        .single();

      if (error) {
        console.error('Supabase member_notes insert error:', error);
        throw new Error(error.message || 'Failed to save member note in database.');
      }

      const savedNote: MemberNote = dbNote ? { ...newNote, ...dbNote } : newNote;
      storage.saveMemberNote(savedNote);
      storage.logAction('MEMBER_NOTE_ADDED', 'member', `Added care note for member ID ${data.member_id}`, data.member_id);
      return savedNote;
    }

    storage.saveMemberNote(newNote);
    storage.logAction('MEMBER_NOTE_ADDED', 'member', `Added care note for member ID ${data.member_id} (Local)`, data.member_id);
    return newNote;
  },

  deleteNote: async (noteId: string): Promise<void> => {
    if (isSupabaseConfigured() && supabase && sanitizeUUID(noteId)) {
      const { error } = await supabase
        .from('member_notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        console.error('Supabase member_notes delete error:', error);
        throw new Error(error.message || 'Failed to delete note from database.');
      }
    }
    storage.deleteMemberNote(noteId);
  }
};
