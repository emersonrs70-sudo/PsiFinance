import React from 'react';
import { ShieldAlert, Trash2, Sparkles, HelpCircle } from 'lucide-react';

interface DemoBannerProps {
  demoPatientCount: number;
  onOpenClearModal: () => void;
  onStartTour: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  demoPatientCount,
  onOpenClearModal,
  onStartTour,
}) => {
  return (
    <div 
      id="tour-demo-cleanup"
      className="bg-neutral-900 text-white rounded-3xl p-4 sm:p-5 border border-neutral-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 transition-all"
    >
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-neutral-700/80 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">
              Modo de Demonstração Ativo
            </span>
            <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-md font-mono">
              {demoPatientCount} pacientes de teste
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
            Estes dados são fictícios para você explorar relatórios e agenda. Quando quiser atender seus pacientes reais, limpe a base de exemplo com segurança.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onStartTour}
          className="py-2 px-3 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Ver Tutorial</span>
        </button>

        <button
          onClick={onOpenClearModal}
          className="py-2 px-3.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Limpar Dados de Exemplo</span>
        </button>
      </div>
    </div>
  );
};
