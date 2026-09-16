import { AttendanceRecord, AttendanceStatus, Member } from '../types';
import { storage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateUUID, sanitizeUUID } from '../lib/uuid';
import { churchService } from './churchService';

export interface AbsentMemberSummary {
  member: Member;
  lastAttendedDate?: string;
  consecutiveAbsences: number;
  totalPresent: number;
  totalAbsences: number;
  attendanceRate: number;
}

export const attendanceService = {
  getAll: async (): Promise<AttendanceRecord[]> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('*')
          .order('date', { ascending: false });
        if (!error && data) {
          const activeChurchId = await churchService.getActiveChurchId();
          const mapped: AttendanceRecord[] = data.map((r: any) => ({
            id: r.id,
            church_id: sanitizeUUID(r.church_id) || activeChurchId,
            service_id: r.service_id,
            group_id: r.group_id || undefined,
            session_name: r.session_name || 'Regular Meeting',
            member_id: r.member_id,
            date: r.date,
            status: r.status || 'present',
            recorded_by: sanitizeUUID(r.recorded_by) || undefined,
            notes: r.notes || undefined,
            method: (r.method === 'qr_scan' ? 'qr_scan' : 'manual'),
            created_at: r.created_at || new Date().toISOString(),
          }));
          mapped.forEach((r) => storage.saveAttendanceRecord(r));
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase attendance fetch error, fallback local:', err);
      }
    }
    return storage.getAttendance();
  },

  getByServiceAndDate: (serviceId: string, date: string, sessionName?: string): AttendanceRecord[] => {
    return storage.getAttendance().filter(r => {
      const matchDate = r.date === date;
      const matchService = !serviceId || serviceId === 'all' || r.service_id === serviceId;
      const matchSession = !sessionName || sessionName === 'all' || r.session_name === sessionName;
      return matchDate && matchService && matchSession;
    });
  },

  getByGroupAndDate: (groupId: string, date: string): AttendanceRecord[] => {
    return storage.getAttendance().filter(
      r => (groupId === 'all' || r.group_id === groupId) && r.date === date
    );
  },

  getMemberHistory: (memberId: string): AttendanceRecord[] => {
    return storage.getAttendance()
      .filter(r => r.member_id === memberId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  checkDuplicate: (memberId: string, serviceId: string, date: string, sessionName: string = 'Regular Meeting'): AttendanceRecord | undefined => {
    return storage.getAttendance().find(
      r => r.member_id === memberId &&
           r.service_id === serviceId &&
           r.date === date &&
           (r.session_name || 'Regular Meeting') === sessionName
    );
  },

  saveRecord: async (
    memberId: string,
    groupId: string,
    date: string,
    status: AttendanceStatus,
    recordedBy?: string,
    method: 'manual' | 'qr_scan' = 'manual',
    serviceId?: string,
    sessionName: string = 'Regular Meeting',
    notes?: string
  ): Promise<AttendanceRecord> => {
    const churchId = await churchService.getActiveChurchId();
    const defaultSrv = storage.getServices()[0]?.id || churchId;
    const finalServiceId = serviceId || defaultSrv;
    const existing = attendanceService.checkDuplicate(memberId, finalServiceId, date, sessionName);

    const record: AttendanceRecord = {
      id: existing ? existing.id : generateUUID(),
      church_id: churchId,
      service_id: finalServiceId,
      session_name: sessionName,
      group_id: groupId || undefined,
      member_id: memberId,
      date,
      status,
      recorded_by: recordedBy,
      method,
      notes: notes !== undefined ? notes : existing?.notes,
      created_at: existing ? existing.created_at : new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const sanitizedMember = sanitizeUUID(memberId);
      const sanitizedService = sanitizeUUID(finalServiceId);
      const sanitizedRecordedBy = sanitizeUUID(recordedBy);

      if (sanitizedMember && sanitizedService) {
        try {
          const { data, error } = await supabase
            .from('attendance_records')
            .upsert({
              id: record.id,
              church_id: sanitizeUUID(record.church_id),
              service_id: sanitizedService,
              session_name: record.session_name,
              group_id: record.group_id || null,
              member_id: sanitizedMember,
              date: record.date,
              status: record.status,
              recorded_by: sanitizedRecordedBy,
              method: record.method,
              notes: record.notes || null,
              created_at: record.created_at,
            }, { onConflict: 'member_id,service_id,date,session_name' })
            .select()
            .single();

          if (!error && data) {
            const saved: AttendanceRecord = {
              ...record,
              id: data.id,
            };
            storage.saveAttendanceRecord(saved);
            return saved;
          }
        } catch (err) {
          console.warn('Supabase attendance upsert error, fallback local:', err);
        }
      }
    }

    storage.saveAttendanceRecord(record);
    return record;
  },

  saveBulk: async (records: Omit<AttendanceRecord, 'id' | 'church_id' | 'created_at'>[]): Promise<void> => {
    const activeUser = storage.getActiveUser();
    const churchId = await churchService.getActiveChurchId();
    const defaultSrv = storage.getServices()[0]?.id || churchId;

    const formattedRecords: AttendanceRecord[] = records.map(r => ({
      ...r,
      id: generateUUID(),
      church_id: churchId,
      service_id: r.service_id || defaultSrv,
      session_name: r.session_name || 'Regular Meeting',
      created_at: new Date().toISOString(),
    }));

    if (isSupabaseConfigured() && supabase) {
      try {
        const payload = formattedRecords
          .filter(r => sanitizeUUID(r.member_id) && sanitizeUUID(r.service_id))
          .map(r => ({
            id: r.id,
            church_id: sanitizeUUID(r.church_id),
            service_id: sanitizeUUID(r.service_id)!,
            session_name: r.session_name || 'Regular Meeting',
            group_id: r.group_id || null,
            member_id: sanitizeUUID(r.member_id)!,
            date: r.date,
            status: r.status,
            recorded_by: sanitizeUUID(r.recorded_by),
            method: r.method,
            notes: r.notes || null,
            created_at: r.created_at,
          }));

        if (payload.length > 0) {
          await supabase.from('attendance_records').upsert(payload, {
            onConflict: 'member_id,service_id,date,session_name',
          });
        }
      } catch (err) {
        console.warn('Supabase bulk attendance upsert error:', err);
      }
    }

    storage.saveAttendanceBulk(formattedRecords);
    storage.logAction(
      'ATTENDANCE_BULK_SAVED',
      'attendance',
      `Saved attendance for ${formattedRecords.length} members by ${activeUser?.name || 'User'}`
    );
  },

  getAbsentMembersForDate: (date: string, serviceId?: string, sessionName?: string): AbsentMemberSummary[] => {
    let allMembers = storage.getMembers().filter(m => m.status === 'active');
    if (serviceId && serviceId !== 'all') {
      allMembers = allMembers.filter(m => m.service_ids?.includes(serviceId));
    }

    const allAttendance = storage.getAttendance();
    const result: AbsentMemberSummary[] = [];

    // Distinct past dates sorted descending
    const allDates = Array.from(new Set(allAttendance.map(a => a.date)))
      .filter(d => new Date(d) <= new Date(date))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    for (const member of allMembers) {
      const targetRecord = allAttendance.find(
        r => r.member_id === member.id &&
             r.date === date &&
             (!serviceId || serviceId === 'all' || r.service_id === serviceId) &&
             (!sessionName || sessionName === 'all' || r.session_name === sessionName)
      );

      // If status is marked absent or no record exists for this date, consider absent
      const isAbsentOnDate = targetRecord ? targetRecord.status === 'absent' : true;

      if (isAbsentOnDate) {
        let consecutive = 0;
        for (const pastDate of allDates) {
          const rec = allAttendance.find(
            r => r.member_id === member.id &&
                 r.date === pastDate &&
                 (!serviceId || serviceId === 'all' || r.service_id === serviceId)
          );
          if (!rec || rec.status === 'absent') {
            consecutive++;
          } else {
            break;
          }
        }

        const memberRecords = allAttendance.filter(
          r => r.member_id === member.id && (!serviceId || serviceId === 'all' || r.service_id === serviceId)
        );
        const totalPresent = memberRecords.filter(r => r.status === 'present').length;
        const totalAbsences = memberRecords.filter(r => r.status === 'absent').length;
        const totalMarked = memberRecords.length;
        const attendanceRate = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;

        const lastPresentRecord = memberRecords
          .filter(r => r.status === 'present')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        result.push({
          member,
          lastAttendedDate: lastPresentRecord?.date,
          consecutiveAbsences: Math.max(1, consecutive),
          totalPresent,
          totalAbsences,
          attendanceRate,
        });
      }
    }

    return result.sort((a, b) => b.consecutiveAbsences - a.consecutiveAbsences);
  },

  getAvailableDates: (): string[] => {
    const dates = storage.getAttendance().map(a => a.date);
    const today = new Date().toISOString().split('T')[0];
    dates.push(today);
    return Array.from(new Set(dates)).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }
};
