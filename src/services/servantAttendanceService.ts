import { ServantAttendanceRecord, AttendanceStatus, UserProfile } from '../types';
import { storage } from '../lib/storage';

export const servantAttendanceService = {
  getAll: (): ServantAttendanceRecord[] => {
    return storage.getServantAttendance();
  },

  getByServiceAndDate: (serviceId: string, date: string): ServantAttendanceRecord[] => {
    return storage.getServantAttendance().filter(
      r => (serviceId === 'all' || r.service_id === serviceId) && r.date === date
    );
  },

  getByDate: (date: string, serviceId?: string): ServantAttendanceRecord[] => {
    return storage.getServantAttendance().filter(
      r => (!serviceId || serviceId === 'all' || r.service_id === serviceId) && r.date === date
    );
  },

  recordAttendance: (
    servantId: string,
    serviceId: string,
    date: string,
    status: AttendanceStatus,
    recordedBy: string,
    method: 'manual' | 'qr_scan' = 'manual',
    notes?: string
  ): ServantAttendanceRecord => {
    const existing = storage.getServantAttendance().find(
      r => r.servant_id === servantId && r.date === date && (r.service_id === serviceId || !serviceId)
    );

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const record: ServantAttendanceRecord = {
      id: existing ? existing.id : 'satt-' + Date.now(),
      church_id: 'church-1',
      service_id: serviceId,
      servant_id: servantId,
      date,
      status,
      check_in_time: existing?.check_in_time || nowTime,
      recorded_by: recordedBy,
      method,
      notes: notes !== undefined ? notes : existing?.notes,
      created_at: existing ? existing.created_at : new Date().toISOString(),
    };

    storage.saveServantAttendance(record);

    const servant = storage.getProfileById(servantId);
    storage.logAction(
      'SERVANT_ATTENDANCE_LOGGED',
      'servant_attendance',
      `Recorded attendance for Servant ${servant?.name || servantId} (${status.toUpperCase()} via ${method})`,
      servantId
    );

    return record;
  },

  saveRecord: (data: Omit<ServantAttendanceRecord, 'id' | 'created_at'>): ServantAttendanceRecord => {
    return servantAttendanceService.recordAttendance(
      data.servant_id,
      data.service_id,
      data.date,
      data.status,
      data.recorded_by,
      data.method,
      data.notes
    );
  },

  saveBatch: async (records: Array<Omit<ServantAttendanceRecord, 'id' | 'created_at'>>): Promise<void> => {
    for (const r of records) {
      servantAttendanceService.saveRecord(r);
    }
  },

  getServantStats: (servantId: string) => {
    const all = storage.getServantAttendance().filter(r => r.servant_id === servantId);
    const present = all.filter(r => r.status === 'present').length;
    const absent = all.filter(r => r.status === 'absent').length;
    const total = all.length || 1;
    const rate = Math.round((present / total) * 100);

    return {
      totalMarked: all.length,
      present,
      absent,
      rate,
    };
  },

  getServantRate: (servantId: string) => {
    return servantAttendanceService.getServantStats(servantId);
  }
};
