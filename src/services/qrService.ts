import { QRCodeRecord, QRCodeEntityType, Member, UserProfile } from '../types';
import { storage } from '../lib/storage';

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
  getAll: (): QRCodeRecord[] => {
    return storage.getQRCodes();
  },

  parseQR: (token: string, currentServiceId?: string): DecodedQREntity => {
    const trimmed = token.trim();
    const members = storage.getMembers();
    const servants = storage.getProfiles();

    // Format: member:mbr-1001 or servant:usr-servant-1 or raw KHEDMA-MBR-1001
    let entityType: QRCodeEntityType = 'member';
    let entityId = '';

    if (trimmed.startsWith('servant:')) {
      entityType = 'servant';
      entityId = trimmed.replace('servant:', '');
    } else if (trimmed.startsWith('member:')) {
      entityType = 'member';
      entityId = trimmed.replace('member:', '');
    } else {
      // Legacy or token search
      const memberMatch = members.find(m => m.qr_code.toLowerCase() === trimmed.toLowerCase() || m.id.toLowerCase() === trimmed.toLowerCase());
      if (memberMatch) {
        entityType = 'member';
        entityId = memberMatch.id;
      } else {
        const servantMatch = servants.find(s => s.qr_code?.toLowerCase() === trimmed.toLowerCase() || s.id.toLowerCase() === trimmed.toLowerCase());
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

      const memberServices = member.service_ids || ['srv-prep'];
      const isMismatch = currentServiceId && currentServiceId !== 'all' ? !memberServices.includes(currentServiceId) : false;

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

      const servantServices = servant.service_ids || ['srv-prep'];
      const isMismatch = currentServiceId && currentServiceId !== 'all' ? !servantServices.includes(currentServiceId) : false;

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

    const newToken = `${entityType}:${entityId}-${Date.now().toString().slice(-4)}`;

    if (entityType === 'member') {
      const member = storage.getMemberById(entityId);
      if (member) {
        member.qr_code = newToken;
        storage.saveMember(member);
      }
    } else {
      const servant = storage.getProfileById(entityId);
      if (servant) {
        servant.qr_code = newToken;
        storage.saveProfile(servant);
      }
    }

    storage.saveQRCode({
      id: 'qr-' + entityId,
      entity_type: entityType,
      entity_id: entityId,
      token: newToken,
      status: 'active',
      service_ids: ['srv-prep'],
      created_at: new Date().toISOString(),
    });

    storage.logAction(
      'QR_REGENERATED',
      'qr_code',
      `Regenerated QR badge for ${entityType} ID: ${entityId} with token: ${newToken}`,
      entityId
    );

    return newToken;
  },

  disableQR: async (qrId: string): Promise<void> => {
    const qrs = storage.getQRCodes();
    const qr = qrs.find(q => q.id === qrId);
    if (qr) {
      qr.status = 'disabled';
      storage.saveQRCode(qr);
      storage.logAction('QR_DISABLED', 'qr_code', `Disabled QR badge ${qr.token}`, qrId);
    }
  },

  enableQR: async (qrId: string): Promise<void> => {
    const qrs = storage.getQRCodes();
    const qr = qrs.find(q => q.id === qrId);
    if (qr) {
      qr.status = 'active';
      storage.saveQRCode(qr);
      storage.logAction('QR_ENABLED', 'qr_code', `Enabled QR badge ${qr.token}`, qrId);
    }
  }
};
