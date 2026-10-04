import React from 'react';
import { 
  Menu, 
  Plus, 
  ArrowDownLeft, 
  BarChart3, 
  Users 
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'entradas' | 'graficos' | 'pacientes';
  setActiveTab: (tab: 'entradas' | 'graficos' | 'pacientes') => void;
  onOpenMobileSidebar: () => void;
  onOpenNewSession: () => void;
  pendingCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenMobileSidebar,
  onOpenNewSession,
  pendingCount,
}) => {
  return (
    <>
      {/* Mobile Top Header (with Hamburger Trigger) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200 md:hidden">
        <div className="px-3.5 h-14 flex items-center justify-between">
          {/* Left: Expandable Menu Trigger + Title */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenMobileSidebar}
              className="p-2 text-neutral-700 hover:text-neutral-900 active:bg-neutral-100 rounded-lg cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center -ml-1"
              aria-label="Abrir menu lateral"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="text-base font-bold tracking-tight text-neutral-900">
              PsiFinanças
            </span>
          </div>

          {/* Right: Quick + Entrada CTA */}
          <button
            onClick={onOpenNewSession}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg transition-colors cursor-pointer min-h-[38px] shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Entrada</span>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation (Quick thumb access) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-3 h-14 items-center max-w-md mx-auto">
          {/* Tab 1: Entradas */}
          <button
            onClick={() => setActiveTab('entradas')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer transition-colors relative ${
              activeTab === 'entradas' ? 'text-neutral-900 font-semibold' : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <div className="relative">
              <ArrowDownLeft className={`w-5 h-5 ${activeTab === 'entradas' ? 'text-emerald-700' : ''}`} />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-amber-500 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Entradas</span>
            {activeTab === 'entradas' && (
              <span className="absolute bottom-1 w-1.5 h-1.5 bg-neutral-900 rounded-full" />
            )}
          </button>

          {/* Tab 2: Gráficos */}
          <button
            onClick={() => setActiveTab('graficos')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer transition-colors relative ${
              activeTab === 'graficos' ? 'text-neutral-900 font-semibold' : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <BarChart3 className={`w-5 h-5 ${activeTab === 'graficos' ? 'text-neutral-900' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Gráficos</span>
            {activeTab === 'graficos' && (
              <span className="absolute bottom-1 w-1.5 h-1.5 bg-neutral-900 rounded-full" />
            )}
          </button>

          {/* Tab 3: Pacientes */}
          <button
            onClick={() => setActiveTab('pacientes')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer transition-colors relative ${
              activeTab === 'pacientes' ? 'text-neutral-900 font-semibold' : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <Users className={`w-5 h-5 ${activeTab === 'pacientes' ? 'text-neutral-900' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Pacientes</span>
            {activeTab === 'pacientes' && (
              <span className="absolute bottom-1 w-1.5 h-1.5 bg-neutral-900 rounded-full" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};
