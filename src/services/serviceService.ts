import { ChurchService, ServiceType, Member, UserProfile, MemberServantAssignment } from '../types';
import { storage } from '../lib/storage';

export const serviceService = {
  getAll: (): ChurchService[] => {
    return storage.getServices();
  },

  getById: (id: string): ChurchService | undefined => {
    return storage.getServiceById(id);
  },

  create: (data: {
    name: string;
    name_ar: string;
    description?: string;
    description_ar?: string;
    service_type: ServiceType;
    location?: string;
    day_of_week?: any;
    start_time?: string;
    end_time?: string;
    leader_ids?: string[];
    servant_ids?: string[];
    member_ids?: string[];
    status?: 'active' | 'disabled';
    color?: string;
    notes?: string;
  }): ChurchService => {
    const newId = 'srv-' + Date.now();
    const newService: ChurchService = {
      ...data,
      id: newId,
      church_id: 'church-1',
      leader_ids: data.leader_ids || [],
      servant_ids: data.servant_ids || [],
      member_ids: data.member_ids || [],
      status: data.status || 'active',
      color: data.color || '#026bc7',
      created_at: new Date().toISOString(),
    };

    storage.saveService(newService);
    storage.logAction(
      'SERVICE_CREATED',
      'service',
      `Super Admin created new Church Service: "${newService.name}" (${newService.name_ar})`,
      newService.id
    );

    return newService;
  },

  update: (id: string, updates: Partial<ChurchService>): ChurchService | null => {
    const existing = storage.getServiceById(id);
    if (!existing) return null;

    const updated: ChurchService = {
      ...existing,
      ...updates,
    };

    storage.saveService(updated);
    storage.logAction('SERVICE_UPDATED', 'service', `Updated details for service "${updated.name}"`, id);
    return updated;
  },

  assignServants: (serviceId: string, servantIds: string[]): void => {
    const service = storage.getServiceById(serviceId);
    if (!service) return;

    service.servant_ids = servantIds;
    storage.saveService(service);

    const profiles = storage.getProfiles();
    for (const p of profiles) {
      if (servantIds.includes(p.id)) {
        if (!p.service_ids.includes(serviceId)) {
          p.service_ids.push(serviceId);
          storage.saveProfile(p);
        }
      }
    }

    storage.logAction(
      'SERVICE_SERVANTS_ASSIGNED',
      'service',
      `Updated servant assignments for "${service.name}" (${servantIds.length} servants)`,
      serviceId
    );
  },

  assignServant: (serviceId: string, servantId: string): void => {
    const service = storage.getServiceById(serviceId);
    if (!service) return;
    if (!service.servant_ids.includes(servantId)) {
      service.servant_ids.push(servantId);
      storage.saveService(service);
    }
    const profile = storage.getProfileById(servantId);
    if (profile && !profile.service_ids.includes(serviceId)) {
      profile.service_ids.push(serviceId);
      storage.saveProfile(profile);
    }
  },

  removeServant: (serviceId: string, servantId: string): void => {
    const service = storage.getServiceById(serviceId);
    if (!service) return;
    service.servant_ids = service.servant_ids.filter(id => id !== servantId);
    storage.saveService(service);

    const profile = storage.getProfileById(servantId);
    if (profile) {
      profile.service_ids = profile.service_ids.filter(id => id !== serviceId);
      storage.saveProfile(profile);
    }
  },

  assignMembers: (serviceId: string, memberIds: string[]): void => {
    const service = storage.getServiceById(serviceId);
    if (!service) return;

    service.member_ids = memberIds;
    storage.saveService(service);

    const members = storage.getMembers();
    for (const m of members) {
      if (memberIds.includes(m.id)) {
        if (!m.service_ids.includes(serviceId)) {
          m.service_ids.push(serviceId);
          storage.saveMember(m);
        }
      }
    }

    storage.logAction(
      'SERVICE_MEMBERS_ASSIGNED',
      'service',
      `Updated member enrollment for "${service.name}" (${memberIds.length} members)`,
      serviceId
    );
  },

  assignMember: (serviceId: string, memberId: string): void => {
    const service = storage.getServiceById(serviceId);
    if (!service) return;
    if (!service.member_ids.includes(memberId)) {
      service.member_ids.push(memberId);
      storage.saveService(service);
    }
    const member = storage.getMemberById(memberId);
    if (member && !member.service_ids.includes(serviceId)) {
      member.service_ids.push(serviceId);
      storage.saveMember(member);
    }
  },

  removeMember: (serviceId: string, memberId: string): void => {
    const service = storage.getServiceById(serviceId);
    if (!service) return;
    service.member_ids = service.member_ids.filter(id => id !== memberId);
    storage.saveService(service);

    const member = storage.getMemberById(memberId);
    if (member) {
      member.service_ids = member.service_ids.filter(id => id !== serviceId);
      storage.saveMember(member);
    }
  },

  getMemberServantAssignments: (serviceId: string): MemberServantAssignment[] => {
    const allMembers = storage.getMembers().filter(m => m.service_ids?.includes(serviceId) && m.assigned_servant_id);
    return allMembers.map(m => ({
      id: `msa-${m.id}-${m.assigned_servant_id}`,
      service_id: serviceId,
      servant_id: m.assigned_servant_id!,
      member_id: m.id,
      created_at: m.created_at,
    }));
  },

  assignMemberToServant: (serviceId: string, servantId: string, memberId: string): void => {
    const member = storage.getMemberById(memberId);
    if (!member) return;

    member.assigned_servant_id = servantId;
    if (!member.service_ids.includes(serviceId)) {
      member.service_ids.push(serviceId);
    }
    storage.saveMember(member);

    const servant = storage.getProfileById(servantId);
    storage.logAction(
      'MEMBER_SERVANT_ASSIGNED',
      'assignment',
      `Assigned member ${member.full_name} to servant ${servant?.name || servantId} in service ${serviceId}`,
      memberId
    );
  },

  removeMemberServantAssignment: (serviceId: string, servantId: string, memberId: string): void => {
    const member = storage.getMemberById(memberId);
    if (!member) return;

    if (member.assigned_servant_id === servantId) {
      member.assigned_servant_id = undefined;
      storage.saveMember(member);
    }
  },

  getServiceStats: (serviceId: string) => {
    const service = storage.getServiceById(serviceId);
    const allMembers = storage.getMembers();
    const allServants = storage.getProfiles();
    const allAttendance = storage.getAttendance().filter(a => a.service_id === serviceId || (!a.service_id && serviceId === 'srv-prep'));
    const allLessons = storage.getLessons().filter(l => l.service_id === serviceId || (!l.service_id && serviceId === 'srv-prep'));
    const allTasks = storage.getTasks().filter(t => t.service_id === serviceId || (!t.service_id && serviceId === 'srv-prep'));
    const allEvents = storage.getEvents().filter(e => e.service_id === serviceId || (!e.service_id && serviceId === 'srv-prep'));

    const serviceMembers = allMembers.filter(m => service?.member_ids.includes(m.id) || m.service_ids.includes(serviceId));
    const serviceServants = allServants.filter(s => service?.servant_ids.includes(s.id) || s.service_ids.includes(serviceId));

    const presentAttendance = allAttendance.filter(a => a.status === 'present');
    const attendanceRate = allAttendance.length > 0 ? Math.round((presentAttendance.length / allAttendance.length) * 100) : 85;
    const attendanceThisWeek = Math.round(serviceMembers.length * (attendanceRate / 100));
    const absentMembers = Math.max(0, serviceMembers.length - attendanceThisWeek);

    return {
      totalMembers: serviceMembers.length,
      totalServants: serviceServants.length,
      totalAttendanceRecords: allAttendance.length,
      attendanceRate,
      attendanceThisWeek,
      absentMembers,
      lessonsSubmitted: allLessons.filter(l => l.status === 'submitted').length,
      missingLessons: allLessons.filter(l => l.status === 'missing').length,
      pendingTasks: allTasks.filter(t => t.status !== 'completed').length,
      upcomingEvents: allEvents.length,
    };
  },

  getDashboardStats: (serviceId: string) => {
    return serviceService.getServiceStats(serviceId);
  }
};
