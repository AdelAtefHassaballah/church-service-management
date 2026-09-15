import { AttendanceRecord, AttendanceStatus, Member } from '../types';
import { storage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
          data.forEach((r: any) => storage.saveAttendanceRecord(r));
          return data as AttendanceRecord[];
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
    recordedBy: string,
    method: 'manual' | 'qr_scan' = 'manual',
    serviceId: string = 'srv-prep',
    sessionName: string = 'Regular Meeting',
    notes?: string
  ): Promise<AttendanceRecord> => {
    const existing = attendanceService.checkDuplicate(memberId, serviceId, date, sessionName);

    const record: AttendanceRecord = {
      id: existing ? existing.id : 'att-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      church_id: 'church-1',
      service_id: serviceId,
      session_name: sessionName,
      group_id: groupId,
      member_id: memberId,
      date,
      status,
      recorded_by: recordedBy,
      method,
      notes: notes !== undefined ? notes : existing?.notes,
      created_at: existing ? existing.created_at : new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('attendance_records')
          .upsert({
            id: record.id,
            church_id: record.church_id,
            service_id: record.service_id,
            session_name: record.session_name,
            group_id: record.group_id,
            member_id: record.member_id,
            date: record.date,
            status: record.status,
            recorded_by: record.recorded_by,
            method: record.method,
            notes: record.notes,
          })
          .select()
          .single();

        if (!error && data) {
          storage.saveAttendanceRecord(data as AttendanceRecord);
          return data as AttendanceRecord;
        }
      } catch (err) {
        console.warn('Supabase attendance upsert error, fallback local:', err);
      }
    }

    storage.saveAttendanceRecord(record);
    return record;
  },

  saveBulk: async (records: Omit<AttendanceRecord, 'id' | 'church_id' | 'created_at'>[]): Promise<void> => {
    const activeUser = storage.getActiveUser();
    const formattedRecords: AttendanceRecord[] = records.map(r => ({
      ...r,
      id: 'att-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
      church_id: 'church-1',
      service_id: r.service_id || 'srv-prep',
      session_name: r.session_name || 'Regular Meeting',
      created_at: new Date().toISOString(),
    }));

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('attendance_records').upsert(
          formattedRecords.map(r => ({
            id: r.id,
            church_id: r.church_id,
            service_id: r.service_id,
            session_name: r.session_name,
            group_id: r.group_id,
            member_id: r.member_id,
            date: r.date,
            status: r.status,
            recorded_by: r.recorded_by,
            method: r.method,
            notes: r.notes
          }))
        );
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
