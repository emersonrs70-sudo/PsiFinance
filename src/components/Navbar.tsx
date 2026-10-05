import React from 'react';
import { 
  Menu, 
  Plus, 
  Wallet,
  CloudCheck,
  LogIn,
  LogOut,
  HelpCircle
} from 'lucide-react';
import { User } from 'firebase/auth';

export type AppTab = 'dashboard' | 'agenda' | 'entradas' | 'graficos' | 'pacientes';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onOpenMobileSidebar: () => void;
  onOpenNewSession: () => void;
  pendingCount: number;
  isCloudSyncing: boolean;
  currentUser: User | null;
  onLoginGoogle: () => void;
  onLogoutGoogle: () => void;
  onStartTour?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenMobileSidebar,
  onOpenNewSession,
  pendingCount,
  isCloudSyncing,
  currentUser,
  onLoginGoogle,
  onLogoutGoogle,
  onStartTour,
}) => {
  const navTabs: { id: AppTab; label: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'agenda', label: 'Agenda' },
    { id: 'entradas', label: 'Transações', badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'graficos', label: 'Relatórios' },
    { id: 'pacientes', label: 'Pacientes' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-neutral-950 text-white border-b border-neutral-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* ZONE 1: BRAND */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 text-neutral-400 hover:text-white rounded-lg -ml-2 cursor-pointer"
            aria-label="Abrir menu lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            id="tour-brand"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center font-bold text-sm">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-neutral-200 transition-colors">
              PsiFinance
            </span>
          </button>
        </div>

        {/* ZONE 2: NAVIGATION TABS */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tour-nav-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isActive ? 'text-white font-semibold' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="w-4 h-4 bg-amber-500 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-white rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* ZONE 3: ACTIONS */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Cloud Sync Status */}
          <div 
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300"
            title={isCloudSyncing ? 'Sincronizando com Firestore...' : 'Conectado à nuvem Google'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isCloudSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
            <span className="text-neutral-400 text-[10px] font-medium">
              {isCloudSyncing ? 'Salvando...' : 'Nuvem Ativa'}
            </span>
          </div>

          {/* Quick Action Button */}
          <button
            id="tour-btn-new-session"
            onClick={onOpenNewSession}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-white hover:bg-neutral-100 active:bg-neutral-200 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nova Entrada</span>
            <span className="sm:hidden">Entrada</span>
          </button>

          {/* Interactive Tutorial Guia Trigger */}
          {onStartTour && (
            <button
              onClick={onStartTour}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 cursor-pointer transition-colors"
              title="Guia Tutorial do Sistema"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          {/* User Profile Avatar / Google Login */}
          {currentUser ? (
            <div className="relative group">
              <button
                onClick={onLogoutGoogle}
                className="w-8 h-8 rounded-full overflow-hidden border border-neutral-700 cursor-pointer transition-transform hover:scale-105"
                title={`Conectado como ${currentUser.displayName || currentUser.email} (Clique para sair)`}
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Avatar'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-800 text-white text-xs font-bold flex items-center justify-center">
                    {currentUser.email?.substring(0, 1).toUpperCase()}
                  </div>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginGoogle}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 cursor-pointer transition-colors"
              title="Conectar com o Google"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

