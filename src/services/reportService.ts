import { storage } from '../lib/storage';

export const reportService = {
  downloadCSV: (filename: string, headers: string[], rows: (string | number)[][]) => {
    // Prefix with UTF-8 BOM so Excel opens Arabic properly
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportMembersCSV: () => {
    const members = storage.getMembers();
    const groups = storage.getGroups();
    const servants = storage.getProfiles();

    const headers = [
      'Member ID',
      'Full Name (EN)',
      'Arabic Name',
      'Gender',
      'Service Group',
      'Assigned Servant',
      'Phone',
      'WhatsApp',
      'Emergency Contact',
      'Status',
      'Join Date'
    ];

    const rows = members.map(m => {
      const group = groups.find(g => g.id === m.group_id)?.name || 'N/A';
      const servant = servants.find(s => s.id === m.assigned_servant_id)?.name || 'Unassigned';
      return [
        m.id,
        m.full_name,
        m.arabic_name,
        m.gender,
        group,
        servant,
        m.phone,
        m.whatsapp,
        m.emergency_contact_phone || 'N/A',
        m.status,
        m.join_date
      ];
    });

    reportService.downloadCSV(`church_members_${new Date().toISOString().split('T')[0]}`, headers, rows);
  },

  exportAttendanceCSV: (date?: string) => {
    const attendance = storage.getAttendance().filter(a => !date || a.date === date);
    const members = storage.getMembers();
    const groups = storage.getGroups();

    const headers = ['Date', 'Member Name', 'Arabic Name', 'Group', 'Status', 'Method', 'Notes'];

    const rows = attendance.map(a => {
      const member = members.find(m => m.id === a.member_id);
      const group = groups.find(g => g.id === a.group_id)?.name || 'N/A';
      return [
        a.date,
        member?.full_name || a.member_id,
        member?.arabic_name || '',
        group,
        a.status.toUpperCase(),
        a.method,
        a.notes || ''
      ];
    });

    reportService.downloadCSV(`church_attendance_${date || 'all'}_${new Date().toISOString().split('T')[0]}`, headers, rows);
  },

  exportLessonsCSV: () => {
    const lessons = storage.getLessons();
    const servants = storage.getProfiles();
    const groups = storage.getGroups();

    const headers = ['Lesson Title', 'Servant Name', 'Group', 'Lesson Date', 'Deadline', 'Status', 'Bible Reference'];

    const rows = lessons.map(l => {
      const servant = servants.find(s => s.id === l.servant_id)?.name || 'Unknown';
      const group = groups.find(g => g.id === l.group_id)?.name || 'N/A';
      return [
        l.title,
        servant,
        group,
        l.lesson_date,
        l.deadline.split('T')[0],
        l.status.toUpperCase(),
        l.bible_reference || ''
      ];
    });

    reportService.downloadCSV(`weekly_lessons_report_${new Date().toISOString().split('T')[0]}`, headers, rows);
  }
};
