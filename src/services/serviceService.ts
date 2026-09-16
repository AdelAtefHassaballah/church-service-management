import { ChurchService, ServiceType, Member, UserProfile, MemberServantAssignment } from '../types';
import { storage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateUUID, sanitizeUUID } from '../lib/uuid';
import { churchService } from './churchService';

export const serviceService = {
  fetchAll: async (): Promise<ChurchService[]> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const [servicesRes, leadersRes, servantsRes, membersRes] = await Promise.allSettled([
          supabase.from('services').select('*').order('name', { ascending: true }),
          supabase.from('service_leaders').select('*'),
          supabase.from('service_servants').select('*'),
          supabase.from('service_members').select('*'),
        ]);

        if (servicesRes.status === 'fulfilled' && !servicesRes.value.error && servicesRes.value.data) {
          const leadersData = leadersRes.status === 'fulfilled' && !leadersRes.value.error ? (leadersRes.value.data || []) : [];
          const servantsData = servantsRes.status === 'fulfilled' && !servantsRes.value.error ? (servantsRes.value.data || []) : [];
          const membersData = membersRes.status === 'fulfilled' && !membersRes.value.error ? (membersRes.value.data || []) : [];

          const activeChurchId = await churchService.getActiveChurchId();

          const mapped: ChurchService[] = servicesRes.value.data.map((row: any) => {
            const srvId = row.id;
            const leaderIds = leadersData
              .filter((l: any) => l.service_id === srvId)
              .map((l: any) => l.leader_id);
            const servantIds = servantsData
              .filter((s: any) => s.service_id === srvId)
              .map((s: any) => s.servant_id);
            const memberIds = membersData
              .filter((m: any) => m.service_id === srvId)
              .map((m: any) => m.member_id);

            return {
              id: srvId,
              church_id: sanitizeUUID(row.church_id) || activeChurchId,
              name: row.name,
              name_ar: row.name_ar,
              description: row.description || undefined,
              description_ar: row.description_ar || undefined,
              service_type: row.service_type || 'preparatory',
              location: row.location || undefined,
              day_of_week: row.day_of_week || undefined,
              start_time: row.start_time || undefined,
              end_time: row.end_time || undefined,
              leader_ids: leaderIds,
              servant_ids: servantIds,
              member_ids: memberIds,
              status: row.status || 'active',
              color: row.color || '#2563eb',
              notes: row.notes || undefined,
              created_at: row.created_at || new Date().toISOString(),
            };
          });

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

  create: async (data: {
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
  }): Promise<ChurchService> => {
    const newId = generateUUID();
    const churchId = await churchService.getActiveChurchId();
    const newService: ChurchService = {
      ...data,
      id: newId,
      church_id: churchId,
      leader_ids: data.leader_ids || [],
      servant_ids: data.servant_ids || [],
      member_ids: data.member_ids || [],
      status: data.status || 'active',
      color: data.color || '#2563eb',
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
          church_id: sanitizeUUID(newService.church_id),
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
        .then(async ({ error }) => {
          if (error) {
            console.warn('Remote Supabase service insert error:', error.message);
            return;
          }
          const client = supabase;
          if (!client) return;

          // Populate junction tables
          if (newService.leader_ids.length > 0) {
            const leaderInserts = newService.leader_ids
              .filter(lid => sanitizeUUID(lid))
              .map(lid => ({ service_id: newService.id, leader_id: lid }));
            if (leaderInserts.length > 0) {
              await client.from('service_leaders').insert(leaderInserts);
            }
          }
          if (newService.servant_ids.length > 0) {
            const servantInserts = newService.servant_ids
              .filter(sid => sanitizeUUID(sid))
              .map(sid => ({ service_id: newService.id, servant_id: sid }));
            if (servantInserts.length > 0) {
              await client.from('service_servants').insert(servantInserts);
            }
          }
          if (newService.member_ids.length > 0) {
            const memberInserts = newService.member_ids
              .filter(mid => sanitizeUUID(mid))
              .map(mid => ({ service_id: newService.id, member_id: mid }));
            if (memberInserts.length > 0) {
              await client.from('service_members').insert(memberInserts);
            }
          }
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

    if (isSupabaseConfigured() && supabase && sanitizeUUID(id)) {
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

    if (isSupabaseConfigured() && supabase && sanitizeUUID(serviceId)) {
      (async () => {
        try {
          await supabase.from('service_servants').delete().eq('service_id', serviceId);
          const inserts = servantIds.filter(sid => sanitizeUUID(sid)).map(sid => ({
            service_id: serviceId,
            servant_id: sid,
          }));
          if (inserts.length > 0) {
            await supabase.from('service_servants').insert(inserts);
          }
        } catch (err) {
          console.warn('Supabase assignServants sync error:', err);
        }
      })();
    }
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

    if (isSupabaseConfigured() && supabase && sanitizeUUID(serviceId) && sanitizeUUID(servantId)) {
      supabase
        .from('service_servants')
        .insert({ service_id: serviceId, servant_id: servantId })
        .then(({ error }) => {
          if (error && !error.message?.includes('duplicate')) {
            console.warn('Supabase service_servants insert error:', error.message);
          }
        });
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

    if (isSupabaseConfigured() && supabase && sanitizeUUID(serviceId) && sanitizeUUID(servantId)) {
      supabase
        .from('service_servants')
        .delete()
        .eq('service_id', serviceId)
        .eq('servant_id', servantId)
        .then(({ error }) => {
          if (error) console.warn('Supabase service_servants delete error:', error.message);
        });
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

    if (isSupabaseConfigured() && supabase && sanitizeUUID(serviceId)) {
      (async () => {
        try {
          await supabase.from('service_members').delete().eq('service_id', serviceId);
          const inserts = memberIds.filter(mid => sanitizeUUID(mid)).map(mid => ({
            service_id: serviceId,
            member_id: mid,
          }));
          if (inserts.length > 0) {
            await supabase.from('service_members').insert(inserts);
          }
        } catch (err) {
          console.warn('Supabase assignMembers sync error:', err);
        }
      })();
    }
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

    if (isSupabaseConfigured() && supabase && sanitizeUUID(serviceId) && sanitizeUUID(memberId)) {
      supabase
        .from('service_members')
        .insert({ service_id: serviceId, member_id: memberId })
        .then(({ error }) => {
          if (error && !error.message?.includes('duplicate')) {
            console.warn('Supabase service_members insert error:', error.message);
          }
        });
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

    if (isSupabaseConfigured() && supabase && sanitizeUUID(serviceId) && sanitizeUUID(memberId)) {
      supabase
        .from('service_members')
        .delete()
        .eq('service_id', serviceId)
        .eq('member_id', memberId)
        .then(({ error }) => {
          if (error) console.warn('Supabase service_members delete error:', error.message);
        });
    }
  },

  getMemberServantAssignments: (serviceId: string): MemberServantAssignment[] => {
    const allMembers = storage.getMembers().filter(m => m.service_ids?.includes(serviceId) && m.assigned_servant_id);
    return allMembers.map(m => ({
      id: generateUUID(),
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

    if (isSupabaseConfigured() && supabase) {
      const sanitizedSrv = sanitizeUUID(serviceId);
      const sanitizedServant = sanitizeUUID(servantId);
      const sanitizedMember = sanitizeUUID(memberId);

      // Update member's assigned servant
      if (sanitizedMember) {
        supabase
          .from('members')
          .update({
            assigned_servant_id: sanitizedServant,
            service_ids: member.service_ids,
          })
          .eq('id', sanitizedMember)
          .then(({ error }) => {
            if (error) console.warn('Supabase member assigned_servant_id update error:', error.message);
          });
      }

      // Upsert into member_servant_assignments
      if (sanitizedSrv && sanitizedServant && sanitizedMember) {
        supabase
          .from('member_servant_assignments')
          .upsert({
            service_id: sanitizedSrv,
            servant_id: sanitizedServant,
            member_id: sanitizedMember,
            created_at: new Date().toISOString(),
          }, { onConflict: 'service_id,servant_id,member_id' })
          .then(({ error }) => {
            if (error) console.warn('Supabase member_servant_assignments upsert error:', error.message);
          });
      }
    }
  },

  removeMemberServantAssignment: (serviceId: string, servantId: string, memberId: string): void => {
    const member = storage.getMemberById(memberId);
    if (!member) return;

    if (member.assigned_servant_id === servantId) {
      member.assigned_servant_id = undefined;
      storage.saveMember(member);
    }

    if (isSupabaseConfigured() && supabase) {
      const sanitizedSrv = sanitizeUUID(serviceId);
      const sanitizedServant = sanitizeUUID(servantId);
      const sanitizedMember = sanitizeUUID(memberId);

      if (sanitizedMember) {
        supabase
          .from('members')
          .update({ assigned_servant_id: null })
          .eq('id', sanitizedMember)
          .then(({ error }) => {
            if (error) console.warn('Supabase remove assignment from member error:', error.message);
          });
      }

      if (sanitizedSrv && sanitizedServant && sanitizedMember) {
        supabase
          .from('member_servant_assignments')
          .delete()
          .eq('service_id', sanitizedSrv)
          .eq('servant_id', sanitizedServant)
          .eq('member_id', sanitizedMember)
          .then(({ error }) => {
            if (error) console.warn('Supabase member_servant_assignments delete error:', error.message);
          });
      }
    }
  },

  getServiceStats: (serviceId: string) => {
    const service = storage.getServiceById(serviceId);
    const allMembers = storage.getMembers();
    const allServants = storage.getProfiles();
    const allAttendance = storage.getAttendance().filter(a => a.service_id === serviceId);
    const allLessons = storage.getLessons().filter(l => l.service_id === serviceId);
    const allTasks = storage.getTasks().filter(t => t.service_id === serviceId);
    const allEvents = storage.getEvents().filter(e => e.service_id === serviceId);

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
