import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { AttendancePage } from './pages/AttendancePage';
import { ServantAttendancePage } from './pages/ServantAttendancePage';
import { QRScannerPage } from './pages/QRScannerPage';
import { QRManagementPage } from './pages/QRManagementPage';
import { ServicesManagementPage } from './pages/ServicesManagementPage';
import { UsersManagementPage } from './pages/UsersManagementPage';
import { LessonsPage } from './pages/LessonsPage';
import { TasksPage } from './pages/TasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { AbsentMembersPage } from './pages/AbsentMembersPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { GroupsPage } from './pages/GroupsPage';
import { ServantsPage } from './pages/ServantsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AddEditMemberModal } from './components/members/AddEditMemberModal';
import { SubmitLessonModal } from './components/lessons/SubmitLessonModal';
import { CreateTaskModal } from './components/tasks/CreateTaskModal';
import { memberService } from './services/memberService';
import { syncService } from './services/syncService';

export const App: React.FC = () => {
  const { user, role } = useAuth();
  const { isRTL } = useLanguage();

  const [currentPath, setCurrentPath] = useState<string>('/');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Global Quick Action Modal States
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isSubmitLessonOpen, setIsSubmitLessonOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  // Synchronize remote database on load
  useEffect(() => {
    if (user) {
      syncService.syncAll();
    }
  }, [user]);

  // If unauthenticated, show Login Page
  if (!user) {
    return <LoginPage />;
  }

  const renderCurrentPage = () => {
    switch (currentPath) {
      case '/':
        return (
          <DashboardPage
            onNavigate={setCurrentPath}
            onOpenAddMember={() => setIsAddMemberOpen(true)}
            onOpenSubmitLesson={() => setIsSubmitLessonOpen(true)}
            onOpenCreateTask={() => setIsCreateTaskOpen(true)}
          />
        );
      case '/users':
        return <UsersManagementPage />;
      case '/services':
        return <ServicesManagementPage />;
      case '/members':
        return <MembersPage />;
      case '/attendance':
        return <AttendancePage />;
      case '/servant-attendance':
        return <ServantAttendancePage />;
      case '/qr-scanner':
        return <QRScannerPage />;
      case '/qr-codes':
        return <QRManagementPage />;
      case '/lessons':
        return <LessonsPage />;
      case '/tasks':
        return <TasksPage />;
      case '/calendar':
        return <CalendarPage />;
      case '/absent':
        return <AbsentMembersPage />;
      case '/analytics':
        return <AnalyticsPage />;
      case '/reports':
        return <ReportsPage />;
      case '/groups':
        return <GroupsPage />;
      case '/servants':
        return <ServantsPage />;
      case '/audit-logs':
        return <AuditLogsPage />;
      case '/settings':
        return <SettingsPage />;
      case '/profile':
        return <ProfilePage />;
      default:
        return (
          <DashboardPage
            onNavigate={setCurrentPath}
            onOpenAddMember={() => setIsAddMemberOpen(true)}
            onOpenSubmitLesson={() => setIsSubmitLessonOpen(true)}
            onOpenCreateTask={() => setIsCreateTaskOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={setCurrentPath}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Shell with dynamic margin for Sidebar */}
      <div className="flex-1 flex flex-col lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64 min-w-0 transition-all duration-300">
        {/* Sticky Top Header */}
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Page Content Viewport */}
        <main className="flex-1 p-3.5 sm:p-6 pb-24 lg:pb-10 max-w-7xl w-full mx-auto animate-fadeIn">
          {renderCurrentPage()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentPath={currentPath}
        onNavigate={setCurrentPath}
      />

      {/* Global Quick Action Modals */}
      <AddEditMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onSave={(data) => {
          memberService.create(data);
          setCurrentPath('/members');
        }}
      />

      <SubmitLessonModal
        isOpen={isSubmitLessonOpen}
        onClose={() => setIsSubmitLessonOpen(false)}
        onSuccess={() => setCurrentPath('/lessons')}
      />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onSuccess={() => setCurrentPath('/tasks')}
      />
    </div>
  );
};
