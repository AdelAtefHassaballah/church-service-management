import { AttendanceRecord, AttendanceStatus, Member } from '../types';
import { storage } from '../lib/storage';

export interface AbsentMemberSummary {
  member: Member;
  lastAttendedDate?: string;
  consecutiveAbsences: number;
  totalPresent: number;
  totalAbsences: number;
  attendanceRate: number;
}

export const attendanceService = {
  getAll: (): AttendanceRecord[] => {
    return storage.getAttendance();
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

  saveRecord: (
    memberId: string,
    groupId: string,
    date: string,
    status: AttendanceStatus,
    recordedBy: string,
    method: 'manual' | 'qr_scan' = 'manual',
    notes?: string
  ): AttendanceRecord => {
    const existing = storage.getAttendance().find(
      r => r.member_id === memberId && r.date === date
    );

    const record: AttendanceRecord = {
      id: existing ? existing.id : 'att-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      church_id: 'church-1',
      group_id: groupId,
      member_id: memberId,
      date,
      status,
      recorded_by: recordedBy,
      method,
      notes: notes !== undefined ? notes : existing?.notes,
      created_at: existing ? existing.created_at : new Date().toISOString(),
    };

    storage.saveAttendanceRecord(record);
    return record;
  },

  saveBulk: (records: Omit<AttendanceRecord, 'id' | 'church_id' | 'created_at'>[]): void => {
    const activeUser = storage.getActiveUser();
    const formattedRecords: AttendanceRecord[] = records.map(r => ({
      ...r,
      id: 'att-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      church_id: 'church-1',
      created_at: new Date().toISOString(),
    }));

    storage.saveAttendanceBulk(formattedRecords);
    storage.logAction(
      'ATTENDANCE_BULK_SAVED',
      'attendance',
      `Saved attendance for ${formattedRecords.length} members by ${activeUser?.name || 'User'}`
    );
  },

  getAbsentMembersForDate: (date: string, groupId?: string): AbsentMemberSummary[] => {
    const allMembers = storage.getMembers().filter(
      m => m.status === 'active' && (!groupId || groupId === 'all' || m.group_id === groupId)
    );
    const allAttendance = storage.getAttendance();
    const result: AbsentMemberSummary[] = [];

    // Distinct past dates sorted descending
    const allDates = Array.from(new Set(allAttendance.map(a => a.date)))
      .filter(d => new Date(d) <= new Date(date))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    for (const member of allMembers) {
      const targetRecord = allAttendance.find(
        r => r.member_id === member.id && r.date === date
      );

      // If status is marked absent or no record exists for this date, consider absent
      const isAbsentOnDate = targetRecord ? targetRecord.status === 'absent' : true;

      if (isAbsentOnDate) {
        // Calculate consecutive absences
        let consecutive = 0;
        for (const pastDate of allDates) {
          const rec = allAttendance.find(
            r => r.member_id === member.id && r.date === pastDate
          );
          if (!rec || rec.status === 'absent') {
            consecutive++;
          } else {
            break;
          }
        }

        // Calculate member overall attendance rate
        const memberRecords = allAttendance.filter(r => r.member_id === member.id);
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
