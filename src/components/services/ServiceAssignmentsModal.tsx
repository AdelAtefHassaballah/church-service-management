import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ChurchService, UserProfile, Member } from '../../types';
import { serviceService } from '../../services/serviceService';
import { userService } from '../../services/userService';
import { memberService } from '../../services/memberService';
import { Button } from '../common/Button';
import { 
  X, 
  UserPlus, 
  Users, 
  BookOpen, 
  Check, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Plus, 
  Trash2,
  Layers,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ServiceAssignmentsModalProps {
  service: ChurchService | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ServiceAssignmentsModal: React.FC<ServiceAssignmentsModalProps> = ({
  service,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t, language } = useLanguage();

  if (!isOpen || !service) return null;

  const [activeTab, setActiveTab] = useState<'servants' | 'members' | 'servant_member_map'>('servant_member_map');
  const allUsers = userService.getAll();
  const allMembers = memberService.getAll();
  const availableServants = allUsers.filter(u => u.role === 'servant' || u.role === 'leader');

  const [assignedServantIds, setAssignedServantIds] = useState<string[]>(service.servant_ids || []);
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>(service.member_ids || []);

  // Servant -> Members mapping state
  const currentAssignments = serviceService.getMemberServantAssignments(service.id);
  const [memberServantMap, setMemberServantMap] = useState<Array<{ servantId: string; memberId: string }>>(
    currentAssignments.map(a => ({ servantId: a.servant_id, memberId: a.member_id }))
  );

  const [selectedServantForMapping, setSelectedServantForMapping] = useState<string>(
    assignedServantIds[0] || availableServants[0]?.id || ''
  );

  // Toggle servant in this service
  const handleToggleServant = (servantId: string) => {
    if (assignedServantIds.includes(servantId)) {
      setAssignedServantIds(assignedServantIds.filter(id => id !== servantId));
      serviceService.removeServant(service.id, servantId);
    } else {
      setAssignedServantIds([...assignedServantIds, servantId]);
      serviceService.assignServant(service.id, servantId);
    }
  };

  // Toggle member in this service
  const handleToggleMember = (memberId: string) => {
    if (assignedMemberIds.includes(memberId)) {
      setAssignedMemberIds(assignedMemberIds.filter(id => id !== memberId));
      serviceService.removeMember(service.id, memberId);
    } else {
      setAssignedMemberIds([...assignedMemberIds, memberId]);
      serviceService.assignMember(service.id, memberId);
    }
  };

  // Assign a member to the selected servant
  const handleAssignMemberToServant = (memberId: string) => {
    if (!selectedServantForMapping) return;
    serviceService.assignMemberToServant(service.id, selectedServantForMapping, memberId);
    setMemberServantMap([
      ...memberServantMap.filter(m => !(m.memberId === memberId && m.servantId === selectedServantForMapping)),
      { servantId: selectedServantForMapping, memberId },
    ]);
  };

  const handleUnassignMemberFromServant = (memberId: string) => {
    serviceService.removeMemberServantAssignment(service.id, selectedServantForMapping, memberId);
    setMemberServantMap(memberServantMap.filter(m => !(m.memberId === memberId && m.servantId === selectedServantForMapping)));
  };

  const assignedMembersForSelectedServant = memberServantMap
    .filter(m => m.servantId === selectedServantForMapping)
    .map(m => allMembers.find(mem => mem.id === m.memberId))
    .filter(Boolean) as Member[];

  const unassignedMembersInService = allMembers.filter(mem => {
    return assignedMemberIds.includes(mem.id) && !memberServantMap.some(m => m.memberId === mem.id && m.servantId === selectedServantForMapping);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-bold shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? service.name_ar : service.name} — {t('services.manageAssignments')}
              </h3>
              <p className="text-xs text-slate-400">
                Manage many-to-many servant & member rosters and individual care assignments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('servant_member_map')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'servant_member_map'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            1. Servant ↔ Member Care Mapping
          </button>
          <button
            onClick={() => setActiveTab('servants')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'servants'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            2. Service Servants ({assignedServantIds.length})
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'members'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            3. Enrolled Members ({assignedMemberIds.length})
          </button>
        </div>

        {/* TAB 1: Servant ↔ Member Mapping */}
        {activeTab === 'servant_member_map' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-primary-50/60 dark:bg-primary-950/40 border border-primary-200/60 dark:border-primary-800/60 text-xs text-primary-900 dark:text-primary-200">
              💡 <strong>Pastoral Care Mapping:</strong> Assign specific youth/members to each servant in this service. When a servant logs in, their dashboard and member list will highlight their assigned youth.
            </div>

            {/* Servant Selector Pills */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Servant:
              </label>
              <div className="flex flex-wrap gap-2">
                {assignedServantIds.map(sId => {
                  const s = allUsers.find(u => u.id === sId);
                  if (!s) return null;
                  const isSelected = selectedServantForMapping === s.id;
                  const count = memberServantMap.filter(m => m.servantId === s.id).length;

                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedServantForMapping(s.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                        isSelected
                          ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <img
                        src={s.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80'}
                        alt={s.name}
                        className="w-5 h-5 rounded-lg object-cover"
                      />
                      <span>{language === 'ar' ? (s.name_ar || s.name) : s.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {count} members
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dual Column: Assigned Members vs Unassigned Members */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              
              {/* Left Column: Assigned to Selected Servant */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                    Assigned Members ({assignedMembersForSelectedServant.length})
                  </h4>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {assignedMembersForSelectedServant.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center italic">
                      No members assigned to this servant yet. Click members on the right to assign.
                    </p>
                  ) : (
                    assignedMembersForSelectedServant.map(mem => (
                      <div
                        key={mem.id}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={mem.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80'}
                            alt={mem.full_name}
                            className="w-7 h-7 rounded-lg object-cover"
                          />
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {language === 'ar' ? mem.arabic_name : mem.full_name}
                          </p>
                        </div>
                        <button
                          onClick={() => handleUnassignMemberFromServant(mem.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Unassign"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Other Enrolled Members */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-500" />
                    Available Service Members ({unassignedMembersInService.length})
                  </h4>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {unassignedMembersInService.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center italic">
                      All members in this service are assigned to this servant.
                    </p>
                  ) : (
                    unassignedMembersInService.map(mem => (
                      <div
                        key={mem.id}
                        onClick={() => handleAssignMemberToServant(mem.id)}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-primary-50 dark:hover:bg-primary-950/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={mem.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80'}
                            alt={mem.full_name}
                            className="w-7 h-7 rounded-lg object-cover"
                          />
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {language === 'ar' ? mem.arabic_name : mem.full_name}
                          </p>
                        </div>
                        <span className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Manage Servants in this Service */}
        {activeTab === 'servants' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select all servants who serve in this specific church ministry:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto">
              {availableServants.map(s => {
                const isAssigned = assignedServantIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => handleToggleServant(s.id)}
                    className={`p-3 rounded-2xl border text-start flex items-center justify-between transition-all ${
                      isAssigned
                        ? 'bg-primary-50 dark:bg-primary-950/60 border-primary-500 text-primary-950 dark:text-primary-100 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={s.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80'}
                        alt={s.name}
                        className="w-8 h-8 rounded-xl object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">
                          {language === 'ar' ? (s.name_ar || s.name) : s.name}
                        </p>
                        <p className="text-[10px] text-slate-400 capitalize">{s.role}</p>
                      </div>
                    </div>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isAssigned ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300'
                    }`}>
                      {isAssigned && <Check className="w-3 h-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Manage Members Enrolled in this Service */}
        {activeTab === 'members' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select members and youth participating in this service:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto">
              {allMembers.map(mem => {
                const isAssigned = assignedMemberIds.includes(mem.id);
                return (
                  <button
                    key={mem.id}
                    onClick={() => handleToggleMember(mem.id)}
                    className={`p-3 rounded-2xl border text-start flex items-center justify-between transition-all ${
                      isAssigned
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-950 dark:text-sky-100 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={mem.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80'}
                        alt={mem.full_name}
                        className="w-8 h-8 rounded-xl object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">
                          {language === 'ar' ? mem.arabic_name : mem.full_name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono" dir="ltr">{mem.phone}</p>
                      </div>
                    </div>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isAssigned ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300'
                    }`}>
                      {isAssigned && <Check className="w-3 h-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="primary"
            onClick={() => {
              confetti({ particleCount: 30, spread: 50 });
              onSuccess();
              onClose();
            }}
          >
            {t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
};
