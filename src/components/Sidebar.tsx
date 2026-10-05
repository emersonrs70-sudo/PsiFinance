import React from 'react';
import { 
  LayoutDashboard,
  Calendar,
  ArrowDownLeft, 
  BarChart3, 
  Users, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Wallet,
  CloudCheck,
  LogIn,
  LogOut
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AppTab } from './Navbar';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isDesktopExpanded: boolean;
  setIsDesktopExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenNewSession: () => void;
  onOpenNewPatient: () => void;
  pendingCount: number;
  isCloudSyncing: boolean;
  currentUser: User | null;
  onLoginGoogle: () => void;
  onLogoutGoogle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  setIsMobileOpen,
  isDesktopExpanded,
  setIsDesktopExpanded,
  onOpenNewSession,
  onOpenNewPatient,
  pendingCount,
  isCloudSyncing,
  currentUser,
  onLoginGoogle,
  onLogoutGoogle,
}) => {
  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard Geral',
      shortLabel: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'agenda' as const,
      label: 'Agenda de Sessões',
      shortLabel: 'Agenda',
      icon: Calendar,
    },
    {
      id: 'entradas' as const,
      label: 'Transações & Sessões',
      shortLabel: 'Transações',
      icon: ArrowDownLeft,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'graficos' as const,
      label: 'Relatórios & Gráficos',
      shortLabel: 'Relatórios',
      icon: BarChart3,
    },
    {
      id: 'pacientes' as const,
      label: 'Registro de Pacientes',
      shortLabel: 'Pacientes',
      icon: Users,
    },
  ];

  const handleNavClick = (tab: AppTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* MOBILE DRAWER */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-neutral-950 text-white border-r border-neutral-800 flex flex-col transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center font-bold text-sm">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm text-white block leading-tight">
                PsiFinance
              </span>
              <span className="text-[10px] text-neutral-400 font-medium">
                Gestão Financeira Clínica
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 text-neutral-400 hover:text-white rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Sync Status Banner */}
        <div className="mx-3 mt-3 p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isCloudSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <div>
              <div className="font-semibold text-white text-[11px]">Nuvem Conectada</div>
              <div className="text-[10px] text-neutral-400">Google Cloud Firestore</div>
            </div>
          </div>
          <CloudCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>

        {/* Quick Actions in Mobile Drawer */}
        <div className="p-3 border-b border-neutral-800 space-y-2">
          <button
            onClick={() => {
              onOpenNewSession();
              setIsMobileOpen(false);
            }}
            className="w-full py-2.5 px-3 text-xs font-semibold text-neutral-950 bg-white hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 min-h-[42px] shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Entrada de Sessão</span>
          </button>

          <button
            onClick={() => {
              onOpenNewPatient();
              setIsMobileOpen(false);
            }}
            className="w-full py-2 px-3 text-xs font-semibold text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 min-h-[40px]"
          >
            <Plus className="w-4 h-4 text-neutral-400" />
            <span>Cadastrar Paciente</span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-3 py-1">
            Navegação
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[44px] ${
                  isActive
                    ? 'bg-white text-neutral-950 shadow-xs'
                    : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-neutral-950' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                    isActive ? 'bg-amber-500 text-white' : 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Account / Google Sync in Drawer */}
        <div className="p-3 border-t border-neutral-800">
          {currentUser ? (
            <div className="flex items-center justify-between p-2 bg-neutral-900 rounded-xl border border-neutral-800">
              <div className="flex items-center gap-2 min-w-0">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Usuário'}
                    className="w-7 h-7 rounded-full shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-neutral-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {currentUser.email?.substring(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {currentUser.displayName || 'Terapeuta'}
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate">
                    {currentUser.email}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogoutGoogle}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
                title="Desconectar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginGoogle}
              className="w-full py-2 px-3 text-xs font-medium text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-neutral-400" />
              <span>Conectar com Google</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
