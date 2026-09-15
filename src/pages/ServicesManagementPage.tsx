import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ChurchService, UserProfile } from '../types';
import { serviceService } from '../services/serviceService';
import { userService } from '../services/userService';
import { memberService } from '../services/memberService';
import { ServiceCard } from '../components/services/ServiceCard';
import { AddEditServiceModal } from '../components/services/AddEditServiceModal';
import { ServiceAssignmentsModal } from '../components/services/ServiceAssignmentsModal';
import { ServiceDashboardModal } from '../components/services/ServiceDashboardModal';
import { Button } from '../components/common/Button';
import { 
  Layers, 
  Plus, 
  Search, 
  Filter, 
  Crown, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const ServicesManagementPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { role } = useAuth();

  const [services, setServices] = useState<ChurchService[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Modals state
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [editingService, setEditingService] = useState<ChurchService | null>(null);
  const [assigningService, setAssigningService] = useState<ChurchService | null>(null);
  const [dashboardService, setDashboardService] = useState<ChurchService | null>(null);

  const loadData = () => {
    setServices(serviceService.getAll());
    setUsers(userService.getAll());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredServices = services.filter(srv => {
    if (filterType !== 'all' && srv.service_type !== filterType) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      srv.name.toLowerCase().includes(q) ||
      (srv.name_ar && srv.name_ar.includes(q)) ||
      (srv.location && srv.location.toLowerCase().includes(q))
    );
  });

  const handleSaveService = (data: Partial<ChurchService>) => {
    if (editingService) {
      serviceService.update(editingService.id, data);
    } else {
      serviceService.create({
        name: data.name || '',
        name_ar: data.name_ar || '',
        description: data.description,
        description_ar: data.description_ar,
        service_type: data.service_type || 'preparatory',
        location: data.location,
        day_of_week: data.day_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
        leader_ids: data.leader_ids || [],
        servant_ids: data.servant_ids || [],
        member_ids: data.member_ids || [],
        status: data.status || 'active',
        color: data.color,
        notes: data.notes,
      });
    }
    loadData();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                {t('services.title')}
              </h2>
              <span className="text-[10px] bg-primary-100 text-primary-900 dark:bg-primary-950 dark:text-primary-200 font-bold px-2 py-0.5 rounded-full border border-primary-200 dark:border-primary-800">
                {services.length} Ministry Sectors
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('services.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingService(null);
              setIsAddServiceOpen(true);
            }}
          >
            {t('services.addService')}
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-x-auto">
          {[
            { key: 'all', label: t('common.all') },
            { key: 'preparatory', label: 'Preparatory (إعدادي)' },
            { key: 'secondary', label: 'Secondary (ثانوي)' },
            { key: 'youth', label: 'Youth (شباب)' },
            { key: 'children', label: 'Children (ابتدائي)' },
            { key: 'choir', label: 'Choir (كورال)' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterType === tab.key
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            className="w-full pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredServices.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400">
            <Layers className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm font-semibold">{t('common.noData')}</p>
          </div>
        ) : (
          filteredServices.map(srv => {
            const leaders = users.filter(u => srv.leader_ids?.includes(u.id));
            const servantCount = srv.servant_ids?.length || 0;
            const memberCount = srv.member_ids?.length || 0;

            return (
              <ServiceCard
                key={srv.id}
                service={srv}
                leaders={leaders}
                servantCount={servantCount}
                memberCount={memberCount}
                onOpenDashboard={(s) => setDashboardService(s)}
                onOpenAssignments={(s) => setAssigningService(s)}
                onEdit={(s) => {
                  setEditingService(s);
                  setIsAddServiceOpen(true);
                }}
              />
            );
          })
        )}
      </div>

      {/* Add / Edit Service Modal */}
      <AddEditServiceModal
        service={editingService}
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
        onSave={handleSaveService}
      />

      {/* Servant & Member Assignments Modal */}
      <ServiceAssignmentsModal
        service={assigningService}
        isOpen={!!assigningService}
        onClose={() => setAssigningService(null)}
        onSuccess={loadData}
      />

      {/* Service Dashboard Modal */}
      <ServiceDashboardModal
        service={dashboardService}
        isOpen={!!dashboardService}
        onClose={() => setDashboardService(null)}
      />
    </div>
  );
};
