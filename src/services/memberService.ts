import { Member, MemberNote } from '../types';
import { storage } from '../lib/storage';

export const memberService = {
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
    const randomId = 'mbr-' + (Math.floor(1000 + Math.random() * 9000));
    const newMember: Member = {
      ...memberData,
      id: randomId,
      qr_code: `KHEDMA-${randomId.toUpperCase()}`,
      created_at: new Date().toISOString(),
    };
    storage.saveMember(newMember);
    storage.logAction('MEMBER_CREATED', 'member', `Added new member: ${newMember.full_name} (${newMember.arabic_name})`, newMember.id);
    return newMember;
  },

  update: (id: string, updates: Partial<Member>): Member | null => {
    const existing = storage.getMemberById(id);
    if (!existing) return null;
    const updated: Member = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    storage.saveMember(updated);
    storage.logAction('MEMBER_UPDATED', 'member', `Updated details for ${updated.full_name}`, updated.id);
    return updated;
  },

  delete: (id: string) => {
    const existing = storage.getMemberById(id);
    if (existing) {
      storage.deleteMember(id);
      storage.logAction('MEMBER_DELETED', 'member', `Deleted member: ${existing.full_name}`, id);
    }
  },

  regenerateQR: (id: string): string => {
    const existing = storage.getMemberById(id);
    if (!existing) return '';
    const newQR = `KHEDMA-${id.toUpperCase()}-${Date.now().toString().slice(-4)}`;
    existing.qr_code = newQR;
    storage.saveMember(existing);
    storage.logAction('MEMBER_QR_REGENERATED', 'member', `Regenerated QR badge for ${existing.full_name}`, id);
    return newQR;
  }
};
