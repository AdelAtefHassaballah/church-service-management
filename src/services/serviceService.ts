import { ChurchService, ServiceType, Member, UserProfile, MemberServantAssignment } from '../types';
import { storage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const serviceService = {
  fetchAll: async (): Promise<ChurchService[]> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data) {
          const mapped: ChurchService[] = data.map((row: any) => ({
            id: row.id,
            church_id: row.church_id || 'church-1',
            name: row.name,
            name_ar: row.name_ar,
            description: row.description || undefined,
            description_ar: row.description_ar || undefined,
            service_type: row.service_type || 'preparatory',
            location: row.location || undefined,
            day_of_week: row.day_of_week || undefined,
            start_time: row.start_time || undefined,
            end_time: row.end_time || undefined,
            leader_ids: [],
            servant_ids: [],
            member_ids: [],
            status: row.status || 'active',
            color: row.color || '#026bc7',
            notes: row.notes || undefined,
            created_at: row.created_at || new Date().toISOString(),
          }));
          storage.saveServices(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase services fetch error:', err);
      }
    }
    return storage.getServices();
  },

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
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'srv-' + Date.now();
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

    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('services')
        .insert({
          id: newService.id,
          name: newService.name,
          name_ar: newService.name_ar,
          description: newService.description || null,
          description_ar: newService.description_ar || null,
          service_type: newService.service_type,
          location: newService.location || null,
          day_of_week: newService.day_of_week || null,
          start_time: newService.start_time || null,
          end_time: newService.end_time || null,
          status: newService.status,
          color: newService.color,
          notes: newService.notes || null,
          created_at: newService.created_at,
        })
        .then(({ error }) => {
          if (error) console.warn('Remote Supabase service insert error:', error.message);
        });
    }

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

    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('services')
        .update({
          name: updated.name,
          name_ar: updated.name_ar,
          description: updated.description || null,
          description_ar: updated.description_ar || null,
          service_type: updated.service_type,
          location: updated.location || null,
          day_of_week: updated.day_of_week || null,
          start_time: updated.start_time || null,
          end_time: updated.end_time || null,
          status: updated.status,
          color: updated.color,
          notes: updated.notes || null,
        })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('Remote Supabase service update error:', error.message);
        });
    }

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
        p.service_ids = p.service_ids || [];
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
    if (profile) {
      profile.service_ids = profile.service_ids || [];
      if (!profile.service_ids.includes(serviceId)) {
        profile.service_ids.push(serviceId);
        storage.saveProfile(profile);
      }
    }
  },

  removeServant: (serviceId: string, servantId: string): void => {
    const service = storage.getServiceById(serviceId);
    if (!service) return;
    service.servant_ids = service.servant_ids.filter(id => id !== servantId);
    storage.saveService(service);

    const profile = storage.getProfileById(servantId);
    if (profile) {
      profile.service_ids = (profile.service_ids || []).filter(id => id !== serviceId);
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
        m.service_ids = m.service_ids || [];
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
    if (member) {
      member.service_ids = member.service_ids || [];
      if (!member.service_ids.includes(serviceId)) {
        member.service_ids.push(serviceId);
        storage.saveMember(member);
      }
    }
  },

  removeMember: (serviceId: string, memberId: string): void => {
    const service = storage.getServiceById(serviceId);
    if (!service) return;
    service.member_ids = service.member_ids.filter(id => id !== memberId);
    storage.saveService(service);

    const member = storage.getMemberById(memberId);
    if (member) {
      member.service_ids = (member.service_ids || []).filter(id => id !== serviceId);
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
    member.service_ids = member.service_ids || [];
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

    const serviceMembers = allMembers.filter(m => service?.member_ids.includes(m.id) || (m.service_ids || []).includes(serviceId));
    const serviceServants = allServants.filter(s => service?.servant_ids.includes(s.id) || (s.service_ids || []).includes(serviceId));

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
