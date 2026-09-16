import { ServantAttendanceRecord, AttendanceStatus, UserProfile } from '../types';
import { storage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateUUID, sanitizeUUID } from '../lib/uuid';
import { churchService } from './churchService';

export const servantAttendanceService = {
  fetchAll: async (): Promise<ServantAttendanceRecord[]> => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('servant_attendance')
          .select('*')
          .order('date', { ascending: false });

        if (!error && data) {
          const activeChurchId = await churchService.getActiveChurchId();
          const mapped: ServantAttendanceRecord[] = data.map((row: any) => ({
            id: row.id,
            church_id: sanitizeUUID(row.church_id) || activeChurchId,
            service_id: sanitizeUUID(row.service_id) || undefined,
            servant_id: row.servant_id,
            date: row.date,
            status: row.status || 'present',
            check_in_time: row.check_in_time || undefined,
            recorded_by: sanitizeUUID(row.recorded_by) || undefined,
            method: (row.method === 'qr_scan' ? 'qr_scan' : 'manual'),
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
      r => (serviceId === 'all' || !r.service_id || r.service_id === serviceId) && r.date === date
    );
  },

  getByDate: (date: string, serviceId?: string): ServantAttendanceRecord[] => {
    return storage.getServantAttendance().filter(
      r => (!serviceId || serviceId === 'all' || !r.service_id || r.service_id === serviceId) && r.date === date
    );
  },

  recordAttendance: async (
    servantId: string,
    serviceId?: string,
    date?: string,
    status: AttendanceStatus = 'present',
    recordedBy?: string,
    method: 'manual' | 'qr_scan' = 'manual',
    notes?: string
  ): Promise<ServantAttendanceRecord> => {
    const activeChurchId = await churchService.getActiveChurchId();
    const defaultSrv = storage.getServices()[0]?.id || activeChurchId;
    const finalServiceId = serviceId || defaultSrv;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const existing = storage.getServantAttendance().find(
      r => r.servant_id === servantId && r.date === targetDate && (r.service_id === finalServiceId || !finalServiceId)
    );

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const record: ServantAttendanceRecord = {
      id: existing ? existing.id : generateUUID(),
      church_id: activeChurchId,
      service_id: finalServiceId,
      servant_id: servantId,
      date: targetDate,
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
      const sanitizedSrv = sanitizeUUID(record.service_id);
      const sanitizedServant = sanitizeUUID(record.servant_id);
      const sanitizedRecordedBy = sanitizeUUID(record.recorded_by);

      if (sanitizedServant && sanitizedSrv) {
        supabase
          .from('servant_attendance')
          .upsert({
            id: record.id,
            church_id: sanitizeUUID(record.church_id),
            service_id: sanitizedSrv,
            servant_id: sanitizedServant,
            date: record.date,
            status: record.status,
            check_in_time: record.check_in_time,
            recorded_by: sanitizedRecordedBy,
            method: record.method,
            notes: record.notes || null,
            created_at: record.created_at,
          }, { onConflict: 'service_id,servant_id,date' })
          .then(({ error }) => {
            if (error) console.warn('Remote Supabase servant attendance upsert error:', error.message);
          });
      }
    }

    return record;
  },

  saveRecord: async (data: Omit<ServantAttendanceRecord, 'id' | 'created_at'>): Promise<ServantAttendanceRecord> => {
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
      await servantAttendanceService.saveRecord(r);
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
