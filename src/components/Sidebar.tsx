import React from 'react';
import { 
  ArrowDownLeft, 
  BarChart3, 
  Users, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Wallet,
  Cloud,
  CloudCheck,
  LogIn,
  LogOut
} from 'lucide-react';
import { User } from 'firebase/auth';

interface SidebarProps {
  activeTab: 'entradas' | 'graficos' | 'pacientes';
  setActiveTab: (tab: 'entradas' | 'graficos' | 'pacientes') => void;
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
      id: 'entradas' as const,
      label: 'Entradas & Sessões',
      shortLabel: 'Entradas',
      icon: ArrowDownLeft,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      id: 'graficos' as const,
      label: 'Gráficos & Comparativos',
      shortLabel: 'Gráficos',
      icon: BarChart3,
    },
    {
      id: 'pacientes' as const,
      label: 'Registro de Pacientes',
      shortLabel: 'Pacientes',
      icon: Users,
    },
  ];

  const handleNavClick = (tab: 'entradas' | 'graficos' | 'pacientes') => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* MOBILE DRAWER */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-neutral-200 flex flex-col transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-sm text-neutral-900 block leading-tight">
                PsiFinanças
              </span>
              <span className="text-[10px] text-neutral-500 font-medium">
                Gestão Financeira Clínica
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 text-neutral-400 hover:text-neutral-700 active:bg-neutral-100 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Sync Status Banner */}
        <div className="mx-3 mt-3 p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="font-semibold text-emerald-950 text-[11px]">Nuvem Conectada</div>
              <div className="text-[10px] text-emerald-700">Salvamento automático ativo</div>
            </div>
          </div>
          <CloudCheck className="w-4 h-4 text-emerald-700 shrink-0" />
        </div>

        {/* Quick Actions in Mobile Drawer */}
        <div className="p-3 border-b border-neutral-100 space-y-2">
          <button
            onClick={() => {
              onOpenNewSession();
              setIsMobileOpen(false);
            }}
            className="w-full py-2.5 px-3 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 min-h-[42px] shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Entrada de Sessão</span>
          </button>

          <button
            onClick={() => {
              onOpenNewPatient();
              setIsMobileOpen(false);
            }}
            className="w-full py-2 px-3 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 border border-neutral-200/80 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 min-h-[40px]"
          >
            <Plus className="w-4 h-4 text-neutral-500" />
            <span>Cadastrar Paciente</span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-3 py-1">
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
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-neutral-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                    isActive ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Account / Google Sync in Drawer */}
        <div className="p-3 border-t border-neutral-100">
          {currentUser ? (
            <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-xl">
              <div className="flex items-center gap-2 min-w-0">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Usuário'}
                    className="w-7 h-7 rounded-full shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {currentUser.email?.substring(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-neutral-900 truncate">
                    {currentUser.displayName || 'Terapeuta'}
                  </div>
                  <div className="text-[10px] text-neutral-500 truncate">
                    {currentUser.email}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogoutGoogle}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
                title="Desconectar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginGoogle}
              className="w-full py-2 px-3 text-xs font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-neutral-500" />
              <span>Conectar com Google</span>
            </button>
          )}
        </div>
      </aside>

      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-neutral-200 sticky top-0 h-screen transition-all duration-300 ease-in-out z-20 shrink-0 select-none ${
          isDesktopExpanded ? 'w-64' : 'w-16'
        }`}
      >
        {/* Desktop Header */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-neutral-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            {isDesktopExpanded && (
              <div className="min-w-0 animate-in fade-in duration-200">
                <span className="font-bold text-sm text-neutral-900 block truncate leading-tight">
                  PsiFinanças
                </span>
                <span className="text-[10px] text-neutral-500 font-medium block truncate">
                  Nuvem Ativa
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsDesktopExpanded((prev) => !prev)}
            className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
            title={isDesktopExpanded ? 'Recolher menu lateral' : 'Expandir menu lateral'}
          >
            {isDesktopExpanded ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Cloud Status Pill on Desktop */}
        {isDesktopExpanded ? (
          <div className="mx-3 mt-3 p-2 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-950">
                {isCloudSyncing ? 'Sincronizando...' : 'Nuvem Conectada'}
              </span>
            </div>
            <CloudCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          </div>
        ) : (
          <div className="my-2 flex justify-center" title="Nuvem Conectada">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        )}

        {/* Quick Action Button */}
        <div className="p-3 border-b border-neutral-100">
          {isDesktopExpanded ? (
            <button
              onClick={onOpenNewSession}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Entrada</span>
            </button>
          ) : (
            <button
              onClick={onOpenNewSession}
              className="w-10 h-10 mx-auto rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
              title="Nova Entrada de Sessão"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!isDesktopExpanded ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                } ${!isDesktopExpanded ? 'justify-center !px-0' : ''}`}
              >
                <div className="relative shrink-0">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-neutral-500'}`} />
                  {item.badge !== undefined && !isDesktopExpanded && (
                    <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 bg-amber-500 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>

                {isDesktopExpanded && (
                  <span className="truncate flex-1 text-left animate-in fade-in duration-200">
                    {item.shortLabel}
                  </span>
                )}

                {isDesktopExpanded && item.badge !== undefined && (
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                    isActive ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Account / Google Sync */}
        <div className="p-3 border-t border-neutral-100">
          {isDesktopExpanded ? (
            currentUser ? (
              <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-xl">
                <div className="flex items-center gap-2 min-w-0">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Usuário'}
                      className="w-7 h-7 rounded-full shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {currentUser.email?.substring(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-neutral-900 truncate">
                      {currentUser.displayName || 'Terapeuta'}
                    </div>
                    <div className="text-[10px] text-neutral-500 truncate">
                      {currentUser.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onLogoutGoogle}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
                  title="Desconectar"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginGoogle}
                className="w-full py-1.5 px-3 text-xs font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-neutral-500" />
                <span>Conta Google</span>
              </button>
            )
          ) : (
            <button
              onClick={currentUser ? onLogoutGoogle : onLoginGoogle}
              className="w-10 h-10 mx-auto rounded-lg text-neutral-600 hover:bg-neutral-100 flex items-center justify-center cursor-pointer"
              title={currentUser ? `Conectado como ${currentUser.email} (Clique para sair)` : 'Conectar com Google'}
            >
              {currentUser ? <LogOut className="w-4 h-4 text-emerald-700" /> : <LogIn className="w-4 h-4" />}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
