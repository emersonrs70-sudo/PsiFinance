import React, { useState, useEffect } from 'react';
import { Patient, SessionEntry } from './types/finance';
import { initialPatients, initialSessions } from './data/mockData';
import { 
  db, 
  auth, 
  googleProvider,
  testFirestoreConnection,
  savePatientToCloud,
  deletePatientFromCloud,
  saveSessionToCloud,
  deleteSessionFromCloud,
  seedInitialCloudData,
  handleFirestoreError,
  OperationType 
} from './services/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { SessionsLedger } from './components/SessionsLedger';
import { RevenueCharts } from './components/RevenueCharts';
import { PatientsList } from './components/PatientsList';
import { NewSessionModal } from './components/NewSessionModal';
import { NewPatientModal } from './components/NewPatientModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'entradas' | 'graficos' | 'pacientes'>('entradas');
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [sessions, setSessions] = useState<SessionEntry[]>(initialSessions);

  // Cloud & Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [hasCloudInitialized, setHasCloudInitialized] = useState<boolean>(false);

  // Sidebar states
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);

  // Modals state
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [preselectedPatientId, setPreselectedPatientId] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // 1. Initial Connection Test and Auth State
  useEffect(() => {
    testFirestoreConnection();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time Cloud Firestore Listeners
  useEffect(() => {
    // Patients real-time listener
    const pathPatients = 'patients';
    const unsubscribePatients = onSnapshot(
      collection(db, pathPatients),
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedPatients: Patient[] = [];
          snapshot.forEach((docSnap) => {
            loadedPatients.push(docSnap.data() as Patient);
          });
          setPatients(loadedPatients);
        } else if (!hasCloudInitialized) {
          // If Firestore is empty, seed initial data to the cloud
          seedInitialCloudData(initialPatients, initialSessions);
          setHasCloudInitialized(true);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, pathPatients);
      }
    );

    // Sessions real-time listener
    const pathSessions = 'sessions';
    const unsubscribeSessions = onSnapshot(
      collection(db, pathSessions),
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedSessions: SessionEntry[] = [];
          snapshot.forEach((docSnap) => {
            loadedSessions.push(docSnap.data() as SessionEntry);
          });
          // Sort descending by date
          loadedSessions.sort((a, b) => b.date.localeCompare(a.date));
          setSessions(loadedSessions);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, pathSessions);
      }
    );

    return () => {
      unsubscribePatients();
      unsubscribeSessions();
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

  // Toggle payment status with instant Cloud Sync
  const handleToggleStatus = async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const newStatus = session.status === 'received' ? 'pending' : 'received';
    const updatedSession: SessionEntry = { ...session, status: newStatus };

    // Optimistic UI update
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? updatedSession : s)));
    showToast(newStatus === 'received' ? 'Sessão Recebida salva na nuvem!' : 'Sessão A Receber salva na nuvem.');

    setIsCloudSyncing(true);
    try {
      await saveSessionToCloud(updatedSession);
    } catch (error) {
      console.error('Failed to sync session status to cloud:', error);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Delete session with Cloud Sync
  const handleDeleteSession = async (sessionId: string) => {
    // Optimistic UI update
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    showToast('Lançamento removido da nuvem.');

    setIsCloudSyncing(true);
    try {
      await deleteSessionFromCloud(sessionId);
    } catch (error) {
      console.error('Failed to delete session from cloud:', error);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Save new session with Cloud Sync
  const handleSaveNewSession = async (newSession: SessionEntry) => {
    // Optimistic UI update
    setSessions((prev) => [newSession, ...prev]);
    showToast(`Entrada de ${newSession.patientName} salva na nuvem!`);

    setIsCloudSyncing(true);
    try {
      await saveSessionToCloud(newSession);
    } catch (error) {
      console.error('Failed to save session to cloud:', error);
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
    showToast(`Entrada salva na nuvem com sucesso!`);

    setIsCloudSyncing(true);
    try {
      await saveSessionToCloud(newSession);
    } catch (error) {
      console.error('Failed to save quick session to cloud:', error);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Save new patient with Cloud Sync
  const handleSaveNewPatient = async (newPatient: Patient) => {
    setPatients((prev) => [newPatient, ...prev]);
    showToast(`Paciente ${newPatient.name} salvo na nuvem!`);

    setIsCloudSyncing(true);
    try {
      await savePatientToCloud(newPatient);
    } catch (error) {
      console.error('Failed to save patient to cloud:', error);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Delete patient with Cloud Sync
  const handleDeletePatient = async (patientId: string) => {
    const p = patients.find((pat) => pat.id === patientId);
    if (!p) return;

    setPatients((prev) => prev.filter((pat) => pat.id !== patientId));
    showToast(`Paciente ${p.name} removido da nuvem.`);

    setIsCloudSyncing(true);
    try {
      await deletePatientFromCloud(patientId);
    } catch (error) {
      console.error('Failed to delete patient from cloud:', error);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Open new session modal with patient pre-selected
  const handleOpenNewSessionForPatient = (patientId: string) => {
    setPreselectedPatientId(patientId);
    setIsNewSessionModalOpen(true);
  };

  const pendingCount = sessions.filter((s) => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row font-sans text-neutral-900 w-full overflow-x-hidden">
      {/* Expandable Sidebar (Desktop collapsible & Mobile slide-out drawer) */}
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

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header (Hidden on Desktop) */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenNewSession={() => {
            setPreselectedPatientId(undefined);
            setIsNewSessionModalOpen(true);
          }}
          pendingCount={pendingCount}
        />

        {/* Main Viewport Container */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-24 md:pb-8">
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
            <RevenueCharts sessions={sessions} />
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
        </main>
      </div>

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

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-50 bg-neutral-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl transition-all whitespace-nowrap">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
