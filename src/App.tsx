import React, { useState, useEffect } from 'react';
import { Patient, SessionEntry, ScheduledAppointment, AppointmentStatus } from './types/finance';
import { 
  initialPatients, 
  initialSessions, 
  initialAppointments,
  isDemoPatient,
  isDemoSession,
  isDemoAppointment
} from './data/mockData';
import { 
  db, 
  auth, 
  googleProvider,
  testFirestoreConnection,
  savePatientToCloud,
  deletePatientFromCloud,
  saveSessionToCloud,
  deleteSessionFromCloud,
  saveAppointmentToCloud,
  deleteAppointmentFromCloud,
  seedInitialCloudData,
} from './services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Navbar, AppTab } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { ScheduleCalendar } from './components/ScheduleCalendar';
import { SessionsLedger } from './components/SessionsLedger';
import { RevenueCharts } from './components/RevenueCharts';
import { PatientsList } from './components/PatientsList';
import { NewSessionModal } from './components/NewSessionModal';
import { NewPatientModal } from './components/NewPatientModal';
import { NewAppointmentModal } from './components/NewAppointmentModal';
import { OnboardingTour } from './components/OnboardingTour';
import { ClearDemoModal } from './components/ClearDemoModal';
import { DemoBanner } from './components/DemoBanner';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [sessions, setSessions] = useState<SessionEntry[]>(initialSessions);
  const [appointments, setAppointments] = useState<ScheduledAppointment[]>(initialAppointments);

  // Cloud & Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [hasCloudInitialized, setHasCloudInitialized] = useState<boolean>(false);

  // Sidebar states (for mobile slide-in drawer)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);

  // Modals state
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [preselectedPatientId, setPreselectedPatientId] = useState<string | undefined>(undefined);
  const [appointmentPreselectedDate, setAppointmentPreselectedDate] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tour & Demo Data states
  const [isTourOpen, setIsTourOpen] = useState<boolean>(() => {
    // Open on first access if not completed yet
    return localStorage.getItem('psifinance_tour_completed') !== 'true';
  });
  const [isClearDemoModalOpen, setIsClearDemoModalOpen] = useState<boolean>(false);

  // Determine if demo data is still present in the system
  const demoPatients = patients.filter(p => isDemoPatient(p.id));
  const hasDemoData = demoPatients.length > 0;

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial Connection Test and Auth State
  useEffect(() => {
    try {
      testFirestoreConnection();
      const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
      });
      return () => unsubscribeAuth();
    } catch (e) {
      console.warn('Auth initialization notice:', e);
    }
  }, []);

  // 2. Real-time Cloud Firestore Listeners
  useEffect(() => {
    let unsubscribePatients: (() => void) | undefined;
    let unsubscribeSessions: (() => void) | undefined;
    let unsubscribeAppointments: (() => void) | undefined;

    try {
      unsubscribePatients = onSnapshot(
        collection(db, 'patients'),
        (snapshot) => {
          if (!snapshot.empty) {
            const loadedPatients: Patient[] = [];
            snapshot.forEach((docSnap) => {
              loadedPatients.push(docSnap.data() as Patient);
            });
            setPatients(loadedPatients);
          } else if (!hasCloudInitialized && localStorage.getItem('psifinance_demo_cleared') !== 'true') {
            seedInitialCloudData(initialPatients, initialSessions);
            setHasCloudInitialized(true);
          }
        },
        (error) => {
          console.warn('Patients cloud listener operating offline:', error.message);
        }
      );

      unsubscribeSessions = onSnapshot(
        collection(db, 'sessions'),
        (snapshot) => {
          if (!snapshot.empty) {
            const loadedSessions: SessionEntry[] = [];
            snapshot.forEach((docSnap) => {
              loadedSessions.push(docSnap.data() as SessionEntry);
            });
            loadedSessions.sort((a, b) => b.date.localeCompare(a.date));
            setSessions(loadedSessions);
          }
        },
        (error) => {
          console.warn('Sessions cloud listener operating offline:', error.message);
        }
      );

      unsubscribeAppointments = onSnapshot(
        collection(db, 'appointments'),
        (snapshot) => {
          if (!snapshot.empty) {
            const loadedApts: ScheduledAppointment[] = [];
            snapshot.forEach((docSnap) => {
              loadedApts.push(docSnap.data() as ScheduledAppointment);
            });
            setAppointments(loadedApts);
          }
        },
        (error) => {
          console.warn('Appointments cloud listener operating offline:', error.message);
        }
      );
    } catch (err) {
      console.warn('Firestore setup operating in local state:', err);
    }

    return () => {
      if (unsubscribePatients) unsubscribePatients();
      if (unsubscribeSessions) unsubscribeSessions();
      if (unsubscribeAppointments) unsubscribeAppointments();
    };
  }, [hasCloudInitialized]);

  // Google Login Handlers
  const handleLoginGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Conectado à sua conta Google!');
    } catch (err: any) {
      console.error('Google Login error:', err);
      showToast('Não foi possível conectar com o Google no momento.');
    }
  };

  const handleLogoutGoogle = async () => {
    try {
      await signOut(auth);
      showToast('Desconectado com sucesso.');
    } catch (err: any) {
      console.error('Google Logout error:', err);
    }
  };

  // Safe Demo Data Removal
  const handleClearDemoData = async () => {
    setIsCloudSyncing(true);
    try {
      // 1. Separate real user data vs demo data
      const demoP = patients.filter(p => isDemoPatient(p.id));
      const demoS = sessions.filter(s => isDemoSession(s.id));
      const demoA = appointments.filter(a => isDemoAppointment(a.id));

      const realPatients = patients.filter(p => !isDemoPatient(p.id));
      const realSessions = sessions.filter(s => !isDemoSession(s.id));
      const realAppointments = appointments.filter(a => !isDemoAppointment(a.id));

      // 2. Remove demo items from Cloud Firestore
      for (const p of demoP) {
        await deletePatientFromCloud(p.id).catch(() => {});
      }
      for (const s of demoS) {
        await deleteSessionFromCloud(s.id).catch(() => {});
      }
      for (const a of demoA) {
        await deleteAppointmentFromCloud(a.id).catch(() => {});
      }

      // 3. Update local state to only keep real user data
      setPatients(realPatients);
      setSessions(realSessions);
      setAppointments(realAppointments);

      localStorage.setItem('psifinance_demo_cleared', 'true');
      showToast('Dados de exemplo removidos com sucesso! Seu consultório está pronto.');
    } catch (error) {
      console.error('Error clearing demo data:', error);
      showToast('Erro ao remover alguns itens de exemplo.');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Toggle payment status with instant Cloud Sync
  const handleToggleStatus = async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const newStatus = session.status === 'received' ? 'pending' : 'received';
    const updatedSession: SessionEntry = { ...session, status: newStatus };

    setSessions((prev) => prev.map((s) => (s.id === sessionId ? updatedSession : s)));
    showToast(newStatus === 'received' ? 'Sessão marcada como Recebida!' : 'Sessão marcada como A Receber.');

    setIsCloudSyncing(true);
    try {
      await saveSessionToCloud(updatedSession);
    } catch (error) {
      console.warn('Cloud sync note:', error);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Delete session with Cloud Sync
  const handleDeleteSession = async (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    showToast('Lançamento financeiro removido.');

    setIsCloudSyncing(true);
    try {
      await deleteSessionFromCloud(sessionId);
    } catch (error) {
      console.warn('Cloud delete note:', error);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Save new session with Cloud Sync
  const handleSaveNewSession = async (newSession: SessionEntry) => {
    setSessions((prev) => [newSession, ...prev]);
    showToast(`Entrada de ${newSession.patientName} registrada!`);

    setIsCloudSyncing(true);
    try {
      await saveSessionToCloud(newSession);
    } catch (error) {
      console.warn('Cloud save note:', error);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Quick inline add with Cloud Sync
  const handleAddQuickSession = async (entry: Omit<SessionEntry, 'id'>) => {
    const newSession: SessionEntry = {
      ...entry,
      id: `s-${Date.now()}`,
    };

    setSessions((prev) => [newSession, ...prev]);
    showToast(`Entrada de ${entry.fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} registrada!`);

    setIsCloudSyncing(true);
    try {
      await saveSessionToCloud(newSession);
    } catch (error) {
      console.warn('Cloud save note:', error);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Save new patient with Cloud Sync
  const handleSaveNewPatient = async (newPatient: Patient) => {
    setPatients((prev) => [newPatient, ...prev]);
    showToast(`Paciente ${newPatient.name} cadastrado!`);

    setIsCloudSyncing(true);
    try {
      await savePatientToCloud(newPatient);
    } catch (error) {
      console.warn('Cloud save note:', error);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Delete patient with Cloud Sync
  const handleDeletePatient = async (patientId: string) => {
    const p = patients.find((pat) => pat.id === patientId);
    if (!p) return;

    setPatients((prev) => prev.filter((pat) => pat.id !== patientId));
    showToast(`Paciente ${p.name} excluído.`);

    setIsCloudSyncing(true);
    try {
      await deletePatientFromCloud(patientId);
    } catch (error) {
      console.warn('Cloud delete note:', error);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleOpenNewSessionForPatient = (patientId: string) => {
    setPreselectedPatientId(patientId);
    setIsNewSessionModalOpen(true);
  };

  // 3. APPOINTMENTS (AGENDA) HANDLERS
  const handleOpenNewAppointment = (preselectedDate?: string) => {
    setAppointmentPreselectedDate(preselectedDate);
    setIsNewAppointmentModalOpen(true);
  };

  const handleSaveNewAppointment = async (newAppointment: ScheduledAppointment) => {
    setAppointments((prev) => [...prev, newAppointment]);
    showToast(`Agendamento de ${newAppointment.patientName} confirmado!`);

    setIsCloudSyncing(true);
    try {
      await saveAppointmentToCloud(newAppointment);
    } catch (error) {
      console.warn('Cloud save appointment note:', error);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;

    const updated: ScheduledAppointment = { ...apt, status };
    setAppointments(prev => prev.map(a => a.id === appointmentId ? updated : a));
    showToast('Status do agendamento atualizado.');

    setIsCloudSyncing(true);
    try {
      await saveAppointmentToCloud(updated);
    } catch (error) {
      console.warn('Cloud update appointment note:', error);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleCompleteAndAddToLedger = async (appointment: ScheduledAppointment) => {
    const updatedApt: ScheduledAppointment = { ...appointment, status: 'completed' };
    setAppointments(prev => prev.map(a => a.id === appointment.id ? updatedApt : a));

    const newSession: SessionEntry = {
      id: `s-${Date.now()}`,
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      date: appointment.date,
      fee: appointment.fee,
      status: 'received',
      paymentMethod: 'PIX',
      notes: `Atendimento agendado às ${appointment.time} (${appointment.modality === 'presencial' ? 'Presencial' : 'Online'})`,
    };

    setSessions(prev => [newSession, ...prev]);
    showToast(`Sessão de ${appointment.patientName} concluída e faturada (+R$ ${appointment.fee})!`);

    setIsCloudSyncing(true);
    try {
      await saveAppointmentToCloud(updatedApt);
      await saveSessionToCloud(newSession);
    } catch (error) {
      console.warn('Cloud complete appointment note:', error);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    setAppointments(prev => prev.filter(a => a.id !== appointmentId));
    showToast('Agendamento desmarcado.');

    setIsCloudSyncing(true);
    try {
      await deleteAppointmentFromCloud(appointmentId);
    } catch (error) {
      console.warn('Cloud delete appointment note:', error);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const pendingCount = sessions.filter((s) => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-neutral-100/70 font-sans text-neutral-900 w-full overflow-x-hidden flex flex-col">
      {/* Mobile Drawer (Expandable Lateral Sidebar on mobile) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
        isDesktopExpanded={isDesktopExpanded}
        setIsDesktopExpanded={setIsDesktopExpanded}
        onOpenNewSession={() => {
          setPreselectedPatientId(undefined);
          setIsNewSessionModalOpen(true);
        }}
        onOpenNewPatient={() => setIsNewPatientModalOpen(true)}
        pendingCount={pendingCount}
        isCloudSyncing={isCloudSyncing}
        currentUser={currentUser}
        onLoginGoogle={handleLoginGoogle}
        onLogoutGoogle={handleLogoutGoogle}
      />

      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        onOpenNewSession={() => {
          setPreselectedPatientId(undefined);
          setIsNewSessionModalOpen(true);
        }}
        pendingCount={pendingCount}
        isCloudSyncing={isCloudSyncing}
        currentUser={currentUser}
        onLoginGoogle={handleLoginGoogle}
        onLogoutGoogle={handleLogoutGoogle}
        onStartTour={() => setIsTourOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* Demo Data Banner (disappears permanently once demo is cleared) */}
        {hasDemoData && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-6">
            <DemoBanner
              demoPatientCount={demoPatients.length}
              onOpenClearModal={() => setIsClearDemoModalOpen(true)}
              onStartTour={() => setIsTourOpen(true)}
            />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardOverview
            sessions={sessions}
            patients={patients}
            onOpenNewSession={() => {
              setPreselectedPatientId(undefined);
              setIsNewSessionModalOpen(true);
            }}
            onNavigateToTab={setActiveTab}
            onToggleStatus={handleToggleStatus}
          />
        )}

        {activeTab !== 'dashboard' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 pb-20">
            {activeTab === 'agenda' && (
              <ScheduleCalendar
                appointments={appointments}
                patients={patients}
                onOpenNewAppointment={handleOpenNewAppointment}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                onCompleteAndAddToLedger={handleCompleteAndAddToLedger}
                onDeleteAppointment={handleDeleteAppointment}
              />
            )}

            {activeTab === 'entradas' && (
              <SessionsLedger
                sessions={sessions}
                patients={patients}
                onToggleStatus={handleToggleStatus}
                onDeleteSession={handleDeleteSession}
                onOpenNewSession={() => {
                  setPreselectedPatientId(undefined);
                  setIsNewSessionModalOpen(true);
                }}
                onAddQuickSession={handleAddQuickSession}
              />
            )}

            {activeTab === 'graficos' && (
              <RevenueCharts sessions={sessions} patients={patients} />
            )}

            {activeTab === 'pacientes' && (
              <PatientsList
                patients={patients}
                sessions={sessions}
                onOpenNewPatient={() => setIsNewPatientModalOpen(true)}
                onOpenNewSessionForPatient={handleOpenNewSessionForPatient}
                onDeletePatient={handleDeletePatient}
              />
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {isNewSessionModalOpen && (
        <NewSessionModal
          patients={patients}
          preselectedPatientId={preselectedPatientId}
          onClose={() => setIsNewSessionModalOpen(false)}
          onSave={handleSaveNewSession}
        />
      )}

      {isNewPatientModalOpen && (
        <NewPatientModal
          onClose={() => setIsNewPatientModalOpen(false)}
          onSave={handleSaveNewPatient}
        />
      )}

      {isNewAppointmentModalOpen && (
        <NewAppointmentModal
          patients={patients}
          preselectedDate={appointmentPreselectedDate}
          onClose={() => setIsNewAppointmentModalOpen(false)}
          onSave={handleSaveNewAppointment}
        />
      )}

      {/* Clear Demo Data Confirmation Modal */}
      <ClearDemoModal
        isOpen={isClearDemoModalOpen}
        onClose={() => setIsClearDemoModalOpen(false)}
        onConfirm={handleClearDemoData}
        demoPatientCount={demoPatients.length}
      />

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigateTab={setActiveTab}
        hasDemoData={hasDemoData}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-950 text-white text-xs font-medium px-4 py-2.5 rounded-2xl shadow-2xl border border-neutral-800 transition-all whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
