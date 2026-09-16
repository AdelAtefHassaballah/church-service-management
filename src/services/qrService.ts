import { QRCodeRecord, QRCodeEntityType, Member, UserProfile } from '../types';
import { storage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateUUID, sanitizeUUID } from '../lib/uuid';

export interface DecodedQREntity {
  entityType: QRCodeEntityType;
  entityId: string;
  member?: Member;
  servant?: UserProfile;
  isValid: boolean;
  isServiceMismatch?: boolean;
  assignedServices: string[];
}

export const qrService = {
  fetchAll: async (): Promise<QRCodeRecord[]> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('qr_codes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped: QRCodeRecord[] = data.map((q: any) => ({
            id: q.id,
            entity_type: q.entity_type,
            entity_id: q.entity_id,
            token: q.token,
            status: q.status || 'active',
            service_ids: Array.isArray(q.service_ids) ? q.service_ids : [],
            created_at: q.created_at || new Date().toISOString(),
            last_scanned_at: q.last_scanned_at || undefined,
          }));
          mapped.forEach((q) => storage.saveQRCode(q));
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase fetch qr_codes error:', err);
      }
    }
    return storage.getQRCodes();
  },

  getAll: (): QRCodeRecord[] => {
    return storage.getQRCodes();
  },

  parseQR: (token: string, currentServiceId?: string): DecodedQREntity => {
    const trimmed = token.trim();
    const members = storage.getMembers();
    const servants = storage.getProfiles();

    // Format: member:<id> or servant:<id> or MEM-<id> or SRV-<id> or raw ID
    let entityType: QRCodeEntityType = 'member';
    let entityId = '';

    if (trimmed.startsWith('SRV-') || trimmed.startsWith('servant:')) {
      entityType = 'servant';
      entityId = trimmed.replace('SRV-', '').replace('servant:', '');
    } else if (trimmed.startsWith('MEM-') || trimmed.startsWith('member:')) {
      entityType = 'member';
      entityId = trimmed.replace('MEM-', '').replace('member:', '');
    } else {
      // Direct token search in members
      const memberMatch = members.find(m => 
        (m.qr_code && m.qr_code.toLowerCase() === trimmed.toLowerCase()) || 
        m.id.toLowerCase() === trimmed.toLowerCase()
      );
      if (memberMatch) {
        entityType = 'member';
        entityId = memberMatch.id;
      } else {
        const servantMatch = servants.find(s => 
          (s.qr_code && s.qr_code.toLowerCase() === trimmed.toLowerCase()) || 
          s.id.toLowerCase() === trimmed.toLowerCase()
        );
        if (servantMatch) {
          entityType = 'servant';
          entityId = servantMatch.id;
        } else {
          return { entityType: 'member', entityId: '', isValid: false, assignedServices: [] };
        }
      }
    }

    if (entityType === 'member') {
      const member = members.find(m => m.id === entityId || m.qr_code === trimmed);
      if (!member) return { entityType: 'member', entityId, isValid: false, assignedServices: [] };

      const memberServices = member.service_ids && member.service_ids.length > 0
        ? member.service_ids
        : [];

      const isMismatch = currentServiceId && currentServiceId !== 'all'
        ? !memberServices.includes(currentServiceId)
        : false;

      return {
        entityType: 'member',
        entityId: member.id,
        member,
        isValid: true,
        isServiceMismatch: isMismatch,
        assignedServices: memberServices,
      };
    } else {
      const servant = servants.find(s => s.id === entityId || s.qr_code === trimmed);
      if (!servant) return { entityType: 'servant', entityId, isValid: false, assignedServices: [] };

      const servantServices = servant.service_ids && servant.service_ids.length > 0
        ? servant.service_ids
        : [];

      const isMismatch = currentServiceId && currentServiceId !== 'all'
        ? !servantServices.includes(currentServiceId)
        : false;

      return {
        entityType: 'servant',
        entityId: servant.id,
        servant,
        isValid: true,
        isServiceMismatch: isMismatch,
        assignedServices: servantServices,
      };
    }
  },

  verifyServiceEnrollment: (entityId: string, serviceId: string, entityType: 'member' | 'servant'): boolean => {
    if (!serviceId || serviceId === 'all') return true;
    if (entityType === 'member') {
      const member = storage.getMemberById(entityId);
      return !!member?.service_ids?.includes(serviceId);
    } else {
      const servant = storage.getProfileById(entityId);
      return !!servant?.service_ids?.includes(serviceId);
    }
  },

  regenerateQR: (entityTypeOrId: string, entityIdOrType?: string): string => {
    let entityType: QRCodeEntityType = 'member';
    let entityId = '';

    if (entityTypeOrId === 'member' || entityTypeOrId === 'servant' || entityTypeOrId === 'user') {
      entityType = entityTypeOrId as QRCodeEntityType;
      entityId = entityIdOrType || '';
    } else {
      entityId = entityTypeOrId;
      entityType = (entityIdOrType as QRCodeEntityType) || 'member';
    }

    // Token format: member:<id> or servant:<id>
    const prefix = entityType === 'servant' ? 'servant' : 'member';
    const newToken = `${prefix}:${entityId}`;
    const newRecordId = generateUUID();

    let serviceIds: string[] = [];

    if (entityType === 'member') {
      const member = storage.getMemberById(entityId);
      if (member) {
        member.qr_code = newToken;
        serviceIds = member.service_ids || [];
        storage.saveMember(member);
      }
    } else {
      const servant = storage.getProfileById(entityId);
      if (servant) {
        servant.qr_code = newToken;
        serviceIds = servant.service_ids || [];
        storage.saveProfile(servant);
      }
    }

    const qrRecord: QRCodeRecord = {
      id: newRecordId,
      entity_type: entityType,
      entity_id: entityId,
      token: newToken,
      status: 'active',
      service_ids: serviceIds,
      created_at: new Date().toISOString(),
    };

    storage.saveQRCode(qrRecord);

    storage.logAction(
      'QR_REGENERATED',
      'qr_code',
      `Regenerated opaque QR badge for ${entityType} ID: ${entityId}`,
      entityId
    );

    if (isSupabaseConfigured() && supabase) {
      const sanitizedEntityId = sanitizeUUID(entityId);
      if (sanitizedEntityId) {
        supabase
          .from('qr_codes')
          .upsert({
            id: qrRecord.id,
            entity_type: qrRecord.entity_type,
            entity_id: sanitizedEntityId,
            token: qrRecord.token,
            status: qrRecord.status,
            service_ids: qrRecord.service_ids,
            created_at: qrRecord.created_at,
          }, { onConflict: 'token' })
          .then(({ error }) => {
            if (error) console.warn('Supabase qr_codes upsert error:', error.message);
          });
      }
    }

    return newToken;
  },

  disableQR: async (qrId: string): Promise<void> => {
    const qrs = storage.getQRCodes();
    const qr = qrs.find(q => q.id === qrId);
    if (qr) {
      qr.status = 'disabled';
      storage.saveQRCode(qr);
      storage.logAction('QR_DISABLED', 'qr_code', `Disabled QR badge ${qr.token}`, qrId);

      if (isSupabaseConfigured() && supabase && sanitizeUUID(qrId)) {
        supabase
          .from('qr_codes')
          .update({ status: 'disabled' })
          .eq('id', qrId)
          .then(({ error }) => {
            if (error) console.warn('Supabase qr_codes disable error:', error.message);
          });
      }
    }
  },

  enableQR: async (qrId: string): Promise<void> => {
    const qrs = storage.getQRCodes();
    const qr = qrs.find(q => q.id === qrId);
    if (qr) {
      qr.status = 'active';
      storage.saveQRCode(qr);
      storage.logAction('QR_ENABLED', 'qr_code', `Enabled QR badge ${qr.token}`, qrId);

      if (isSupabaseConfigured() && supabase && sanitizeUUID(qrId)) {
        supabase
          .from('qr_codes')
          .update({ status: 'active' })
          .eq('id', qrId)
          .then(({ error }) => {
            if (error) console.warn('Supabase qr_codes enable error:', error.message);
          });
      }
    }
  }
};
