import React, { useState } from 'react';
import { Member, ServiceGroup, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { storage } from '../lib/storage';
import { memberService } from '../services/memberService';
import { MemberCard } from '../components/members/MemberCard';
import { AddEditMemberModal } from '../components/members/AddEditMemberModal';
import { MemberDetailModal } from '../components/members/MemberDetailModal';
import { MemberQRCodeModal } from '../components/members/MemberQRCodeModal';
import { WhatsAppModal } from '../components/common/WhatsAppModal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  Table as TableIcon, 
  QrCode, 
  MessageSquare,
  Sparkles
} from 'lucide-react';

export const MembersPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { role } = useAuth();
  const groups = storage.getGroups();
  const servants = storage.getProfiles().filter(p => p.role === 'servant');

  const [members, setMembers] = useState<Member[]>(() => storage.getMembers());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedServant, setSelectedServant] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [detailMember, setDetailMember] = useState<Member | null>(null);
  const [qrMember, setQrMember] = useState<Member | null>(null);
  const [whatsAppMember, setWhatsAppMember] = useState<Member | null>(null);

  const isAr = language === 'ar';
  const canEdit = role === 'admin' || role === 'leader';

  const refreshMembers = () => {
    setMembers(storage.getMembers());
  };

  const handleSaveMember = (data: any) => {
    if (editingMember) {
      memberService.update(editingMember.id, data);
    } else {
      memberService.create(data);
    }
    refreshMembers();
  };

  const handleDeleteMember = (member: Member) => {
    if (confirm(t('members.deleteConfirm'))) {
      memberService.delete(member.id);
      refreshMembers();
    }
  };

  const filteredMembers = memberService.search(
    searchQuery,
    selectedGroup,
    selectedServant,
    selectedStatus
  );

  return (
    <div className="space-y-4">
      {/* Top Header & Add Member Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span>{t('members.title')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('members.subtitle')} ({filteredMembers.length} {isAr ? 'مخدوم' : 'members'})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingMember(null);
                setIsAddEditOpen(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              {t('members.addMember')}
            </Button>
          )}

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-400'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-400'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute top-2.5 left-3 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('members.searchPlaceholder')}
            className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Group filter */}
        <div>
          <select
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">{t('members.allGroups')}</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>
                {isAr ? g.name_ar : g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Servant filter */}
        <div>
          <select
            value={selectedServant}
            onChange={e => setSelectedServant(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">{t('members.allServants')}</option>
            {servants.map(s => (
              <option key={s.id} value={s.id}>
                {isAr ? (s.name_ar || s.name) : s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">{t('members.allStatuses')}</option>
            <option value="active">{t('members.active')}</option>
            <option value="inactive">{t('members.inactive')}</option>
          </select>
        </div>
      </div>

      {/* Main Members Content View */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800">
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title={t('common.noData')}
            description="Try adjusting search terms or filters."
          />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              group={groups.find(g => g.id === member.group_id)}
              servant={servants.find(s => s.id === member.assigned_servant_id)}
              onView={(m) => setDetailMember(m)}
              onEdit={(m) => {
                setEditingMember(m);
                setIsAddEditOpen(true);
              }}
              onDelete={handleDeleteMember}
              onShowQR={(m) => setQrMember(m)}
              onSendWhatsApp={(m) => setWhatsAppMember(m)}
              canEdit={canEdit}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left rtl:text-right">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3.5">{t('members.fullName')}</th>
                <th className="p-3.5">{t('members.group')}</th>
                <th className="p-3.5">{t('members.assignedServant')}</th>
                <th className="p-3.5">{t('members.phone')}</th>
                <th className="p-3.5">{t('members.status')}</th>
                <th className="p-3.5 text-right rtl:text-left">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMembers.map((member) => {
                const group = groups.find(g => g.id === member.group_id);
                const servant = servants.find(s => s.id === member.assigned_servant_id);

                return (
                  <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      <div>
                        <span>{isAr ? member.arabic_name : member.full_name}</span>
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {isAr ? member.full_name : member.arabic_name}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {group ? (
                        <Badge variant="primary" size="sm">
                          {isAr ? group.name_ar : group.name}
                        </Badge>
                      ) : 'N/A'}
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      {servant ? (isAr ? (servant.name_ar || servant.name) : servant.name) : 'Unassigned'}
                    </td>
                    <td className="p-3.5 font-mono" dir="ltr">{member.phone}</td>
                    <td className="p-3.5">
                      <Badge variant={member.status === 'active' ? 'success' : 'neutral'} size="sm">
                        {member.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right rtl:text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setWhatsAppMember(member)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setQrMember(member)}
                          className="p-1.5 text-slate-500 hover:text-primary-600 rounded-lg transition-colors"
                          title={t('members.viewQR')}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailMember(member)}
                        >
                          {t('common.view')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      <AddEditMemberModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        onSave={handleSaveMember}
        member={editingMember}
      />

      {/* Member Details Modal */}
      {detailMember && (
        <MemberDetailModal
          isOpen={Boolean(detailMember)}
          onClose={() => setDetailMember(null)}
          member={detailMember}
          group={groups.find(g => g.id === detailMember.group_id)}
          servant={servants.find(s => s.id === detailMember.assigned_servant_id)}
          onSendWhatsApp={(m) => setWhatsAppMember(m)}
        />
      )}

      {/* QR Code Modal */}
      {qrMember && (
        <MemberQRCodeModal
          isOpen={Boolean(qrMember)}
          onClose={() => setQrMember(null)}
          member={qrMember}
          group={groups.find(g => g.id === qrMember.group_id)}
          onRegenerated={(newQR) => {
            refreshMembers();
            setQrMember(prev => prev ? { ...prev, qr_code: newQR } : null);
          }}
        />
      )}

      {/* WhatsApp Modal */}
      {whatsAppMember && (
        <WhatsAppModal
          isOpen={Boolean(whatsAppMember)}
          onClose={() => setWhatsAppMember(null)}
          recipientName={isAr ? whatsAppMember.arabic_name : whatsAppMember.full_name}
          recipientPhone={whatsAppMember.whatsapp || whatsAppMember.phone}
          defaultTemplate="absence"
        />
      )}
    </div>
  );
};
