import React, { useState, useEffect } from 'react';
import { Member, MemberGender, MemberStatus } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useLanguage } from '../../context/LanguageContext';
import { storage } from '../../lib/storage';
import { UserPlus, Save, User } from 'lucide-react';

import { DEFAULT_CHURCH_ID } from '../../lib/uuid';

interface AddEditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: any) => void;
  member?: Member | null;
}

export const AddEditMemberModal: React.FC<AddEditMemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  member,
}) => {
  const { t, language } = useLanguage();
  const groups = storage.getGroups();
  const servants = storage.getProfiles().filter(p => p.role === 'servant');

  const [formData, setFormData] = useState({
    full_name: '',
    arabic_name: '',
    photo_url: '',
    date_of_birth: '',
    gender: 'male' as MemberGender,
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    group_id: groups[0]?.id || '',
    assigned_servant_id: servants[0]?.id || '',
    confession_father: 'Fr. Mina Gerges',
    status: 'active' as MemberStatus,
    notes: '',
  });

  useEffect(() => {
    if (member) {
      setFormData({
        full_name: member.full_name || '',
        arabic_name: member.arabic_name || '',
        photo_url: member.photo_url || '',
        date_of_birth: member.date_of_birth || '',
        gender: member.gender || 'male',
        phone: member.phone || '',
        whatsapp: member.whatsapp || member.phone || '',
        email: member.email || '',
        address: member.address || '',
        emergency_contact_name: member.emergency_contact_name || '',
        emergency_contact_phone: member.emergency_contact_phone || '',
        group_id: member.group_id || groups[0]?.id || '',
        assigned_servant_id: member.assigned_servant_id || servants[0]?.id || '',
        confession_father: member.confession_father || 'Fr. Mina Gerges',
        status: member.status || 'active',
        notes: member.notes || '',
      });
    } else {
      setFormData({
        full_name: '',
        arabic_name: '',
        photo_url: '',
        date_of_birth: '2012-01-01',
        gender: 'male',
        phone: '+20120',
        whatsapp: '+20120',
        email: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        group_id: groups[0]?.id || '',
        assigned_servant_id: servants[0]?.id || '',
        confession_father: 'Fr. Mina Gerges',
        status: 'active',
        notes: '',
      });
    }
  }, [member, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      church_id: DEFAULT_CHURCH_ID,
      join_date: member ? member.join_date : new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <UserPlus className="w-5 h-5" />
          <span>{member ? t('members.editMember') : t('members.addMember')}</span>
        </div>
      }
      subtitle={t('members.subtitle')}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name (English) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('members.fullName')} *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={e => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. Adel Gerges Fahmy"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          {/* Arabic Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('members.arabicName')} *
            </label>
            <input
              type="text"
              required
              value={formData.arabic_name}
              onChange={e => setFormData({ ...formData, arabic_name: e.target.value })}
              placeholder="مثال: عادل جرجس فهمي"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('members.phone')} *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+201201112233"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
              dir="ltr"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('members.whatsapp')} *
            </label>
            <input
              type="tel"
              required
              value={formData.whatsapp}
              onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="+201201112233"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
              dir="ltr"
            />
          </div>

          {/* Service Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('members.group')} *
            </label>
            <select
              value={formData.group_id}
              onChange={e => setFormData({ ...formData, group_id: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {language === 'ar' ? g.name_ar : g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned Servant */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('members.assignedServant')}
            </label>
            <select
              value={formData.assigned_servant_id}
              onChange={e => setFormData({ ...formData, assigned_servant_id: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              {servants.map(s => (
                <option key={s.id} value={s.id}>
                  {language === 'ar' ? (s.name_ar || s.name) : s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('members.dob')}
            </label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('members.gender')}
            </label>
            <div className="flex gap-4 mt-1.5">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  checked={formData.gender === 'male'}
                  onChange={() => setFormData({ ...formData, gender: 'male' })}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span>{t('members.male')}</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  checked={formData.gender === 'female'}
                  onChange={() => setFormData({ ...formData, gender: 'female' })}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span>{t('members.female')}</span>
              </label>
            </div>
          </div>

          {/* Emergency Contact Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('members.emergencyContact')}
            </label>
            <input
              type="text"
              value={formData.emergency_contact_name}
              onChange={e => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              placeholder="e.g. Gerges Fahmy (Parent)"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          {/* Confession Father */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('members.confessionFather')}
            </label>
            <input
              type="text"
              value={formData.confession_father}
              onChange={e => setFormData({ ...formData, confession_father: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t('members.address')}
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. Shubra, Cairo"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t('members.notes')}
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Special considerations, talents, hobbies..."
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" icon={<Save className="w-4 h-4" />}>
            {member ? t('members.saveMember') : t('members.createMember')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
