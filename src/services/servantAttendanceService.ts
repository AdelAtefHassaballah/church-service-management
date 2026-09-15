import { ServantAttendanceRecord, AttendanceStatus, UserProfile } from '../types';
import { storage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const servantAttendanceService = {
  fetchAll: async (): Promise<ServantAttendanceRecord[]> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('servant_attendance')
          .select('*')
          .order('date', { ascending: false });

        if (!error && data) {
          const mapped: ServantAttendanceRecord[] = data.map((row: any) => ({
            id: row.id,
            church_id: row.church_id || 'church-1',
            service_id: row.service_id,
            servant_id: row.servant_id,
            date: row.date,
            status: row.status || 'present',
            check_in_time: row.check_in_time || undefined,
            recorded_by: row.recorded_by || 'admin',
            method: row.method || 'manual',
            notes: row.notes || undefined,
            created_at: row.created_at || new Date().toISOString(),
          }));
          storage.saveServantAttendanceRecords(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase servant attendance fetch error:', err);
      }
    }
    return storage.getServantAttendance();
  },

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
      id: existing ? existing.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'satt-' + Date.now()),
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

    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('servant_attendance')
        .upsert({
          id: record.id,
          service_id: record.service_id && record.service_id.length === 36 ? record.service_id : null,
          servant_id: record.servant_id && record.servant_id.length === 36 ? record.servant_id : null,
          date: record.date,
          status: record.status,
          check_in_time: record.check_in_time,
          recorded_by: record.recorded_by && record.recorded_by.length === 36 ? record.recorded_by : null,
          method: record.method,
          notes: record.notes || null,
          created_at: record.created_at,
        }, { onConflict: 'service_id,servant_id,date' })
        .then(({ error }) => {
          if (error) console.warn('Remote Supabase servant attendance upsert error:', error.message);
        });
    }

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
